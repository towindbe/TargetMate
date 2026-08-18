# TargetMate

A landing pattern simulator for skydivers — plan your downwind/base/final approach at any dropzone based on wind, wing loading, and adjustable turn points.

**[Try it live](https://towindbe.github.io/TargetMate/www/index.html)**

## What it does

- Pick any dropzone on the map (or search by name) and set the wind direction/speed
- Automatically builds a downwind → base → final landing pattern, working backward from the target point
- Shows the wind-drift correction (crab angle) needed on each leg, color-coded to match the pattern
- Compares three flight paths: no-wind reference, uncorrected (nose held straight), and corrected (crabbed into the wind)
- Wingload estimator: rough forward speed / sink rate from exit weight and canopy size
- Reach rings: at a given opening altitude, how far you could be from the pattern's entry point and still reach it at full flight, wind included
- Save favorite locations to jump back to quickly - their surroundings are pre-cached for offline use
- Works offline for any dropzone you've already viewed or saved as a favorite (service worker-backed)
- Left-hand / right-hand pattern toggle, metric/imperial + km-h/knots unit toggles
- Guided spotlight tour of the controls, shown once automatically and replayable anytime from the "?" user guide
- English and German

⚠️ This is a planning aid, not a substitute for an on-site briefing. Always confirm your planned approach with the dropzone's chief instructor before jumping.

## How the math works

The pattern is built **backward from the target point**: final first, then base, then downwind, so all three legs end at exactly the same spot.

**Time per leg** — purely from altitude loss, independent of wind:

```
time = altitude loss ÷ sink rate
```

**Wind triangle** — for each leg, the wind vector is decomposed relative to that leg's course:

```
along = wind × cos(wind direction + 180° − course)
cross = wind × sin(wind direction + 180° − course)
```

**Corrected (crabbed) flight** — the canopy noses into the wind so the actual ground track stays straight:

```
groundspeed = along + √(airspeed² − cross²)
crab angle δ = −asin(cross ÷ airspeed)
```

**Uncorrected flight** — if the nose is held on-course without compensating:

```
distance along course = (airspeed + along) × time
sideways drift = cross × time
```

**Reference path** — the same pattern with wind = 0 on every leg, showing how big it'd be with no wind at all.

If `|cross| ≥ airspeed`, the corrected path can no longer be held — the app flags this instead of showing a broken number.

### Reach rings

At a fixed airspeed and constant wind, the set of points reachable within time `T` from any direction is always a circle — centered not on the start point, but on the start point plus wind drift (`wind × T`). Run backward from the pattern's entry point, the same holds: the circle from which the entry point is just barely reachable has radius `airspeed × T`, centered upwind of the entry point by `wind × T`:

```
radius = airspeed × T
center = entry point, shifted upwind by wind × T
T = (altitude − entry altitude) ÷ sink rate
```

This assumes the heading can be chosen exactly and instantly — no time is spent turning — so it's a theoretical upper bound, not a recommendation; the actually reachable area is somewhat smaller.

### Wingload estimator

```
wingload (lb/sqft) = weight (kg) × 2.20462 ÷ canopy area (sqft)
```

Forward speed and sink rate are then linearly interpolated between the two nearest points in the table below. The table itself isn't manufacturer data (no such public dataset exists) — it's calculated physically: forward speed and sink rate scale with **√wingload** at a constant glide ratio, anchored to a typical full-flight reference for a docile 9-cell allround canopy (1.0 lb/sqft ≈ 34 km/h / 3.3 m/s). It doesn't apply to elliptical/cross-braced canopies, which fly noticeably faster at the same loading.

| Wingload (lb/sqft · kg/m²) | Forward speed (km/h · kn) | Sink rate (m/s · ft/min) |
|---|---|---|
| 0.5 · 2.44  | 24 · 13.0 | 2.3 · 453 |
| 0.7 · 3.42  | 28 · 15.1 | 2.8 · 551 |
| 0.9 · 4.39  | 32 · 17.3 | 3.1 · 610 |
| 1.1 · 5.37  | 36 · 19.4 | 3.5 · 689 |
| 1.3 · 6.35  | 39 · 21.1 | 3.8 · 748 |
| 1.5 · 7.32  | 42 · 22.7 | 4.0 · 787 |
| 1.8 · 8.79  | 46 · 24.8 | 4.4 · 866 |

### Known limitations

- Constant sink rate and airspeed assumed in full flight — no braking
- "Altitude loss per turn" is a rough, adjustable estimate (default off), not an exact value — depends heavily on wing loading and control input
- Wind is treated as constant over the whole descent — no wind shear with altitude
- The crab angle is a target value, not an exactly flyable guide — real canopy steering is less precise
- The reach rings assume an instant heading change — real turn time isn't subtracted, so the actually reachable area is somewhat smaller

For the interactive version with diagrams and a worked example, tap the **i** button in the app.

## How it's built

Single-file web app (`www/index.html`) — no build step, no backend. Uses [Leaflet](https://leafletjs.com/) with Esri World Imagery tiles for the map and OpenStreetMap/Nominatim for location search. Settings and favorites are stored locally in the browser (`localStorage`) — nothing is sent to or stored on a server.

The same file is wrapped as a native Android app via [Capacitor](https://capacitorjs.com/) (see `android/`).

## Running locally

Just open `www/index.html` in a browser, or serve the `www/` folder with any static file server.

## Building the Android app

```bash
npm install
npx cap sync android
```

Then open `android/` in Android Studio, or build from the command line:

```bash
cd android
./gradlew assembleDebug
```
