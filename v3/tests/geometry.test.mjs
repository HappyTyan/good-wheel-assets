import {planStop,sectorAtRotation,angularDistanceToBoundary,start,center} from "../engine/geometry.js";
import {SECTOR_COUNT,SECTOR_ANGLE} from "../config.js";
let checked=0;
for(let i=0;i<1000;i++){
  const sector=i%SECTOR_COUNT,rotation=(i*137.23)%360,turns=5+i%4,jitter=(i*37%2201)/100-11;
  const final=planStop(rotation,sector,turns,jitter);
  if(sectorAtRotation(final)!==sector)throw Error(`Wrong sector on test ${i}`);
  if(angularDistanceToBoundary(final)<3)throw Error(`Boundary too close on test ${i}`);
  if(Math.abs(center(sector)-(start(sector)+SECTOR_ANGLE/2))>1e-9)throw Error("Geometry disagreement");
  checked++;
}
console.log(`PASS: ${checked} spins; sector match 100%; minimum boundary margin >= 3 degrees`);