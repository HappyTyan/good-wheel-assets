// Single resource revision for CSS and the complete ES module graph.
const ROOT_ID = "gw-root";
const VERSION = "3.9.2-wait-label-fit";
const BASE = new URL("./", import.meta.url);
const resource = path => {
  const url = new URL(path, BASE);
  url.searchParams.set("v", VERSION);
  return url.href;
};
// Import maps do not automatically propagate query parameters through relative imports.
// Explicit URL mappings cover every current v3 module without modifying engine/API code.
const modules = [
  "app.js", "config.js", "services/api.js",
  "engine/store.js", "engine/spin.js", "engine/geometry.js", "ui/wheel.js"
];
const imports = Object.fromEntries(modules.map(path => [new URL(path, BASE).href, resource(path)]));
const map = document.createElement("script");
map.type = "importmap";
map.textContent = JSON.stringify({imports});
document.head.append(map);
const host = document.getElementById(ROOT_ID);
if (host && !host.dataset.gwMounted) {
  host.dataset.gwMounted = "1";
  const shadow = host.attachShadow({mode:"open"});
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = resource("theme/theme.css");
  shadow.append(style);
  const appRoot = document.createElement("div");
  shadow.append(appRoot);
  const overlay = document.createElement("div");
  overlay.id = "gw-overlay-v3-" + VERSION.replaceAll(".", "-");
  const overlayShadow = overlay.attachShadow({mode:"open"});
  const overlayStyle = document.createElement("link");
  overlayStyle.rel = "stylesheet";
  overlayStyle.href = style.href;
  overlayShadow.append(overlayStyle);
  const overlayRoot = document.createElement("div");
  overlayShadow.append(overlayRoot);
  document.body.append(overlay);
  import(resource("app.js")).then(module => module.mount(appRoot, overlayRoot)).catch(error => {
    console.error("Good Wheel v3 startup error", error);
    appRoot.textContent = "Игра временно недоступна. Обновите страницу позже.";
  });
}
