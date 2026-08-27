// Sail Race Timer app: view and controller for the countdown engine that
// lives in sailracer.wid.js (WIDGETS["sailracer"]).


const lib = require("sailracerlib");

const COL_TIME = "#ffff00";
const COL_BG = "#000000";
const FONT_SIZE = 100;
const CENTER_Y = 120;
const GLYPH_HALF_H = 50;
const BTN2_HOLD_S = 0.75;

let DURATIONS;
let durIdx;
let raceMs;
let lastStr = "";
let cells = [];
let redrawId = null;
let btn2WatchId = null;
let w;

function loadConfig() {
  const storage = require("Storage");
  let cfg = storage.readJSON(lib.CFG_FILE, 1);
  if (!cfg || !Array.isArray(cfg.durations)) {
    cfg = { durations: lib.DEFAULT_DURATIONS.slice(), index: 1 };
    storage.writeJSON(lib.CFG_FILE, cfg);
  }
  DURATIONS = cfg.durations.filter(function(s) {
    return typeof s === "number" && s > 0;
  });
  if (!DURATIONS.length) {
    DURATIONS = lib.DEFAULT_DURATIONS.slice();
  }
  durIdx = typeof cfg.index === "number" && isFinite(cfg.index) ? Math.floor(cfg.index) : 0;
  if (durIdx < 0) {
    durIdx = 0;
  } else if (durIdx >= DURATIONS.length) {
    durIdx = DURATIONS.length - 1;
  }
}

function saveConfig() {
  require("Storage").writeJSON(lib.CFG_FILE, {
    durations: DURATIONS,
    index: durIdx
  });
}

function setFont() {
  g.setFont("Vector", FONT_SIZE).setFontAlign(0, 0);
}

// fixed reference widths per character class so cells stay put as digits change
function layoutCells(str) {
  setFont();
  const digitW = g.stringWidth("0");
  const colonW = g.stringWidth(":");
  let total = 0;
  for (let i = 0; i < str.length; i++) {
    total += str[i] === ":" ? colonW : digitW;
  }
  let x = Math.floor((g.getWidth() - total) / 2);
  cells = [];
  for (let j = 0; j < str.length; j++) {
    const w = str[j] === ":" ? colonW : digitW;
    cells.push({ x: x, w: w });
    x += w;
  }
}

function drawFull(str) {
  layoutCells(str);
  g.setBgColor(COL_BG);
  g.clear();
  g.setColor(COL_TIME);
  for (let i = 0; i < str.length; i++) {
    g.drawString(str[i], cells[i].x + cells[i].w / 2, CENTER_Y);
  }
  Bangle.drawWidgets();
  lastStr = str;
}

function drawChanged(str) {
  if (str.length !== lastStr.length) {
    drawFull(str);
    return;
  }
  setFont();
  g.setColor(COL_TIME).setBgColor(COL_BG);
  for (let i = 0; i < str.length; i++) {
    if (str[i] === lastStr[i]) {
      continue;
    }
    g.clearRect(cells[i].x, CENTER_Y - GLYPH_HALF_H,
      cells[i].x + cells[i].w - 1, CENTER_Y + GLYPH_HALF_H);
    g.drawString(str[i], cells[i].x + cells[i].w / 2, CENTER_Y);
  }
  lastStr = str;
}

// Display-side second tick while the app is foregrounded during a countdown.
// The engine ticks independently; this only mirrors its state on screen.
function pollTick() {
  redrawId = null;
  // re-issued each second of the countdown so the inactivity timeout can't blank the screen
  // default timeout is 30s
  Bangle.setLCDPower(1);
  const str = lib.timeStr(w.msLeft());
  if (str !== lastStr) {
    drawChanged(str);
  }
  if (w.isRunning()) {
    redrawId = setTimeout(pollTick, lib.nextSecondDelay(w.msLeft()));
  }
}

function refreshNow() {
  if (redrawId) {
    clearTimeout(redrawId);
    redrawId = null;
  }
  pollTick();
}

function onStartStop() {
  if (w.isRunning()) {
    w.stop();
  } else if (w.msLeft() > 0) {
    w.resume();
  } else {
    w.start(raceMs);
  }
  refreshNow();
}

function resetTimer() {
  if (w.msLeft() === raceMs) {
    // already reset and idle: button 3 cycles the sequence length instead
    durIdx = (durIdx + 1) % DURATIONS.length;
    saveConfig();
  } 

  raceMs = DURATIONS[durIdx] * 1000;
  w.reset(raceMs);
  refreshNow();
}

function onButton(n) {
  if (n === 1) {
    onStartStop();
  } else if (n === 3) {
    if (w.isRunning()) {
      w.roundRemaining();
      refreshNow();
    } else {
      resetTimer();
    }
  }
}

// setUI's btnRelease option is broken on B1 firmware (it re-invokes btn),
// so tap-vs-hold on BTN2 is measured with a private both-edge watch:
// e.lastTime is the time of the press edge.
function onBtn2(e) {
  if (!e.state && e.time - e.lastTime < BTN2_HOLD_S) {
    Bangle.showClock();
  }
}

function onRemove() {
  // only the display loop dies here; the widget keeps counting
  if (redrawId) {
    clearTimeout(redrawId);
    redrawId = null;
  }
  clearWatch(btn2WatchId);
  // allow widget to get garbage collected if necessary after the app is unloaded
  w = null;
}

// startup
Bangle.loadWidgets();
loadConfig();

w = WIDGETS && WIDGETS.sailracer;
if (!w) {
  throw "Widget couldn't be loaded";
}

raceMs = DURATIONS[durIdx] * 1000;

// show the selected duration on first boot / relaunch after finish,
// without disturbing a countdown resumed from persisted state
if (!w.isRunning() && w.msLeft() === 0) {
  w.reset(raceMs);
}

drawFull(lib.timeStr(w.msLeft()));
refreshNow();

btn2WatchId = setWatch(onBtn2, BTN2, { repeat: true, edge: "both" });

Bangle.setUI({
  mode: "custom",
  btn: onButton,
  remove: onRemove
});
