import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  constrainView,
  fitImage,
  pointInPolygon,
  projectBox,
  zoomView,
} from '../src/dashboard/map-geometry.js';
import {
  FIELD_BOUNDARY,
  UNOBSERVED,
  REVIEW_STORAGE,
  ZONES,
  nextUnreviewed,
  restoreSurvey,
  surveyPlants,
} from '../src/dashboard/survey-data.js';
import { csvText } from '../src/dashboard/data.js';
const viewport = { width: 980, height: 840 },
  image = { width: 1355, height: 1161 };
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} differs from ${b}`);

test('fit exposes the whole image rather than cropping away a field edge', () => {
  const view = fitImage(viewport, image);
  assert.ok(view.x >= 0 && view.y >= 0);
  assert.ok(view.x + image.width * view.scale <= viewport.width + 1e-8);
  assert.ok(view.y + image.height * view.scale <= viewport.height + 1e-8);
});
test('pointer-anchored zoom preserves the same source pixel under the cursor', () => {
  const fit = fitImage(viewport, image),
    start = { ...fit, zoom: 1 },
    pointer = { x: 470, y: 405 };
  const next = zoomView(start, 2, pointer, viewport, image);
  near((pointer.x - start.x) / start.scale, (pointer.x - next.x) / next.scale);
  near((pointer.y - start.y) / start.scale, (pointer.y - next.y) / next.scale);
});
test('pan limits prevent losing the map; resize resets a fitted image to the new center', () => {
  const extreme = constrainView({ zoom: 3, x: 10000, y: -10000 }, viewport, image);
  assert.equal(extreme.x, 0);
  near(extreme.y, viewport.height - image.height * extreme.scale);
  const resized = constrainView({ zoom: 1, x: 500, y: 500 }, { width: 360, height: 440 }, image);
  assert.ok(resized.x >= 0 && resized.y >= 0);
  assert.ok(resized.x + image.width * resized.scale <= 360 + 1e-8);
});
test('projected source box and plant center move together through zoom and pan', () => {
  const plant = surveyPlants()[6],
    transform = constrainView({ zoom: 2, x: -300, y: -200 }, viewport, image);
  const box = projectBox(plant.box, transform, image);
  near(
    box.x + box.width / 2,
    transform.x + (plant.box[0] + plant.box[2] / 2) * image.width * transform.scale,
  );
  near(
    box.y + box.height / 2,
    transform.y + (plant.box[1] + plant.box[3] / 2) * image.height * transform.scale,
  );
});
test('example evidence stays inside the field and outside unobserved space, with unique region membership', () => {
  const plants = surveyPlants();
  assert.equal(plants.length, 12);
  for (const plant of plants) {
    const [x, y, w, h] = plant.box,
      center = [x + w / 2, y + h / 2];
    assert.ok(x >= 0 && y >= 0 && x + w <= 1 && y + h <= 1);
    assert.equal(pointInPolygon(center, FIELD_BOUNDARY), true, plant.id);
    assert.equal(pointInPolygon(center, UNOBSERVED), false, plant.id);
    assert.equal(ZONES.filter((zone) => zone.plants.includes(plant.id)).length, 1);
    assert.equal(
      pointInPolygon(center, ZONES.find((zone) => zone.id === plant.zone).polygon),
      true,
      plant.id,
    );
    assert.equal(ZONES.find((zone) => zone.id === plant.zone).plants.includes(plant.id), true);
  }
});
test('review storage ignores malformed edits and keeps original labels separate from decisions', () => {
  const restored = restoreSurvey({
    getItem: (key) => {
      assert.equal(key, REVIEW_STORAGE);
      return JSON.stringify({
        'GP-007': { label: 'weed', reviewed: true },
        'GP-001': { label: 'unknown', reviewed: true },
      });
    },
  });
  assert.equal(restored[6].label, 'weed');
  assert.equal(restored[6].originalLabel, 'uncertain');
  assert.equal(restored[6].reviewed, true);
  assert.equal(restored[0].label, 'crop');
  assert.equal(restored[0].reviewed, false);
  assert.deepEqual(restoreSurvey({ getItem: () => '{broken' }), surveyPlants());
});
test('saving an uncertain decision can complete review; next skips reviewed candidates and ends', () => {
  const plants = surveyPlants().map((plant) => ({ ...plant, reviewed: true }));
  assert.equal(nextUnreviewed(plants, 'GP-007'), null);
  plants[11].reviewed = false;
  assert.equal(nextUnreviewed(plants, 'GP-007'), 'GP-012');
  plants[11].reviewed = true;
  plants[0].reviewed = false;
  assert.equal(nextUnreviewed(plants, 'GP-012'), 'GP-001');
});
test('map CSV retains illustrative provenance and image coordinates without GPS claims', () => {
  const text = csvText({ mode: 'illustrative-map', plants: surveyPlants() });
  assert.ok(text.includes('illustrative-map'));
  assert.ok(text.includes('x_normalized'));
  assert.ok(!text.includes('latitude'));
  assert.ok(!text.includes('longitude'));
  assert.ok(text.includes('GP-007'));
  assert.ok(text.includes('uncertain'));
  const [header, row] = text.replace(/^\uFEFF/, '').split('\r\n').map(line => [...line.matchAll(/"((?:[^"]|"")*)"/g)].map(match => match[1].replaceAll('""', '"')));
  assert.equal(row[header.indexOf('source')], 'illustrative-map');
  assert.equal(row[header.indexOf('model_ids')], '', 'Illustrative map records must not claim a model.');
});
