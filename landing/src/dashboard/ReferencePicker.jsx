import { useState } from 'react';
import { Modal } from './Modal.jsx';

export function ReferencePicker({ request, onChoose, PlantCrop }) {
  const [id, setId] = useState(request.plants[0]?.id ?? '');
  const plant = request.plants.find(p => p.id === id);
  return <Modal title="Show us your planted crop." onClose={() => onChoose(null)}>
    <p className="gp-dialog-intro">Optional: choose one {request.target.crop} plant you recognize. Muse will compare its visible leaves with each candidate.</p>
    <p className="gp-form-error">Experimental comparison: our development test found more crop-as-weed errors with a reference. Skip it for the baseline pipeline. Every label still needs your review.</p>
    <label className="gp-reference-select">Known crop candidate<select value={id} onChange={event => setId(event.target.value)}>{request.plants.map(p => <option key={p.id}>{p.id}</option>)}</select></label>
    {plant && <div className="gp-reference-preview"><PlantCrop image={request.target.frames[plant.bestFrame].image} box={plant.box} alt={`${plant.id}, proposed crop reference`} /><p>{plant.id} · Source frame {plant.bestFrame + 1}<br />Choose only a plant you know is the planted crop. This is your input, not a model prediction.</p></div>}
    <div className="gp-dialog-actions"><button className="gp-text-button" onClick={() => onChoose(null)}>I’m not sure — skip reference</button><button className="gp-button gp-button-primary" disabled={!plant} onClick={() => onChoose(plant)}>I recognize this as {request.target.crop}</button></div>
  </Modal>;
}

export function NativeTrackingOption({ checked, onChange, disabled }) {
  return <label className="gp-native-option"><input type="checkbox" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} /><span><strong>Use SAM native video tracking</strong><small>{checked ? 'The complete selected clip will be sent to Meta. H.264 MP4 · ≤6 seconds · ≤2 MB · ≤1280 px · ≤30 fps. No automatic fallback.' : 'Default: send up to 12 sampled frames. The original clip stays in this tab.'}</small></span></label>;
}
