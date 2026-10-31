import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { Leaf } from '@phosphor-icons/react/dist/csr/Leaf';
import { Eye } from '@phosphor-icons/react/dist/csr/Eye';
import { Notebook } from '@phosphor-icons/react/dist/csr/Notebook';
import { ChatCircle } from '@phosphor-icons/react/dist/csr/ChatCircle';
import { Hand } from '@phosphor-icons/react/dist/csr/Hand';
import { Drop } from '@phosphor-icons/react/dist/csr/Drop';
import { List } from '@phosphor-icons/react/dist/csr/List';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { MeasuredCopy } from './MeasuredCopy.jsx';
import { createId } from './dashboard/data.js';
import { SCENARIOS, journalExport, requestForScenario, scenarioEvent } from './plantAgentDemo.js';
import './styles.css';
import './plant-agent.css';

const PERCEPTION = '/dashboard?view=video';
function Brand() { return <span className="brand">Green<span>Point</span></span>; }
function External({ href, children }) { return <a className="pa-source-link" href={href} target="_blank" rel="noreferrer">{children}<ArrowUpRight aria-hidden="true" /></a>; }
function freshDemo() { return { id: createId(), events: [], total: 0 }; }

function PlantDemo({ reduced }) {
  const [demo, setDemo] = useState(freshDemo);
  const [scenario, setScenario] = useState('');
  const [downloaded, setDownloaded] = useState(false);
  const evidence = useRef(null);
  const evidenceSummary = useRef(null);
  const select = useRef(null);
  const latest = demo.events.at(-1);
  const request = requestForScenario(latest?.soil_scenario);
  function record(event) {
    event.preventDefault();
    const at = new Date().toISOString();
    setDemo(current => ({ ...current, total: current.total + 1, events: [...current.events, scenarioEvent(scenario, current.total + 1, at)].slice(-30) }));
    setDownloaded(false);
  }
  function reset() {
    setDemo(freshDemo()); setScenario(''); setDownloaded(false);
    select.current.focus();
  }
  function download() {
    const record = journalExport(demo, new Date().toISOString());
    const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2) + '\n'], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'greenpoint-milo-concept-journal.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setDownloaded(true);
  }
  return <section id="meet-milo" className="pa-demo pa-wrap" aria-labelledby="milo-title">
    <div className="pa-section-heading"><div><p className="pa-eyebrow">ONE PLANT. ITS OWN PERSPECTIVE.</p><h2 id="milo-title" tabIndex={-1}>Meet Milo.<br /><span>A plant with a point of view.</span></h2></div><p className="pa-disclosure">Interactive concept · scripted responses<br />Illustrative observations · no model calls</p></div>
    <div className="pa-demo-grid">
      <figure className="pa-milo-photo"><img src="/assets/plant-agent-milo.webp" alt="AI-generated illustration of Milo, a tomato plant in a terracotta pot with green and red fruit." width="1122" height="1402" loading="lazy" /><figcaption><span>MILO / TOMATO</span><span>Generated illustration · not a live observation</span></figcaption></figure>
      <div className="pa-request-panel">
        <div className="pa-request-meta"><span>MILO / A PLANT AGENT CONCEPT</span><Leaf aria-hidden="true" /></div>
        <div className="pa-voice" aria-live="polite" aria-atomic="true"><p className="pa-request-status">{request.status}</p><h3 id="milo-request" tabIndex={-1} key={request.title}>{request.title}</h3><MeasuredCopy>{request.body}</MeasuredCopy></div>
        <dl className="pa-observations"><div><dt><Eye aria-hidden="true" />What we can see</dt><dd>A leaf image, with its source attached.<span>Authored example · appearance is not a diagnosis</span></dd></div><div><dt><Drop aria-hidden="true" />What we still need</dt><dd>{latest?.soil_scenario === 'dry' ? 'Dry soil selected in this simulation.' : latest?.soil_scenario === 'damp' ? 'Damp soil selected in this simulation.' : 'Soil moisture has not been established.'}<span>No connected sensor or real-world measurement</span></dd></div></dl>
        <div className="pa-request-actions"><button className="pa-button" onClick={() => { evidence.current.open = true; evidenceSummary.current.focus({ preventScroll: true }); }}>Check the evidence<ArrowRight aria-hidden="true" /></button><button className="pa-button pa-button-secondary" onClick={() => { select.current.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'center' }); select.current.focus({ preventScroll: true }); }}>Try a soil check<ArrowRight aria-hidden="true" /></button></div>
        <details ref={evidence} className="pa-evidence"><summary ref={evidenceSummary}>What is this request based on?<Plus aria-hidden="true" /></summary><div><p>The image is generated artwork. This request is authored to show how an agent could ask for missing evidence. No image model has assessed Milo.</p><p>A soil check adds context. Similar visible symptoms can have different causes, so the example keeps a follow-up request open.</p><a className="pa-source-link" href="/assets/plant-agent-milo.webp" target="_blank" rel="noreferrer">Open illustrative source image<ArrowUpRight aria-hidden="true" /></a><External href="https://yardandgarden.extension.iastate.edu/faq/why-my-houseplant-wilting">Iowa State: why context matters</External></div></details>
        <form className="pa-scenario" onSubmit={record}><label htmlFor="milo-scenario">Try a soil-check scenario</label><p>Choose an imagined reply to see how the request changes.</p><div className="pa-scenario-inputs"><select ref={select} id="milo-scenario" value={scenario} required onChange={event => setScenario(event.target.value)}><option value="" disabled>Choose a scenario</option>{SCENARIOS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select><button type="submit" className="pa-button pa-button-secondary">Record scenario<ArrowRight aria-hidden="true" /></button></div>{latest && <p className="pa-scenario-result" role="status">Scenario recorded. Follow-up remains open. <a href="#milo-request">Read the updated request</a></p>}</form>
      </div>
    </div>
    <div className="pa-journal"><div className="pa-journal-heading"><div><h3>A small memory. A better next question.</h3><p>This example journal stays in this page until you leave. Every entry is a simulation.</p></div><button className="pa-text-button" onClick={download}><DownloadSimple aria-hidden="true" />{downloaded ? 'Download journal again' : 'Export concept journal'}</button></div><ol className="pa-journal-list" tabIndex={0} aria-label="Milo’s illustrative scenario journal"><li><span className="pa-journal-id">START</span><div><strong>One plant, introduced by a person.</strong><p>Milo is a fictional tomato. Its identity is assigned for this example, not inferred across video frames.</p></div><span className="pa-event-type">Authored example</span></li>{[...demo.events].reverse().map(item => <li key={item.id}><span className="pa-journal-id">{String(item.id.split('-')[1]).padStart(2, '0')}</span><div><strong>{item.label}</strong><p>{item.soil_scenario === 'unknown' ? 'The missing observation stays unknown. The request remains open.' : 'Context recorded. A follow-up request remains open.'}</p></div><span className="pa-event-type">Visitor-selected scenario</span></li>)}</ol>{demo.total > 0 && <div className="pa-journal-bottom"><p>{demo.total > 30 ? `Showing the latest 30 of ${demo.total} scenario entries.` : `${demo.total} scenario ${demo.total === 1 ? 'entry' : 'entries'} recorded.`} No care action has been performed.</p><button className="pa-text-button" onClick={reset}><ArrowCounterClockwise aria-hidden="true" />Reset example</button></div>}</div>
  </section>;
}

const loop = [
  { title: 'Observe', Icon: Eye, heading: 'Start with something we can point to.', body: 'An image, a note or a reading should keep its source. The existing perception workspace explores source-linked plant candidates from a short video.', note: 'Today: video preview and illustrative perception. Real-provider validation is pending.' },
  { title: 'Remember', Icon: Notebook, heading: 'Give this plant a history of its own.', body: 'A person identifies the plant and adds observations over time. Earlier context should stay separate from a new interpretation.', note: 'Today: an in-page scenario journal. Persistent plant profiles and cross-session memory are planned.' },
  { title: 'Ask', Icon: ChatCircle, heading: 'Turn uncertainty into a useful question.', body: 'An agent could notice the information it lacks and request a soil check, a clearer image or a review of recent care.', note: 'Today: scripted requests. LLM reasoning, weather retrieval and sensor tools are planned.' },
  { title: 'Review', Icon: Hand, heading: 'Make the next step a shared decision.', body: 'The owner sees the evidence and chooses what to do. A later observation can help assess what changed, without assuming the earlier suggestion was correct.', note: 'Today: separate human decisions in the perception workspace. No automatic watering or equipment control.' },
];
function AgentLoop() {
  const [active, setActive] = useState(0);
  const step = loop[active];
  return <section id="the-idea" className="pa-loop pa-wrap" aria-labelledby="loop-title"><div className="pa-section-heading"><div><p className="pa-eyebrow">THE LIVING NETWORK</p><h2 id="loop-title">How a plant<br /><span>gains a voice.</span></h2></div><MeasuredCopy>The idea is a continuing loop: observations become context, context becomes a question, and a person helps decide what happens next.</MeasuredCopy></div><ol className="pa-loop-controls" aria-label="Explore the plant agent loop">{loop.map(({ title, Icon }, index) => <li key={title}><button aria-pressed={active === index} aria-controls="pa-loop-detail" onClick={() => setActive(index)}><span className="pa-loop-number">0{index + 1}</span><Icon aria-hidden="true" /><strong>{title}</strong><ArrowRight aria-hidden="true" /></button></li>)}</ol><div className="pa-loop-detail" id="pa-loop-detail" aria-live="polite" aria-atomic="true"><h3>{step.heading}</h3><div key={active}><MeasuredCopy>{step.body}</MeasuredCopy><p className="pa-loop-note">{step.note}</p></div></div></section>;
}

const questions = [
  ['Is the plant really speaking?', 'The voice is a proposed AI interface for observations and care context. It does not reveal a plant’s thoughts or prove consciousness. Milo’s words are scripted for this interactive concept.'],
  ['What can I try today?', 'Try Milo’s scenario, inspect its evidence, update the in-page journal and download it. The separate perception workspace supports local video preview, illustrative plant review and CSV export. Live model analysis needs configured server credentials and an operator access code.'],
  ['Can I upload a video of my own plant?', 'You can open the perception workspace and upload a video for local preview, up to 120 seconds. Analysis is limited to six seconds and at most 12 frames. Uploads do not create a persistent plant agent or memory. Real-provider validation remains pending.'],
  ['Do I need sensors or a drone?', 'Milo’s concept needs neither. Future agents could combine phone observations, care notes and optional sensors. No live soil, light or temperature sensor is connected in this prototype.'],
  ['Does the agent water plants or send notifications?', 'No. This landing demonstrates requests and human responses within the page. Background agents, notifications, weather tools and physical actuation are future work.'],
  ['What happens to my data?', 'Milo’s simulated journal stays in this page until you leave, unless you export it. Video previews stay in the current tab. Starting configured perception analysis sends sampled frames through the server to the model provider; provider retention is governed by that service. GreenPoint has no database for live video results.'],
];

export function PlantAgentLanding() {
  const [menu, setMenu] = useState(false);
  const [motionOff, setMotionOff] = useState(false);
  const [systemReduced, setSystemReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const menuToggle = useRef(null);
  const reduced = motionOff || systemReduced;
  useEffect(() => {
    document.title = 'GreenPoint — Every plant deserves an agent.';
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setSystemReduced(preference.matches);
    preference.addEventListener('change', change);
    return () => preference.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
    return () => { delete document.documentElement.dataset.motion; };
  }, [reduced]);
  useEffect(() => {
    if (!menu) return;
    const close = event => { if (event.key === 'Escape') { setMenu(false); menuToggle.current?.focus(); } };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [menu]);
  function meetMilo(event) {
    event.preventDefault(); setMenu(false);
    const title = document.getElementById('milo-title');
    requestAnimationFrame(() => {
      title.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
      title.focus({ preventScroll: true });
      history.replaceState(null, '', '#meet-milo');
    });
  }
  const nav = [['the-idea', 'The idea'], ['the-foundation', 'Perception'], ['prototype', 'The prototype']];
  return <div className="pa-root">
    <a className="skip-link" href="#pa-main">Skip to content</a>
    <header className="pa-header"><div className="pa-wrap pa-header-inner"><a href="#top" aria-label="GreenPoint home"><Brand /></a><span className="pa-header-label">Plant agents</span><nav aria-label="Main navigation" className="pa-desktop-nav">{nav.map(([id, name]) => <a key={id} href={`#${id}`}>{name}</a>)}<a className="pa-nav-action" href="#meet-milo" onClick={meetMilo}>Meet a plant<ArrowUpRight aria-hidden="true" /></a></nav><button ref={menuToggle} className="pa-menu-button" aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu} aria-controls="pa-mobile-nav" onClick={() => setMenu(value => !value)}>{menu ? <X /> : <List />}</button></div>{menu && <nav className="pa-mobile-nav pa-wrap" id="pa-mobile-nav" aria-label="Mobile navigation">{nav.map(([id, name]) => <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>{name}<ArrowRight aria-hidden="true" /></a>)}<a href="#meet-milo" onClick={meetMilo}>Meet a plant<ArrowUpRight aria-hidden="true" /></a></nav>}</header>
    <main id="pa-main"><section className="pa-hero" id="top" aria-labelledby="pa-hero-title"><img className="pa-hero-image" src="/assets/vision-field.webp" alt="Illustrative young plants growing in dark soil, the original GreenPoint botanical world." width="1495" height="1052" fetchPriority="high" /><div className="pa-wrap pa-hero-inner"><div className="pa-hero-copy"><p className="pa-eyebrow">LET PLANTS USE AI, TOO.</p><h1 id="pa-hero-title">Every plant.<br />An AI of its <span>own.</span></h1><MeasuredCopy>A voice, a memory, and a way to ask for care. Grounded in what we can observe.</MeasuredCopy><div className="pa-hero-actions"><a className="pa-button" href="#meet-milo" onClick={meetMilo}>Meet a plant agent<ArrowRight aria-hidden="true" /></a><a className="pa-inline-link" href={PERCEPTION}>Explore perception<ArrowUpRight aria-hidden="true" /></a></div><p className="pa-hero-status">Research prototype · explore the interactive concept</p></div><a className="pa-hero-request" href="#meet-milo" onClick={meetMilo}><span>A REQUEST FROM A PLANT AGENT</span><strong>“Could you check my soil?”</strong><span>Illustrative voice · see the evidence<ArrowUpRight aria-hidden="true" /></span></a><span className="pa-hero-caption">Generated botanical illustration · agent vision</span></div></section>
      <div className="pa-hero-bottom pa-wrap"><span>EVERY PLANT DESERVES AN AGENT.</span><span>Observe<ArrowRight aria-hidden="true" />Remember<ArrowRight aria-hidden="true" />Ask<ArrowRight aria-hidden="true" />Review</span></div>
      <PlantDemo reduced={reduced} /><AgentLoop />
      <section id="the-foundation" className="pa-foundation pa-wrap" aria-labelledby="foundation-title"><div className="pa-section-heading"><div><p className="pa-eyebrow">THE PERCEPTION FOUNDATION</p><h2 id="foundation-title">A voice needs<br /><span>something to go on.</span></h2></div><MeasuredCopy>GreenPoint’s existing workspace is the visual starting point: a short video, plant candidates and the source image behind a suggestion.</MeasuredCopy></div><div className="pa-foundation-grid"><figure><img src="/assets/garden-evidence.webp" alt="Illustrative vegetable bed used in the existing plant perception example." width="1920" height="850" loading="lazy" /><figcaption>Illustrative perception source · not live inference</figcaption></figure><div><h3>From pixels to reviewable evidence.</h3><p>The integration combines SAM 3.1 segmentation, conservative candidate matching and Muse Spark classification. Human decisions remain separate from the original suggestion.</p><p>Preview up to two minutes. Analyze clips up to six seconds, using at most twelve sampled frames. Model access and real-provider validation are still pending.</p><a className="pa-button pa-button-secondary" href={PERCEPTION}>Open perception workspace<ArrowUpRight aria-hidden="true" /></a><p className="pa-small-note">This workspace does not yet create Milo-like agents or persistent plant memories.</p></div></div></section>
      <section className="pa-research pa-wrap" aria-labelledby="research-title"><div><p className="pa-eyebrow">A QUESTION WORTH EXPLORING</p><h2 id="research-title">What if care began<br /><span>with a better question?</span></h2><MeasuredCopy>Plants give us clues. Understanding those clues takes context. We’re exploring an agent that can ask for the information it needs, while keeping the person close to the evidence.</MeasuredCopy></div><div className="pa-research-sources"><article><h3>Context before a conclusion.</h3><p>Similar visible symptoms can have different causes. Plant-care guidance supports looking at growing conditions and soil, alongside the image.</p><External href="https://www.rhs.org.uk/plants/types/houseplants/how-to-help-a-poorly-houseplant">RHS: giving a plant a health check</External><External href="https://yardandgarden.extension.iastate.edu/faq/why-my-houseplant-wilting">Iowa State: why a plant may wilt</External></article><article><h3>Part of an emerging field.</h3><p>Plantbot explores LLM-mediated plant and robot interaction. FLORA combines plant sensors, voice and local history. GreenPoint explores a phone-first path to evidence-backed requests.</p><External href="https://arxiv.org/abs/2509.05338">Read the Plantbot research</External><External href="https://www.lumalien.com/flora">Explore the open-source FLORA project</External></article><p className="pa-small-note">Related work informs the concept. It is not an endorsement, a novelty claim or evidence of GreenPoint’s effectiveness.</p></div></section>
      <section id="prototype" className="pa-readiness pa-wrap" aria-labelledby="readiness-title"><div className="pa-section-heading"><div><p className="pa-eyebrow">BUILT IN THE OPEN</p><h2 id="readiness-title">A living idea.<br /><span>An honest prototype.</span></h2></div><div><MeasuredCopy>Explore the interaction today. Follow the work toward a plant agent that can reason over real observations and ask for help.</MeasuredCopy><External href="https://github.com/zipking1988/GreenPoint">Inspect GreenPoint on GitHub</External></div></div><div className="pa-readiness-grid"><div><span className="pa-status pa-status-ready">AVAILABLE NOW</span><h3>Try the experience.</h3><ul><li>Milo’s scripted request, scenario journal and export</li><li>Local video preview and illustrative plant review</li><li>Separate original suggestions and human decisions</li><li>A stateless MCP perception interface for agents</li></ul></div><div><span className="pa-status">NEXT TO BUILD & VALIDATE</span><h3>Connect the real world.</h3><ul><li>Real-provider segmentation and classification</li><li>LLM requests grounded in actual observations</li><li>Persistent plant profiles and care history</li><li>Optional weather and sensor tools, with review</li></ul></div></div><p className="pa-readiness-note">No real-time sensors, autonomous care, measured accuracy or demonstrated plant-health outcome is claimed.</p></section>
      <section className="pa-faq pa-wrap" aria-labelledby="faq-title"><div><h2 id="faq-title">A little more<br /><span>before you meet.</span></h2><p>The practical details behind the idea.</p></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<Plus aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></section>
      <section className="pa-closing pa-wrap"><h2>Let a plant<br /><span>start the conversation.</span></h2><a className="pa-button" href="#meet-milo" onClick={meetMilo}>Meet Milo<ArrowRight aria-hidden="true" /></a></section>
    </main><footer className="pa-footer pa-wrap"><div><a href="#top" aria-label="GreenPoint back to top"><Brand /></a><a className="pa-inline-link" href={PERCEPTION}>Perception workspace<ArrowUpRight aria-hidden="true" /></a></div><div><span>© 2026 GreenPoint · Independent research prototype</span><button className="pa-motion" aria-label="Reduce page motion" aria-pressed={reduced} disabled={systemReduced} onClick={() => setMotionOff(value => !value)}>Motion {reduced ? 'reduced' : 'on'}</button><span>AI as an interface for plant observations.</span></div></footer>
  </div>;
}
