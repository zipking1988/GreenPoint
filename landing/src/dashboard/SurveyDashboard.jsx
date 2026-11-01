import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { Leaf } from '@phosphor-icons/react/dist/csr/Leaf';
import { MapTrifold } from '@phosphor-icons/react/dist/csr/MapTrifold';
import { CheckSquare } from '@phosphor-icons/react/dist/csr/CheckSquare';
import { PlugsConnected } from '@phosphor-icons/react/dist/csr/PlugsConnected';
import { FilmStrip } from '@phosphor-icons/react/dist/csr/FilmStrip';
import { GearSix } from '@phosphor-icons/react/dist/csr/GearSix';
import { Question } from '@phosphor-icons/react/dist/csr/Question';
import { UploadSimple } from '@phosphor-icons/react/dist/csr/UploadSimple';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { Check } from '@phosphor-icons/react/dist/csr/Check';
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { Modal } from './Modal.jsx';
import { Connections } from './Connections.jsx';
import { FieldMap } from './FieldMap.jsx';
import { LABELS, csvText, downloadFile } from './data.js';
import { checkModelConfiguration, initialModelConnection, modelConnectionReducer } from './model-connection.js';
import {
  REVIEW_STORAGE,
  SURVEY_IMAGE,
  ZONES,
  nextUnreviewed,
  restoreSurvey,
  surveyPlants,
} from './survey-data.js';
import './dashboard.css';
import './survey-map.css';

const VideoDashboard = lazy(() => import('./Dashboard.jsx'));
const IMAGE_RATIO = 1355 / 1161;

function SourceCrop({ plant, photoRef }) {
  const [aspect, setAspect] = useState(1.35);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0)
        setAspect(entry.contentRect.width / entry.contentRect.height);
    });
    if (photoRef.current) observer.observe(photoRef.current);
    return () => observer.disconnect();
  }, [photoRef]);
  const [x, y, w, h] = plant.box;
  const cw = 0.18,
    ch = (cw * IMAGE_RATIO) / aspect;
  const left = Math.max(0, Math.min(1 - cw, x + w / 2 - cw / 2)),
    top = Math.max(0, Math.min(1 - ch, y + h / 2 - ch / 2));
  return (
    <figure className="sf-evidence-figure">
      <div
        className="sf-evidence-photo"
        ref={photoRef}
        data-source-plant={plant.id}
        data-source-box={plant.box.join(',')}
      >
        <img
          src={SURVEY_IMAGE}
          alt={`${plant.id}, cropped directly from the highlighted location in the illustrative field map`}
          style={{
            width: `${100 / cw}%`,
            left: `${(-left / cw) * 100}%`,
            top: `${(-top / ch) * 100}%`,
          }}
        />
        <div
          className={`sf-evidence-outline sf-outline-${plant.label}`}
          style={{
            left: `${((x - left) / cw) * 100}%`,
            top: `${((y - top) / ch) * 100}%`,
            width: `${(w / cw) * 100}%`,
            height: `${(h / ch) * 100}%`,
          }}
        >
          <span>
            {plant.id} · {LABELS[plant.label].short}
          </span>
        </div>
      </div>
      <figcaption>Illustrative evidence · Same source image</figcaption>
    </figure>
  );
}

function EvidencePanel({ plant, onClose, onSave, onNext, photoRef, panelRef, focusHeading }) {
  const [draft, setDraft] = useState(plant.label);
  const heading = useRef(null);
  useEffect(() => {
    if (focusHeading) heading.current?.focus({ preventScroll: true });
  }, [focusHeading]);
  const zone = ZONES.find((zone) => zone.id === plant.zone);
  return (
    <aside className="sf-evidence" aria-label="Plant evidence and review" ref={panelRef}>
      <div className="sf-evidence-heading">
        <span>{plant.zone} / SELECTED ZONE</span>
        <button type="button" aria-label="Close plant evidence" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <h2 className={`sf-zone-title sf-kind-${zone.kind}`}>
        <span />
        {zone.text}
      </h2>
      <SourceCrop plant={plant} photoRef={photoRef} />
      <div className="sf-specimen-heading">
        <h3 ref={heading} tabIndex={-1}>
          {plant.id}
        </h3>
        <span className={`sf-classification sf-kind-${plant.label}`}>
          <span />
          {LABELS[plant.label].text}
          {plant.reviewed && <Check size={15} aria-label="Reviewed" />}
        </span>
      </div>
      <p className="sf-reasoning">{plant.reasoning}</p>
      <form
        className="sf-decision-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(plant.id, draft);
        }}
      >
        <fieldset>
          <legend>Your decision</legend>
          <div className="sf-decisions">
            {[
              ['crop', 'Crop'],
              ['weed', 'Weed'],
              ['uncertain', 'Keep for review'],
            ].map(([value, text]) => (
              <label
                key={value}
                className={`sf-decision sf-kind-${value} ${draft === value ? 'sf-decision-selected' : ''}`}
              >
                <input
                  type="radio"
                  name={`decision-${plant.id}`}
                  value={value}
                  checked={draft === value}
                  onChange={() => setDraft(value)}
                />
                <span>{text}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="gp-button gp-button-primary sf-save">
          Save & next
          <ArrowRight size={19} />
        </button>
      </form>
      <p className="sf-review-note">
        {plant.reviewed
          ? 'Human reviewed · Saved in this browser'
          : 'Example decisions / No hardware action'}
      </p>
      <div className="sf-plant-navigation">
        <button type="button" aria-label="Previous plant" onClick={() => onNext(-1)}>
          <ArrowLeft size={20} />
          <span>Previous plant</span>
        </button>
        <button type="button" aria-label="Next plant" onClick={() => onNext(1)}>
          <span>Next plant</span>
          <ArrowRight size={20} />
        </button>
      </div>
      <p className="sf-position-note">Position: Image coordinates only</p>
    </aside>
  );
}

function EvidenceConnector({ rootRef, sourceRef, photoRef, revision, selected }) {
  const canvas = useRef(null);
  useLayoutEffect(() => {
    const draw = () => {
      const node = canvas.current,
        root = rootRef.current,
        source = sourceRef.current,
        photo = photoRef.current;
      if (!node || !root) return;
      const bounds = root.getBoundingClientRect(),
        ratio = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(bounds.width * ratio);
      const pixelHeight = Math.round(bounds.height * ratio);
      if (node.width !== pixelWidth) node.width = pixelWidth;
      if (node.height !== pixelHeight) node.height = pixelHeight;
      const ctx = node.getContext('2d');
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, bounds.width, bounds.height);
      if (!source || !photo || !selected || window.innerWidth < 1000 || !bounds.width) {
        node.dataset.connected = 'false';
        return;
      }
      const start = source.getBoundingClientRect(),
        end = photo.getBoundingClientRect(),
        map = source.parentElement.getBoundingClientRect(),
        pane = photo.closest('.sf-evidence').getBoundingClientRect();
      const x1 = start.right - bounds.left,
        y1 = start.top + start.height / 2 - bounds.top,
        x2 = end.left - bounds.left,
        y2 = end.top + end.height / 2 - bounds.top;
      if (
        end.top + end.height / 2 < pane.top ||
        end.top + end.height / 2 > pane.bottom ||
        start.right < map.left ||
        start.left > map.right ||
        start.bottom < map.top ||
        start.top > map.bottom ||
        x1 >= x2 - 8
      ) {
        node.dataset.connected = 'false';
        return;
      }
      const bend = x2 - 20;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(bend, y1);
      ctx.lineTo(x2, y2);
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#111513b3';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.strokeStyle = '#d3fa79';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x2, y2, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#d3fa79';
      ctx.fill();
      node.dataset.connected = 'true';
      node.dataset.plant = selected;
      node.dataset.start = `${x1.toFixed(2)},${y1.toFixed(2)}`;
      node.dataset.end = `${x2.toFixed(2)},${y2.toFixed(2)}`;
    };
    draw();
    const observer = new ResizeObserver(draw);
    if (rootRef.current) observer.observe(rootRef.current);
    if (photoRef.current) observer.observe(photoRef.current);
    let active = true;
    document.fonts.ready.then(() => {
      if (active) draw();
    });
    window.addEventListener('resize', draw);
    window.addEventListener('scroll', draw, { passive: true, capture: true });
    return () => {
      active = false;
      observer.disconnect();
      window.removeEventListener('resize', draw);
      window.removeEventListener('scroll', draw, true);
    };
  }, [rootRef, sourceRef, photoRef, revision, selected]);
  return <canvas className="sf-evidence-connector" ref={canvas} aria-hidden="true" />;
}

function FieldDashboard({ active, onVideo, provider, accessCode, setAccessCode, checkConnection }) {
  const [plants, setPlants] = useState(() => {
    try {
      return restoreSurvey(localStorage);
    } catch {
      return surveyPlants();
    }
  });
  const [selectedId, setSelectedId] = useState('GP-007');
  const [layer, setLayer] = useState('weed');
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const [focusHeading, setFocusHeading] = useState(false);
  const workspace = useRef(null),
    source = useRef(null),
    photo = useRef(null),
    panel = useRef(null);
  const selected = plants.find((plant) => plant.id === selectedId);
  const geometry = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    if (!active) setModal(null);
  }, [active]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  function selectPlant(id, focus = false) {
    setSelectedId(id);
    setFocusHeading(focus);
    if (layer === 'coverage') setLayer('evidence');
    if (window.innerWidth < 1000)
      requestAnimationFrame(() =>
        panel.current?.scrollIntoView({
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
          block: 'start',
        }),
      );
  }
  function selectZone(id) {
    const zone = ZONES.find((zone) => zone.id === id);
    const candidates = plants.filter((plant) => zone.plants.includes(plant.id));
    selectPlant(
      (
        candidates.find((plant) => !plant.reviewed && plant.label === 'uncertain') ??
        candidates.find((plant) => !plant.reviewed) ??
        candidates[0]
      ).id,
    );
  }
  function nextPlant(direction) {
    const i = plants.findIndex((plant) => plant.id === selectedId);
    selectPlant(plants[(i + direction + plants.length) % plants.length].id);
  }
  function save(id, label) {
    const next = plants.map((plant) =>
      plant.id === id ? { ...plant, label, reviewed: true } : plant,
    );
    setPlants(next);
    try {
      localStorage.setItem(
        REVIEW_STORAGE,
        JSON.stringify(
          Object.fromEntries(
            next.map((plant) => [plant.id, { label: plant.label, reviewed: plant.reviewed }]),
          ),
        ),
      );
    } catch {
      setNotice('Browser storage is unavailable. Export CSV to keep your decisions.');
    }
    const nextId = nextUnreviewed(next, id);
    if (nextId) selectPlant(nextId);
    else setNotice('All 12 example plants reviewed. Export your decisions from the Review queue.');
  }
  function reset() {
    setPlants(surveyPlants());
    setSelectedId('GP-007');
    setLayer('weed');
    try {
      localStorage.removeItem(REVIEW_STORAGE);
    } catch {
      /* In-memory reset still works. */
    }
    setNotice('Illustrative decisions reset.');
  }
  function exportRecords() {
    downloadFile(
      csvText({ id: 'illustrative-field-map', plants, mode: 'illustrative-map' }),
      'greenpoint-illustrative-map-review.csv',
      'text/csv;charset=utf-8',
    );
    setNotice(
      'Exported image-relative example records. This file contains no GPS or navigation instructions.',
    );
  }
  function closeEvidence() {
    setSelectedId(null);
    requestAnimationFrame(() =>
      document.querySelector('.sf-map-stage')?.focus({ preventScroll: true }),
    );
  }
  return (
    <div className="gp-dashboard sf-dashboard">
      <a className="gp-skip" href="#sf-main">
        Skip to field map
      </a>
      <nav className="sf-rail" aria-label="Workspace navigation">
        <a className="sf-rail-brand" href="/" aria-label="GreenPoint home">
          <Leaf size={25} weight="fill" />
        </a>
        <div className="sf-rail-main">
          <button
            type="button"
            className="sf-rail-active"
            aria-label="Field map"
            aria-current="page"
            onClick={() => {
              setLayer('weed');
              if (!selectedId) selectPlant('GP-007');
            }}
          >
            <MapTrifold size={25} />
            <span>Field</span>
          </button>
          <button type="button" aria-label="Review queue" onClick={() => setModal('review')}>
            <CheckSquare size={25} />
            <span>Review</span>
          </button>
          <button type="button" aria-label="Robots and agents" onClick={() => setModal('agents')}>
            <PlugsConnected size={25} />
            <span>Agents</span>
          </button>
          <button type="button" aria-label="Video sessions" onClick={() => onVideo(false)}>
            <FilmStrip size={24} />
            <span>Video</span>
          </button>
        </div>
        <div className="sf-rail-bottom">
          <button
            type="button"
            aria-label="Connection settings"
            onClick={() => setModal('connection')}
          >
            <GearSix size={24} />
          </button>
          <button type="button" aria-label="About the field map" onClick={() => setModal('about')}>
            <Question size={24} />
          </button>
        </div>
      </nav>
      <main className="sf-main" id="sf-main">
        <header className="sf-header">
          <div>
            <a href="/" className="sf-wordmark">
              Green<span>Point.</span>
            </a>
            <h1>Kashiwa / East plot</h1>
            <p>Illustrative survey</p>
          </div>
          <button
            type="button"
            className="sf-upload"
            aria-label="Upload footage"
            onClick={() => onVideo(true)}
          >
            <UploadSimple size={20} />
            <span>Upload footage</span>
          </button>
        </header>
        {notice && (
          <div className="sf-notice" role="status">
            <span>{notice}</span>
            <button type="button" aria-label="Dismiss notification" onClick={() => setNotice('')}>
              <X size={18} />
            </button>
          </div>
        )}
        <div className={`sf-workspace ${!selected ? 'sf-workspace-expanded' : ''}`} ref={workspace}>
          <FieldMap
            plants={plants}
            selected={selected}
            layer={layer}
            onLayer={setLayer}
            onSelect={selectPlant}
            onZone={selectZone}
            onUnobserved={() => setModal('unobserved')}
            sourceRef={source}
            onGeometry={geometry}
          />
          {selected && (
            <EvidencePanel
              key={`${selected.id}-${selected.label}-${selected.reviewed}`}
              plant={selected}
              onClose={closeEvidence}
              onSave={save}
              onNext={nextPlant}
              photoRef={photo}
              panelRef={panel}
              focusHeading={focusHeading}
            />
          )}
          <EvidenceConnector
            rootRef={workspace}
            sourceRef={source}
            photoRef={photo}
            revision={revision}
            selected={selected?.id}
          />
        </div>
        <footer className="sf-footer">
          <span>Illustrative map & annotations · Not georeferenced</span>
          <button type="button" onClick={() => setModal('about')}>
            GPS unavailable
            <Question size={14} />
          </button>
        </footer>
      </main>
      {active && (modal === 'connection' || modal === 'agents') && (
        <Modal title="Connections" onClose={() => setModal(null)}>
          <Connections
            initialTab={modal === 'agents' ? 'robots' : 'models'}
            provider={provider}
            accessCode={accessCode}
            setAccessCode={setAccessCode}
            onCheck={checkConnection}
            onDone={() => setModal(null)}
          />
        </Modal>
      )}
      {active && modal === 'about' && (
        <Modal title="From field to evidence." onClose={() => setModal(null)}>
          <p className="gp-dialog-intro">
            Explore a whole plot, select an example hotspot, then review the plant in its original
            image.
          </p>
          <div className="sf-about-copy">
            <h3>What this map shows</h3>
            <p>
              AI-generated field artwork with 12 hand-authored plant examples and illustrative
              regions. Colors do not represent measured weed cover or model accuracy.
            </p>
            <h3>What a drone needs</h3>
            <p>
              A georeferenced survey, camera calibration and verified position accuracy are needed
              to place detections on real land. This image has no GPS, metric scale or navigation
              coordinates.
            </p>
            <h3>Your footage and agents</h3>
            <p>
              Video sessions retain their existing analysis and source-frame review. MCP returns
              image-relative perception; it does not expose this browser’s map decisions or control
              machinery.
            </p>
          </div>
          <div className="gp-dialog-actions">
            <button
              className="gp-text-button"
              onClick={() => {
                setModal(null);
                onVideo(false);
              }}
            >
              Open video sessions
              <ArrowRight size={16} />
            </button>
            <button className="gp-button gp-button-primary" onClick={() => setModal(null)}>
              Back to the field
            </button>
          </div>
        </Modal>
      )}
      {active && modal === 'unobserved' && (
        <Modal title="This area needs a view." onClose={() => setModal(null)}>
          <p className="gp-dialog-intro">
            Not observed means we have no usable evidence for this example area. It does not mean
            there are no weeds.
          </p>
          <p className="sf-dialog-copy">
            For real surveys, collect clearer imagery and location data before assigning a zone or
            sending a device there.
          </p>
          <div className="gp-dialog-actions">
            <button className="gp-button gp-button-primary" onClick={() => setModal(null)}>
              Back to map
            </button>
          </div>
        </Modal>
      )}
      {active && modal === 'review' && (
        <Modal title="Every decision keeps its source." wide onClose={() => setModal(null)}>
          <p className="gp-dialog-intro">
            {plants.filter((plant) => plant.reviewed).length} of 12 example plants human reviewed.
            Decisions stay in this browser.
          </p>
          <div className="sf-review-list">
            {plants.map((plant) => (
              <button
                type="button"
                key={plant.id}
                onClick={() => {
                  setModal(null);
                  selectPlant(plant.id, true);
                }}
              >
                <strong>{plant.id}</strong>
                <span>{plant.zone}</span>
                <span className={`sf-kind-${plant.label}`}>{LABELS[plant.label].text}</span>
                <span>
                  {plant.reviewed ? <Check size={18} aria-label="Reviewed" /> : 'Pending'}
                </span>
                <ArrowRight size={17} />
              </button>
            ))}
          </div>
          <div className="gp-dialog-actions">
            <button className="gp-text-button" onClick={reset}>
              <ArrowCounterClockwise size={16} />
              Reset example
            </button>
            <button className="gp-button gp-button-primary" onClick={exportRecords}>
              <DownloadSimple size={17} />
              Export CSV
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function SurveyDashboard() {
  const [entry] = useState(() => {
    const parameters = new URLSearchParams(window.location.search);
    const view = parameters.get('view') === 'video' ? 'video' : 'map';
    return { view, upload: view === 'video' && parameters.get('upload') === '1' };
  });
  const [workspace, setWorkspace] = useState(entry.view);
  const [videoOpened, setVideoOpened] = useState(entry.view === 'video');
  useEffect(() => {
    document.title = workspace === 'video' ? 'Field intelligence · GreenPoint' : 'Field map · GreenPoint';
  }, [workspace]);
  useEffect(() => {
    const restore = () => {
      const view = new URLSearchParams(window.location.search).get('view') === 'video' ? 'video' : 'map';
      if (view === 'video') setVideoOpened(true);
      document.querySelectorAll('.gp-video-stage video').forEach(video => video.pause());
      setWorkspace(view);
    };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);
  const [connection, dispatchConnection] = useReducer(modelConnectionReducer, initialModelConnection);
  const accessCodeRef = useRef('');
  const abortRef = useRef(null);
  const setAccessCode = useCallback((value) => {
    if (value === accessCodeRef.current) return;
    accessCodeRef.current = value;
    abortRef.current?.abort();
    dispatchConnection({ type: 'access-code', value });
  }, []);
  const checkConnection = useCallback(() => checkModelConfiguration(dispatchConnection), []);
  useEffect(() => { checkConnection(); }, [checkConnection]);
  const [uploadRequest, setUploadRequest] = useState(entry.upload ? 1 : 0);
  function navigate(view) {
    if (view === 'video') setVideoOpened(true);
    document.querySelectorAll('.gp-video-stage video').forEach(video => video.pause());
    setWorkspace(view);
    const url = new URL(window.location.href);
    url.searchParams.delete('upload');
    if (view === 'map') url.searchParams.delete('view');
    else url.searchParams.set('view', view);
    if (url.href !== window.location.href) window.history.pushState(null, '', url);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function openVideo(upload) {
    navigate('video');
    if (upload) setUploadRequest((value) => value + 1);
  }
  return (
    <>
      <div hidden={workspace !== 'map'}>
        <FieldDashboard active={workspace === 'map'} onVideo={openVideo} provider={connection} accessCode={connection.accessCode} setAccessCode={setAccessCode} checkConnection={checkConnection} />
      </div>
      {videoOpened && (
        <div hidden={workspace !== 'video'}>
          <Suspense
            fallback={
              <div className="sf-opening" role="status">
                Opening video workspace…
              </div>
            }
          >
            <VideoDashboard
              active={workspace === 'video'}
              connection={connection}
              dispatchConnection={dispatchConnection}
              abortRef={abortRef}
              setAccessCode={setAccessCode}
              onMap={() => navigate('map')}
              uploadRequest={uploadRequest}
            />
          </Suspense>
        </div>
      )}
    </>
  );
}
