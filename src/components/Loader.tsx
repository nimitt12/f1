import React from 'react';

interface LoaderProps {
  /** Caption shown beneath the spinner. Pass '' or null to hide it. */
  label?: string | null;
  /** Spinner diameter in px. */
  size?: number;
  /** 'block' = padded + centered (default); 'inline' = compact row, no padding. */
  variant?: 'block' | 'inline';
  /** Override the accent color (defaults to the active team theme color). */
  accent?: string;
  className?: string;
}

/**
 * Pitwall's universal loading indicator: a comet-trail ring that picks up the
 * active team theme color, with a pulsing mono caption. Use this anywhere a view
 * is waiting on data instead of ad-hoc "Loading..." text.
 */
const Loader: React.FC<LoaderProps> = ({
  label = 'Loading',
  size = 44,
  variant = 'block',
  accent,
  className = '',
}) => {
  const style = { '--pw-loader-size': `${size}px` } as React.CSSProperties;
  if (accent) (style as Record<string, string>)['--pw-accent'] = accent;

  return (
    <div
      className={`pw-loader ${variant} ${className}`.trim()}
      style={style}
      role="status"
      aria-label={label || 'Loading'}
    >
      <div className="pw-loader-ring" aria-hidden="true">
        <div className="pw-loader-trail" />
      </div>
      {label ? <span className="pw-loader-label">{label}</span> : null}
    </div>
  );
};

export default Loader;
