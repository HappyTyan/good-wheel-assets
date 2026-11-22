import { SECTOR_COUNT, SECTOR_ANGLE } from "../config.js";
export const normalize = degrees => ((degrees % 360) + 360) % 360;
export const start = i => i * SECTOR_ANGLE;
export const center = i => start(i) + SECTOR_ANGLE / 2;
export function sectorAtRotation(rotation) {
  return Math.floor(normalize(360 - normalize(rotation)) / SECTOR_ANGLE) % SECTOR_COUNT;
}
export function angularDistanceToBoundary(rotation) {
  const angle = normalize(360 - normalize(rotation)) % SECTOR_ANGLE;
  return Math.min(angle, SECTOR_ANGLE - angle);
}
export function planStop(currentRotation, sectorIndex, turns = 6, jitter = 0) {
  if (!Number.isInteger(sectorIndex) || sectorIndex < 0 || sectorIndex >= SECTOR_COUNT) throw Error("Invalid sector");
  if (!Number.isInteger(turns) || turns < 5 || turns > 8) throw Error("Invalid turns");
  if (!Number.isFinite(jitter) || Math.abs(jitter) > 11) throw Error("Invalid jitter");
  const rest = normalize(360 - center(sectorIndex) + jitter);
  const delta = normalize(rest - normalize(currentRotation));
  const finalRotation = currentRotation + turns * 360 + delta;
  if (sectorAtRotation(finalRotation) !== sectorIndex || angularDistanceToBoundary(finalRotation) < 3) throw Error("Geometry mismatch");
  return finalRotation;
}
export function sectorPath(i, radius = 48) {
  const a = (start(i) - 90) * Math.PI / 180, b = (start(i) + SECTOR_ANGLE - 90) * Math.PI / 180;
  const x1=50+radius*Math.cos(a), y1=50+radius*Math.sin(a);
  const x2=50+radius*Math.cos(b), y2=50+radius*Math.sin(b);
  return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
}
export function iconPosition(i, radius = 33) {
  const a=(center(i)-90)*Math.PI/180;
  return {x:50+radius*Math.cos(a),y:50+radius*Math.sin(a)};
}