# Turbo Track

A top-down racing game for iPhone and iPad, made as a birthday present. Pick a big or small car, paint it, choose a track, and dodge the bombs and cracks. Birthday mode turns the bombs into cakes. Designed by Christopher Yong.

Install it from https://dixon-legalled.github.io/turbo-track/ with Share → Add to Home Screen. The game only runs from the home screen; opened in a browser tab, the site shows the install page.

## Making changes

- `turbo-track.html` is the game, in one file.
- `node build.mjs` builds the installable site (manifest, offline support and icons) into `docs/`, which GitHub Pages serves.
- Commit and push after building. Installed copies update the next time they're opened online.
