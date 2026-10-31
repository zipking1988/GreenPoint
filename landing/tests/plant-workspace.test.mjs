import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addPlant, confirmWorkspaceExport, createWorkspace, ENTRY_LIMIT, makePlant,
  plantRequest, PLANT_LIMIT, readPlantPhoto, recordObservation, workspaceExport, workspaceView,
} from '../src/dashboard/plant-workspace.js';

test('plant observations stay isolated and preserve demo versus manual provenance', () => {
  const initial = createWorkspace();
  const named = makePlant({ name: '  Balcony tomato  ', species: 'Tomato' });
  const withPlant = addPlant(initial, named);
  const observed = recordObservation(withPlant, named.id, { soil: 'damp', note: '  Leaves look unchanged. ' }, '2026-10-31T10:00:00Z');
  assert.equal(observed.plants[0].total, 0);
  assert.equal(withPlant.plants[1].total, 0);
  assert.equal(observed.plants[1].name, 'Balcony tomato');
  assert.deepEqual(observed.plants[1].events[0], {
    id: observed.plants[1].events[0].id, plant_id: named.id, at: '2026-10-31T10:00:00Z',
    soil: 'damp', note: 'Leaves look unchanged.', source: 'human_entered_observation',
  });
  const demo = recordObservation(observed, initial.plants[0].id, { soil: 'dry', note: '' });
  assert.equal(demo.plants[0].events[0].source, 'visitor_selected_simulation');
  assert.match(plantRequest(demo.plants[0]).title, /more context/);
  assert.match(plantRequest(demo.plants[1]).body, /manual journal/);
  assert.equal(initial.revision, 0);
});

test('not checked remains unknown and invalid observations cannot create records', () => {
  const initial = createWorkspace();
  const next = recordObservation(initial, initial.plants[0].id, { soil: 'unknown', note: '' });
  assert.equal(next.plants[0].events[0].soil, 'unknown');
  assert.equal(plantRequest(next.plants[0]).status, 'Still waiting for an observation');
  assert.throws(() => recordObservation(next, next.plants[0].id, { soil: '', note: '' }), /Choose a soil/);
  assert.throws(() => recordObservation(next, 'missing', { soil: 'dry', note: '' }), /Choose a plant/);
  assert.throws(() => makePlant({ name: '   ' }), /name/);
});

test('retention and profile limits bound tab memory without misreporting history', () => {
  let state = createWorkspace();
  const id = state.plants[0].id;
  for (let index = 0; index < ENTRY_LIMIT + 4; index++) state = recordObservation(state, id, { soil: 'unknown', note: `${index}` });
  assert.equal(state.plants[0].total, ENTRY_LIMIT + 4);
  assert.equal(state.plants[0].events.length, ENTRY_LIMIT);
  assert.equal(state.plants[0].events[0].note, '4');
  assert.equal(new Set(state.plants[0].events.map(event => event.id)).size, ENTRY_LIMIT);
  while (state.plants.length < PLANT_LIMIT) state = addPlant(state, makePlant({ name: 'Plant' }));
  assert.throws(() => addPlant(state, makePlant({ name: 'Excess' })), /12 plants/);
});

test('JSON keeps identity, reduced image, unknown context, source and non-actuation flags', () => {
  let state = createWorkspace();
  const own = makePlant({ name: '=NOT_A_FORMULA', image: { url: 'data:image/jpeg;base64,test', source: 'user_supplied_photo_not_analyzed', originalWidth: 2400, width: 1200 } });
  state = addPlant(state, own);
  state = recordObservation(state, own.id, { soil: 'unknown', note: '<script>text only</script>' });
  const exported = JSON.parse(JSON.stringify(workspaceExport(state, '2026-10-31T12:00:00Z')));
  assert.equal(exported.session_id, state.id);
  assert.equal(exported.revision, 2);
  assert.equal(exported.model_called, false);
  assert.equal(exported.sensor_readings, false);
  assert.equal(exported.treatment_authorized, false);
  assert.equal(exported.plants[0].identity_source, 'authored_example_not_tracking');
  assert.equal(exported.plants[1].identity_source, 'human_assigned_not_tracking');
  assert.equal(exported.plants[1].image.url, own.image.url);
  assert.equal(exported.plants[1].events[0].soil, 'unknown');
  assert.equal(exported.plants[1].events[0].note, '<script>text only</script>');
  assert.match(exported.photo_policy, /Original files are not retained/);
});

test('saved confirmation applies only to the exact exported revision', () => {
  let state = createWorkspace();
  state = recordObservation(state, state.plants[0].id, { soil: 'dry', note: '' });
  const snapshot = state.revision;
  const modified = recordObservation(state, state.plants[0].id, { soil: 'damp', note: '' });
  assert.equal(confirmWorkspaceExport(modified, snapshot), modified);
  assert.notEqual(modified.revision, modified.savedRevision);
  const saved = confirmWorkspaceExport(modified, modified.revision);
  assert.equal(saved.savedRevision, saved.revision);
  const changed = recordObservation(saved, saved.plants[0].id, { soil: 'unknown', note: '' });
  assert.notEqual(changed.savedRevision, changed.revision);
});

test('default plants and explicit legacy views remain routable', () => {
  assert.equal(workspaceView(''), 'plants');
  assert.equal(workspaceView('?view=map'), 'map');
  assert.equal(workspaceView('?view=video&upload=1'), 'video');
  assert.equal(workspaceView('?view=unknown'), 'plants');
});

test('unsupported and oversized photos fail before any browser decoding', async () => {
  await assert.rejects(readPlantPhoto({ type: 'image/svg+xml', size: 10 }), /JPEG, PNG or WebP/);
  await assert.rejects(readPlantPhoto({ type: 'image/jpeg', size: 8 * 1024 * 1024 + 1 }), /smaller than 8 MB/);
});
