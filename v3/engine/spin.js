import { planStop } from "./geometry.js";
import { CONFIG } from "../config.js";
export function createSpinEngine({api,store,animate,showResult,onPlan=()=>{}}){
  let rotation=0,activeKey=null;
  async function spin(){
    if(store.get().phase!=="idle")return;
    const key=activeKey||(globalThis.crypto?.randomUUID?.()||String(Date.now())+"-"+Math.random());
    activeKey=key;store.set({phase:"requesting",error:""});
    try{
      const result=await api.spin(key);
      const jitter=(Math.random()*2-1)*11,turns=5+Math.floor(Math.random()*4);
      const target=planStop(rotation,result.sectorIndex,turns,jitter);
      onPlan({sectorIndex:result.sectorIndex,finalRotation:target,jitter,turns});
      store.set({phase:"spinning",state:result.state});
      await animate(rotation,target,CONFIG.spinDuration);
      rotation=target;store.set({phase:"settling"});
      store.set({phase:"result"});
      await showResult(result.prediction);
      activeKey=null;store.set({phase:"idle"});
    }catch(error){
      store.set({phase:"idle",error:error.message||"Не удалось выполнить вращение"});
    }
  }
  return {spin};
}