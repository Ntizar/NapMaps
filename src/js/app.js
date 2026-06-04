/**
 * NapMaps — Visor cartográfico 3D de Madrid
 * Motor principal (orchestrator)
 * MapLibre GL JS + CartoDB + ESRI + ciclo solar + clima
 * 100% abierto, sin API keys necesarias
 * Hecho con ❤️ por David Antizar
 */

import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { generateMadridBuildings } from './buildings.js';
import { SOLAR_PHASES, getSolarPhase, formatTime, applySolarCycle } from './solar.js';
import { initWeatherCanvas, createParticles, renderWeather } from './weather.js';
import {
  createMap, setupBuildingsLayer, setupTerrain, setupPOIMarkers,
  switchStyle, updateBuildingsVisibility, updateTerrainVisibility,
  flyTo, takeScreenshot,
} from './map.js';
import { showToast, hideLoading, updateTimeDisplay, updateInfo } from './ui.js';

// ─── CONFIG ─────────────────────────────────────────────────────────
const CONFIG = {
  center: [-3.7038, 40.4168],
  zoom: 13,
  pitch: 55,
  bearing: -15,
  maxPitch: 85,

  styles: {
    streets: {
      name: 'Calles',
      uri: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    },
    dark: {
      name: 'Oscuro',
      uri: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    },
    satellite: {
      name: 'Satélite',
      uri: null,
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      labels: ['https://a.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png'],
    },
    terrain: {
      name: 'Terreno',
      uri: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    },
  },

  buildings: generateMadridBuildings(),

  pois: [
    { name: 'Puerta del Sol', coords: [-3.7038, 40.4168], emoji: '⛲', desc: 'Kilómetro 0' },
    { name: 'Gran Vía', coords: [-3.7027, 40.4205], emoji: '🏛️', desc: 'El Broadway madrileño' },
    { name: 'Palacio Real', coords: [-3.7143, 40.4178], emoji: '👑', desc: 'Residencia oficial' },
    { name: 'Templo de Debod', coords: [-3.7177, 40.424], emoji: '🏗️', desc: 'Templo egipcio' },
    { name: 'Parque del Retiro', coords: [-3.685, 40.415], emoji: '🌳', desc: 'Parque histórico' },
    { name: 'Plaza Mayor', coords: [-3.7074, 40.4153], emoji: '🏛️', desc: 'Plaza principal' },
    { name: 'Estadio Santiago Bernabéu', coords: [-3.6883, 40.453], emoji: '⚽', desc: 'Estadio del Real Madrid' },
    { name: 'Museo del Prado', coords: [-3.6931, 40.4138], emoji: '🎨', desc: 'Museo de arte' },
    { name: 'Cibeles', coords: [-3.6933, 40.4192], emoji: '🏛️', desc: 'Fuente y plaza' },
    { name: 'Cuatro Torres', coords: [-3.6896, 40.477], emoji: '🏢', desc: 'Zona empresarial' },
    { name: 'Puerta de Alcalá', coords: [-3.6885, 40.4204], emoji: '🚪', desc: 'Monumento neoclásico' },
    { name: 'Matadero Madrid', coords: [-3.7017, 40.3913], emoji: '🎭', desc: 'Centro cultural' },
    { name: 'Atocha', coords: [-3.6907, 40.406], emoji: '🚉', desc: 'Estación de tren' },
    { name: 'Casa de Campo', coords: [-3.748, 40.421], emoji: '🌲', desc: 'Parque forestal' },
  ],
};

// ─── STATE ──────────────────────────────────────────────────────────
const state = {
  timeOfDay: 840, // 14:00
  style: 'streets',
  weather: { snow: false, rain: false, fog: false, nightLights: true },
  layers: { buildings: true, terrain: true, shadows: true, animate: true },
  map: null,
  particles: null,
  weatherCtx: null,
  fps: 60,
  lastFrame: 0,
  frameCount: 0,
  frameTime: 0,
};

// ─── INIT ───────────────────────────────────────────────────────────
function init() {
  state.weatherCtx = initWeatherCanvas();
  state.particles = createParticles();

  // Crear mapa
  state.map = createMap(CONFIG);

  // Cuando el mapa cargue: añadir capas
  state.map.on('load', () => {
    setupBuildingsLayer(state.map, CONFIG.buildings);
    setupTerrain(state.map);
    setupPOIMarkers(state.map, CONFIG.pois);
    applySolarCycle(state.map, state.timeOfDay, state.layers);
    hideLoading();
  });

  // Actualizar info al mover el mapa
  state.map.on('move', () => updateInfo(state.map));

  setupUI();

  // Animación de carga
  let p = 0;
  const interval = setInterval(() => {
    p += 5 + Math.random() * 10;
    document.getElementById('load-progress').style.width = Math.min(p, 90) + '%';
    if (p >= 90) clearInterval(interval);
  }, 200);

  // Timeout: si el mapa no carga en 12s
  setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading && !loading.classList.contains('hidden')) {
      console.warn('Timeout de carga — mostrando mapa sin tiles');
      loading.classList.add('hidden');
      if (!state.map) {
        state.map = createMap(CONFIG);
        state.map.on('load', () => {
          setupBuildingsLayer(state.map, CONFIG.buildings);
          setupTerrain(state.map);
          setupPOIMarkers(state.map, CONFIG.pois);
          applySolarCycle(state.map, state.timeOfDay, state.layers);
        });
      }
    }
  }, 12000);

  // Arrancar bucle de animación
  requestAnimationFrame(animate);
}

// ─── ANIMATION LOOP ─────────────────────────────────────────────────
function animate(timestamp) {
  if (!state.lastFrame) state.lastFrame = timestamp;
  const dt = timestamp - state.lastFrame;
  state.lastFrame = timestamp;

  // FPS
  state.frameCount++;
  state.frameTime += dt;
  if (state.frameTime >= 1000) {
    state.fps = state.frameCount;
    state.frameCount = 0;
    state.frameTime = 0;
    document.getElementById('fps-val').textContent = state.fps;
  }

  // Clima
  renderWeather(state.weatherCtx, state.particles, state.weather, timestamp);

  requestAnimationFrame(animate);
}

// ─── UI SETUP ───────────────────────────────────────────────────────
function setupUI() {
  // Time slider
  const slider = document.getElementById('time-slider');
  slider.addEventListener('input', () => {
    state.timeOfDay = parseInt(slider.value);
    updateTimeDisplay(state.timeOfDay, { formatTime, getSolarPhase });
    applySolarCycle(state.map, state.timeOfDay, state.layers);
  });

  // Time presets
  document.querySelectorAll('.time-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      state.timeOfDay = parseInt(btn.dataset.time);
      slider.value = state.timeOfDay;
      document.querySelectorAll('.time-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateTimeDisplay(state.timeOfDay, { formatTime, getSolarPhase });
      applySolarCycle(state.map, state.timeOfDay, state.layers);
    });
  });

  // Weather toggles
  document.getElementById('chk-snow').addEventListener('change', e => {
    state.weather.snow = e.target.checked;
    state.particles = createParticles();
  });
  document.getElementById('chk-rain').addEventListener('change', e => {
    state.weather.rain = e.target.checked;
    state.particles = createParticles();
  });
  document.getElementById('chk-fog').addEventListener('change', e => {
    state.weather.fog = e.target.checked;
  });
  document.getElementById('chk-nlights').addEventListener('change', e => {
    state.weather.nightLights = e.target.checked;
  });

  // Map style
  document.querySelectorAll('.style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const style = btn.dataset.style;
      if (style === state.style) return;
      state.style = style;
      document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      switchStyle(state.map, CONFIG.styles[style]);
      state.map.once('style.load', () => {
        setupBuildingsLayer(state.map, CONFIG.buildings);
        if (style === 'terrain') setupTerrain(state.map);
        setupPOIMarkers(state.map, CONFIG.pois);
        applySolarCycle(state.map, state.timeOfDay, state.layers);
      });
    });
  });

  // Layer toggles
  document.getElementById('chk-buildings').addEventListener('change', e => {
    state.layers.buildings = e.target.checked;
    updateBuildingsVisibility(state.map, state.layers.buildings);
  });
  document.getElementById('chk-terrain').addEventListener('change', e => {
    state.layers.terrain = e.target.checked;
    updateTerrainVisibility(state.map, state.layers.terrain);
  });
  document.getElementById('chk-shadows').addEventListener('change', e => {
    state.layers.shadows = e.target.checked;
    applySolarCycle(state.map, state.timeOfDay, state.layers);
  });
  document.getElementById('chk-animate').addEventListener('change', e => {
    state.layers.animate = e.target.checked;
  });

  // Bottom bar
  document.getElementById('btn-reset').addEventListener('click', () => {
    state.map.flyTo({
      center: CONFIG.center,
      zoom: 13,
      pitch: 55,
      bearing: -15,
      duration: 2000,
    });
    showToast('🔄 Vista restablecida');
  });

  document.getElementById('btn-screenshot').addEventListener('click', () => {
    takeScreenshot(state.map);
  });

  // Header buttons
  document.getElementById('btn-fly').addEventListener('click', () => {
    flyTo(state.map, CONFIG.center, 14.5);
    showToast('🚁 Vista aérea de Madrid');
  });
  document.getElementById('btn-3d').addEventListener('click', () => {
    state.map.flyTo({ pitch: 75, bearing: -30, duration: 1500 });
    showToast('🏗️ Modo 3D activado');
  });
  document.getElementById('btn-layers').addEventListener('click', () => {
    document.getElementById('controls').scrollTop =
      document.getElementById('controls').scrollHeight;
    showToast('📑 Capas activas: Edificios + Terreno + Clima');
  });

  // Search
  setupSearch();
}

// ─── SEARCH / GEOCODING (Nominatim - OpenStreetMap, gratuito) ───────
function setupSearch() {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  let debounceTimer = null;

  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (q.length < 2) { results.classList.remove('active'); return; }

    const qLower = q.toLowerCase();
    const localMatches = CONFIG.pois.filter(p =>
      p.name.toLowerCase().includes(qLower) || p.desc.toLowerCase().includes(qLower)
    );

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ', Madrid, Spain')}&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'es' } }
        );
        const data = await resp.json();

        const onlineMatches = data.map(r => ({
          name: r.display_name.split(',')[0],
          coords: [parseFloat(r.lon), parseFloat(r.lat)],
          emoji: '📍',
          desc: r.display_name.split(',').slice(1, 3).join(','),
          online: true,
        }));

        displayResults([...localMatches, ...onlineMatches]);
      } catch (e) {
        displayResults(localMatches);
      }
    }, 400);
  });

  function displayResults(matches) {
    results.innerHTML = matches.length
      ? matches.map(p => `
        <div class="search-result-item" data-lng="${p.coords[0]}" data-lat="${p.coords[1]}">
          <span class="emoji">${p.emoji}</span>
          <div>
            <div style="font-weight:500;font-size:13px">${p.name}</div>
            <div style="font-size:11px;color:var(--nap-text-dim)">${p.desc}</div>
          </div>
        </div>
      `).join('')
      : '<div class="search-result-item" style="color:var(--nap-text-dim);font-size:12px">📍 No encontrado</div>';

    results.classList.add('active');

    results.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        const lng = parseFloat(el.dataset.lng);
        const lat = parseFloat(el.dataset.lat);
        flyTo(state.map, [lng, lat], 16);
        const name = el.querySelector('div div:first-child').textContent;
        input.value = name;
        results.classList.remove('active');
        showToast(`📍 ${name}`);
      });
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) results.classList.remove('active');
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') results.classList.remove('active');
    if (e.key === 'Enter') {
      const first = results.querySelector('.search-result-item');
      if (first) first.click();
    }
  });
}

// ─── BOOT ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
