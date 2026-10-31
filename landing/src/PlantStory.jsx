import { useRef, useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { Check } from '@phosphor-icons/react/dist/csr/Check';
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { Leaf } from '@phosphor-icons/react/dist/csr/Leaf';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { createDemo, SCENARIOS, journalExport, requestForScenario, scenarioEvent } from './plantAgentDemo.js';

const choiceText = { dry: 'Feels dry', damp: 'Feels damp', unknown: 'Not checked' };

export function PlantStory() {
  const [demo, setDemo] = useState(createDemo);
  const [scenario, setScenario] = useState('');
  const [downloaded, setDownloaded] = useState(false);
  const firstChoice = useRef(null);
  const latest = demo.events.at(-1);
  const request = requestForScenario(latest?.soil_scenario);

  function record(event) {
    event.preventDefault();
    const at = new Date().toISOString();
    setDemo(current => ({
      ...current,
      total: current.total + 1,
      events: [...current.events, scenarioEvent(scenario, current.total + 1, at)].slice(-30),
    }));
    setDownloaded(false);
  }

  function reset() {
    setDemo(createDemo());
    setScenario('');
    setDownloaded(false);
    firstChoice.current?.focus();
  }

  function download() {
    const content = JSON.stringify(journalExport(demo, new Date().toISOString()), null, 2) + '\n';
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'greenpoint-milo-concept-journal.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  }

  return <section id="meet-milo" className="pa-story pa-wrap" aria-labelledby="milo-title">
    <div className="pa-section-heading" data-reveal>
      <div>
        <p className="pa-eyebrow">01 / ONE PLANT. A SHARED CONVERSATION.</p>
        <h2 id="milo-title" tabIndex={-1}>Meet Milo.<br /><span>Start with a question.</span></h2>
      </div>
      <p className="pa-section-intro">A fictional tomato. An imagined soil check.<br />See how a little context changes what comes next.</p>
    </div>

    <div className="pa-story-grid">
      <div className="pa-story-source">
        <figure className="pa-milo-photo">
          <img src="/assets/plant-agent-milo.webp" alt="Generated illustration of Milo, a fictional tomato plant in a terracotta pot." width="1122" height="1402" loading="lazy" />
          <figcaption>
            <span><Leaf aria-hidden="true" />MILO / TOMATO</span>
            <span>Generated illustration</span>
          </figcaption>
        </figure>
        <div className="pa-identity-note">
          <span className="pa-eyebrow">THE SAME PLANT, THROUGHOUT THIS STORY.</span>
          <p>Milo’s identity is assigned for this example. The picture, your imagined reply and the next question stay together.</p>
        </div>
      </div>

      <div className="pa-conversation">
        <div className="pa-demo-disclosure"><span className="pa-status">INTERACTIVE CONCEPT</span><span>Scripted responses · no model calls</span></div>
        <div className="pa-request-panel">
          <div className="pa-request-meta"><span>A QUESTION FROM MILO</span><Leaf aria-hidden="true" /></div>
          <div className="pa-voice" aria-live="polite" aria-atomic="true">
            <p className="pa-request-status">{request.status}</p>
            <h3 id="milo-request" tabIndex={-1} key={request.title}>{request.title}</h3>
            <p>{request.body}</p>
          </div>
          <div className="pa-context-line"><span>SOIL CONTEXT</span><strong>{latest?.soil_scenario === 'dry' ? 'Dry · imagined reply' : latest?.soil_scenario === 'damp' ? 'Damp · imagined reply' : 'Still unknown'}</strong></div>

          <form className="pa-scenario" onSubmit={record}>
            <fieldset>
              <legend>Imagine checking the soil.</legend>
              <p id="milo-scenario-help">Choose a scenario to explore Milo’s next question.</p>
              <div className="pa-soil-choices">
                {SCENARIOS.map((item, index) => <label key={item.value} className={scenario === item.value ? 'is-selected' : ''}>
                  <input ref={index === 0 ? firstChoice : undefined} type="radio" name="milo-soil" value={item.value} checked={scenario === item.value} required aria-describedby="milo-scenario-help" onChange={event => setScenario(event.target.value)} />
                  <span>{choiceText[item.value]}</span><Check aria-hidden="true" />
                </label>)}
              </div>
            </fieldset>
            <button type="submit" className="pa-button">Update Milo’s question<ArrowRight aria-hidden="true" /></button>
            <p className="pa-form-feedback" role="status">{latest ? <>Entry {demo.total} recorded. Follow-up stays open. <a href="#milo-request">Read the question</a></> : 'An imagined observation. You stay in charge of care.'}</p>
          </form>

          <details className="pa-evidence">
            <summary>Where does this question come from?<Plus aria-hidden="true" /></summary>
            <div>
              <p>This is an authored interaction using generated artwork. No model has assessed Milo, and no sensor has measured its soil.</p>
              <p>Similar visible symptoms can have different causes. The concept asks for missing context and keeps the next step with a person.</p>
              <a className="pa-source-link" href="/assets/plant-agent-milo.webp" target="_blank" rel="noreferrer">Open the illustrative source<ArrowUpRight aria-hidden="true" /></a>
              <a className="pa-source-link" href="https://yardandgarden.extension.iastate.edu/faq/why-my-houseplant-wilting" target="_blank" rel="noreferrer">Iowa State: why context matters<ArrowUpRight aria-hidden="true" /></a>
            </div>
          </details>
        </div>
      </div>
    </div>

    <div className="pa-journal" data-reveal>
      <div className="pa-journal-heading">
        <div><p className="pa-eyebrow">MILO’S STORY / THIS PAGE ONLY</p><h3>A little context.<br /><span>A better next question.</span></h3></div>
        <button className="pa-text-button" onClick={download}><DownloadSimple aria-hidden="true" />{downloaded ? 'Download journal again' : 'Export concept journal'}</button>
      </div>
      <ol className="pa-journal-list" tabIndex={0} aria-label="Milo’s illustrative scenario journal">
        <li><span className="pa-journal-id">START</span><div><strong>One plant, introduced by a person.</strong><p>A fictional tomato with a generated portrait. The story begins with soil context still unknown.</p></div><span className="pa-event-type">Authored example</span></li>
        {[...demo.events].reverse().map(item => <li key={item.id}>
          <span className="pa-journal-id">{String(item.id.split('-')[1]).padStart(2, '0')}</span>
          <div><strong>{item.label}</strong><p>{item.soil_scenario === 'unknown' ? 'The missing observation stays unknown. The request remains open.' : 'Context recorded. A follow-up request remains open.'}</p></div>
          <span className="pa-event-type">Visitor-selected simulation</span>
        </li>)}
      </ol>
      <div className="pa-journal-bottom">
        <p>{demo.total > 30 ? `Showing the latest 30 of ${demo.total} scenario entries.` : demo.total ? `${demo.total} scenario ${demo.total === 1 ? 'entry' : 'entries'} recorded.` : 'Try a scenario above to add the next entry.'} Every entry is a simulation. No care action is performed.</p>
        {demo.total > 0 && <button className="pa-text-button" onClick={reset}><ArrowCounterClockwise aria-hidden="true" />Reset story</button>}
      </div>
    </div>
  </section>;
}
