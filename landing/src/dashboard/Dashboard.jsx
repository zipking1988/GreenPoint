import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Leaf } from '@phosphor-icons/react/dist/csr/Leaf';
import { SquaresFour } from '@phosphor-icons/react/dist/csr/SquaresFour';
import { MapTrifold } from '@phosphor-icons/react/dist/csr/MapTrifold';
import { CheckSquare } from '@phosphor-icons/react/dist/csr/CheckSquare';
import { GearSix } from '@phosphor-icons/react/dist/csr/GearSix';
import { Question } from '@phosphor-icons/react/dist/csr/Question';
import { UploadSimple } from '@phosphor-icons/react/dist/csr/UploadSimple';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight';
import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft';
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { Play } from '@phosphor-icons/react/dist/csr/Play';
import { Pause } from '@phosphor-icons/react/dist/csr/Pause';
import { ArrowsOut } from '@phosphor-icons/react/dist/csr/ArrowsOut';
import { Crosshair } from '@phosphor-icons/react/dist/csr/Crosshair';
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { Check } from '@phosphor-icons/react/dist/csr/Check';
import { WarningCircle } from '@phosphor-icons/react/dist/csr/WarningCircle';
import { CircleDashed } from '@phosphor-icons/react/dist/csr/CircleDashed';
import { FilmStrip } from '@phosphor-icons/react/dist/csr/FilmStrip';
import { List } from '@phosphor-icons/react/dist/csr/List';
import { SlidersHorizontal } from '@phosphor-icons/react/dist/csr/SlidersHorizontal';
import { MeasuredCopy } from '../MeasuredCopy.jsx';
import { LABELS, canExportSession, createId, csvText, downloadFile, frameTimecode, matchesPlant, nextReview, reviewDecision, reviewQueue, reviewStatus, sampleSession, summary, timecode } from './data.js';
import { requestAnalysis } from './analysis-client.js';
import { checkModelConfiguration, initialModelConnection, modelConnectionReducer } from './model-connection.js';
import { browserEvidence, cropPlant, jpegSnapshot, MAX_ANALYSIS_SECONDS, nativeVideoData, readVideo, validateVideo } from './video.js';
import { linkDetections, nativeTracks } from './tracker.js';
import { classificationBatches } from './evidence.js';
import { useSessionStore } from './sessions.js';
import { NativeTrackingOption, ReferencePicker } from './ReferencePicker.jsx';
import { ValidationNote } from './ValidationNote.jsx';
import { Connections } from './Connections.jsx';
import { Modal } from './Modal.jsx';
import './dashboard.css';

const CROPS = ['Maize', 'Lettuce', 'Soybean', 'Sugar beet', 'Rice', 'Wheat'];
const PHASES = ['Read video', 'Find plants', 'Link observations', 'Review labels'];


function IconButton({ label, children, className = '', ...props }) {
  return <button type="button" className={`gp-icon-button ${className}`} aria-label={label} title={label} {...props}>{children}</button>;
}

function Label({ value, reviewed = false }) {
  return <span className={`gp-label gp-${value}`}><span className="gp-category-mark" />{LABELS[value].text}{reviewed && <Check size={12} aria-label="Reviewed" />}</span>;
}

function PlantCrop({ image, box, alt, className = '' }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let current = true;
    setSrc(null);
    cropPlant(image, box).then(url => { if (current) setSrc(url); }).catch(() => {});
    return () => { current = false; };
  }, [image, box]);
  return <div className={`gp-plant-crop ${className}`}>{src ? <img src={src} alt={alt} /> : <span aria-label="Loading plant image"><Leaf /></span>}</div>;
}

function MaskOverlay({ plants, frame, selected }) {
  const ref = useRef(null);
  useEffect(() => {
    let canceled = false;
    const canvas = ref.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    import('@meta-sam/parser').then(({ decodeMaskToRaster }) => {
      if (canceled) return;
      for (const plant of plants) {
        const record = plant.observations.find(o => o.frame === frame)?.mask;
        if (!record) continue;
        try {
          const raster = decodeMaskToRaster(record);
          const off = document.createElement('canvas'); off.width = record.width; off.height = record.height;
          const ctx = off.getContext('2d');
          const pixels = ctx.createImageData(record.width, record.height);
          const color = LABELS[plant.label].color.match(/[a-f\d]{2}/gi).map(v => parseInt(v, 16));
          for (let i = 0; i < raster.length; i++) if (raster[i]) { pixels.data.set([...color, plant.id === selected ? 130 : 65], i * 4); }
          ctx.putImageData(pixels, 0, 0);
          const { left, top, right, bottom } = record.bounds;
          context.drawImage(off, left / record.sourceWidth * canvas.width, top / record.sourceHeight * canvas.height, (right - left) / record.sourceWidth * canvas.width, (bottom - top) / record.sourceHeight * canvas.height);
        } catch { /* A malformed individual mask must not hide its box. */ }
      }
    }).catch(() => {});
    return () => { canceled = true; };
  }, [plants, frame, selected]);
  return <canvas ref={ref} width="960" height="960" className="gp-mask-layer" aria-hidden="true" />;
}

function VideoWorkspace({ session, selected, onSelect, activeFrame, onFrame, seekRequest, masks, setMasks, filter, search, queueMode, working, progress, onCancel }) {
  const ref = useRef(null);
  const stage = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [clock, setClock] = useState(0);
  const [showBoxes, setShowBoxes] = useState(true);
  const [full, setFull] = useState(false);
  const active = session.frames[activeFrame];
  const plants = session.plants.filter(p => (session.mode === 'sample' || p.observations.some(o => o.frame === activeFrame)) && matchesPlant(p, filter, search) && (!queueMode || reviewStatus(p) !== 'confirmed'));
  const displayLimit = 6;
  const visiblePlants = [...plants].sort((a, b) => Number(b.id === selected) - Number(a.id === selected) || b.box[2] * b.box[3] - a.box[2] * a.box[3]).slice(0, displayLimit);
  useEffect(() => { setClock(0); setPlaying(false); }, [session.id]);
  useEffect(() => {
    if (!seekRequest || seekRequest.sessionId !== session.id || !ref.current) return;
    const frame = session.frames[seekRequest.frame];
    if (!frame) return;
    ref.current.pause();
    ref.current.currentTime = frame.time;
    setClock(frame.time);
    onFrame(seekRequest.frame);
  }, [seekRequest, session.id, session.frames, onFrame]);
  useEffect(() => {
    const update = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);
  function seek(time) {
    if (ref.current) ref.current.currentTime = time;
    setClock(time);
    if (session.frames.length) {
      const nearest = session.frames.reduce((best, f, i) => Math.abs(f.time - time) < Math.abs(session.frames[best].time - time) ? i : best, 0);
      onFrame(nearest);
    }
  }
  async function togglePlay() {
    if (!ref.current) return;
    if (playing) { ref.current.pause(); return; }
    if (ref.current.ended) seek(0);
    try { await ref.current.play(); } catch { setPlaying(false); }
  }
  const toggleFullscreen = async () => {
    try { document.fullscreenElement ? await document.exitFullscreen() : await stage.current.requestFullscreen(); } catch { /* Playback remains available when fullscreen is disallowed. */ }
  };
  return <section className="gp-video-workspace" aria-label="Field video and sampled observations">
    <div className="gp-workspace-heading"><div className="gp-view-tabs"><span className="gp-tab-active"><FilmStrip size={17} />{session.video ? "Field video" : "Source image"}</span><span className="gp-workspace-caption">{session.mode === 'sample' ? 'ILLUSTRATIVE SAMPLE' : !session.video ? 'RECORDED SOURCE IMAGE' : session.provenance?.recorded ? 'RECORDED REAL CLIP' : 'LOCAL VIDEO'}</span></div><div className="gp-overlay-actions"><button type="button" className={showBoxes ? 'gp-toggle-active' : ''} aria-pressed={showBoxes} onClick={() => setShowBoxes(!showBoxes)}><Crosshair size={16} />Labels</button>{session.mode !== 'sample' && <button type="button" aria-pressed={masks} className={masks ? 'gp-toggle-active' : ''} onClick={() => setMasks(!masks)}>Masks</button>}<IconButton label={full ? 'Exit fullscreen' : 'Expand video'} onClick={toggleFullscreen}><ArrowsOut size={17} /></IconButton></div></div>
    <div className="gp-video-stage" ref={stage} style={{ aspectRatio: `${session.width} / ${session.height}`, width: `min(100%, ${620 * session.width / session.height}px)`, marginInline: 'auto' }}>
      {session.video && <video ref={ref} key={session.id} src={session.video} poster={session.image} playsInline muted preload="metadata" aria-label={session.mode === 'sample' ? 'Eight-second static preview of an AI-generated field illustration' : session.fileName} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onTimeUpdate={e => {
        setClock(e.currentTarget.currentTime);
        if (session.frames.length) onFrame(session.frames.reduce((best, f, i) => Math.abs(f.time - e.currentTarget.currentTime) < Math.abs(session.frames[best].time - e.currentTarget.currentTime) ? i : best, 0));
      }} />}
      {session.mode !== 'sample' && !playing && active && <img className="gp-snapshot" src={active.image} alt={`Sampled frame at ${frameTimecode(active.time)}`} />}
      {masks && !playing && <MaskOverlay plants={plants} frame={activeFrame} selected={selected} />}
      {showBoxes && (!playing || session.mode === 'sample') && <div className="gp-detections">{visiblePlants.map(p => {
        const box = session.mode === 'sample' ? p.box : p.observations.find(o => o.frame === activeFrame)?.box;
        if (!box) return null;
        return <button key={p.id} type="button" className={`gp-detection gp-${p.label} ${p.id === selected ? 'gp-detection-selected' : ''}`} style={{ left: `${box[0] * 100}%`, top: `${box[1] * 100}%`, width: `${box[2] * 100}%`, height: `${box[3] * 100}%` }} onClick={() => onSelect(p.id)} aria-label={`Inspect ${p.id}, ${LABELS[p.label].text}`} aria-pressed={p.id === selected}><span>{p.id}<span className="gp-detection-category">{LABELS[p.label].short}</span>{p.id === selected && <Crosshair size={12} />}</span></button>;
      })}</div>}
      <span className="gp-video-stamp"><span />{session.mode === 'sample' ? 'SCENE 01' : 'FRAME ' + String(activeFrame + 1).padStart(2, '0')}<span className="gp-video-stamp-divider" />{session.mode === 'sample' ? 'Hand-authored annotations' : playing ? 'Video playback · pause to inspect samples' : 'Sampled observation'}</span>
      {working && <div className="gp-processing"><CircleDashed size={35} /><h3>{PHASES[progress.phase]}</h3><p>{progress.detail}</p><progress value={progress.value} max="100" aria-label="Video analysis progress" /><button className="gp-button gp-button-secondary" onClick={onCancel}>Cancel analysis</button></div>}
      {full && <IconButton className="gp-fullscreen-close" label="Exit fullscreen" onClick={toggleFullscreen}><X /></IconButton>}
    </div>
    {session.video && <div className="gp-video-controls"><IconButton label={playing ? 'Pause field video' : 'Play field video'} onClick={togglePlay}>{playing ? <Pause weight="fill" /> : <Play weight="fill" />}</IconButton><span className="gp-timecode">{timecode(clock)}<span> / {timecode(session.duration)}</span></span><input type="range" aria-label="Video timeline" min="0" max={session.duration} step="0.05" value={clock} onChange={e => seek(Number(e.target.value))} style={{ '--gp-progress': `${clock / session.duration * 100}%` }} /><span className="gp-playback-rate">1×</span><IconButton label="Restart video" onClick={() => { ref.current?.pause(); seek(0); }}><ArrowCounterClockwise size={17} /></IconButton></div>}
    <div className="gp-filmstrip">{session.frames.map((frame, i) => <button type="button" key={i} className={i === activeFrame ? 'gp-frame-active' : ''} aria-label={`Inspect sampled frame ${i + 1} at ${frameTimecode(frame.time)}`} aria-pressed={i === activeFrame} onClick={() => { ref.current?.pause(); seek(frame.time); onFrame(i); }}><img src={frame.image} alt="" /><span>{frameTimecode(frame.time)}</span></button>)}</div>
    <div className="gp-workspace-footnote"><span><span className="gp-small-cross">+</span>{session.mode === 'sample' ? 'AI illustration · 12 example records' : `${session.frames.length} sampled frames · ${session.plants.length} plant candidates`}{plants.length > displayLimit ? ` · ${displayLimit} labels shown` : ''}</span><span>Image coordinates, not GPS</span></div>
  </section>;
}

function Inspector({ plant, session, onReview, onNext, onClose, working }) {
  const [note, setNote] = useState('');
  useEffect(() => setNote(''), [plant?.id, session.id]);
  if (!plant) return <aside className="gp-inspector gp-inspector-empty"><Crosshair size={28} /><h2>Select a plant</h2><MeasuredCopy>Choose a label in the video or a row in the inventory to inspect its evidence.</MeasuredCopy></aside>;
  const image = session.frames[plant.bestFrame]?.image ?? session.image;
  const sample = session.mode === 'sample';
  const index = session.plants.findIndex(p => p.id === plant.id);
  const status = reviewStatus(plant);
  const reviewText = { pending: 'Pending', confirmed: 'Confirmed', deferred: 'Deferred' }[status];
  return <aside className="gp-inspector" aria-labelledby="gp-inspector-title">
    <header className="gp-inspector-heading"><div><h2 id="gp-inspector-title" tabIndex="-1">Plant inspection</h2><span>{index + 1} of {session.plants.length} candidates</span></div><div><IconButton label="Previous plant" onClick={() => onNext(-1)}><CaretLeft /></IconButton><IconButton label="Next plant" onClick={() => onNext(1)}><CaretRight /></IconButton><IconButton label="Close plant inspection" className="gp-inspector-dismiss" onClick={onClose}><X /></IconButton></div></header>
    <PlantCrop image={image} box={plant.box} alt={`${plant.id}, cropped from its best available observation`} className="gp-inspection-photo" />
    <div className="gp-specimen-title"><h3>{plant.id}</h3><Label value={plant.label} reviewed={status === 'confirmed'} /></div>
    {!sample && <p className="gp-recorded-note">Original model: {plant.originalLabel ?? 'not classified'} · Representative frame {plant.bestFrame + 1}</p>}
    <dl className="gp-specimen-meta"><div><dt>Source</dt><dd>{sample ? 'Illustrative record' : plant.source}</dd></div><div><dt>Observations</dt><dd>{sample ? 'Example scene' : `${plant.observations.length} sampled views`}</dd></div><div><dt>Model confidence</dt><dd>{sample || plant.confidence == null ? 'Not measured' : `${Math.round(plant.confidence * 100)}% · uncalibrated`}</dd></div><div><dt>Review</dt><dd className={status === 'confirmed' ? 'gp-reviewed-text' : ''}>{reviewText}</dd></div></dl>
    <div className="gp-reasoning"><h4>{sample ? 'Example observation' : 'Visual reasoning'}</h4><MeasuredCopy>{plant.reasoning}</MeasuredCopy></div>
    <fieldset className="gp-review-actions" disabled={working}><legend>{working ? 'Review paused during analysis' : 'Your decision'}</legend>{Object.entries(LABELS).map(([value, label]) => {
      const chosen = plant.label === value && status !== 'pending';
      return <button type="button" key={value} className={`gp-decision gp-${value} ${chosen ? 'gp-decision-selected' : ''}`} aria-pressed={chosen} onClick={() => { onReview(plant.id, value); setNote(value === 'uncertain' ? `${plant.id} deferred for review.` : `${plant.id} confirmed as ${label.text.toLowerCase()}.`); }}><span className="gp-decision-symbol">{value === 'crop' ? <Leaf size={19} /> : value === 'weed' ? <Leaf size={19} weight="fill" /> : <WarningCircle size={19} />}</span><span>{label.action}</span>{chosen ? <Check size={17} /> : <span className="gp-radio" />}</button>;
    })}</fieldset>
    <p role="status" className="gp-review-status">{session.storageUnavailable ? (session.dirty ? 'This browser could not save your sample decisions. Export CSV before leaving.' : 'Sample decisions were exported but are not saved in this browser.') : (status !== 'pending' && note) || (sample ? 'Your sample decisions save in this browser.' : 'Your decisions stay in this tab until you save and confirm a CSV export.')}</p>
    <button type="button" className="gp-next-review" onClick={() => onNext(1, true)}>Next plant needing review<ArrowRight size={16} /></button>
    <div className="gp-human-note"><CheckSquare size={19} /><p>You make the final call.<br /><span>Review in the field before taking action.</span></p></div>
  </aside>;
}

function Inventory({ session, selected, onSelect, filter, setFilter, view, setView, search, setSearch, queueMode, setQueueMode, onExport, onReset }) {
  const stats = summary(session.plants);
  const inventory = useMemo(() => queueMode ? reviewQueue(session.plants) : session.plants, [session.plants, queueMode]);
  const filterStats = queueMode ? summary(inventory) : stats;
  const rows = useMemo(() => inventory.filter(p => matchesPlant(p, filter, search)), [inventory, filter, search]);
  return <section className="gp-inventory" id="gp-inventory" aria-labelledby="gp-inventory-title">
    <div className="gp-inventory-title"><div><h2 id="gp-inventory-title">{queueMode ? 'Review queue' : view === 'atlas' ? 'Frame atlas' : 'Plant inventory'}<span>{queueMode ? stats.pending + stats.deferred : session.plants.length}</span></h2><p>{queueMode ? `${stats.pending} pending · ${stats.deferred} deferred. Filter by classification or search.` : session.mode === 'sample' ? 'Explore the example. Change a label. Keep the evidence.' : 'Plant candidates from sampled frames. Review before use.'}</p></div><button className="gp-text-button" onClick={onExport} disabled={!canExportSession(session)}><DownloadSimple size={17} />Export CSV</button></div>
    <div className="gp-inventory-tools"><div className="gp-filters" role="group" aria-label="Filter plants"><button className={filter === 'all' ? 'gp-filter-active' : ''} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All plants<span>{inventory.length}</span></button>{Object.entries(LABELS).map(([value, label]) => <button key={value} className={`gp-${value} ${filter === value ? 'gp-filter-active' : ''}`} aria-pressed={filter === value} onClick={() => setFilter(value)}><span className="gp-category-mark" />{label.short}<span>{filterStats[value]}</span></button>)}</div><label className="gp-search"><MagnifyingGlass size={17} /><span className="gp-sr-only">Search plant IDs or observations</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a plant…" />{search && <button aria-label="Clear plant search" onClick={() => setSearch('')}><X size={14} /></button>}</label><div className="gp-layout-toggle" role="group" aria-label="Inventory layout"><IconButton label="Table view" className={view === 'table' ? 'gp-toggle-active' : ''} aria-pressed={view === 'table'} onClick={() => setView('table')}><List size={18} /></IconButton><IconButton label="Frame atlas view" className={view === 'atlas' ? 'gp-toggle-active' : ''} aria-pressed={view === 'atlas'} onClick={() => setView('atlas')}><SquaresFour size={18} /></IconButton></div></div>
    {view === 'atlas' ? <div className="gp-frame-atlas">{rows.map(p => <button key={p.id} className={`gp-atlas-specimen ${selected === p.id ? 'gp-atlas-selected' : ''}`} onClick={() => onSelect(p.id)} aria-pressed={selected === p.id}><PlantCrop image={session.frames[p.bestFrame]?.image ?? session.image} box={p.box} alt="" /><span><b>{p.id}</b><Label value={p.label} reviewed={reviewStatus(p) === 'confirmed'} /></span></button>)}</div> : <div className="gp-table-wrap"><table className="gp-table"><thead><tr><th scope="col">Plant identity</th><th scope="col">Classification</th><th scope="col">Visual observation</th><th scope="col">Review</th><th scope="col"><span className="gp-sr-only">Inspect</span></th></tr></thead><tbody>{rows.map(p => <tr key={p.id} className={selected === p.id ? 'gp-row-selected' : ''}><td><button className="gp-plant-row-button" onClick={() => onSelect(p.id)} aria-label={`Inspect ${p.id}`} aria-pressed={selected === p.id}><PlantCrop image={session.frames[p.bestFrame]?.image ?? session.image} box={p.box} alt="" /><b>{p.id}</b></button></td><td><Label value={p.label} /></td><td className="gp-observation-cell">{p.reasoning}</td><td><span className={`gp-review-cell ${reviewStatus(p) === 'confirmed' ? 'gp-review-complete' : ''}`}>{reviewStatus(p) === 'confirmed' ? <Check size={13} /> : <CircleDashed size={13} />}{({ pending: 'Pending', confirmed: 'Confirmed', deferred: 'Deferred' })[reviewStatus(p)]}</span></td><td><IconButton label={`Open ${p.id} evidence`} onClick={() => onSelect(p.id)}><ArrowUpRight size={16} /></IconButton></td></tr>)}</tbody></table></div>}
    {!rows.length && <div className="gp-empty-inventory"><MagnifyingGlass size={28} /><h3>{queueMode ? 'No plants need review in this view' : session.plants.length ? 'No plants match this view' : session.mode === 'partial' ? 'Analysis did not produce candidates' : session.mode === 'live' ? 'No plants detected' : 'Your video is ready to inspect'}</h3><p>{queueMode && stats.deferred ? `${stats.deferred} plants are deferred in the full queue.` : session.plants.length ? 'Try another plant ID or show all classifications.' : session.mode === 'partial' ? 'Export the run summary to keep the processing log, or try again.' : session.mode === 'live' ? 'Export the run summary to keep the processing log, or try a clearer, closer field clip.' : session.duration > MAX_ANALYSIS_SECONDS ? 'Trim this video to six seconds or less to analyze it, or explore the illustrative sample.' : 'Run analysis to find plants, or explore the illustrative sample session.'}</p>{session.plants.length > 0 && <button className="gp-button gp-button-secondary" onClick={() => { setFilter('all'); setSearch(''); setQueueMode(false); }}>Show all plants</button>}</div>}
    <div className="gp-inventory-footer"><span>{rows.length} of {inventory.length} records<span className="gp-footer-separator">/</span>{stats.reviewed} human reviewed{queueMode ? ' in session' : ''}</span>{session.mode === 'sample' && <button className="gp-text-button" onClick={onReset}><ArrowCounterClockwise size={13} />Reset sample decisions</button>}</div>
  </section>;
}

export default function Dashboard({ active = true, onMap, uploadRequest = 0, connection: sharedConnection, dispatchConnection: sharedDispatch, abortRef: sharedAbortRef, setAccessCode: externalSetAccessCode, sessionStore }) {
  const localStore = useSessionStore();
  const { sessions, setSessions, activeId, setActiveId, selectedId, setSelectedId, activeFrame, setActiveFrame } = sessionStore ?? localStore;
  const session = sessions.find(s => s.id === activeId) ?? sessions[0];
  const [inspectorDismissed, setInspectorDismissed] = useState(false);
  const [seekRequest, setSeekRequest] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('table');
  const [queueMode, setQueueMode] = useState(false);
  const [masks, setMasks] = useState(false);
  const [modal, setModal] = useState(null);
  const [sidebar, setSidebar] = useState(false);
  const [localConnection, localDispatch] = useReducer(modelConnectionReducer, initialModelConnection);
  const provider = sharedConnection ?? localConnection;
  const dispatchConnection = sharedDispatch ?? localDispatch;
  const accessCode = provider.accessCode;
  const [notice, setNotice] = useState('');
  const [pendingExport, setPendingExport] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadCrop, setUploadCrop] = useState('Sugar beet');
  const [nativeTracking, setNativeTracking] = useState(false);
  const [referenceRequest, setReferenceRequest] = useState(null);
  const referenceResolver = useRef(null);
  const [pending, setPending] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [working, setWorking] = useState(false);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState({ phase: 0, value: 0, detail: '' });
  const uploadInput = useRef(null);
  const localAbortRef = useRef(null);
  const abortRef = sharedAbortRef ?? localAbortRef;
  const urls = useRef(new Set());
  const inventoryRef = useRef(null);
  const sidebarRef = useRef(null);
  const stats = summary(session.plants);
  const selected = session.plants.find(p => p.id === selectedId);
  const pendingExportCurrent = pendingExport && sessions.some(item => item === pendingExport.session);
  const setAccessCode = externalSetAccessCode ?? (value => {
    if (value !== accessCode) abortRef.current?.abort();
    dispatchConnection({ type: 'access-code', value });
  });

  const checkConnection = useCallback(() => checkModelConfiguration(dispatchConnection), [dispatchConnection]);
  const hasSharedConnection = Boolean(sharedConnection);
  useEffect(() => {
    if (!hasSharedConnection) { document.title = 'Field intelligence · GreenPoint'; checkConnection(); }
    return () => { abortRef.current?.abort(); urls.current.forEach(url => URL.revokeObjectURL(url)); };
  }, [abortRef, checkConnection, hasSharedConnection]);
  useEffect(() => {
    if (!active) {
      abortRef.current?.abort();
      if (modal === 'upload') closeUpload();
      else setModal(null);
      setSidebar(false);
    }
  }, [active]);
  useEffect(() => { if (uploadRequest > 0) { setModal('upload'); setUploadError(''); } }, [uploadRequest]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(timeout);
  }, [notice]);
  const hasUnsavedResults = working;
  useEffect(() => {
    if (!hasUnsavedResults) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasUnsavedResults]);
  useEffect(() => {
    if (!queueMode || inspectorDismissed) return;
    const rows = reviewQueue(session.plants, filter, search);
    if (rows.some(plant => plant.id === selectedId)) return;
    const next = rows[0];
    setSelectedId(next?.id ?? null);
    if (next && session.mode !== 'sample') {
      setActiveFrame(next.bestFrame);
      setSeekRequest({ sessionId: session.id, frame: next.bestFrame, serial: performance.now() });
    }
  }, [queueMode, inspectorDismissed, session.id, session.mode, session.plants, filter, search, selectedId]);
  useEffect(() => {
    if (!sidebar) return;
    const opener = document.activeElement;
    const panel = sidebarRef.current;
    if (!panel) return;
    const focusable = () => [...panel.querySelectorAll('a[href],button:not(:disabled)')];
    focusable()[0]?.focus();
    const onKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); setSidebar(false); }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0]; const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); opener?.focus(); };
  }, [sidebar]);

  function updateSession(next) { setSessions(current => current.map(s => s.id === next.id ? next : s)); }
  function selectSession(id) {
    if (working || reading) return;
    setActiveId(id); setSelectedId(null); setInspectorDismissed(false); setActiveFrame(0); setFilter('all'); setSearch(''); setQueueMode(false); setSidebar(false);
  }
  function selectPlant(id) {
    const plant = session.plants.find(p => p.id === id);
    setSelectedId(id); setInspectorDismissed(false);
    if (plant && session.mode !== 'sample') {
      setActiveFrame(plant.bestFrame);
      setSeekRequest({ sessionId: session.id, frame: plant.bestFrame, serial: performance.now() });
    }
    if (window.innerWidth < 1050) requestAnimationFrame(() => {
      const panel = document.querySelector('.gp-inspector');
      panel?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      panel?.querySelector('h2')?.focus({ preventScroll: true });
    });
  }
  function reviewPlant(id, label) {
    if (working) return;
    const current = session.plants.find(p => p.id === id);
    if (!current) return;
    const decision = reviewDecision(current, label);
    if (current.label === decision.label && reviewStatus(current) === decision.reviewStatus) return;
    const successor = queueMode && decision.reviewStatus === 'confirmed' ? nextReview(session.plants, id, filter, search) : null;
    const plants = session.plants.map(p => p.id === id ? reviewDecision(p, label) : p);
    let storageUnavailable = false;
    if (session.mode === 'sample') {
      try { localStorage.setItem('greenpoint-review-v2', JSON.stringify(Object.fromEntries(plants.map(p => [p.id, { label: p.label, reviewStatus: reviewStatus(p) }])))); } catch { storageUnavailable = true; }
    }
    updateSession({ ...session, plants, dirty: session.mode === 'sample' ? storageUnavailable : true, storageUnavailable });
    if (queueMode && label !== 'uncertain') {
      const next = successor?.id === id ? null : successor;
      if (next) selectPlant(next.id);
      else setSelectedId(null);
      if (!storageUnavailable) setNotice(`${id} confirmed. ${next ? 'Showing the next plant in this view.' : 'No plants need review in this view.'}`);
    }
    if (storageUnavailable) setNotice('This browser could not save your sample decisions. Export CSV before leaving.');
  }
  function nextPlant(direction, reviewOnly = false) {
    if (reviewOnly) {
      const candidate = nextReview(session.plants, selectedId, filter, search);
      if (!candidate) { setNotice('No plants need review in this view.'); return; }
      if (candidate.id === selectedId) {
        setNotice(reviewStatus(candidate) === 'deferred' ? 'Only this deferred plant remains in this view.' : 'This is the only plant needing review in this view.');
        return;
      }
      selectPlant(candidate.id); return;
    }
    if (queueMode) {
      const candidate = nextReview(session.plants, selectedId, filter, search, direction);
      if (candidate) selectPlant(candidate.id);
      else setNotice('No plants need review in this view.');
      return;
    }
    const index = session.plants.findIndex(p => p.id === selectedId);
    if (session.plants.length) selectPlant(session.plants[(index + direction + session.plants.length) % session.plants.length].id);
  }
  function resetSample() {
    let storageUnavailable = false;
    try { localStorage.removeItem('greenpoint-review-v1'); localStorage.removeItem('greenpoint-review-v2'); } catch { storageUnavailable = true; }
    updateSession({ ...sampleSession(), dirty: storageUnavailable, storageUnavailable });
    setNotice(storageUnavailable ? 'This browser could not save the reset. Export CSV before leaving.' : 'Sample decisions reset.');
  }
  function exportInventory() {
    const slug = session.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      downloadFile(csvText(session), `greenpoint-${slug}-${session.mode}.csv`, 'text/csv;charset=utf-8');
    } catch {
      setNotice('The CSV download could not start. Your results are still unsaved.');
      return;
    }
    if (session.dirty) {
      setPendingExport({ session });
      setNotice('');
    } else {
      setNotice('CSV download started. Coordinates are relative to the source frame.');
    }
  }
  function confirmExport() {
    if (!pendingExport) return;
    const exported = pendingExport.session;
    setPendingExport(null);
    if (!sessions.some(item => item === exported)) {
      setNotice('This session changed after export. Export it again to keep the latest results.');
      return;
    }
    setSessions(current => current.map(item => item === exported ? { ...item, dirty: false } : item));
    setNotice('CSV save confirmed for this version.');
  }
  async function acceptFile(file) {
    if (reading || working) return;
    setUploadError('');
    let url;
    let controller;
    try {
      validateVideo(file);
      url = URL.createObjectURL(file); urls.current.add(url);
      controller = new AbortController(); abortRef.current = controller;
      setReading(true); setProgress({ phase: 0, value: 0, detail: 'Reading your video locally…' });
      const data = await readVideo(file, url, controller.signal, ratio => setProgress({ phase: 0, value: Math.round(ratio * 100), detail: 'Reading up to 12 preview frames locally.' }));
      controller.signal.throwIfAborted();
      if (pending?.video) { URL.revokeObjectURL(pending.video); urls.current.delete(pending.video); }
      setPending({ id: `video-${createId()}`, file, fileName: file.name, video: url, mode: 'local', ...data, image: data.frames[0].image, plants: [], coverage: `${data.frames.length} frames sampled across ${timecode(data.duration)}`, createdAt: new Date().toISOString() });
      setUploadName(file.name.replace(/\.[^.]+$/, '').replaceAll('_', ' '));
    } catch (error) {
      if (url) { URL.revokeObjectURL(url); urls.current.delete(url); }
      if (error.name !== 'AbortError') setUploadError(error.message);
    } finally { if (!controller || abortRef.current === controller) setReading(false); }
  }
  function closeUpload() {
    abortRef.current?.abort(); setReading(false);
    if (pending?.video) { URL.revokeObjectURL(pending.video); urls.current.delete(pending.video); }
    setPending(null); setUploadError(''); setModal(null);
  }
  function openUploaded(analyzeNow = false) {
    if (!pending) return;
    const next = { ...pending, name: uploadName.trim().slice(0, 70) || 'Untitled field session', crop: uploadCrop };
    setSessions(current => [...current, next]); setActiveId(next.id); setSelectedId(null); setInspectorDismissed(false); setActiveFrame(0); setFilter('all'); setSearch(''); setQueueMode(false);
    setPending(null); setModal(null); setUploadError('');
    if (analyzeNow) runAnalysis(next);
  }
  async function runAnalysis(target = session) {
    if (working || reading) return;
    if (target.duration > MAX_ANALYSIS_SECONDS) { setNotice('Analysis supports clips up to 6 seconds. Trim this video and upload the shorter clip.'); return; }
    if (!provider.configured || !accessCode) { setModal('connection'); return; }
    // A rerun gets a fresh identity namespace. Preserve the old run and its
    // human decisions instead of matching edits to newly assigned IDs.
    if (target.mode !== 'local') {
      target = { ...target, id: `video-${createId()}`, name: `${target.name.replace(/ · rerun$/, '')} · rerun`, plants: [], mode: 'local', limited: false, completedFrames: 0 };
      setSessions(current => [...current, target]);
      setActiveId(target.id); setActiveFrame(0); setFilter('all'); setSearch(''); setQueueMode(false);
    }
    target = { ...target, runId: createId(), lastError: null, identityMethod: nativeTracking ? 'sam_video' : target.frames.length === 1 ? 'single_frame' : 'geometric', coverage: target.coverage ?? `${target.frames.length} source frames`, cropReference: null, provenance: target.provenance ? { recorded: false, source: target.provenance.source, sourceUrl: target.provenance.sourceUrl, license: target.provenance.license, parentRunId: target.runId, sourceRecording: target.provenance.sourceRecording ?? target.provenance } : null };
    const connectionRevision = provider.revision;
    const controller = new AbortController(); abortRef.current = controller;
    setWorking(true); setSelectedId(null); setNotice('');
    const tracks = [];
    const analysisLog = [];
    let limited = false;
    let completedFrames = 0;
    const started = performance.now();
    async function trackedRequest(stage, index, body) {
      const requestStarted = performance.now();
      try {
        const result = await requestAnalysis(body, accessCode, controller.signal);
        analysisLog.push({ stage, index, elapsed_ms: Math.round(performance.now() - requestStarted), candidates: result.detections?.length ?? result.plants?.length ?? 0, status: 'completed', usage: result.usage ?? null });
        return result;
      } catch (error) {
        if (['access_required', 'provider_auth', 'not_configured'].includes(error.code)) dispatchConnection({ type: 'authentication-failed', revision: connectionRevision });
        analysisLog.push({ stage, index, elapsed_ms: Math.round(performance.now() - requestStarted), status: error.name === 'AbortError' ? 'canceled' : 'failed', error_code: error.name === 'AbortError' ? 'canceled' : error.code || 'connection_error' });
        throw error;
      }
    }
    try {
      if (nativeTracking) {
        setProgress({ phase: 1, value: 5, detail: 'SAM 3.1 · sending the selected full clip for native tracking.' });
        const video = target.file ? await nativeVideoData(target.file) : null;
        if (!video) throw new Error('Upload the original MP4 again to use native video tracking. Recorded results cannot be re-sent as a live clip.');
        const data = await trackedRequest('segment_video', 1, { action: 'segment_video', video });
        const decodeUrl = URL.createObjectURL(target.file);
        urls.current.add(decodeUrl);
        target = { ...target, video: decodeUrl };
        const extracted = await readVideo(target.file, decodeUrl, controller.signal, undefined, data.frames.map(frame => frame.time));
        if (extracted.width !== data.width || extracted.height !== data.height) throw new Error('Decoded video dimensions differ from native tracking. Use sampled frames explicitly.');
        target = { ...target, ...extracted, image: extracted.frames[0].image };
        tracks.push(...nativeTracks(data.frames));
        completedFrames = data.frames.length; limited = data.limited;
        dispatchConnection({ type: 'verified', model: 'sam-3.1', revision: connectionRevision });
      } else {
      for (let i = 0; i < target.frames.length; i++) {
        setProgress({ phase: 1, value: Math.round(i / target.frames.length * 65), detail: `SAM 3.1 · frame ${i + 1} of ${target.frames.length}` });
        const snapshot = await jpegSnapshot(target.frames[i].image, target.width, target.height);
        target = { ...target, frames: target.frames.map((frame, index) => index === i ? { ...frame, image: snapshot } : frame) };
        const data = await trackedRequest('segment', i + 1, { action: 'segment', image: target.frames[i].image, width: target.width, height: target.height });
        dispatchConnection({ type: 'verified', model: 'sam-3.1', revision: connectionRevision });
        limited ||= data.limited;
        linkDetections(tracks, data.detections, i, target.frames[i].time);
        completedFrames++;
        // Keep a bounded inventory and expose the cap as partial coverage.
        if (tracks.length >= 96) { tracks.splice(96); limited = true; break; }
      }
      }
      setProgress({ phase: 2, value: 68, detail: `${tracks.length} conservative candidate identities. Selecting best observations.` });
      let referenceImage;
      if (tracks.length) {
        const reference = await new Promise((resolve, reject) => {
          const aborted = () => { referenceResolver.current = null; setReferenceRequest(null); reject(new DOMException('Canceled', 'AbortError')); };
          controller.signal.addEventListener('abort', aborted, { once: true });
          referenceResolver.current = value => { controller.signal.removeEventListener('abort', aborted); referenceResolver.current = null; setReferenceRequest(null); resolve(value); };
          setReferenceRequest({ plants: tracks, target });
          if (controller.signal.aborted) aborted();
        });
        if (reference) {
          referenceImage = await cropPlant(target.frames[reference.bestFrame].image, reference.box);
          target = { ...target, cropReference: { plantId: reference.id, frame: reference.bestFrame, box: reference.box, confirmedBy: 'operator', image: referenceImage } };
        }
      }
      target = { ...target, classificationStrategy: referenceImage ? 'reference' : 'baseline' };
      const evidence = await Promise.all(tracks.map(async plant => ({ id: plant.id, ...await browserEvidence(target.frames[plant.bestFrame].image, plant.box, Boolean(referenceImage)) })));
      const batches = classificationBatches(evidence, referenceImage);
      for (let i = 0; i < batches.length; i++) {
        controller.signal.throwIfAborted();
        setProgress({ phase: 3, value: 70 + Math.round(i / batches.length * 29), detail: `Muse Spark · evidence batch ${i + 1} of ${batches.length}` });
        const data = await trackedRequest('classify', i + 1, { action: 'classify', crop: target.crop, plants: batches[i], ...(referenceImage ? { referenceImage } : {}) });
        dispatchConnection({ type: 'verified', model: 'muse-spark-1.3', revision: connectionRevision });
        data.plants.forEach(result => { const plant = tracks.find(p => p.id === result.id); if (plant) Object.assign(plant, { label: result.label, originalLabel: result.originalLabel, confidence: result.confidence, reasoning: result.reasoning, source: 'sam-3.1 + muse-spark-1.3' }); });
      }
      const next = { ...target, plants: tracks, mode: limited ? 'partial' : 'live', limited, completedFrames, analysisLog, dirty: true, elapsed: Math.round((performance.now() - started) / 1000) };
      updateSession(next); setSelectedId(tracks[0]?.id ?? null); setActiveFrame(tracks[0]?.bestFrame ?? 0);
      setSeekRequest({ sessionId: target.id, frame: tracks[0]?.bestFrame ?? 0, serial: performance.now() });
      setNotice(tracks.length ? `${limited ? 'Partial analysis: preview limit reached.' : 'Analysis complete.'} ${tracks.length} candidate plants are ready for your review.` : 'No plants were detected in the sampled frames. Try a clearer, closer field clip.');
    } catch (error) {
      const canceled = error.name === 'AbortError';
      if (!analysisLog.length || analysisLog.at(-1).status === 'completed') analysisLog.push({ stage: 'client', elapsed_ms: Math.round(performance.now() - started), status: canceled ? 'canceled' : 'failed', error_code: canceled ? 'canceled' : 'client_error' });
      updateSession({ ...target, plants: tracks, mode: 'partial', limited: true, completedFrames, analysisLog, lastError: canceled ? 'Analysis canceled.' : error.message, dirty: true, elapsed: Math.round((performance.now() - started) / 1000) });
      if (tracks.length) {
        setSelectedId(tracks[0].id); setActiveFrame(tracks[0].bestFrame);
        setSeekRequest({ sessionId: target.id, frame: tracks[0].bestFrame, serial: performance.now() });
      }
      setNotice(`${canceled ? 'Analysis canceled.' : error.message}${tracks.length ? ' Partial detections are preserved. Unclassified plants need review.' : ''}`);
    } finally { setWorking(false); }
  }

  const openUpload = () => { if (!working && !reading) { setModal('upload'); setUploadError(''); } };
  const openInventory = (nextFilter = 'all', nextView = 'table', nextQueue = false) => {
    setFilter(nextFilter); setView(nextView); setQueueMode(nextQueue); setSearch(''); setSidebar(false);
    if (nextQueue) {
      const next = reviewQueue(session.plants, nextFilter)[0];
      if (next) selectPlant(next.id); else setSelectedId(null);
    }
    requestAnimationFrame(() => inventoryRef.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }));
  };

  return <div className="gp-dashboard">
    <a className="gp-skip" href="#gp-main">Skip to analysis</a>
    <nav className="gp-rail" aria-label="Workspace navigation"><a href="/" className="gp-rail-brand" aria-label="GreenPoint home"><Leaf weight="fill" /></a><div className="gp-rail-main">{onMap && <IconButton label="Back to field map" onClick={onMap} disabled={working || reading}><MapTrifold /><span className="gp-rail-label">Field</span></IconButton>}<IconButton label="Field sessions" className={!queueMode && view === 'table' && filter === 'all' ? 'gp-rail-active' : ''} onClick={() => { setView('table'); setFilter('all'); setQueueMode(false); if (window.innerWidth < 801) setSidebar(true); }}><SquaresFour /><span className="gp-rail-label">Sessions</span></IconButton><IconButton label="Frame atlas" className={!queueMode && view === 'atlas' ? 'gp-rail-active' : ''} onClick={() => openInventory('all', 'atlas')}><MapTrifold /><span className="gp-rail-label">Atlas</span></IconButton><IconButton label="Review queue" className={queueMode ? 'gp-rail-active' : ''} onClick={() => openInventory('all', 'table', true)}><CheckSquare /><span className="gp-rail-label">Review</span>{stats.pending + stats.deferred > 0 && <span className="gp-rail-count">{stats.pending + stats.deferred}</span>}</IconButton></div><div className="gp-rail-bottom"><IconButton label="Connection settings" onClick={() => setModal('connection')}><GearSix /></IconButton><IconButton label="About GreenPoint" onClick={() => setModal('about')}><Question /></IconButton></div></nav>
    {sidebar && <button className="gp-sidebar-scrim" aria-label="Close field sessions" onClick={() => setSidebar(false)} />}
    <aside ref={sidebarRef} className={`gp-sessions ${sidebar ? 'gp-sessions-open' : ''}`} aria-label="Field sessions" role={sidebar ? 'dialog' : undefined} aria-modal={sidebar ? true : undefined}><a className="gp-brand" href="/">Green<span>Point</span><span className="gp-brand-dot" /></a><div className="gp-session-head"><span className="gp-section-label">WORKSPACE</span><h2>Field sessions</h2><p>A clearer view of every field.</p><button className="gp-new-session" onClick={openUpload} disabled={working || reading}><Plus size={17} />New session</button></div><div className="gp-sessions-list"><div className="gp-recent-label">RECENT SESSIONS<span>{sessions.length.toString().padStart(2, '0')}</span></div>{sessions.map(s => <button type="button" key={s.id} className={`gp-session-item ${session.id === s.id ? 'gp-session-active' : ''}`} aria-pressed={session.id === s.id} onClick={() => selectSession(s.id)} disabled={working || reading}><img src={s.image} alt="" /><span><b>{s.name}</b><span>{s.mode === 'sample' ? 'Illustrative sample' : s.provenance?.recorded ? 'Recorded real Meta run' : s.mode === 'local' ? 'Local preview' : s.mode === 'partial' ? 'Partial analysis' : 'Analyzed'}<span className="gp-session-dot">·</span>{timecode(s.duration)}</span></span><CaretRight size={14} /></button>)}</div><div className="gp-session-bottom"><button className="gp-upload-card" onClick={openUpload} disabled={working || reading}><UploadSimple size={25} /><strong>Start with a field walk.</strong><span>Upload a short phone video.</span><span className="gp-upload-card-action">Upload video<ArrowUpRight size={16} /></span></button><button className="gp-connection-status" onClick={() => setModal('connection')}><span className={provider.configured ? 'gp-dot-on' : ''} />{provider.configured ? 'Analysis configured' : provider.error ? 'Connection check failed' : provider.checked ? 'Sample workspace' : 'Checking connection…'}<ArrowUpRight size={12} /></button><a className="gp-project-link" href="/">Explore GreenPoint<ArrowUpRight size={13} /></a></div></aside>
    <main id="gp-main" className="gp-main">
      <header className="gp-topbar"><div className="gp-breadcrumb"><IconButton label="Open field sessions" className="gp-mobile-menu" onClick={() => setSidebar(true)}><List /></IconButton><span>Workspace</span><CaretRight size={12} /><strong>Field intelligence</strong></div><div className="gp-top-actions"><span className="gp-prototype-note">RESEARCH PROTOTYPE</span><button className="gp-button gp-button-primary" onClick={openUpload} disabled={working || reading}><UploadSimple size={18} /><span>Upload video</span><ArrowUpRight size={17} /></button></div></header>
      <div className="gp-page-content"><ValidationNote /><div className="gp-page-heading"><div><h1>Field intelligence<span>.</span></h1><p>A field walk. Plant candidates to review.</p></div><button className="gp-help-button" onClick={() => setModal('about')}><Question size={16} />How it works</button></div>
        <div className="gp-session-summary"><div className="gp-current-session"><span className="gp-section-label">CURRENT SESSION</span><h2>{session.name}</h2><span>{session.mode === 'sample' ? 'Illustrative dataset' : session.fileName}<span className="gp-summary-dot">/</span>{session.crop}</span></div><div className="gp-session-stats"><div><strong>{session.plants.length.toString().padStart(2, '0')}</strong><span>{session.mode === 'sample' ? 'Example plants' : 'Candidate plants'}</span></div><button className="gp-crop" onClick={() => openInventory('crop')}><Leaf size={16} /><b>{stats.crop.toString().padStart(2, '0')}</b><span>Crop</span></button><button className="gp-weed" onClick={() => openInventory('weed')}><Leaf size={16} weight="fill" /><b>{stats.weed.toString().padStart(2, '0')}</b><span>Weed</span></button><button className="gp-uncertain" onClick={() => openInventory('uncertain')}><WarningCircle size={16} /><b>{stats.uncertain.toString().padStart(2, '0')}</b><span>Uncertain</span></button></div></div>
        {session.mode !== 'sample' && <div className={`gp-analysis-banner ${session.limited ? 'gp-analysis-partial' : ''}`}><div><Crosshair size={18} /><span>{session.mode === 'local' ? `${session.coverage}. ${session.duration > MAX_ANALYSIS_SECONDS ? 'Preview only. Trim to 6 seconds for analysis.' : provider.configured ? 'Ready for analysis.' : provider.error ? 'Check the analysis connection.' : 'Configure the model connection to analyze.'}` : `${session.completedFrames} of ${session.frames.length} sampled frames processed${session.elapsed != null ? ` in ${session.elapsed}s` : ''}. ${session.identityMethod === 'single_frame' ? 'Single image; no cross-frame tracking.' : session.identityMethod === 'sam_video' ? 'SAM native video mode; identity tracking is unvalidated.' : 'Geometric identity linking is experimental.'}${session.limited ? ' Coverage is partial.' : ''}${session.lastError ? ` ${session.lastError}` : ''}`}</span></div><button className="gp-button gp-button-secondary" disabled={working || session.duration > MAX_ANALYSIS_SECONDS} onClick={() => runAnalysis()}>{working ? 'Analyzing…' : session.mode === 'local' ? 'Analyze video' : 'Run again'}<ArrowRight size={15} /></button></div>}
        {session.mode !== 'sample' && <NativeTrackingOption checked={nativeTracking} onChange={setNativeTracking} disabled={working || reading} />}
        {session.provenance?.recorded && <div className="gp-recorded-note"><strong>Recorded real Meta run</strong><span>{session.provenance.recordedAt} · {session.provenance.source} · Results replayed from this run; no new inference on page load.</span></div>}
        {notice && <div className="gp-notice" role="status"><WarningCircle size={17} /><span>{notice}</span><IconButton label="Dismiss notification" onClick={() => setNotice('')}><X size={15} /></IconButton></div>}
        {pendingExport && <div className="gp-notice gp-export-confirmation"><WarningCircle size={17} /><span role="status">{pendingExportCurrent ? `CSV download started for ${pendingExport.session.name}. Check that the file was saved before confirming.` : `${pendingExport.session.name} changed after this download. Export it again to keep the latest results.`}</span>{pendingExportCurrent && <button type="button" className="gp-button gp-button-secondary" onClick={confirmExport}>I saved the CSV</button>}<IconButton label="Dismiss export confirmation" onClick={() => setPendingExport(null)}><X size={15} /></IconButton></div>}
        <div className="gp-analysis-grid"><div className="gp-analysis-primary"><VideoWorkspace session={session} selected={selectedId} onSelect={selectPlant} activeFrame={activeFrame} onFrame={setActiveFrame} seekRequest={seekRequest} masks={masks} setMasks={setMasks} filter={filter} search={search} queueMode={queueMode} working={working} progress={progress} onCancel={() => abortRef.current?.abort()} /><div ref={inventoryRef}><Inventory session={session} selected={selectedId} onSelect={selectPlant} filter={filter} setFilter={setFilter} view={view} setView={setView} search={search} setSearch={setSearch} queueMode={queueMode} setQueueMode={setQueueMode} onExport={exportInventory} onReset={resetSample} /></div></div>{!inspectorDismissed && <Inspector plant={selected} session={session} onReview={reviewPlant} onNext={nextPlant} onClose={() => { setInspectorDismissed(true); setSelectedId(null); }} working={working} />}</div>
        <footer className="gp-dashboard-footer"><span>GreenPoint<span className="gp-footer-separator">/</span>Plant intelligence, with a human in the loop.</span><span>{session.mode === 'sample' ? 'Illustrative visuals & annotations' : 'Sampled video evidence'}<span className="gp-footer-separator">·</span>No treatment decisions automated</span></footer>
      </div>
    </main>
    {active && modal === 'upload' && <Modal title="A field walk is all it takes." onClose={closeUpload} wide><p className="gp-dialog-intro">Upload a short video. Find the plants. Review the evidence.</p><input ref={uploadInput} type="file" accept="video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.mov,.m4v,.webm" className="gp-sr-only" tabIndex="-1" onChange={e => { const file = e.target.files?.[0]; if (file) acceptFile(file); e.target.value = ''; }} /><button className={`gp-dropzone ${dragging ? 'gp-dropzone-dragging' : ''}`} disabled={reading} onClick={() => uploadInput.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length !== 1) setUploadError('Choose one field video at a time.'); else acceptFile(e.dataTransfer.files[0]); }}><UploadSimple size={31} /><strong>{reading ? 'Reading your field video…' : pending ? pending.fileName : 'Drop your field video here'}</strong><span>{reading ? `${progress.value}% · sampling frames locally` : pending ? 'Click to choose a different video' : 'or choose a file'}</span><small>MP4, MOV, M4V or WebM · 150 MB · preview up to 2 minutes · analyze up to 6 seconds</small>{reading && <progress max="100" value={progress.value} aria-label="Reading video progress" />}</button>{uploadError && <p className="gp-form-error" role="alert"><WarningCircle size={17} />{uploadError}</p>}{pending && <><div className="gp-upload-preview">{pending.frames.slice(0, 6).map((frame, i) => <img key={i} src={frame.image} alt={`Video preview ${i + 1}`} />)}</div><div className="gp-upload-form"><label>Session name<input maxLength="70" value={uploadName} onChange={e => setUploadName(e.target.value)} /></label><label>Planted crop<select value={uploadCrop} onChange={e => setUploadCrop(e.target.value)}>{CROPS.map(crop => <option key={crop}>{crop}</option>)}</select></label></div></>}{pending && pending.duration > MAX_ANALYSIS_SECONDS && <div className="gp-connection-note"><WarningCircle size={18} /><span>Preview only: trim this video to 6 seconds or less and upload it again to analyze.</span></div>}<NativeTrackingOption checked={nativeTracking} onChange={setNativeTracking} disabled={reading} /><p className="gp-upload-privacy"><CheckSquare size={18} />{nativeTracking ? "Starting native analysis sends the complete selected short clip to Meta." : "Only sampled frames and same-source plant evidence are sent to Meta when analysis starts."} Results stay in this tab until exported.</p>{!provider.configured && <div className="gp-connection-note"><WarningCircle size={18} /><span>{provider.error ? 'Connection check failed. Retry in Connection settings.' : 'Live analysis is not configured yet. You can preview your video or explore the sample session.'}</span></div>}<div className="gp-dialog-actions"><button className="gp-text-button" onClick={() => { closeUpload(); selectSession('sample-east-plot'); setSelectedId('GP-007'); }}>Explore sample<ArrowRight size={16} /></button><button className="gp-button gp-button-primary" disabled={!pending || reading} onClick={() => openUploaded(provider.configured && Boolean(accessCode) && pending.duration <= MAX_ANALYSIS_SECONDS)}>{provider.configured && accessCode && pending?.duration <= MAX_ANALYSIS_SECONDS ? 'Analyze video' : 'Open local preview'}<ArrowRight size={17} /></button></div></Modal>}
    {active && referenceRequest && <ReferencePicker request={referenceRequest} PlantCrop={PlantCrop} onChoose={value => referenceResolver.current?.(value)} />}
    {active && modal === 'connection' && <Modal title="Connections" onClose={() => setModal(null)}><Connections provider={provider} accessCode={accessCode} setAccessCode={setAccessCode} onCheck={checkConnection} onDone={() => { setModal(null); if (provider.configured && accessCode) setNotice('Access code set for this tab. Start analysis from your field video.'); }} /></Modal>}
    {active && modal === 'about' && <Modal title="Every judgment has a frame." onClose={() => setModal(null)}><p className="gp-dialog-intro">GreenPoint turns a short field video into a reviewable plant inventory. Built for growers managing scattered plots.</p><ol className="gp-about-steps"><li><span>01</span><div><h3>Bring a field walk.</h3><p>Preview a phone video up to 2 minutes. Analyze a clip up to 6 seconds using at most 12 sampled frames, or explicitly opt into sending the short clip for native tracking.</p></div></li><li><span>02</span><div><h3>Find plants. Keep the evidence.</h3><p>SAM 3.1 segments plants. Choose sampled-frame matching or native video identities, then supply a crop reference you recognize. Tracking still needs field validation.</p></div></li><li><span>03</span><div><h3>Make the final call.</h3><p>Muse Spark suggests crop, weed or uncertain. Review the source image, change a label, then export the inventory.</p></div></li></ol><div className="gp-about-honesty"><strong>What you are seeing now</strong><p>The illustrative sample uses AI-generated imagery and 12 hand-authored records. A recorded real run is labeled separately with its source and timestamp. It demonstrates the workflow, not measured model performance. Image coordinates are not GPS. The tracker and classification need field validation.</p></div><div className="gp-dialog-actions"><a className="gp-text-button" href="https://github.com/zipking1988/GreenPoint" target="_blank" rel="noreferrer">View project<ArrowUpRight size={16} /></a><button className="gp-button gp-button-primary" onClick={() => setModal(null)}>Back to the field<ArrowRight size={17} /></button></div></Modal>}
  </div>;
}
