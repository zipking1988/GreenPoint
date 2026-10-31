import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { LABELS, csvText, downloadFile, sampleSession, summary, timecode } from './data.js';
import { cropPlant, readVideo, validateVideo } from './video.js';
import { linkDetections } from './tracker.js';
import { Connections } from './Connections.jsx';
import { Modal } from './Modal.jsx';
import './dashboard.css';

const CROPS = ['Maize', 'Lettuce', 'Soybean', 'Sugar beet', 'Rice', 'Wheat'];
const PHASES = ['Read video', 'Find plants', 'Link observations', 'Review labels'];
const makeSample = () => {
  const sample = sampleSession();
  try {
    const saved = JSON.parse(localStorage.getItem('greenpoint-review-v1') || '{}');
    sample.plants = sample.plants.map(p => {
      const edit = saved[p.id];
      return edit && LABELS[edit.label] && typeof edit.reviewed === 'boolean' ? { ...p, label: edit.label, reviewed: edit.reviewed } : p;
    });
  } catch { /* The sample works even when local storage is unavailable. */ }
  return sample;
};

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

function VideoWorkspace({ session, selected, onSelect, activeFrame, onFrame, seekRequest, masks, setMasks, filter, working, progress, onCancel }) {
  const ref = useRef(null);
  const stage = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [clock, setClock] = useState(0);
  const [showBoxes, setShowBoxes] = useState(true);
  const [full, setFull] = useState(false);
  const active = session.frames[activeFrame];
  const plants = session.plants.filter(p => (session.mode === 'sample' || p.observations.some(o => o.frame === activeFrame)) && (filter === 'all' || p.label === filter));
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
    <div className="gp-workspace-heading"><div className="gp-view-tabs"><span className="gp-tab-active"><FilmStrip size={17} />Field video</span><span className="gp-workspace-caption">{session.mode === 'sample' ? 'ILLUSTRATIVE SAMPLE' : 'LOCAL VIDEO'}</span></div><div className="gp-overlay-actions"><button type="button" className={showBoxes ? 'gp-toggle-active' : ''} aria-pressed={showBoxes} onClick={() => setShowBoxes(!showBoxes)}><Crosshair size={16} />Labels</button>{session.mode !== 'sample' && <button type="button" aria-pressed={masks} className={masks ? 'gp-toggle-active' : ''} onClick={() => setMasks(!masks)}>Masks</button>}<IconButton label={full ? 'Exit fullscreen' : 'Expand video'} onClick={toggleFullscreen}><ArrowsOut size={17} /></IconButton></div></div>
    <div className="gp-video-stage" ref={stage} style={{ aspectRatio: `${session.width} / ${session.height}`, width: `min(100%, ${620 * session.width / session.height}px)`, marginInline: 'auto' }}>
      <video ref={ref} key={session.id} src={session.video} poster={session.image} playsInline muted preload="metadata" aria-label={session.mode === 'sample' ? 'Eight-second static preview of an AI-generated field illustration' : session.fileName} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onTimeUpdate={e => {
        setClock(e.currentTarget.currentTime);
        if (session.frames.length) onFrame(session.frames.reduce((best, f, i) => Math.abs(f.time - e.currentTarget.currentTime) < Math.abs(session.frames[best].time - e.currentTarget.currentTime) ? i : best, 0));
      }} />
      {session.mode !== 'sample' && !playing && active && <img className="gp-snapshot" src={active.image} alt={`Sampled frame at ${timecode(active.time)}`} />}
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
    <div className="gp-video-controls"><IconButton label={playing ? 'Pause field video' : 'Play field video'} onClick={togglePlay}>{playing ? <Pause weight="fill" /> : <Play weight="fill" />}</IconButton><span className="gp-timecode">{timecode(clock)}<span> / {timecode(session.duration)}</span></span><input type="range" aria-label="Video timeline" min="0" max={session.duration} step="0.05" value={clock} onChange={e => seek(Number(e.target.value))} style={{ '--gp-progress': `${clock / session.duration * 100}%` }} /><span className="gp-playback-rate">1×</span><IconButton label="Restart video" onClick={() => { ref.current?.pause(); seek(0); }}><ArrowCounterClockwise size={17} /></IconButton></div>
    <div className="gp-filmstrip">{session.frames.map((frame, i) => <button type="button" key={i} className={i === activeFrame ? 'gp-frame-active' : ''} aria-label={`Inspect sampled frame ${i + 1} at ${timecode(frame.time)}`} aria-pressed={i === activeFrame} onClick={() => { ref.current?.pause(); seek(frame.time); onFrame(i); }}><img src={frame.image} alt="" /><span>{timecode(frame.time)}</span></button>)}</div>
    <div className="gp-workspace-footnote"><span><span className="gp-small-cross">+</span>{session.mode === 'sample' ? 'AI illustration · 12 example records' : `${session.frames.length} sampled frames · ${session.plants.length} candidate identities`}{plants.length > displayLimit ? ` · ${displayLimit} labels shown` : ''}</span><span>Image coordinates, not GPS</span></div>
  </section>;
}

function Inspector({ plant, session, onReview, onNext, onClose, working }) {
  const [note, setNote] = useState('');
  useEffect(() => setNote(''), [plant?.id, session.id]);
  if (!plant) return <aside className="gp-inspector gp-inspector-empty"><Crosshair size={28} /><h2>Select a plant</h2><MeasuredCopy>Choose a label in the video or a row in the inventory to inspect its evidence.</MeasuredCopy></aside>;
  const image = session.frames[plant.bestFrame]?.image ?? session.image;
  const sample = session.mode === 'sample';
  const index = session.plants.findIndex(p => p.id === plant.id);
  return <aside className="gp-inspector" aria-labelledby="gp-inspector-title">
    <header className="gp-inspector-heading"><div><h2 id="gp-inspector-title" tabIndex="-1">Plant inspection</h2><span>{index + 1} of {session.plants.length} candidates</span></div><div><IconButton label="Previous plant" onClick={() => onNext(-1)}><CaretLeft /></IconButton><IconButton label="Next plant" onClick={() => onNext(1)}><CaretRight /></IconButton><IconButton label="Close plant inspection" className="gp-inspector-dismiss" onClick={onClose}><X /></IconButton></div></header>
    <PlantCrop image={image} box={plant.box} alt={`${plant.id}, cropped from its best available observation`} className="gp-inspection-photo" />
    <div className="gp-specimen-title"><h3>{plant.id}</h3><Label value={plant.label} reviewed={plant.reviewed} /></div>
    <dl className="gp-specimen-meta"><div><dt>Source</dt><dd>{sample ? 'Illustrative record' : 'SAM 3.1'}</dd></div><div><dt>Observations</dt><dd>{sample ? 'Example scene' : `${plant.observations.length} sampled views`}</dd></div><div><dt>Model confidence</dt><dd>{sample || plant.confidence == null ? 'Not measured' : `${Math.round(plant.confidence * 100)}% · uncalibrated`}</dd></div><div><dt>Review</dt><dd className={plant.reviewed ? 'gp-reviewed-text' : ''}>{plant.reviewed ? 'Human reviewed' : 'Not yet reviewed'}</dd></div></dl>
    <div className="gp-reasoning"><h4>{sample ? 'Example observation' : 'Visual reasoning'}</h4><MeasuredCopy>{plant.reasoning}</MeasuredCopy></div>
    <fieldset className="gp-review-actions" disabled={working}><legend>{working ? 'Review paused during analysis' : 'Your decision'}</legend>{Object.entries(LABELS).map(([value, label]) => <button type="button" key={value} className={`gp-decision gp-${value} ${plant.label === value ? 'gp-decision-selected' : ''}`} aria-pressed={plant.label === value} onClick={() => { onReview(plant.id, value); setNote(`${plant.id} saved as ${label.text.toLowerCase()}.`); }}><span className="gp-decision-symbol">{value === 'crop' ? <Leaf size={19} /> : value === 'weed' ? <Leaf size={19} weight="fill" /> : <WarningCircle size={19} />}</span><span>{label.action}</span>{plant.label === value ? <Check size={17} /> : <span className="gp-radio" />}</button>)}</fieldset>
    <p role="status" className="gp-review-status">{(plant.reviewed && note) || (sample ? 'Your sample decisions save in this browser.' : 'Your decisions stay in this tab until exported.')}</p>
    <button type="button" className="gp-next-review" onClick={() => onNext(1, true)}>Next plant needing review<ArrowRight size={16} /></button>
    <div className="gp-human-note"><CheckSquare size={19} /><p>You make the final call.<br /><span>Review in the field before taking action.</span></p></div>
  </aside>;
}

function Inventory({ session, selected, onSelect, filter, setFilter, view, setView, search, setSearch, onExport, onReset }) {
  const stats = summary(session.plants);
  const rows = useMemo(() => session.plants.filter(p => (filter === 'all' || p.label === filter) && `${p.id} ${LABELS[p.label].text} ${p.reasoning}`.toLowerCase().includes(search.toLowerCase())), [session.plants, filter, search]);
  return <section className="gp-inventory" id="gp-inventory" aria-labelledby="gp-inventory-title">
    <div className="gp-inventory-title"><div><h2 id="gp-inventory-title">{view === 'atlas' ? 'Frame atlas' : 'Plant inventory'}<span>{session.plants.length}</span></h2><p>{session.mode === 'sample' ? 'Explore the example. Change a label. Keep the evidence.' : 'Candidate identities from sampled frames. Review before use.'}</p></div><button className="gp-text-button" onClick={onExport} disabled={!session.plants.length}><DownloadSimple size={17} />Export CSV</button></div>
    <div className="gp-inventory-tools"><div className="gp-filters" role="group" aria-label="Filter plants"><button className={filter === 'all' ? 'gp-filter-active' : ''} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All plants<span>{session.plants.length}</span></button>{Object.entries(LABELS).map(([value, label]) => <button key={value} className={`gp-${value} ${filter === value ? 'gp-filter-active' : ''}`} aria-pressed={filter === value} onClick={() => setFilter(value)}><span className="gp-category-mark" />{label.short}<span>{stats[value]}</span></button>)}</div><label className="gp-search"><MagnifyingGlass size={17} /><span className="gp-sr-only">Search plant IDs or observations</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a plant…" />{search && <button aria-label="Clear plant search" onClick={() => setSearch('')}><X size={14} /></button>}</label><div className="gp-layout-toggle" role="group" aria-label="Inventory layout"><IconButton label="Table view" className={view === 'table' ? 'gp-toggle-active' : ''} aria-pressed={view === 'table'} onClick={() => setView('table')}><List size={18} /></IconButton><IconButton label="Frame atlas view" className={view === 'atlas' ? 'gp-toggle-active' : ''} aria-pressed={view === 'atlas'} onClick={() => setView('atlas')}><SquaresFour size={18} /></IconButton></div></div>
    {view === 'atlas' ? <div className="gp-frame-atlas">{rows.map(p => <button key={p.id} className={`gp-atlas-specimen ${selected === p.id ? 'gp-atlas-selected' : ''}`} onClick={() => onSelect(p.id)} aria-pressed={selected === p.id}><PlantCrop image={session.frames[p.bestFrame]?.image ?? session.image} box={p.box} alt="" /><span><b>{p.id}</b><Label value={p.label} reviewed={p.reviewed} /></span></button>)}</div> : <div className="gp-table-wrap"><table className="gp-table"><thead><tr><th scope="col">Plant identity</th><th scope="col">Classification</th><th scope="col">Visual observation</th><th scope="col">Review</th><th scope="col"><span className="gp-sr-only">Inspect</span></th></tr></thead><tbody>{rows.map(p => <tr key={p.id} className={selected === p.id ? 'gp-row-selected' : ''}><td><button className="gp-plant-row-button" onClick={() => onSelect(p.id)} aria-label={`Inspect ${p.id}`} aria-pressed={selected === p.id}><PlantCrop image={session.frames[p.bestFrame]?.image ?? session.image} box={p.box} alt="" /><b>{p.id}</b></button></td><td><Label value={p.label} /></td><td className="gp-observation-cell">{p.reasoning}</td><td><span className={`gp-review-cell ${p.reviewed ? 'gp-review-complete' : ''}`}>{p.reviewed ? <Check size={13} /> : <CircleDashed size={13} />}{p.reviewed ? 'Reviewed' : 'Pending'}</span></td><td><IconButton label={`Open ${p.id} evidence`} onClick={() => onSelect(p.id)}><ArrowUpRight size={16} /></IconButton></td></tr>)}</tbody></table></div>}
    {!rows.length && <div className="gp-empty-inventory"><MagnifyingGlass size={28} /><h3>{session.plants.length ? 'No plants match this view' : 'Your video is ready to inspect'}</h3><p>{session.plants.length ? 'Try another plant ID or show all classifications.' : 'Run analysis to find plants, or explore the illustrative sample session.'}</p>{session.plants.length > 0 && <button className="gp-button gp-button-secondary" onClick={() => { setFilter('all'); setSearch(''); }}>Show all plants</button>}</div>}
    <div className="gp-inventory-footer"><span>{rows.length} of {session.plants.length} records<span className="gp-footer-separator">/</span>{stats.reviewed} human reviewed</span>{session.mode === 'sample' && <button className="gp-text-button" onClick={onReset}><ArrowCounterClockwise size={13} />Reset sample decisions</button>}</div>
  </section>;
}

export default function Dashboard({ onMap, uploadRequest = 0, accessCode: externalAccessCode, setAccessCode: externalSetAccessCode }) {
  const [sessions, setSessions] = useState(() => [makeSample()]);
  const [activeId, setActiveId] = useState('sample-east-plot');
  const session = sessions.find(s => s.id === activeId) ?? sessions[0];
  const [selectedId, setSelectedId] = useState('GP-007');
  const [activeFrame, setActiveFrame] = useState(0);
  const [seekRequest, setSeekRequest] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('table');
  const [masks, setMasks] = useState(false);
  const [modal, setModal] = useState(null);
  const [sidebar, setSidebar] = useState(false);
  const [provider, setProvider] = useState({ configured: false, checked: false });
  const [localAccessCode, setLocalAccessCode] = useState('');
  const accessCode = externalAccessCode ?? localAccessCode;
  const setAccessCode = externalSetAccessCode ?? setLocalAccessCode;
  useEffect(() => { if (uploadRequest > 0) { setModal('upload'); setUploadError(''); } }, [uploadRequest]);
  const [notice, setNotice] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadCrop, setUploadCrop] = useState('Maize');
  const [pending, setPending] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [working, setWorking] = useState(false);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState({ phase: 0, value: 0, detail: '' });
  const uploadInput = useRef(null);
  const abortRef = useRef(null);
  const urls = useRef(new Set());
  const inventoryRef = useRef(null);
  const sidebarRef = useRef(null);
  const stats = summary(session.plants);
  const selected = session.plants.find(p => p.id === selectedId);

  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch('/api/health', { signal: AbortSignal.timeout(8000) });
      const body = await response.json();
      setProvider({ configured: response.ok && body.configured === true, checked: true });
    } catch { setProvider({ configured: false, checked: true }); }
  }, []);
  useEffect(() => {
    document.title = 'Field intelligence · GreenPoint';
    checkConnection();
    return () => { abortRef.current?.abort(); urls.current.forEach(url => URL.revokeObjectURL(url)); };
  }, [checkConnection]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(timeout);
  }, [notice]);
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
    setActiveId(id); setSelectedId(null); setActiveFrame(0); setFilter('all'); setSearch(''); setSidebar(false);
  }
  function selectPlant(id) {
    const plant = session.plants.find(p => p.id === id);
    setSelectedId(id);
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
    const plants = session.plants.map(p => p.id === id ? { ...p, label, reviewed: true } : p);
    updateSession({ ...session, plants });
    if (session.mode === 'sample') {
      try { localStorage.setItem('greenpoint-review-v1', JSON.stringify(Object.fromEntries(plants.map(p => [p.id, { label: p.label, reviewed: p.reviewed }])))); } catch { setNotice('This browser could not save your decisions. Export CSV to keep them.'); }
    }
  }
  function nextPlant(direction, reviewOnly = false) {
    const index = session.plants.findIndex(p => p.id === selectedId);
    for (let step = 1; step <= session.plants.length; step++) {
      const candidate = session.plants[(index + step * direction + session.plants.length) % session.plants.length];
      if (!reviewOnly || !candidate.reviewed) { selectPlant(candidate.id); return; }
    }
    setNotice('Every plant in this session has been reviewed. Export your inventory to keep the decisions.');
  }
  function resetSample() {
    const fresh = sampleSession(); updateSession(fresh);
    try { localStorage.removeItem('greenpoint-review-v1'); } catch { /* The in-memory reset still works. */ }
    setNotice('Sample decisions reset.');
  }
  function exportInventory() {
    const slug = session.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    downloadFile(csvText(session), `greenpoint-${slug}-${session.mode}.csv`, 'text/csv;charset=utf-8');
    setNotice(`Exported ${session.plants.length} ${session.mode === 'sample' ? 'illustrative' : 'candidate'} plant records. Coordinates are relative to the source frame.`);
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
      const data = await readVideo(file, url, controller.signal, ratio => setProgress({ phase: 0, value: Math.round(ratio * 100), detail: 'Sampling up to 12 frames across your clip.' }));
      controller.signal.throwIfAborted();
      if (pending?.video) { URL.revokeObjectURL(pending.video); urls.current.delete(pending.video); }
      setPending({ id: `video-${Date.now()}`, fileName: file.name, video: url, mode: 'local', ...data, image: data.frames[0].image, plants: [], coverage: `${data.frames.length} frames sampled across ${timecode(data.duration)}`, createdAt: new Date().toISOString() });
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
    setSessions(current => [...current, next]); setActiveId(next.id); setSelectedId(null); setActiveFrame(0); setFilter('all'); setSearch('');
    setPending(null); setModal(null); setUploadError('');
    if (analyzeNow) runAnalysis(next);
  }
  async function requestAnalysis(body, signal) {
    const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Analysis-Token': accessCode }, body: JSON.stringify(body), signal });
    let data;
    try { data = await response.json(); } catch { throw new Error('The analysis server did not respond. Your video stays available locally.'); }
    if (!response.ok) throw new Error(data.error || 'Analysis could not finish. Try again.');
    return data;
  }
  async function runAnalysis(target = session) {
    if (working || reading) return;
    if (!provider.configured || !accessCode) { setModal('connection'); return; }
    // A rerun gets a fresh identity namespace. Preserve the old run and its
    // human decisions instead of matching edits to newly assigned IDs.
    if (target.mode !== 'local') {
      target = { ...target, id: `video-${Date.now()}`, name: `${target.name.replace(/ · rerun$/, '')} · rerun`, plants: [], mode: 'local', limited: false, completedFrames: 0 };
      setSessions(current => [...current, target]);
      setActiveId(target.id); setActiveFrame(0); setFilter('all'); setSearch('');
    }
    const controller = new AbortController(); abortRef.current = controller;
    setWorking(true); setSelectedId(null); setNotice('');
    const tracks = [];
    let limited = false;
    let completedFrames = 0;
    const started = performance.now();
    try {
      for (let i = 0; i < target.frames.length; i++) {
        setProgress({ phase: 1, value: Math.round(i / target.frames.length * 65), detail: `SAM 3.1 · frame ${i + 1} of ${target.frames.length}` });
        const data = await requestAnalysis({ action: 'segment', image: target.frames[i].image, width: target.width, height: target.height }, controller.signal);
        limited ||= data.limited;
        linkDetections(tracks, data.detections, i, target.frames[i].time);
        completedFrames++;
        // Keep a bounded inventory and expose the cap as partial coverage.
        if (tracks.length >= 96) { tracks.splice(96); limited = true; break; }
      }
      setProgress({ phase: 2, value: 68, detail: `${tracks.length} conservative candidate identities. Selecting best observations.` });
      for (let i = 0; i < tracks.length; i += 8) {
        controller.signal.throwIfAborted();
        const batch = tracks.slice(i, i + 8);
        const plants = await Promise.all(batch.map(async plant => ({ id: plant.id, image: await cropPlant(target.frames[plant.bestFrame].image, plant.box) })));
        setProgress({ phase: 3, value: 70 + Math.round(i / tracks.length * 29), detail: `Muse Spark · reviewing plants ${i + 1}–${Math.min(i + 8, tracks.length)} of ${tracks.length}` });
        const data = await requestAnalysis({ action: 'classify', crop: target.crop, plants }, controller.signal);
        data.plants.forEach(result => { const plant = tracks.find(p => p.id === result.id); if (plant) Object.assign(plant, { label: result.label, originalLabel: result.originalLabel, confidence: result.confidence, reasoning: result.reasoning, source: 'sam-3.1 + muse-spark-1.3' }); });
      }
      const next = { ...target, plants: tracks, mode: 'live', limited, completedFrames, elapsed: Math.round((performance.now() - started) / 1000) };
      updateSession(next); setSelectedId(tracks[0]?.id ?? null); setActiveFrame(tracks[0]?.bestFrame ?? 0);
      setSeekRequest({ sessionId: target.id, frame: tracks[0]?.bestFrame ?? 0, serial: performance.now() });
      setNotice(tracks.length ? `Analysis complete. ${tracks.length} candidate plants are ready for your review.${limited ? ' Preview limit reached; coverage is partial.' : ''}` : 'No plants were detected in the sampled frames. Try a clearer, closer field clip.');
    } catch (error) {
      const canceled = error.name === 'AbortError';
      if (tracks.length) {
        updateSession({ ...target, plants: tracks, mode: 'partial', limited: true, completedFrames });
        setSelectedId(tracks[0].id); setActiveFrame(tracks[0].bestFrame);
        setSeekRequest({ sessionId: target.id, frame: tracks[0].bestFrame, serial: performance.now() });
      }
      setNotice(`${canceled ? 'Analysis canceled.' : error.message}${tracks.length ? ' Partial detections are preserved. Unclassified plants need review.' : ''}`);
    } finally { setWorking(false); }
  }

  const openUpload = () => { if (!working && !reading) { setModal('upload'); setUploadError(''); } };
  const openInventory = (nextFilter = 'all', nextView = 'table') => { setFilter(nextFilter); setView(nextView); setSidebar(false); requestAnimationFrame(() => inventoryRef.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })); };

  return <div className="gp-dashboard">
    <a className="gp-skip" href="#gp-main">Skip to analysis</a>
    <nav className="gp-rail" aria-label="Workspace navigation"><a href="/" className="gp-rail-brand" aria-label="GreenPoint home"><Leaf weight="fill" /></a><div className="gp-rail-main">{onMap && <IconButton label="Back to field map" onClick={onMap} disabled={working || reading}><MapTrifold /><span className="gp-rail-label">Field</span></IconButton>}<IconButton label="Field sessions" className={view === 'table' && filter === 'all' ? 'gp-rail-active' : ''} onClick={() => { setView('table'); setFilter('all'); if (window.innerWidth < 801) setSidebar(true); }}><SquaresFour /><span className="gp-rail-label">Sessions</span></IconButton><IconButton label="Frame atlas" className={view === 'atlas' ? 'gp-rail-active' : ''} onClick={() => openInventory('all', 'atlas')}><MapTrifold /><span className="gp-rail-label">Atlas</span></IconButton><IconButton label="Review queue" className={filter === 'uncertain' ? 'gp-rail-active' : ''} onClick={() => openInventory('uncertain')}><CheckSquare /><span className="gp-rail-label">Review</span>{stats.uncertain > 0 && <span className="gp-rail-count">{stats.uncertain}</span>}</IconButton></div><div className="gp-rail-bottom"><IconButton label="Connection settings" onClick={() => setModal('connection')}><GearSix /></IconButton><IconButton label="About GreenPoint" onClick={() => setModal('about')}><Question /></IconButton></div></nav>
    {sidebar && <button className="gp-sidebar-scrim" aria-label="Close field sessions" onClick={() => setSidebar(false)} />}
    <aside ref={sidebarRef} className={`gp-sessions ${sidebar ? 'gp-sessions-open' : ''}`} aria-label="Field sessions" role={sidebar ? 'dialog' : undefined} aria-modal={sidebar ? true : undefined}><a className="gp-brand" href="/">Green<span>Point</span><span className="gp-brand-dot" /></a><div className="gp-session-head"><span className="gp-section-label">WORKSPACE</span><h2>Field sessions</h2><p>A clearer view of every field.</p><button className="gp-new-session" onClick={openUpload} disabled={working || reading}><Plus size={17} />New session</button></div><div className="gp-sessions-list"><div className="gp-recent-label">RECENT SESSIONS<span>{sessions.length.toString().padStart(2, '0')}</span></div>{sessions.map(s => <button type="button" key={s.id} className={`gp-session-item ${session.id === s.id ? 'gp-session-active' : ''}`} aria-pressed={session.id === s.id} onClick={() => selectSession(s.id)} disabled={working || reading}><img src={s.image} alt="" /><span><b>{s.name}</b><span>{s.mode === 'sample' ? 'Illustrative sample' : s.mode === 'local' ? 'Local preview' : s.mode === 'partial' ? 'Partial analysis' : 'Analyzed'}<span className="gp-session-dot">·</span>{timecode(s.duration)}</span></span><CaretRight size={14} /></button>)}</div><div className="gp-session-bottom"><button className="gp-upload-card" onClick={openUpload} disabled={working || reading}><UploadSimple size={25} /><strong>Start with a field walk.</strong><span>Upload a short phone video.</span><span className="gp-upload-card-action">Upload video<ArrowUpRight size={16} /></span></button><button className="gp-connection-status" onClick={() => setModal('connection')}><span className={provider.configured ? 'gp-dot-on' : ''} />{provider.configured ? 'Analysis configured' : provider.checked ? 'Sample workspace' : 'Checking connection…'}<ArrowUpRight size={12} /></button><a className="gp-project-link" href="/">Explore GreenPoint<ArrowUpRight size={13} /></a></div></aside>
    <main id="gp-main" className="gp-main">
      <header className="gp-topbar"><div className="gp-breadcrumb"><IconButton label="Open field sessions" className="gp-mobile-menu" onClick={() => setSidebar(true)}><List /></IconButton><span>Workspace</span><CaretRight size={12} /><strong>Field intelligence</strong></div><div className="gp-top-actions"><span className="gp-prototype-note">RESEARCH PROTOTYPE</span><button className="gp-button gp-button-primary" onClick={openUpload} disabled={working || reading}><UploadSimple size={18} /><span>Upload video</span><ArrowUpRight size={17} /></button></div></header>
      <div className="gp-page-content"><div className="gp-page-heading"><div><h1>Field intelligence<span>.</span></h1><p>One walk. Every plant accounted for.</p></div><button className="gp-help-button" onClick={() => setModal('about')}><Question size={16} />How it works</button></div>
        <div className="gp-session-summary"><div className="gp-current-session"><span className="gp-section-label">CURRENT SESSION</span><h2>{session.name}</h2><span>{session.mode === 'sample' ? 'Illustrative dataset' : session.fileName}<span className="gp-summary-dot">/</span>{session.crop}</span></div><div className="gp-session-stats"><div><strong>{session.plants.length.toString().padStart(2, '0')}</strong><span>{session.mode === 'sample' ? 'Example plants' : 'Candidate plants'}</span></div><button className="gp-crop" onClick={() => openInventory('crop')}><Leaf size={16} /><b>{stats.crop.toString().padStart(2, '0')}</b><span>Crop</span></button><button className="gp-weed" onClick={() => openInventory('weed')}><Leaf size={16} weight="fill" /><b>{stats.weed.toString().padStart(2, '0')}</b><span>Weed</span></button><button className="gp-uncertain" onClick={() => openInventory('uncertain')}><WarningCircle size={16} /><b>{stats.uncertain.toString().padStart(2, '0')}</b><span>Review</span></button></div></div>
        {session.mode !== 'sample' && <div className={`gp-analysis-banner ${session.limited ? 'gp-analysis-partial' : ''}`}><div><Crosshair size={18} /><span>{session.mode === 'local' ? `${session.coverage}. Ready for analysis.` : `${session.completedFrames} of ${session.frames.length} sampled frames processed. Geometric identity linking is experimental.${session.limited ? ' Preview coverage is partial.' : ''}`}</span></div><button className="gp-button gp-button-secondary" disabled={working} onClick={() => runAnalysis()}>{working ? 'Analyzing…' : session.mode === 'local' ? 'Analyze video' : 'Run again'}<ArrowRight size={15} /></button></div>}
        {notice && <div className="gp-notice" role="status"><WarningCircle size={17} /><span>{notice}</span><IconButton label="Dismiss notification" onClick={() => setNotice('')}><X size={15} /></IconButton></div>}
        <div className="gp-analysis-grid"><div className="gp-analysis-primary"><VideoWorkspace session={session} selected={selectedId} onSelect={selectPlant} activeFrame={activeFrame} onFrame={setActiveFrame} seekRequest={seekRequest} masks={masks} setMasks={setMasks} filter={filter} working={working} progress={progress} onCancel={() => abortRef.current?.abort()} /><div ref={inventoryRef}><Inventory session={session} selected={selectedId} onSelect={selectPlant} filter={filter} setFilter={setFilter} view={view} setView={setView} search={search} setSearch={setSearch} onExport={exportInventory} onReset={resetSample} /></div></div><Inspector plant={selected} session={session} onReview={reviewPlant} onNext={nextPlant} onClose={() => setSelectedId(null)} working={working} /></div>
        <footer className="gp-dashboard-footer"><span>GreenPoint<span className="gp-footer-separator">/</span>Plant intelligence, with a human in the loop.</span><span>{session.mode === 'sample' ? 'Illustrative visuals & annotations' : 'Sampled video evidence'}<span className="gp-footer-separator">·</span>No treatment decisions automated</span></footer>
      </div>
    </main>
    {modal === 'upload' && <Modal title="A field walk is all it takes." onClose={closeUpload} wide><p className="gp-dialog-intro">Upload a short video. Find the plants. Review the evidence.</p><input ref={uploadInput} type="file" accept="video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.mov,.m4v,.webm" className="gp-sr-only" tabIndex="-1" onChange={e => { const file = e.target.files?.[0]; if (file) acceptFile(file); e.target.value = ''; }} /><button className={`gp-dropzone ${dragging ? 'gp-dropzone-dragging' : ''}`} disabled={reading} onClick={() => uploadInput.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length !== 1) setUploadError('Choose one field video at a time.'); else acceptFile(e.dataTransfer.files[0]); }}><UploadSimple size={31} /><strong>{reading ? 'Reading your field video…' : pending ? pending.fileName : 'Drop your field video here'}</strong><span>{reading ? `${progress.value}% · sampling frames locally` : pending ? 'Click to choose a different video' : 'or choose a file'}</span><small>MP4, MOV, M4V or WebM · up to 150 MB · 2 minutes</small>{reading && <progress max="100" value={progress.value} aria-label="Reading video progress" />}</button>{uploadError && <p className="gp-form-error" role="alert"><WarningCircle size={17} />{uploadError}</p>}{pending && <><div className="gp-upload-preview">{pending.frames.slice(0, 6).map((frame, i) => <img key={i} src={frame.image} alt={`Video preview ${i + 1}`} />)}</div><div className="gp-upload-form"><label>Session name<input maxLength="70" value={uploadName} onChange={e => setUploadName(e.target.value)} /></label><label>Planted crop<select value={uploadCrop} onChange={e => setUploadCrop(e.target.value)}>{CROPS.map(crop => <option key={crop}>{crop}</option>)}</select></label></div></>}<p className="gp-upload-privacy"><CheckSquare size={18} />Your video stays in this tab. Only sampled frames are sent to Meta when you start live analysis.</p>{!provider.configured && <div className="gp-connection-note"><WarningCircle size={18} /><span>Live analysis is not connected yet. You can preview your video or explore the sample session.</span></div>}<div className="gp-dialog-actions"><button className="gp-text-button" onClick={() => { closeUpload(); selectSession('sample-east-plot'); setSelectedId('GP-007'); }}>Explore sample<ArrowRight size={16} /></button><button className="gp-button gp-button-primary" disabled={!pending || reading} onClick={() => openUploaded(provider.configured && Boolean(accessCode))}>{provider.configured && accessCode ? 'Analyze video' : 'Open local preview'}<ArrowRight size={17} /></button></div></Modal>}
    {modal === 'connection' && <Modal title="Connections" onClose={() => setModal(null)}><Connections provider={provider} accessCode={accessCode} setAccessCode={setAccessCode} onCheck={checkConnection} onDone={() => { setModal(null); if (provider.configured && accessCode) setNotice('Access code set for this tab. Start analysis from your field video.'); }} /></Modal>}
    {modal === 'about' && <Modal title="Every judgment has a frame." onClose={() => setModal(null)}><p className="gp-dialog-intro">GreenPoint turns a short field video into a reviewable plant inventory. Built for growers managing scattered plots.</p><ol className="gp-about-steps"><li><span>01</span><div><h3>Bring a field walk.</h3><p>Upload a phone video. Up to 12 frames are sampled across the clip; your original stays local.</p></div></li><li><span>02</span><div><h3>Find plants. Keep the evidence.</h3><p>SAM 3.1 segments plants. Conservative geometric matching proposes identities between closely spaced frames. Sparse samples stay separate.</p></div></li><li><span>03</span><div><h3>Make the final call.</h3><p>Muse Spark suggests crop, weed or uncertain. Review the source image, change a label, then export the inventory.</p></div></li></ol><div className="gp-about-honesty"><strong>What you are seeing now</strong><p>The sample uses AI-generated imagery and 12 hand-authored records. It demonstrates the workflow, not measured model performance. Image coordinates are not GPS. The tracker and classification need field validation.</p></div><div className="gp-dialog-actions"><a className="gp-text-button" href="https://github.com/zipking1988/GreenPoint" target="_blank" rel="noreferrer">View project<ArrowUpRight size={16} /></a><button className="gp-button gp-button-primary" onClick={() => setModal(null)}>Back to the field<ArrowRight size={17} /></button></div></Modal>}
  </div>;
}
