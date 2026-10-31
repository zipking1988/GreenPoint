import { parseArgs } from 'node:util';
import { stat } from 'node:fs/promises';
import sharp from 'sharp';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const { values, positionals } = parseArgs({ allowPositionals: true, options: { crop: { type: 'string', default: 'Maize' }, device: { type: 'string', default: 'generic-agent' } } });
const [command = 'capabilities', file] = positionals;
const endpoint = new URL(process.env.GREENPOINT_MCP_URL || 'https://greenpoint-vert.vercel.app/api/mcp');
if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash || (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(endpoint.hostname)))) throw new Error('Use an HTTPS endpoint, or HTTP on loopback for local development.');
const client = new Client({ name: 'greenpoint-generic-robot', version: '1.0.0' });
try {
  let name; let args = {};
  if (command === 'capabilities') name = 'greenpoint_capabilities';
  else if (command === 'sample') name = 'greenpoint_sample_inventory';
  else if (command === 'analyze' && file) {
    if (!process.env.GREENPOINT_MCP_TOKEN) throw new Error('Set GREENPOINT_MCP_TOKEN to the dedicated robot token before sending an image.');
    if ((await stat(file)).size > 20_000_000) throw new Error('Use a source image smaller than 20 MB.');
    const { data, info } = await sharp(file, { limitInputPixels: 30_000_000 }).rotate().resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer({ resolveWithObject: true });
    const image = `data:image/jpeg;base64,${data.toString('base64')}`;
    if (image.length > 1_000_000) throw new Error('Frame exceeds 750 KB after resizing. Reduce image quality or dimensions.');
    name = 'greenpoint_analyze_frame';
    args = { image, width: info.width, height: info.height, crop: values.crop, device_id: values.device, frame_id: `frame-${Date.now()}` };
  } else throw new Error('Usage: robot-client.mjs capabilities | sample | analyze frame.jpg --crop Maize --device robot-01');
  const token = process.env.GREENPOINT_MCP_TOKEN;
  await client.connect(new StreamableHTTPClientTransport(endpoint, { requestInit: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined }));
  const { tools } = await client.listTools();
  if (!tools.some(tool => tool.name === name)) throw new Error('This endpoint does not advertise the requested GreenPoint tool.');
  const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 115_000 });
  console.log(JSON.stringify(result.structuredContent || result, null, 2));
  if (result.isError) process.exitCode = 1;
} catch (error) {
  // SDK HTTP errors can contain request context. Never print credentials.
  const token = process.env.GREENPOINT_MCP_TOKEN;
  console.error(token ? String(error.message).replaceAll(token, '[redacted]') : error.message);
  process.exitCode = 1;
} finally { await client.close(); }
