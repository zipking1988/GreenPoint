import { useEffect, useRef, useState } from 'react';
import { Crosshair } from '@phosphor-icons/react/dist/csr/Crosshair';
import { Leaf } from '@phosphor-icons/react/dist/csr/Leaf';
import { Copy } from '@phosphor-icons/react/dist/csr/Copy';
import { Check } from '@phosphor-icons/react/dist/csr/Check';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { PlugsConnected } from '@phosphor-icons/react/dist/csr/PlugsConnected';
import { probeMcp } from './mcp-client.js';

export function Connections({ provider, accessCode, setAccessCode, onCheck, onDone }) {
  const [tab, setTab] = useState('models');
  const [copied, setCopied] = useState(false);
  const [test, setTest] = useState({ phase: 'idle' });
  const request = useRef(null);
  const endpoint = `${window.location.origin}/api/mcp`;
  const modelStatus = model => !provider.checked ? 'Checking…' : provider.error ? 'Check failed' : !provider.configured ? 'Not configured' : provider.verified.includes(model) ? 'Verified in this tab' : 'Configured · not verified';
  useEffect(() => () => request.current?.abort(), []);
  function moveTab(event) {
    const choices = ['models', 'robots'];
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'models' : event.key === 'End' ? 'robots' : choices[1 - choices.indexOf(tab)];
    setTab(next); event.currentTarget.parentElement.querySelector(`#gp-tab-${next}`)?.focus();
  }
  async function copyEndpoint() {
    try { await navigator.clipboard.writeText(endpoint); setCopied(true); }
    catch { setCopied(false); setTest({ phase: 'error', message: 'Copy is unavailable. Select and copy the endpoint field.' }); }
  }
  async function runTest() {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setTest({ phase: 'checking' });
    try {
      const result = await probeMcp(AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]));
      setTest({ phase: 'success', ...result });
    } catch (error) {
      if (!controller.signal.aborted) setTest({ phase: 'error', message: error.name === 'TimeoutError' ? 'The connection test timed out. Try again.' : error.message });
    }
  }
  return <>
    <div className="gp-connection-tabs" role="tablist" aria-label="Connection type">{[['models', 'Analysis models'], ['robots', 'Robots & agents']].map(([value, label]) => <button key={value} id={`gp-tab-${value}`} role="tab" aria-selected={tab === value} aria-controls={`gp-panel-${value}`} tabIndex={tab === value ? 0 : -1} onKeyDown={moveTab} onClick={() => setTab(value)}>{label}</button>)}</div>
    {tab === 'models' ? <section id="gp-panel-models" role="tabpanel" aria-labelledby="gp-tab-models">
      <p className="gp-dialog-intro">Live analysis uses SAM 3.1 to locate plants and Muse Spark to suggest labels. Your judgment remains the final step.</p>
      <div className="gp-provider-row"><span><Crosshair size={21} /><b>SAM 3.1</b><small>Plant segmentation</small></span><span className={provider.verified.includes('sam-3.1') ? 'gp-connected' : 'gp-disconnected'}>{modelStatus('sam-3.1')}</span></div>
      <div className="gp-provider-row"><span><Leaf size={21} /><b>Muse Spark 1.3</b><small>Visual classification</small></span><span className={provider.verified.includes('muse-spark-1.3') ? 'gp-connected' : 'gp-disconnected'}>{modelStatus('muse-spark-1.3')}</span></div>
      {provider.configured ? <><p className="gp-connection-note">The server has configuration. Credentials and models are verified only after successful analysis. Checking the connection does not call a model.</p><label className="gp-access-label">Analysis access code<input type="password" autoComplete="off" value={accessCode} onChange={e => setAccessCode(e.target.value)} placeholder="Enter the workspace access code" /><small>Kept in memory for this tab. Never saved in your browser.</small></label></> : <p className="gp-connection-note">{provider.error ? 'Connection check failed. Retry; the configuration status is unknown.' : provider.checked ? 'This deployment is in sample mode. The workspace owner needs to configure the model service before live analysis is available.' : 'Checking the server configuration…'}</p>}
    </section> : <section id="gp-panel-robots" role="tabpanel" aria-labelledby="gp-tab-robots" className="gp-mcp-panel">
      <p className="gp-dialog-intro">Give your robot’s agent a field view.<br />Connect through MCP to inspect plants from camera snapshots.</p>
      <div className="gp-mcp-transport"><PlugsConnected size={20} /><strong>Streamable HTTP</strong><span>Stateless · v1.0</span></div>
      <label className="gp-mcp-endpoint-label" htmlFor="gp-mcp-endpoint">MCP server endpoint</label>
      <div className="gp-mcp-endpoint"><input id="gp-mcp-endpoint" readOnly value={endpoint} onFocus={event => event.target.select()} /><button type="button" className="gp-icon-button" aria-label={copied ? 'Endpoint copied' : 'Copy MCP endpoint'} onClick={copyEndpoint}>{copied ? <Check size={18} /> : <Copy size={18} />}</button></div>
      <p className="gp-mcp-copy-status" role="status">{copied ? 'Endpoint copied.' : 'Public discovery and illustrative sample tools need no key.'}</p>
      <div className="gp-mcp-test"><button className="gp-button gp-button-secondary" disabled={test.phase === 'checking'} onClick={runTest}><ArrowCounterClockwise size={16} />{test.phase === 'checking' ? 'Testing MCP…' : 'Run MCP test'}</button><p role="status" className={test.phase === 'error' ? 'gp-disconnected' : 'gp-connected'}>{test.phase === 'success' ? `${test.tools} tools discovered · ${test.sample} sample plants returned.` : test.phase === 'error' ? test.message : test.phase === 'checking' ? 'Initializing and calling the public tools…' : 'Tests the actual endpoint without a model call.'}</p></div>
      <ul className="gp-mcp-tools">
        <li><code>greenpoint_capabilities</code><span>Read readiness, limits and coordinate format.</span><small>Public</small></li>
        <li><code>greenpoint_sample_inventory</code><span>Try 12 illustrative plant records.</span><small>Public</small></li>
        <li><code>greenpoint_analyze_frame</code><span>Submit one JPEG for candidate detection and review.</span><small>Token required</small></li>
      </ul>
      <p className="gp-mcp-boundary">Live analysis requires a separate owner-provisioned robot token{test.phase === 'success' ? test.live ? ' · server configured.' : ' · not connected yet.' : '.'} Results use image coordinates and require human review. Hardware adapters handle flight, navigation and actions.</p>
      <a className="gp-mcp-guide" href="https://github.com/zipking1988/GreenPoint/blob/main/landing/docs/MCP.md" target="_blank" rel="noreferrer">SDK example & integration guide<ArrowUpRight size={16} /></a>
    </section>}
    <div className="gp-dialog-actions">{tab === 'models' ? <button className="gp-text-button" onClick={onCheck}><ArrowCounterClockwise size={16} />Check connection</button> : <span className="gp-mcp-footer-note">Snapshots in. Evidence out.</span>}<button className="gp-button gp-button-primary" onClick={onDone}>Done<Check size={17} /></button></div>
  </>;
}
