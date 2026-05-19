import "./styles/index.css";
import { initApp } from "./app";
import { prefersReducedMotion } from "./motion/reduced-motion";

if (!prefersReducedMotion() && window.matchMedia("(pointer: fine)").matches) {
  document.body.classList.add("has-custom-cursor");
}

initApp().catch((err) => {
  console.error(err);
  const app = document.getElementById("app");
  if (app) {
    app.innerHTML = `<p class="load-error">Failed to start the app.</p>`;
  }
});
