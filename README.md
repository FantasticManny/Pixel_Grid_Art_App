# Pixel Studio

A browser-based pixel art editor built on the HTML5 Canvas API. Comes preloaded with four iconic paintings recreated as 64×64 pixel art — draw freely on a blank canvas or load a masterpiece and paint over it.
This is just a casual fun javascript project attempt, hope you enjoy.

**Stack:** HTML · CSS · Vanilla JavaScript · HTML5 Canvas API

---

## Features

- **Four tools** — Draw, Erase, Flood Fill, and Eyedropper
- **Colour picker** — full colour input with live hex display and active swatch
- **Base palette** — 20 hand-picked colours always available
- **Painting palette** — auto-generated from the loaded painting's actual colours, sorted by frequency
- **Canvas sizes** — 8×8, 16×16, 32×32, and 64×64 grids
- **Grid toggle** — show or hide pixel grid lines
- **Undo** — up to 50 steps
- **Clear canvas** — wipe the canvas with undo support
- **Export PNG** — saves a clean 1024px scaled image with no grid lines
- **Preloaded paintings** — cycle through four famous works recreated in pixel art
- **Painting info panel** — shows title, artist, year, grid size, and colour count
- **Keyboard shortcuts** — full keyboard support for all tools and actions
- **Touch support** — works on mobile and tablet
- **Persistent painting index** — remembers which painting was last loaded via localStorage

---

## Preloaded Paintings

| Painting | Artist | Year |
|---|---|---|
| De Sterrennacht (Starry Night) | Vincent van Gogh | c. 1889 |
| Mona Lisa | Leonardo da Vinci | c. 1503–1519 |
| Girl with a Pearl Earring | Johannes Vermeer | c. 1665 |
| The Scream | Edvard Munch | c. 1893 |

---

## How to Run

No installation or build step needed. This is a pure HTML/CSS/JS project as said earlier.

**Option 1 — Open directly:**
- Unzip the project folder
- Double-click `index.html` to open it in your browser

**Option 2 — Use a local server (recommended):**

Using VS Code with the Live Server extension:
- Open the project folder in VS Code
- Right-click `index.html` → **Open with Live Server**

Using Node.js:
```bash
npx serve .
```

Then open `http://localhost:3000` in your browser.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `D` | Draw tool |
| `E` | Erase tool |
| `F` | Fill tool |
| `I` | Eyedropper |
| `G` | Toggle grid |
| `L` | Load next painting |
| `Ctrl + Z` | Undo |

---

## Project Structure

```
PIXEL STUDIO PROJECT/
├── index.html          # App layout — panels, canvas, controls
├── style.css           # Full UI styling
├── app.js              # All canvas logic, tools, events, state
└── InitArt/
    ├── starry_night.js              # Van Gogh — 64×64 hex colour array
    ├── mona_lisa.js                 # Da Vinci — 64×64 hex colour array
    ├── girl_with_pearl_earring.js   # Vermeer — 64×64 hex colour array
    └── the_scream.js                # Munch — 64×64 hex colour array
```

---

## Adding a New Painting

Each painting is a flat JavaScript array of 4,096 hex colour strings (64×64 pixels, row-major order). To add your own:

**1. Create the data file**

Create a new file in `InitArt/` that declares a global variable:
```javascript
// my_painting.js
window.MY_PAINTING_64 = ["#rrggbb", "#rrggbb", ...]; // 4096 values
```

**2. Add the script tag in index.html**

Add this line before the `<script src="app.js">` line at the bottom:
```html
<script src="/InitArt/my_painting.js"></script>
```

**3. Register it in app.js**

Add an entry to the `PAINTINGS` array at the top of `app.js`:
```javascript
{
  dataVar : 'MY_PAINTING_64',
  title   : 'My Painting',
  artist  : 'The Artist',
  year    : '2025',
  gridW   : 64,
  gridH   : 64,
}
```

That's it. The painting will appear in the cycle when you click Load.
