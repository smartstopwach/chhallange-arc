# Daymark

Daymark is a calm, dark-mode habit and challenge tracker focused on small daily wins. Habits, check-ins, focus sessions, reflections, tomorrow's goals, challenge progress, and insights are saved locally for instant interactions and synchronized across the signed-in user's devices with Firebase Authentication and Cloud Firestore.

## Run locally

Serve the folder over HTTP (opening `index.html` as a `file://` URL does not support Google sign-in or the PWA):

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

Then visit `http://localhost:4173`. Add `localhost` to Firebase Authentication's authorized domains if it is not already present. The deployed site also needs its exact hostname authorized (for GitHub Pages, `smartstopwach.github.io`).

## Firebase setup

The browser Firebase configuration in `firebase-client.js` is a public web-app config, not a service-account credential. Never put service-account keys or other server secrets in this static site.

1. In Firebase Console, enable **Authentication → Google** and authorize the site's hostname (and `localhost` for local testing).
2. Create a **Cloud Firestore** database. Choose a region close to your users; Firestore's database location cannot be changed after creation.
3. Publish the account-scoped security rules in `firestore.rules`. With Firebase CLI installed and authenticated, run:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use challange-arc
   firebase deploy --only firestore:rules
   ```

   Alternatively, copy `firestore.rules` into **Firestore Database → Rules** in Firebase Console and publish them. Do not leave Firestore in test mode.

The app stores one validated state document at `/users/{uid}`. The rules allow a signed-in user to read and write only their own document; all other paths remain denied. Rules protect the cloud database and are enforced by Firebase, not by the browser code.

On the first Google sign-in, existing browser-only Daymark data is carried into the first account on that browser. Thereafter, each account has a separate local cache. Updates save locally first, then synchronize through Firestore; cached data remains available offline and pending writes retry when the connection returns. Google sign-in is required to enter the app.

## Install as an app

On supported Chrome/Edge browsers, select **Install** when the button appears or use the browser's install option. On iPhone or iPad, open Daymark in Safari and choose **Share → Add to Home Screen**. Load the site once while online so the app shell and Firebase SDK modules can be cached for offline startup. Cloud sync needs a connection, but previously signed-in users can continue working from their local cache.

Notification settings appear only when Daymark is opened as an installed PWA, never in the regular website. In **Settings → Habit reminders**, users can opt in to a local system notification at the start time of each unchecked, time-based habit. Mobile browsers may pause local scheduling in the background or when the PWA is closed; reliable closed-app delivery requires a separate push-notification backend.

## Features

- Required Google sign-in with a dedicated responsive login screen and account-scoped cloud sync
- Local-first saving for fast interactions, Firestore offline persistence, and per-account browser caches
- Daily habit checklist with start-to-end due-time ranges beside each tick, categories, and custom weekday schedules
- No habits are preloaded: optional starter ideas can be added, skipped, or restored; habit setup asks for start and end times and repeat days; overlapping ranges on shared days are blocked
- Searchable, category-filtered habit library with per-habit streaks and a seven-day check-in trail
- Overall streaks, a smooth 7-day activity line chart, and selectable 30-day or 1-year Insights with daily line charts, range-aware summaries, and a matching consistency map
- Flexible 7-, 14-, 30-, and 60-day challenges
- Dedicated Pomodoro tab with 15-, 25-, and 45-minute focus sessions, session summaries, and a 7-, 30-, or 90-day daily-completion line graph
- Daily mood check-in and private reflection notes
- Detailed next-day planner with a top priority, all 24 hours, selectable 1–4 hour task blocks, overlap protection, and scheduled habits
- Date-based task handoff: tomorrow's tasks appear in Today on their calendar date; open views refresh at local midnight and charts include today's check-ins
- Collapsible desktop sidebar with a saved expand/collapse preference
- Profile preferences, JSON export, and reset controls
- Responsive layout and keyboard-accessible controls, tuned for phone and tablet screens
- Installable PWA with offline app-shell caching, service-worker updates, install prompt, and mobile home-screen icons
- Opt-in, device-local habit notifications shown only in the installed PWA; no website permission prompt, with closed-app delivery noted as requiring push infrastructure
