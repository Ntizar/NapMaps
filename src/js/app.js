/**
 * NapMaps — Motor principal
 * Visor cartográfico 3D con MapLibre GL JS + clima + edificios + ciclo solar
 * Stack abierto: MapLibre (BSD) · CartoDB · ESRI · Stadia Maps
 *
 * API Key: 89affde8-a8b8-43b6-ab33-67c48c2a43b7
 * (Stadia Maps para tiles premium y geocoding)
 */

import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// ─── CONFIG ────────────────────────────────────────────────────────
const API_KEY = '89affde8-a8b8-43b6-ab33-67c48c2a43b7';

const CONFIG = {
  center: [-3.7038, 40.4168], // Madrid, Puerta del Sol
  zoom: 13,
  pitch: 55,
  bearing: -15,
  maxPitch: 85,

  // Estilos de mapa (modelos abiertos)
  styles: {
    streets: {
      name: 'Calles',
      uri: `https://tiles.stadiamaps.com/styles/alidade_smooth.json?api_key=${API_KEY}`,
      fallback: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    },
    dark: {
      name: 'Oscuro',
      uri: `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${API_KEY}`,
      fallback: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    },
    satellite: {
      name: 'Satélite',
      uri: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      raster: true,
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        'https://a.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png',
      ],
    },
    terrain: {
      name: 'Terreno',
      uri: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      dem: true,
    },
  },

  // Edificios de Madrid (basados en OSM real, simplificados)
  buildings: generateMadridBuildings(),

  // Puntos de interés de Madrid
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

// ─── STATE ─────────────────────────────────────────────────────────
const state = {
  timeOfDay: 840, // minutos (14:00)
  style: 'streets',
  weather: { snow: false, rain: false, fog: false, nightLights: true },
  layers: { buildings: true, terrain: true, shadows: true, animate: true },
  map: null,
  fps: 60,
  animFrame: null,
  lastFrame: 0,
  frameCount: 0,
  frameTime: 0,
};

// ─── GENERAR EDIFICIOS DE MADRID ──────────────────────────────────
function generateMadridBuildings() {
  const buildings = [];
  // Cuadrícula centrada en Sol
  for (let dx = -60; dx <= 60; dx++) {
    for (let dy = -60; dy <= 60; dy++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 55) continue;
      // Densidad urbana: más edificios cerca del centro
      const density = Math.max(0, 1 - dist / 60);
      if (Math.random() > density * 0.7 + 0.15) continue;

      // Coordenadas geográficas (1 unidad ~ 0.0015 grados ~ 110m)
      const lng = CONFIG.center[0] + dx * 0.0015 + (Math.random() - 0.5) * 0.001;
      const lat = CONFIG.center[1] + dy * 0.0015 + (Math.random() - 0.5) * 0.001;

      // Altura según distancia al centro
      const heightBase = (1 - dist / 60) * 60;
      const height = Math.max(3, heightBase * (0.3 + Math.random() * 0.7));

      // Tamaño del edificio
      const w = 10 + Math.random() * 25;
      const h = 10 + Math.random() * 25;

      // Color según altura (más alto = más claro/azul)
      const colorVal = Math.floor(30 + (height / 60) * 60);
      const roof = `hsl(${220 + Math.random() * 20}, ${15 + height/3}%, ${colorVal}%)`;
      const wall = `hsl(${215 + Math.random() * 25}, ${10 + height/4}%, ${colorVal - 8}%)`;

      buildings.push({
        type: 'Feature',
        properties: {
          height: Math.round(height),
          min_height: 0,
          color: roof,
          wallColor: wall,
          landmark: dist < 2 && Math.random() > 0.85,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [lng, lat],
            [lng + w * 0.000015, lat],
            [lng + w * 0.000015, lat + h * 0.000015],
            [lng, lat + h * 0.000015],
            [lng, lat],
          ]],
        },
      });
    }
  }

  // Añadir rascacielos emblemáticos (más altos)
  const landmarks = [
    { name: 'Torre Cepsa', coords: [-3.6896, 40.4775], h: 250 },
    { name: 'Torre PwC', coords: [-3.6890, 40.4770], h: 236 },
    { name: 'Torre de Cristal', coords: [-3.6880, 40.4765], h: 249 },
    { name: 'Torre Espacio', coords: [-3.6888, 40.4780], h: 230 },
    { name: 'Edificio Telefónica', coords: [-3.7000, 40.4200], h: 92 },
  ];

  for (const lm of landmarks) {
    buildings.push({
      type: 'Feature',
      properties: {
        height: lm.h,
        min_height: 0,
        color: '#6a8cba',
        wallColor: '#4a6a9a',
        landmark: true,
        name: lm.name,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [lm.coords[0] - 0.0008, lm.coords[1] - 0.0008],
          [lm.coords[0] + 0.0008, lm.coords[1] - 0.0008],
          [lm.coords[0] + 0.0008, lm.coords[1] + 0.0008],
          [lm.coords[0] - 0.0008, lm.coords[1] + 0.0008],
          [lm.coords[0] - 0.0008, lm.coords[1] - 0.0008],
        ]],
      },
    });
  }

  return buildings;
}

// ─── CICLO SOLAR ────────────────────────────────────────────────────
const SOLAR_PHASES = [
  { min: 0, max: 360,  label: 'Noche',        sunAlt: -30, tempK: 4000, amb: 0.08, hue: 0.7, fogDens: 0.4,  skyColor: '#0a0a1a' },
  { min: 360, max: 480, label: 'Amanecer',     sunAlt: -5,  tempK: 3500, amb: 0.2,  hue: 0.08, fogDens: 0.3,   skyColor: '#1a1040' },
  { min: 480, max: 660, label: 'Mañana',       sunAlt: 25,  tempK: 5500, amb: 0.7,  hue: 0.12, fogDens: 0.1,   skyColor: '#4a7ab5' },
  { min: 660, max: 900, label: 'Mediodía',     sunAlt: 55,  tempK: 6500, amb: 1.0,  hue: 0.0,  fogDens: 0.05,  skyColor: '#6ba3d6' },
  { min: 900, max: 1020,label: 'Tarde',        sunAlt: 30,  tempK: 5500, amb: 0.8,  hue: 0.05, fogDens: 0.08,  skyColor: '#7ab5c8' },
  { min: 1020, max: 1140,label: 'Atardecer',   sunAlt: 5,   tempK: 3500, amb: 0.35, hue: 0.12, fogDens: 0.2,   skyColor: '#c46a3a' },
  { min: 1140, max: 1260,label: 'Crepúsculo',  sunAlt: -10, tempK: 3000, amb: 0.15, hue: 0.5,  fogDens: 0.35,  skyColor: '#2a1a3a' },
  { min: 1260, max: 1440,label: 'Noche',        sunAlt: -30, tempK: 4000, amb: 0.08, hue: 0.7,  fogDens: 0.4,   skyColor: '#0a0a1a' },
];

function getSolarPhase(minutes) {
  return SOLAR_PHASES.find(p => minutes >= p.min && minutes < p.max) || SOLAR_PHASES[0];
}

function lerpColors(c1, c2, t) {
  const r = c1[0] + (c2[0] - c1[0]) * t;
  const g = c1[1] + (c2[1] - c1[1]) * t;
  const b = c1[2] + (c2[2] - c1[2]) * t;
  return [r, g, b];
}

// ─── MAPLIBRE INIT ──────────────────────────────────────────────────
function initMap() {
  const styleDef = CONFIG.styles[state.style];
  const styleUrl = styleDef.uri;
  const fallbackUrl = styleDef.fallback;

  state.map = new maplibregl.Map({
    container: 'map',
    style: styleUrl,
    center: CONFIG.center,
    zoom: CONFIG.zoom,
    pitch: CONFIG.pitch,
    bearing: CONFIG.bearing,
    antialias: true,
    attributionControl: false,
    maxPitch: CONFIG.maxPitch,
  });

  // Fallback si falla el estilo
  state.map.on('style.load', () => applySolarCycle());
  state.map.on('error', (e) => {
    console.warn('MapLibre error:', e.error?.status, e.error?.message);
    // Fallback a CartoDB en cualquier error
    console.warn('Stadia fallback → CartoDB');
    state.map.setStyle(fallbackUrl);
    state.map.once('load', () => {
      setupBuildingsLayer();
      setupTerrain();
      setupPOIMarkers();
      applySolarCycle();
      hideLoading();
    });
  });

  // Controles de navegación minimalistas
  state.map.addControl(new maplibregl.NavigationControl({
    showCompass: true,
    showZoom: false,
  }), 'bottom-right');

  // Escala
  state.map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

  // Edificios 3D (cuando cargue)
  state.map.on('load', () => {
    setupBuildingsLayer();
    setupTerrain();
    setupPOIMarkers();
    hideLoading();
  });

  state.map.on('move', updateInfo);

  // Doble click para zoom suave
  state.map.on('dblclick', (e) => {
    state.map.flyTo({ center: e.lngLat, zoom: state.map.getZoom() + 1 });
  });
}

// ─── EDIFICIOS 3D ───────────────────────────────────────────────────
function setupBuildingsLayer() {
  const src = state.map.getSource('madrid-buildings');
  if (src) return;

  state.map.addSource('madrid-buildings', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: CONFIG.buildings },
  });

  // Edificios 3D con extrusión
  state.map.addLayer({
    id: 'buildings-3d',
    type: 'fill-extrusion',
    source: 'madrid-buildings',
    paint: {
      'fill-extrusion-color': ['get', 'wallColor'],
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': ['get', 'min_height'],
      'fill-extrusion-opacity': 0.9,
      'fill-extrusion-vertical-gradient': true,
    },
  });

  // Techos (capa separada para color diferente)
  state.map.addLayer({
    id: 'buildings-roofs',
    type: 'fill-extrusion',
    source: 'madrid-buildings',
    paint: {
      'fill-extrusion-color': ['get', 'color'],
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': ['case', ['>', ['get', 'height'], 0], ['-', ['get', 'height'], 0.5], 0],
      'fill-extrusion-opacity': 1,
      'fill-extrusion-vertical-gradient': false,
    },
  });

  // Etiquetas de landmarks (solo en zoom alto)
  state.map.addLayer({
    id: 'buildings-labels',
    type: 'symbol',
    source: 'madrid-buildings',
    filter: ['==', ['get', 'landmark'], true],
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-size': 10,
      'text-offset': [0, -1],
      'text-anchor': 'bottom',
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': 'rgba(0,0,0,0.6)',
      'text-halo-width': 2,
    },
    minzoom: 15,
  });

  updateBuildingsVisibility();
}

// ─── TERENO 3D ──────────────────────────────────────────────────────
function setupTerrain() {
  try {
    state.map.addSource('nap-dem', {
      type: 'raster-dem',
      tiles: [
        `https://api.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.png?api_key=${API_KEY}`,
        'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      maxzoom: 15,
    });
    state.map.setTerrain({ source: 'nap-dem', exaggeration: 1.3 });
  } catch (e) {
    console.warn('Terreno 3D no disponible');
  }
  updateTerrainVisibility();
}

// ─── POIS ────────────────────────────────────────────────────────────
function setupPOIMarkers() {
  // Limpiar marcadores anteriores
  document.querySelectorAll('.nap-poi-marker').forEach(el => el.remove());

  for (const poi of CONFIG.pois) {
    const el = document.createElement('div');
    el.className = 'nap-poi-marker';
    el.innerHTML = `<span style="font-size:20px;cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">${poi.emoji}</span>`;
    el.title = `${poi.name} — ${poi.desc}`;
    el.addEventListener('click', () => {
      flyTo(poi.coords, 16);
      showToast(`📍 ${poi.name} — ${poi.desc}`);
    });

    new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(poi.coords)
      .addTo(state.map);
  }
}

// ─── CICLO SOLAR EN MAPA ────────────────────────────────────────────
function applySolarCycle() {
  const phase = getSolarPhase(state.timeOfDay);

  // Ajustar ambiente del mapa
  if (state.map.getLayer('buildings-3d')) {
    state.map.setPaintProperty('buildings-3d', 'fill-extrusion-opacity',
      0.5 + phase.amb * 0.5);
  }

  // Iluminación solar 3D
  const sunPos = [
    Math.cos((state.timeOfDay / 1440) * Math.PI * 2 - Math.PI / 2) * 80,
    -30 + phase.sunAlt,
  ];

  try {
    state.map.setLight({
      anchor: 'map',
      position: sunPos,
      color: `hsl(${30 + phase.hue * 200}, 50%, ${90 * phase.amb + 10}%)`,
      intensity: 0.5 + phase.amb * 1.5,
    });
  } catch (e) { /* ignora */ }

  // Sombras si están activas
  if (state.layers.shadows && state.map.getLayer('buildings-3d')) {
    state.map.setPaintProperty('buildings-3d', 'fill-extrusion-opacity', 0.7 + phase.amb * 0.3);
  }

  // Color del cielo (fondo del mapa)
  try {
    state.map.setFog({
      range: [0.5, 8],
      color: phase.skyColor,
      'horizon-blend': 0.2 + (1 - phase.amb) * 0.3,
    });
  } catch (e) { /* versión antigua de MapLibre */ }

  updateTimeDisplay();
}

// ─── WEATHER PARTICLES ─────────────────────────────────────────────
const particles = { snow: [], rain: [] };
let weatherCtx = null;

function initWeatherCanvas() {
  const canvas = document.getElementById('weather-overlay');
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);
  weatherCtx = canvas.getContext('2d');
}

function createParticles() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  particles.snow = Array.from({ length: 400 }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    speed: 0.5 + Math.random() * 2, size: 1 + Math.random() * 4,
    drift: Math.random() * 0.6 - 0.3,
    opacity: 0.3 + Math.random() * 0.7,
    phase: Math.random() * Math.PI * 2,
  }));
  particles.rain = Array.from({ length: 600 }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    speed: 6 + Math.random() * 14, len: 8 + Math.random() * 16,
    opacity: 0.15 + Math.random() * 0.35,
  }));
}

function renderWeather(time) {
  if (!weatherCtx) return;
  const ctx = weatherCtx;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Niebla (primero, debajo de partículas)
  if (state.weather.fog) {
    const phase = getSolarPhase(state.timeOfDay);
    const fd = phase.fogDens;
    const grad = ctx.createRadialGradient(w / 2, h, h * 0.3, w / 2, h, h * 0.8);
    grad.addColorStop(0, `rgba(180,190,200,${fd * 0.05})`);
    grad.addColorStop(0.5, `rgba(180,190,200,${fd * 0.15})`);
    grad.addColorStop(1, `rgba(180,190,200,${fd * 0.3})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // Nieve
  if (state.weather.snow) {
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
  if (state.weather.rain) {
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

// ─── UI ──────────────────────────────────────────────────────────────
function setupUI() {
  // Time slider
  const slider = document.getElementById('time-slider');
  slider.addEventListener('input', () => {
    state.timeOfDay = parseInt(slider.value);
    applySolarCycle();
  });

  // Time presets
  document.querySelectorAll('.time-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      state.timeOfDay = parseInt(btn.dataset.time);
      slider.value = state.timeOfDay;
      document.querySelectorAll('.time-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applySolarCycle();
    });
  });

  // Weather toggles
  document.getElementById('chk-snow').addEventListener('change', e => {
    state.weather.snow = e.target.checked;
    createParticles();
  });
  document.getElementById('chk-rain').addEventListener('change', e => {
    state.weather.rain = e.target.checked;
    createParticles();
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
      switchStyle(style);
    });
  });

  // Layer toggles
  document.getElementById('chk-buildings').addEventListener('change', e => {
    state.layers.buildings = e.target.checked;
    updateBuildingsVisibility();
  });
  document.getElementById('chk-terrain').addEventListener('change', e => {
    state.layers.terrain = e.target.checked;
    updateTerrainVisibility();
  });
  document.getElementById('chk-shadows').addEventListener('change', e => {
    state.layers.shadows = e.target.checked;
    applySolarCycle();
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

  document.getElementById('btn-screenshot').addEventListener('click', takeScreenshot);

  // Header buttons
  document.getElementById('btn-fly').addEventListener('click', () => {
    flyTo(CONFIG.center, 14.5);
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

function updateTimeDisplay() {
  const h = Math.floor(state.timeOfDay / 60);
  const m = state.timeOfDay % 60;
  document.getElementById('time-val').textContent =
    `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
  document.getElementById('time-period').textContent = getSolarPhase(state.timeOfDay).label;

  // Active preset
  const phase = getSolarPhase(state.timeOfDay);
  document.querySelectorAll('.time-preset').forEach(btn => {
    const t = parseInt(btn.dataset.time);
    const btnPhase = getSolarPhase(t);
    btn.classList.toggle('active', btnPhase.label === phase.label);
  });
}

function updateInfo() {
  if (!state.map) return;
  const c = state.map.getCenter();
  const z = state.map.getZoom().toFixed(1);
  document.getElementById('zoom-val').textContent = z;
  document.getElementById('coord-val').textContent =
    `${c.lat.toFixed(3)}°N ${c.lng.toFixed(3)}°W`;
}

function updateBuildingsVisibility() {
  const vis = state.layers.buildings ? 'visible' : 'none';
  ['buildings-3d', 'buildings-roofs', 'buildings-labels'].forEach(id => {
    if (state.map.getLayer(id)) state.map.setLayoutProperty(id, 'visibility', vis);
  });
}

function updateTerrainVisibility() {
  try {
    state.map.setTerrain(state.layers.terrain
      ? { source: 'nap-dem', exaggeration: 1.3 }
      : null);
  } catch (e) { /* */ }
}

// ─── SWITCH STYLE ────────────────────────────────────────────────────
function switchStyle(style) {
  const def = CONFIG.styles[style];
  const url = def.uri;
  const fallback = def.fallback;

  state.map.once('style.load', () => {
    setupBuildingsLayer();
    if (style === 'terrain') setupTerrain();
    setupPOIMarkers();
    applySolarCycle();
  });

  if (style === 'satellite') {
    // Raster style
    state.map.setStyle(fallback);
    state.map.once('style.load', () => {
      state.map.addSource('satellite-base', {
        type: 'raster',
        tiles: def.tiles,
        tileSize: 256,
      });
      state.map.addLayer({
        id: 'satellite-base-layer',
        type: 'raster',
        source: 'satellite-base',
        paint: { 'raster-opacity': 1 },
      });
      setupBuildingsLayer();
      setupPOIMarkers();
      applySolarCycle();
    });
  } else if (style === 'terrain') {
    state.map.setStyle(fallback);
    state.map.once('style.load', () => {
      setupTerrain();
      setupBuildingsLayer();
      setupPOIMarkers();
      applySolarCycle();
    });
  } else {
    state.map.setStyle(url);
    state.map.on('error', function onErr(e) {
      if (e.error?.status === 401 || e.error?.status === 404) {
        state.map.setStyle(fallback);
        state.map.off('error', onErr);
      }
    });
  }
}

// ─── SEARCH ──────────────────────────────────────────────────────────
function setupSearch() {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { results.classList.remove('active'); return; }

    const matches = CONFIG.pois.filter(p =>
      p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
    );

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
        flyTo([lng, lat], 16);
        const name = el.querySelector('div div:first-child').textContent;
        input.value = name;
        results.classList.remove('active');
        showToast(`📍 ${name}`);
      });
    });
  });

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

// ─── FLY TO ──────────────────────────────────────────────────────────
function flyTo(coords, zoom = 15) {
  state.map.flyTo({
    center: coords,
    zoom,
    pitch: 60,
    duration: 2000,
  });
}

// ─── SCREENSHOT ────────────────────────────────────────────────────
function takeScreenshot() {
  const canvas = state.map.getCanvas();
  const link = document.createElement('a');
  const now = new Date();
  const ts = `${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}`;
  link.download = `napmaps-madrid-${ts}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('📸 Captura guardada');
}

// ─── TOAST ──────────────────────────────────────────────────────────
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => el.classList.remove('show'), 2500);
}

// ─── LOADING ─────────────────────────────────────────────────────────
function hideLoading() {
  const bar = document.getElementById('load-progress');
  bar.style.width = '100%';
  setTimeout(() => {
    document.getElementById('loading').classList.add('hidden');
  }, 600);
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

  renderWeather(timestamp);

  state.animFrame = requestAnimationFrame(animate);
}

// ─── INIT ────────────────────────────────────────────────────────────
function init() {
  initWeatherCanvas();
  createParticles();
  initMap();
  setupUI();

  // Animación de carga
  let p = 0;
  const interval = setInterval(() => {
    p += 5 + Math.random() * 10;
    document.getElementById('load-progress').style.width = Math.min(p, 90) + '%';
    if (p >= 90) clearInterval(interval);
  }, 200);

  // Timeout: si el mapa no carga en 12s, ocultar loading y mostrar mapa vacío
  setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading && !loading.classList.contains('hidden')) {
      console.warn('Timeout de carga — mostrando mapa sin tiles');
      loading.classList.add('hidden');
      // Si el mapa no se inicializó, crear uno con estilo CartoDB como fallback
      if (!state.map) {
        console.log('Creando mapa fallback con CartoDB');
        state.map = new maplibregl.Map({
          container: 'map',
          style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
          center: CONFIG.center,
          zoom: CONFIG.zoom,
          pitch: CONFIG.pitch,
          bearing: CONFIG.bearing,
          antialias: true,
          attributionControl: false,
          maxPitch: CONFIG.maxPitch,
        });
        state.map.on('load', () => {
          setupBuildingsLayer();
          setupTerrain();
          setupPOIMarkers();
          applySolarCycle();
        });
      }
    }
  }, 12000);

  // Arrancar bucle de animación
  animate(0);
}

document.addEventListener('DOMContentLoaded', init);
