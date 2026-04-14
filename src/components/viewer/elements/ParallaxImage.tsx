"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-init";

gsap.registerPlugin(ScrollTrigger);

interface ParallaxImageProps {
  src?: string;
  alt?: string;
  speed?: number; // 0 = no movement, 0.3 = subtle depth
  className?: string;
  gradient?: string;
}

export default function ParallaxImage({
  src,
  alt = "",
  speed = 0.3,
  className = "",
  gradient = "from-black/60 via-black/20 to-black/60",
}: ParallaxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useGSAP(() => {
    if (!imgRef.current) return;

    gsap.to(imgRef.current, {
      yPercent: -(speed * 100),
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="w-full object-cover"
          style={{ height: "130%", marginTop: "-15%" }}
        />
      ) : (
        <div
          ref={imgRef}
          className="w-full bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950"
          style={{ height: "130%", marginTop: "-15%" }}
        />
      )}
      {/* Overlay gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${gradient}`} />
    </div>
  );
}
