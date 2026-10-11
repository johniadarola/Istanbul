# Istanbul

A browser version of Rüdiger Dorn's *Istanbul* for playing with friends. It's an unofficial fan project for personal play.

**Play:** https://johniadarola.github.io/Istanbul/

## Modes
- **Play online:** create a game, send the link, and friends join in their browser with no account. Empty seats can be AI merchants. Turns sync live through Firebase Realtime Database, and anyone can close the tab and come back.
- **Play on this device:** pass-and-play or solo against AI. It saves in the browser.

## Files
- `index.html`: page shell
- `style.css`: look and theme (light and dark)
- `game.js`: rules engine, AI, interface, effects and sounds, online sync (Firebase SDK loaded from gstatic)
- `themes/`: all names, descriptions and art paths. `istanbul.js` is the default; `riverfair.js` is the animal-world draft (open the site with `?theme=riverfair`)
- `database.rules.json`: security rules to paste into Firebase → Realtime Database → Rules

## How online play works
Each game lives at `games/<CODE>` in the database. The player whose turn it is runs the turn in their own browser and saves the new state when the turn ends. Everyone else watches a live copy. AI turns are run by the first human player who is online. If nobody is online, the AI waits.

Add `?mock` to the URL to use a same-browser stand-in for Firebase (useful for testing with two tabs).

## Retheming and art
Everything players read lives in a theme file under `themes/`. Copy one, rename things, and load it with `?theme=<file name>`. Invite links carry the theme so friends see the same world.

To add art, drop images into `art/` and list them in the theme's `art` block:
- `tiles: { 1: 'art/tiles/01.webp', ... }` sits behind each location tile (about 512×560, with the top third kept calm so the name stays readable)
- `merchants: { red: 'art/standees/red.webp', ... }` are transparent standee figures for each player color (about 256×384)
