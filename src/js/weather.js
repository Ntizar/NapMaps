/**
 * Clima — Partículas de nieve, lluvia y niebla
 * Hecho con ❤️ por David Antizar
 */

export function initWeatherCanvas() {
  const canvas = document.getElementById('weather-overlay');
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);
  return canvas.getContext('2d');
}

export function createParticles() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  return {
    snow: Array.from({ length: 400 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      speed: 0.5 + Math.random() * 2, size: 1 + Math.random() * 4,
      drift: Math.random() * 0.6 - 0.3,
      opacity: 0.3 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
    })),
    rain: Array.from({ length: 600 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      speed: 6 + Math.random() * 14, len: 8 + Math.random() * 16,
      opacity: 0.15 + Math.random() * 0.35,
    })),
  };
}

export function renderWeather(ctx, particles, weather, time) {
  if (!ctx) return;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Niebla
  if (weather.fog) {
    const grad = ctx.createRadialGradient(w / 2, h, h * 0.3, w / 2, h, h * 0.8);
    grad.addColorStop(0, 'rgba(180,190,200,0.05)');
    grad.addColorStop(0.5, 'rgba(180,190,200,0.15)');
    grad.addColorStop(1, 'rgba(180,190,200,0.3)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // Nieve
  if (weather.snow) {
    for (const p of particles.snow) {
      ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      p.y += p.speed;
      p.x += Math.sin(time / 800 + p.phase) * 0.4 + p.drift;
      if (p.y > h) { p.y = -10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
    }
  }

  // Lluvia
  if (weather.rain) {
    for (const p of particles.rain) {
      ctx.strokeStyle = `rgba(174,194,224,${p.opacity})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 1, p.y + p.len);
      ctx.stroke();

      p.y += p.speed;
      if (p.y > h) { p.y = -p.len; p.x = Math.random() * w; }
    }
  }
}
