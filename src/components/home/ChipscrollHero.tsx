"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useSiteT } from "@/components/site-locale-context";

// ── Config ─────────────────────────────────────────────────────────
const TOTAL_FRAMES  = 140;
const FPS           = 18;          // 140/18 ≈ 7.8 s
const FRAME_PATH    = "/chipscroll/frame_";
const FRAME_EXT     = ".webp";
const BG_COLOR      = "#06000a";

// Outro: last N frames get dark vignette + zoom-out on canvas
const OUTRO_START   = 116;         // frame where outro begins (~6.4 s)
const OUTRO_FRAMES  = TOTAL_FRAMES - OUTRO_START; // 24 frames

// ── Text Overlays ──────────────────────────────────────────────────
// At 18fps: frame 18 = 1s, frame 54 = 3s, frame 98 = ~5.4s
interface TextOverlay {
  text: string;
  position: "center" | "bottom-left" | "bottom-right";
  size: "default" | "large";
  gradient: string;
  startFrame: number;
  endFrame: number;
}

function getTextOverlays(hero: { word1: string; word2: string }): TextOverlay[] {
  return [
    {
      text: hero.word1,
      position: "bottom-left",
      size: "large",
      gradient: "linear-gradient(90deg, #e8c4b8, #f5e6d8, #dbb5a0, #b76e79, #e8c4b8)",
      startFrame: 26,
      endFrame: 62,
    },
    {
      text: hero.word2,
      position: "bottom-right",
      size: "large",
      gradient: "linear-gradient(90deg, #b76e79, #d4a5c9, #f5c6d6, #b76e79, #8c4f5c)",
      startFrame: 92,
      endFrame: 114,
    },
  ];
}

const FADE_RANGE  = 8;
const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif';

const sizeFontStyles = {
  default: "clamp(1.5rem, 5.5cqw, 7rem)",
  large:   "clamp(1.8rem, 6.5cqw, 8.5rem)",
} as const;

const positionClasses = {
  center:         "items-center justify-center",
  "bottom-left":  "items-start justify-end pb-[18%] pl-[5%] md:pb-[12%] md:pl-[4%]",
  "bottom-right": "items-end justify-end pb-[18%] pr-[5%] md:pb-[12%] md:pr-[4%]",
} as const;

const textAlignClasses = {
  center:         "text-center",
  "bottom-left":  "text-left",
  "bottom-right": "text-right",
} as const;

// ── Text Overlay ───────────────────────────────────────────────────
function TextOverlayItem({
  overlay,
  currentFrame,
}: {
  overlay: TextOverlay;
  currentFrame: number;
}) {
  const isVisible =
    currentFrame >= overlay.startFrame && currentFrame <= overlay.endFrame;

  let opacity = 0;
  if (isVisible) {
    if (currentFrame < overlay.startFrame + FADE_RANGE) {
      opacity = (currentFrame - overlay.startFrame) / FADE_RANGE;
    } else if (currentFrame > overlay.endFrame - FADE_RANGE) {
      opacity = (overlay.endFrame - currentFrame) / FADE_RANGE;
    } else {
      opacity = 1;
    }
  }

  if (opacity <= 0) return null;

  const frameProgress =
    (currentFrame - overlay.startFrame) / (overlay.endFrame - overlay.startFrame);
  const gradientPos = frameProgress * 200;

  return (
    <div
      className={`absolute inset-0 flex flex-col px-[4%] pointer-events-none z-10 ${positionClasses[overlay.position]}`}
      style={{ opacity, transition: "opacity 0.15s ease-out" }}
    >
      <div className={`max-w-[90%] ${textAlignClasses[overlay.position]}`}>
        <h2
          className="font-semibold leading-[1.2] pb-[0.1em] text-transparent"
          style={{
            fontSize: sizeFontStyles[overlay.size],
            fontFamily: FONT_FAMILY,
            letterSpacing: "-0.03em",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundImage: overlay.gradient,
            backgroundSize: "300% 100%",
            backgroundPosition: `${gradientPos}% 0`,
            filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.6))",
          }}
        >
          {overlay.text}
        </h2>
      </div>
    </div>
  );
}

// ── Caiena outro overlay ───────────────────────────────────────────
// Appears during the zoom-out/dark outro. Separate from TextOverlayItem
// so we can give it a bigger, more prominent treatment.
function CaienaOverlay({ currentFrame }: { currentFrame: number }) {
  if (currentFrame < OUTRO_START) return null;

  const progress = (currentFrame - OUTRO_START) / OUTRO_FRAMES; // 0→1

  // Fade in during first half, stay full for second half
  const fadeIn  = Math.min(progress * 2.5, 1);
  const opacity = fadeIn;

  const gradientPos = progress * 200;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20"
      style={{ opacity, transition: "opacity 0.2s ease-out" }}
    >
      <span
        className="font-semibold text-transparent leading-none"
        style={{
          fontSize: "clamp(2.5rem, 9cqw, 11rem)",
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontWeight: 300,
          letterSpacing: "-0.02em",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundImage:
            "linear-gradient(90deg, #e8c4b8, #f5e6d8, #b76e79, #dbb5a0, #f5e6d8, #e8c4b8)",
          backgroundSize: "300% 100%",
          backgroundPosition: `${gradientPos}% 0`,
          filter: "drop-shadow(0 8px 40px rgba(183,110,121,0.7))",
          textShadow: "0 0 80px rgba(183,110,121,0.4)",
        }}
      >
        Caiena
      </span>
      <p
        className="mt-3 text-white/50 tracking-[0.5em] uppercase"
        style={{
          fontSize: "clamp(0.55rem, 1.1cqw, 0.85rem)",
          opacity: Math.max(0, progress * 3 - 0.5),
        }}
      >
        Nail Art Studio · Leander, TX
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function ChipscrollHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const imagesRef    = useRef<HTMLImageElement[]>([]);
  const frameRef     = useRef(0);
  const hero = useSiteT().hero;

  const [isLoading,    setIsLoading]    = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);

  // Initialize locale-aware text overlays on client
  useEffect(() => {
    setTextOverlays(getTextOverlays(hero));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero.word1, hero.word2]);

  // Pre-load all frames
  useEffect(() => {
    let loaded = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `${FRAME_PATH}${String(i).padStart(4, "0")}${FRAME_EXT}`;

      const onDone = () => {
        loaded++;
        setLoadProgress(loaded / TOTAL_FRAMES);
        if (loaded === TOTAL_FRAMES) {
          imagesRef.current = images;
          setIsLoading(false);
        }
      };

      img.onload  = onDone;
      img.onerror = onDone;
      images[i] = img;
    }
  }, []);

  // Cover-fit draw with outro zoom-out
  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext("2d");
    const img    = imagesRef.current[index];

    if (!canvas || !ctx || !img?.complete || img.naturalWidth === 0) return;

    const container = containerRef.current;
    const dpr    = window.devicePixelRatio || 1;
    const width  = container?.clientWidth  || 1280;
    const height = container?.clientHeight || 536;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width        = width * dpr;
      canvas.height       = height * dpr;
      canvas.style.width  = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);

    // Cover-fit
    const imgAspect    = img.naturalWidth / img.naturalHeight;
    const canvasAspect = width / height;
    let srcX = 0, srcY = 0, srcW = img.naturalWidth, srcH = img.naturalHeight;

    if (imgAspect > canvasAspect) {
      srcW = img.naturalHeight * canvasAspect;
      srcX = (img.naturalWidth - srcW) / 2;
    } else {
      srcH = img.naturalWidth / canvasAspect;
      srcY = (img.naturalHeight - srcH) / 2;
    }

    // Zoom-out during outro: start zoomed-in (crop source tighter) → open to normal
    // This way the image ALWAYS fills the canvas — no black edges ever visible.
    const outroProgress = index >= OUTRO_START
      ? (index - OUTRO_START) / OUTRO_FRAMES
      : 0;
    // zoomFactor goes 1.08 → 1.0: image starts 8% larger (more cropped) then reveals full
    const zoomFactor  = outroProgress > 0 ? 1.08 - outroProgress * 0.08 : 1.0;
    const zSrcW = srcW / zoomFactor;
    const zSrcH = srcH / zoomFactor;
    const zSrcX = srcX + (srcW - zSrcW) / 2;
    const zSrcY = srcY + (srcH - zSrcH) / 2;

    ctx.drawImage(img, zSrcX, zSrcY, zSrcW, zSrcH, 0, 0, width, height);

    // Base vignette
    const vig = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.35,
      width / 2, height / 2, Math.max(width, height) * 0.7
    );
    vig.addColorStop(0,   "rgba(0,0,0,0)");
    vig.addColorStop(0.7, "rgba(0,0,0,0)");
    vig.addColorStop(1,   "rgba(0,0,0,0.4)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);

    // Outro dark overlay (draws on canvas for the zoom effect to sit behind React text)
    if (outroProgress > 0) {
      ctx.fillStyle = `rgba(6,0,10,${outroProgress * 0.72})`;
      ctx.fillRect(0, 0, width, height);
    }
  }, []);

  // Animation loop
  useEffect(() => {
    if (isLoading || imagesRef.current.length === 0) return;

    let raf: number;
    const frameDuration = 1000 / FPS;
    let lastFrameTime   = Date.now();

    frameRef.current = 0;
    drawFrame(0);

    const animate = () => {
      const now     = Date.now();
      const elapsed = now - lastFrameTime;

      if (elapsed >= frameDuration) {
        lastFrameTime = now - (elapsed % frameDuration);
        const next = (frameRef.current + 1) % TOTAL_FRAMES;
        frameRef.current = next;
        setCurrentFrame(next);
        drawFrame(next);
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isLoading, drawFrame]);

  // Resize handler
  useEffect(() => {
    const onResize = () => drawFrame(frameRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [drawFrame]);

  return (
    <section className="relative isolate">
      <div
        ref={containerRef}
        className="relative w-full"
        style={{
          containerType: "inline-size",
          aspectRatio: "1280 / 536",
          backgroundColor: BG_COLOR,
        }}
      >
        {/* Loading */}
        {isLoading && (
          <div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3"
            style={{ backgroundColor: BG_COLOR }}
          >
            <div className="relative w-[28%] max-w-56 h-[2px] bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
                style={{
                  width: `${loadProgress * 100}%`,
                  background: "linear-gradient(to right, #b76e79, #dbb5a0)",
                }}
              />
            </div>
            <p className="text-white/30 text-xs tracking-[0.3em] uppercase">
              {Math.round(loadProgress * 100)}%
            </p>
          </div>
        )}

        {/* Canvas + overlays */}
        {!isLoading && (
          <div className="absolute inset-0">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {textOverlays.map((overlay, i) => (
              <TextOverlayItem
                key={i}
                overlay={overlay}
                currentFrame={currentFrame}
              />
            ))}

            <CaienaOverlay currentFrame={currentFrame} />
          </div>
        )}
      </div>
    </section>
  );
}
