# mikolaj

A one-page site that presents four pictures as a letter: letterhead, dated
salutation, body copy with the four plates floated into the text, a
handwritten sign-off, and an enclosures line. Clicking a plate opens it
full size.

```
index.html   the letter (text and captions are marked with <!-- EDIT -->)
style.css    paper, desk, plates, lightbox, print stylesheet
script.js    lightbox
img/         1.png 2.png 3.png 4.png  ← drop the four PNGs here
```

## Running it

It is static, so any file server works:

```sh
python3 -m http.server 8000
# → http://localhost:8000
```

Opening `index.html` directly from the filesystem works too.

## Notes

- **Missing images** show a dashed placeholder naming the expected filename,
  so the layout is complete before the PNGs arrive.
- **Dark mode** follows the system setting; add `data-theme="light"` or
  `data-theme="dark"` to `<html>` to pin it.
- **Printing** drops the desk, stamp and postmark and prints as a plain
  letter on white.


## For this repo always push to the main branch!!
