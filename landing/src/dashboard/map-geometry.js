export function fitImage(viewport, image) {
  const scale = Math.min(viewport.width / image.width, viewport.height / image.height);
  return {
    scale,
    x: (viewport.width - image.width * scale) / 2,
    y: (viewport.height - image.height * scale) / 2,
  };
}

export function constrainView(view, viewport, image) {
  const fit = fitImage(viewport, image);
  const zoom = Math.max(1, Math.min(5, view.zoom));
  const scale = fit.scale * zoom;
  const bound = (position, available, occupied) =>
    occupied <= available
      ? (available - occupied) / 2
      : Math.max(available - occupied, Math.min(0, position));
  return {
    zoom,
    x: bound(view.x, viewport.width, image.width * scale),
    y: bound(view.y, viewport.height, image.height * scale),
    scale,
  };
}

export function zoomView(view, zoom, point, viewport, image) {
  const current = constrainView(view, viewport, image);
  const nextZoom = Math.max(1, Math.min(5, zoom));
  const factor = nextZoom / current.zoom;
  return constrainView(
    {
      zoom: nextZoom,
      x: point.x - (point.x - current.x) * factor,
      y: point.y - (point.y - current.y) * factor,
    },
    viewport,
    image,
  );
}

export function projectBox(box, transform, image) {
  return {
    x: transform.x + box[0] * image.width * transform.scale,
    y: transform.y + box[1] * image.height * transform.scale,
    width: box[2] * image.width * transform.scale,
    height: box[3] * image.height * transform.scale,
  };
}

export function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}
