# Daymark

A calm, dark-mode habit and challenge tracker focused on small daily wins. Daymark is a dependency-free static site: habits, check-ins, focus sessions, daily reflections, tomorrow's goals, challenge progress, and insights all run in the browser and are saved locally.

## Run locally

Open `index.html` directly, or serve the folder over HTTP:

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

Then visit `http://localhost:4173`.

## Features

- Daily habit checklist with categories, time-of-day cues, and custom weekday schedules
- Personal streaks, a 7-day activity chart, and 30-day insights/consistency map
- Flexible 7-, 14-, 30-, and 60-day challenges
- Focus timer with 15-, 25-, and 45-minute sessions; sessions are counted automatically
- Daily mood check-in and private reflection notes
- Daily focus and next-day goal planner
- Local browser storage, profile preferences, JSON export, and reset controls
- Responsive layout and keyboard-accessible controls

No account or backend is required. Progress is stored in this browser under the `daymark.app.v1` local-storage key.
