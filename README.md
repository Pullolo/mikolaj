# FOR MIKOŁAJ

A little retro arcade, made as a gift. Three screens:

1. **Title** — "HELLO, MY BELOVED MIKOŁAJ!" types itself out, and a cartridge
   slot (your `img/icon.png`) is the way in.
2. **Stage 1 · Heart Catch** — catch 12 hearts with the basket, dodge the
   spiky ones, 3 lives. Arrow keys / `A`–`D`, the on-screen ◀ ▶ buttons, or
   just drag anywhere on the game screen.
3. **The Vault** — unlocked by winning. Six sealed tiles; tap one to reveal
   its PNG, tap a revealed one to see it full size.

```
index.html   the three screens and the six tiles
style.css    the whole retro look (CRT, pixel frames, palette)
game.js      Heart Catch — tunables at the top in CFG
app.js       screens, sound, the cartridge slot, the vault
img/         icon.png + 1.png … 6.png   ← your pictures go here
```

## Running it

Any static server:

```sh
python3 -m http.server 8000
# → http://localhost:8000
```

Opening `index.html` straight from the filesystem works too.

## Adding the pictures

Drop `icon.png` and `1.png` … `6.png` into `img/`. See `img/README.md`.
Until a file exists its slot shows a placeholder naming the file it wants, so
everything is usable before the pictures arrive.

## Changing the words

The editable text in `index.html` is marked with `<!-- EDIT -->`: the line
under the greeting, the vault intro, and the message that appears once all six
are open. Tile labels are the `data-caption` attributes on each tile.

## Making the game easier or harder

Top of `game.js`:

```js
GOAL: 12,    // hearts needed to win
LIVES: 3,    // spiky hits you can take
FALL_BASE: 42, FALL_PER_POINT: 2.4,   // how fast things drop
```

## Notes

- Progress (game won, tiles revealed, sound on/off) is remembered in the
  browser's local storage. Clearing site data resets it.
- Sound is a handful of generated square-wave blips — no audio files. Toggle
  it top-right.
- Works with a mouse, a touchscreen and a keyboard; honours
  `prefers-reduced-motion`.
