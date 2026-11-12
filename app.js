/* ════════════════════════════════════════════════════════════
   Screens, sound, the cartridge slot and the vault.
   ════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var $ = function (sel, root) {
    return (root || document).querySelector(sel);
  };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  var REDUCED =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── tiny storage wrapper (private mode can throw) ──────── */

  var store = {
    get: function (k, fallback) {
      try {
        var v = localStorage.getItem("mikolaj." + k);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem("mikolaj." + k, JSON.stringify(v));
      } catch (e) {
        /* nothing to do — the page works without it */
      }
    }
  };

  /* ── sound: a few square-wave blips, no files needed ────── */

  var audio = (function () {
    var ctx = null;
    var on = store.get("sfx", true);

    function ensure() {
      if (ctx) return ctx;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
      } catch (e) {
        ctx = null;
      }
      return ctx;
    }

    function tone(freq, dur, type, vol, delay) {
      if (!on) return;
      var c = ensure();
      if (!c) return;
      if (c.state === "suspended" && c.resume) c.resume();
      var t0 = c.currentTime + (delay || 0);
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = type || "square";
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol || 0.06, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }

    return {
      isOn: function () {
        return on;
      },
      toggle: function () {
        on = !on;
        store.set("sfx", on);
        if (on) tone(880, 0.08);
        return on;
      },
      play: function (kind) {
        switch (kind) {
          case "select":
            tone(660, 0.07);
            tone(990, 0.09, "square", 0.05, 0.06);
            break;
          case "good":
            tone(880, 0.06);
            tone(1320, 0.07, "square", 0.05, 0.05);
            break;
          case "bad":
            tone(160, 0.18, "sawtooth", 0.07);
            break;
          case "open":
            tone(523, 0.07);
            tone(784, 0.08, "square", 0.05, 0.06);
            tone(1046, 0.12, "square", 0.05, 0.12);
            break;
          case "win":
            [523, 659, 784, 1046, 1318].forEach(function (f, i) {
              tone(f, 0.13, "square", 0.06, i * 0.1);
            });
            break;
          case "lose":
            [440, 370, 294, 220].forEach(function (f, i) {
              tone(f, 0.16, "sawtooth", 0.06, i * 0.12);
            });
            break;
        }
      }
    };
  })();

  var soundBtn = $("#sound-toggle");
  function paintSound() {
    var on = audio.isOn();
    soundBtn.setAttribute("aria-pressed", String(on));
    $(".sound__text", soundBtn).textContent = on ? "SFX ON" : "SFX OFF";
    $(".sound__icon", soundBtn).textContent = on ? "♪" : "✕";
  }
  soundBtn.addEventListener("click", function () {
    audio.toggle();
    paintSound();
  });
  paintSound();

  /* ── screens ────────────────────────────────────────────── */

  var screens = {
    title: $("#screen-title"),
    game: $("#screen-game"),
    vault: $("#screen-vault")
  };
  var current = "title";

  function show(name) {
    if (!screens[name]) return;
    if (name === "vault" && !unlocked) name = "game";

    Object.keys(screens).forEach(function (key) {
      var el = screens[key];
      var active = key === name;
      el.classList.toggle("is-active", active);
      if (active) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    });

    if (current === "game" && name !== "game") game.abort();
    current = name;
    window.scrollTo(0, 0);

    if (name === "game") paintOverlay();
  }

  $$("[data-goto]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      audio.play("select");
      show(btn.getAttribute("data-goto"));
    });
  });

  /* ── title: typewriter greeting ─────────────────────────── */

  (function typewriter() {
    var lines = $$(".greeting__line");
    if (REDUCED) {
      lines.forEach(function (el) {
        el.textContent = el.getAttribute("data-type");
      });
      return;
    }
    var li = 0;
    function typeLine() {
      if (li >= lines.length) return;
      var el = lines[li];
      var text = el.getAttribute("data-type");
      var ci = 0;
      el.classList.add("is-typing");
      (function tick() {
        el.textContent = text.slice(0, ci);
        if (ci++ <= text.length) {
          setTimeout(tick, 58);
        } else {
          el.classList.remove("is-typing");
          li++;
          setTimeout(typeLine, 180);
        }
      })();
    }
    typeLine();
  })();

  /* ── title: the cartridge slot ──────────────────────────── */

  var slotArt = $("#slot-art");
  (function loadSlotIcon() {
    var img = new Image();
    img.alt = "";
    img.onload = function () {
      slotArt.classList.add("has-img");
      slotArt.innerHTML = "";
      slotArt.appendChild(img);
      var file = document.querySelector(".slot__file");
      if (file) file.hidden = true; /* the filename hint has done its job */
    };
    img.onerror = function () {
      /* keep the "?" placeholder — nothing to do */
    };
    img.src = "img/icon.png";
  })();

  $("#start-slot").addEventListener("click", function () {
    audio.play("select");
    show("game");
  });

  /* ── the game ───────────────────────────────────────────── */

  var unlocked = store.get("unlocked", false);

  var hudScore = $("#hud-score");
  var hudLives = $("#hud-lives");
  var overlay = $("#game-overlay");
  var overlayTitle = $("#overlay-title");
  var overlayText = $("#overlay-text");
  var overlayBtn = $("#overlay-btn");

  /* a second action button, used after a win */
  var overlayBtn2 = document.createElement("button");
  overlayBtn2.type = "button";
  overlayBtn2.className = "btn";
  overlayBtn2.hidden = true;
  overlayBtn.parentNode.insertBefore(overlayBtn2, overlayBtn.nextSibling);

  $("#hud-goal").textContent = window.HeartCatch.CFG.GOAL;

  var game = window.HeartCatch.create($("#game"), {
    onScore: function (n) {
      hudScore.textContent = n;
    },
    onLives: function (n) {
      hudLives.textContent = n > 0 ? new Array(n + 1).join("♥") : "—";
    },
    onWin: function () {
      unlocked = true;
      store.set("unlocked", true);
      paintOverlay("won");
    },
    onLose: function () {
      paintOverlay("lost");
    },
    onSfx: function (kind) {
      audio.play(kind);
    }
  });

  function paintOverlay(result) {
    overlay.hidden = false;
    overlayBtn2.hidden = true;

    if (result === "won") {
      overlayTitle.textContent = "★ YOU WIN ★";
      overlayText.innerHTML = "All twelve. The vault is open.";
      overlayBtn.textContent = "OPEN THE VAULT";
      overlayBtn.onclick = function () {
        audio.play("select");
        show("vault");
      };
      overlayBtn2.hidden = false;
      overlayBtn2.textContent = "PLAY AGAIN";
      overlayBtn2.onclick = startGame;
      return;
    }

    if (result === "lost") {
      overlayTitle.textContent = "GAME OVER";
      overlayText.innerHTML = "The spiky ones got you.<br />Try again?";
      overlayBtn.textContent = "RETRY";
      overlayBtn.onclick = startGame;
      if (unlocked) {
        overlayBtn2.hidden = false;
        overlayBtn2.textContent = "TO THE VAULT";
        overlayBtn2.onclick = function () {
          audio.play("select");
          show("vault");
        };
      }
      return;
    }

    /* idle */
    overlayTitle.textContent = "HEART CATCH";
    overlayText.innerHTML =
      "Catch <b>" +
      window.HeartCatch.CFG.GOAL +
      "</b> hearts.<br />Dodge the spiky ones.";
    overlayBtn.textContent = unlocked ? "PLAY AGAIN" : "START";
    overlayBtn.onclick = startGame;
    if (unlocked) {
      overlayBtn2.hidden = false;
      overlayBtn2.textContent = "TO THE VAULT";
      overlayBtn2.onclick = function () {
        audio.play("select");
        show("vault");
      };
    }
  }

  function startGame() {
    audio.play("select");
    overlay.hidden = true;
    game.start();
  }

  overlayBtn.onclick = startGame;

  /* controls */
  document.addEventListener("keydown", function (e) {
    if (current === "game" && viewer.hidden) game.onKeyDown(e);
  });
  document.addEventListener("keyup", function (e) {
    if (current === "game" && viewer.hidden) game.onKeyUp(e);
  });

  $$(".pad__btn").forEach(function (btn) {
    var dir = parseInt(btn.getAttribute("data-dir"), 10);
    var press = function (e) {
      e.preventDefault();
      game.setDir(dir);
    };
    var release = function () {
      game.setDir(0);
    };
    btn.addEventListener("pointerdown", press);
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointerleave", release);
    btn.addEventListener("pointercancel", release);
  });

  /* don't let the game run on in a background tab */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) game.pause();
    else if (current === "game") game.resume();
  });

  /* ── the vault ──────────────────────────────────────────── */

  var tiles = $$(".tile");
  var vaultDone = $("#vault-done");
  var revealed = store.get("revealed", []);

  function missingNode(src) {
    var box = document.createElement("span");
    box.className = "tile__missing";
    var name = document.createElement("b");
    name.textContent = src;
    var note = document.createElement("span");
    note.textContent = "drop this PNG in, then tap again";
    box.appendChild(name);
    box.appendChild(note);
    return box;
  }

  function clearTileContent(tile) {
    $$("img, .tile__missing", tile).forEach(function (el) {
      el.parentNode.removeChild(el);
    });
  }

  function reveal(tile, index, silent) {
    var src = tile.getAttribute("data-src");
    var caption = tile.getAttribute("data-caption") || "";
    var img = new Image();
    img.alt = caption;

    img.onload = function () {
      clearTileContent(tile);
      tile.appendChild(img);
      tile.classList.add("is-open");
      tile.dataset.ready = "1";
      finishReveal(index, silent);
    };
    img.onerror = function () {
      clearTileContent(tile);
      tile.appendChild(missingNode(src));
      tile.classList.add("is-open");
      tile.dataset.ready = "";
      finishReveal(index, silent);
    };
    img.src = src;
  }

  function finishReveal(index, silent) {
    if (!silent) audio.play("open");
    if (revealed.indexOf(index) === -1) {
      revealed.push(index);
      store.set("revealed", revealed);
    }
    vaultDone.hidden = revealed.length < tiles.length;
  }

  tiles.forEach(function (tile, index) {
    tile.addEventListener("click", function () {
      if (tile.dataset.ready === "1") {
        openViewer(
          tile.getAttribute("data-src"),
          tile.getAttribute("data-caption")
        );
        return;
      }
      /* not open yet, or opened onto a PNG that wasn't there — (re)try */
      reveal(tile, index, false);
    });

    if (revealed.indexOf(index) !== -1) reveal(tile, index, true);
  });

  /* ── full-size viewer ───────────────────────────────────── */

  var viewer = $("#viewer");
  var viewerImg = $("#viewer-img");
  var viewerCap = $("#viewer-cap");
  var lastFocus = null;

  function openViewer(src, caption) {
    lastFocus = document.activeElement;
    viewerImg.src = src;
    viewerImg.alt = caption || "";
    viewerCap.textContent = caption || "";
    viewer.hidden = false;
    document.body.style.overflow = "hidden";
    $(".viewer__close", viewer).focus();
    audio.play("select");
  }

  function closeViewer() {
    viewer.hidden = true;
    viewerImg.src = "";
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  viewer.addEventListener("click", function (e) {
    if (e.target === viewer || e.target.closest(".viewer__close")) closeViewer();
  });

  document.addEventListener("keydown", function (e) {
    if (viewer.hidden) return;
    if (e.key === "Escape") closeViewer();
    if (e.key === "Tab") {
      e.preventDefault();
      $(".viewer__close", viewer).focus();
    }
  });

  /* ── boot ───────────────────────────────────────────────── */

  paintOverlay();
  show("title");

  /* exposed for quick manual checks in the console */
  window.__arcade = {
    game: game,
    show: show,
    unlock: function () {
      unlocked = true;
      store.set("unlocked", true);
      paintOverlay();
    }
  };
})();
