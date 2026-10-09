import { LANDSCAPE_PHONE_QUERY } from "./layout.js";

const KEY = "rotatePromptDismissed";
// Everything behind the prompt: while it is open these are made inert, so Tab,
// screen-reader navigation and taps cannot reach them (the prompt is modal).
const BACKGROUND = ["nav", ".container-map", "#aboutModal"];

export function initRotatePrompt() {
  const root = document.documentElement;
  const dismissBtn = document.getElementById("rotatePromptDismiss");
  if (!dismissBtn) return;

  const query = window.matchMedia(LANDSCAPE_PHONE_QUERY);
  const isShown = () => query.matches && !root.classList.contains("rotate-dismissed");
  const setBackgroundInert = (on) => BACKGROUND.forEach((sel) => document.querySelector(sel)?.toggleAttribute("inert", on));

  let opener = null; // element that had focus before the prompt appeared
  let wasShown = false;

  // Single place that reacts to the prompt appearing or disappearing
  const sync = () => {
    const shown = isShown();
    if (shown === wasShown) return;
    wasShown = shown;
    setBackgroundInert(shown);
    if (shown) {
      opener = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
      dismissBtn.focus();
    } else {
      opener?.focus?.();
      opener = null;
    }
  };

  const dismiss = () => {
    root.classList.add("rotate-dismissed");
    // sessionStorage can throw in some private modes - fail soft
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
    sync();
  };

  dismissBtn.addEventListener("click", dismiss);
  // Escape closes a modal dialog, same as "Continue anyway"
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isShown()) dismiss();
  });

  query.addEventListener("change", sync);
  sync();
}
