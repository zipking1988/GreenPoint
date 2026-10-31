import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { Eye } from '@phosphor-icons/react/dist/csr/Eye';
import { Notebook } from '@phosphor-icons/react/dist/csr/Notebook';
import { ChatCircle } from '@phosphor-icons/react/dist/csr/ChatCircle';
import { Hand } from '@phosphor-icons/react/dist/csr/Hand';
import { Leaf } from '@phosphor-icons/react/dist/csr/Leaf';
import { List } from '@phosphor-icons/react/dist/csr/List';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { MeasuredCopy } from './MeasuredCopy.jsx';
import { PlantStory } from './PlantStory.jsx';
import './styles.css';
import './plant-agent.css';

const PERCEPTION = '/dashboard?view=video';
function Brand() { return <span className="brand">Green<span>Point</span></span>; }
function External({ href, children }) {
  return <a className="pa-source-link" href={href} target="_blank" rel="noreferrer">{children}<ArrowUpRight aria-hidden="true" /></a>;
}

const loop = [
  { title: 'Observe', Icon: Eye, heading: 'A picture is a beginning.', body: 'Keep the image beside the observation. A change in a leaf can be something to look into; its cause still needs context.', note: 'In Milo’s story: a generated portrait. In the lab: local video preview and illustrative plant review.' },
  { title: 'Remember', Icon: Notebook, heading: 'This plant has a story.', body: 'Keep what a person adds separate from what a model suggests. Each new observation belongs to this plant, with its source attached.', note: 'In this build: an in-page scenario journal. Persistent profiles are future work.' },
  { title: 'Ask', Icon: ChatCircle, heading: 'Uncertainty can become a question.', body: 'Ask for the information that is missing: a soil check, a clearer view, or what happened during the last few days of care.', note: 'In this build: scripted branches. Evidence-grounded LLM requests still need implementation and validation.' },
  { title: 'Review', Icon: Hand, heading: 'The person makes the next call.', body: 'Read the question with its evidence. Add context, question the suggestion, and decide what needs a closer look.', note: 'In the lab: human decisions stay separate from original suggestions. No automatic watering or equipment control.' },
];

function AgentLoop() {
  const [active, setActive] = useState(0);
  const step = loop[active];
  return <section id="the-idea" className="pa-loop pa-wrap" aria-labelledby="loop-title">
    <div className="pa-section-heading" data-reveal>
      <div><p className="pa-eyebrow">02 / THE IDEA BEHIND THE INTERFACE</p><h2 id="loop-title">From a visible clue.<br /><span>To a useful question.</span></h2></div>
      <MeasuredCopy>We’re exploring a plant agent that can keep context, ask for what it lacks, and help a person decide what to look at next.</MeasuredCopy>
    </div>
    <ol className="pa-loop-controls" aria-label="Explore the plant agent loop">
      {loop.map(({ title, Icon }, index) => <li key={title}>
        <button aria-pressed={active === index} aria-controls="pa-loop-detail" onClick={() => setActive(index)}>
          <span className="pa-loop-number">0{index + 1}</span><Icon aria-hidden="true" /><strong>{title}</strong><ArrowRight aria-hidden="true" />
        </button>
      </li>)}
    </ol>
    <div className="pa-loop-detail" id="pa-loop-detail" aria-live="polite" aria-atomic="true">
      <h3>{step.heading}</h3><div key={active}><MeasuredCopy>{step.body}</MeasuredCopy><p className="pa-loop-note">{step.note}</p></div>
    </div>
  </section>;
}

const questions = [
  ['Is the plant really speaking?', 'The voice is an interface for observations and care context, rather than a claim about plant thoughts or consciousness. Milo’s words are scripted for this interactive concept.'],
  ['What can I try today?', 'Explore Milo’s imagined soil check, see its next question, inspect the source and export the scenario journal. The separate perception lab offers local video preview, illustrative plant review and CSV export.'],
  ['Can I bring my own plant video?', 'Yes, for local preview in the perception lab, up to 120 seconds. Configured analysis accepts clips up to six seconds and at most twelve frames. Model credentials and real-provider validation are still pending. Uploading does not create a Milo-like agent or a persistent memory.'],
  ['Do I need sensors or a drone?', 'Neither is needed for the interactive concept or local phone-video preview. No live soil, light or temperature sensor is connected.'],
  ['Will it water my plant or send alerts?', 'No. This build explores questions and human feedback within the page. It does not run background agents, send notifications or control equipment.'],
  ['What happens to my data?', 'Milo’s simulated journal stays in this page until you leave, unless you export it. Video previews stay in the current tab. Starting configured analysis sends sampled frames through the server to the model provider, whose retention terms apply. GreenPoint has no database for live video results.'],
];

export function PlantAgentLanding() {
  const [menu, setMenu] = useState(false);
  const [motionOff, setMotionOff] = useState(false);
  const [systemReduced, setSystemReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const menuToggle = useRef(null);
  const root = useRef(null);
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
    if (reduced || typeof IntersectionObserver === 'undefined') return;
    const elements = root.current.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('pa-visible');
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12 });
    for (const element of elements) observer.observe(element);
    root.current.classList.add('pa-reveals-ready');
    return () => {
      observer.disconnect();
      root.current?.classList.remove('pa-reveals-ready');
    };
  }, [reduced]);
  useEffect(() => {
    if (!menu) return;
    const close = event => {
      if (event.key === 'Escape') { setMenu(false); menuToggle.current?.focus(); }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [menu]);

  function meetMilo(event) {
    event.preventDefault();
    setMenu(false);
    requestAnimationFrame(() => {
      const title = document.getElementById('milo-title');
      title.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
      title.focus({ preventScroll: true });
      history.replaceState(null, '', '#meet-milo');
    });
  }

  const nav = [['the-idea', 'The idea'], ['the-foundation', 'The lab'], ['prototype', 'What works today']];
  return <div ref={root} className="pa-root">
    <a className="skip-link" href="#pa-main">Skip to content</a>
    <header className="pa-header">
      <div className="pa-wrap pa-header-inner">
        <a href="#top" aria-label="GreenPoint home"><Brand /></a><span className="pa-header-label">An interface for the living world.</span>
        <nav aria-label="Main navigation" className="pa-desktop-nav">
          {nav.map(([id, name]) => <a key={id} href={`#${id}`}>{name}</a>)}
          <a className="pa-nav-action" href="#meet-milo" onClick={meetMilo}>Meet Milo<ArrowUpRight aria-hidden="true" /></a>
        </nav>
        <button ref={menuToggle} className="pa-menu-button" aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu} aria-controls="pa-mobile-nav" onClick={() => setMenu(value => !value)}>{menu ? <X aria-hidden="true" /> : <List aria-hidden="true" />}</button>
      </div>
      {menu && <nav className="pa-mobile-nav pa-wrap" id="pa-mobile-nav" aria-label="Mobile navigation">
        {nav.map(([id, name]) => <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>{name}<ArrowRight aria-hidden="true" /></a>)}
        <a href="#meet-milo" onClick={meetMilo}>Meet Milo<ArrowUpRight aria-hidden="true" /></a>
      </nav>}
    </header>

    <main id="pa-main">
      <section className="pa-hero" id="top" aria-labelledby="pa-hero-title">
        <img className="pa-hero-image" src="/assets/vision-field.webp" alt="Illustrative young plants growing in dark soil, the original GreenPoint botanical world." width="1495" height="1052" fetchPriority="high" />
        <div className="pa-wrap pa-hero-inner">
          <div className="pa-hero-copy">
            <p className="pa-eyebrow">LET PLANTS USE AI, TOO.</p>
            <h1 id="pa-hero-title">Every plant.<br />An AI of its <span>own.</span></h1>
            <MeasuredCopy>Give the plant in your care a voice. Turn what you see and what you know into a better next question.</MeasuredCopy>
            <div className="pa-hero-actions">
              <a className="pa-button" href="#meet-milo" onClick={meetMilo}>Meet Milo<ArrowRight aria-hidden="true" /></a>
              <a className="pa-inline-link" href="#the-idea">How the idea works<ArrowUpRight aria-hidden="true" /></a>
            </div>
            <p className="pa-hero-status">A research prototype. An interactive concept you can try.</p>
          </div>
          <a className="pa-hero-request" href="#meet-milo" onClick={meetMilo}>
            <span className="pa-hero-request-label"><Leaf aria-hidden="true" />A QUESTION FROM MILO</span>
            <strong>“Could you<br />check my soil?”</strong>
            <span>Illustrative request<ArrowUpRight aria-hidden="true" /></span>
          </a>
          <div className="pa-hero-caption"><span>THE LIVING WORLD, GIVEN A VOICE.</span><span>Generated botanical illustration</span></div>
        </div>
      </section>

      <div className="pa-hero-bottom pa-wrap"><span>ONE PLANT AT A TIME.</span><span>Observe<ArrowRight aria-hidden="true" />Remember<ArrowRight aria-hidden="true" />Ask<ArrowRight aria-hidden="true" />Review</span></div>
      <section className="pa-premise pa-wrap" aria-labelledby="premise-title" data-reveal>
        <p className="pa-eyebrow">FOR THE PERSON WONDERING WHAT TO CHECK NEXT.</p>
        <div className="pa-premise-grid">
          <h2 id="premise-title">A photo shows the leaves.<br /><span>You know the rest<br className="pa-desktop-break" /> of the story.</span></h2>
          <div><MeasuredCopy>When a plant looks different, the missing clue may be in its soil, its surroundings, or yesterday’s care.</MeasuredCopy><p>GreenPoint explores a simple idea: let a plant agent ask for that missing context. Keep the evidence close. Keep the person in the conversation.</p><a className="pa-text-button" href="#meet-milo" onClick={meetMilo}>Try one conversation<ArrowRight aria-hidden="true" /></a></div>
        </div>
      </section>

      <PlantStory />
      <AgentLoop />

      <section id="the-foundation" className="pa-foundation pa-wrap" aria-labelledby="foundation-title">
        <div className="pa-section-heading" data-reveal>
          <div><p className="pa-eyebrow">03 / THE PERCEPTION LAB</p><h2 id="foundation-title">Every question needs<br /><span>something to go on.</span></h2></div>
          <MeasuredCopy>The visual foundation is a separate workspace: a short phone video, plant candidates and source frames you can inspect.</MeasuredCopy>
        </div>
        <div className="pa-foundation-grid">
          <figure><img src="/assets/garden-evidence.webp" alt="Generated vegetable-bed illustration used to explain the plant perception workflow." width="1920" height="850" loading="lazy" /><figcaption><span>ILLUSTRATIVE PERCEPTION SOURCE</span><span>Example annotations, not live inference</span></figcaption></figure>
          <div>
            <p className="pa-eyebrow">BRING A PHONE VIDEO. START WITH WHAT IS VISIBLE.</p>
            <h3>A source behind<br />every suggestion.</h3>
            <p>Preview a clip. Inspect a plant candidate. Keep your decision beside the original suggestion, then export the record.</p>
            <p className="pa-lab-range">Local preview ≤120 seconds<br />Configured analysis ≤6 seconds · up to 12 frames</p>
            <a className="pa-button pa-button-secondary" href={PERCEPTION}>Open the perception lab<ArrowUpRight aria-hidden="true" /></a>
            <p className="pa-small-note">A separate experience, with illustrative records today. Real-model validation is pending. Uploads do not create a Milo-like agent.</p>
          </div>
        </div>
        <details className="pa-architecture">
          <summary>For builders: where the models fit<Plus aria-hidden="true" /></summary>
          <div className="pa-architecture-grid">
            <div><span className="pa-eyebrow">SAM 3.1 / INTEGRATION CODE</span><h3>Locate plant candidates.</h3><p>Segmentation supplies image-relative regions. Conservative matching leaves ambiguous candidates separate.</p></div>
            <div><span className="pa-eyebrow">MUSE SPARK / INTEGRATION CODE</span><h3>Suggest a classification.</h3><p>The lab keeps original suggestions and human decisions separate. LLM-generated care questions are future work.</p></div>
            <div><span className="pa-eyebrow">HUMAN / FINAL REVIEW</span><h3>Keep the source in view.</h3><p>Review, defer and export with provenance. MCP provides a separate stateless interface, without browser-local decisions.</p></div>
          </div>
          <p className="pa-small-note">Model credentials and real-provider validation are pending. No measured accuracy, geographic mapping or autonomous care is claimed.</p>
        </details>
      </section>

      <section className="pa-research pa-wrap" aria-labelledby="research-title">
        <div data-reveal><p className="pa-eyebrow">04 / CONTEXT BEFORE A CONCLUSION</p><h2 id="research-title">Sometimes, the most<br />useful answer is<br /><span>a better question.</span></h2><MeasuredCopy>Plant-care guidance looks beyond a photograph. Soil and growing conditions matter, too. That is the question this prototype starts with.</MeasuredCopy></div>
        <div className="pa-research-sources">
          <article><span className="pa-source-number">01 / PLANT CARE</span><h3>Look at the whole context.</h3><p>Similar visible symptoms can have different causes. An image is one part of the observation.</p><External href="https://www.rhs.org.uk/plants/types/houseplants/how-to-help-a-poorly-houseplant">RHS: a plant health check</External><External href="https://yardandgarden.extension.iastate.edu/faq/why-my-houseplant-wilting">Iowa State: why a plant may wilt</External></article>
          <article><span className="pa-source-number">02 / RELATED WORK</span><h3>An idea with roots.</h3><p>Plantbot explores LLM-mediated plant and robot interaction. FLORA combines plant sensors, voice and local history. GreenPoint explores a phone-first path to requests with evidence.</p><External href="https://arxiv.org/abs/2509.05338">Read the Plantbot research</External><External href="https://www.lumalien.com/flora">Explore FLORA</External></article>
          <p className="pa-small-note">These sources inform the concept. They are not endorsements or evidence of GreenPoint’s effectiveness.</p>
        </div>
      </section>

      <section id="prototype" className="pa-readiness pa-wrap" aria-labelledby="readiness-title">
        <div className="pa-section-heading" data-reveal>
          <div><p className="pa-eyebrow">05 / A LIVING IDEA, BUILT IN THE OPEN</p><h2 id="readiness-title">Try what is here.<br /><span>See what comes next.</span></h2></div>
          <div><MeasuredCopy>A working interaction is a beginning. The next experiment is to ground the same conversation in real observations and model reasoning.</MeasuredCopy><External href="https://github.com/zipking1988/GreenPoint">Inspect the project on GitHub</External></div>
        </div>
        <div className="pa-readiness-grid">
          <div><span className="pa-status pa-status-ready">AVAILABLE IN THIS BUILD</span><h3>The interaction.</h3><ul><li>Milo’s scripted questions and imagined feedback</li><li>A session journal with a labeled JSON export</li><li>Local video preview, illustrative review and CSV</li><li>A separate stateless MCP perception interface</li></ul></div>
          <div><span className="pa-status">THE NEXT EXPERIMENT</span><h3>The grounded agent.</h3><ul><li>Validate the real-provider perception pipeline</li><li>Generate questions from actual plant observations</li><li>Carry one confirmed plant identity through the flow</li><li>Test whether the questions help a real care task</li></ul></div>
        </div>
        <p className="pa-readiness-note">Persistent plant memory, sensors, notifications and automatic care are not implemented. No plant-health outcome has been measured.</p>
      </section>

      <section className="pa-faq pa-wrap" aria-labelledby="faq-title">
        <div><p className="pa-eyebrow">A FEW THINGS TO KNOW.</p><h2 id="faq-title">Before we<br /><span>keep growing.</span></h2></div>
        <div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<Plus aria-hidden="true" /></summary><p>{answer}</p></details>)}</div>
      </section>
      <section className="pa-closing pa-wrap" data-reveal>
        <p className="pa-eyebrow">EVERY PLANT HAS A STORY.</p><h2>Let care begin<br /><span>with a question.</span></h2>
        <a className="pa-button" href="#meet-milo" onClick={meetMilo}>Meet Milo<ArrowRight aria-hidden="true" /></a>
      </section>
    </main>
    <footer className="pa-footer pa-wrap">
      <div><a href="#top" aria-label="GreenPoint back to top"><Brand /></a><span>An interface for the living world.</span><a className="pa-inline-link" href={PERCEPTION}>Perception lab<ArrowUpRight aria-hidden="true" /></a></div>
      <div><span>© 2026 GreenPoint · Independent research prototype</span><button className="pa-motion" aria-label="Reduce page motion" aria-pressed={reduced} disabled={systemReduced} onClick={() => setMotionOff(value => !value)}>Motion {reduced ? 'reduced' : 'on'}</button><span>Observe. Ask. Care, together.</span></div>
    </footer>
  </div>;
}
