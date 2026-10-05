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
- Searchable, category-filtered habit library with per-habit streaks and a seven-day check-in trail
- Overall streaks, smooth 7- and 30-day activity line charts, and a 30-day consistency map
- Flexible 7-, 14-, 30-, and 60-day challenges
- Focus timer with 15-, 25-, and 45-minute sessions; sessions are counted automatically
- Daily mood check-in and private reflection notes
- Detailed next-day planner with a top priority, all 24 hours, selectable 1–4 hour task blocks, overlap protection, and scheduled habits
- Date-based task handoff: tomorrow's tasks appear in Today on their calendar date; open views refresh at local midnight and charts include today's check-ins
- Collapsible desktop sidebar with a saved expand/collapse preference
- Local browser storage, profile preferences, JSON export, and reset controls
- Responsive layout and keyboard-accessible controls, tuned for phone and tablet screens
- Daymark favicon, mobile home-screen icon, and web app manifest

No account or backend is required. Progress is stored in this browser under the `daymark.app.v1` local-storage key; the sidebar display preference is saved separately.
