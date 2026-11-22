import { SECTORS } from "../config.js";
import { sectorPath, iconPosition, start } from "../engine/geometry.js";
export function renderWheel(debug=false){
  const paths=SECTORS.map(s=>`<path d="${sectorPath(s.i)}" fill="${s.color}" stroke="#f6d98a" stroke-width=".35"/>`).join("");
  const labels=SECTORS.map(s=>{const p=iconPosition(s.i);return `<text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="middle" font-size="3.1" fill="#fff8db" font-weight="bold">${s.i+1}</text>`;}).join("");
  const lines=debug?SECTORS.map(s=>{const a=(start(s.i)-90)*Math.PI/180;return `<line x1="50" y1="50" x2="${50+48*Math.cos(a)}" y2="${50+48*Math.sin(a)}" stroke="cyan" stroke-width=".45"/>`;}).join(""):"";
  return `<svg class="gw-wheel-svg" viewBox="0 0 100 100" role="img" aria-label="Колесо из 12 секторов"><circle cx="50" cy="50" r="49.4" fill="#d9a64a"/>${paths}${labels}${lines}<circle cx="50" cy="50" r="9" fill="#32104c" stroke="#f9d477" stroke-width="2"/><path d="M50 42 L52 48 L58 50 L52 52 L50 58 L48 52 L42 50 L48 48Z" fill="#f9d477"/></svg>`;
}