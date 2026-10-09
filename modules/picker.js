const Bilateral = [
  { text: "Austria", value: 24, disabled: false },
  { text: "Belarus", value: 23, disabled: false },
  { text: "Brazil", value: 20, disabled: false },
  { text: "Canada", value: 18, disabled: false },
  { text: "Chile", value: 19, disabled: false },
  { text: "China", value: 7, disabled: false },
  { text: "Cuba", value: 21, disabled: false },
  { text: "East Timor", value: 17, disabled: false },
  { text: "European Union", value: 1, disabled: false },
  { text: "France", value: 25, disabled: false },
  { text: "Germany", value: 26, disabled: false },
  { text: "India", value: 4, disabled: false },
  { text: "Indonesia", value: 8, disabled: false },
  { text: "Iran", value: 16, disabled: false },
  { text: "Italy", value: 13, disabled: false },
  { text: "Japan", value: 6, disabled: false },
  { text: "Netherlands", value: 27, disabled: false },
  { text: "Poland", value: 28, disabled: false },
  { text: "Portugal", value: 14, disabled: false },
  { text: "Qatar", value: 15, disabled: false },
  { text: "Russia", value: 9, disabled: false },
  { text: "Saudi Arabia", value: 2, disabled: false },
  { text: "Spain", value: 29, disabled: false },
  { text: "South Korea", value: 5, disabled: false },
  { text: "Turkey", value: 11, disabled: false },
  { text: "United Arab Emirates", value: 3, disabled: false },
  { text: "United Kingdom", value: 12, disabled: false },
  { text: "United States", value: 10, disabled: false },
  { text: "Venezuela", value: 22, disabled: false },
];

const Multilateral = [
  { text: "BRICS Geological Platform", value: 1, disabled: false },
  { text: "Minerals Security Partnership", value: 2, disabled: false },
  { text: "Energy Resource Governance Initiative", value: 4, disabled: false },
  { text: "Indo-Pacific Economic Framework for Prosperity (IPEF) Critical Minerals Dialogue", value: 5, disabled: false },
  { text: "Sustainable Critical Mineral Alliance", value: 6, disabled: false },
  { text: "Conference on Critical Materials and Minerals", value: 7, disabled: false },
  { text: "France-Germany-Italy Joint Communique on Critical Raw Materials", value: 8, disabled: false },
  { text: "Critical Minerals Mapping Initiative", value: 9, disabled: false },
  { text: "Lobito Corridor Project", value: 10, disabled: false },
];

const ROW_HEIGHT = 36; // px, matches .wheel-item in style.css
// Everything behind the picker. While it is open these are inert: no Tab, no taps,
// no screen-reader access. (#picker itself lives inside .container-map, so that stays active.)
const BACKGROUND = ["nav", "#map", "#legend-container"];

const picker = document.getElementById("picker");
const wheelList = document.getElementById("wheelList");
let selectedIndex = 0;
let pickerData;
let opener = null; // element that had focus before the picker opened

const isOpen = () => picker.style.display !== "none";
const setBackgroundInert = (on) => BACKGROUND.forEach((sel) => document.querySelector(sel)?.toggleAttribute("inert", on));

function openPicker(data, label) {
  pickerData = data;
  selectedIndex = 0;
  opener = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
  picker.setAttribute("aria-label", label);
  wheelList.setAttribute("aria-label", label);
  picker.style.display = "block";
  setBackgroundInert(true);
  createWheel();
  wheelList.focus();
}
function showPickerBilateral() {
  openPicker(Bilateral, "Choose a partner");
}
function showPickerMultilateral() {
  openPicker(Multilateral, "Choose a coalition");
}

function cancel() {
  if (!isOpen()) return; // also called on viewport changes while closed: must not steal focus
  picker.style.display = "none";
  setBackgroundInert(false);
  opener?.focus?.();
  opener = null;
}

function confirmPicker() {
  if (!isOpen()) return;
  const selectedValue = pickerData[selectedIndex].text;
  cancel();
  const divElement = document.querySelector(".tooltip2");
  if (divElement) divElement.style.display = "none";
  const button = Array.from(document.querySelectorAll(".bloc-select")).find((b) => b.textContent.trim() === selectedValue);
  if (button) button.click();

  const button2 = Array.from(document.querySelectorAll(".country-select")).find((b) => b.textContent.trim() === selectedValue);
  if (button2) button2.click();
}

function createWheel() {
  wheelList.innerHTML = ""; // Clear previous items
  pickerData.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = item.text;
    li.id = `wheel-option-${index}`;
    li.setAttribute("role", "option");
    li.className = item.disabled ? "wheel-item wheel-disabled-item" : "wheel-item";
    li.onclick = () => selectItem(index);
    wheelList.appendChild(li);
  });
  selectItem(selectedIndex);
}

function selectItem(index) {
  selectedIndex = Math.max(0, Math.min(pickerData.length - 1, index));
  Array.from(wheelList.children).forEach((li, i) => {
    const on = i === selectedIndex;
    li.classList.toggle("selected-item", on);
    li.setAttribute("aria-selected", String(on));
  });
  wheelList.setAttribute("aria-activedescendant", `wheel-option-${selectedIndex}`);
  wheelList.scrollTop = selectedIndex * ROW_HEIGHT;
}

// -- Keyboard ---------------------------------------------------------------
wheelList.addEventListener("keydown", (e) => {
  const step = { ArrowDown: 1, ArrowUp: -1, PageDown: 4, PageUp: -4 }[e.key];
  if (step) {
    selectItem(selectedIndex + step);
  } else if (e.key === "Home") {
    selectItem(0);
  } else if (e.key === "End") {
    selectItem(pickerData.length - 1);
  } else if (e.key === "Enter") {
    confirmPicker();
  } else if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
    // type-ahead: jump to the next item starting with that letter
    const letter = e.key.toLowerCase();
    const order = [...pickerData.keys()];
    const next = [...order.slice(selectedIndex + 1), ...order.slice(0, selectedIndex + 1)].find((i) => pickerData[i].text.toLowerCase().startsWith(letter));
    if (next === undefined) return;
    selectItem(next);
  } else {
    return;
  }
  e.preventDefault();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isOpen()) cancel();
});

picker.querySelector(".cancel").addEventListener("click", cancel);
picker.querySelector(".confirm").addEventListener("click", confirmPicker);

// -- Pointer drag / touch scroll (unchanged) ----------------------------------
let isDragging = false;
let startMouseY = 0;

wheelList.addEventListener("mousedown", (e) => {
  isDragging = true;
  startMouseY = e.pageY;
});

wheelList.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  let moveDistance = startMouseY - e.pageY;
  wheelList.scrollTop += moveDistance;
  startMouseY = e.pageY;
});

wheelList.addEventListener("mouseup", () => {
  isDragging = false;
});

wheelList.addEventListener("mouseleave", () => {
  isDragging = false;
});

let isTouching = false;
let startTouchY = 0;

wheelList.addEventListener("touchstart", (e) => {
  isTouching = true;
  startTouchY = e.touches[0].pageY;
});

wheelList.addEventListener("touchmove", (e) => {
  if (!isTouching) return;

  const moveDistance = startTouchY - e.touches[0].pageY;
  wheelList.scrollTop += moveDistance;
  startTouchY = e.touches[0].pageY;

  if (wheelList.scrollHeight > wheelList.clientHeight) {
    e.preventDefault();
  }
});

wheelList.addEventListener("touchend", () => {
  isTouching = false;
});

export { showPickerBilateral, showPickerMultilateral, confirmPicker, cancel as closePicker };
