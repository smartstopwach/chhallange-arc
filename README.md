# Daymark

A calm, dark-mode habit and challenge tracker focused on small daily wins. Daymark is a dependency-free static site: habits, check-ins, focus sessions, daily reflections, tomorrow's goals, challenge progress, and insights all run in the browser and are saved locally.

## Run locally

Open `index.html` directly, or serve the folder over HTTP:

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

Then visit `http://localhost:4173`. The PWA install and offline features require localhost or an HTTPS host; opening the file directly only runs the regular web page.

## Install as an app

On supported Chrome/Edge browsers, select **Install** when the button appears or use the browser's install option. On iPhone or iPad, open Daymark in Safari and choose **Share → Add to Home Screen**. Load the site once while online so its app shell is cached for offline use. Your progress remains local to that browser profile.

## Features

- Daily habit checklist with start-to-end due-time ranges beside each tick, categories, and custom weekday schedules
- No habits are preloaded: optional starter ideas can be added, skipped, or restored; custom habits are always available, and setup asks for start and end times and repeat days; overlapping ranges on shared days are blocked
- Searchable, category-filtered habit library with per-habit streaks and a seven-day check-in trail
- Overall streaks, a smooth 7-day activity line chart, and selectable 30-day or 1-year Insights with daily line charts, range-aware summaries, and a matching consistency map
- Flexible 7-, 14-, 30-, and 60-day challenges
- Focus timer with 15-, 25-, and 45-minute sessions; sessions are counted automatically
- Daily mood check-in and private reflection notes
- Detailed next-day planner with a top priority, all 24 hours, selectable 1–4 hour task blocks, overlap protection, and scheduled habits
- Date-based task handoff: tomorrow's tasks appear in Today on their calendar date; open views refresh at local midnight and charts include today's check-ins
- Collapsible desktop sidebar with a saved expand/collapse preference
- Local browser storage, profile preferences, JSON export, and reset controls
- Responsive layout and keyboard-accessible controls, tuned for phone and tablet screens
- Installable PWA with offline app-shell caching, service-worker updates, install prompt, and mobile home-screen icons

No account or backend is required. Progress is stored in this browser under the `daymark.app.v1` local-storage key; the sidebar display preference is saved separately.
