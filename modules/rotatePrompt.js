import { LANDSCAPE_PHONE_QUERY } from "./layout.js";

const KEY = "rotatePromptDismissed";

export function initRotatePrompt() {
  const root = document.documentElement;
  const dismissBtn = document.getElementById("rotatePromptDismiss");
  if (!dismissBtn) return;

  // sessionStorage can throw in some private modes - fail soft
  dismissBtn.addEventListener("click", () => {
    root.classList.add("rotate-dismissed");
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
  });

  // Move focus into the dialog whenever it appears
  const query = window.matchMedia(LANDSCAPE_PHONE_QUERY);
  const focusIfShown = () => {
    if (query.matches && !root.classList.contains("rotate-dismissed")) dismissBtn.focus();
  };
  query.addEventListener("change", focusIfShown);
  focusIfShown();
}