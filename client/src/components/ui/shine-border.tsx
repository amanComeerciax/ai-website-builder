import { cn } from "@/lib/utils";
import { useId, type CSSProperties, type ReactNode } from "react";

type TColorProp = string | string[];

interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: TColorProp;
  className?: string;
  children: ReactNode;
}

/**
 * ShineBorder — animated rotating radial-gradient border.
 *
 * Strategy:
 *  1. A static base border (dim rgba) is always visible.
 *  2. An animated layer sweeps a bright radial-gradient across the top,
 *     masked to only the border ring via mask-composite: exclude.
 */
function ShineBorder({
  borderRadius = 8,
  borderWidth = 1,
  duration = 14,
  color = "#ffffff",
  className,
  children,
}: ShineBorderProps) {
  const id = useId().replace(/:/g, "");
  const animCls = `shine-anim-${id}`;
  const colorStops = Array.isArray(color) ? color.join(",") : color;

  const css = `
    /* Animated shine layer — only border ring is visible via mask */
    .${animCls} {
      pointer-events: none;
      position: absolute;
      inset: 0;
      z-index: 10;                  /* always above GlowCard background */
      border-radius: ${borderRadius}px;
      padding: ${borderWidth}px;
      background-image: radial-gradient(
        ellipse at 0% 0%,
        ${colorStops},
        transparent 60%
      );
      background-size: 200% 200%;
      background-position: 0% 0%;
      animation: shine-kf-${id} ${duration}s infinite linear;
      /* mask: clip to border ring only */
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      mask-composite: exclude;
    }

    @keyframes shine-kf-${id} {
      0%   { background-position: 0%   0%;   }
      25%  { background-position: 100% 0%;   }
      50%  { background-position: 100% 100%; }
      75%  { background-position: 0%   100%; }
      100% { background-position: 0%   0%;   }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div
        className={cn("relative", className)}
        style={
          {
            borderRadius: `${borderRadius}px`,
            outline: `${borderWidth}px solid rgba(255,255,255,0.07)`,
            outlineOffset: `-${borderWidth}px`,
          } as CSSProperties
        }
      >
        {children}
        {/* Shine ring rendered LAST → always paints on top in DOM order */}
        <div className={animCls} aria-hidden="true" />
      </div>
    </>
  );
}

export { ShineBorder };
