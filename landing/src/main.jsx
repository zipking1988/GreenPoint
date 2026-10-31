import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import './palette.css';

const Dashboard = lazy(() => import('./dashboard/Dashboard.jsx'));
const Landing = lazy(() => import('./App.jsx').then(module => ({ default: module.App })));
const isDashboard = /^\/(dashboard|app)\/?$/.test(location.pathname);

class AppBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main style={{ padding: '15vh 8vw', fontFamily: 'sans-serif', color: 'var(--color-text)', background: 'var(--color-canvas)', minHeight: '100vh' }}><h1>The workspace could not open.</h1><p>Your original video remains on your device. Reload the page to try again.</p><button onClick={() => location.reload()}>Reload workspace</button></main>;
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppBoundary><Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-canvas)' }} role="status" aria-label="Opening GreenPoint workspace" />}>{isDashboard ? <Dashboard /> : <Landing />}</Suspense></AppBoundary>
  </React.StrictMode>,
);
