'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

/** How long to stay quiet about a payload the parent already rejected. */
const REJECT_COOLDOWN_MS = 3000;

/**
 * Longest edge, in pixels, of the frame handed to jsQR.
 *
 * Decoding happens every animation frame, and getImageData on a full 1080p
 * frame copies ~8MB each time — enough to make a phone lag and get hot. A code
 * held in front of the lens fills plenty of a 640px frame, so downscaling costs
 * no real detection range.
 */
const DECODE_MAX_EDGE = 640;

/**
 * Full-screen QR scanner overlay.
 *
 * Opened from a tap so iOS Safari's user-gesture requirement for getUserMedia
 * is satisfied. Decoding runs on the main thread via requestAnimationFrame,
 * which is plenty for a code held still in front of the lens.
 *
 * Props:
 *   onDetected(text) — called once with the decoded payload. The parent decides
 *                      whether the payload is usable; return false to keep the
 *                      camera running (e.g. a QR that is not a location code).
 *   onClose()        — user cancelled.
 */
export default function QrScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  // Guards against a second decode firing between a hit and teardown.
  const doneRef = useRef(false);
  // Payloads the parent rejected, with the time we last reported them. The
  // decode loop runs every frame, so without this a single stray QR held in
  // view would re-fire onDetected (and its toast) ~60 times a second.
  const rejectedRef = useRef(new Map());
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  /**
   * Single teardown path. Every exit — success, cancel, unmount, error — goes
   * through here, so the camera indicator can never be left on.
   */
  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) video.srcObject = null;
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose?.();
  }, [stopCamera, onClose]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        // Also the non-secure-context case: the API is simply absent on
        // plain http, which is why this message mentions it.
        setError(
          'Camera not available in this browser. This needs a secure (https) connection — you can still type the location ID below.'
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            // Asking for 720p rather than whatever the sensor's maximum is
            // keeps each captured frame cheap to copy.
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        // Unmounted while the permission prompt was open.
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        video.srcObject = stream;
        // Required on iOS, or the video takes over the screen natively and
        // the overlay's cancel button becomes unreachable.
        video.setAttribute('playsinline', 'true');
        video.setAttribute('muted', 'true');
        await video.play();

        if (cancelled) return;
        setReady(true);
        rafRef.current = requestAnimationFrame(tick);
      } catch (err) {
        if (cancelled) return;
        setError(describeCameraError(err));
      }
    }

    function tick() {
      if (cancelled || doneRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const sourceWidth = video.videoWidth;
        const sourceHeight = video.videoHeight;

        if (sourceWidth > 0 && sourceHeight > 0) {
          const scale = Math.min(1, DECODE_MAX_EDGE / Math.max(sourceWidth, sourceHeight));
          const width = Math.round(sourceWidth * scale);
          const height = Math.round(sourceHeight * scale);

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(video, 0, 0, width, height);

          const imageData = ctx.getImageData(0, 0, width, height);
          const result = jsQR(imageData.data, width, height, {
            inversionAttempts: 'dontInvert',
          });

          if (result?.data) {
            const payload = result.data;
            const lastReported = rejectedRef.current.get(payload);
            const now = Date.now();

            // Skip a payload the parent already rejected recently, so holding
            // a non-location QR in frame does not spam toasts every frame.
            if (lastReported === undefined || now - lastReported > REJECT_COOLDOWN_MS) {
              // The parent returns false when the payload is not a location
              // code, in which case we keep scanning rather than closing.
              const accepted = onDetected?.(payload);
              if (accepted !== false) {
                doneRef.current = true;
                stopCamera();
                return;
              }
              rejectedRef.current.set(payload, now);
              // Bound the map; a scanner left running should not grow it forever.
              if (rejectedRef.current.size > 32) {
                rejectedRef.current.delete(rejectedRef.current.keys().next().value);
              }
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    start();

    return () => {
      cancelled = true;
      stopCamera();
    };
    // onDetected is intentionally not a dependency: re-running this effect
    // would restart the camera on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopCamera]);

  // Close on Escape, for the desktop/manual-testing case.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') handleClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClose]);

  return (
    <div className="qr-scanner-overlay" role="dialog" aria-modal="true" aria-label="Scan a location QR code">
      <div className="qr-scanner-stage">
        {error ? (
          <div className="qr-scanner-error">
            <div className="empty-icon" aria-hidden="true">📷</div>
            <p>{error}</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="qr-scanner-video" playsInline muted autoPlay />
            <div className="qr-scanner-reticle" aria-hidden="true" />
            <p className="qr-scanner-hint">
              {ready ? 'Point the camera at the QR code on the box or drawer.' : 'Starting camera…'}
            </p>
          </>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="qr-scanner-actions">
        <button className="btn btn-secondary btn-block btn-lg" onClick={handleClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function describeCameraError(err) {
  switch (err?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera permission was denied. Allow camera access in your browser settings, or type the location ID below.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No camera found on this device. You can type the location ID below.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'The camera is already in use by another app. Close it and try again, or type the location ID below.';
    default:
      return `Could not start the camera${err?.message ? ` (${err.message})` : ''}. You can type the location ID below.`;
  }
}
