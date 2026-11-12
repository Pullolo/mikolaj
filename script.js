/* Retro arcade for Mikołaj: title → catch-the-hearts → six treasure chests → note. */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  /* ───────── Screens ───────── */
  function show(id) {
    Array.prototype.forEach.call(document.querySelectorAll(".screen"), function (s) {
      s.classList.toggle("is-active", s.id === id);
    });
    window.scrollTo(0, 0);
  }

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
    resetGame();
    show("screen-game");
  });
  $("back-title").addEventListener("click", function () {
    stopGame();
    show("screen-title");
  });

  /* ───────── Mini-game: catch the hearts ───────── */
  var GOAL = 12, LIVES = 3, PX = 3;
  var canvas = $("game");
  var ctx = canvas.getContext("2d");
  var W = canvas.width, H = canvas.height;
  $("hud-goal").textContent = GOAL;

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

  function draw(sprite, x, y, px) {
    px = px || PX;
    for (var r = 0; r < sprite.length; r++) {
      for (var c = 0; c < sprite[r].length; c++) {
        var ch = sprite[r][c];
        if (ch === ".") continue;
        ctx.fillStyle = PAL[ch];
        ctx.fillRect(Math.round(x + c * px), Math.round(y + r * px), px, px);
      }
    }
  }

  var player = { w: BASKET[0].length * PX, h: BASKET.length * PX, x: 0, y: 0, tx: null };
  var items, score, lives, running, last, spawnIn, keys = {}, raf = null, flash = 0;

  function resetGame() {
    stopGame();
    items = [];
    score = 0;
    lives = LIVES;
    spawnIn = 0;
    flash = 0;
    player.x = (W - player.w) / 2;
    player.y = H - player.h - 10;
    player.tx = null;
    hud();
    overlay("READY?", null, "PLAY");
    render();
  }

  function overlay(title, html, btn) {
    $("overlay-title").textContent = title;
    if (html) $("overlay-text").innerHTML = html;
    $("play").textContent = btn;
    $("overlay").hidden = false;
  }

  function hud() {
    $("hud-score").textContent = score;
    var l = "";
    for (var i = 0; i < LIVES; i++) l += i < lives ? "♥" : "♡";
    $("hud-lives").textContent = l;
    $("hud-lives").setAttribute("aria-label", lives + " lives left");
  }

  function startGame() {
    if (lives <= 0 || score >= GOAL) resetGame();
    $("overlay").hidden = true;
    running = true;
    last = performance.now();
    beep(880, 0.1);
    raf = requestAnimationFrame(loop);
  }

  function stopGame() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  $("play").addEventListener("click", startGame);

  function spawn() {
    var bad = score > 1 && Math.random() < 0.3 + score * 0.01;
    var sprite = bad ? CLOUD : HEART;
    var w = sprite[0].length * PX;
    items.push({
      bad: bad,
      sprite: sprite,
      w: w,
      h: sprite.length * PX,
      x: 4 + Math.random() * (W - w - 8),
      y: -24,
      vy: 70 + score * 6 + Math.random() * 40,
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
      spawnIn = Math.max(0.45, 1.0 - score * 0.04) + Math.random() * 0.3;
    }

    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i];
      it.y += it.vy * dt;
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
          beep(660 + score * 40, 0.08);
        }
        hud();
        if (lives <= 0) return lose();
        if (score >= GOAL) return win();
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
    // ground
    ctx.fillStyle = "#1f1450";
    ctx.fillRect(0, H - 8, W, 8);
    ctx.fillStyle = "#ff5c9d";
    for (var g = 0; g < W; g += 12) ctx.fillRect(g, H - 8, 6, 2);

    if (items) items.forEach(function (it) { draw(it.sprite, it.x, it.y); });
    draw(BASKET, player.x, player.y);

    if (flash > 0) {
      ctx.fillStyle = "rgba(255,40,80,.35)";
      ctx.fillRect(0, 0, W, H);
    }
  }

  function lose() {
    stopGame();
    jingle([392, 330, 262, 196], 140);
    overlay("GAME OVER", "The storm got you!<br />Caught " + score + " of " + GOAL + " hearts.<br /><br />Try again, my love ♥", "RETRY");
  }

  function win() {
    stopGame();
    jingle([523, 659, 784, 1047, 784, 1047], 110);
    setTimeout(function () { show("screen-rewards"); }, 500);
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
    if ((e.key === "Enter" || e.key === " ") && !$("overlay").hidden && document.activeElement !== $("play")) {
      e.preventDefault();
      startGame();
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
      overlay("PAUSED", "Take a breath ♥", "RESUME");
    }
  });

  /* ───────── Rewards ───────── */
  var chests = document.querySelectorAll(".chest");
  var opened = 0;

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

  function openViewer(src, cap) {
    $("viewer-img").src = src;
    $("viewer-img").alt = cap;
    $("viewer-cap").textContent = cap;
    $("viewer").hidden = false;
    $("viewer-close").focus();
  }
  function closeViewer() {
    $("viewer").hidden = true;
    if (opened === chests.length && $("note").hidden) revealNote();
  }
  $("viewer-close").addEventListener("click", closeViewer);
  $("viewer").addEventListener("click", function (e) { if (e.target === this) closeViewer(); });

  function revealNote() {
    $("note").hidden = false;
    jingle([784, 988, 1175, 1568], 150);
    setTimeout(function () { $("note").scrollIntoView({ behavior: "smooth", block: "center" }); }, 50);
  }

  Array.prototype.forEach.call(chests, function (chest, idx) {
    chest.addEventListener("click", function () {
      var cap = chest.getAttribute("data-cap") || "";
      if (chest.classList.contains("is-open")) {
        openViewer(chest.getAttribute("data-shown"), cap);
        return;
      }
      var src = chest.getAttribute("data-src");
      var img = new Image();
      img.onload = function () { reveal(src); };
      img.onerror = function () { reveal(placeholder(idx + 1)); };
      img.src = src;

      function reveal(url) {
        chest.classList.add("is-open");
        chest.setAttribute("data-shown", url);
        chest.style.backgroundImage = 'url("' + url + '")';
        chest.setAttribute("aria-label", cap + " (opened)");
        opened++;
        $("opened").textContent = opened;
        beep(523, 0.08); setTimeout(function () { beep(1047, 0.15); }, 80);
        openViewer(url, cap);
      }
    });
  });

  $("replay").addEventListener("click", function () {
    resetGame();
    show("screen-game");
  });

  resetGame();
})();
