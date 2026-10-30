import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { ArrowsOut } from '@phosphor-icons/react/dist/csr/ArrowsOut';
import { Play } from '@phosphor-icons/react/dist/csr/Play';
import { Pause } from '@phosphor-icons/react/dist/csr/Pause';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { Minus } from '@phosphor-icons/react/dist/csr/Minus';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { List } from '@phosphor-icons/react/dist/csr/List';
import { Leaf } from '@phosphor-icons/react/dist/csr/Leaf';
import { Crosshair } from '@phosphor-icons/react/dist/csr/Crosshair';
import { MeasuredCopy } from './MeasuredCopy.jsx';
import { evaluation, faqs, pipeline, samplePlants } from './content.js';
import './styles.css';

const asset = name => `/assets/${name}.webp`;
const frames = ['001', '008', '016'];

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

function Brand() {
  return <span className="brand">Green<span>Point</span></span>;
}

function Legend({ vertical = false }) {
  return <ul className={`legend ${vertical ? 'legend-vertical' : ''}`} aria-label="Plant categories">
    <li className="crop"><Leaf weight="fill" aria-hidden="true" />Crop</li>
    <li className="weed"><Leaf weight="fill" aria-hidden="true" />Weed</li>
    <li className="review"><Leaf weight="fill" aria-hidden="true" />Needs review</li>
  </ul>;
}

function TrackingExperience({ playRequest, reducedMotion }) {
  const [progress, setProgress] = useState(reducedMotion ? 100 : 0);
  const [playing, setPlaying] = useState(false);
  const progressRef = useRef(progress);
  const handledRequest = useRef(0);
  const stage = Math.min(2, Math.floor(progress / 34));
  progressRef.current = progress;

  useEffect(() => {
    if (!playRequest || handledRequest.current === playRequest) return;
    handledRequest.current = playRequest;
    const startProgress = reducedMotion ? 100 : 0;
    progressRef.current = startProgress;
    setProgress(startProgress);
    setPlaying(!reducedMotion);
  }, [playRequest, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) { setPlaying(false); setProgress(100); }
  }, [reducedMotion]);

  useEffect(() => {
    if (!playing) return;
    let frame;
    let previousUpdate = 0;
    const start = performance.now() - progressRef.current * 85;
    const tick = now => {
      const next = Math.min(100, (now - start) / 85);
      if (now - previousUpdate >= 65 || next === 100) {
        setProgress(next);
        previousUpdate = now;
      }
      if (next === 100) setPlaying(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, playRequest]);

  function togglePlayback() {
    if (reducedMotion) { setProgress(100); return; }
    if (progress >= 100) setProgress(0);
    setPlaying(!playing);
  }

  return <section id="approach" className="tracking section-wrap" aria-labelledby="tracking-title">
    <div className="section-heading tracking-heading">
      <h2 id="tracking-title">Count the plant.<br /><span>Not every frame.</span></h2>
      <MeasuredCopy className="section-copy">A moving camera sees the same plant again and again. Linking those views is what turns a video into an inventory.</MeasuredCopy>
    </div>
    <div className="tracking-toolbar"><span className="technical-label">SIMULATED TRACKING EXPLANATION</span><span className="technical-label">ONE SCENE / THREE OBSERVATIONS</span></div>
    <div className="tracking-workspace">
      <div className="observation-strip">
        {frames.map((frame, i) => <button key={frame} className={`observation ${stage === i ? 'is-active' : ''}`} aria-label={`View observation ${i + 1}, frame ${frame}`} aria-pressed={stage === i} onClick={() => { setPlaying(false); setProgress(i * 42); }}>
          <div className="observation-image"><img src={asset('tracking-plant')} alt={`Illustrative repeated view ${i + 1} of the same broadleaf plant.`} loading="lazy" style={{ left: `${-13 - i * 7}%`, top: `${-17 + i * 2}%` }} /><span className="observation-id"><Crosshair aria-hidden="true" />GP-007</span></div>
          <span className="observation-caption"><span>FRAME {frame}</span><span>{i === stage ? 'Selected view' : 'View observation'}<ArrowUpRight aria-hidden="true" /></span></span>
        </button>)}
      </div>
      <div className="identity-result"><span className="technical-label">PLANT IDENTITY</span><strong>GP-007</strong><span className="identity-rule" /><p><b>{stage + 1}</b> {stage === 0 ? 'observation' : 'observations'}<ArrowRight aria-hidden="true" /><b>1</b> identity</p><span className="identity-note">The same plant.<br />A consistent identity.</span><span className="concept-label">Illustrative example</span></div>
    </div>
    <div className="playback-controls">
      <button className="icon-button playback-button" aria-label={playing ? 'Pause tracking explanation' : progress >= 100 ? 'Replay tracking explanation' : 'Play tracking explanation'} onClick={togglePlayback}>{playing ? <Pause weight="fill" /> : progress >= 100 ? <ArrowCounterClockwise /> : <Play weight="fill" />}</button>
      <label className="sr-only" htmlFor="tracking-progress">Tracking explanation progress</label>
      <input id="tracking-progress" type="range" min="0" max="100" value={Math.round(progress)} aria-valuetext={`Observation ${stage + 1} of 3, ${Math.round(progress)} percent`} onChange={event => { setPlaying(false); setProgress(Number(event.target.value)); }} style={{ '--progress': `${progress}%` }} />
      <span className="time-label">{progress >= 100 ? 'LINKED' : `0${stage + 1} / 03`}</span>
      <a className="text-link" href="#field-atlas">Field atlas<ArrowRight aria-hidden="true" /></a>
    </div>
    <p className="caption tracking-note">Camera views are simulated over the same illustrative image. This explains identity linking; it is not measured model output.</p>
  </section>;
}

function FieldAtlas({ onExpand }) {
  const [selectedId, setSelectedId] = useState(samplePlants[0].id);
  const [filter, setFilter] = useState('all');
  const selected = samplePlants.find(plant => plant.id === selectedId);
  const visiblePlants = filter === 'all' ? samplePlants : samplePlants.filter(plant => plant.label === 'Needs review');

  function filterPlants(value) {
    setFilter(value);
    if (value === 'review' && selected.label !== 'Needs review') setSelectedId(samplePlants[0].id);
  }
  function downloadSample() {
    const rows = [
      'sample_id,label,x_normalized,y_normalized,coordinate_system,suggested_action,source',
      ...samplePlants.map(plant => `${plant.id},${plant.label},${(plant.x / 100).toFixed(3)},${(plant.y / 100).toFixed(3)},normalized_image,${plant.action},illustrative_sample`),
    ];
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'greenpoint-illustrative-plant-inventory.csv';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section id="field-atlas" className="atlas section-wrap" aria-labelledby="atlas-title">
    <div className="section-heading atlas-heading"><div><h2 id="atlas-title">Every plant<br className="mobile-only" /> has a place.</h2><MeasuredCopy className="section-copy">Turn a simple phone video into a field map.</MeasuredCopy></div><button className="text-link expand-map" onClick={onExpand}>View full map<ArrowsOut aria-hidden="true" /></button></div>
    <div className="atlas-toolbar"><div className="map-filters" role="group" aria-label="Show illustrative plant samples"><button aria-pressed={filter === 'all'} onClick={() => filterPlants('all')}>All sample plants<span>04</span></button><button aria-pressed={filter === 'review'} onClick={() => filterPlants('review')}>Needs review<span>02</span></button></div><span className="technical-label">ILLUSTRATIVE FIELD ATLAS</span></div>
    <p className="map-hint"><Crosshair aria-hidden="true" />Each label marks one plant. Select a label to inspect it.</p>
    <figure className="atlas-figure">
      <div className="map-image-wrap"><img src={asset('field-map')} alt="Complete illustrative vegetable plot with all field boundaries visible and individual plants highlighted in green, coral and amber." width="1586" height="992" loading="lazy" />
        <div className="map-legend"><Legend vertical /></div>
        {visiblePlants.map(plant => <button key={plant.id} className={`plant-marker marker-${plant.id.toLowerCase()} ${plant.label === 'Crop' ? 'crop' : plant.label === 'Weed' ? 'weed' : 'review'} ${plant.id === selectedId ? 'is-selected' : ''}`} style={{ left: `${plant.x}%`, top: `${plant.y}%` }} aria-label={`Inspect ${plant.id}, ${plant.label}`} aria-controls="selected-plant-detail" aria-pressed={plant.id === selectedId} onClick={() => setSelectedId(plant.id)}><Crosshair weight="regular" aria-hidden="true" /><span className="marker-callout"><span className="marker-category">{plant.label}<ArrowUpRight aria-hidden="true" /></span><span className="marker-id">{plant.id}</span></span></button>)}
        <span className="map-source">Illustrative concept · not live analysis</span>
      </div>
      <figcaption id="selected-plant-detail" className="plant-inspector"><div className="plant-identity"><span className="technical-label">SELECTED SAMPLE</span><strong>{selected.id}</strong></div><div className="plant-detail" aria-live="polite"><span className={`plant-label ${selected.label === 'Crop' ? 'crop' : selected.label === 'Weed' ? 'weed' : 'review'}`}><Leaf weight="fill" aria-hidden="true" />{selected.label}</span><p>{selected.note}</p></div><button className="text-link" onClick={downloadSample}>Sample CSV<DownloadSimple aria-hidden="true" /></button></figcaption>
    </figure>
    <div className="atlas-footnote"><span className="caption">Select a marked sample to inspect its suggested label. Four illustrative records, not a count of this field.</span><span className="caption">Image-relative coordinates / human review</span></div>
  </section>;
}

function Architecture() {
  const [active, setActive] = useState(0);
  const stage = pipeline[active];
  return <section className="architecture section-wrap" aria-labelledby="architecture-title">
    <div className="section-heading"><h2 id="architecture-title">A clear chain<br />of reasoning.</h2><span className="technical-label">PROPOSED PIPELINE / META MODEL API</span></div>
    <div className="pipeline-tabs" role="tablist" aria-label="Proposed pipeline stages">{pipeline.map((item, i) => <button key={item.name} id={`pipeline-tab-${i}`} role="tab" aria-selected={active === i} aria-controls="pipeline-detail" tabIndex={active === i ? 0 : -1} onKeyDown={event => { if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (active + (event.key === 'ArrowRight' ? 1 : 2)) % 3; setActive(next); document.getElementById(`pipeline-tab-${next}`).focus(); } }} onClick={() => setActive(i)}><span className="pipeline-number">0{i + 1}</span><span><span className="pipeline-title">{item.verb}<span> / {item.name}</span></span><span className="pipeline-short">{item.short}</span></span><ArrowRight className="pipeline-arrow" aria-hidden="true" /></button>)}</div>
    <div id="pipeline-detail" className="pipeline-detail" role="tabpanel" aria-labelledby={`pipeline-tab-${active}`} tabIndex="0"><div><span className="technical-label">{stage.output}</span><MeasuredCopy>{stage.detail}</MeasuredCopy>{stage.url && <a className="source-link" href={stage.url} target="_blank" rel="noreferrer">{stage.link}<ArrowUpRight aria-hidden="true" /></a>}</div><div className="review-principle"><span className="technical-label">HUMAN JUDGMENT STAYS IN THE LOOP</span><p>Crop. Weed.<br /><span>Or, “let’s take a closer look.”</span></p></div></div>
  </section>;
}

function Research() {
  return <section id="research" className="research section-wrap" aria-labelledby="research-title">
    <div className="section-heading"><h2 id="research-title">Designed to be tested.</h2><MeasuredCopy className="section-copy">Public-data evaluation first. Real-field validation next.</MeasuredCopy></div>
    <div className="evaluation-table" role="table" aria-label="Planned model evaluation, no results published">
      <div className="evaluation-row evaluation-head" role="row"><span role="columnheader">STAGE</span><span role="columnheader">WHAT WE’LL MEASURE</span><span role="columnheader">STATUS</span><span role="columnheader">METHOD</span></div>
      {evaluation.map(item => <div className="evaluation-row" role="row" key={item.name}><strong role="cell">{item.name}</strong><span role="cell">{item.metric}</span><span className="planned-status" role="cell">Planned</span><span className="evaluation-method" role="cell">{item.method}</span></div>)}
    </div>
    <div className="research-bottom"><MeasuredCopy className="research-note">The evaluation plan includes WeedMap and AgML public datasets, subject to license checks. Synthetic walk-throughs will be clearly labeled. No accuracy or pesticide-saving results are claimed here.</MeasuredCopy><a href="https://arxiv.org/abs/1808.00100" className="source-link" target="_blank" rel="noreferrer">WeedMap paper<ArrowUpRight aria-hidden="true" /></a></div>
    <div className="readiness"><div><span className="readiness-status">AVAILABLE HERE</span><strong>Interactive concept</strong></div><div><span className="readiness-status">PLANNED</span><strong>Model pipeline</strong></div><div><span className="readiness-status">NEXT</span><strong>Real-field trials</strong></div></div>
  </section>;
}

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [playRequest, setPlayRequest] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const systemReducedMotion = useReducedMotion();
  const [motionReduced, setMotionReduced] = useState(false);
  const reducedMotion = systemReducedMotion || motionReduced;
  const mapDialog = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full';
    return () => { delete document.documentElement.dataset.motion; };
  }, [reducedMotion]);

  useEffect(() => {
    let observer;
    const observeSections = () => {
      observer?.disconnect();
      // Vertical percentage margins resolve against width; use viewport height.
      const height = window.innerHeight;
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id === 'top' ? '' : entry.target.id);
        });
      }, { rootMargin: `-${height * 0.15}px 0px -${height * 0.55}px 0px` });
      ['top', 'approach', 'field-atlas', 'research'].forEach(id => observer.observe(document.getElementById(id)));
    };
    observeSections();
    window.addEventListener('resize', observeSections);
    return () => { window.removeEventListener('resize', observeSections); observer.disconnect(); };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = event => { if (event.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  useEffect(() => {
    if (mapOpen && !mapDialog.current.open) mapDialog.current.showModal();
    if (!mapOpen && mapDialog.current.open) mapDialog.current.close();
    if (!mapOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [mapOpen]);

  function explore() {
    document.getElementById('approach').scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth' });
    setPlayRequest(value => value + 1);
  }
  const navigation = [['approach', 'The approach'], ['field-atlas', 'Field atlas'], ['research', 'Research']];

  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="masthead"><div className="header-inner"><a href="#top" aria-label="GreenPoint home"><Brand /></a><span className="prototype-label">Research prototype</span><nav className="desktop-nav" aria-label="Main navigation">{navigation.map(([id, text]) => <a key={id} href={`#${id}`} aria-current={activeSection === id ? 'location' : undefined}>{text}</a>)}<a href="/dashboard" className="dashboard-link">Open workspace<ArrowUpRight size={15} /></a></nav><button className="icon-button mobile-menu-button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <List />}</button></div>{menuOpen && <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">{navigation.map(([id, text]) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{text}<ArrowRight /></a>)}<a href="/dashboard">Open workspace<ArrowUpRight /></a><span>Research prototype</span></nav>}</header>
    <main id="main-content">
      <section id="top" className="hero" aria-labelledby="hero-title"><img className="hero-image" src={asset('vision-field')} alt="Illustrative young crop rows on dark soil, with individual crop and weed leaves highlighted." width="1495" height="1052" fetchPriority="high" /><div className="hero-content section-wrap"><div className="hero-copy"><p className="hero-kicker">A NEW VIEW OF SMALLER FIELDS</p><h1 id="hero-title">See the field.<br /><span>Plant by plant.</span></h1><MeasuredCopy className="hero-description">A phone-first approach to turning a field walk into a reviewable weed map.</MeasuredCopy><button className="primary-button" onClick={explore}>Explore the walkthrough<ArrowRight aria-hidden="true" /></button></div><div className="hero-legend"><Legend vertical /></div><span className="hero-specimen"><Crosshair aria-hidden="true" /><span>GP-007<span>One plant. One identity.</span></span></span><span className="hero-disclosure">Illustrative concept · not live analysis</span></div></section>
      <div className="hero-bottom section-wrap"><span>PHONE VIDEO</span><span className="hero-path">Individual plants<ArrowRight aria-hidden="true" />Persistent identity<ArrowRight aria-hidden="true" />Field map</span><a href="#approach" aria-label="Explore the approach"><ArrowRight /></a></div>
      <section className="problem section-wrap" aria-labelledby="problem-title"><div className="problem-copy"><h2 id="problem-title">Small fields.<br /><span>Big blind spots.</span></h2><MeasuredCopy className="section-copy">When a team manages scattered plots, finding individual weeds takes close attention. Broad treatment starts with an incomplete picture of what is actually growing.</MeasuredCopy><p className="audience-line">For Japanese growers and field-service teams.</p></div><div className="problem-visual"><figure><img src={asset('field-walk')} width="1642" height="958" alt="Illustrative small Japanese farm plots and a farmer using an ordinary phone." loading="lazy" /><figcaption className="caption">A familiar field walk. A different way to see it. / Illustrative visual</figcaption></figure><div className="policy-note"><p>Japan’s MIDORI Strategy targets a <strong>50% reduction in risk-weighted chemical pesticide use by 2050.</strong> Better plant-level information is one direction worth exploring.</p><a className="source-link" href="https://www.maff.go.jp/e/policies/env/env_policy/midori.html" target="_blank" rel="noreferrer">MAFF / MIDORI Strategy<ArrowUpRight aria-hidden="true" /></a><span className="caption">A national policy target, not a GreenPoint performance result.</span></div></div></section>
      <TrackingExperience playRequest={playRequest} reducedMotion={reducedMotion} />
      <FieldAtlas onExpand={() => setMapOpen(true)} />
      <Architecture />
      <Research />
      <section className="faq section-wrap" aria-labelledby="faq-title"><h2 id="faq-title">A closer look.</h2><div className="faq-list">{faqs.map(item => <details key={item.q}><summary>{item.q}<Plus className="faq-plus" aria-hidden="true" /><Minus className="faq-minus" aria-hidden="true" /></summary><MeasuredCopy>{item.a}</MeasuredCopy></details>)}</div></section>
      <section className="closing" aria-labelledby="closing-title"><img src={asset('vision-field')} alt="" loading="lazy" width="1495" height="1052" /><div className="section-wrap closing-inner"><h2 id="closing-title">Start with<br />a <span>walk.</span></h2><p>Precision should travel lighter.</p><button className="primary-button" onClick={explore}>Explore the walkthrough<ArrowRight aria-hidden="true" /></button></div></section>
    </main>
    <footer className="footer section-wrap"><div className="footer-top"><a href="#top" aria-label="GreenPoint back to top"><Brand /></a><span>Small fields. A clearer view.</span></div><div className="footer-bottom"><span>© 2026 GreenPoint / Independent research prototype</span><button className="motion-toggle" aria-label="Reduce page motion" aria-pressed={reducedMotion} disabled={systemReducedMotion} onClick={() => setMotionReduced(value => !value)}>Motion {reducedMotion ? 'reduced' : 'on'}</button><span>Illustrative AI visuals. Human review in the approach.</span></div></footer>
    <dialog className="map-dialog" ref={mapDialog} aria-labelledby="map-dialog-title" onCancel={() => setMapOpen(false)} onClose={() => setMapOpen(false)} onClick={event => { if (event.target === event.currentTarget) setMapOpen(false); }}>
      {mapOpen && <div className="dialog-surface"><div className="dialog-header"><div><span className="technical-label">GREENPOINT / FIELD ATLAS</span><h2 id="map-dialog-title">Every plant has a place.</h2></div><button className="icon-button" aria-label="Close full field map" onClick={() => setMapOpen(false)}><X /></button></div><img src={asset('field-map')} alt="The complete illustrative vegetable plot with all crop rows and surrounding field paths visible." /><div className="dialog-footer"><Legend /><p className="caption">Illustrative field map. Not surveyed coordinates or live analysis.</p></div></div>}
    </dialog>
  </>;
}
