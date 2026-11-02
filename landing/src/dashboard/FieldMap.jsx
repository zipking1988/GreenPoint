import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MapPin } from '@phosphor-icons/react/dist/csr/MapPin';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { Minus } from '@phosphor-icons/react/dist/csr/Minus';
import { Crosshair } from '@phosphor-icons/react/dist/csr/Crosshair';
import { SURVEY_IMAGE, ZONES, FIELD_BOUNDARY, UNOBSERVED } from './survey-data.js';
import { constrainView, fitImage, pointInPolygon, projectBox, zoomView } from './map-geometry.js';

const INITIAL_SIZE = { width: 1000, height: 800 };
const INITIAL_IMAGE = { width: 1355, height: 1161 };

function regionPath(context, points, image, smooth = true) {
  const pixels = points.map(([x, y]) => [x * image.width, y * image.height]);
  context.beginPath();
  if (smooth) {
    const last = pixels.at(-1),
      first = pixels[0];
    context.moveTo((last[0] + first[0]) / 2, (last[1] + first[1]) / 2);
    pixels.forEach((p, i) => {
      const next = pixels[(i + 1) % pixels.length];
      context.quadraticCurveTo(p[0], p[1], (p[0] + next[0]) / 2, (p[1] + next[1]) / 2);
    });
  } else {
    pixels.forEach((p, i) => (i ? context.lineTo(...p) : context.moveTo(...p)));
  }
  context.closePath();
}

// These are interactive image-coordinate overlays, not fabricated map artwork.
function Regions({ image, scale, layer, selectedZone }) {
  const canvas = useRef(null);
  useEffect(() => {
    const ctx = canvas.current.getContext('2d');
    ctx.clearRect(0, 0, image.width, image.height);
    const unit = 1 / scale;
    if (layer !== 'evidence') {
      for (const zone of ZONES) {
        if (layer === 'coverage') continue;
        regionPath(ctx, zone.polygon, image);
        ctx.fillStyle =
          zone.kind === 'uncertain' ? '#edcc793d' : zone.moderate ? '#ef987f33' : '#ef987f59';
        ctx.fill();
        ctx.strokeStyle = zone.kind === 'uncertain' ? '#edcc79' : '#ef987f';
        ctx.lineWidth = (zone.id === selectedZone ? 2.5 : 1.7) * unit;
        ctx.setLineDash(zone.kind === 'uncertain' ? [7 * unit, 5 * unit] : []);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
    regionPath(ctx, FIELD_BOUNDARY, image, false);
    ctx.lineWidth = 1.8 * unit;
    ctx.strokeStyle = '#f1f2edda';
    ctx.stroke();
    regionPath(ctx, UNOBSERVED, image, false);
    ctx.fillStyle = '#242b29a8';
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = '#d4dbd390';
    ctx.lineWidth = unit;
    const spacing = 12 * unit;
    for (let x = -image.height; x < image.width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, image.height);
      ctx.lineTo(x + image.height, 0);
      ctx.stroke();
    }
    ctx.restore();
    regionPath(ctx, UNOBSERVED, image, false);
    ctx.strokeStyle = '#b6c1ba';
    ctx.lineWidth = 1.5 * unit;
    ctx.stroke();
  }, [image, scale, layer, selectedZone]);
  return (
    <canvas
      ref={canvas}
      width={image.width}
      height={image.height}
      className="sf-regions"
      aria-hidden="true"
    />
  );
}

export function FieldMap({
  plants,
  selected,
  layer,
  onLayer,
  onSelect,
  onZone,
  onUnobserved,
  sourceRef,
  onGeometry,
  sourceImage,
}) {
  const real = Boolean(sourceImage);
  const zones = real ? [] : ZONES;
  const stage = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const moved = useRef(false);
  const [size, setSize] = useState(INITIAL_SIZE);
  const [image, setImage] = useState(INITIAL_IMAGE);
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const transform = constrainView(view, size, image);
  const viewRef = useRef(transform);
  viewRef.current = transform;
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0)
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    onGeometry();
  }, [transform.x, transform.y, transform.scale, selected?.id, selected?.box.join(','), sourceImage, layer, onGeometry]);
  useEffect(() => {
    const element = stage.current;
    const wheel = (event) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      setView((current) =>
        zoomView(
          current,
          current.zoom * Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * 0.0025),
          { x: event.clientX - rect.left, y: event.clientY - rect.top },
          size,
          image,
        ),
      );
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [size, image]);
  useEffect(() => {
    if (!selected) return;
    const current = viewRef.current;
    const box = projectBox(selected.box, current, image);
    const cx = box.x + box.width / 2,
      cy = box.y + box.height / 2;
    if (cx < 55 || cx > size.width - 55 || cy < 75 || cy > size.height - 95) {
      setView(
        constrainView(
          {
            ...current,
            x:
              size.width / 2 -
              (selected.box[0] + selected.box[2] / 2) * image.width * current.scale,
            y:
              size.height / 2 -
              (selected.box[1] + selected.box[3] / 2) * image.height * current.scale,
          },
          size,
          image,
        ),
      );
    }
  }, [selected?.id, selected?.box.join(','), image.width, image.height, size.width, size.height]);
  function zoom(factor) {
    setView((current) =>
      zoomView(
        current,
        current.zoom * factor,
        { x: size.width / 2, y: size.height / 2 },
        size,
        image,
      ),
    );
  }
  function fit() {
    const fitted = fitImage(size, image);
    setView({ zoom: 1, x: fitted.x, y: fitted.y });
  }
  function start(event) {
    if (event.target.closest('button')) return;
    stage.current.focus({ preventScroll: true });
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    stage.current.setPointerCapture(event.pointerId);
    const positions = [...pointers.current.values()];
    const rect = stage.current.getBoundingClientRect();
    gesture.current = {
      view: viewRef.current,
      origin: positions[0],
      rect,
      distance:
        positions.length === 2
          ? Math.hypot(positions[1].x - positions[0].x, positions[1].y - positions[0].y)
          : 0,
    };
    moved.current = false;
    setPanning(true);
  }
  function move(event) {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const positions = [...pointers.current.values()],
      initial = gesture.current;
    if (positions.length === 2 && initial.distance) {
      const distance = Math.hypot(positions[1].x - positions[0].x, positions[1].y - positions[0].y);
      const center = {
        x: (positions[0].x + positions[1].x) / 2 - initial.rect.left,
        y: (positions[0].y + positions[1].y) / 2 - initial.rect.top,
      };
      setView(
        zoomView(
          initial.view,
          (initial.view.zoom * distance) / initial.distance,
          center,
          size,
          image,
        ),
      );
      moved.current = true;
    } else {
      const dx = positions[0].x - initial.origin.x,
        dy = positions[0].y - initial.origin.y;
      if (Math.hypot(dx, dy) > 4) moved.current = true;
      setView(
        constrainView(
          { ...initial.view, x: initial.view.x + dx, y: initial.view.y + dy },
          size,
          image,
        ),
      );
    }
  }
  function end(event) {
    const wasGesture = gesture.current;
    pointers.current.delete(event.pointerId);
    if (stage.current.hasPointerCapture(event.pointerId))
      stage.current.releasePointerCapture(event.pointerId);
    if (!pointers.current.size) {
      gesture.current = null;
      setPanning(false);
    } else {
      const origin = [...pointers.current.values()][0];
      gesture.current = {
        view: viewRef.current,
        origin,
        rect: stage.current.getBoundingClientRect(),
        distance: 0,
      };
    }
    if (!wasGesture || moved.current || event.type === 'pointercancel') return;
    const rect = stage.current.getBoundingClientRect(),
      current = viewRef.current;
    const point = [
      (event.clientX - rect.left - current.x) / (image.width * current.scale),
      (event.clientY - rect.top - current.y) / (image.height * current.scale),
    ];
    if (!real && pointInPolygon(point, UNOBSERVED)) {
      onUnobserved();
      return;
    }
    const zone = zones.find((zone) => pointInPolygon(point, zone.polygon));
    if (zone) onZone(zone.id);
  }
  function key(event) {
    if (event.target !== stage.current) return;
    const delta = {
      ArrowLeft: [70, 0],
      ArrowRight: [-70, 0],
      ArrowUp: [0, 70],
      ArrowDown: [0, -70],
    }[event.key];
    if (delta) {
      event.preventDefault();
      setView((current) =>
        constrainView(
          { ...viewRef.current, x: viewRef.current.x + delta[0], y: viewRef.current.y + delta[1] },
          size,
          image,
        ),
      );
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoom(1.3);
    }
    if (event.key === '-') {
      event.preventDefault();
      zoom(1 / 1.3);
    }
    if (event.key === 'Home' || event.key === '0') {
      event.preventDefault();
      fit();
    }
  }
  const sourceBox = selected ? projectBox(selected.box, transform, image) : null;
  const sourceVisible =
    sourceBox &&
    sourceBox.x + sourceBox.width / 2 > 0 &&
    sourceBox.x + sourceBox.width / 2 < size.width &&
    sourceBox.y + sourceBox.height / 2 > 0 &&
    sourceBox.y + sourceBox.height / 2 < size.height;
  const point = ([x, y]) => ({
    left: transform.x + x * image.width * transform.scale,
    top: transform.y + y * image.height * transform.scale,
  });
  return (
    <div
      className={`sf-map-stage ${panning ? 'sf-panning' : ''}`}
      ref={stage}
      tabIndex={0}
      role="region"
      aria-label={`${real ? 'Source frame evidence map' : 'Illustrative field map'}. Drag to pan, plus or minus to zoom, Home to fit.`}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={key}
    >
      <div
        className="sf-image-world"
        style={{
          width: image.width,
          height: image.height,
          transform: `translate(${transform.x}px,${transform.y}px) scale(${transform.scale})`,
        }}
      >
        <img
          src={sourceImage ?? SURVEY_IMAGE}
          alt={real ? 'Original source frame with observed plant candidates in image coordinates' : 'Illustrative overhead vegetable plot with its complete field boundary and surrounding paths'}
          draggable="false"
          onLoad={(event) =>
            setImage({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            })
          }
        />
        {!real && <Regions
          image={image}
          scale={transform.scale}
          layer={layer}
          selectedZone={selected?.zone}
        />}
      </div>
      <div className="sf-layers" role="group" aria-label="Map layer">
        {(real ? [['evidence', 'Plant evidence']] : [
          ['weed', 'Weed cover'],
          ['evidence', 'Evidence'],
          ['coverage', 'Coverage'],
        ]).map(([value, text]) => (
          <button
            type="button"
            key={value}
            aria-pressed={layer === value}
            onClick={() => onLayer(value)}
          >
            <span className={`sf-layer-dot sf-layer-${value}`} />
            {text}
          </button>
        ))}
      </div>
      {layer !== 'coverage' &&
        zones.map((zone) => (
          <button
            type="button"
            key={zone.id}
            className={`sf-zone-marker sf-zone-${zone.kind} ${selected?.zone === zone.id ? 'sf-zone-selected' : ''}`}
            style={point(zone.point)}
            onClick={() => onZone(zone.id)}
            aria-label={`Inspect zone ${zone.id}: illustrative ${zone.text.toLowerCase()}`}
            aria-pressed={selected?.zone === zone.id}
          >
            <MapPin size={38} weight="fill" />
            <span>
              {zone.id}
              {zone.kind === 'uncertain' && <small>Needs review</small>}
            </span>
          </button>
        ))}
      {(real || layer === 'evidence') &&
        plants.map((plant) => (
          <button
            type="button"
            key={plant.id}
            className={`sf-plant-marker sf-mark-${plant.label}`}
            style={point([plant.box[0] + plant.box[2] / 2, plant.box[1] + plant.box[3] / 2])}
            onClick={() => onSelect(plant.id)}
            aria-label={`Inspect ${plant.id}: ${plant.label === 'uncertain' ? 'needs review' : plant.label}`}
            aria-pressed={selected?.id === plant.id}
          >
            {plant.id}{real && <small> · {plant.label === 'uncertain' ? '?' : plant.label}</small>}
          </button>
        ))}
      {real && plants.map(plant => {
        const box = projectBox(plant.box, transform, image);
        return <div key={`box-${plant.id}`} className={`sf-candidate-outline sf-kind-${plant.label}`} style={{ left: box.x, top: box.y, width: box.width, height: box.height }} aria-hidden="true" />;
      })}
      {sourceBox && sourceVisible && (
        <div
          className="sf-source-selection"
          ref={sourceRef}
          style={{
            left: sourceBox.x,
            top: sourceBox.y,
            width: sourceBox.width,
            height: sourceBox.height,
          }}
          aria-hidden="true"
        >
          <span>{selected.id}</span>
        </div>
      )}
      {!real && <button
        type="button"
        className="sf-unobserved-label"
        style={point([0.84, 0.73])}
        onClick={onUnobserved}
      >
        Not observed
      </button>}
      <div className="sf-map-bottom">
        <div className="sf-legend" aria-label="Map legend">
          {!real && layer === 'weed' && (
            <div className="sf-legend-density">
              <b>Weed presence</b>
              <span>
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
              <small>
                Low <span>High</span>
              </small>
            </div>
          )}
          {real && <div className="sf-legend-item">Source pixels · No GPS<br />Only candidates in this frame</div>}
          {!real && <div className="sf-legend-item">
            <span className="sf-legend-review" />
            Needs review
          </div>}
          {!real && <div className="sf-legend-item">
            <span className="sf-legend-unknown" />
            Not observed
          </div>}
        </div>
        <div className="sf-map-controls">
          <button type="button" onClick={fit} aria-label="Fit entire field">
            <Crosshair size={19} />
            <span>Fit field</span>
          </button>
          <button
            type="button"
            onClick={() => zoom(1 / 1.3)}
            disabled={transform.zoom <= 1.001}
            aria-label="Zoom out"
          >
            <Minus size={19} />
          </button>
          <button
            type="button"
            onClick={() => zoom(1.3)}
            disabled={transform.zoom >= 4.999}
            aria-label="Zoom in"
          >
            <Plus size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}
