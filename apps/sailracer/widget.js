// Sail Race Timer countdown engine.
// Lives in a widget so its timers survive fast-load app switches; the app
// drives it through the exported API. Invisible: width 0, no drawing.

(() => {
  const lib = require("sailracerlib");
  
  let running = false;
  let endMs = 0;
  let remainMs = 0; // meaningful while paused
  let tickId = null;

  function persist() {
    lib.writeTimerState({ running: running, endMs: endMs, remainMs: remainMs });
  }

  function scheduleTick() {
    clearTimeout(tickId);
    tickId = setTimeout(tick, lib.nextSecondDelay(endMs - Date.now()));
  }

  function tick() {
    tickId = null;
    remainMs = endMs - Date.now();
    if (remainMs <= 0) {
      finish();
      return;
    }
    const b = lib.buzzFor(Math.ceil(remainMs / 1000));
    if (b) {
      lib.buzzTimes(b.n, b.ms);
    }
    scheduleTick();
  }

  function finish() {
    clearTimeout(tickId);
    tickId = null;
    running = false;
    remainMs = 0;
    persist();
    Bangle.buzz(lib.FINISH_BUZZ_MS);
  }

  WIDGETS.sailracer = {
    area: "tl",
    width: 0,
    draw: function() {},

    start(durationMs) {
      running = true;
      endMs = Date.now() + durationMs;
      persist();
      scheduleTick();
    },

    stop() {
      if (!running) return;
      clearTimeout(tickId);
      tickId = null;
      running = false;
      remainMs = Math.max(0, endMs - Date.now());
      persist();
    },

    resume() {
      if (running || remainMs <= 0) return;
      running = true;
      endMs = Date.now() + remainMs;
      persist();
      scheduleTick();
    },

    reset(durationMs) {
      clearTimeout(tickId);
      tickId = null;
      running = false;
      endMs = 0;
      remainMs = durationMs;
      persist();
    },

    roundRemaining(holdMs) {
      if (!running) return;
      // anchor to the press, not the release
      const press = Date.now() - holdMs;
      remainMs = Math.max(0, endMs - press);

      // don't round down to finish
      if (remainMs < 30 * 1000) {
        return;
      }

      // round remainMs to the nearest minute
      remainMs = Math.round(remainMs / 60000) * 60000;
      endMs = press + remainMs;

      persist();
      scheduleTick();
      lib.buzzTimes(1, lib.ROUND_BUZZ_MS);
    },

    isRunning() {
      return running;
    },

    msLeft() {
      return running ? Math.max(0, endMs - Date.now()) : remainMs;
    }
  };

  // Recovery after a reboot: resume a countdown that was active when the
  // watch died; one that expired while away takes the default finish path.
  const saved = lib.readTimerState();
  if (saved.running) {
    running = true;
    endMs = saved.endMs;
    if (endMs - Date.now() > 0) {
      scheduleTick();
    } else {
      finish();
    }
  } else {
    remainMs = saved.remainMs || 0;
  }
})();
