import React, { useEffect, useRef, useState } from 'react';

/**
 * Scroll-driven parallax + reveal wrapper.
 *
 * Each wrapped block drifts vertically at its own rate as it travels through
 * the viewport (layered depth, à la Rockstar's "Only in Leonida"), and fades /
 * rises into place the first time it enters view. All instances share a single
 * rAF-throttled scroll loop so adding more blocks stays cheap.
 */

type Item = { el: HTMLElement; speed: number };

const items = new Set<Item>();
let running = false;
let raf = 0;

const update = () => {
  const vh = window.innerHeight || 1;
  items.forEach(({ el, speed }) => {
    const rect = el.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const delta = center - vh / 2; // distance of element centre from viewport centre
    const offset = -(delta * speed); // drift opposite to travel = sense of depth
    el.style.setProperty('--py', `${offset.toFixed(1)}px`);
  });
  running = false;
};

const schedule = () => {
  if (running) return;
  running = true;
  raf = requestAnimationFrame(update);
};

const register = (item: Item) => {
  items.add(item);
  if (items.size === 1) {
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
  }
  schedule();
  return () => {
    items.delete(item);
    if (items.size === 0) {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(raf);
    }
  };
};

const prefersReduced =
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface ParallaxProps {
  children: React.ReactNode;
  /** Continuous drift intensity. 0 disables drift (reveal only). */
  speed?: number;
  /** Stagger the reveal by this many ms. */
  delay?: number;
  className?: string;
}

const Parallax: React.FC<ParallaxProps> = ({ children, speed = 0.04, delay = 0, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(prefersReduced);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced) {
      setRevealed(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setRevealed(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);

    const cleanup = speed ? register({ el, speed }) : undefined;

    return () => {
      io.disconnect();
      cleanup?.();
    };
  }, [speed]);

  return (
    <div
      ref={ref}
      className={`prlx ${revealed ? 'prlx-in' : ''} ${className}`}
      style={{ ['--prlx-delay' as string]: `${delay}ms` }}
    >
      <div className="prlx-inner">{children}</div>
    </div>
  );
};

export default Parallax;
