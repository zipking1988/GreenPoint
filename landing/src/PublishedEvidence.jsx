import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { evidenceRegion } from './dashboard/evidence.js';
import './published-evidence.css';

const labels = { crop: 'Crop', weed: 'Weed', uncertain: 'Needs review' };
const category = label => label === 'uncertain' ? 'review' : label;
const modelNames = { 'sam-3.1': 'SAM 3.1', 'muse-spark-1.3': 'Muse Spark 1.3' };
const formatModels = models => models.map(model => modelNames[model] ?? model).join(' + ');

// Published JSON only: visiting the landing never starts provider inference.
function usePublishedJson(url) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ data: null, failed: false });
  useEffect(() => {
    const controller = new AbortController();
    let canceled = false;
    const timeout = setTimeout(() => controller.abort(), 15000);
    setState({ data: null, failed: false });
    fetch(url, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Published recording unavailable');
        return response.json();
      })
      .then(data => { if (!canceled) setState({ data, failed: false }); })
      .catch(() => { if (!canceled) setState({ data: null, failed: true }); })
      .finally(() => clearTimeout(timeout));
    return () => { canceled = true; clearTimeout(timeout); controller.abort(); };
  }, [url, attempt]);
  return { ...state, retry: () => setAttempt(value => value + 1) };
}

function RecordingFallback({ failed, retry }) {
  return <div className="recording-fallback" role="status">
    <p>{failed ? 'This recording could not load. You can still open the workspace or read the published results.' : 'Loading the published recording…'}</p>
    {failed ? <div className="recording-recovery-actions"><button className="text-link" onClick={retry}>Try loading again<ArrowRight aria-hidden="true" /></button><a className="text-link" href="/dashboard">Open workspace<ArrowUpRight aria-hidden="true" /></a><a className="text-link" href="/validation.html">Read published results<ArrowUpRight aria-hidden="true" /></a></div> : null}
  </div>;
}

function useSourceConnector(stageRef, sourceRef, portRef, box) {
  const [line, setLine] = useState(null);
  useEffect(() => {
    const stage = stageRef.current, source = sourceRef.current, port = portRef.current;
    if (!stage || !source || !port || !box) return;
    let canceled = false;
    const measure = () => {
      if (canceled) return;
      const origin = stage.getBoundingClientRect(), image = source.getBoundingClientRect(), target = port.getBoundingClientRect();
      const x = image.left - origin.left + (box[0] + box[2]) * image.width;
      const y = image.top - origin.top + (box[1] + box[3] / 2) * image.height;
      const endX = target.left - origin.left + target.width / 2;
      const endY = target.top - origin.top + target.height / 2;
      setLine({ x, y, endX, endY, path: `M ${x} ${y} H ${endX - 20} V ${endY} H ${endX}` });
    };
    measure();
    document.fonts.ready.then(measure);
    const observer = new ResizeObserver(measure);
    [stage, source, port, ...stage.children].forEach(element => observer.observe(element));
    return () => { canceled = true; observer.disconnect(); };
  }, [stageRef, sourceRef, portRef, box]);
  return line;
}

export function RecordedFieldEvidence() {
  const { data, failed, retry } = usePublishedJson('/assets/verified-run/index.json');
  const session = Array.isArray(data?.sessions) ? data.sessions.find(item => item.id === data.defaultId) : null;
  const plants = session?.plants?.filter(plant => ['GP-001', 'GP-003', 'GP-004'].includes(plant.id)) ?? [];
  const [selectedId, setSelectedId] = useState('GP-001');
  const selected = plants.find(plant => plant.id === selectedId) ?? plants[0];
  const stageRef = useRef(null), sourceRef = useRef(null), portRef = useRef(null);
  const line = useSourceConnector(stageRef, sourceRef, portRef, selected?.box);
  const region = selected && evidenceRegion(selected.box, session.width, session.height);

  return <section id="evidence" className="recorded-evidence section-wrap" aria-labelledby="recorded-evidence-title">
    <div className="section-heading proof-heading">
      <div><p className="evidence-kicker">RECORDED REAL META RUN</p><h2 id="recorded-evidence-title">Every judgment<br />has a frame.</h2></div>
      <p className="section-copy">An actual source image. A model suggestion. The evidence to inspect it yourself.</p>
    </div>
    {selected && session.image ? <>
      <div className="proof-run-meta"><span>{formatModels(session.provenance.models)}</span><span>Public UAV image · Sugar beet</span><span>Recorded evidence · No new model call</span></div>
      <div className={`proof-stage ${category(selected.label)}`} ref={stageRef}>
        <figure className="proof-source">
          <div className="proof-image" ref={sourceRef}>
            <img src={session.image} width={session.width} height={session.height} alt="Original PhenoBench sugar-beet image used in this recorded Meta run." loading="lazy" />
            <span className="proof-source-label">01 / SOURCE FRAME</span>
            <span className="proof-box" style={{ left: `${selected.box[0] * 100}%`, top: `${selected.box[1] * 100}%`, width: `${selected.box[2] * 100}%`, height: `${selected.box[3] * 100}%` }}><span>{selected.id}</span></span>
          </div>
          <figcaption>Original source pixels · Image coordinates, without GPS</figcaption>
        </figure>
        <div className="proof-selection" role="group" aria-label="Inspect recorded plant evidence">{plants.map(plant => <button key={plant.id} className={category(plant.label)} aria-pressed={plant.id === selected.id} aria-controls="recorded-plant-detail" onClick={() => setSelectedId(plant.id)}><span className="proof-selection-id">{plant.id}</span><span>{labels[plant.label]}<ArrowUpRight aria-hidden="true" /></span></button>)}</div>
        <div id="recorded-plant-detail" className="proof-detail">
          <figure className="proof-crop">
            <span className="proof-port" ref={portRef} aria-hidden="true" />
            <span className="proof-crop-label">02 / SAME-SOURCE CROP</span>
            <svg viewBox={`${region.left} ${region.top} ${region.width} ${region.height}`} role="img" aria-label={`${selected.id}, cropped from the highlighted location in the original source frame`}>
              <image href={session.image} width={session.width} height={session.height} />
              <rect x={selected.box[0] * session.width} y={selected.box[1] * session.height} width={selected.box[2] * session.width} height={selected.box[3] * session.height} vectorEffect="non-scaling-stroke" />
            </svg>
            <figcaption>{selected.id} · Same image, same plant</figcaption>
          </figure>
          <div className="proof-judgment" aria-live="polite" aria-atomic="true">
            <p className="evidence-kicker">03 / MODEL SUGGESTION</p>
            <h3><span>{selected.id}</span><span className="proof-category">{labels[selected.label]}</span></h3>
            <p className="proof-reasoning">{selected.reasoning}</p>
            <p className="proof-review-state">Human review pending</p>
          </div>
          <a className="text-link" href="/dashboard">Inspect the recorded run<ArrowRight aria-hidden="true" /></a>
        </div>
        {line ? <svg className="proof-connector" aria-hidden="true"><path d={line.path} /><circle cx={line.x} cy={line.y} r="3" /><circle cx={line.endX} cy={line.endY} r="3" /></svg> : null}
      </div>
      <div className="proof-attribution"><p>Selected example with a weed prediction; it does not represent overall accuracy. The frozen check found 3 of 88 weeds. <a href="/validation.html">See all 20 validation images<ArrowUpRight aria-hidden="true" /></a></p><p><a href={session.provenance.sourceUrl} target="_blank" rel="noreferrer">PhenoBench · {session.provenance.license}<ArrowUpRight aria-hidden="true" /></a> · Source crop and box overlay. Public UAV data, not a Japanese phone-camera field trial.</p></div>
    </> : <RecordingFallback failed={failed || Boolean(data)} retry={retry} />}
  </section>;
}

export function AgentEvidence() {
  const { data, failed, retry } = usePublishedJson('/assets/verified-run/agent-trace.json');
  const [active, setActive] = useState(0);
  const trace = Array.isArray(data?.trace) ? data.trace : [];
  const capabilities = trace.find(item => item.name === 'greenpoint_capabilities');
  const analysis = trace.find(item => item.name === 'greenpoint_analyze_frame');
  const ready = Array.isArray(capabilities?.result?.tools)
    && Number.isSafeInteger(analysis?.result?.candidate_count)
    && Array.isArray(data?.evidence_ids)
    && ['human_review', 'request_closer_view', 'no_candidates'].includes(data?.decision)
    && data.requires_human_review === true && data.treatment_authorized === false;
  const steps = [
    { name: 'Discover the interface', detail: 'Muse asks what GreenPoint can do.' },
    { name: 'Inspect a source frame', detail: 'MCP returns candidates and their evidence.' },
    { name: 'Choose a review step', detail: 'The agent returns a bounded next step.' },
  ];

  return <section id="agents" className="agent-evidence section-wrap" aria-labelledby="agent-evidence-title">
    <div className="section-heading"><div><p className="evidence-kicker">FOR CAMERA-EQUIPPED AGENTS / MCP</p><h2 id="agent-evidence-title">A field view.<br />For your agent, too.</h2></div><p className="section-copy">Muse can request plant evidence through MCP. A person stays responsible for the field decision.</p></div>
    {ready ? <div className="agent-proof">
      <div className="agent-sequence"><span className="recorded-status">Recorded Muse → MCP run</span><ol aria-label="Recorded Muse MCP sequence">{steps.map((step, index) => <li key={step.name}><button aria-pressed={active === index} aria-controls="agent-step-detail" onClick={() => setActive(index)}><span className="agent-step-number">0{index + 1}</span><span><strong>{step.name}</strong><span>{step.detail}</span></span><ArrowRight aria-hidden="true" /></button></li>)}</ol><p className="agent-replay-note">A separate recorded request, shown as it ran. Selecting a step makes no live model call.</p></div>
      <div id="agent-step-detail" className="agent-readout" aria-live="polite" aria-atomic="true">
        <div className="agent-readout-top"><span>{active === 2 ? 'MUSE / FINAL RESPONSE' : `MCP / TOOL CALL 0${active + 1}`}</span><span>{active === 2 ? data.model : 'Streamable HTTP'}</span></div>
        {active === 0 ? <><h3>Discover before acting.</h3><code className="agent-tool-name">{capabilities.name}</code><dl><div><dt>Available tools</dt><dd>{capabilities.result.tools.length}</dd></div><div><dt>Coordinates</dt><dd>Image-relative</dd></div><div><dt>Human review</dt><dd>{capabilities.result.requires_human_review ? 'Required' : 'Not required'}</dd></div></dl><p>Muse first reads the interface, limits and supported evidence format.</p></> : active === 1 ? <><h3>Return evidence, with limits.</h3><code className="agent-tool-name">{analysis.name}</code><dl><div><dt>Candidates returned</dt><dd>{analysis.result.candidate_count}</dd></div><div><dt>Coverage</dt><dd>One source frame</dd></div><div><dt>Models</dt><dd>{formatModels(analysis.result.models)}</dd></div></dl><p>The response contains candidate boxes, suggested labels and a human-review requirement. Confidence is not calibrated.</p></> : <><h3>A person takes the next step.</h3><code className="agent-tool-name">{data.decision}</code><dl><div><dt>Evidence IDs</dt><dd>{data.evidence_ids.join(' · ')}</dd></div><div><dt>Human review</dt><dd>{data.requires_human_review ? 'Required' : 'Not required'}</dd></div><div><dt>Treatment authorized</dt><dd>{data.treatment_authorized ? 'Yes' : 'No'}</dd></div></dl><p>{data.reasoning}</p></>}
      </div>
    </div> : <RecordingFallback failed={failed || Boolean(data)} retry={retry} />}
    <div className="agent-evidence-footer"><p>Single-frame perception for an upper-level agent. Source-image coordinates, without GPS. Physical robots, flight, navigation and actuation have not been validated.</p><div><a className="source-link" href="/assets/verified-run/agent-trace.json" target="_blank" rel="noreferrer">Read the recorded trace (JSON)<ArrowUpRight aria-hidden="true" /></a><a className="source-link" href="https://github.com/zipking1988/GreenPoint/blob/main/landing/docs/MCP.md" target="_blank" rel="noreferrer">MCP integration guide<ArrowUpRight aria-hidden="true" /></a></div></div>
  </section>;
}
