export const SECTOR_COUNT = 12;
export const SECTOR_ANGLE = 360 / SECTOR_COUNT;
export const CONFIG = Object.freeze({ apiMode: "mock", dayZone: "Asia/Seoul", dailyLimit: 5, immediateSpins: 3, unlockMinutes: 60, spinDuration: 5200 });
export const SECTORS = Object.freeze([
  ["Удача","#11834c"],["Финансы","#d48a19"],["Любовь","#cc3280"],["Мечты","#276fc2"],
  ["Гармония","#7734ab"],["Перемены","#15966d"],["Энергия","#d58b18"],["Удача","#9843bb"],
  ["Финансы","#1a82a6"],["Любовь","#b42d77"],["Мечты","#d39b21"],["Гармония","#3e8c56"]
].map(([category,color],i)=>Object.freeze({i,category,color})));