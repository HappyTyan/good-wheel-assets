import { SECTORS } from "../config.js";
import { sectorPath, iconPosition, start, center } from "../engine/geometry.js";
const SYMBOLS = Object.freeze(["☘","◉","♥","★","✿","✦","☀","◆","▲","♡","✧","❀"]);
export function renderWheel(debug=false){
  const paths=SECTORS.map(s=>`<path class="gw-sector-fill" data-sector="${s.i}" data-start="${start(s.i)}" data-center="${center(s.i)}" d="${sectorPath(s.i)}" fill="${s.color}" stroke="none"/>`).join("");
  const lines=SECTORS.map(s=>{const a=(start(s.i)-90)*Math.PI/180;return `<line class="gw-sector-line" data-sector="${s.i}" data-start="${start(s.i)}" data-center="${center(s.i)}" x1="50" y1="50" x2="${50+48*Math.cos(a)}" y2="${50+48*Math.sin(a)}" stroke="${debug?"#70ffff":"#f6d98a"}" stroke-width="${debug?".65":".35"}"/>`;}).join("");
  const labels=SECTORS.map(s=>{const p=iconPosition(s.i);return `<text class="gw-sector-icon" data-sector="${s.i}" data-start="${start(s.i)}" data-center="${center(s.i)}" x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="middle" font-size="${debug?"3.1":"9"}" fill="#fff8db" font-family="Georgia,serif" font-weight="bold" paint-order="stroke" stroke="#44204d" stroke-width="${debug?"0":".45"}">${debug?s.i+1:SYMBOLS[s.i]}</text>`;}).join("");
  return `<svg class="gw-wheel-svg" viewBox="0 0 100 100" role="img" aria-label="Колесо из 12 секторов"><circle cx="50" cy="50" r="49.4" fill="#d9a64a"/>${paths}${lines}${labels}<circle cx="50" cy="50" r="9" fill="#32104c" stroke="#f9d477" stroke-width="2"/><path d="M50 42 L52 48 L58 50 L52 52 L50 58 L48 52 L42 50 L48 48Z" fill="#f9d477"/></svg>`;
}
