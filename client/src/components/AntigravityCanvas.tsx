import React, { useEffect, useRef } from 'react';

interface AntigravityCanvasProps {
  particleCount?: number;
  speed?: number;
  gravity?: number; // Âm là bay ngược lên (Antigravity), dương là rơi xuống (Confetti)
  colors?: string[];
  shape?: 'mixed' | 'hearts' | 'circles';
  className?: string;
  interactive?: boolean;
}

export const AntigravityCanvas: React.FC<AntigravityCanvasProps> = ({
  particleCount = 40,
  speed = 0.8,
  gravity = -0.04,
  colors = ['#ff4458', '#fd267a', '#ff6036', '#f59e0b', '#c084fc', '#ffffff'],
  shape = 'mixed',
  className = 'absolute inset-0 pointer-events-none z-0',
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true
    });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouseX = -1000;
    let mouseY = -1000;

    // --- SPRITE CACHE FOR GPU-ACCELERATED PERFORMANCE ---
    const spriteCache: Record<string, HTMLCanvasElement> = {};

    const getSprite = (color: string, shapeType: number) => {
      const key = `${color}_${shapeType}`;
      if (spriteCache[key]) return spriteCache[key];

      const size = 64;
      const center = size / 2;
      const drawSize = 28;

      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const cx = c.getContext('2d');
      if (!cx) return c;

      // Glow / Shadow mềm mô phỏng không trọng lực
      cx.shadowColor = color;
      cx.shadowBlur = 12;
      cx.fillStyle = color;
      cx.translate(center, center);
      cx.beginPath();

      if (shapeType === 0) {
        // Circle (Bọt khí phát sáng)
        cx.arc(0, 0, drawSize / 2, 0, Math.PI * 2);
      } else if (shapeType === 1) {
        // Diamond / Square xoay
        cx.rect(-drawSize / 2, -drawSize / 2, drawSize, drawSize);
      } else if (shapeType === 2) {
        // Heart (Trái tim Tinder chuẩn)
        const s = drawSize * 0.45;
        cx.moveTo(0, s * 0.3);
        cx.bezierCurveTo(-s * 1.5, -s * 0.8, -s * 1.5, s * 0.8, 0, s * 1.8);
        cx.bezierCurveTo(s * 1.5, s * 0.8, s * 1.5, -s * 0.8, 0, s * 0.3);
      }
      cx.fill();

      spriteCache[key] = c;
      return c;
    };

    // --- HIGH-DPI RESIZING ---
    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // --- MOUSE / TOUCH INTERACTION ---
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // --- PARTICLE CLASS (ANTIGRAVITY PHYSICS) ---
    class Particle {
      x = 0;
      y = 0;
      vx = 0;
      vy = 0;
      depth = 1;
      visualSize = 12;
      rotation = 0;
      rotationSpeed = 0;
      color = '#ff4458';
      type = 0;
      sprite: HTMLCanvasElement | null = null;

      constructor() {
        this.init(true);
      }

      init(randomY = false) {
        this.x = Math.random() * width;
        this.y = randomY ? Math.random() * height : height + 40;
        this.depth = Math.random() * 0.9 + 0.4; // Độ sâu 3D (0.4 đến 1.3)
        this.visualSize = (Math.random() * 12 + 6) * this.depth;

        // Vận tốc ngẫu nhiên trôi nổi không trọng lượng
        this.vx = (Math.random() - 0.5) * 1.5 * speed;
        this.vy = (Math.random() - 0.5) * 1.5 * speed;

        if (gravity < 0) {
          this.vy -= (Math.random() * 0.8 + 0.3) * Math.abs(gravity) * 20;
        } else {
          this.y = randomY ? Math.random() * height : -40;
          this.vy += (Math.random() * 0.8 + 0.3) * gravity * 20;
        }

        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.03;

        if (shape === 'hearts') {
          this.type = 2;
        } else if (shape === 'circles') {
          this.type = 0;
        } else {
          // Mixed (trái tim chiếm 50%, bọt khí 30%, hình thoi 20%)
          const r = Math.random();
          this.type = r < 0.5 ? 2 : r < 0.8 ? 0 : 1;
        }

        this.sprite = getSprite(this.color, this.type);
      }

      update() {
        // Tác động lực đẩy phản trọng lực (Antigravity Force)
        this.vy += gravity * 0.08 * this.depth;
        this.x += this.vx * this.depth;
        this.y += this.vy * this.depth;
        this.rotation += this.rotationSpeed;

        // Tương tác chuột: Khi chuột lại gần, các hạt dạt ra mềm mại
        if (interactive && mouseX > 0 && mouseY > 0) {
          const dx = this.x - mouseX;
          const dy = this.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const radius = 140;

          if (dist < radius && dist > 0) {
            const force = (radius - dist) / radius;
            const angle = Math.atan2(dy, dx);
            const push = force * 3.5;
            this.vx += Math.cos(angle) * push;
            this.vy += Math.sin(angle) * push;
          }
        }

        // Ma sát không khí (Air resistance / friction)
        this.vx *= 0.985;
        this.vy *= 0.985;

        // Kiểm tra viền màn hình (Screen boundary reset)
        if (this.x < -60) this.x = width + 60;
        if (this.x > width + 60) this.x = -60;

        if (gravity < 0) {
          if (this.y < -60) this.init(false);
        } else {
          if (this.y > height + 60) this.init(false);
        }
      }

      draw() {
        if (!ctx || !this.sprite) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = 0.75 * this.depth;

        // Vẽ sprite đã nướng bóng (Baked shadow GPU texture)
        const s = this.visualSize * 2.2;
        ctx.drawImage(this.sprite, -s / 2, -s / 2, s, s);
        ctx.restore();
      }
    }

    const particles: Particle[] = Array.from(
      { length: particleCount },
      () => new Particle()
    );

    // --- ANIMATION LOOP (60/120 FPS) ---
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [particleCount, speed, gravity, colors, shape, interactive]);

  return <canvas ref={canvasRef} className={className} />;
};
