/**
 * Ciclo solar — NapMaps
 * Fase, iluminación, color del cielo, sombras
 * Hecho con ❤️ por David Antizar
 */

export const SOLAR_PHASES = [
  { min: 0, max: 360,  label: 'Noche',        sunAlt: -30, tempK: 4000, amb: 0.08, hue: 0.7, fogDens: 0.4,  skyColor: '#0a0a1a' },
  { min: 360, max: 480, label: 'Amanecer',     sunAlt: -5,  tempK: 3500, amb: 0.2,  hue: 0.08, fogDens: 0.3,   skyColor: '#1a1040' },
  { min: 480, max: 660, label: 'Mañana',       sunAlt: 25,  tempK: 5500, amb: 0.7,  hue: 0.12, fogDens: 0.1,   skyColor: '#4a7ab5' },
  { min: 660, max: 900, label: 'Mediodía',     sunAlt: 55,  tempK: 6500, amb: 1.0,  hue: 0.0,  fogDens: 0.05,  skyColor: '#6ba3d6' },
  { min: 900, max: 1020,label: 'Tarde',        sunAlt: 30,  tempK: 5500, amb: 0.8,  hue: 0.05, fogDens: 0.08,  skyColor: '#7ab5c8' },
  { min: 1020, max: 1140,label: 'Atardecer',   sunAlt: 5,   tempK: 3500, amb: 0.35, hue: 0.12, fogDens: 0.2,   skyColor: '#c46a3a' },
  { min: 1140, max: 1260,label: 'Crepúsculo',  sunAlt: -10, tempK: 3000, amb: 0.15, hue: 0.5,  fogDens: 0.35,  skyColor: '#2a1a3a' },
  { min: 1260, max: 1440,label: 'Noche',        sunAlt: -30, tempK: 4000, amb: 0.08, hue: 0.7,  fogDens: 0.4,   skyColor: '#0a0a1a' },
];

export function getSolarPhase(minutes) {
  return SOLAR_PHASES.find(p => minutes >= p.min && minutes < p.max) || SOLAR_PHASES[0];
}

export function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function applySolarCycle(map, timeOfDay, layers) {
  const phase = getSolarPhase(timeOfDay);

  // Opacidad de edificios según luminosidad
  if (map.getLayer('buildings-3d')) {
    map.setPaintProperty('buildings-3d', 'fill-extrusion-opacity',
      0.5 + phase.amb * 0.5);
  }

  // Posición del sol
  const sunPos = [
    Math.cos((timeOfDay / 1440) * Math.PI * 2 - Math.PI / 2) * 80,
    -30 + phase.sunAlt,
  ];

  try {
    map.setLight({
      anchor: 'map',
      position: sunPos,
      color: `hsl(${30 + phase.hue * 200}, 50%, ${90 * phase.amb + 10}%)`,
      intensity: 0.5 + phase.amb * 1.5,
    });
  } catch (e) { /* ignora */ }

  // Sombras
  if (layers.shadows && map.getLayer('buildings-3d')) {
    map.setPaintProperty('buildings-3d', 'fill-extrusion-opacity', 0.7 + phase.amb * 0.3);
  }

  // Color del cielo (fog)
  try {
    map.setFog({
      range: [0.5, 8],
      color: phase.skyColor,
      'horizon-blend': 0.2 + (1 - phase.amb) * 0.3,
    });
  } catch (e) { /* versión antigua de MapLibre */ }
}
