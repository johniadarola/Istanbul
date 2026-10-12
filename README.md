# Riverfair

A market race beneath the Avian Ascendancy. Push your handcart through the stalls of Riverfair with your apprentices, trade wool, herbs, honey and pearls, and win Gold Feathers. Play online with friends or against AI traders.

**Play:** https://johniadarola.github.io/Riverfair/

## Modes
- **Play online:** create a game, send the link, and friends join in their browser with no account. Empty seats can be AI traders. Turns sync live through Firebase Realtime Database, and anyone can close the tab and come back.
- **Play on this device:** pass-and-play or solo against AI. It saves in the browser.
- **Expansion:** *Mushrooms & Guilds* adds four places, mushrooms, Sorrel the forager, guild cards and the Gutterlane Snug.

## Files
- `index.html`: page shell
- `style.css`: look (light and dark)
- `game.js`: rules engine, AI, interface, effects and sounds, online sync (Firebase SDK loaded from gstatic)
- `themes/riverfair.js`: every name, description and art path players see
- `database.rules.json`: security rules to paste into Firebase → Realtime Database → Rules
- `manifest.webmanifest`, `sw.js`: installable app and offline support

## How online play works
Each game lives at `games/<CODE>` in the database. The player whose turn it is runs the turn in their own browser and saves the new state when the turn ends. Everyone else watches a live copy. AI turns are run by the first human player who is online. If nobody is online, the AI waits.

Add `?mock` to the URL to use a same-browser stand-in for Firebase (useful for testing with two tabs).

## Art
Images live in `art/` and are listed in the `art` block of `themes/riverfair.js`: location tiles (`art/tiles`), standees (`art/standees`), icons (`art/icons`) and app icons (`art/app`).

## Installing as an app
On Android (Chrome), open the site and tap **Install Riverfair on this device** on the home screen (or ⋮ → Install app). On iPhone, Safari → Share → Add to Home Screen. Local games work offline.
After adding new art, run `python3 tools-precache.py <version>` so the offline copy includes it.
