# mikolaj

A tiny retro arcade made for Mikołaj.

1. **Title screen** — "Hello, my beloved Mikołaj!" and a clickable icon slot.
2. **Level 1: Catch my ♥** — catch 12 falling hearts, dodge the storm clouds
   (3 lives). Drag on touch screens; arrow keys / A-D or the mouse on desktop.
3. **Rewards** — six treasure chests, each revealing a picture. Opening all
   six unlocks a final note.

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
