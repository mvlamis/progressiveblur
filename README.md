# Progressive blur

A React backdrop overlay that gradually blurs content behind it.
```tsx
import { ProgressiveBlur } from './ProgressiveBlur';

export function Example() {
  return (
    <div style={{ position: 'relative', height: 400 }}>
      <img
        src="/photo.jpg"
        alt="Landscape"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <ProgressiveBlur
        start={20}
        end={90}
        startBlur={0}
        endBlur={24}
        direction="bottom"
      />
    </div>
  );
}
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `start`, `end` | `0`, `100` | Positions in percent along the chosen direction; `0 <= start <= end <= 100` |
| `startBlur`, `endBlur` | `0`, `24` | Non-negative blur radii in pixels. Decreasing blur is supported |
| `direction` | `"bottom"` | `"top"`, `"right"`, `"bottom"`, or `"left"`. Positions are measured from the opposite edge toward this edge |
| `layers` | `12` | Integer from 1 to 32; higher values improve smoothness (at greater GPU cost) |
| `style`, `className` | — | Standard div styling and attributes are forwarded |

The overlay is absolutely positioned to fill its nearest positioned ancestor. It ignores pointer events and is hidden from assistive technology. Put it after the content to blur; put any foreground text after the overlay or give that text a higher stacking order.


Requires CSS `backdrop-filter` and CSS masks (including WebKit-prefixed properties). Unsupported browsers leave the backdrop unblurred. Avoid `filter`, `opacity < 1`, masks, or `will-change` on ancestors between the overlay and its backdrop: these can create backdrop roots and limit what gets blurred. Keep the overlay transparent to see the effect.

## Transparent fades and outward spill

The backdrop-only overlay cannot make an underlying image transparent or paint that image outside its bounds. Use the companion `ProgressiveBlurImage`, exported from the same module, to manage the source image and both edge overlays together:

```tsx
import { ProgressiveBlurImage } from './ProgressiveBlur';

<ProgressiveBlurImage
  src="/photo.jpg"
  alt="Alpine lake"
  blur={24}
  edgeWidth={32}
  edgeMode="fade-spill"
  style={{ height: 400, borderRadius: 14 }}
/>
```

| Prop | Default | Meaning |
| --- | --- | --- |
| `src`, `alt` | Required | Image source and alt text|
| `blur` | `24` | Non-negative blur radius in pixels at both outer edges |
| `edgeWidth` | `32` | Percentage of image width affected on each side, from 0 to 50 |
| `edgeMode` | `"clip"` | `"clip"` preserves the original bounded image; `"fade"` fades the image edges to transparency; `"spill"` adds an outward blurred halo; `"fade-spill"` combines both |
| `layers` | `12` | Progressive backdrop layer count on each side (1–32) |
| `imageStyle` | — | Styles shared by the source image and its decorative spill copy; defaults to `objectFit: 'cover'` |
| `style`, `className` | — | Wrapper styles/attributes; defaults to a 16:9 aspect ratio |

