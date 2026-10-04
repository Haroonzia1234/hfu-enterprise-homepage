import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { feature } from 'topojson-client';

async function generateMapData() {
  const atlasData = await readFile('node_modules/world-atlas/countries-50m.json', 'utf8');
  const topology = JSON.parse(atlasData);
  const countries = feature(topology, topology.objects.countries);

  const ukFeature = countries.features.find((featureItem) => {
    return featureItem.properties.name === 'United Kingdom';
  });
  const irelandFeature = countries.features.find((featureItem) => {
    return featureItem.properties.name === 'Ireland';
  });

  const minimumLongitude = -8.9;
  const maximumLongitude = 2.1;
  const minimumLatitude = 49.8;
  const maximumLatitude = 58.8;

  function projectCoordinates(latitude, longitude) {
    const latitudeRadians = (latitude * Math.PI) / 180;
    const longitudeRadians = (longitude * Math.PI) / 180;
    return {
      x: longitudeRadians,
      y: Math.log(Math.tan(Math.PI / 4 + latitudeRadians / 2)),
    };
  }

  const projectedMinimum = projectCoordinates(minimumLatitude, minimumLongitude);
  const projectedMaximum = projectCoordinates(maximumLatitude, maximumLongitude);

  const projectedMinimumX = projectedMinimum.x;
  const projectedMaximumX = projectedMaximum.x;
  const projectedMinimumY = projectedMinimum.y;
  const projectedMaximumY = projectedMaximum.y;

  const projectionWidth = projectedMaximumX - projectedMinimumX;
  const projectionHeight = projectedMaximumY - projectedMinimumY;

  const mapWidth = 640;
  const paddingAmount = 16;
  const projectionScale = (mapWidth - 2 * paddingAmount) / projectionWidth;
  const mapHeight = Math.round(projectionHeight * projectionScale + 2 * paddingAmount);

  function projectToViewBox(latitude, longitude) {
    const projectedPoint = projectCoordinates(latitude, longitude);
    const viewX = paddingAmount + (projectedPoint.x - projectedMinimumX) * projectionScale;
    const viewY =
      mapHeight - paddingAmount - (projectedPoint.y - projectedMinimumY) * projectionScale;
    return { x: viewX, y: viewY };
  }

  function pointLineDistance(point, lineStart, lineEnd) {
    const numerator = Math.abs(
      (lineEnd.y - lineStart.y) * point.x -
        (lineEnd.x - lineStart.x) * point.y +
        lineEnd.x * lineStart.y -
        lineEnd.y * lineStart.x
    );
    const denominator = Math.sqrt(
      Math.pow(lineEnd.y - lineStart.y, 2) + Math.pow(lineEnd.x - lineStart.x, 2)
    );
    if (denominator === 0) {
      return Math.sqrt(Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2));
    } else {
      return numerator / denominator;
    }
  }

  function ramerDouglasPeucker(points, epsilon) {
    if (points.length < 3) {
      return points;
    }
    let maximumDistance = 0;
    let maximumIndex = 0;
    const endIndex = points.length - 1;
    for (let pointIndex = 1; pointIndex < endIndex; pointIndex++) {
      const distance = pointLineDistance(points[pointIndex], points[0], points[endIndex]);
      if (distance > maximumDistance) {
        maximumIndex = pointIndex;
        maximumDistance = distance;
      }
    }
    if (maximumDistance > epsilon) {
      const recursiveResults1 = ramerDouglasPeucker(points.slice(0, maximumIndex + 1), epsilon);
      const recursiveResults2 = ramerDouglasPeucker(points.slice(maximumIndex), epsilon);
      return recursiveResults1.slice(0, -1).concat(recursiveResults2);
    } else {
      return [points[0], points[endIndex]];
    }
  }

  function polygonArea(points) {
    let computedArea = 0;
    for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
      const nextIndex = (pointIndex + 1) % points.length;
      computedArea += points[pointIndex].x * points[nextIndex].y;
      computedArea -= points[nextIndex].x * points[pointIndex].y;
    }
    return Math.abs(computedArea / 2);
  }

  function processFeature(featureData) {
    let pathString = '';
    let totalPointsCount = 0;
    let finalPointsCount = 0;

    const polygons =
      featureData.geometry.type === 'Polygon'
        ? [featureData.geometry.coordinates]
        : featureData.geometry.coordinates;

    for (const polygon of polygons) {
      for (const ring of polygon) {
        totalPointsCount += ring.length;

        let inFrame = false;
        for (const [longitude, latitude] of ring) {
          if (
            longitude >= minimumLongitude &&
            longitude <= maximumLongitude &&
            latitude >= minimumLatitude &&
            latitude <= maximumLatitude
          ) {
            inFrame = true;
            break;
          }
        }
        if (!inFrame) {
          continue;
        }

        const projectedRing = ring.map(([longitude, latitude]) => {
          return projectToViewBox(latitude, longitude);
        });
        const simplified = ramerDouglasPeucker(projectedRing, 0.45);

        if (simplified.length < 4 || polygonArea(simplified) < 3) {
          continue;
        }

        finalPointsCount += simplified.length;

        for (let pointIndex = 0; pointIndex < simplified.length; pointIndex++) {
          const point = simplified[pointIndex];
          const command = pointIndex === 0 ? 'M' : 'L';
          pathString += `${command}${point.x.toFixed(1)},${point.y.toFixed(1)}`;
        }
        pathString += 'Z';
      }
    }
    return { pathString, totalPointsCount, finalPointsCount };
  }

  const ukResult = processFeature(ukFeature);
  const irelandResult = processFeature(irelandFeature);

  const jsContent = `export const MAP_VIEWBOX = { width: ${mapWidth}, height: ${mapHeight} };
export const UK_OUTLINE_PATH = '${ukResult.pathString}';
export const IRELAND_OUTLINE_PATH = '${irelandResult.pathString}';
export function projectLatLon(latitude, longitude) {
  const latitudeRadians = latitude * Math.PI / 180;
  const longitudeRadians = longitude * Math.PI / 180;
  const projectedX = longitudeRadians;
  const projectedY = Math.log(Math.tan(Math.PI / 4 + latitudeRadians / 2));
  const projectedMinimumX = ${projectedMinimumX.toFixed(6)};
  const projectedMinimumY = ${projectedMinimumY.toFixed(6)};
  const projectionScale = ${projectionScale.toFixed(6)};
  const targetHeight = ${mapHeight};
  const targetPadding = ${paddingAmount};
  const x = targetPadding + (projectedX - projectedMinimumX) * projectionScale;
  const y = targetHeight - targetPadding - (projectedY - projectedMinimumY) * projectionScale;
  return { x, y };
}
`;

  await mkdir('js/data', { recursive: true });
  await writeFile('js/data/uk-map.js', jsContent, 'utf8');

  console.log('Map data generated.');
  console.log(`UK points: ${ukResult.totalPointsCount} -> ${ukResult.finalPointsCount}`);
  console.log(
    `Ireland points: ${irelandResult.totalPointsCount} -> ${irelandResult.finalPointsCount}`
  );
  console.log(`File size: ${jsContent.length} bytes`);
}

generateMapData().catch(console.error);
