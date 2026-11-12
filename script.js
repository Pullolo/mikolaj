/* Retro arcade for Mikołaj:
   title → level select → 6 catch-the-hearts levels → treasures → note. */
(function () {
  "use strict";

  /* ═════════ EDIT: the six levels ═════════
     Rename them after your memories. Tuning knobs:
       goal   hearts to catch            lives  hits from storm clouds allowed
       speed  base falling speed         spawn  seconds between drops
       cloud  share of drops that are storm clouds (0–1)
       zig    sideways wobble of hearts  wind   gusts push everything sideways
       time   time limit in seconds (0 = none)
       small  smaller basket                                                  */
  var LEVELS = [
    { name: "First Hello",    diff: "EASY",      stars: 1, goal: 8,  lives: 3, speed: 60,  spawn: 1.0,  cloud: 0,    zig: 0,  wind: false, time: 0,  small: false,
      intro: "A gentle start.<br />Catch 8 hearts!" },
    { name: "Butterflies",    diff: "EASY",      stars: 2, goal: 10, lives: 3, speed: 70,  spawn: 0.9,  cloud: 0.15, zig: 26, wind: false, time: 0,  small: false,
      intro: "Hearts flutter side to side.<br />Catch 10, dodge the clouds!" },
    { name: "Rainy Day",      diff: "NORMAL",    stars: 3, goal: 12, lives: 3, speed: 85,  spawn: 0.75, cloud: 0.4,  zig: 0,  wind: false, time: 0,  small: false,
      intro: "Storm season!<br />Lots of clouds. Catch 12." },
    { name: "Windy Walk",     diff: "NORMAL",    stars: 3, goal: 12, lives: 3, speed: 80,  spawn: 0.8,  cloud: 0.25, zig: 0,  wind: true,  time: 0,  small: false,
      intro: "Gusts push everything around.<br />Watch the wind! Catch 12." },
    { name: "Racing Hearts",  diff: "HARD",      stars: 4, goal: 15, lives: 3, speed: 110, spawn: 0.55, cloud: 0.25, zig: 0,  wind: false, time: 35, small: false,
      intro: "Beat the clock!<br />15 hearts in 35 seconds." },
    { name: "Forever",        diff: "LOVE BOSS", stars: 5, goal: 20, lives: 3, speed: 115, spawn: 0.5,  cloud: 0.32, zig: 20, wind: true,  time: 0,  small: true,
      intro: "The final level.<br />Tiny basket, wind, wobble, storms.<br />Catch 20. I believe in you ♥" },
  ];

  var $ = function (id) { return document.getElementById(id); };

  /* ───────── Saved progress (per device) ───────── */
  var KEY = "mikolaj-arcade-v1";
  var save = { cleared: [false, false, false, false, false, false], opened: [false, false, false, false, false, false] };
  try {
    var raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw && raw.cleared && raw.opened) save = raw;
  } catch (e) { /* storage blocked: progress lasts for this visit only */ }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {}
  }
  function count(arr) { return arr.filter(Boolean).length; }
  function isUnlocked(i) { return i === 0 || save.cleared[i - 1]; }

  /* ───────── Screens ───────── */
  function show(id) {
    if (id !== "screen-game") stopGame();
    if (id === "screen-map") renderMap();
    if (id === "screen-treasures") renderTreasures();
    if (id === "screen-title") $("title-count").textContent = count(save.cleared) + "/6";
    Array.prototype.forEach.call(document.querySelectorAll(".screen"), function (s) {
      s.classList.toggle("is-active", s.id === id);
    });
    window.scrollTo(0, 0);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-go]");
    if (b) { beep(440, 0.05); show(b.getAttribute("data-go")); }
  });

  /* ───────── 8-bit sound ───────── */
  var audio = null;
  var soundOn = true;
  function beep(freq, dur, type, slide) {
    if (!soundOn) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var t = audio.currentTime;
      var o = audio.createOscillator();
      var g = audio.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + dur);
    } catch (e) { /* no audio, no problem */ }
  }
  function jingle(notes, step) {
    notes.forEach(function (f, i) {
      setTimeout(function () { beep(f, step / 1000 * 0.9); }, i * step);
    });
  }
  $("sound").addEventListener("click", function () {
    soundOn = !soundOn;
    this.setAttribute("aria-pressed", String(soundOn));
    this.setAttribute("aria-label", soundOn ? "Sound on" : "Sound off");
    this.textContent = soundOn ? "♪ ON" : "♪ OFF";
  });

  /* ───────── Title ───────── */
  $("start").addEventListener("click", function () {
    jingle([523, 659, 784, 1047], 90);
    show("screen-map");
  });
  $("go-treasures").addEventListener("click", function () {
    beep(660, 0.08);
    show("screen-treasures");
  });

  /* ───────── Level select ───────── */
  function stars(n) {
    var s = "";
    for (var i = 0; i < 5; i++) s += i < n ? "★" : "☆";
    return s;
  }
  function renderMap() {
    var ol = $("levels");
    ol.innerHTML = "";
    LEVELS.forEach(function (L, i) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      var open = isUnlocked(i);
      var done = save.cleared[i];
      b.type = "button";
      b.className = "level" + (done ? " is-cleared" : "") + (open ? "" : " is-locked");
      b.innerHTML =
        '<span class="level__num">' + (open ? i + 1 : "🔒") + "</span>" +
        '<span class="level__body">' +
          '<span class="level__name"></span>' +
          '<span class="level__meta"><span class="level__stars">' + stars(L.stars) + "</span> " + L.diff + "</span>" +
        "</span>" +
        '<span class="level__state">' + (done ? "✓ CLEAR" : open ? "▶ PLAY" : "LOCKED") + "</span>";
      b.querySelector(".level__name").textContent = open ? L.name : "???";
      b.setAttribute("aria-label",
        "Level " + (i + 1) + ", " + (open ? L.name : "locked") + ", difficulty " + L.diff +
        (done ? ", cleared" : open ? "" : ". Beat level " + i + " first"));
      b.addEventListener("click", function () {
        if (!open) {
          beep(150, 0.15, "sawtooth");
          b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
          return;
        }
        beep(880, 0.08);
        loadLevel(i);
        show("screen-game");
      });
      li.appendChild(b);
      ol.appendChild(li);
    });
  }

  /* ───────── The game: catch the hearts ───────── */
  var PX = 3;
  var canvas = $("game");
  var ctx = canvas.getContext("2d");
  var W = canvas.width, H = canvas.height;

  // Sprites: each char is one pixel. "." = transparent.
  var PAL = { p: "#ff5c9d", d: "#b8226a", w: "#ffffff", g: "#5a5a7a", k: "#33334d", y: "#ffd23f", b: "#8b4a2b", n: "#4d2614", c: "#5ce1e6" };
  var HEART = [
    ".pp.pp.",
    "pwpppdp",
    "ppppppd",
    ".ppppd.",
    "..ppd..",
    "...d...",
  ];
  var CLOUD = [
    "..ggg...",
    ".gggggg.",
    "gggkgggg",
    "kkkkkkkk",
    "...yy...",
    "..yy....",
    "...y....",
  ];
  var BASKET = [
    "c..........c",
    "bnbnbnbnbnbn",
    "nbnbnbnbnbnb",
    ".bnbnbnbnbn.",
    "..nnnnnnnn..",
  ];
  var BASKET_SMALL = [
    "c......c",
    "bnbnbnbn",
    "nbnbnbnb",
    ".bnbnbn.",
    "..nnnn..",
  ];

  function draw(sprite, x, y) {
    for (var r = 0; r < sprite.length; r++) {
      for (var c = 0; c < sprite[r].length; c++) {
        var ch = sprite[r][c];
        if (ch === ".") continue;
        ctx.fillStyle = PAL[ch];
        ctx.fillRect(Math.round(x + c * PX), Math.round(y + r * PX), PX, PX);
      }
    }
  }

  var lvl = 0, L = LEVELS[0];
  var player = { sprite: BASKET, w: 0, h: 0, x: 0, y: 0, tx: null };
  var items = [], score, lives, timeLeft, clock, wind, running = false, last, spawnIn, keys = {}, raf = null, flash = 0;

  function loadLevel(i) {
    lvl = i;
    L = LEVELS[i];
    $("game-title").textContent = "LEVEL " + (i + 1) + ": " + L.name.toUpperCase();
    $("game-sub").textContent = stars(L.stars) + " " + L.diff;
    $("hud-goal").textContent = L.goal;
    $("hud-time").hidden = !L.time;
    player.sprite = L.small ? BASKET_SMALL : BASKET;
    player.w = player.sprite[0].length * PX;
    player.h = player.sprite.length * PX;
    resetRun();
    overlay("LEVEL " + (i + 1), L.intro + "<br /><br />" + controlsHint(), "PLAY", startGame);
  }

  function controlsHint() {
    return '<span class="only-touch">Drag your finger to move.</span>' +
           '<span class="only-mouse">Use ← → or the mouse.</span>';
  }

  function resetRun() {
    stopGame();
    items = [];
    score = 0;
    lives = L.lives;
    timeLeft = L.time;
    clock = 0;
    wind = 0;
    spawnIn = 0.3;
    flash = 0;
    player.x = (W - player.w) / 2;
    player.y = H - player.h - 10;
    player.tx = null;
    hud();
    render();
  }

  var ovMain = null, ovAlt = null;
  function overlay(title, html, mainLabel, mainFn, altLabel, altFn) {
    $("overlay-title").textContent = title;
    $("overlay-text").innerHTML = html || "";
    $("ov-main").textContent = mainLabel;
    ovMain = mainFn;
    $("ov-alt").hidden = !altLabel;
    $("ov-alt").textContent = altLabel || "";
    ovAlt = altFn || null;
    $("overlay").hidden = false;
  }
  $("ov-main").addEventListener("click", function () { if (ovMain) ovMain(); });
  $("ov-alt").addEventListener("click", function () { if (ovAlt) ovAlt(); });

  function hud() {
    $("hud-score").textContent = score;
    var l = "";
    for (var i = 0; i < L.lives; i++) l += i < lives ? "♥" : "♡";
    $("hud-lives").textContent = l;
    $("hud-lives").setAttribute("aria-label", lives + " lives left");
    if (L.time) $("hud-secs").textContent = Math.ceil(timeLeft);
  }

  function startGame() {
    $("overlay").hidden = true;
    running = true;
    last = performance.now();
    beep(880, 0.1);
    raf = requestAnimationFrame(loop);
  }
  function retry() { resetRun(); startGame(); }

  function stopGame() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function spawn() {
    var bad = score > 0 && Math.random() < L.cloud;
    var sprite = bad ? CLOUD : HEART;
    var w = sprite[0].length * PX;
    var x = 4 + Math.random() * (W - w - 8);
    items.push({
      bad: bad,
      sprite: sprite,
      w: w,
      h: sprite.length * PX,
      x: x,
      bx: x,
      y: -24,
      t: Math.random() * 6,
      vy: L.speed + score * (L.speed * 0.04) + Math.random() * 35,
    });
  }

  function loop(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    if (running) raf = requestAnimationFrame(loop);
  }

  function update(dt) {
    clock += dt;

    if (L.time) {
      timeLeft -= dt;
      $("hud-secs").textContent = Math.max(0, Math.ceil(timeLeft));
      if (timeLeft <= 0) return lose("Time's up!");
    }

    // Wind: a slow gust that swings left and right.
    wind = L.wind ? Math.sin(clock * 0.7) * 55 + Math.sin(clock * 1.9) * 15 : 0;

    var speed = 220;
    if (keys.left) player.x -= speed * dt;
    if (keys.right) player.x += speed * dt;
    if (player.tx !== null) {
      var target = player.tx - player.w / 2;
      player.x += (target - player.x) * Math.min(1, dt * 18);
    }
    player.x = Math.max(0, Math.min(W - player.w, player.x));

    spawnIn -= dt;
    if (spawnIn <= 0) {
      spawn();
      spawnIn = Math.max(L.spawn * 0.6, L.spawn - score * 0.02) + Math.random() * 0.3;
    }

    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i];
      it.t += dt;
      it.y += it.vy * dt;
      it.bx += wind * dt;
      it.x = it.bx + (!it.bad && L.zig ? Math.sin(it.t * 3) * L.zig : 0);
      if (it.x < 0) { it.bx -= it.x; it.x = 0; }
      if (it.x > W - it.w) { it.bx -= it.x - (W - it.w); it.x = W - it.w; }

      var hit =
        it.y + it.h >= player.y + 2 &&
        it.y <= player.y + player.h &&
        it.x + it.w >= player.x + 2 &&
        it.x <= player.x + player.w - 2;
      if (hit) {
        items.splice(i, 1);
        if (it.bad) {
          lives--;
          flash = 0.25;
          beep(180, 0.3, "sawtooth", 60);
        } else {
          score++;
          beep(660 + score * 30, 0.08);
        }
        hud();
        if (lives <= 0) return lose("The storm got you!");
        if (score >= L.goal) return win();
      } else if (it.y > H) {
        items.splice(i, 1);
      }
    }
    if (flash > 0) flash -= dt;
  }

  function render() {
    ctx.fillStyle = "#0b0620";
    ctx.fillRect(0, 0, W, H);
    // pixel stars
    ctx.fillStyle = "#3a2d7a";
    for (var s = 0; s < 30; s++) ctx.fillRect((s * 53) % W, (s * 97) % (H - 40), 2, 2);
    // wind streaks
    if (L.wind && Math.abs(wind) > 8) {
      ctx.fillStyle = "rgba(92,225,230,.35)";
      var len = Math.min(40, Math.abs(wind) * 0.6);
      for (var k = 0; k < 7; k++) {
        var wy = 30 + k * 37;
        var wx = ((clock * wind * 2 + k * 71) % (W + 60) + W + 60) % (W + 60) - 30;
        ctx.fillRect(wx, wy, len, 2);
      }
      ctx.fillStyle = "#5ce1e6";
      ctx.font = "10px monospace";
      ctx.fillText(wind > 0 ? "WIND »" : "« WIND", wind > 0 ? W - 52 : 6, 14);
    }
    // ground
    ctx.fillStyle = "#1f1450";
    ctx.fillRect(0, H - 8, W, 8);
    ctx.fillStyle = "#ff5c9d";
    for (var g = 0; g < W; g += 12) ctx.fillRect(g, H - 8, 6, 2);

    items.forEach(function (it) { draw(it.sprite, it.x, it.y); });
    draw(player.sprite, player.x, player.y);

    if (flash > 0) {
      ctx.fillStyle = "rgba(255,40,80,.35)";
      ctx.fillRect(0, 0, W, H);
    }
  }

  function lose(why) {
    stopGame();
    jingle([392, 330, 262, 196], 140);
    overlay("GAME OVER",
      why + "<br />Caught " + score + " of " + L.goal + " hearts.<br /><br />Try again, my love ♥",
      "RETRY", retry,
      "◀ LEVELS", function () { show("screen-map"); });
  }

  function win() {
    stopGame();
    var first = !save.cleared[lvl];
    save.cleared[lvl] = true;
    persist();
    jingle([523, 659, 784, 1047, 784, 1047], 110);
    var last = lvl === LEVELS.length - 1;
    var msg = (first ? "Treasure #" + (lvl + 1) + " unlocked!" : "Treasure #" + (lvl + 1) + " is yours.") +
      (last ? "<br /><br />You beat every level ♥" : "");
    var goTreasures = function () { show("screen-treasures"); };
    var next = function () { loadLevel(lvl + 1); };
    if (last) overlay("LEVEL CLEAR!", msg, "★ TREASURES", goTreasures, "◀ LEVELS", function () { show("screen-map"); });
    else overlay("LEVEL CLEAR!", msg, "NEXT LEVEL ▶", next, "★ TREASURES", goTreasures);
  }

  // Controls: pointer (touch + mouse) and keyboard
  function pointerX(e) {
    var r = canvas.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * W;
  }
  canvas.addEventListener("pointerdown", function (e) {
    player.tx = pointerX(e);
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", function (e) {
    if (e.pointerType === "mouse" || e.buttons || e.pressure > 0) player.tx = pointerX(e);
  });
  canvas.addEventListener("pointerleave", function (e) {
    if (e.pointerType === "mouse") player.tx = null;
  });

  document.addEventListener("keydown", function (e) {
    if (!$("viewer").hidden) {
      if (e.key === "Escape") closeViewer();
      return;
    }
    if (!$("screen-game").classList.contains("is-active")) return;
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { keys.left = true; player.tx = null; e.preventDefault(); }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { keys.right = true; player.tx = null; e.preventDefault(); }
    if ((e.key === "Enter" || e.key === " ") && !$("overlay").hidden &&
        document.activeElement !== $("ov-main") && document.activeElement !== $("ov-alt")) {
      e.preventDefault();
      if (ovMain) ovMain();
    }
  });
  document.addEventListener("keyup", function (e) {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
  });

  // Pause if the tab is hidden mid-game
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && running) {
      stopGame();
      overlay("PAUSED", "Take a breath ♥", "RESUME", startGame);
    }
  });

  /* ───────── Treasures ───────── */
  var chests = document.querySelectorAll(".chest");

  // Drawn on the fly if an img/N.png file is missing.
  function placeholder(n) {
    var c = document.createElement("canvas");
    c.width = 240; c.height = 240;
    var x = c.getContext("2d");
    x.fillStyle = "#1f1450"; x.fillRect(0, 0, 240, 240);
    x.fillStyle = "#ff5c9d";
    for (var i = 0; i < 240; i += 24) { x.fillRect(i, 0, 12, 6); x.fillRect(i + 12, 234, 12, 6); }
    x.fillStyle = "#ffd23f"; x.font = "bold 72px monospace"; x.textAlign = "center";
    x.fillText(String(n).padStart(2, "0"), 120, 120);
    x.fillStyle = "#fff"; x.font = "16px monospace";
    x.fillText("img/" + n + ".png", 120, 170);
    return c.toDataURL("image/png");
  }

  function withImage(i, cb) {
    var chest = chests[i];
    if (chest.getAttribute("data-shown")) return cb(chest.getAttribute("data-shown"));
    var src = chest.getAttribute("data-src");
    var img = new Image();
    img.onload = function () { chest.setAttribute("data-shown", src); cb(src); };
    img.onerror = function () { var p = placeholder(i + 1); chest.setAttribute("data-shown", p); cb(p); };
    img.src = src;
  }

  function paintChest(i) {
    var chest = chests[i];
    var cap = chest.getAttribute("data-cap") || "";
    var lockedNow = !save.cleared[i];
    chest.classList.toggle("is-locked", lockedNow);
    chest.classList.toggle("is-open", !lockedNow && save.opened[i]);
    chest.querySelector(".chest__label").textContent = lockedNow ? "LV " + (i + 1) : String(i + 1).padStart(2, "0");
    if (lockedNow) {
      chest.style.backgroundImage = "";
      chest.setAttribute("aria-label", "Treasure " + (i + 1) + ", locked. Beat level " + (i + 1) + " to unlock.");
    } else if (save.opened[i]) {
      withImage(i, function (url) { chest.style.backgroundImage = 'url("' + url + '")'; });
      chest.setAttribute("aria-label", cap + " (opened)");
    } else {
      chest.style.backgroundImage = "";
      chest.setAttribute("aria-label", "Treasure " + (i + 1) + ", unlocked. Tap to open.");
    }
  }

  function renderTreasures() {
    for (var i = 0; i < chests.length; i++) paintChest(i);
    var u = count(save.cleared), o = count(save.opened);
    $("unlocked").textContent = u;
    $("opened").textContent = o;
    $("treasures-sub").textContent =
      u === 0 ? "Beat a level to unlock its treasure." :
      o < u ? "You have treasure waiting. Tap to open!" :
      u < 6 ? "Beat more levels to unlock the rest." : "Every treasure is yours ♥";
    $("note").hidden = o < 6;
    $("toast").textContent = "";
  }

  function openViewer(src, cap) {
    $("viewer-img").src = src;
    $("viewer-img").alt = cap;
    $("viewer-cap").textContent = cap;
    $("viewer").hidden = false;
    $("viewer-close").focus();
  }
  function closeViewer() {
    $("viewer").hidden = true;
    if (count(save.opened) === 6 && $("note").hidden) revealNote();
  }
  $("viewer-close").addEventListener("click", closeViewer);
  $("viewer").addEventListener("click", function (e) { if (e.target === this) closeViewer(); });

  function revealNote() {
    $("note").hidden = false;
    jingle([784, 988, 1175, 1568], 150);
    setTimeout(function () { $("note").scrollIntoView({ behavior: "smooth", block: "center" }); }, 50);
  }

  Array.prototype.forEach.call(chests, function (chest, i) {
    chest.addEventListener("click", function () {
      var cap = chest.getAttribute("data-cap") || "";
      if (!save.cleared[i]) {
        beep(150, 0.15, "sawtooth");
        $("toast").textContent = "🔒 Beat Level " + (i + 1) + " to unlock this one!";
        chest.classList.remove("shake"); void chest.offsetWidth; chest.classList.add("shake");
        return;
      }
      $("toast").textContent = "";
      var firstTime = !save.opened[i];
      withImage(i, function (url) {
        if (firstTime) {
          save.opened[i] = true;
          persist();
          beep(523, 0.08); setTimeout(function () { beep(1047, 0.15); }, 80);
          paintChest(i);
          $("opened").textContent = count(save.opened);
        }
        openViewer(url, cap);
      });
    });
  });

  $("reset").addEventListener("click", function () {
    if (!window.confirm("Reset all levels and treasures?")) return;
    save = { cleared: [false, false, false, false, false, false], opened: [false, false, false, false, false, false] };
    persist();
    renderTreasures();
    $("title-count").textContent = "0/6";
  });

  $("title-count").textContent = count(save.cleared) + "/6";
  loadLevel(0);
})();
