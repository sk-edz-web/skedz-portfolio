import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isHovered = false;
    let isVisible = false;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        if (dotRef.current) dotRef.current.style.opacity = "1";
        if (ringRef.current) ringRef.current.style.opacity = "1";
      }

      // Check hover targets fast
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.closest("button") ||
          target.closest("a") ||
          target.getAttribute("role") === "button" ||
          target.classList.contains("interactive-hover"))
      ) {
        isHovered = true;
      } else {
        isHovered = false;
      }
    };

    const onMouseLeave = () => {
      isVisible = false;
      if (dotRef.current) dotRef.current.style.opacity = "0";
      if (ringRef.current) ringRef.current.style.opacity = "0";
    };

    const onMouseEnter = () => {
      isVisible = true;
      if (dotRef.current) dotRef.current.style.opacity = "1";
      if (ringRef.current) ringRef.current.style.opacity = "1";
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    // High performance continuous render loop with pure transform3d and lerp
    const tick = () => {
      // Smooth lerp for ring follower without triggering React re-renders
      ringX += (mouseX - ringX) * 0.22;
      ringY += (mouseY - ringY) * 0.22;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%) scale(${
          isHovered ? 1.6 : 1
        })`;
      }

      if (ringRef.current) {
        const scale = isHovered ? 1.35 : 1;
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scale})`;
        if (isHovered) {
          ringRef.current.style.borderColor = "rgba(34, 211, 238, 0.9)";
          ringRef.current.style.backgroundColor = "rgba(168, 85, 247, 0.18)";
          ringRef.current.style.boxShadow = "0 0 24px rgba(168, 85, 247, 0.5)";
        } else {
          ringRef.current.style.borderColor = "rgba(192, 132, 252, 0.6)";
          ringRef.current.style.backgroundColor = "rgba(147, 51, 234, 0.05)";
          ringRef.current.style.boxShadow = "0 0 12px rgba(168, 85, 247, 0.25)";
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* Precision center dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-50 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] will-change-transform opacity-0 transition-opacity duration-150"
      />

      {/* Cosmic orbital ring follower */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-50 w-9 h-9 rounded-full border border-purple-400/60 will-change-transform opacity-0 transition-opacity duration-150"
      >
        <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-spin" style={{ animationDuration: "6s" }} />
      </div>
    </>
  );
}
