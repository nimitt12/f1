import React, { useCallback, useRef } from 'react';

interface TiltProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum tilt in degrees on each axis. */
  max?: number;
  /** Scale applied on hover for a subtle "lift". */
  scale?: number;
  /** Render a moving specular highlight that follows the cursor. */
  glare?: boolean;
  /** Class applied to the tilting card element (so visual styles tilt, not just content). */
  className?: string;
  children: React.ReactNode;
}

/**
 * Lightweight, dependency-free 3D tilt wrapper. The cursor position drives a
 * perspective rotation (rAF-throttled) plus an optional glare highlight. The
 * `className` lands on the actual transformed card so existing card styles
 * (background, border, radius) tilt as one solid object.
 */
const Tilt: React.FC<TiltProps> = ({
  max = 12,
  scale = 1.04,
  glare = true,
  className = '',
  children,
  ...rest
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const handleMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width; // 0..1
      const py = (e.clientY - rect.top) / rect.height; // 0..1
      const rx = (0.5 - py) * max * 2;
      const ry = (px - 0.5) * max * 2;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        el.style.setProperty('--tilt-rx', `${rx.toFixed(2)}deg`);
        el.style.setProperty('--tilt-ry', `${ry.toFixed(2)}deg`);
        el.style.setProperty('--tilt-s', `${scale}`);
        el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
        el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
        el.style.setProperty('--go', '1');
      });
    },
    [max, scale],
  );

  const handleLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.setProperty('--tilt-rx', '0deg');
    el.style.setProperty('--tilt-ry', '0deg');
    el.style.setProperty('--tilt-s', '1');
    el.style.setProperty('--go', '0');
  }, []);

  return (
    <div className="tilt3d-scene" onPointerMove={handleMove} onPointerLeave={handleLeave}>
      <div ref={cardRef} className={`tilt3d-card ${className}`} {...rest}>
        {children}
        {glare && <span className="tilt3d-glare" aria-hidden="true" />}
      </div>
    </div>
  );
};

export default Tilt;
