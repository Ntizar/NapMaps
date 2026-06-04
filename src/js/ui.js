/**
 * UI — Controles, toasts, panel de clima
 * Hecho con ❤️ por David Antizar
 */

export function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => el.classList.remove('show'), 2500);
}

export function hideLoading() {
  const bar = document.getElementById('load-progress');
  bar.style.width = '100%';
  setTimeout(() => {
    document.getElementById('loading').classList.add('hidden');
  }, 600);
}

export function updateTimeDisplay(timeOfDay, solarModule) {
  document.getElementById('time-val').textContent = solarModule.formatTime(timeOfDay);
  document.getElementById('time-period').textContent = solarModule.getSolarPhase(timeOfDay).label;
}

export function updateInfo(map) {
  if (!map) return;
  const c = map.getCenter();
  const z = map.getZoom().toFixed(1);
  document.getElementById('zoom-val').textContent = z;

  const latDir = c.lat >= 0 ? 'N' : 'S';
  const lngDir = c.lng >= 0 ? 'E' : 'W';
  document.getElementById('coord-val').textContent =
    `${Math.abs(c.lat).toFixed(3)}°${latDir} ${Math.abs(c.lng).toFixed(3)}°${lngDir}`;
}
