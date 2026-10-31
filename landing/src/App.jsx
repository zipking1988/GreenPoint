import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { Leaf } from '@phosphor-icons/react/dist/csr/Leaf';
import { Crosshair } from '@phosphor-icons/react/dist/csr/Crosshair';
import { Clock } from '@phosphor-icons/react/dist/csr/Clock';
import { Prohibit } from '@phosphor-icons/react/dist/csr/Prohibit';
import { WarningCircle } from '@phosphor-icons/react/dist/csr/WarningCircle';
import { List } from '@phosphor-icons/react/dist/csr/List';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { MeasuredCopy } from './MeasuredCopy.jsx';
import './styles.css';
import './garden.css';

const VIDEO_URL = '/dashboard?view=video&upload=1';
const EXAMPLE_IMAGE = '/assets/garden-evidence.webp';
// Image-relative selection in the illustrative source raster, not a model result.
const PLANT = { x: .32, y: .265, width: .25, height: .46 };
const choices = [
  { id: 'keep', label: 'Keep this plant', classification: 'crop', status: 'confirmed', Icon: Leaf, message: 'Kept by you. Decision confirmed.' },
  { id: 'weed', label: 'Mark as weed', classification: 'weed', status: 'confirmed', Icon: Prohibit, message: 'Marked as weed by you. Decision confirmed.' },
  { id: 'later', label: 'Decide later', classification: 'uncertain', status: 'deferred', Icon: Clock, message: 'Deferred. This plant still needs another look.' },
];

function Brand() { return <span className="brand">Green<span>Point</span></span>; }
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
function Legend() {
  return <ul className="legend legend-vertical" aria-label="Plant categories">
    <li className="crop"><Leaf weight="fill" aria-hidden="true" />Crop</li>
    <li className="weed"><Leaf weight="fill" aria-hidden="true" />Weed</li>
    <li className="review"><Leaf weight="fill" aria-hidden="true" />Needs review</li>
  </ul>;
}

function EvidenceExperience() {
  const [decision, setDecision] = useState(null);
  const [exported, setExported] = useState(false);
  const scene = useRef(null);
  const photo = useRef(null);
  const crop = useRef(null);
  const connector = useRef(null);
  const source = useRef(null);
  const panel = useRef(null);
  const current = choices.find(choice => choice.id === decision);

  useEffect(() => {
    const image = photo.current;
    const draw = () => {
      if (!image.complete || !image.naturalWidth) return;
      const context = crop.current.getContext('2d');
      const p = PLANT;
      const sx = p.x * image.naturalWidth;
      const sy = p.y * image.naturalHeight;
      const sw = p.width * image.naturalWidth;
      const sh = p.height * image.naturalHeight;
      crop.current.width = Math.round(sw);
      crop.current.height = Math.round(sh);
      context.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
      const bounds = scene.current.getBoundingClientRect();
      const start = source.current.getBoundingClientRect();
      const end = panel.current.getBoundingClientRect();
      const canvas = connector.current;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(bounds.width * dpr);
      canvas.height = Math.round(bounds.height * dpr);
      const link = canvas.getContext('2d');
      link.scale(dpr, dpr);
      link.strokeStyle = getComputedStyle(scene.current).getPropertyValue('--color-review').trim();
      link.lineWidth = 1.5;
      link.beginPath();
      link.moveTo(start.right - bounds.left, start.top + start.height / 2 - bounds.top);
      link.lineTo(end.left - bounds.left, end.top + 45 - bounds.top);
      link.stroke();
    };
    image.addEventListener('load', draw);
    const observer = new ResizeObserver(draw);
    observer.observe(scene.current);
    observer.observe(panel.current);
    draw();
    return () => { image.removeEventListener('load', draw); observer.disconnect(); };
  }, []);

  function exportExample() {
    const columns = ['plant_id', 'source', 'model_label', 'human_classification', 'review_status', 'x_normalized', 'y_normalized', 'width_normalized', 'height_normalized', 'coordinate_system'];
    const row = ['GP-007', 'illustrative_garden_example', 'uncertain', current?.classification ?? 'uncertain', current?.status ?? 'pending', PLANT.x, PLANT.y, PLANT.width, PLANT.height, 'normalized_image'];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + columns.join(',') + '\r\n' + row.join(',') + '\r\n'], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'greenpoint-garden-example.csv'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExported(true);
  }

  return <section id="garden-example" className="garden-example" aria-labelledby="evidence-title">
    <div className="section-wrap garden-evidence-heading"><h2 id="evidence-title" tabIndex={-1}>One plant. <span>The evidence.</span> Your decision.</h2><p>Try a decision on the illustrative plant below.</p></div>
    <div className="garden-scene" ref={scene}>
      <div className="garden-source-photo"><img ref={photo} src={EXAMPLE_IMAGE} alt="Illustrative home vegetable bed. GP-007 is the broadleaf plant outlined for review." width="1920" height="850" loading="lazy" />
        <button ref={source} className="garden-source-selection" aria-label="Inspect illustrative plant GP-007" aria-controls="garden-evidence-panel" onClick={() => document.getElementById('garden-panel-title').focus({ preventScroll: true })} style={{ left: `${PLANT.x * 100}%`, top: `${PLANT.y * 100}%`, width: `${PLANT.width * 100}%`, height: `${PLANT.height * 100}%` }}><span>GP-007 <Crosshair aria-hidden="true" /></span></button>
        <p className="garden-art-caption">Example artwork · not live inference</p>
      </div>
      <canvas ref={connector} className="garden-connector" aria-hidden="true" />
      <aside ref={panel} id="garden-evidence-panel" className="garden-evidence-panel" aria-labelledby="garden-panel-title">
        <figure className="garden-crop"><canvas ref={crop} role="img" aria-label="GP-007 evidence cropped directly from the outlined source image" /><figcaption>GP-007 · SAME SOURCE IMAGE</figcaption></figure>
        <p className="garden-example-label">ILLUSTRATIVE EXAMPLE</p>
        <h3 id="garden-panel-title" tabIndex={-1}><WarningCircle weight="fill" aria-hidden="true" />Needs review</h3>
        <p className="garden-model-note">This view needs another look.</p>
        <div className="garden-decisions" role="group" aria-label="Your decision for illustrative plant GP-007">
          {choices.map(({ id, label, Icon }) => <button key={id} className={`garden-decision garden-decision-${id}`} aria-pressed={decision === id} onClick={() => { setDecision(id); setExported(false); }}><Icon size={22} aria-hidden="true" />{label}</button>)}
        </div>
        <div className="garden-decision-feedback" aria-live="polite" aria-atomic="true">{current ? <p key={decision}>{current.message}</p> : <p>You make the final decision.</p>}</div>
        {current && <div className="garden-record-actions"><button className="text-link" onClick={exportExample}><DownloadSimple aria-hidden="true" />{exported ? 'Download again' : 'Export example'}</button><button className="garden-reset" aria-label="Reset illustrative decision" onClick={() => { setDecision(null); setExported(false); }}><ArrowCounterClockwise size={18} /></button></div>}
      </aside>
    </div>
    <div className="section-wrap garden-evidence-footnote"><span>The original suggestion stays visible after your decision.</span><span>Sample decisions stay in this page until you leave.</span></div>
  </section>;
}

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [motionReduced, setMotionReduced] = useState(false);
  const systemReducedMotion = useReducedMotion();
  const reducedMotion = systemReducedMotion || motionReduced;
  const menuToggle = useRef(null);
  useEffect(() => {
    document.title = 'GreenPoint — A closer look before you pull.';
    document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full';
    return () => { delete document.documentElement.dataset.motion; };
  }, [reducedMotion]);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActiveSection(entry.target.id);
    }, { rootMargin: '-15% 0px -50% 0px' });
    ['top', 'garden-example', 'how-it-works', 'prototype'].forEach(id => observer.observe(document.getElementById(id)));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const close = event => { if (event.key === 'Escape') { setMenuOpen(false); menuToggle.current?.focus(); } };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [menuOpen]);
  function explore(event) {
    event.preventDefault();
    const title = document.getElementById('evidence-title');
    title.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
    title.focus({ preventScroll: true });
    history.replaceState(null, '', '#garden-example');
  }
  const navigation = [['how-it-works', 'How it works'], ['prototype', 'The prototype']];
  return <div className="garden-landing">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="masthead"><div className="header-inner"><a href="#top" aria-label="GreenPoint home"><Brand /></a><span className="prototype-label">Research prototype</span><nav className="desktop-nav" aria-label="Main navigation">{navigation.map(([id, label]) => <a href={`#${id}`} key={id} aria-current={activeSection === id ? 'location' : undefined}>{label}</a>)}<a href={VIDEO_URL} className="dashboard-link">Upload video<ArrowUpRight size={16} /></a></nav><button ref={menuToggle} className="icon-button mobile-menu-button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <List />}</button></div>{menuOpen && <nav className="mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">{navigation.map(([id, label]) => <a href={`#${id}`} key={id} onClick={() => setMenuOpen(false)}>{label}<ArrowRight /></a>)}<a href={VIDEO_URL}>Upload a short video<ArrowUpRight /></a></nav>}</header>
    <main id="main-content">
      <section id="top" className="hero" aria-labelledby="hero-title"><img className="hero-image" src="/assets/vision-field.webp" alt="Illustrative young crop rows on dark soil, with individual crop and weed leaves highlighted." width="1495" height="1052" fetchPriority="high" /><div className="hero-content section-wrap"><div className="hero-copy"><p className="hero-kicker">A CLOSER LOOK BEFORE YOU PULL</p><h1 id="hero-title">See what grows.<br /><span>Plant by plant.</span></h1><MeasuredCopy className="hero-description">A short phone video. A closer look at the plants in your garden. You decide what stays.</MeasuredCopy><div className="garden-hero-actions"><a className="primary-button" href={VIDEO_URL}>Upload a short video<ArrowRight aria-hidden="true" /></a><a className="text-link garden-example-link" href="#garden-example" onClick={explore}>Explore the sample<ArrowRight aria-hidden="true" /></a></div><p className="garden-hero-readiness">Up to 6 seconds · Live model validation pending</p></div><div className="hero-legend"><Legend /></div><span className="hero-specimen"><Crosshair aria-hidden="true" /><span>GP-007<span>Illustrative candidate.</span></span></span><span className="hero-disclosure">Illustrative concept · not live analysis</span></div></section>
      <div className="hero-bottom section-wrap"><span>YOUR PHONE. YOUR GARDEN.</span><span className="hero-path">Short video<ArrowRight aria-hidden="true" />Plant evidence<ArrowRight aria-hidden="true" />Your decision</span><a href="#garden-example" aria-label="Explore the plant evidence" onClick={explore}><ArrowRight /></a></div>
      <section className="garden-intro section-wrap" aria-labelledby="garden-intro-title"><h2 id="garden-intro-title">A little clarity.<br /><span>Before you pull.</span></h2><div><MeasuredCopy>You put care into growing it. Deciding what to remove deserves care, too. GreenPoint explores a way to review plants in a small vegetable garden, with the original image close at hand.</MeasuredCopy><p>For everyday gardeners, including older growers and the people who help them.</p></div></section>
      <EvidenceExperience />
      <section className="garden-steps section-wrap" id="how-it-works" aria-labelledby="steps-title"><h2 id="steps-title">Your judgment stays<br className="mobile-only" /> at the center.</h2><ol>{[
        ['A short clip', 'Up to six seconds of phone video. Start with a steady view of your vegetable bed.'],
        ['A closer look', 'Review the source image behind each plant suggestion. Unclear plants stay open for review.'],
        ['Your decision', 'Keep, mark, or decide later. Export a record with the image source and your decision.'],
      ].map(([title, body], i) => <li key={title}><span className="garden-step-number">0{i + 1}</span><div><h3>{title}</h3><MeasuredCopy>{body}</MeasuredCopy></div></li>)}</ol><p className="garden-steps-note"><Leaf aria-hidden="true" />Try the review flow in the sample now. Your own footage needs configured model access.</p></section>
      <section id="prototype" className="garden-prototype section-wrap" aria-labelledby="prototype-title"><div className="garden-prototype-heading"><span className="technical-label">BEHIND THE PROTOTYPE</span><h2 id="prototype-title">AI suggests. People decide.<br /><span>Evidence stays.</span></h2></div><details className="garden-prototype-details"><summary>What works today, and what comes next<Plus aria-hidden="true" /></summary><div className="garden-prototype-body"><div><h3>Available to explore</h3><p>The illustrative sample includes source inspection, human decisions and CSV export. The workspace accepts local video previews up to two minutes; live analysis is limited to six seconds.</p><a className="source-link" href="/dashboard?view=video">Open video workspace<ArrowUpRight /></a></div><div><h3>Ready for validation</h3><p>The model integration connects segmentation, conservative matching and classification to human review. Real-provider and field validation are pending. Ambiguous matches can remain separate candidates.</p></div><div><h3>What your video does</h3><p>Preview stays in this tab. When you start configured live analysis, sampled frames are sent through the server to the model provider. This prototype does not prescribe chemicals or operate equipment.</p></div><div><h3>Why this direction</h3><p>Garden accessibility guidance and plant identification advice informed this prototype. Testing with gardeners is the next step; no accuracy, labour-saving or pesticide-saving results are claimed.</p><a className="source-link" href="https://www.thrive.org.uk/get-gardening/weeding-the-garden" target="_blank" rel="noreferrer">Thrive: weeding the garden<ArrowUpRight /></a><a className="source-link" href="https://www.rhs.org.uk/weeds/identify-common-weeds" target="_blank" rel="noreferrer">RHS: identifying common weeds<ArrowUpRight /></a></div></div></details></section>
      <section className="garden-closing section-wrap" aria-labelledby="closing-title"><h2 id="closing-title">Your garden. <span>Your call.</span></h2><a href={VIDEO_URL} className="primary-button">Upload a short video<ArrowRight aria-hidden="true" /></a></section>
    </main>
    <footer className="footer section-wrap"><div className="footer-top"><a href="#top" aria-label="GreenPoint back to top"><Brand /></a><a href="/dashboard?view=video" className="text-link">Open workspace<ArrowUpRight aria-hidden="true" /></a></div><div className="footer-bottom"><span>© 2026 GreenPoint · Independent research prototype</span><button className="motion-toggle" aria-label="Reduce page motion" aria-pressed={reducedMotion} disabled={systemReducedMotion} onClick={() => setMotionReduced(value => !value)}>Motion {reducedMotion ? 'reduced' : 'on'}</button><span>Illustrative visuals · Human judgment</span></div></footer>
  </div>;
}
