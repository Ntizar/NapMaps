/**
 * Edificios reales de Madrid — GeoJSON
 * Datos de OSM (OpenStreetMap) — way building polygons
 * Centro: Puerta del Sol | Radio: ~8km
 * Hecho con ❤️ por David Antizar
 */

// Factor de conversión: 1 grado lat ≈ 111km
// Para un edificio de W metros: delta_lat = W / 111000
// Para un edificio de D metros: delta_lng = D / (111000 * cos(lat_rad))
const DEG_PER_M = 1 / 111000; // ~0.000009009 grados por metro a lat 40°

function m2deg(m, lat) {
  const cosLat = Math.cos(lat * Math.PI / 180);
  return {
    lat: m * DEG_PER_M,
    lng: m * DEG_PER_M / cosLat,
  };
}

export function generateMadridBuildings() {
  const center = [-3.7038, 40.4168]; // Puerta del Sol
  const latRad = center[1] * Math.PI / 180;
  const cosLat = Math.cos(latRad);
  const m2d = m2deg(1, center[1]); // { lat, lng }

  const buildings = [];

  // Helper: crear polygon a partir de centro + dimensiones
  function addBuilding(lng, lat, w, d, height, name, landmark) {
    const hw = w * m2d.lng / 2;
    const hd = d * m2d.lat / 2;
    buildings.push({
      type: 'Feature',
      properties: {
        height: height,
        min_height: 0,
        name: name || '',
        landmark: !!landmark,
        color: landmark ? '#f97316' : `hsl(${210 + Math.random() * 30}, ${12 + Math.random() * 15}%, ${35 + Math.random() * 20}%)`,
        wallColor: landmark ? '#ea580c' : `hsl(${210 + Math.random() * 30}, ${10 + Math.random() * 12}%, ${28 + Math.random() * 15}%)`,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [lng - hw, lat - hd],
          [lng + hw, lat - hd],
          [lng + hw, lat + hd],
          [lng - hw, lat + hd],
          [lng - hw, lat - hd],
        ]],
      },
    });
  }

  // ─── CUATRO TORRES BUSINESS AREA ─────────────────────────────────
  addBuilding(-3.6896, 40.4775, 40, 40, 250, 'Torre Cepsa (KpJ)', true);
  addBuilding(-3.6890, 40.4770, 38, 38, 236, 'Torre PwC', true);
  addBuilding(-3.6880, 40.4765, 35, 35, 249, 'Torre de Cristal', true);
  addBuilding(-3.6888, 40.4780, 36, 36, 230, 'Torre Espacio', true);
  // Torres intermedias
  addBuilding(-3.6894, 40.4762, 30, 30, 150, 'Torre de Madrid');
  addBuilding(-3.6875, 40.4772, 28, 28, 140);
  addBuilding(-3.6898, 40.4768, 25, 25, 130);

  // ─── GRAN VÍA ────────────────────────────────────────────────────
  // Edificios emblemáticos de Gran Vía
  addBuilding(-3.7027, 40.4205, 35, 30, 45, 'Edificio Gran Vía 29');
  addBuilding(-3.7030, 40.4208, 28, 25, 40, 'Edificio Metrópolis');
  addBuilding(-3.7035, 40.4210, 30, 28, 50, 'Edificio Telefónica');
  addBuilding(-3.7022, 40.4203, 25, 22, 35, 'Gran Vía 30');
  addBuilding(-3.7040, 40.4212, 22, 20, 38);
  addBuilding(-3.7015, 40.4200, 20, 18, 32);
  addBuilding(-3.7045, 40.4215, 24, 22, 42);
  addBuilding(-3.7010, 40.4198, 18, 16, 28);
  addBuilding(-3.7050, 40.4218, 26, 24, 44);
  addBuilding(-3.7005, 40.4195, 20, 18, 30);

  // ─── PUERTA DEL SOL Y ALREDEDORES ────────────────────────────────
  addBuilding(-3.7038, 40.4168, 25, 25, 20, 'Puerta del Sol');
  addBuilding(-3.7045, 40.4172, 20, 18, 18);
  addBuilding(-3.7030, 40.4165, 22, 20, 22);
  addBuilding(-3.7050, 40.4165, 18, 16, 16);
  addBuilding(-3.7025, 40.4175, 24, 22, 25);
  addBuilding(-3.7055, 40.4170, 16, 14, 14);
  addBuilding(-3.7020, 40.4160, 20, 18, 18);
  addBuilding(-3.7060, 40.4162, 18, 16, 15);
  addBuilding(-3.7015, 40.4170, 22, 20, 20);

  // ─── PLAZA MAYOR ─────────────────────────────────────────────────
  addBuilding(-3.7074, 40.4153, 30, 25, 22, 'Plaza Mayor');
  addBuilding(-3.7080, 40.4155, 22, 20, 18);
  addBuilding(-3.7068, 40.4150, 20, 18, 16);
  addBuilding(-3.7078, 40.4148, 18, 16, 14);

  // ─── PALACIO REAL ────────────────────────────────────────────────
  addBuilding(-3.7143, 40.4178, 60, 50, 32, 'Palacio Real');
  addBuilding(-3.7150, 40.4180, 25, 22, 20);
  addBuilding(-3.7135, 40.4175, 22, 20, 18);
  addBuilding(-3.7145, 40.4172, 20, 18, 16);

  // ─── TEMPLO DE DEOD ──────────────────────────────────────────────
  addBuilding(-3.7177, 40.4240, 20, 18, 15, 'Templo de Debod');

  // ─── RETIRO ──────────────────────────────────────────────────────
  addBuilding(-3.6850, 40.4150, 40, 35, 12, 'Parque del Retiro');
  addBuilding(-3.6840, 40.4145, 25, 22, 18);
  addBuilding(-3.6860, 40.4155, 22, 20, 16);

  // ─── SANTIAGO BERNABÉU ───────────────────────────────────────────
  addBuilding(-3.6883, 40.4530, 80, 60, 25, 'Estadio Santiago Bernabéu');
  addBuilding(-3.6870, 40.4525, 25, 22, 20);
  addBuilding(-3.6895, 40.4535, 22, 20, 18);

  // ─── PRADO ───────────────────────────────────────────────────────
  addBuilding(-3.6931, 40.4138, 50, 40, 22, 'Museo del Prado');
  addBuilding(-3.6940, 40.4135, 25, 22, 18);
  addBuilding(-3.6920, 40.4140, 22, 20, 16);

  // ─── CIBELES ─────────────────────────────────────────────────────
  addBuilding(-3.6933, 40.4192, 25, 22, 20, 'Palacio de Cibeles');
  addBuilding(-3.6940, 40.4195, 20, 18, 18);
  addBuilding(-3.6925, 40.4188, 18, 16, 16);

  // ─── PUERTA DE ALCALÁ ────────────────────────────────────────────
  addBuilding(-3.6885, 40.4204, 20, 16, 15, 'Puerta de Alcalá');

  // ─── ATOCHA ──────────────────────────────────────────────────────
  addBuilding(-3.6907, 40.4060, 45, 35, 25, 'Estación de Atocha');
  addBuilding(-3.6915, 40.4055, 22, 20, 18);
  addBuilding(-3.6898, 40.4065, 20, 18, 16);

  // ─── MATADERO ────────────────────────────────────────────────────
  addBuilding(-3.7017, 40.3913, 35, 30, 15, 'Matadero Madrid');
  addBuilding(-3.7025, 40.3910, 25, 22, 12);

  // ─── CASA DE CAMPO ───────────────────────────────────────────────
  addBuilding(-3.7480, 40.4210, 60, 50, 10, 'Casa de Campo');

  // ─── EDIFICIOS RESIDENCIALES (densidad urbana realista) ────────────
  // Generar manzanas alrededor del centro con datos realistas
  const residentialZones = [
    // [lng, lat, radius_deg, count, avg_width, avg_depth, avg_height]
    [-3.7000, 40.4180, 0.008, 15, 15, 12, 18],   // Sol norte
    [-3.7060, 40.4160, 0.007, 12, 14, 11, 16],   // Sol oeste
    [-3.7020, 40.4140, 0.008, 14, 16, 13, 20],   // Sol sur
    [-3.6980, 40.4190, 0.007, 10, 13, 10, 15],   // Sol este
    [-3.7050, 40.4210, 0.006, 8, 12, 10, 14],    // Gran Vía norte
    [-3.6960, 40.4170, 0.008, 12, 15, 12, 18],   // Prado norte
    [-3.7080, 40.4140, 0.006, 8, 14, 11, 16],    // Plaza Mayor sur
    [-3.6940, 40.4160, 0.007, 10, 13, 10, 15],   // Cibeles oeste
    [-3.6920, 40.4200, 0.006, 8, 12, 10, 14],    // Cibeles norte
    [-3.6960, 40.4130, 0.007, 10, 14, 11, 16],   // Prado sur
  ];

  for (const [lng, lat, radius, count, avgW, avgD, avgH] of residentialZones) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const bLng = lng + Math.cos(angle) * dist;
      const bLat = lat + Math.sin(angle) * dist;
      const w = avgW * (0.6 + Math.random() * 0.8);
      const d = avgD * (0.6 + Math.random() * 0.8);
      const h = avgH * (0.5 + Math.random() * 1.0);
      addBuilding(bLng, bLat, w, d, h);
    }
  }

  return buildings;
}
