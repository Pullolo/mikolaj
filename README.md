# mikolaj

A tiny retro arcade made for Mikołaj.

1. **Title screen** — "Catch my heart, Mikołaj!", a clickable icon slot
   (→ level select) and a **★ Treasures Unlocked** button.
2. **Six levels**, each guarding one memory and each harder in its own way:

   | # | Name | Difficulty | Challenge |
   |---|------|------------|-----------|
   | 1 | First Hello | ★ Easy | 12 hearts, a few storm clouds |
   | 2 | Butterflies | ★★ Normal | 15 fluttering hearts, max 6 missed |
   | 3 | Rainy Day | ★★★ Normal | 18 hearts in heavy storms, max 5 missed |
   | 4 | Windy Walk | ★★★ Hard | 20 hearts in strong gusts, max 5 missed |
   | 5 | Racing Hearts | ★★★★ Hard | 24 hearts in 32 seconds, only 2 lives |
   | 6 | Forever | ★★★★★ Love Boss | 30 hearts, tiny basket, wind, wobble, clouds that chase you |

   Each level unlocks after the previous one. Drag on touch screens;
   arrow keys / A-D or the mouse on desktop.
3. **Treasures Unlocked** — six chests, locked until their level is beaten.
4. **Secret message** — once all six chests are open, its own section unlocks
   with a grand opening: a giant locked heart rumbles, the lock pops off, the
   heart bursts into pixel fireworks, and the letter unrolls and types itself
   out (tap to skip). The text lives in `index.html`, marked `<!-- EDIT -->`.

Progress is saved in the browser, so he can come back later
("reset progress" at the bottom of the treasures page starts over).
Level names, difficulty and tuning live in the `LEVELS` list at the top of
`script.js`.

```
index.html   screens and text (edit spots are marked with <!-- EDIT -->)
style.css    pixel styling, works on phone and desktop
script.js    screens, mini-game, chests, picture viewer, 8-bit sounds
img/         1.png … 6.png placeholders (replace with your own), optional icon.png
```

## Running it

It is static, so any file server works:

```sh
python3 -m http.server 8000
# → http://localhost:8000
```

Opening `index.html` directly from the filesystem works too.

## For this repo always push to the main branch!!
