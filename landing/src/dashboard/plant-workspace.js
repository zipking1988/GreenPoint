import { createId } from '../shared/id.js';
import { requestForScenario } from '../plantAgentDemo.js';

export const ENTRY_LIMIT = 30;
export const PLANT_LIMIT = 12;
export const PHOTO_LIMIT = 8 * 1024 * 1024;
export const SOIL_CHOICES = [
  { value: 'dry', label: 'Feels dry' },
  { value: 'damp', label: 'Feels damp' },
  { value: 'unknown', label: 'Not checked' },
];

export function createWorkspace() {
  return {
    id: createId(), revision: 0, savedRevision: 0,
    plants: [{
      id: 'milo-tomato-example', name: 'Milo', species: 'Tomato', location: 'Illustrative garden',
      mode: 'scripted_demo', createdAt: new Date().toISOString(), events: [], total: 0,
      image: { url: '/assets/plant-agent-milo.webp', source: 'ai_generated_illustration', width: 1122, height: 1402 },
    }],
  };
}

export function makePlant({ name, species = '', location = '', image = null }) {
  if (!name.trim()) throw new Error('Give your plant a name.');
  return {
    id: createId(), name: name.trim().slice(0, 60), species: species.trim().slice(0, 60),
    location: location.trim().slice(0, 80), mode: 'manual_journal',
    createdAt: new Date().toISOString(), image, events: [], total: 0,
  };
}

export function addPlant(workspace, plant) {
  if (workspace.plants.length >= PLANT_LIMIT) throw new Error('This tab holds up to 12 plants. Export your journal before starting a new tab.');
  return { ...workspace, revision: workspace.revision + 1, plants: [...workspace.plants, plant] };
}

export function recordObservation(workspace, id, { soil, note }, at = new Date().toISOString()) {
  if (!SOIL_CHOICES.some(choice => choice.value === soil)) throw new Error('Choose a soil observation.');
  if (!workspace.plants.some(plant => plant.id === id)) throw new Error('Choose a plant first.');
  return {
    ...workspace, revision: workspace.revision + 1,
    plants: workspace.plants.map(plant => plant.id !== id ? plant : {
      ...plant, total: plant.total + 1,
      events: [...plant.events, {
        id: createId(), plant_id: id, at, soil, note: note.trim().slice(0, 1000),
        source: plant.mode === 'scripted_demo' ? 'visitor_selected_simulation' : 'human_entered_observation',
      }].slice(-ENTRY_LIMIT),
    }),
  };
}

export function plantRequest(plant) {
  if (plant.mode === 'scripted_demo') return requestForScenario(plant.events.at(-1)?.soil);
  return {
    title: plant.total ? 'Your context, kept together.' : 'Start with what you can observe.',
    body: 'Record a soil check and what you notice. This manual journal keeps your observations together; an AI has not assessed this plant or recommended care.',
    status: plant.total ? 'Human observation recorded' : 'Ready for your first observation',
  };
}

export function workspaceExport(workspace, exportedAt = new Date().toISOString()) {
  return {
    schema_version: 'greenpoint.plant-workspace.v1', session_id: workspace.id,
    revision: workspace.revision, exported_at: exportedAt,
    storage: 'current_tab_only', model_called: false, sensor_readings: false, treatment_authorized: false,
    events_retention_limit_per_plant: ENTRY_LIMIT,
    photo_policy: 'User photos are resized JPEG copies, embedded below. Original files are not retained.',
    plants: workspace.plants.map(plant => ({
      ...plant, identity_source: plant.mode === 'scripted_demo' ? 'authored_example_not_tracking' : 'human_assigned_not_tracking',
      request: plantRequest(plant), total_observations: plant.total, retained_observations: plant.events.length,
    })),
  };
}

export function confirmWorkspaceExport(workspace, revision) {
  return revision === workspace.revision ? { ...workspace, savedRevision: revision } : workspace;
}

export function workspaceView(search) {
  const view = new URLSearchParams(search).get('view');
  return view === 'video' || view === 'map' ? view : 'plants';
}

export async function readPlantPhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPEG, PNG or WebP photo.');
  if (file.size > PHOTO_LIMIT) throw new Error('Choose a photo smaller than 8 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = () => reject(new Error('This photo could not be read. Try another image.'));
      node.src = url;
    });
    const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return {
      url: canvas.toDataURL('image/jpeg', 0.85), source: 'user_supplied_photo_not_analyzed',
      fileName: file.name, originalWidth: image.naturalWidth, originalHeight: image.naturalHeight,
      width: canvas.width, height: canvas.height,
    };
  } finally { URL.revokeObjectURL(url); }
}
