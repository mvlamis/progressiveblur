import type { CSSProperties, HTMLAttributes } from 'react';

export type ImageEdgeMode = 'clip' | 'fade' | 'spill' | 'fade-spill';

export interface ProgressiveBlurImageProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  src: string;
  alt: string;
  blur?: number;
  /** Percentage of the image occupied by each edge (0–50). */
  edgeWidth?: number;
  edgeMode?: ImageEdgeMode;
  layers?: number;
  imageStyle?: CSSProperties;
}

export interface ProgressiveBlurProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Positions along the gradient, in percent (0–100). */
  start?: number;
  end?: number;
  /** Blur radii at the corresponding positions, in pixels. */
  startBlur?: number;
  endBlur?: number;
  direction?: 'top' | 'right' | 'bottom' | 'left';
  /** More layers improve smoothness but increase rendering cost (1–32). */
  layers?: number;
}

const layerStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  borderRadius: 'inherit',
};

export function ProgressiveBlur({
  start = 0,
  end = 100,
  startBlur = 0,
  endBlur = 24,
  direction = 'bottom',
  layers = 12,
  style,
  ...props
}: ProgressiveBlurProps) {
  if (
    !Number.isFinite(start) || !Number.isFinite(end) ||
    start < 0 || end > 100 || start > end
  ) {
    throw new RangeError('Expected 0 <= start <= end <= 100.');
  }
  if (
    !Number.isFinite(startBlur) || !Number.isFinite(endBlur) ||
    startBlur < 0 || endBlur < 0
  ) {
    throw new RangeError('Blur values must be finite, non-negative pixel radii.');
  }
  if (!Number.isInteger(layers) || layers < 1 || layers > 32) {
    throw new RangeError('layers must be an integer between 1 and 32.');
  }

  const minimum = Math.min(startBlur, endBlur);
  const maximum = Math.max(startBlur, endBlur);
  const increasing = endBlur > startBlur;

  return (
    <div
      {...props}
      aria-hidden="true"
      style={{ ...layerStyle, ...style, pointerEvents: 'none' }}
    >
      {minimum > 0 && (
        <div style={{
          ...layerStyle,
          backdropFilter: `blur(${minimum}px)`,
          WebkitBackdropFilter: `blur(${minimum}px)`,
        }} />
      )}
      {maximum > minimum && Array.from({ length: layers }, (_, index) => {
        const previous = minimum + (maximum - minimum) * index / layers;
        const next = minimum + (maximum - minimum) * (index + 1) / layers;
        // Sequential Gaussian blurs add variances, not radii.
        const radius = Math.sqrt((next - previous) * (next + previous));
        const from = increasing
          ? start + (end - start) * index / layers
          : end - (end - start) * (index + 1) / layers;
        const to = increasing
          ? start + (end - start) * (index + 1) / layers
          : end - (end - start) * index / layers;
        const mask = `linear-gradient(to ${direction}, ${increasing ? 'transparent' : 'black'} ${from}%, ${increasing ? 'black' : 'transparent'} ${to}%)`;

        return (
          <div key={index} style={{
            ...layerStyle,
            backdropFilter: `blur(${radius}px)`,
            WebkitBackdropFilter: `blur(${radius}px)`,
            maskImage: mask,
            WebkitMaskImage: mask,
          }} />
        );
      })}
    </div>
  );
}

/** Owns the image so transparency and overflow affect the source, not just the backdrop overlay. */
export function ProgressiveBlurImage({
  src,
  alt,
  blur = 24,
  edgeWidth = 32,
  edgeMode = 'clip',
  layers = 12,
  imageStyle,
  style,
  ...props
}: ProgressiveBlurImageProps) {
  if (!Number.isFinite(blur) || blur < 0) {
    throw new RangeError('blur must be a finite, non-negative pixel radius.');
  }
  if (!Number.isFinite(edgeWidth) || edgeWidth < 0 || edgeWidth > 50) {
    throw new RangeError('edgeWidth must be between 0 and 50.');
  }
  if (!Number.isInteger(layers) || layers < 1 || layers > 32) {
    throw new RangeError('layers must be an integer between 1 and 32.');
  }
  if (!['clip', 'fade', 'spill', 'fade-spill'].includes(edgeMode)) {
    throw new RangeError('Unknown image edge mode.');
  }

  const fade = edgeWidth > 0 && (edgeMode === 'fade' || edgeMode === 'fade-spill');
  const spill = edgeWidth > 0 && blur > 0 && (edgeMode === 'spill' || edgeMode === 'fade-spill');
  const fadeMask = `linear-gradient(to right, transparent, black ${edgeWidth}%, black ${100 - edgeWidth}%, transparent)`;
  const edgeMask = `linear-gradient(to right, black, transparent ${edgeWidth}%, transparent ${100 - edgeWidth}%, black)`;
  const imgStyle: CSSProperties = {
    width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...imageStyle,
  };

  return (
    <div {...props} style={{ position: 'relative', aspectRatio: '16 / 9', ...style }}>
      {spill && (
        <div aria-hidden="true" data-blur-spill="" style={{
          ...layerStyle,
          filter: `blur(${blur}px)`,
        }}>
          <div style={{ ...layerStyle, maskImage: edgeMask, WebkitMaskImage: edgeMask }}>
            <img src={src} alt="" style={imgStyle} />
          </div>
        </div>
      )}
      <div data-blur-surface="" style={{
        ...layerStyle,
        overflow: 'hidden',
        ...(fade ? { maskImage: fadeMask, WebkitMaskImage: fadeMask } : {}),
      }}>
        <img src={src} alt={alt} style={imgStyle} />
        {edgeWidth > 0 && blur > 0 && (
          <>
            <ProgressiveBlur direction="left" endBlur={blur} layers={layers}
              style={{ width: `${edgeWidth}%`, right: 'auto' }} />
            <ProgressiveBlur direction="right" endBlur={blur} layers={layers}
              style={{ width: `${edgeWidth}%`, left: 'auto' }} />
          </>
        )}
      </div>
    </div>
  );
}
