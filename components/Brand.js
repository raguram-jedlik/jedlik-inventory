'use client';

import Image from 'next/image';

/**
 * Jedlik brand mark. Two variants:
 *  - `light`  (default) — white logo on dark surfaces (the app's main look)
 *  - `dark`   — for print labels / light surfaces
 *
 * Sizes:
 *  - sm  → 24px tall (in-page header eyebrow, navbar)
 *  - md  → 36px tall (page headers)
 *  - lg  → 56px tall (auth screen, splash)
 *  - xl  → 96px tall (print labels, hero)
 */
export default function Brand({ size = 'md', variant = 'light', showTagline = false, className = '' }) {
  const heights = { sm: 24, md: 36, lg: 56, xl: 96 };
  const h = heights[size] ?? 36;

  // The Jedlik logo JPEG is white-on-black — ideal for dark UI.
  // For light surfaces (print labels) we invert via CSS filter.
  const filterStyle = variant === 'dark' ? 'invert(1)' : 'none';

  return (
    <div className={`brand brand--${size} ${className}`}>
      <Image
        src="/jedlik-logo.jpeg"
        alt="Jedlik Motors"
        width={h * 1.5}
        height={h}
        priority
        className="brand-mark"
        style={{
          height: `${h}px`,
          width: 'auto',
          filter: filterStyle,
        }}
      />
      {showTagline && (
        <span className="brand-tagline">Redefine the class.</span>
      )}
    </div>
  );
}
