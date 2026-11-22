const ROOT_ID="gw-root";
const VERSION="3.0.0";
const BASE=new URL("./",import.meta.url);
const host=document.getElementById(ROOT_ID);
if(host&&!host.dataset.gwMounted){
  host.dataset.gwMounted="1";
  const shadow=host.attachShadow({mode:"open"});
  const style=document.createElement("link");style.rel="stylesheet";style.href=new URL("theme/theme.css",BASE).href;
  shadow.append(style);
  const appRoot=document.createElement("div");shadow.append(appRoot);
  const overlay=document.createElement("div");overlay.id="gw-overlay-v3-"+VERSION.replaceAll(".","-");
  const overlayShadow=overlay.attachShadow({mode:"open"});
  const overlayStyle=document.createElement("link");overlayStyle.rel="stylesheet";overlayStyle.href=style.href;
  overlayShadow.append(overlayStyle);
  const overlayRoot=document.createElement("div");overlayShadow.append(overlayRoot);
  document.body.append(overlay);
  import(new URL("app.js",BASE).href).then(module=>module.mount(appRoot,overlayRoot)).catch(error=>{
    console.error("Good Wheel v3 startup error",error);
    appRoot.textContent="Игра временно недоступна. Обновите страницу позже.";
  });
}