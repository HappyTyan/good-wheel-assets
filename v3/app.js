import { CONFIG } from "./config.js";
import { createApi } from "./services/api.js";
import { createStore } from "./engine/store.js";
import { createSpinEngine } from "./engine/spin.js";
import { renderWheel } from "./ui/wheel.js";
import { sectorAtRotation,angularDistanceToBoundary } from "./engine/geometry.js";
export async function mount(root,overlayRoot){
  const params=new URLSearchParams(location.search);
  const demo=params.get("demo")==="1"||location.pathname.endsWith("/v3/demo.html");
  const debug=demo||params.get("debug")==="1";
  root.innerHTML=`<section class="gw-shell"><div class="gw-scene" aria-hidden="true"><span class="gw-forest"></span><span class="gw-lantern gw-lantern-left"></span><span class="gw-lantern gw-lantern-right"></span><span class="gw-orb"></span><span class="gw-cat"></span></div><header class="gw-header"><div class="gw-ribbon"><h1 class="gw-title">Колесо добрых предсказаний</h1></div><p class="gw-subtitle">Поверните волшебное колесо и откройте доброе послание!</p></header><div class="gw-stage"><div class="gw-pointer"></div><div class="gw-wheel">${renderWheel(debug)}</div><div class="gw-stand" aria-hidden="true"></div></div><div class="gw-play"><button class="gw-button" type="button">КРУТИТЬ КОЛЕСО</button><div class="gw-tokens" aria-label="Пять вращений в сутки"><span class="gw-token" aria-hidden="true"></span><span class="gw-token" aria-hidden="true"></span><span class="gw-token" aria-hidden="true"></span><span class="gw-token" aria-hidden="true"></span><span class="gw-token" aria-hidden="true"></span><span class="gw-unlock" aria-hidden="true"></span></div><div class="gw-status" aria-live="polite">Загрузка...</div><div class="gw-error" role="alert"></div></div><nav class="gw-actions" aria-label="Разделы игры"><button class="gw-prizes" type="button" disabled title="Будущий модуль">Призы от партнёров <span class="gw-badge">скоро</span></button><button class="gw-history" type="button">Мои предсказания</button></nav><div class="gw-banner" aria-label="Место для баннера партнёра"><span>Место для партнёрского баннера</span></div><div class="gw-debug"></div></section>`;
  const wheel=root.querySelector(".gw-wheel"),button=root.querySelector(".gw-button"),status=root.querySelector(".gw-status"),error=root.querySelector(".gw-error"),debugEl=root.querySelector(".gw-debug"),tokens=[...root.querySelectorAll(".gw-token")],unlock=root.querySelector(".gw-unlock"),historyButton=root.querySelector(".gw-history");
  const clock=()=>Date.now()+(demo?Number(sessionStorage.getItem("gw-v3-demo-clock-offset")||0):0);
  const api=demo?createApi({now:clock}):createApi();
  const store=createStore({phase:"idle",state:await api.getState(),error:""});
  const unsubscribe=store.subscribe(value=>{
    button.disabled=value.phase!=="idle"||!value.state?.available;
    status.textContent=`Использовано: ${value.state?.used??0} из 5. Доступно: ${value.state?.available??0}.`+(value.state?.nextUnlockAt?` Ещё вращения после ${new Date(value.state.nextUnlockAt).toLocaleTimeString("ru-RU",{timeZone:CONFIG.dayZone,hour:"2-digit",minute:"2-digit"})} (Корея).`:"");
    error.textContent=value.error||"";
    const used=value.state?.used??0,available=value.state?.available??0;
    tokens.forEach((token,i)=>{token.classList.toggle("gw-token-used",i<used);token.classList.toggle("gw-token-locked",i>=used+available);});
    unlock.textContent=value.state?.nextUnlockAt?"Откроются через "+Math.max(0,Math.ceil((new Date(value.state.nextUnlockAt).getTime()-clock())/60000))+" мин":"";
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
  historyButton.addEventListener("click",async()=>{
    try{
      const entries=await api.history(20,0);
      const panel=document.createElement("div");panel.className="gw-overlay-host";
      const dialog=document.createElement("section");dialog.className="gw-result gw-history-dialog";dialog.setAttribute("role","dialog");dialog.setAttribute("aria-modal","true");
      const heading=document.createElement("h2");heading.textContent="Мои предсказания";dialog.append(heading);
      const list=document.createElement("div");list.className="gw-history-list";
      if(!entries.length){const empty=document.createElement("p");empty.textContent="Пока нет предсказаний.";list.append(empty);}
      for(const entry of entries){const item=document.createElement("article");const title=document.createElement("strong");title.textContent=entry.title||"Предсказание";const detail=document.createElement("p");detail.textContent=entry.text||"";item.append(title,detail);list.append(item);}
      dialog.append(list);const close=document.createElement("button");close.type="button";close.textContent="Закрыть";close.addEventListener("click",()=>panel.remove(),{once:true});dialog.append(close);panel.append(dialog);overlayRoot.append(panel);
    }catch(err){error.textContent=err.message||"Не удалось открыть историю";}
  });
  async function animate(from,to,duration){
    const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ms=reduced?350:duration;
    const motion=wheel.animate([{transform:`rotate(${from}deg)`},{transform:`rotate(${to}deg)`}],{duration:ms,easing:"cubic-bezier(.12,.6,.1,1)",fill:"forwards"});
    await motion.finished;
    wheel.style.transform=`rotate(${to}deg)`;motion.cancel();
    if(debug)debugEl.textContent+=`; фактически под указателем: ${sectorAtRotation(to)}; до границы: ${angularDistanceToBoundary(to).toFixed(2)}°`;
  }
  const engine=createSpinEngine({api,store,animate,showResult,onPlan:({sectorIndex,finalRotation})=>{
    if(debug)debugEl.textContent=`API sectorIndex: ${sectorIndex}; finalRotation: ${finalRotation.toFixed(4)}°; под указателем: ${sectorAtRotation(finalRotation)}`;
  }});
  button.addEventListener("click",engine.spin);
  if(debug)debugEl.textContent="DEBUG: геометрия 12 × 30°; ожидание ответа mock API";
  return ()=>{unsubscribe();root.replaceChildren();overlayRoot.replaceChildren();};
}