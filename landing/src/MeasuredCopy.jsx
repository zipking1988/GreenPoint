import { useEffect, useRef, useState } from 'react';
import { prepare, layout } from '@chenglou/pretext';

// Native text remains readable before fonts or measurement finish. Pretext
// reserves the measured height as the container reflows, without clipping it.
export function MeasuredCopy({ children, className = '' }) {
  const elementRef = useRef(null);
  const [height, setHeight] = useState(undefined);
  useEffect(() => {
    const element = elementRef.current;
    let canceled = false;
    let observer;
    let handle;
    let previousFont;
    const measure = () => {
      if (canceled || !element.clientWidth) return;
      const style = getComputedStyle(element);
      const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      if (!handle || previousFont !== font) {
        handle = prepare(children, font);
        previousFont = font;
      }
      const result = layout(handle, element.clientWidth, parseFloat(style.lineHeight));
      setHeight(Math.ceil(result.height));
    };
    document.fonts.ready.then(() => {
      if (canceled) return;
      measure();
      observer = new ResizeObserver(measure);
      observer.observe(element);
    });
    return () => { canceled = true; observer?.disconnect(); };
  }, [children]);
  return <p ref={elementRef} className={className} style={{ minHeight: height }}>{children}</p>;
}
