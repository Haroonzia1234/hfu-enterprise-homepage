import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { feature } from 'topojson-client';

async function generate() {
  const atlasData = await readFile('node_modules/world-atlas/countries-50m.json', 'utf8');
  const topology = JSON.parse(atlasData);
  const countries = feature(topology, topology.objects.countries);

  const ukFeature = countries.features.find((f) => f.properties.name === 'United Kingdom');
  const irelandFeature = countries.features.find((f) => f.properties.name === 'Ireland');

  const minLon = -8.9;
  const maxLon = 2.1;
  const minLat = 49.8;
  const maxLat = 58.8;

  function project(lat, lon) {
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;
    return {
      x: lonRad,
      y: Math.log(Math.tan(Math.PI / 4 + latRad / 2)),
    };
  }

  const pMin = project(minLat, minLon);
  const pMax = project(maxLat, maxLon);

  const projMinX = pMin.x;
  const projMaxX = pMax.x;
  const projMinY = pMin.y;
  const projMaxY = pMax.y;

  const projWidth = projMaxX - projMinX;
  const projHeight = projMaxY - projMinY;

  const mapWidth = 640;
  const padding = 16;
  const scale = (mapWidth - 2 * padding) / projWidth;
  const mapHeight = Math.round(projHeight * scale + 2 * padding);

  function projectToViewBox(lat, lon) {
    const p = project(lat, lon);
    const x = padding + (p.x - projMinX) * scale;
    const y = mapHeight - padding - (p.y - projMinY) * scale;
    return { x, y };
  }

  function pointLineDistance(p, a, b) {
    const num = Math.abs((b.y - a.y) * p.x - (b.x - a.x) * p.y + b.x * a.y - b.y * a.x);
    const den = Math.sqrt(Math.pow(b.y - a.y, 2) + Math.pow(b.x - a.x, 2));
    return den === 0 ? Math.sqrt(Math.pow(p.x - a.x, 2) + Math.pow(p.y - a.y, 2)) : num / den;
  }

  function rdp(points, epsilon) {
    if (points.length < 3) {
      return points;
    }
    let dmax = 0;
    let index = 0;
    const end = points.length - 1;
    for (let i = 1; i < end; i++) {
      const d = pointLineDistance(points[i], points[0], points[end]);
      if (d > dmax) {
        index = i;
        dmax = d;
      }
    }
    if (dmax > epsilon) {
      const recResults1 = rdp(points.slice(0, index + 1), epsilon);
      const recResults2 = rdp(points.slice(index), epsilon);
      return recResults1.slice(0, -1).concat(recResults2);
    } else {
      return [points[0], points[end]];
    }
  }

  function polygonArea(points) {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area / 2);
  }

  function processFeature(feat) {
    let pathString = '';
    let totalPoints = 0;
    let finalPoints = 0;

    const polygons =
      feat.geometry.type === 'Polygon' ? [feat.geometry.coordinates] : feat.geometry.coordinates;

    for (const polygon of polygons) {
      for (const ring of polygon) {
        totalPoints += ring.length;

        let inFrame = false;
        for (const [lon, lat] of ring) {
          if (lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat) {
            inFrame = true;
            break;
          }
        }
        if (!inFrame) {
          continue;
        }

        const projectedRing = ring.map(([lon, lat]) => projectToViewBox(lat, lon));
        const simplified = rdp(projectedRing, 0.45);

        if (simplified.length < 4 || polygonArea(simplified) < 3) {
          continue;
        }

        finalPoints += simplified.length;

        for (let i = 0; i < simplified.length; i++) {
          const pt = simplified[i];
          const cmd = i === 0 ? 'M' : 'L';
          pathString += `${cmd}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
        }
        pathString += 'Z';
      }
    }
    return { pathString, totalPoints, finalPoints };
  }

  const ukRes = processFeature(ukFeature);
  const irelandRes = processFeature(irelandFeature);

  const jsContent = `export const MAP_VIEWBOX = { width: ${mapWidth}, height: ${mapHeight} };
export const UK_OUTLINE_PATH = '${ukRes.pathString}';
export const IRELAND_OUTLINE_PATH = '${irelandRes.pathString}';
export function projectLatLon(latitude, longitude) {
  const latRad = latitude * Math.PI / 180;
  const lonRad = longitude * Math.PI / 180;
  const projX = lonRad;
  const projY = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const projMinX = ${projMinX.toFixed(6)};
  const projMinY = ${projMinY.toFixed(6)};
  const scale = ${scale.toFixed(6)};
  const mapHeight = ${mapHeight};
  const padding = ${padding};
  const x = padding + (projX - projMinX) * scale;
  const y = mapHeight - padding - (projY - projMinY) * scale;
  return { x, y };
}
`;

  await mkdir('js/data', { recursive: true });
  await writeFile('js/data/uk-map.js', jsContent, 'utf8');

  console.log(`Map data generated.`);
  console.log(`UK points: ${ukRes.totalPoints} -> ${ukRes.finalPoints}`);
  console.log(`Ireland points: ${irelandRes.totalPoints} -> ${irelandRes.finalPoints}`);
  console.log(`File size: ${jsContent.length} bytes`);
}

generate().catch(console.error);
