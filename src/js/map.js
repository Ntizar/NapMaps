/**
 * Mapa principal — NapMaps
 * Inicialización MapLibre, capas, estilos
 * Hecho con ❤️ por David Antizar
 */

export function createMap(config) {
  const styleDef = config.styles.streets;

  const map = new maplibregl.Map({
    container: 'map',
    style: styleDef.uri,
    center: config.center,
    zoom: config.zoom,
    pitch: config.pitch,
    bearing: config.bearing,
    antialias: true,
    attributionControl: false,
    maxPitch: config.maxPitch,
  });

  // Controles
  map.addControl(new maplibregl.NavigationControl({
    showCompass: true,
    showZoom: false,
  }), 'bottom-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

  // Error handling
  map.on('error', (e) => {
    console.warn('MapLibre error:', e.error?.status, e.error?.message);
  });

  // Doble click para zoom
  map.on('dblclick', (e) => {
    map.flyTo({ center: e.lngLat, zoom: map.getZoom() + 1 });
  });

  return map;
}

export function setupBuildingsLayer(map, buildings) {
  if (map.getSource('madrid-buildings')) return;

  map.addSource('madrid-buildings', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: buildings },
  });

  // Edificios 3D
  map.addLayer({
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

  // Techos
  map.addLayer({
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

  // Etiquetas de landmarks
  map.addLayer({
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
}

export function setupTerrain(map) {
  try {
    map.addSource('nap-dem', {
      type: 'raster-dem',
      tiles: [
        'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      maxzoom: 15,
    });
    map.setTerrain({ source: 'nap-dem', exaggeration: 1.3 });
  } catch (e) {
    console.warn('Terreno 3D no disponible');
  }
}

export function setupPOIMarkers(map, pois) {
  document.querySelectorAll('.nap-poi-marker').forEach(el => el.remove());

  for (const poi of pois) {
    const el = document.createElement('div');
    el.className = 'nap-poi-marker';
    el.innerHTML = `<span style="font-size:20px;cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">${poi.emoji}</span>`;
    el.title = `${poi.name} — ${poi.desc}`;
    el.addEventListener('click', () => {
      flyTo(map, poi.coords, 16);
      showToast(`📍 ${poi.name} — ${poi.desc}`);
    });

    new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(poi.coords)
      .addTo(map);
  }
}

export function switchStyle(map, styleDef) {
  if (styleDef.uri) {
    map.setStyle(styleDef.uri);
  } else {
    // Raster style: ESRI + CartoDB labels
    map.setStyle({
      version: 8,
      name: 'Satellite',
      sources: {
        'satellite-base': {
          type: 'raster',
          tiles: styleDef.tiles,
          tileSize: 256,
        },
        'satellite-labels': {
          type: 'raster',
          tiles: styleDef.labels,
          tileSize: 256,
        },
      },
      layers: [
        { id: 'satellite-base-layer', type: 'raster', source: 'satellite-base' },
        { id: 'satellite-labels-layer', type: 'raster', source: 'satellite-labels' },
      ],
    });
  }
}

export function updateBuildingsVisibility(map, visible) {
  const vis = visible ? 'visible' : 'none';
  ['buildings-3d', 'buildings-roofs', 'buildings-labels'].forEach(id => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis);
  });
}

export function updateTerrainVisibility(map, enabled) {
  try {
    map.setTerrain(enabled
      ? { source: 'nap-dem', exaggeration: 1.3 }
      : null);
  } catch (e) { /* */ }
}

export function flyTo(map, coords, zoom = 15) {
  map.flyTo({
    center: coords,
    zoom,
    pitch: 60,
    duration: 2000,
  });
}

export function takeScreenshot(map) {
  const canvas = map.getCanvas();
  const link = document.createElement('a');
  const now = new Date();
  const ts = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  link.download = `napmaps-madrid-${ts}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('📸 Captura guardada');
}
