export async function requestAnalysis(body, accessCode, signal, fetcher = fetch) {
  const response = await fetcher('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Analysis-Token': accessCode }, body: JSON.stringify(body), signal });
  let data;
  try {
    data = await response.json();
  } catch (error) {
    // Aborting after headers arrive can reject while the body is still read.
    // Preserve cancellation so the UI and run log do not report a failure.
    if (error?.name === 'AbortError') throw error;
    if (signal?.aborted) throw signal.reason?.name === 'AbortError' ? signal.reason : new DOMException('Analysis canceled.', 'AbortError');
    throw new Error('The analysis server did not respond. Your video stays available locally.');
  }
  if (!response.ok) {
    const error = new Error(data.error || 'Analysis could not finish. Try again.');
    error.code = typeof data.code === 'string' && /^[a-z0-9_]{1,80}$/.test(data.code) ? data.code : 'analysis_error';
    throw error;
  }
  return data;
}
