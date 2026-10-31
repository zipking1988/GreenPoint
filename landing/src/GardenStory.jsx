import { useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { WarningCircle } from '@phosphor-icons/react/dist/csr/WarningCircle';
import { MeasuredCopy } from './MeasuredCopy.jsx';
import './garden-story.css';

const sources = {
  weeding: 'https://www.thrive.org.uk/get-gardening/weeding-the-garden',
  help: 'https://www.thrive.org.uk/get-gardening/getting-help-with-your-garden',
  rhs: 'https://www.rhs.org.uk/weeds/identify-common-weeds',
  pictureThis: 'https://www.picturethisai.com/faq',
  plantNet: 'https://plantnet.org/en/',
};

function SourceLink({ href, children }) {
  return <a className="garden-source-link" href={href} target="_blank" rel="noreferrer">{children}<ArrowUpRight aria-hidden="true" /></a>;
}

export function GardenNeed() {
  return <section className="garden-need section-wrap" id="why-garden" aria-labelledby="need-title">
    <div className="garden-story-heading"><h2 id="need-title">Small shoots.<br /><span>Real hesitation.</span></h2><div><MeasuredCopy>A vegetable bed holds things you planted, things you welcome, and things you don’t. The first green leaves don’t always tell you which is which.</MeasuredCopy><p className="garden-audience">For everyday gardeners, older growers and family helpers.</p></div></div>
    <div className="garden-need-layout">
      <figure className="garden-grower"><img src="/assets/garden-grower.webp" alt="Illustration of an older gardener looking at a phone beside a vegetable bed." width="1920" height="1080" loading="lazy" /><figcaption>For the garden you care about.<span>AI-generated illustration · not a customer</span></figcaption></figure>
      <div className="garden-research-notes">
        <article><span className="garden-note-number">01 / RECOGNITION</span><h3>Young plants can look alike.</h3><p>Thrive notes that the first shoots and leaves can be hard to identify. Its guidance also describes extra challenges for gardeners with sight loss.</p><SourceLink href={sources.weeding}>Read Thrive’s weeding guidance</SourceLink></article>
        <article><span className="garden-note-number">02 / CONTEXT</span><h3>“Weed” is a garden decision.</h3><p>The RHS defines a weed by where it is unwanted. A plant may support wildlife and still be unwelcome in a vegetable row. Your intention matters.</p><SourceLink href={sources.rhs}>Read the RHS identification guide</SourceLink></article>
        <article><span className="garden-note-number">03 / EVERYDAY SUPPORT</span><h3>Help starts with a clear task.</h3><p>Thrive recommends identifying the jobs that need help, including weeding. We’re exploring whether a visual review list could make that conversation clearer.</p><SourceLink href={sources.help}>Read Thrive’s advice on getting help</SourceLink></article>
      </div>
    </div>
    <p className="garden-research-boundary">These sources inform the problem. They are not endorsements or GreenPoint user studies. Reviewing a plant does not remove it or replace practical gardening help.</p>
  </section>;
}

const stages = [
  { title: 'Start with a clip', short: 'Your video', role: 'LOCAL PREVIEW', heading: 'A steady look at one small bed.', body: 'Choose a phone video up to six seconds long and select the crop you intend to grow. The browser samples at half-second intervals, up to twelve frames.', detail: 'Longer videos, up to two minutes, can be previewed locally. Trim them before analysis.', visual: 'capture' },
  { title: 'Find candidates', short: 'Segmentation', role: 'SAM 3.1 · INTEGRATION', heading: 'Find plant regions worth a closer look.', body: 'Sampled frames go to segmentation. A conservative geometric matcher links nearby observations; weak matches remain separate candidates.', detail: 'A candidate is a review record. It is not proof of a unique plant across a moving scene.', visual: 'segment' },
  { title: 'Read the evidence', short: 'Classification', role: 'MUSE SPARK 1.3 · INTEGRATION', heading: 'A suggestion with its image attached.', body: 'Cropped observations and your selected crop provide context for crop, weed or uncertain suggestions. The original label, confidence and explanation remain available for inspection.', detail: 'Blur, overlap and unfamiliar plants can still produce mistakes. Live-provider validation is pending.', visual: 'classify' },
  { title: 'Make the decision', short: 'Human review', role: 'YOU · FINAL DECISION', heading: 'Keep it. Mark it. Or come back later.', body: 'Confirm a crop or weed decision, or defer it without clearing the review queue. Export the original suggestion alongside your decision, run ID and image coordinates.', detail: 'A fresh run keeps earlier results and decisions. Exported CSV records refer to frames, not GPS locations.', visual: 'review' },
];

export function VideoJourney() {
  const [selected, setSelected] = useState(0);
  const stage = stages[selected];
  return <section id="how-it-works" className="garden-journey section-wrap" aria-labelledby="journey-title">
    <div className="garden-story-heading"><h2 id="journey-title">From a short video.<br /><span>To a considered decision.</span></h2><div><MeasuredCopy>One small area at a time. Follow the workflow from your phone to a plant candidate list with evidence you can inspect.</MeasuredCopy><p className="garden-journey-disclosure">Workflow illustration below · no model calls</p></div></div>
    <ol className="garden-stage-controls" aria-label="Explore the video workflow">{stages.map((item, index) => <li key={item.short}><button aria-pressed={selected === index} aria-controls="garden-stage-panel" onClick={() => setSelected(index)}><span>0{index + 1}</span>{item.short}<ArrowRight aria-hidden="true" /></button></li>)}</ol>
    <div id="garden-stage-panel" className="garden-stage-panel" aria-live="polite" aria-atomic="true">
      <div className={`garden-stage-visual garden-stage-${stage.visual}`}>
        <div className="garden-stage-image"><img src="/assets/garden-evidence.webp" alt="Illustrative vegetable bed used to explain the video review workflow." width="1920" height="850" loading="lazy" />{selected === 1 && <span className="garden-stage-box" aria-hidden="true">GP-007</span>}{selected === 2 && <span className="garden-stage-image-label">GP-007 · illustrative observation</span>}</div>
        {selected === 0 ? <div className="garden-sampling"><div className="garden-sampling-times" aria-label="Sampling timestamps for an illustrative six-second clip">{Array.from({ length: 12 }, (_, i) => <span key={i}>{(i / 2).toFixed(1)}s</span>)}</div><p>6-second clip · 0.5-second intervals · at most 12 frames</p></div> : selected === 1 ? <p className="garden-stage-caption">Illustrative selection · image coordinates only</p> : selected === 2 ? <p className="garden-stage-caption">Original suggestion: <strong>uncertain</strong> · human review required</p> : <dl className="garden-example-record"><div><dt>Original suggestion</dt><dd>uncertain</dd></div><div><dt>Example decision</dt><dd>crop · confirmed</dd></div><div><dt>Source</dt><dd>illustrative_garden_example</dd></div></dl>}
        <span className="garden-stage-art-label">AI-generated source image · illustrative workflow</span>
      </div>
      <div className="garden-stage-copy" key={selected}><span className="technical-label">{stage.role}</span><h3>{stage.heading}</h3><MeasuredCopy>{stage.body}</MeasuredCopy><p className="garden-stage-detail">{stage.detail}</p>{selected === 3 && <a className="text-link" href="#garden-example">Try your own example decision<ArrowRight aria-hidden="true" /></a>}</div>
    </div>
    <div className="garden-capture-guide"><strong>For a useful clip</strong><p>Stay close enough to see leaves. Move slowly in good light. Film one small area. If plants overlap or the view is blurred, take a clearer clip before deciding.</p><a className="text-link" href="/dashboard?view=video&upload=1">Choose a video<ArrowUpRight aria-hidden="true" /></a></div>
  </section>;
}

export function GardenDifference() {
  return <section className="garden-difference section-wrap" aria-labelledby="difference-title">
    <div className="garden-story-heading"><h2 id="difference-title">A name helps.<br /><span>A review record adds context.</span></h2><MeasuredCopy>Plant identification is already useful and widely available. GreenPoint explores a particular workflow: several plant candidates from a short clip, with each suggestion kept beside your decision.</MeasuredCopy></div>
    <div className="garden-comparison" role="region" aria-label="Plant tools and the GreenPoint prototype">
      <article><h3>Pl@ntNet</h3><p>Picture-based plant identification and contributions to a biodiversity citizen science project.</p><SourceLink href={sources.plantNet}>Explore Pl@ntNet</SourceLink></article>
      <article><h3>PictureThis</h3><p>Photo-based identification, including weed identification and advice on removal. Its FAQ also explains how to correct a result.</p><SourceLink href={sources.pictureThis}>Read PictureThis’s FAQ</SourceLink></article>
      <article className="garden-comparison-current"><h3>GreenPoint</h3><p>A short-video candidate inventory, source-linked review, separate model and human labels, and a traceable CSV export.</p><span className="garden-status-label">Research prototype · live validation pending</span></article>
    </div>
    <p className="garden-research-boundary">A comparison of focus, not an accuracy benchmark or a claim that other tools lack review features. Sources checked 31 October 2026.</p>
  </section>;
}

export function GardenBoundaries() {
  return <section className="garden-boundaries section-wrap" aria-labelledby="boundaries-title">
    <div className="garden-boundary-lead"><WarningCircle aria-hidden="true" /><h2 id="boundaries-title">A second look<br /><span>is a valid result.</span></h2><MeasuredCopy>A convincing label can still be wrong. Inspect the image, use what you know about your bed, and leave uncertain plants for another look.</MeasuredCopy><a className="text-link" href="#garden-example">Try “Decide later”<ArrowRight aria-hidden="true" /></a></div>
    <dl className="garden-limit-list"><div><dt>Blur or hidden leaves</dt><dd>Important features may be missing. A clearer, closer view can help; the current model may still misclassify a plant.</dd></div><div><dt>Repeated or missed plants</dt><dd>Matching is conservative. One plant may appear as several candidates, and a clip cannot establish that an area is weed-free.</dd></div><div><dt>Your garden’s intention</dt><dd>Crop context helps, but a model cannot know everything you want to keep. A volunteer plant or wildflower may be welcome.</dd></div><div><dt>Interrupted analysis</dt><dd>Completed detections remain available when processing fails or is canceled. Partial coverage is shown as partial, ready for review.</dd></div></dl>
  </section>;
}

const faqs = [
  ['Do I need a drone or special camera?', 'No. This workflow is designed around a video file from an ordinary phone. Choose a steady clip of one small garden area; no drone, GPS device or field equipment is required.'],
  ['Does uploading immediately run the AI?', 'No. Uploading creates a local preview. You choose when to start analysis. Live analysis needs configured server credentials and an operator access code; model validation is currently pending. The illustrative sample can be explored now.'],
  ['How long can my video be?', 'Preview supports videos up to 120 seconds. Analysis accepts clips up to six seconds, sampled every 0.5 seconds with a maximum of 12 frames. Longer clips must be trimmed before analysis; the app does not silently analyze just the first six seconds.'],
  ['Where do my video and decisions go?', 'Your video preview and live review results stay in the current tab. Starting configured analysis sends sampled frames through the server to the model provider. GreenPoint has no database for your video or live results; this is not a statement about the provider’s retention policy. Export before leaving. The workspace warns about unexported live changes.'],
  ['Will it tell me exactly what to pull or spray?', 'It provides plant candidates and suggestions for your review. It does not prescribe chemicals, verify edibility, or operate equipment. No accuracy, labour-saving or pesticide-saving result has been measured.'],
  ['Is it tested with older gardeners?', 'Not yet. Older growers and family helpers are part of the intended audience, not a validated customer group. The interface uses readable text, large controls and explicit decisions. Testing comprehension, recording comfort and usefulness with gardeners is the next step.'],
  ['Is the field map a map of my garden?', 'The whole-field map is a separate illustrative workspace. Your uploaded video creates frame-based candidates, not a geographic garden map. Image coordinates are not GPS, and candidate IDs do not guarantee a unique physical identity.'],
];

export function GardenReadiness() {
  return <>
    <section id="prototype" className="garden-readiness section-wrap" aria-labelledby="readiness-title">
      <div className="garden-story-heading"><h2 id="readiness-title">Explore what works.<br /><span>See what’s still to prove.</span></h2><div><MeasuredCopy>The review experience is available today. The real test is whether model suggestions and this workflow help gardeners make better-informed decisions.</MeasuredCopy><a className="garden-source-link" href="https://github.com/zipking1988/GreenPoint" target="_blank" rel="noreferrer">Inspect the project on GitHub<ArrowUpRight aria-hidden="true" /></a></div></div>
      <div className="garden-readiness-columns"><div><span className="garden-status-label garden-status-available">AVAILABLE TO EXPLORE</span><h3>The working review flow</h3><ul><li>Local video preview and bounded frame sampling</li><li>Illustrative plant evidence and human decisions</li><li>Review queue, deferred items and CSV provenance</li><li>Separate, stateless MCP interface for agents</li></ul><a className="text-link" href="/dashboard?view=video">Open the video workspace<ArrowRight aria-hidden="true" /></a></div><div><span className="garden-status-label">VALIDATION PENDING</span><h3>The next evidence to collect</h3><ul><li>Real-provider segmentation and classification runs</li><li>Clear and challenging clips, with errors recorded</li><li>Missed plants, duplicates and uncertain suggestions</li><li>Usability sessions with gardeners and family helpers</li></ul><p className="garden-validation-note">No measured accuracy or customer outcome is claimed. Source images on this page are illustrations.</p></div></div>
    </section>
    <section className="garden-questions section-wrap" aria-labelledby="questions-title"><div><h2 id="questions-title">Before you<br /><span>take a closer look.</span></h2><p>A few practical answers before you try the prototype.</p></div><div className="garden-faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<Plus aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></section>
  </>;
}
