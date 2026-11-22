import { CONFIG } from "./config.js";
import { createApi } from "./services/api.js";
import { createStore } from "./engine/store.js";
import { createSpinEngine } from "./engine/spin.js";
import { renderWheel } from "./ui/wheel.js";
import { sectorAtRotation,angularDistanceToBoundary } from "./engine/geometry.js";
export async function mount(root,overlayRoot){
  const params=new URLSearchParams(location.search);
  const demo=params.get("demo")==="1";
  const debug=demo||params.get("debug")==="1";
  root.innerHTML=`<section class="gw-shell"><h1 class="gw-title">Колесо добрых предсказаний</h1><p class="gw-subtitle">Поверните волшебное колесо и откройте доброе послание!</p><div class="gw-stage"><div class="gw-pointer"></div><div class="gw-wheel">${renderWheel(debug)}</div></div><button class="gw-button" type="button">✦ КРУТИТЬ КОЛЕСО ✦</button><div class="gw-status" aria-live="polite">Загрузка...</div><div class="gw-error" role="alert"></div><div class="gw-debug"></div></section>`;
  const wheel=root.querySelector(".gw-wheel"),button=root.querySelector("button"),status=root.querySelector(".gw-status"),error=root.querySelector(".gw-error"),debugEl=root.querySelector(".gw-debug");
  const clock=()=>Date.now()+(demo?Number(sessionStorage.getItem("gw-v3-demo-clock-offset")||0):0);
  const api=demo?createApi({now:clock}):createApi();
  const store=createStore({phase:"idle",state:await api.getState(),error:""});
  const unsubscribe=store.subscribe(value=>{
    button.disabled=value.phase!=="idle"||!value.state?.available;
    status.textContent=`Использовано: ${value.state?.used??0} из 5. Доступно: ${value.state?.available??0}.`+(value.state?.nextUnlockAt?` Ещё вращения после ${new Date(value.state.nextUnlockAt).toLocaleTimeString("ru-RU",{timeZone:CONFIG.dayZone,hour:"2-digit",minute:"2-digit"})} (Корея).`:"");
    error.textContent=value.error||"";
  });
  function showResult(prediction){
    return new Promise(resolve=>{
      const panel=document.createElement("div");panel.className="gw-overlay-host";
      panel.innerHTML=`<section class="gw-result" role="dialog" aria-modal="true" aria-label="Предсказание"><p class="gw-category"></p><h2></h2><p class="gw-text"></p><p class="gw-advice"></p><button type="button">Закрыть</button></section>`;
      panel.querySelector(".gw-category").textContent=prediction.category;
      panel.querySelector("h2").textContent=prediction.title;
      panel.querySelector(".gw-text").textContent=prediction.text;
      panel.querySelector(".gw-advice").textContent="Совет дня: "+prediction.advice;
      const close=()=>{panel.remove();resolve();};
      panel.querySelector("button").addEventListener("click",close,{once:true});
      overlayRoot.append(panel);
    });
  }
  async function animate(from,to,duration){
    const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ms=reduced?350:duration;
    const motion=wheel.animate([{transform:`rotate(${from}deg)`},{transform:`rotate(${to}deg)`}],{duration:ms,easing:"cubic-bezier(.12,.6,.1,1)",fill:"forwards"});
    await motion.finished;
    wheel.style.transform=`rotate(${to}deg)`;motion.cancel();
    if(debug)debugEl.textContent=`Сектор: ${sectorAtRotation(to)}; до границы: ${angularDistanceToBoundary(to).toFixed(2)}°`;
  }
  const engine=createSpinEngine({api,store,animate,showResult,onPlan:({sectorIndex,finalRotation})=>{
    if(debug)debugEl.textContent=`API sectorIndex: ${sectorIndex}; finalRotation: ${finalRotation.toFixed(4)}°; под указателем: ${sectorAtRotation(finalRotation)}`;
  }});
  button.addEventListener("click",engine.spin);
  if(debug)debugEl.textContent="DEBUG: геометрия 12 × 30°; ожидание ответа mock API";
  return ()=>{unsubscribe();root.replaceChildren();overlayRoot.replaceChildren();};
}