// Shared constants and helpers for the Sail Race Timer app and widget.
// Installed as Storage module "sailracerlib".

const CFG_FILE = "sailracer.json";
const DEFAULT_DURATIONS = [240, 300, 360];
const TIMER_FILE = "sailracer.timer.json";

const BUZZ_GAP_MS = 75;
const FINISH_BUZZ_MS = 1000;
const MARK_BUZZES = 5;
const MARK_BUZZ_MS = 50;
const WARN_SECONDS = 3;
const WARN_BUZZ_MS = 75;
const ROUND_BUZZ_MS = 200;

function fmt(s) {
  return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
}

function timeStr(msLeft) {
  return fmt(Math.ceil(msLeft / 1000));
}

// Millisecond delay to the next whole-second boundary of the countdown,
// given msLeft. Used by both the widget engine and the app's display loop.
function nextSecondDelay(msLeft) {
  if (msLeft > 1000) {
    return (msLeft % 1000) || 1000;
  }
  return Math.max(0, msLeft);
}

// Buzz sequence for the given whole seconds left, or null for none.
function buzzFor(secsLeft) {
  const rem = secsLeft % 60;
  if (rem === 0 && secsLeft >= 60) {
    return { n: MARK_BUZZES, ms: MARK_BUZZ_MS };
  }
  if (rem <= WARN_SECONDS) {
    return { n: rem, ms: WARN_BUZZ_MS };
  }
  return null;
}

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

function buzzTimes(numTimes, duration) {
  let p = Promise.resolve();
  for (let i = 0; i < numTimes; i++) {
    p = p
      .then(() => Bangle.buzz(duration))
      .then(() => sleep(BUZZ_GAP_MS))
  }
  return p;
}

function readTimerState() {
  const s = require("Storage").readJSON(TIMER_FILE, 1);
  if (!s || typeof s !== "object" || !s.running) {
    return { running: false, endMs: 0, remainMs: s ? s.remainMs : 0 };
  }
  return s;
}

function writeTimerState(state) {
  require("Storage").writeJSON(TIMER_FILE, state);
}

module.exports = {
  CFG_FILE: CFG_FILE,
  DEFAULT_DURATIONS: DEFAULT_DURATIONS,
  FINISH_BUZZ_MS: FINISH_BUZZ_MS,
  ROUND_BUZZ_MS: ROUND_BUZZ_MS,
  fmt: fmt,
  timeStr: timeStr,
  nextSecondDelay: nextSecondDelay,
  buzzFor: buzzFor,
  sleep: sleep,
  buzzTimes: buzzTimes,
  readTimerState: readTimerState,
  writeTimerState: writeTimerState
};
