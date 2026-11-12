# mikolaj

A tiny retro arcade made for Mikołaj.

1. **Title screen** — "Catch my heart, Mikołaj!", a clickable icon slot
   (→ level select) and a **★ Treasures Unlocked** button.
2. **Six levels**, each guarding one memory and each harder in its own way:

   | # | Name | Difficulty | Twist |
   |---|------|------------|-------|
   | 1 | First Hello | ★ Easy | 8 hearts, no storm clouds |
   | 2 | Butterflies | ★★ Easy | hearts flutter side to side |
   | 3 | Rainy Day | ★★★ Normal | lots of storm clouds |
   | 4 | Windy Walk | ★★★ Normal | gusts push everything sideways |
   | 5 | Racing Hearts | ★★★★ Hard | 15 hearts in 35 seconds |
   | 6 | Forever | ★★★★★ Love Boss | tiny basket + wind + wobble + storms |

   Each level unlocks after the previous one. Drag on touch screens;
   arrow keys / A-D or the mouse on desktop.
3. **Treasures Unlocked** — six chests, locked until their level is beaten.
   Opening all six reveals the final note.

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
