import { CONFIG } from "./config.js";
import { createApi } from "./services/api.js";
import { createStore } from "./engine/store.js";
import { createSpinEngine } from "./engine/spin.js";
import { renderWheel } from "./ui/wheel.js";
import { sectorAtRotation,angularDistanceToBoundary } from "./engine/geometry.js";
export async function mount(root,overlayRoot){
  const params=new URLSearchParams(location.search);
  const demo=params.get("demo")==="1"||location.pathname.endsWith("/v3/demo.html");
  const debug=params.get("debug")==="1";
  const starSvg = '<svg class="gw-token-star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 14.9 8.5 21.5 9.4 16.7 14.1 17.8 20.8 12 17.7 6.2 20.8 7.3 14.1 2.5 9.4 9.1 8.5Z" fill="currentColor"/></svg>';
  const lockSvg = '<svg class="gw-token-lock" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><rect x="5" y="10" width="14" height="11" rx="2.5" fill="currentColor"/></svg>';
  const image = (name, className, extra="") => '<img class="gw-art '+className+'" src="'+new URL("./img/"+name+".webp",import.meta.url).href+'" alt="" decoding="async" loading="eager" '+extra+'>';
  root.innerHTML = `<section class="gw-shell">
    <div class="gw-scene" aria-hidden="true"><span class="gw-forest"></span>${image("scene","gw-art-scene")}</div>
    <nav class="gw-topbar" aria-label="Управление"><button class="gw-music" type="button" aria-pressed="false">♫ Музыка: выкл</button></nav>
    <header class="gw-header"><h1 class="gw-title"><svg class="gw-title-svg" viewBox="0 0 900 190" role="img" aria-label="Колесо добрых предсказаний" preserveAspectRatio="xMidYMid meet"><defs><path id="gw-title-arc-1" d="M 105 90 Q 450 12 795 90"/><path id="gw-title-arc-2" d="M 90 153 Q 450 75 810 153"/></defs><text class="gw-title-line gw-title-line-one"><textPath href="#gw-title-arc-1" startOffset="50%" text-anchor="middle">Колесо добрых</textPath></text><text class="gw-title-line gw-title-line-two"><textPath href="#gw-title-arc-2" startOffset="50%" text-anchor="middle">предсказаний</textPath></text></svg></h1></header>
    <div class="gw-ribbon"><p class="gw-subtitle">Поверните волшебное колесо и откройте доброе послание!</p></div>
    <div class="gw-stage"><div class="gw-wheel-rim">${image("wheel-rim","gw-art-rim")}</div><div class="gw-wheel">${renderWheel(debug)}</div><div class="gw-hub">${image("hub","gw-art-hub")}</div><div class="gw-pointer">${image("pointer","gw-art-pointer")}</div></div>
  </section><section class="gw-controls" aria-label="Управление игрой"><div class="gw-play"><div class="gw-spin-area">${image("spin-button","gw-art-spin")}<button class="gw-button" type="button">КРУТИТЬ КОЛЕСО</button></div>
      <div class="gw-tokens" aria-label="Пять вращений в сутки">${image("panel-frame","gw-art-panel")}<div class="gw-token-group"><span class="gw-tokens-heading">Ваши вращения сегодня</span>${Array.from({length:5},()=>'<span class="gw-token" aria-hidden="true">'+starSvg+lockSvg+'</span>').join("")}</div>
        <span class="gw-token-divider" aria-hidden="true"></span><div class="gw-timer-group"><span class="gw-clock" aria-hidden="true"><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="#5c185c" stroke="#ffd469" stroke-width="3"/><path d="M24 11v14l10 6" fill="none" stroke="#ffe48e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="gw-unlock" aria-live="polite"></span></div></div>
      <div class="gw-status" aria-live="polite">Загрузка...</div><div class="gw-error" role="alert"></div>
    </div>
    <nav class="gw-actions" aria-label="Разделы игры"><button class="gw-prizes" type="button" disabled title="Будущий модуль"><span class="gw-action-icon" aria-hidden="true">🎁</span> Призы от партнёров <span class="gw-badge">0</span></button><button class="gw-history" type="button"><span class="gw-action-icon" aria-hidden="true">▤</span> Мои предсказания</button></nav>
    <div class="gw-banner" aria-label="Место для баннера партнёра">${image("gift","gw-art-gift")}<span><strong>Выигрывайте реальные подарки</strong><small>в призовых акциях наших партнёров!</small></span><span class="gw-banner-chevron" aria-hidden="true">›</span></div>
    <div class="gw-rules">5 бесплатных предсказаний каждый день.<br>Первые 3 доступны сразу, ещё 2 через 60 минут после первого вращения.<br>Обновление в 00:00 по времени Южной Кореи.<br>Развлекательная игра с добрыми пожеланиями.</div>
  </section><div class="gw-icon-sprite" aria-hidden="true">${image("icons","gw-art-icons")}</div><div class="gw-debug" aria-live="off"></div>`;
  // Missing optional artwork must not replace the existing CSS/SVG fallbacks.
  root.querySelectorAll(".gw-art").forEach(img => {
    img.addEventListener("error", () => { img.hidden = true; }, {once:true});
    if (img.complete && img.naturalWidth === 0) img.hidden = true;
  });
  const musicButton = root.querySelector(".gw-music");
  musicButton.addEventListener("click", () => {
    const enabled = musicButton.getAttribute("aria-pressed") !== "true";
    musicButton.setAttribute("aria-pressed", String(enabled));
    musicButton.textContent = enabled ? "♫ Музыка: вкл" : "♫ Музыка: выкл";
    // Stage 3a placeholder only: no audio module or sound playback.
  });

  const wheel=root.querySelector(".gw-wheel"),button=root.querySelector(".gw-button"),status=root.querySelector(".gw-status"),error=root.querySelector(".gw-error"),debugEl=root.querySelector(".gw-debug"),tokens=[...root.querySelectorAll(".gw-token")],unlock=root.querySelector(".gw-unlock"),historyButton=root.querySelector(".gw-history");
  const clock=()=>Date.now()+(demo?Number(sessionStorage.getItem("gw-v3-demo-clock-offset")||0):0);
  const api=demo?createApi({now:clock}):createApi();
  const store=createStore({phase:"idle",state:await api.getState(),error:""});
  let lastState=null;
  const refreshUnlock=()=>{if(!lastState)return;const remaining=lastState.nextUnlockAt?Math.max(0,Math.ceil((new Date(lastState.nextUnlockAt).getTime()-clock())/1000)):0;const minutes=Math.floor(remaining/60),seconds=remaining%60;unlock.innerHTML=lastState.nextUnlockAt?'<span class="gw-unlock-label">Ещё 2 вращения через</span><strong class="gw-unlock-digits">'+String(minutes).padStart(2,"0")+":"+String(seconds).padStart(2,"0")+"</strong>":'<span class="gw-unlock-idle">5 вращений каждый день</span>';};
  const unsubscribe=store.subscribe(value=>{
    lastState=value.state;
    button.disabled=value.phase!=="idle"||!value.state?.available;
    button.textContent=value.phase==="idle"&&!value.state?.available?(value.state?.nextUnlockAt?"ОЖИДАНИЕ ВРАЩЕНИЙ":"НА СЕГОДНЯ ВСЁ"):"КРУТИТЬ КОЛЕСО";
    status.textContent=`Использовано: ${value.state?.used??0} из 5. Доступно: ${value.state?.available??0}.`+(value.state?.nextUnlockAt?` Ещё вращения после ${new Date(value.state.nextUnlockAt).toLocaleTimeString("ru-RU",{timeZone:CONFIG.dayZone,hour:"2-digit",minute:"2-digit"})} (Корея).`:"");
    error.textContent=value.error||"";
    const used=value.state?.used??0,available=value.state?.available??0;
    tokens.forEach((token,i)=>{token.classList.toggle("gw-token-used",i<used);token.classList.toggle("gw-token-locked",i>=used+available);token.setAttribute("aria-label",i<used?"Использовано":i>=used+available?"Заблокировано":"Доступно");});
    refreshUnlock();
  });
  const unlockTimer=setInterval(refreshUnlock,1000);
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
  async function illuminateWinningSector({sectorIndex}) {
    const sector=wheel.querySelector('.gw-sector-fill[data-sector="'+sectorIndex+'"]');
    const pointer=root.querySelector(".gw-pointer");
    if (!sector || !pointer) return;
    const icon=wheel.querySelector('.gw-sector-sprite[data-sector="'+sectorIndex+'"]');
    sector.classList.add("gw-sector-winning");
    icon?.classList.add("gw-icon-winning");
    pointer.classList.add("gw-pointer-celebrate");
    try {
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
        await new Promise(resolve=>setTimeout(resolve,1500));
      }
    } finally {
      sector.classList.remove("gw-sector-winning");
      icon?.classList.remove("gw-icon-winning");
      pointer.classList.remove("gw-pointer-celebrate");
    }
  }
  const engine=createSpinEngine({api,store,animate,showResult,onSettled:illuminateWinningSector,onPlan:({sectorIndex,finalRotation})=>{
    if(debug)debugEl.textContent=`API sectorIndex: ${sectorIndex}; finalRotation: ${finalRotation.toFixed(4)}°; под указателем: ${sectorAtRotation(finalRotation)}`;
  }});
  button.addEventListener("click",engine.spin);
  if(debug)debugEl.textContent="DEBUG: геометрия 12 × 30°; ожидание ответа mock API";
  return ()=>{clearInterval(unlockTimer);unsubscribe();root.replaceChildren();overlayRoot.replaceChildren();};
}