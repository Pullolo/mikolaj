/* ════════════════════════════════════════════════════════════
   HEART CATCH — a tiny canvas arcade game.
   Catch the falling hearts, dodge the spiky ones.

   Tunables live in CFG below.
   ════════════════════════════════════════════════════════════ */
(function (global) {
  "use strict";

  var CFG = {
    W: 240,
    H: 180,
    GOAL: 12, // hearts needed to win
    LIVES: 3, // spiky hits you can take
    SCALE: 2, // sprite pixel -> canvas pixel
    PLAYER_SPEED: 130, // canvas px / second
    FALL_BASE: 42,
    FALL_PER_POINT: 2.4,
    HEART_EVERY: 0.85,
    SPIKE_EVERY: 1.55,
    FLOOR: 166
  };

  /* ── pixel art ──────────────────────────────────────────── */

  var HEART = [
    " 22 11 ",
    "2211111",
    "1111111",
    " 11111 ",
    "  111  ",
    "   1   "
  ];
  var HEART_COLORS = { "1": "#ff5c8a", "2": "#ffa8c0" };

  var SPIKE = [
    "1  1  1",
    " 1 1 1 ",
    " 12221 ",
    "1222221",
    " 12221 ",
    " 1 1 1 ",
    "1  1  1"
  ];
  var SPIKE_COLORS = { "1": "#5a6070", "2": "#9aa0b2" };

  var BASKET = [
    "3           3",
    "3333333333333",
    "3111111111113",
    "3111111111113",
    "3111111111113",
    " 33333333333 ",
    "  3333333333 "
  ];
  var BASKET_COLORS = { "1": "#8a5a2b", "3": "#d79a52" };

  function spriteSize(rows, scale) {
    return { w: rows[0].length * scale, h: rows.length * scale };
  }

  function drawSprite(ctx, rows, colors, x, y, scale) {
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      for (var c = 0; c < row.length; c++) {
        var ch = row.charAt(c);
        if (ch === " ") continue;
        ctx.fillStyle = colors[ch];
        ctx.fillRect(
          Math.round(x) + c * scale,
          Math.round(y) + r * scale,
          scale,
          scale
        );
      }
    }
  }

  /* ── the game ───────────────────────────────────────────── */

  function create(canvas, hooks) {
    hooks = hooks || {};
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    var S = CFG.SCALE;
    var heartSize = spriteSize(HEART, S);
    var spikeSize = spriteSize(SPIKE, S);
    var basketSize = spriteSize(BASKET, S);

    var stars = [];
    for (var i = 0; i < 26; i++) {
      stars.push({
        x: (i * 97 + 13) % CFG.W,
        y: (i * 53 + 7) % (CFG.FLOOR - 12),
        c: i % 7 === 0 ? "#4de2e2" : i % 5 === 0 ? "#ffd23f" : "#3a3a63"
      });
    }

    var state = "idle"; // idle | playing | won | lost
    var player, items, bits, score, lives, heartTimer, spikeTimer;
    var dir = 0;
    var targetX = null;
    var raf = null;
    var last = 0;

    function reset() {
      player = { x: CFG.W / 2 - basketSize.w / 2 };
      items = [];
      bits = [];
      score = 0;
      lives = CFG.LIVES;
      heartTimer = 0.35;
      spikeTimer = 1.3;
      dir = 0;
      targetX = null;
      emit("score", score);
      emit("lives", lives);
    }

    function emit(name, value) {
      var fn = hooks["on" + name.charAt(0).toUpperCase() + name.slice(1)];
      if (fn) fn(value);
    }

    function sfx(kind) {
      if (hooks.onSfx) hooks.onSfx(kind);
    }

    function fallSpeed() {
      return CFG.FALL_BASE + score * CFG.FALL_PER_POINT;
    }

    function spawn(kind) {
      var size = kind === "heart" ? heartSize : spikeSize;
      items.push({
        kind: kind,
        x: 4 + Math.random() * (CFG.W - size.w - 8),
        y: -size.h,
        w: size.w,
        h: size.h,
        vy: fallSpeed() * (0.85 + Math.random() * 0.4)
      });
    }

    function burst(x, y, color) {
      for (var i = 0; i < 7; i++) {
        bits.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 90,
          vy: -30 - Math.random() * 60,
          life: 0.45,
          c: color
        });
      }
    }

    function update(dt) {
      /* player */
      if (targetX !== null) {
        var want = targetX - basketSize.w / 2;
        var delta = want - player.x;
        var step = CFG.PLAYER_SPEED * 1.5 * dt;
        player.x += Math.abs(delta) <= step ? delta : Math.sign(delta) * step;
      } else if (dir !== 0) {
        player.x += dir * CFG.PLAYER_SPEED * dt;
      }
      player.x = Math.max(0, Math.min(CFG.W - basketSize.w, player.x));

      /* spawning */
      heartTimer -= dt;
      if (heartTimer <= 0) {
        spawn("heart");
        heartTimer = Math.max(0.5, CFG.HEART_EVERY - score * 0.02);
      }
      spikeTimer -= dt;
      if (spikeTimer <= 0) {
        spawn("spike");
        spikeTimer = Math.max(0.9, CFG.SPIKE_EVERY - score * 0.03);
      }

      /* items */
      var mouth = {
        x: player.x + S,
        y: CFG.FLOOR - basketSize.h,
        w: basketSize.w - S * 2,
        h: S * 4
      };

      for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i];
        it.y += it.vy * dt;

        var hit =
          it.x < mouth.x + mouth.w &&
          it.x + it.w > mouth.x &&
          it.y + it.h > mouth.y &&
          it.y + it.h < mouth.y + mouth.h + it.vy * dt;

        if (hit) {
          items.splice(i, 1);
          if (it.kind === "heart") {
            score++;
            emit("score", score);
            burst(it.x + it.w / 2, it.y, "#ff5c8a");
            sfx("good");
            if (score >= CFG.GOAL) return finish("won");
          } else {
            lives--;
            emit("lives", lives);
            burst(it.x + it.w / 2, it.y, "#9aa0b2");
            sfx("bad");
            if (lives <= 0) return finish("lost");
          }
          continue;
        }

        if (it.y > CFG.H) items.splice(i, 1);
      }

      /* particles */
      for (var b = bits.length - 1; b >= 0; b--) {
        var p = bits[b];
        p.life -= dt;
        if (p.life <= 0) {
          bits.splice(b, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 190 * dt;
      }
    }

    function finish(result) {
      state = result;
      stop();
      draw();
      sfx(result === "won" ? "win" : "lose");
      emit(result === "won" ? "win" : "lose", score);
    }

    function draw() {
      /* sky */
      ctx.fillStyle = "#10101c";
      ctx.fillRect(0, 0, CFG.W, CFG.H);
      for (var s = 0; s < stars.length; s++) {
        ctx.fillStyle = stars[s].c;
        ctx.fillRect(stars[s].x, stars[s].y, 2, 2);
      }

      /* ground */
      ctx.fillStyle = "#1b1b36";
      ctx.fillRect(0, CFG.FLOOR, CFG.W, CFG.H - CFG.FLOOR);
      ctx.fillStyle = "#262650";
      for (var g = 0; g < CFG.W; g += 8) ctx.fillRect(g, CFG.FLOOR, 4, 2);

      /* items */
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (it.kind === "heart") {
          drawSprite(ctx, HEART, HEART_COLORS, it.x, it.y, S);
        } else {
          drawSprite(ctx, SPIKE, SPIKE_COLORS, it.x, it.y, S);
        }
      }

      /* particles */
      for (var b = 0; b < bits.length; b++) {
        ctx.fillStyle = bits[b].c;
        ctx.fillRect(Math.round(bits[b].x), Math.round(bits[b].y), 2, 2);
      }

      /* player */
      drawSprite(
        ctx,
        BASKET,
        BASKET_COLORS,
        player.x,
        CFG.FLOOR - basketSize.h,
        S
      );
    }

    function frame(now) {
      if (state !== "playing") return;
      var dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      update(dt);
      if (state === "playing") {
        draw();
        raf = global.requestAnimationFrame(frame);
      }
    }

    function start() {
      reset();
      state = "playing";
      last = global.performance ? performance.now() : Date.now();
      stop();
      raf = global.requestAnimationFrame(frame);
    }

    function stop() {
      if (raf !== null) {
        global.cancelAnimationFrame(raf);
        raf = null;
      }
    }

    function abort() {
      stop();
      state = "idle";
      reset();
      draw();
    }

    function pause() {
      if (state === "playing") {
        state = "paused";
        stop();
      }
    }

    function resume() {
      if (state === "paused") {
        state = "playing";
        last = global.performance ? performance.now() : Date.now();
        raf = global.requestAnimationFrame(frame);
      }
    }

    /* ── input ────────────────────────────────────────────── */

    function canvasX(clientX) {
      var r = canvas.getBoundingClientRect();
      return ((clientX - r.left) / r.width) * CFG.W;
    }

    function onPointer(e) {
      if (state !== "playing") return;
      targetX = canvasX(e.clientX);
      e.preventDefault();
    }

    canvas.addEventListener("pointerdown", function (e) {
      if (canvas.setPointerCapture) {
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (err) {
          /* not fatal */
        }
      }
      onPointer(e);
    });
    canvas.addEventListener("pointermove", function (e) {
      if (e.buttons === 0 && e.pointerType === "mouse") return;
      onPointer(e);
    });

    function setDir(d) {
      dir = d;
      if (d !== 0) targetX = null;
    }

    var KEYS = {
      ArrowLeft: -1,
      ArrowRight: 1,
      a: -1,
      A: -1,
      d: 1,
      D: 1
    };

    function onKeyDown(e) {
      var d = KEYS[e.key];
      if (d === undefined) return;
      setDir(d);
      e.preventDefault();
    }
    function onKeyUp(e) {
      var d = KEYS[e.key];
      if (d === undefined) return;
      if (dir === d) setDir(0);
    }

    reset();
    draw();

    return {
      cfg: CFG,
      start: start,
      stop: stop,
      abort: abort,
      pause: pause,
      resume: resume,
      draw: draw,
      setDir: setDir,
      onKeyDown: onKeyDown,
      onKeyUp: onKeyUp,
      getState: function () {
        return state;
      },
      /* used by the "I believe you" shortcut and by tests */
      forceWin: function () {
        if (state === "playing" || state === "idle") {
          score = CFG.GOAL;
          emit("score", score);
          finish("won");
        }
      }
    };
  }

  global.HeartCatch = { create: create, CFG: CFG };
})(window);
