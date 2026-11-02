import { useEffect, useState } from 'react';
import { restoreSampleEdit, sampleSession } from './data.js';

export function makeSample() {
  const sample = sampleSession();
  try {
    const saved = JSON.parse(localStorage.getItem('greenpoint-review-v2') || localStorage.getItem('greenpoint-review-v1') || '{}');
    sample.plants = sample.plants.map(p => restoreSampleEdit(p, saved[p.id]));
  } catch { /* Local storage is optional. */ }
  return sample;
}

export function useSessionStore() {
  const [sessions, setSessions] = useState(() => [makeSample()]);
  const [activeId, setActiveId] = useState('sample-east-plot');
  const [selectedId, setSelectedId] = useState('GP-007');
  const [activeFrame, setActiveFrame] = useState(0);
  const dirty = sessions.some(session => session.dirty);
  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  return { sessions, setSessions, activeId, setActiveId, selectedId, setSelectedId, activeFrame, setActiveFrame };
}
