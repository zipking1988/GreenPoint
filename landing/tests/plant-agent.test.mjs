import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS, requestForScenario, scenarioEvent, journalExport } from '../src/plantAgentDemo.js';

test('all scenarios keep human follow-up pending rather than authorize care', () => {
  for (const value of [undefined, ...SCENARIOS.map(item => item.value)]) {
    assert.equal(requestForScenario(value).pending, true);
  }
  assert.match(requestForScenario('unknown').status, /waiting/);
  assert.notEqual(requestForScenario('dry').body, requestForScenario('damp').body);
});

test('a scenario is labeled as a simulation, preserving event identity and time', () => {
  const event = scenarioEvent('damp', 17, '2026-10-31T04:00:00.000Z');
  assert.equal(event.source, 'visitor_selected_simulation');
  assert.equal(event.soil_scenario, 'damp');
  assert.equal(event.id, 'scenario-17');
  assert.equal(event.at, '2026-10-31T04:00:00.000Z');
  assert.throws(() => scenarioEvent('', 1, ''), /Choose/);
  assert.throws(() => scenarioEvent('sensor-measured', 1, ''), /Choose/);
});

test('export keeps latest context, session identity and explicit non-live provenance', () => {
  const events = [scenarioEvent('dry', 1, 'first'), scenarioEvent('unknown', 2, 'second')];
  const exported = JSON.parse(JSON.stringify(journalExport({ id: 'demo-session', events, total: 2 }, 'export-time')));
  assert.equal(exported.session_id, 'demo-session');
  assert.equal(exported.mode, 'scripted_illustrative_concept');
  assert.equal(exported.plant.identity_source, 'authored_example_not_tracking');
  assert.equal(exported.image.source, 'ai_generated_illustration');
  assert.deepEqual(exported.events, events);
  assert.equal(exported.request.status, 'Still waiting for an observation');
  assert.equal(exported.request.pending, true);
  assert.equal(exported.model_called, false);
  assert.equal(exported.sensor_readings, false);
  assert.equal(exported.treatment_authorized, false);
  assert.equal(exported.exported_at, 'export-time');
});

test('initial export has no fabricated events or soil measurements', () => {
  const exported = journalExport({ id: 'new-session', events: [], total: 0 }, 'now');
  assert.deepEqual(exported.events, []);
  assert.equal(exported.retained_events, 0);
  assert.equal(exported.total_scenarios_recorded, 0);
  assert.equal(exported.request.title, 'Could you check my soil?');
});
