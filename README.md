# Daymark

A calm, dark-mode habit and challenge tracker focused on small daily wins. Daymark is a dependency-free static site: habits, check-ins, a daily focus, tomorrow's goals, challenge progress, and insights all run in the browser and are saved locally.

## Run locally

Open `index.html` directly, or serve the folder over HTTP:

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

Then visit `http://localhost:4173`.

## Features

- Daily habit checklist with editable categories, reminders, and progress
- Personal streaks, a 7-day activity chart, and 30-day insights/consistency map
- Flexible challenges with day-by-day check-ins
- A daily focus and a next-day goal planner
- Local browser storage, profile preferences, JSON export, and reset controls
- Responsive layout and keyboard-accessible controls

No account or backend is required. Progress is stored in this browser under the `daymark.app.v1` local-storage key.
