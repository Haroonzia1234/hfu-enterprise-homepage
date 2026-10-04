import { getVehicle } from '../data/fleet.js';

export const VEHICLE_VIEWBOX = { width: 800, height: 280 };

const GROUND_Y = 232;
const RIGHT_ANCHOR = 760;
const BODY_LENGTH_SCALE = 0.62;
const BODY_HEIGHT_SCALE = 0.58;

const WHEEL_RADIUS_VAN = 26;
const WHEEL_RADIUS_T75 = 31;
const WHEEL_RADIUS_LARGE = 34;

const TYRE_COLOUR = '#0b1324';
const HUB_COLOUR = '#c5cddb';
const CENTRE_CAP_COLOUR = '#2b3b5e';
const BODY_COLOUR = '#ffffff';
const BODY_SHADE_COLOUR = '#e6eaf2';
const ROOF_HIGHLIGHT_COLOUR = '#f7f9fc';
const GLASS_COLOUR = '#9cc9e8';
const INDICATOR_COLOUR = '#f5a623';
const TAIL_LIGHT_COLOUR = '#d23b3b';
const BUMPER_COLOUR = '#2b3b5e';
const CHEVRON_BLUE = '#2781BA';
const CHEVRON_PLUM = '#A2356E';
const SHADOW_COLOUR = 'rgb(0 0 0 / 0.28)';

const VAN_CAB_WIDTH = 70;
const VAN_BONNET_LENGTH = 38;
const VAN_WINDSCREEN_DEPTH = 28;

const LUTON_CAB_WIDTH = 80;

const RIGID_CAB_WIDTH = 72;
const CHASSIS_HEIGHT = 10;

function getWheelRadius(vehicleData) {
  if (vehicleData.kind === 'van' || vehicleData.kind === 'luton') {
    return WHEEL_RADIUS_VAN;
  }
  if (vehicleData.id === 't75') {
    return WHEEL_RADIUS_T75;
  }
  return WHEEL_RADIUS_LARGE;
}

function buildWheel(centreX, centreY, radius) {
  const hubRadius = radius * 0.55;
  const capRadius = radius * 0.22;
  return [
    `<circle cx="${centreX}" cy="${centreY}" r="${radius}" fill="${TYRE_COLOUR}"/>`,
    `<circle cx="${centreX}" cy="${centreY}" r="${hubRadius}" fill="${HUB_COLOUR}"/>`,
    `<circle cx="${centreX}" cy="${centreY}" r="${capRadius}" fill="${CENTRE_CAP_COLOUR}"/>`,
  ].join('');
}

function buildWheelArch(centreX, groundY, radius, archColour) {
  const archRadius = radius + 6;
  const archLeft = centreX - archRadius;
  const archRight = centreX + archRadius;
  return `<path d="M${archLeft},${groundY} A${archRadius},${archRadius} 0 0 1 ${archRight},${groundY} L${archLeft},${groundY} Z" fill="${archColour}"/>`;
}

function buildShadowFilter(idPrefix) {
  return [
    `<filter id="${idPrefix}shadow" x="-50%" y="-50%" width="200%" height="200%">`,
    `<feGaussianBlur in="SourceGraphic" stdDeviation="6"/>`,
    `</filter>`,
  ].join('');
}

function buildContactShadow(vehicleLeftX, vehicleRightX, idPrefix) {
  const centreX = (vehicleLeftX + vehicleRightX) / 2;
  const radiusX = (vehicleRightX - vehicleLeftX) * 0.44;
  return `<ellipse cx="${centreX}" cy="${GROUND_Y + 4}" rx="${radiusX}" ry="5" fill="${SHADOW_COLOUR}" filter="url(#${idPrefix}shadow)"/>`;
}

function buildChevronLivery(boxLeftX, boxRightX, boxTopY, boxBottomY, idPrefix) {
  const boxHeight = boxBottomY - boxTopY;
  const chevronHeight = boxHeight * 0.65;
  const chevronScale = chevronHeight / 290;
  const chevronWidth = 297 * chevronScale;

  const boxWidth = boxRightX - boxLeftX;
  const chevronX = boxRightX - boxWidth * 0.33 - chevronWidth * 0.5;
  const chevronY = boxTopY + (boxHeight - chevronHeight) * 0.5;

  const clipId = `${idPrefix}chevron-clip`;
  return [
    `<defs>`,
    `<clipPath id="${clipId}">`,
    `<rect x="${boxLeftX}" y="${boxTopY}" width="${boxWidth}" height="${boxHeight}"/>`,
    `</clipPath>`,
    `</defs>`,
    `<g clip-path="url(#${clipId})">`,
    `<g transform="translate(${chevronX},${chevronY}) scale(${chevronScale.toFixed(5)})">`,
    `<polygon points="0,0 170,0 297,145 115,145" fill="${CHEVRON_BLUE}" opacity="0.85"/>`,
    `<polygon points="115,145 297,145 170,290 0,290" fill="${CHEVRON_PLUM}" opacity="0.85"/>`,
    `</g>`,
    `</g>`,
  ].join('');
}

function buildStripe(leftX, rightX, bottomY) {
  const blueStripeY = bottomY - 8;
  const plumStripeY = bottomY - 4;
  return [
    `<rect x="${leftX}" y="${blueStripeY}" width="${rightX - leftX}" height="4" fill="${CHEVRON_BLUE}"/>`,
    `<rect x="${leftX}" y="${plumStripeY}" width="${rightX - leftX}" height="4" fill="${CHEVRON_PLUM}"/>`,
  ].join('');
}

function buildGlassReflection(glassX, glassY, glassWidth, glassHeight, idPrefix) {
  const clipId = `${idPrefix}glass-clip`;
  const stripeWidth = glassWidth * 0.25;
  const stripeOffset = glassWidth * 0.35;
  return [
    `<defs>`,
    `<clipPath id="${clipId}">`,
    `<rect x="${glassX}" y="${glassY}" width="${glassWidth}" height="${glassHeight}" rx="3"/>`,
    `</clipPath>`,
    `</defs>`,
    `<g clip-path="url(#${clipId})">`,
    `<rect x="${glassX}" y="${glassY}" width="${glassWidth}" height="${glassHeight}" fill="${GLASS_COLOUR}" rx="3"/>`,
    `<rect x="${glassX + stripeOffset}" y="${glassY - 4}" width="${stripeWidth}" height="${glassHeight + 8}" fill="${BODY_COLOUR}" opacity="0.3" transform="skewX(-15)"/>`,
    `</g>`,
  ].join('');
}

function buildVan(vehicleData, idPrefix) {
  const wheelRadius = getWheelRadius(vehicleData);
  const bodyLength = vehicleData.lengthCm * BODY_LENGTH_SCALE;
  const bodyHeight = vehicleData.heightCm * BODY_HEIGHT_SCALE;

  const cabWidth = VAN_CAB_WIDTH;
  const totalLength = bodyLength + cabWidth + VAN_BONNET_LENGTH;

  const cabRightX = RIGHT_ANCHOR;
  const vehicleLeftX = cabRightX - totalLength;
  const bodyLeftX = vehicleLeftX;
  const bodyRightX = bodyLeftX + bodyLength;

  const wheelCentreY = GROUND_Y - wheelRadius;
  const bodyBottomY = GROUND_Y - wheelRadius * 0.4;

  const cabHeight = bodyHeight * 0.78;
  const roofY = bodyBottomY - bodyHeight;
  const cabRoofY = bodyBottomY - cabHeight;

  const rearWheelX = bodyLeftX + wheelRadius + 14;
  const frontWheelX = cabRightX - VAN_BONNET_LENGTH - wheelRadius - 8;

  const bonnetTipX = cabRightX;
  const bonnetY = bodyBottomY - cabHeight * 0.35;
  const windscreenTopX = cabRightX - VAN_BONNET_LENGTH;

  const archDarken = '#d9dee8';

  const bodyParts = [];

  bodyParts.push(buildShadowFilter(idPrefix));
  bodyParts.push(buildContactShadow(vehicleLeftX, cabRightX, idPrefix));

  const bumperHeight = 8;
  const bumperY = bodyBottomY - bumperHeight;
  bodyParts.push(
    `<rect x="${bonnetTipX - 6}" y="${bumperY}" width="6" height="${bumperHeight + (GROUND_Y - bodyBottomY)}" rx="2" fill="${BUMPER_COLOUR}"/>`
  );
  bodyParts.push(
    `<rect x="${bodyLeftX - 3}" y="${bumperY}" width="5" height="${bumperHeight + (GROUND_Y - bodyBottomY)}" rx="2" fill="${BUMPER_COLOUR}"/>`
  );

  const bodyPath = [
    `M${bodyLeftX},${roofY}`,
    `L${bodyRightX},${roofY}`,
    `L${bodyRightX},${cabRoofY}`,
    `L${windscreenTopX},${cabRoofY}`,
    `L${bonnetTipX},${bonnetY}`,
    `L${bonnetTipX},${bodyBottomY}`,
    `L${bodyLeftX},${bodyBottomY}`,
    `Z`,
  ].join(' ');
  bodyParts.push(`<path d="${bodyPath}" fill="${BODY_COLOUR}"/>`);

  const shadeTopY = bodyBottomY - bodyHeight * 0.33;
  bodyParts.push(
    `<rect x="${bodyLeftX}" y="${shadeTopY}" width="${bodyRightX - bodyLeftX}" height="${bodyBottomY - shadeTopY}" fill="${BODY_SHADE_COLOUR}"/>`
  );

  bodyParts.push(
    `<rect x="${bodyLeftX}" y="${roofY}" width="${bodyRightX - bodyLeftX}" height="${bodyHeight * 0.12}" fill="${ROOF_HIGHLIGHT_COLOUR}"/>`
  );

  const cabShadeTopY = bodyBottomY - cabHeight * 0.33;
  const cabShadeClipId = `${idPrefix}cab-shade-clip`;
  const cabShapePath = [
    `M${bodyRightX},${cabRoofY}`,
    `L${windscreenTopX},${cabRoofY}`,
    `L${bonnetTipX},${bonnetY}`,
    `L${bonnetTipX},${bodyBottomY}`,
    `L${bodyRightX},${bodyBottomY}`,
    `Z`,
  ].join(' ');
  bodyParts.push(
    `<defs><clipPath id="${cabShadeClipId}"><path d="${cabShapePath}"/></clipPath></defs>`
  );
  bodyParts.push(
    `<rect x="${bodyRightX}" y="${cabShadeTopY}" width="${cabWidth + VAN_BONNET_LENGTH}" height="${bodyBottomY - cabShadeTopY}" fill="${BODY_SHADE_COLOUR}" clip-path="url(#${cabShadeClipId})"/>`
  );

  const seamX = bodyRightX - 4;
  bodyParts.push(
    `<line x1="${seamX}" y1="${roofY + 8}" x2="${seamX}" y2="${bodyBottomY - 8}" stroke="${BODY_SHADE_COLOUR}" stroke-width="1.5"/>`
  );

  const doorSeamX = bodyLeftX + bodyLength * 0.55;
  bodyParts.push(
    `<line x1="${doorSeamX}" y1="${roofY + 8}" x2="${doorSeamX}" y2="${bodyBottomY - 8}" stroke="${BODY_SHADE_COLOUR}" stroke-width="1.5"/>`
  );

  const glassX = windscreenTopX + 3;
  const glassY = cabRoofY + 5;
  const glassWidth = cabWidth - VAN_WINDSCREEN_DEPTH * 0.3 - 8;
  const glassHeight = cabHeight * 0.42;
  bodyParts.push(buildGlassReflection(glassX, glassY, glassWidth, glassHeight, idPrefix));

  const windscreenGlassWidth = VAN_WINDSCREEN_DEPTH * 0.65;
  const wsLeftX = windscreenTopX - 2;
  const wsTopY = cabRoofY + 5;
  const wsBottomY = bonnetY - 4;
  const wsPath = [
    `M${wsLeftX},${wsTopY}`,
    `L${wsLeftX + windscreenGlassWidth},${wsTopY}`,
    `L${wsLeftX + windscreenGlassWidth + (wsBottomY - wsTopY) * 0.15},${wsBottomY}`,
    `L${wsLeftX},${wsBottomY}`,
    `Z`,
  ].join(' ');
  bodyParts.push(`<path d="${wsPath}" fill="${GLASS_COLOUR}" opacity="0.85"/>`);

  bodyParts.push(buildChevronLivery(bodyLeftX, bodyRightX - 8, roofY, bodyBottomY, idPrefix));
  bodyParts.push(buildStripe(bodyLeftX, bonnetTipX, bodyBottomY));

  bodyParts.push(buildWheelArch(rearWheelX, bodyBottomY, wheelRadius, archDarken));
  bodyParts.push(buildWheelArch(frontWheelX, bodyBottomY, wheelRadius, archDarken));

  bodyParts.push(buildWheel(rearWheelX, wheelCentreY, wheelRadius));
  bodyParts.push(buildWheel(frontWheelX, wheelCentreY, wheelRadius));

  bodyParts.push(
    `<rect x="${bonnetTipX - 3}" y="${bonnetY - 3}" width="4" height="8" rx="1.5" fill="${INDICATOR_COLOUR}"/>`
  );
  bodyParts.push(
    `<rect x="${bodyLeftX - 2}" y="${bodyBottomY - 18}" width="4" height="12" rx="1.5" fill="${TAIL_LIGHT_COLOUR}"/>`
  );

  return bodyParts.join('');
}

function buildLuton(vehicleData, idPrefix) {
  const wheelRadius = getWheelRadius(vehicleData);
  const bodyLength = vehicleData.lengthCm * BODY_LENGTH_SCALE;
  const bodyHeight = vehicleData.heightCm * BODY_HEIGHT_SCALE;

  const cabWidth = LUTON_CAB_WIDTH;
  const totalLength = bodyLength + cabWidth + 20;

  const cabRightX = RIGHT_ANCHOR;
  const vehicleLeftX = cabRightX - totalLength;
  const boxLeftX = vehicleLeftX;
  const boxRightX = boxLeftX + bodyLength;

  const wheelCentreY = GROUND_Y - wheelRadius;
  const bodyBottomY = GROUND_Y - wheelRadius * 0.4;

  const cabHeight = bodyHeight * 0.72;
  const boxTopY = bodyBottomY - bodyHeight;
  const cabRoofY = bodyBottomY - cabHeight;
  const lutonPeakY = boxTopY - 6;

  const rearWheelX = boxLeftX + wheelRadius + 14;
  const frontWheelX = cabRightX - wheelRadius - 18;

  const bonnetTipX = cabRightX;
  const bonnetY = bodyBottomY - cabHeight * 0.4;
  const windscreenTopX = cabRightX - 20;

  const archDarken = '#d9dee8';

  const parts = [];

  parts.push(buildShadowFilter(idPrefix));
  parts.push(buildContactShadow(vehicleLeftX, cabRightX, idPrefix));

  parts.push(
    `<rect x="${bonnetTipX - 5}" y="${bonnetY}" width="5" height="${GROUND_Y - bonnetY}" rx="2" fill="${BUMPER_COLOUR}"/>`
  );
  parts.push(
    `<rect x="${boxLeftX - 3}" y="${bodyBottomY - 8}" width="5" height="${GROUND_Y - bodyBottomY + 8}" rx="2" fill="${BUMPER_COLOUR}"/>`
  );

  const boxPath = [
    `M${boxLeftX},${boxTopY}`,
    `L${boxRightX},${boxTopY}`,
    `L${boxRightX + 12},${lutonPeakY}`,
    `L${boxRightX + 12},${cabRoofY}`,
    `L${boxRightX},${cabRoofY}`,
    `L${boxRightX},${bodyBottomY}`,
    `L${boxLeftX},${bodyBottomY}`,
    `Z`,
  ].join(' ');
  parts.push(`<path d="${boxPath}" fill="${BODY_COLOUR}"/>`);

  const cabPath = [
    `M${boxRightX},${cabRoofY}`,
    `L${windscreenTopX},${cabRoofY}`,
    `L${bonnetTipX},${bonnetY}`,
    `L${bonnetTipX},${bodyBottomY}`,
    `L${boxRightX},${bodyBottomY}`,
    `Z`,
  ].join(' ');
  parts.push(`<path d="${cabPath}" fill="${BODY_COLOUR}"/>`);

  const shadeTopY = bodyBottomY - bodyHeight * 0.33;
  parts.push(
    `<rect x="${boxLeftX}" y="${shadeTopY}" width="${bodyLength}" height="${bodyBottomY - shadeTopY}" fill="${BODY_SHADE_COLOUR}"/>`
  );

  parts.push(
    `<rect x="${boxLeftX}" y="${boxTopY}" width="${bodyLength}" height="${bodyHeight * 0.1}" fill="${ROOF_HIGHLIGHT_COLOUR}"/>`
  );

  const cabShadeTopY = bodyBottomY - cabHeight * 0.33;
  const cabShadeClipId = `${idPrefix}luton-cab-clip`;
  parts.push(`<defs><clipPath id="${cabShadeClipId}"><path d="${cabPath}"/></clipPath></defs>`);
  parts.push(
    `<rect x="${boxRightX}" y="${cabShadeTopY}" width="${cabWidth + 20}" height="${bodyBottomY - cabShadeTopY}" fill="${BODY_SHADE_COLOUR}" clip-path="url(#${cabShadeClipId})"/>`
  );

  const rollerDoorX = boxLeftX + 4;
  const rollerDoorTopY = boxTopY + 6;
  const rollerDoorWidth = 3;
  parts.push(
    `<rect x="${rollerDoorX}" y="${rollerDoorTopY}" width="${rollerDoorWidth}" height="${bodyBottomY - rollerDoorTopY - 4}" fill="${BODY_SHADE_COLOUR}" rx="1"/>`
  );

  const glassX = boxRightX + 6;
  const glassY = cabRoofY + 5;
  const glassWidth = cabWidth - 24;
  const glassHeight = cabHeight * 0.42;
  parts.push(buildGlassReflection(glassX, glassY, glassWidth, glassHeight, idPrefix));

  parts.push(buildChevronLivery(boxLeftX, boxRightX, boxTopY, bodyBottomY, idPrefix));
  parts.push(buildStripe(boxLeftX, boxRightX, bodyBottomY));

  parts.push(buildWheelArch(rearWheelX, bodyBottomY, wheelRadius, archDarken));
  parts.push(buildWheelArch(frontWheelX, bodyBottomY, wheelRadius, archDarken));

  parts.push(buildWheel(rearWheelX, wheelCentreY, wheelRadius));
  parts.push(buildWheel(frontWheelX, wheelCentreY, wheelRadius));

  parts.push(
    `<rect x="${bonnetTipX - 3}" y="${bonnetY - 3}" width="4" height="8" rx="1.5" fill="${INDICATOR_COLOUR}"/>`
  );
  parts.push(
    `<rect x="${boxLeftX - 2}" y="${bodyBottomY - 18}" width="4" height="12" rx="1.5" fill="${TAIL_LIGHT_COLOUR}"/>`
  );

  return parts.join('');
}

function buildRigid(vehicleData, idPrefix) {
  const wheelRadius = getWheelRadius(vehicleData);
  const bodyLength = vehicleData.lengthCm * BODY_LENGTH_SCALE;
  const bodyHeight = vehicleData.heightCm * BODY_HEIGHT_SCALE;

  const cabWidth = RIGID_CAB_WIDTH;
  const chassisGap = 14;
  const totalLength = bodyLength + chassisGap + cabWidth;

  const cabRightX = RIGHT_ANCHOR;
  const vehicleLeftX = cabRightX - totalLength;
  const boxLeftX = vehicleLeftX;
  const boxRightX = boxLeftX + bodyLength;

  const wheelCentreY = GROUND_Y - wheelRadius;
  const chassisBottomY = GROUND_Y - wheelRadius * 0.65;
  const bodyBottomY = chassisBottomY - CHASSIS_HEIGHT;

  const cabHeight = bodyHeight * 0.62;
  const boxTopY = bodyBottomY - bodyHeight;
  const cabRoofY = bodyBottomY - cabHeight;

  const archDarken = '#d9dee8';

  const frontWheelX = cabRightX - wheelRadius - 12;

  let rearAxles = [];
  if (vehicleData.id === 't26') {
    const tandemRearX = boxLeftX + wheelRadius + 20;
    const tandemFrontX = tandemRearX + wheelRadius * 2 + 10;
    rearAxles = [tandemRearX, tandemFrontX];
  } else {
    const singleRearX = boxLeftX + wheelRadius + 20;
    rearAxles = [singleRearX];
  }

  const tailLiftWidth = 5;
  const tailLiftHeight = bodyHeight * 0.55;
  const tailLiftX = boxLeftX - tailLiftWidth - 2;
  const tailLiftY = bodyBottomY - tailLiftHeight;
  const hingeY = bodyBottomY;

  const parts = [];

  parts.push(buildShadowFilter(idPrefix));
  parts.push(buildContactShadow(vehicleLeftX - tailLiftWidth, cabRightX, idPrefix));

  parts.push(
    `<rect x="${vehicleLeftX}" y="${chassisBottomY}" width="${totalLength}" height="${CHASSIS_HEIGHT}" fill="${BUMPER_COLOUR}" rx="2"/>`
  );

  const bumperFrontX = cabRightX;
  const bumperFrontY = chassisBottomY - cabHeight * 0.3;
  parts.push(
    `<rect x="${bumperFrontX - 5}" y="${bumperFrontY}" width="6" height="${GROUND_Y - bumperFrontY}" rx="2" fill="${BUMPER_COLOUR}"/>`
  );
  parts.push(
    `<rect x="${boxLeftX - 3}" y="${bodyBottomY}" width="5" height="${GROUND_Y - bodyBottomY}" rx="2" fill="${BUMPER_COLOUR}"/>`
  );

  parts.push(
    `<rect x="${boxLeftX}" y="${boxTopY}" width="${bodyLength}" height="${bodyHeight}" rx="3" fill="${BODY_COLOUR}"/>`
  );

  const shadeTopY = bodyBottomY - bodyHeight * 0.33;
  parts.push(
    `<rect x="${boxLeftX}" y="${shadeTopY}" width="${bodyLength}" height="${bodyBottomY - shadeTopY}" fill="${BODY_SHADE_COLOUR}" rx="0"/>`
  );

  parts.push(
    `<rect x="${boxLeftX}" y="${boxTopY}" width="${bodyLength}" height="${bodyHeight * 0.1}" fill="${ROOF_HIGHLIGHT_COLOUR}" rx="3"/>`
  );

  const cabPath = [
    `M${boxRightX + chassisGap},${cabRoofY}`,
    `L${cabRightX},${cabRoofY}`,
    `L${cabRightX},${bodyBottomY}`,
    `L${boxRightX + chassisGap},${bodyBottomY}`,
    `Z`,
  ].join(' ');
  parts.push(`<path d="${cabPath}" fill="${BODY_COLOUR}"/>`);

  const cabShadeTopY = bodyBottomY - cabHeight * 0.33;
  parts.push(
    `<rect x="${boxRightX + chassisGap}" y="${cabShadeTopY}" width="${cabWidth}" height="${bodyBottomY - cabShadeTopY}" fill="${BODY_SHADE_COLOUR}"/>`
  );

  const glassX = boxRightX + chassisGap + 5;
  const glassY = cabRoofY + 5;
  const glassWidth = cabWidth - 10;
  const glassHeight = cabHeight * 0.48;
  parts.push(buildGlassReflection(glassX, glassY, glassWidth, glassHeight, idPrefix));

  parts.push(buildChevronLivery(boxLeftX, boxRightX, boxTopY, bodyBottomY, idPrefix));
  parts.push(buildStripe(boxLeftX, boxRightX, bodyBottomY));

  parts.push(
    `<rect x="${tailLiftX}" y="${tailLiftY}" width="${tailLiftWidth}" height="${tailLiftHeight}" fill="${HUB_COLOUR}" rx="1"/>`
  );
  parts.push(
    `<circle cx="${tailLiftX + tailLiftWidth}" cy="${hingeY}" r="3" fill="${BUMPER_COLOUR}"/>`
  );

  for (const axleX of rearAxles) {
    parts.push(buildWheelArch(axleX, chassisBottomY, wheelRadius, archDarken));
  }
  parts.push(buildWheelArch(frontWheelX, chassisBottomY, wheelRadius, archDarken));

  for (const axleX of rearAxles) {
    parts.push(buildWheel(axleX, wheelCentreY, wheelRadius));
  }
  parts.push(buildWheel(frontWheelX, wheelCentreY, wheelRadius));

  parts.push(
    `<rect x="${cabRightX - 3}" y="${cabRoofY + glassHeight + 10}" width="4" height="8" rx="1.5" fill="${INDICATOR_COLOUR}"/>`
  );
  parts.push(
    `<rect x="${boxLeftX - 2}" y="${bodyBottomY - 18}" width="4" height="12" rx="1.5" fill="${TAIL_LIGHT_COLOUR}"/>`
  );

  return parts.join('');
}

function buildVehicleSvgContent(vehicleData, idPrefix) {
  if (vehicleData.kind === 'van') {
    return buildVan(vehicleData, idPrefix);
  }
  if (vehicleData.kind === 'luton') {
    return buildLuton(vehicleData, idPrefix);
  }
  if (vehicleData.kind === 'rigid') {
    return buildRigid(vehicleData, idPrefix);
  }
  return '';
}

export function renderVehicleSvg(vehicleId, { className = '', title = '' } = {}) {
  const vehicleData = getVehicle(vehicleId);
  if (!vehicleData) {
    return '';
  }

  const idPrefix = `vehicle-art-${vehicleId}-`;
  const svgContent = buildVehicleSvgContent(vehicleData, idPrefix);

  const classAttribute = className ? ` class="${className}"` : '';

  if (title) {
    return [
      `<svg${classAttribute} viewBox="0 0 ${VEHICLE_VIEWBOX.width} ${VEHICLE_VIEWBOX.height}" xmlns="http://www.w3.org/2000/svg" role="img">`,
      `<title>${title}</title>`,
      svgContent,
      `</svg>`,
    ].join('');
  }

  return [
    `<svg${classAttribute} viewBox="0 0 ${VEHICLE_VIEWBOX.width} ${VEHICLE_VIEWBOX.height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">`,
    svgContent,
    `</svg>`,
  ].join('');
}
