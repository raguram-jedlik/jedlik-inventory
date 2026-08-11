'use client';

import Image from 'next/image';

/**
 * Jedlik brand mark.
 *
 * Uses /jedlik-logo.png — a transparent PNG with the boxy "Jedlik ⟩"
 * wordmark and "Redefine the class." tagline built in.
 *
 * Sizes:
 *  - sm  → 32px tall (in-page header eyebrow, navbar)
 *  - md  → 48px tall (page headers — the most-used size)
 *  - lg  → 72px tall (auth screen, splash)
 *  - xl  → 120px tall (print labels, hero)
 *
 * Aspect ratio of the source PNG is 551:453 (~1.216), so width is
 * always computed automatically from height.
 *
 * The `priority` flag tells Next.js to skip lazy loading — this is
 * a small logo image that should appear immediately.
 */
export default function Brand({ size = 'md', showTagline = false, className = '' }) {
  const heights = { sm: 32, md: 48, lg: 72, xl: 120 };
  const h = heights[size] ?? 48;

  return (
    <div className={`brand brand--${size} ${className}`}>
      <Image
        src="/jedlik-logo.png"
        alt="Jedlik Motors"
        width={551}
        height={453}
        priority
        className="brand-mark"
        style={{
          height: `${h}px`,
          width: 'auto',
        }}
      />
      {/* `showTagline` is retained for API compatibility but the tagline
          is rendered inside the image itself, so we don't add it here. */}
      {showTagline && <span className="brand-tagline" aria-hidden="true" />}
    </div>
  );
}