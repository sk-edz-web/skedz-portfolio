import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  speed: number;
  hue: number;
}

export default function GalaxyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Initialize 3D Stars
    const starCount = window.innerWidth < 768 ? 250 : 550;
    const stars: Star[] = [];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * width,
        size: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.8 + 0.2,
        baseAlpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.8 + 0.2,
        hue: Math.random() > 0.7 ? 260 : Math.random() > 0.4 ? 190 : 0, // purple, cyan, or white
      });
    }

    // Shooting stars
    const shootingStars: { x: number; y: number; length: number; speed: number; angle: number; alpha: number }[] = [];

    const spawnShootingStar = () => {
      if (Math.random() < 0.02 && shootingStars.length < 3) {
        shootingStars.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.5),
          length: Math.random() * 80 + 40,
          speed: Math.random() * 10 + 12,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
          alpha: 1,
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = width / 2;
      const centerY = height / 2;
      mouseRef.current.targetX = (e.clientX - centerX) * 0.08;
      mouseRef.current.targetY = (e.clientY - centerY) * 0.08;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    let tick = 0;

    const render = () => {
      tick++;
      // Smooth lerp mouse tilt
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Dark cosmic canvas clear with slight trail
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, width, height);

      // Draw subtle nebula cosmic radial glows
      const nebula1 = ctx.createRadialGradient(
        width * 0.3 + mouseRef.current.x * 0.5,
        height * 0.2 + mouseRef.current.y * 0.5,
        20,
        width * 0.3,
        height * 0.2,
        width * 0.5
      );
      nebula1.addColorStop(0, "rgba(88, 28, 135, 0.16)"); // Deep purple
      nebula1.addColorStop(0.5, "rgba(59, 130, 246, 0.06)"); // Blue
      nebula1.addColorStop(1, "rgba(3, 7, 18, 0)");

      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, width, height);

      const nebula2 = ctx.createRadialGradient(
        width * 0.75 - mouseRef.current.x * 0.4,
        height * 0.75 - mouseRef.current.y * 0.4,
        10,
        width * 0.75,
        height * 0.75,
        width * 0.4
      );
      nebula2.addColorStop(0, "rgba(14, 116, 144, 0.12)"); // Cyan
      nebula2.addColorStop(1, "rgba(3, 7, 18, 0)");
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, width, height);

      // Render 3D Stars
      const cx = width / 2 + mouseRef.current.x;
      const cy = height / 2 + mouseRef.current.y;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Move star forward along z axis
        star.z -= star.speed;
        if (star.z <= 0) {
          star.z = width;
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
        }

        // Perspective 3D projection
        const k = 280 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const depthAlpha = Math.min(1, Math.max(0.1, (1 - star.z / width) * 1.2));
          // subtle twinkle
          const twinkle = Math.sin(tick * 0.05 + i) * 0.2;
          const finalAlpha = Math.min(1, Math.max(0.1, star.baseAlpha * depthAlpha + twinkle));
          const size = Math.max(0.8, star.size * k * 0.8);

          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          if (star.hue === 260) {
            ctx.fillStyle = `rgba(192, 132, 252, ${finalAlpha})`; // Purple
          } else if (star.hue === 190) {
            ctx.fillStyle = `rgba(103, 232, 249, ${finalAlpha})`; // Cyan
          } else {
            ctx.fillStyle = `rgba(241, 245, 249, ${finalAlpha})`; // Starlight
          }
          ctx.fill();
        }
      }

      // Handle shooting stars
      spawnShootingStar();
      for (let j = shootingStars.length - 1; j >= 0; j--) {
        const s = shootingStars[j];
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.alpha -= 0.015;

        if (s.alpha <= 0 || s.x > width || s.y > height) {
          shootingStars.splice(j, 1);
          continue;
        }

        ctx.beginPath();
        const tailX = s.x - Math.cos(s.angle) * s.length;
        const tailY = s.y - Math.sin(s.angle) * s.length;
        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, "rgba(168, 85, 247, 0)");
        grad.addColorStop(0.8, `rgba(192, 132, 252, ${s.alpha * 0.8})`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${s.alpha})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="galaxy-starfield-canvas"
      className="fixed inset-0 pointer-events-none z-0 block w-full h-full"
    />
  );
}
