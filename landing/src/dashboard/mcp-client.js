// A tiny, same-origin diagnostic client. Device integrations use the official
// SDK; the browser needs only public discovery and sample-read operations.
export async function probeMcp(signal) {
  let protocol = '2025-11-25';
  let id = 0;
  async function rpc(method, params, notification = false) {
    const response = await fetch('/api/mcp', {
      method: 'POST', signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': protocol },
      body: JSON.stringify({ jsonrpc: '2.0', ...(notification ? {} : { id: ++id }), method, ...(params ? { params } : {}) }),
    });
    if (!response.ok) throw new Error('The MCP endpoint could not be reached. Retry or check the deployment.');
    if (notification) return;
    const body = await response.json();
    if (body.error || body.result?.isError) throw new Error('The MCP endpoint could not complete its connection test.');
    return body.result;
  }
  const initialized = await rpc('initialize', { protocolVersion: protocol, capabilities: {}, clientInfo: { name: 'greenpoint-dashboard-check', version: '1.0.0' } });
  protocol = initialized.protocolVersion;
  await rpc('notifications/initialized', undefined, true);
  const [tools, capabilities, sample] = await Promise.all([
    rpc('tools/list'), rpc('tools/call', { name: 'greenpoint_capabilities', arguments: {} }),
    rpc('tools/call', { name: 'greenpoint_sample_inventory', arguments: { label: 'all' } }),
  ]);
  if (!Array.isArray(tools.tools) || sample.structuredContent?.mode !== 'illustrative_sample' || !Number.isInteger(sample.structuredContent?.returned)) throw new Error('The server returned an unexpected MCP response.');
  return { tools: tools.tools.length, sample: sample.structuredContent.returned, live: capabilities.structuredContent?.live_analysis_configured === true };
}
