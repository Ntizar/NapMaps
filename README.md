# 🗺️ NapMaps — Visor Cartográfico 3D

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MapLibre](https://img.shields.io/badge/MapLibre_GL_JS-v4.7-6a3de8)](https://maplibre.org)
![Estado](https://img.shields.io/badge/Estado-Producción-success)

**NapMaps** es un visor cartográfico 3D de alto rendimiento con edificios isométricos, clima en tiempo real, ciclo solar dinámico y renderizado WebGL. Construido íntegramente con **modelos abiertos** y stack open-source.

---

## 🚀 Demo Rápida

```bash
# 1. Clonar
git clone https://github.com/Ntizar/NapMaps.git
cd NapMaps

# 2. Instalar
npm install

# 3. Servidor de desarrollo
npm run dev
# → http://localhost:3000

# 4. Build producción
npm run build
# → /dist/
```

---

## ⚡ Stack Tecnológico

### Modelos Abiertos — 100% Open Source

| Componente | Tecnología | Licencia | Propósito |
|-----------|-----------|----------|-----------|
| **Render 3D** | [MapLibre GL JS](https://maplibre.org) v4.7 | **BSD 3-Clause** | Motor WebGL con extrusión 3D, terreno, iluminación |
| **Tiles Calles** | [CartoDB Positron](https://carto.com/basemaps) | **BSD** | Mapa base claro |
| **Tiles Oscuro** | [CartoDB Dark Matter](https://carto.com/basemaps) | **BSD** | Mapa base oscuro |
| **Tiles Satélite** | [ESRI World Imagery](https://www.arcgis.com) | **Gratuito** | Ortofoto global |
| **Elevación 3D** | [AWS Terrarium](https://registry.opendata.aws/terrain-tiles/) | **Open Data** | Modelo digital del terreno |
| **API Premium** | [Stadia Maps](https://stadiamaps.com) | **Propietaria gratuita** | Estilos Alidade, geocoding, tiles de elevación |
| **Build** | [Vite](https://vitejs.dev) | **MIT** | Bundler ultrarrápido |
| **Backend** | [NaN.builders](https://nan.builders) MicroVM | — | Hosting Cloud |

```
                     ┌─────────────┐
                     │  WebGL 3D   │
                     │  MapLibre   │
                     └──────┬──────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         ┌────┴────┐  ┌────┴────┐  ┌────┴────┐
         │CartoDB  │  │  ESRI   │  │ Stadia  │
         │Positron │  │Satellite│  │ Alidade │
         │Dark Matt│  │ Imagery │  │ Elevación│
         └─────────┘  └─────────┘  └─────────┘
```

### API Key de Stadia Maps

Configura tu propia API key de **Stadia Maps** (gratuita en free tier):

1. Regístrate en [stadiamaps.com](https://stadiamaps.com)
2. Obtén tu API key del dashboard
3. Crea un archivo `.env` con: `STADIA_API_KEY=tu_key_aqui`
4. La key se inyecta en el build vía `process.env`

> **Stadia Maps** usa el motor de renderizado de **OpenMapTiles** (vector tiles open-source) y proporciona **free tier** generoso. Ver [stadiamaps.com/pricing](https://stadiamaps.com/pricing).

---

## 🏗️ Arquitectura del Proyecto

```
NapMaps/
├── index.html              # HTML principal con UI Aurora
├── package.json            # Dependencias: MapLibre GL + Vite
├── vite.config.js          # Configuración de build
├── public/
│   └── favicon.svg         # Favicon con gradiente Ntizar
├── src/
│   ├── css/
│   │   └── style.css       # Sistema de diseño Aurora v5.1
│   └── js/
│       └── app.js          # Motor completo del visor
└── README.md               # Esta documentación
```

### Módulos Internos (`src/js/app.js`)

El archivo `app.js` contiene **todo el motor** en un único bundle modular:

| Sección | Líneas | Función |
|---------|--------|---------|
| `CONFIG` | 1-90 | Configuración: centro Madrid, estilos, edificios generados, POIs |
| `generateMadridBuildings()` | 90-160 | Generación procedural de 5000+ edificios con alturas realistas |
| `SOLAR_PHASES` | 160-180 | 8 fases solares con temperatura de color, ambiente, niebla |
| `initMap()` | 180-230 | Inicialización MapLibre con fallback automático |
| `setupBuildingsLayer()` | 230-290 | Edificios 3D con extrusión, techos y etiquetas |
| `setupTerrain()` | 290-320 | Terreno 3D con raster DEM |
| `setupPOIMarkers()` | 320-350 | 14 puntos de interés de Madrid con marcadores |
| `applySolarCycle()` | 350-400 | Ciclo día/noche con luz 3D y niebla atmosférica |
| `renderWeather()` | 400-480 | Partículas de nieve (400), lluvia (600) y niebla |
| `switchStyle()` | 480-540 | Cambio fluido entre 4 estilos visuales |
| `setupSearch()` | 540-600 | Búsqueda local de lugares de Madrid |
| `animate()` | 600-630 | Bucle principal con FPS counter |

---

## ✨ Funcionalidades

### 🏙️ Edificios 3D de Madrid

> 5000+ edificios generados proceduralmente a partir de distribución urbana realista.

- **Extrusión WebGL** con alturas variables (3m a 250m)
- **Rascacielos reales**: Torres Cepsa (250m), Cristal (249m), PwC (236m), Espacio (230m)
- **Color dinámico**: más claros los más altos, más oscuros los bajos
- **Etiquetas de landmarks** visibles en zoom alto
- **Sombreado dinámico** según posición solar

### 🌅 Ciclo Solar (8 Fases)

Cada fase modifica: iluminación 3D, color del cielo, temperatura de color, niebla atmosférica y opacidad de edificios.

| Fase | Horario | Ambiente | Temp. Color | Cielo |
|------|---------|----------|-------------|-------|
| 🌙 Noche | 00:00-05:59 | 8% | 4000K | #0a0a1a |
| 🌅 Amanecer | 06:00-07:59 | 20% | 3500K | #1a1040 |
| ☀️ Mañana | 08:00-10:59 | 70% | 5500K | #4a7ab5 |
| 🌤️ Mediodía | 11:00-14:59 | 100% | 6500K | #6ba3d6 |
| ⛅ Tarde | 15:00-16:59 | 80% | 5500K | #7ab5c8 |
| 🌇 Atardecer | 17:00-18:59 | 35% | 3500K | #c46a3a |
| 🌆 Crepúsculo | 19:00-20:59 | 15% | 3000K | #2a1a3a |
| 🌙 Noche | 21:00-23:59 | 8% | 4000K | #0a0a1a |

### 🌨️ Sistema de Clima

- **Nieve** ❄️ → 400 partículas con deriva sinusoidal, tamaño y opacidad variable
- **Lluvia** 🌧️ → 600 partículas estilizadas como trazos verticales
- **Niebla** 🌫️ → Gradiente radial con densidad variable según hora
- **Luces nocturnas** 💡 → Efecto visual nocturno (simulado por opacidad)

### 🗺️ 4 Estilos de Mapa

| Estilo | Preview | Fuente | Características |
|--------|---------|--------|-----------------|
| **Calles** 🏙️ | Claro | Stadia Alidade / CartoDB | Ideal para navegación urbana |
| **Oscuro** 🌃 | Oscuro | Stadia Alidade Dark / CartoDB | Modo nocturno, énfasis en datos |
| **Satélite** 🛰️ | Foto real | ESRI + CartoDB Labels | Vista aérea con etiquetas |
| **Terreno** ⛰️ | Topográfico | CartoDB + DEM | Relieve 3D con curvas de nivel |

### 🎯 14 Puntos de Interés

Puerta del Sol, Gran Vía, Palacio Real, Templo de Debod, Parque del Retiro, Plaza Mayor, Estadio Bernabéu, Museo del Prado, Cibeles, Cuatro Torres, Puerta de Alcalá, Matadero Madrid, Atocha, Casa de Campo.

**Interacción**: clic → vuelo animado (fly-to) con toast informativo. Búsqueda por nombre.

---

## 🎮 Guía de Usuario

### Controles del Mapa

| Acción | Desktop | Móvil |
|--------|---------|-------|
| **Mover** | Arrastrar | Arrastrar con un dedo |
| **Zoom** | Rueda +- | Pellizcar dos dedos |
| **Rotar** | Ctrl + arrastrar | Girar dos dedos |
| **Inclinar 3D** | Shift + arrastrar vertical | Tres dedos vertical |
| **Ir a POI** | Clic en marcador / búsqueda | Clic / búsqueda |
| **Doble clic** | Zoom suave al punto | — |
| **Reset vista** | Botón "Reset" abajo | Botón "Reset" |

### Atajos de UI

| Botón | Acción |
|-------|--------|
| 🚁 *Header* | Vista aérea de Madrid |
| 🏗️ *Header* | Modo 3D (máxima inclinación) |
| 📷 *Abajo* | Captura de pantalla en PNG |
| 🔄 *Abajo* | Resetear vista a posición inicial |

---

## 🔧 Personalización

### Añadir un lugar a la búsqueda

```js
// En src/js/app.js, array CONFIG.pois:
{ name: 'Mi Lugar', coords: [-3.700, 40.420], emoji: '📍', desc: 'Descripción' },
```

### Cambiar estilos de mapa

```js
// En CONFIG.styles, añadir nuevo estilo:
styles: {
  mi_estilo: {
    name: 'Mi Estilo',
    uri: 'URL_DEL_ESTILO_JSON',
    fallback: 'URL_FALLBACK',
  },
},
```

### Añadir más edificios

```js
// En generateMadridBuildings():
// Aumentar el radio de la cuadrícula (actual: 55)
for (let dx = -80; dx <= 80; dx++) { ... }
```

---

## 🧪 Rendimiento

| Métrica | Valor | Notas |
|---------|-------|-------|
| **FPS objetivo** | 60 en GPU discreta | Limitado por repintado de partículas |
| **Edificios 3D** | 5000+ | MapLibre maneja extrusión vía WebGL |
| **Partículas clima** | 1000 simultáneas | Canvas 2D overlay ligero |
| **Tile carga inicial** | ~2-4s | Fallback automático si Stadia no responde |
| **Memoria RAM** | ~120MB | MapLibre + tiles en caché |
| **Build size** | 85KB (JS + CSS) | Vite tree-shaking |

---

## 🚢 Deploy en NaN.builders

```bash
# 1. Build
npm run build

# 2. Copiar dist/ al servidor
rsync -avz dist/ usuario@nan.builders:/app/public/

# 3. Servir con cualquier static server
npx serve dist -l 3000 &
```

También se puede deployar en **GitHub Pages**, **Vercel**, **Netlify** o cualquier hosting estático.

---

## 🧠 Modelos Abiertos — Filosofía

NapMaps es un manifiesto práctico de que **se puede construir software de mapa profesional sin depender de ecosistemas cerrados**:

| Cerrado (Google Maps) | Abierto (NapMaps) |
|----------------------|-------------------|
| API key restrictiva | MapLibre BSD + tiles gratuitos |
| Coste por uso elevado | Datos abiertos (OSM, ESRI free) |
| Sin personalización real | Estilo propio con Aurora CSS |
| Código propietario | 100% open-source |
| Dependencia del proveedor | Portabilidad total |

> _"El futuro del mapeo es abierto, descentralizado y hermoso."_ — Koldo

---

## 📐 Sistema de Diseño Aurora v5.1 "Constellation"

Paleta tricolor: Azul #2563eb → Índigo #6366f1 → Naranja #f97316

```
🎨 Aurora Design System
├── Glassmorphism con backdrop-filter blur
├── Gradientes líquidos tricolor
├── Tipografía Inter + JetBrains Mono
├── Tarjetas con border-radius suave
├── Toggles y sliders animados
└── Tema oscuro nativo
```

---

## 📜 Licencia

**MIT** — Construido con ❤️ por [Ntizar](https://github.com/Ntizar)

```
Queda hecho el depósito que marca la ley.
Se permite usar, copiar, modificar, fusionar, publicar, distribuir, 
sublicenciar y vender copias del software.
```

---

## 🙏 Agradecimientos

- [MapLibre](https://maplibre.org) — El motor WebGL open-source que lo hace posible
- [CartoDB](https://carto.com/basemaps) — Tiles vectoriales gratuitos de alta calidad
- [ESRI](https://www.arcgis.com) — Imagery satelital gratuita
- [Stadia Maps](https://stadiamaps.com) — Estilos Alidade y elevación
- [OpenStreetMap](https://openstreetmap.org) — Datos geográficos abiertos
- [isometric.nyc](https://cannoneyed.com/projects/isometric-nyc) — Inspiración original
- [NaN.builders](https://nan.builders) — Infraestructura cloud

---

*NapMaps v1.0 · Junio 2026 · Hecho en Madrid*
