import { useEffect, useRef, useState } from 'react';
import { Leaf } from '@phosphor-icons/react/dist/csr/Leaf';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { FilmStrip } from '@phosphor-icons/react/dist/csr/FilmStrip';
import { MapTrifold } from '@phosphor-icons/react/dist/csr/MapTrifold';
import { GearSix } from '@phosphor-icons/react/dist/csr/GearSix';
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { Check } from '@phosphor-icons/react/dist/csr/Check';
import { Drop } from '@phosphor-icons/react/dist/csr/Drop';
import { Image as ImageIcon } from '@phosphor-icons/react/dist/csr/Image';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { MeasuredCopy } from '../MeasuredCopy.jsx';
import { Modal } from './Modal.jsx';
import { Connections } from './Connections.jsx';
import { downloadFile } from './data.js';
import {
  addPlant, confirmWorkspaceExport, createWorkspace, ENTRY_LIMIT, makePlant, plantRequest,
  PLANT_LIMIT, readPlantPhoto, recordObservation, SOIL_CHOICES, workspaceExport,
} from './plant-workspace.js';
import './plant-workspace.css';

const soilText = { dry: 'Feels dry', damp: 'Feels damp', unknown: 'Not checked' };
const formatDate = value => new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function AddPlant({ onAdd }) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [location, setLocation] = useState('');
  const [photo, setPhoto] = useState(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const serial = useRef(0);
  useEffect(() => () => { serial.current += 1; }, []);
  async function readPhoto(file) {
    const current = ++serial.current;
    setReading(true); setError(''); setPhoto(null);
    try {
      const image = await readPlantPhoto(file);
      if (serial.current === current) setPhoto(image);
    } catch (error) {
      if (serial.current === current) setError(error.message);
    } finally { if (serial.current === current) setReading(false); }
  }
  return <form className="pw-add-form" onSubmit={event => {
    event.preventDefault();
    try { onAdd(makePlant({ name, species, location, image: photo })); }
    catch (error) { setError(error.message); }
  }}>
    <p>A place for your observations. No AI assessment or care automation.</p>
    <fieldset disabled={reading}>
      <label>Plant name<input value={name} onChange={event => setName(event.target.value)} maxLength={60} required autoComplete="off" placeholder="e.g. Balcony tomato" /></label>
      <div className="pw-form-pair">
        <label>Plant type <span>(optional)</span><input value={species} onChange={event => setSpecies(event.target.value)} maxLength={60} placeholder="e.g. Tomato" /></label>
        <label>Location <span>(optional)</span><input value={location} onChange={event => setLocation(event.target.value)} maxLength={80} placeholder="e.g. Kitchen window" /></label>
      </div>
    </fieldset>
    <label className="pw-file-label">Plant photo <span>(optional)</span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={reading} onChange={event => { const file = event.target.files?.[0]; if (file) readPhoto(file); event.target.value = ''; }} /><small>JPEG, PNG or WebP · up to 8 MB · saved as a smaller copy</small></label>
    {reading && <p role="status">Reading your photo…</p>}
    {photo && <div className="pw-photo-preview"><img src={photo.url} alt="Your selected plant photo" /><span>{photo.fileName}<br />{photo.width} × {photo.height} px · not analyzed</span><button type="button" className="pw-text" onClick={() => setPhoto(null)}>Remove photo</button></div>}
    {error && <p className="pw-error" role="alert">{error}</p>}
    <p className="pw-local-note">Kept in this tab only. Export to keep the journal and photo before leaving.</p>
    <button className="pw-primary" type="submit" disabled={reading}>Add plant<ArrowRight aria-hidden="true" /></button>
  </form>;
}

function ObservationForm({ plant, onRecord }) {
  const [soil, setSoil] = useState('');
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [feedback, setFeedback] = useState('');
  const demo = plant.mode === 'scripted_demo';
  return <form className="pw-observation" onSubmit={event => {
    event.preventDefault();
    onRecord({ soil, note });
    setNote('');
    setShowNote(false);
    setFeedback(`Entry ${plant.total + 1} recorded for ${plant.name}. ${demo ? 'Scripted follow-up updated.' : 'Your observation was added to the journal.'}`);
  }}>
    <fieldset>
      <legend>{demo ? 'Imagine checking the soil.' : 'What does the soil feel like?'}</legend>
      <div className="pw-soil-choices">
        {SOIL_CHOICES.map(choice => <label key={choice.value} className={soil === choice.value ? 'is-selected' : ''}>
          <input type="radio" required name={`soil-${plant.id}`} value={choice.value} checked={soil === choice.value} onChange={event => setSoil(event.target.value)} />
          <span>{choice.label}</span><Check size={16} aria-hidden="true" />
        </label>)}
      </div>
    </fieldset>
    <button type="button" className="pw-note-toggle" aria-expanded={showNote} aria-controls={`note-${plant.id}`} onClick={() => setShowNote(value => !value)}><Plus size={17} aria-hidden="true" />{note ? 'Edit note draft' : 'Add a note (optional)'}</button>
    <div id={`note-${plant.id}`} className={`pw-note-body ${showNote ? 'is-open' : ''}`}><label className="pw-note-label">{demo ? 'Scenario note' : 'Your observation'} <span>(optional)</span>
      <textarea value={note} onChange={event => setNote(event.target.value)} maxLength={1000} rows={2} placeholder={demo ? 'Imagine what you might notice about Milo…' : 'What did you notice about your plant?'} />
    </label></div>
    <button className="pw-primary" type="submit">Record observation<ArrowRight aria-hidden="true" /></button>
    <p className="pw-feedback" role="status">{feedback || (demo ? 'An imagined check. No care action is performed.' : 'Recorded by you. Care stays in your hands.')}</p>
  </form>;
}

function SourcePhoto({ plant, compact = false }) {
  const demo = plant.mode === 'scripted_demo';
  return <figure className={`pw-source ${compact ? 'pw-source-compact' : ''}`}>
    {plant.image ? <img src={plant.image.url} alt={demo ? 'Generated portrait of Milo, a fictional tomato plant in a terracotta pot' : `${plant.name}, photo supplied by you; not analyzed`} width={plant.image.width} height={plant.image.height} /> : <div className="pw-no-photo"><ImageIcon size={36} /><span>No photo added</span><p>You can still record observations.</p></div>}
    <figcaption><span><ImageIcon size={16} aria-hidden="true" />{demo ? 'Generated illustration' : plant.image ? 'Your photo · not analyzed' : 'Manual journal'}</span><span>{demo ? 'Fictional plant' : 'This tab only'}</span></figcaption>
  </figure>;
}

function Journal({ plant, onObserve, preview = false }) {
  const events = [...plant.events].reverse();
  const shown = preview ? events.slice(0, 1) : events;
  return <section className={`pw-journal ${preview ? 'pw-journal-preview' : ''}`} aria-labelledby={preview ? 'pw-recent-title' : 'pw-journal-title'}>
    <div className="pw-section-head"><h2 id={preview ? 'pw-recent-title' : 'pw-journal-title'}>{preview ? 'Latest entry' : 'Observation journal'}</h2><span>{plant.total > ENTRY_LIMIT ? `Latest ${ENTRY_LIMIT} of ${plant.total}` : `${plant.total} ${plant.total === 1 ? 'entry' : 'entries'}`}</span></div>
    {!plant.total ? <div className="pw-journal-empty"><span>START</span><div><h3>{plant.mode === 'scripted_demo' ? 'One plant. An open question.' : 'Your plant’s story starts here.'}</h3><p>{plant.mode === 'scripted_demo' ? 'Milo is an authored example. Try a soil scenario to add the first entry.' : 'Record a soil check or a note to add the first entry.'}</p></div>{!preview && <button className="pw-text" onClick={onObserve}>Record an observation<ArrowRight size={18} /></button>}</div> : <ol aria-label={`${plant.name} observations`}>{shown.map(event => <li key={event.id}>
      <time dateTime={event.at}>{formatDate(event.at)}</time>
      <div><h3>{soilText[event.soil]}<span>{event.source === 'visitor_selected_simulation' ? 'Imagined observation' : 'Your observation'}</span></h3>{event.note && <p>{event.note}</p>}{event.soil === 'unknown' && <p>Soil context remains unknown.</p>}</div>
    </li>)}</ol>}
  </section>;
}

function Evidence({ plant, onVideo }) {
  const demo = plant.mode === 'scripted_demo';
  return <section className="pw-evidence" aria-labelledby="pw-evidence-title">
    <div className="pw-evidence-copy"><h2 id="pw-evidence-title">What this record is based on.</h2><MeasuredCopy>{demo ? 'An assigned example identity, a generated portrait and your imagined observations. No model or sensor has assessed Milo.' : 'A name you assigned, your optional photo and the observations you entered. Identity and plant type are supplied by you, not verified by a model.'}</MeasuredCopy>
      <dl><div><dt>Plant identity</dt><dd>{demo ? 'Authored example' : 'Assigned by you'}</dd></div><div><dt>Image source</dt><dd>{demo ? 'AI-generated illustration' : plant.image ? 'Photo supplied by you' : 'No photo'}</dd></div><div><dt>Soil context</dt><dd>{soilText[plant.events.at(-1)?.soil] || 'Not checked'}{demo && plant.total ? ' · imagined' : ''}</dd></div><div><dt>AI assessment</dt><dd>Not connected</dd></div><div><dt>Memory</dt><dd>This tab · latest 30 entries per plant</dd></div></dl>
      <p className="pw-evidence-limit">A photo alone cannot establish what care a plant needs.</p>
      <a className="pw-source-link" href="https://yardandgarden.extension.iastate.edu/faq/why-my-houseplant-wilting" target="_blank" rel="noreferrer">Why growing context matters<ArrowUpRight size={17} /></a>
      <div className="pw-lab-note"><h3>Looking for video analysis?</h3><p>The perception lab reviews plant candidates from short clips. It does not create a plant agent or assess this journal.</p><button className="pw-text" onClick={() => onVideo(false)}>Open video lab<ArrowRight size={18} /></button></div>
    </div><SourcePhoto plant={plant} />
  </section>;
}

export default function PlantWorkspace({ active = true, onVideo, onMap, provider, setAccessCode, onCheck }) {
  const [workspace, setWorkspace] = useState(createWorkspace);
  const [selected, setSelected] = useState('milo-tomato-example');
  const [section, setSection] = useState('request');
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState('');
  const [exportRevision, setExportRevision] = useState(null);
  const heading = useRef(null);
  const plant = workspace.plants.find(item => item.id === selected) ?? workspace.plants[0];
  const demo = plant.mode === 'scripted_demo';
  const request = plantRequest(plant);
  const dirty = workspace.revision !== workspace.savedRevision;
  useEffect(() => {
    if (!active) setModal(null);
  }, [active]);
  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function selectPlant(id) {
    setSelected(id); setSection('request'); setNotice('');
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  }
  function exportJournal() {
    downloadFile(JSON.stringify(workspaceExport(workspace), null, 2) + '\n', 'greenpoint-plant-workspace.json', 'application/json');
    setExportRevision(workspace.revision); setNotice('');
  }
  return <div className="gp-dashboard pw-dashboard">
    <a className="gp-skip" href="#pw-main">Skip to plant workspace</a>
    <aside className="pw-sidebar" aria-label="Plants and workspace tools">
      <a className="pw-brand" href="/" aria-label="GreenPoint home">Green<span>Point</span><Leaf size={18} weight="fill" /></a>
      <div className="pw-plant-list"><h2>My plants<span>{workspace.plants.length}</span></h2><div className="pw-plant-buttons">{workspace.plants.map(item => <button key={item.id} className={plant.id === item.id ? 'is-selected' : ''} aria-pressed={plant.id === item.id} onClick={() => selectPlant(item.id)}>
        {item.image ? <img src={item.image.url} alt="" /> : <Leaf size={24} aria-hidden="true" />}<span><strong>{item.name}</strong><span>{item.mode === 'scripted_demo' ? 'Tomato · demo' : item.species || 'Your plant'}</span></span>
      </button>)}</div><button className="pw-add-quiet" onClick={() => setModal('add')} disabled={workspace.plants.length >= PLANT_LIMIT}><Plus size={19} />Add plant</button>{workspace.plants.length >= PLANT_LIMIT && <p className="pw-limit">12-plant tab limit. Export before starting a fresh tab.</p>}</div>
      <nav className="pw-tools" aria-label="Workspace tools"><button onClick={() => onVideo(false)}><FilmStrip size={21} />Video lab<ArrowUpRight size={15} /></button><button onClick={onMap}><MapTrifold size={21} />Field map<ArrowUpRight size={15} /></button><button onClick={() => setModal('connections')}><GearSix size={21} />Connections</button></nav>
      <div className="pw-sidebar-foot"><span className="pw-status-dot" />Research prototype<p>Local records. Human care.</p><a href="/">About GreenPoint<ArrowUpRight size={14} /></a></div>
    </aside>

    <main id="pw-main" className="pw-main">
      <header className="pw-topbar"><span>Plant workspace</span><div><button className="pw-export" onClick={exportJournal}><DownloadSimple size={18} /><span>Export journal</span></button><button className="pw-primary pw-add-top" onClick={() => setModal('add')} disabled={workspace.plants.length >= PLANT_LIMIT}><Plus size={19} />Add plant</button></div></header>
      <div className="pw-content">
        <div className="pw-plant-heading"><div><h1 ref={heading} tabIndex={-1}>{plant.name}</h1><p>{plant.species || 'Plant type not specified'}{plant.location && <span> / {plant.location}</span>}</p></div><span className="pw-mode">{demo ? 'Scripted demo' : 'Manual journal'}</span></div>
        <nav className="pw-sections" aria-label="Plant record sections">{['request', 'journal', 'evidence'].map(value => <button key={value} aria-label={value === 'request' ? 'Overview' : value === 'journal' ? `Journal (${plant.events.length} ${plant.events.length === 1 ? 'entry' : 'entries'})` : 'Evidence'} aria-pressed={section === value} className={section === value ? 'is-selected' : ''} onClick={() => setSection(value)}>{value === 'request' ? 'Overview' : value === 'journal' ? 'Journal' : 'Evidence'}{value === 'journal' && plant.total > 0 && <span>{plant.events.length}</span>}</button>)}<span>This tab only{dirty ? ' · not exported' : ''}</span></nav>
        {notice && <div className="pw-notice" role="status"><Check size={18} /><span>{notice}</span><button aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={18} /></button></div>}
        {exportRevision != null && <div className="pw-export-notice"><p role="status">{exportRevision === workspace.revision ? 'Download started. Check that your JSON file was saved.' : 'Your journal changed after this download. Export again to keep the latest records.'}</p>{exportRevision === workspace.revision && <button className="pw-text" onClick={() => { setWorkspace(current => confirmWorkspaceExport(current, exportRevision)); setExportRevision(null); setNotice('Export confirmed. New observations will need a new export.'); }}><Check size={17} />I saved the file</button>}<button className="pw-dismiss" aria-label="Dismiss export confirmation" onClick={() => setExportRevision(null)}><X size={18} /></button></div>}
        {section === 'request' && <>
          <div className="pw-request-layout"><div className="pw-source-column"><SourcePhoto plant={plant} /><button className="pw-source-details" onClick={() => setSection('evidence')}>View evidence & provenance<ArrowUpRight size={17} /></button></div>
            <section className="pw-request" aria-labelledby="pw-request-title"><div className="pw-request-meta"><span>{demo ? 'A QUESTION FROM MILO' : 'YOUR PLANT RECORD'}</span><Leaf size={19} aria-hidden="true" /></div><p className="pw-request-status">{demo ? 'Scripted response · no model calls' : 'Human observations · no AI assessment'}</p><div className="pw-request-copy" key={`${plant.id}-${plant.total}`}><h2 id="pw-request-title">{request.title}</h2><MeasuredCopy>{request.body}</MeasuredCopy></div><div className="pw-context"><Drop size={20} aria-hidden="true" /><span>Soil</span><strong>{soilText[plant.events.at(-1)?.soil] || 'Not checked'}{demo && plant.total ? ' · imagined' : ''}</strong></div>
              <ObservationForm key={plant.id} plant={plant} onRecord={observation => { setNotice(''); setWorkspace(current => recordObservation(current, plant.id, observation)); }} />
            </section></div>
          <div className="pw-latest"><Journal plant={plant} preview /><button className="pw-text" onClick={() => setSection('journal')}>View journal<ArrowUpRight size={17} /></button></div>
        </>}
        {section === 'journal' && <Journal plant={plant} onObserve={() => setSection('request')} />}
        {section === 'evidence' && <Evidence plant={plant} onVideo={onVideo} />}
        <footer className="pw-footer"><span>{demo ? 'Milo is fictional. Your scenario entries are simulations.' : 'Your notes and photo stay in this tab until exported.'}</span><span>No treatment is automated.</span></footer>
      </div>
    </main>

    {active && modal === 'add' && <Modal title="A plant of your own." onClose={() => setModal(null)}><AddPlant onAdd={item => { setWorkspace(current => addPlant(current, item)); selectPlant(item.id); setModal(null); setNotice(`${item.name} added. This is a manual journal, kept in this tab.`); }} /></Modal>}
    {active && modal === 'connections' && <Modal title="Connections" onClose={() => setModal(null)}><p className="pw-connections-note">These settings connect the video perception lab. Plant-agent replies in this workspace remain scripted or manual.</p><Connections provider={provider} accessCode={provider.accessCode} setAccessCode={setAccessCode} onCheck={onCheck} onDone={() => setModal(null)} /></Modal>}
  </div>;
}
