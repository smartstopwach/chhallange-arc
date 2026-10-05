(() => {
  'use strict';

  const STORAGE_KEY = 'daymark.app.v1';
  const SIDEBAR_COLLAPSED_KEY = 'daymark.sidebarCollapsed.v1';
  const DAY_MS = 24 * 60 * 60 * 1000;
  const CATEGORIES = ['Wellness', 'Movement', 'Learning', 'Mindfulness', 'Rest', 'Other'];
  const TIMES = ['Morning', 'Afternoon', 'Evening', 'Anytime'];
  const CATEGORY_ICONS = {
    Wellness: 'water',
    Movement: 'move',
    Learning: 'book',
    Mindfulness: 'mind',
    Rest: 'moon',
    Other: 'sparkles',
  };
  const CHALLENGES = [
    {
      id: 'momentum-30',
      name: 'Everyday Momentum',
      duration: 30,
      category: 'Consistency',
      icon: 'sparkles',
      description: 'Build a routine that feels like yours, one small promise at a time.',
      detail: 'Show up in your own way',
    },
    {
      id: 'mindful-7',
      name: 'Mindful Mornings',
      duration: 7,
      category: 'Mindfulness',
      icon: 'sunrise',
      description: 'Give the first few minutes of your day a little more intention.',
      detail: 'Start the day with intention',
    },
    {
      id: 'movement-14',
      name: 'Move Every Day',
      duration: 14,
      category: 'Movement',
      icon: 'move',
      description: 'Make room for movement in whatever way feels good to you.',
      detail: 'Any kind of movement counts',
    },
    {
      id: 'reading-30',
      name: 'Read a Little',
      duration: 30,
      category: 'Learning',
      icon: 'book',
      description: 'Turn ten quiet minutes and a few pages into a lasting ritual.',
      detail: 'A few pages a day',
    },
    {
      id: 'rest-60',
      name: 'A Kinder Wind-Down',
      duration: 60,
      category: 'Rest',
      icon: 'moon',
      description: 'Create an evening routine that gives tomorrow a softer start.',
      detail: 'Make room for better rest',
    },
  ];
  const MOODS = [
    { id: 'great', label: 'Great', icon: 'sparkles' },
    { id: 'good', label: 'Good', icon: 'sunrise' },
    { id: 'okay', label: 'Okay', icon: 'target' },
    { id: 'low', label: 'Low', icon: 'moon' },
    { id: 'rough', label: 'Rough', icon: 'mind' },
  ];
  const TIMER_PRESETS = [15, 25, 45];
  const PLAN_HOURS = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`);
  const GOAL_DURATIONS = [1, 2, 3, 4];
  const PLAN_DAYPARTS = [
    { name: 'Overnight', range: 'Quiet hours', icon: 'moon', hours: [0, 1, 2, 3, 4, 5] },
    { name: 'Morning', range: 'A gentle start', icon: 'sunrise', hours: [6, 7, 8, 9, 10, 11] },
    { name: 'Afternoon', range: 'Midday momentum', icon: 'target', hours: [12, 13, 14, 15, 16, 17] },
    { name: 'Evening', range: 'Wind down well', icon: 'moon', hours: [18, 19, 20, 21, 22, 23] },
  ];
  const WEEKDAYS = [
    { value: 1, label: 'M' }, { value: 2, label: 'T' }, { value: 3, label: 'W' },
    { value: 4, label: 'T' }, { value: 5, label: 'F' }, { value: 6, label: 'S' }, { value: 0, label: 'S' },
  ];
  const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const ICONS = {
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.7"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.7"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.7"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.7"/>',
    checklist: '<rect x="8" y="4" width="12" height="17" rx="2"/><path d="M4 8h.01M4 12h.01M4 16h.01M11 9h6M11 13h6M11 17h4"/><path d="M8 6H6a2 2 0 0 0-2 2v12"/>',
    flag: '<path d="M5 21V5m0 0c4-3 7 3 11 0l3-1v10l-3 1c-4 3-7-3-11 0"/><path d="M5 5v10"/>',
    chart: '<path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 6-7"/><path d="M17 6h3v3"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    play: '<path d="m8 5 12 7-12 7V5Z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    'arrow-left': '<path d="M19 12H5m6 6-6-6 6-6"/>',
    'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16.5 9"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M7.5 3v4M16.5 3v4M3.5 9.5h17"/><path d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01"/>',
    flame: '<path d="M12 22c4.2 0 7-2.8 7-6.7 0-2.7-1.5-4.9-4.6-7.1.2 2.2-1 3.3-2.2 3.8.2-3.9-1.5-7-5.4-9.8.3 3.6-.5 5.5-2.3 8.1A8.1 8.1 0 0 0 3 15.1C3 19.1 6.3 22 12 22Z"/><path d="M12 22c2 0 3.4-1.4 3.4-3.2 0-1.2-.6-2.2-1.9-3.3.1 1.3-.5 1.7-1.1 2-.1-1.8-.9-3.1-2.5-4.2.1 1.8-.3 2.6-1 3.6-.5.7-.8 1.3-.8 2 0 1.8 1.5 3.1 3.9 3.1Z"/>',
    sparkles: '<path d="m12 3 1.3 5.2L18.5 10l-5.2 1.3L12 16.5l-1.3-5.2L5.5 10l5.2-1.8L12 3Z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14ZM5 3l.6 1.4L7 5l-1.4.6L5 7l-.6-1.4L3 5l1.4-.6L5 3Z"/>',
    water: '<path d="M12 22a7 7 0 0 0 7-7c0-4-7-13-7-13S5 11 5 15a7 7 0 0 0 7 7Z"/><path d="M9 16a3 3 0 0 0 3 3"/>',
    move: '<circle cx="12" cy="4.5" r="2"/><path d="m9 22 1-6-3-3 2-5 4-1 3 3 3 1M10 16l4 2 2 4M7 13l-3 2-1 3"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"/><path d="M4 5.5V22M8 7h8M8 11h8M8 15h5"/>',
    mind: '<path d="M12 4a4 4 0 0 0-7 2.6A4.5 4.5 0 0 0 5.5 15a4 4 0 0 0 6.5 3.1V4Z"/><path d="M12 4a4 4 0 0 1 7 2.6 4.5 4.5 0 0 1-.5 8.4 4 4 0 0 1-6.5 3.1V4ZM8 8h1M7.5 12H9M15 8h1M15 12h1"/><path d="M12 4v16"/>',
    moon: '<path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.8 8.8 0 1 0 20.5 15.5Z"/><path d="m16 4 .5 1.5L18 6l-1.5.5L16 8l-.5-1.5L14 6l1.5-.5L16 4ZM20 9l.4 1.1L21.5 10.5l-1.1.4L20 12l-.4-1.1-1.1-.4 1.1-.4L20 9Z"/>',
    sunrise: '<path d="M3 18h18M5 21h14M12 2v2M4.9 7l1.4 1.4M19.1 7l-1.4 1.4"/><path d="M5 18a7 7 0 0 1 14 0M12 12v6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
    edit: '<path d="m15 5 4 4M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/><path d="M13 20h7"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 13h11l1-13M9 7V4h6v3"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
    leaf: '<path d="M20 4c-8 0-14 3.4-14 10a6 6 0 0 0 6 6c6.6 0 8-8 8-16Z"/><path d="M4 21c2.5-5 6-8 12-11"/>',
    lightbulb: '<path d="M9 18h6M10 22h4M8.2 14.5A7 7 0 1 1 15.8 14.5c-.8.6-1.3 1.6-1.3 2.5h-5c0-.9-.5-1.9-1.3-2.5Z"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5"/><path d="M5 17v4h14v-4"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3"/>',
    'check-square': '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 2.5 2.5L16.5 9"/>',
    'arrow-up': '<path d="M12 19V5m-6 6 6-6 6 6"/>',
  };

  function readSidebarPreference() {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch (_) {
      return false;
    }
  }

  let state = loadState();
  let sidebarCollapsed = readSidebarPreference();
  let currentView = 'today';
  let editingFocus = false;
  let selectedMoodDay = '';
  let selectedMood = '';
  let reflectionDraftDay = '';
  let reflectionDraft = '';
  let toastTimer = null;
  let timerTicker = null;

  function icon(name, size = 18) {
    const content = ICONS[name] || ICONS.sparkles;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[char]);
  }

  function pad2(value) { return String(value).padStart(2, '0'); }

  function dateKey(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  function isDateKey(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value); }

  function dateFromKey(key) {
    const [year, month, day] = String(key).split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  function addDays(date, amount) {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
    result.setDate(result.getDate() + amount);
    return result;
  }

  function dayOrdinal(date) {
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
  }

  function daysBetween(firstKey, secondKey) {
    if (!isDateKey(firstKey) || !isDateKey(secondKey)) return 0;
    return dayOrdinal(dateFromKey(secondKey)) - dayOrdinal(dateFromKey(firstKey));
  }

  function formatDate(date, options = {}) {
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }

  function longDate(date) { return formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' }); }
  function compactDate(date) { return formatDate(date, { weekday: 'short', month: 'short', day: 'numeric' }); }

  function makeStarterHabits() {
    const createdAt = dateKey(new Date());
    const everyDay = [0, 1, 2, 3, 4, 5, 6];
    return [
      { id: 'habit-water', name: 'Drink a full glass of water', detail: 'Before your first coffee', category: 'Wellness', time: 'Morning', icon: 'water', days: [...everyDay], createdAt },
      { id: 'habit-move', name: 'Move for 20 minutes', detail: 'A walk totally counts', category: 'Movement', time: 'Anytime', icon: 'move', days: [...everyDay], createdAt },
      { id: 'habit-read', name: 'Read 10 pages', detail: 'A little every day adds up', category: 'Learning', time: 'Evening', icon: 'book', days: [...everyDay], createdAt },
      { id: 'habit-mindful', name: 'Take a mindful pause', detail: 'Try five slow breaths', category: 'Mindfulness', time: 'Afternoon', icon: 'mind', days: [...everyDay], createdAt },
      { id: 'habit-rest', name: 'Start winding down by 10:30', detail: 'Give tomorrow-you a head start', category: 'Rest', time: 'Evening', icon: 'moon', days: [...everyDay], createdAt },
    ];
  }

  function makeDefaultState() {
    const firstChallenge = CHALLENGES[0];
    return {
      version: 2,
      name: '',
      habits: makeStarterHabits(),
      logs: {},
      goals: {},
      focus: {},
      reflections: {},
      sessions: {},
      timer: { duration: 25 * 60, remaining: 25 * 60, endsAt: null },
      challenge: { id: firstChallenge.id, startDate: dateKey(new Date()) },
    };
  }

  function isRecord(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }

  function randomId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') return globalThis.crypto.randomUUID();
    return `dm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function normalizeHabit(habit, index) {
    if (!isRecord(habit)) return null;
    const name = String(habit.name || '').trim().slice(0, 56);
    if (!name) return null;
    const category = CATEGORIES.includes(habit.category) ? habit.category : 'Other';
    const time = TIMES.includes(habit.time) ? habit.time : 'Anytime';
    const validIcons = Object.values(CATEGORY_ICONS);
    const selectedDays = Array.isArray(habit.days)
      ? [...new Set(habit.days.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))]
      : [0, 1, 2, 3, 4, 5, 6];
    return {
      id: String(habit.id || `habit-${index}-${randomId()}`).slice(0, 100),
      name,
      detail: String(habit.detail || '').trim().slice(0, 100),
      category,
      time,
      icon: validIcons.includes(habit.icon) ? habit.icon : CATEGORY_ICONS[category],
      days: selectedDays.length ? selectedDays : [0, 1, 2, 3, 4, 5, 6],
      createdAt: isDateKey(habit.createdAt) ? habit.createdAt : dateKey(new Date()),
    };
  }

  function normalizeLogs(value) {
    const logs = {};
    if (!isRecord(value)) return logs;
    Object.entries(value).slice(-500).forEach(([key, day]) => {
      if (!isDateKey(key) || !isRecord(day)) return;
      const cleanDay = {};
      Object.entries(day).slice(0, 200).forEach(([id, checked]) => {
        if (checked === true) cleanDay[String(id).slice(0, 100)] = true;
      });
      if (Object.keys(cleanDay).length) logs[key] = cleanDay;
    });
    return logs;
  }

  function normalizeGoalHour(value) {
    if (PLAN_HOURS.includes(value)) return value;
    const legacyHours = { Morning: '09:00', Afternoon: '14:00', Evening: '19:00', Anytime: '09:00' };
    return legacyHours[value] || '09:00';
  }

  function normalizeGoalDuration(value) {
    const duration = Math.floor(Number(value));
    return GOAL_DURATIONS.includes(duration) ? duration : 1;
  }

  function formatClock(hour) {
    const normalizedHour = ((Number(hour) % 24) + 24) % 24;
    return `${normalizedHour % 12 || 12}:00 ${normalizedHour < 12 ? 'AM' : 'PM'}`;
  }

  function formatGoalRange(goal) {
    const startHour = Number(normalizeGoalHour(goal.slot).slice(0, 2));
    const duration = normalizeGoalDuration(goal.duration);
    const endHour = (startHour + duration) % 24;
    const nextDay = startHour + duration >= 24 ? ' (+1 day)' : '';
    return `${formatClock(startHour)}–${formatClock(endHour)}${nextDay}`;
  }

  function getGoalCoveredHours(goal) {
    const startHour = Number(normalizeGoalHour(goal.slot).slice(0, 2));
    const duration = normalizeGoalDuration(goal.duration);
    return Array.from({ length: duration }, (_, index) => (startHour + index) % 24);
  }

  function hasGoalTimeConflict(goals, slot, duration) {
    const startHour = Number(normalizeGoalHour(slot).slice(0, 2));
    const newHours = new Set(Array.from({ length: normalizeGoalDuration(duration) }, (_, index) => (startHour + index) % 24));
    return goals.some((goal) => getGoalCoveredHours(goal).some((hour) => newHours.has(hour)));
  }

  function normalizeGoals(value) {
    const goals = {};
    if (!isRecord(value)) return goals;
    Object.entries(value).slice(-500).forEach(([key, list]) => {
      if (!isDateKey(key) || !Array.isArray(list)) return;
      goals[key] = list.slice(0, 100).map((goal, index) => {
        if (!isRecord(goal)) return null;
        const text = String(goal.text || '').trim().slice(0, 150);
        if (!text) return null;
        const slot = normalizeGoalHour(goal.slot);
        const duration = normalizeGoalDuration(goal.duration);
        return { id: String(goal.id || `goal-${index}-${randomId()}`).slice(0, 100), text, done: goal.done === true, slot, duration };
      }).filter(Boolean);
    });
    return goals;
  }

  function normalizeFocus(value) {
    const focus = {};
    if (!isRecord(value)) return focus;
    Object.entries(value).slice(-500).forEach(([key, item]) => {
      if (!isDateKey(key) || !isRecord(item)) return;
      const text = String(item.text || '').trim().slice(0, 150);
      if (text) focus[key] = { text, done: item.done === true };
    });
    return focus;
  }

  function normalizeReflections(value) {
    const reflections = {};
    if (!isRecord(value)) return reflections;
    const moodIds = MOODS.map((mood) => mood.id);
    Object.entries(value).slice(-500).forEach(([key, item]) => {
      if (!isDateKey(key) || !isRecord(item)) return;
      const mood = moodIds.includes(item.mood) ? item.mood : '';
      const note = String(item.note || '').trim().slice(0, 280);
      if (mood || note) reflections[key] = { mood, note };
    });
    return reflections;
  }

  function normalizeSessions(value) {
    const sessions = {};
    if (!isRecord(value)) return sessions;
    Object.entries(value).slice(-500).forEach(([key, count]) => {
      const safeCount = Math.max(0, Math.min(1000, Math.floor(Number(count) || 0)));
      if (isDateKey(key) && safeCount) sessions[key] = safeCount;
    });
    return sessions;
  }

  function normalizeTimer(value) {
    const defaultDuration = 25 * 60;
    const validDurations = TIMER_PRESETS.map((minutes) => minutes * 60);
    const duration = isRecord(value) && validDurations.includes(Number(value.duration)) ? Number(value.duration) : defaultDuration;
    let remaining = isRecord(value) && Number.isFinite(Number(value.remaining))
      ? Math.max(0, Math.min(duration, Math.ceil(Number(value.remaining))))
      : duration;
    let endsAt = isRecord(value) && value.endsAt !== null && value.endsAt !== undefined && Number.isFinite(Number(value.endsAt)) ? Number(value.endsAt) : null;
    let justFinished = false;
    if (endsAt && endsAt > Date.now()) remaining = Math.max(0, Math.min(duration, Math.ceil((endsAt - Date.now()) / 1000)));
    else if (endsAt) {
      endsAt = null;
      remaining = 0;
      justFinished = true;
    }
    return { duration, remaining, endsAt, justFinished };
  }

  function loadState() {
    const defaults = makeDefaultState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaults;
      const saved = JSON.parse(raw);
      if (!isRecord(saved)) return defaults;
      const habits = Array.isArray(saved.habits)
        ? saved.habits.map(normalizeHabit).filter(Boolean)
        : defaults.habits;
      const savedChallenge = isRecord(saved.challenge) ? saved.challenge : {};
      const savedChallengeDefinition = CHALLENGES.find((item) => item.id === savedChallenge.id);
      const challenge = savedChallengeDefinition || CHALLENGES[0];
      const sessions = normalizeSessions(saved.sessions);
      const timer = normalizeTimer(saved.timer);
      if (timer.justFinished) sessions[dateKey(new Date())] = (sessions[dateKey(new Date())] || 0) + 1;
      delete timer.justFinished;
      return {
        version: 2,
        name: typeof saved.name === 'string' ? saved.name.trim().slice(0, 32) : '',
        habits,
        logs: normalizeLogs(saved.logs),
        goals: normalizeGoals(saved.goals),
        focus: normalizeFocus(saved.focus),
        reflections: normalizeReflections(saved.reflections),
        sessions,
        timer,
        challenge: {
          id: challenge.id,
          startDate: savedChallengeDefinition && isDateKey(savedChallenge.startDate) ? savedChallenge.startDate : dateKey(new Date()),
        },
      };
    } catch (error) {
      console.warn('Daymark could not load saved data; starting with a fresh workspace.', error);
      return defaults;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.warn('Daymark could not save to this browser.', error);
      showToast('Your browser could not save this update. Check available storage.');
      return false;
    }
  }

  function getTodayKey() { return dateKey(new Date()); }
  function getTomorrowDate() { return addDays(new Date(), 1); }
  function getCurrentChallenge() {
    const challenge = CHALLENGES.find((item) => item.id === state.challenge.id) || CHALLENGES[0];
    return { ...challenge, startDate: isDateKey(state.challenge.startDate) ? state.challenge.startDate : getTodayKey() };
  }
  function getChallengeDay() {
    const challenge = getCurrentChallenge();
    const elapsed = Math.max(0, daysBetween(challenge.startDate, getTodayKey()));
    return Math.min(challenge.duration, elapsed + 1);
  }
  function isCheckedOn(dayKey, habitId) { return Boolean(state.logs[dayKey] && state.logs[dayKey][habitId]); }
  function hasCheckin(dayKey) {
    const record = state.logs[dayKey];
    return Boolean(record && Object.values(record).some(Boolean));
  }
  function scheduledHabitsOn(dayKey) {
    const weekday = dateFromKey(dayKey).getDay();
    return state.habits.filter((habit) => !Array.isArray(habit.days) || habit.days.includes(weekday));
  }
  function completedHabitsOn(dayKey) { return scheduledHabitsOn(dayKey).filter((habit) => isCheckedOn(dayKey, habit.id)).length; }
  function completionPercent(dayKey) {
    const scheduled = scheduledHabitsOn(dayKey).length;
    if (!scheduled) return null;
    return Math.round((completedHabitsOn(dayKey) / scheduled) * 100);
  }
  function formatSchedule(days) {
    const selected = Array.isArray(days) ? days : [0, 1, 2, 3, 4, 5, 6];
    if (selected.length === 7) return 'Every day';
    if ([1, 2, 3, 4, 5].every((day) => selected.includes(day)) && selected.length === 5) return 'Weekdays';
    if ([0, 6].every((day) => selected.includes(day)) && selected.length === 2) return 'Weekends';
    return WEEKDAYS.filter((day) => selected.includes(day.value)).map((day) => WEEKDAY_NAMES[day.value]).join(' · ');
  }
  function getNextScheduledDate() {
    for (let offset = 1; offset <= 7; offset += 1) {
      const date = addDays(new Date(), offset);
      if (scheduledHabitsOn(dateKey(date)).length) return date;
    }
    return null;
  }

  function getCurrentStreak() {
    if (!state.habits.length) return 0;
    let date = new Date();
    const todayKey = dateKey(date);
    if (scheduledHabitsOn(todayKey).length && !hasCheckin(todayKey)) date = addDays(date, -1);
    let streak = 0;
    let checkedDays = 0;
    let scannedDays = 0;
    while (checkedDays < 3660 && scannedDays < 3660) {
      scannedDays += 1;
      const key = dateKey(date);
      if (!scheduledHabitsOn(key).length) {
        date = addDays(date, -1);
        continue;
      }
      if (!hasCheckin(key)) break;
      streak += 1;
      checkedDays += 1;
      date = addDays(date, -1);
    }
    return streak;
  }

  function getBestStreak() {
    const dates = Object.keys(state.logs).filter((key) => hasCheckin(key) && scheduledHabitsOn(key).length).sort();
    let best = 0;
    let current = 0;
    let previousKey = '';
    dates.forEach((key) => {
      let consecutive = Boolean(previousKey);
      if (previousKey) {
        let cursor = addDays(dateFromKey(previousKey), 1);
        while (dateKey(cursor) < key) {
          if (scheduledHabitsOn(dateKey(cursor)).length) {
            consecutive = false;
            break;
          }
          cursor = addDays(cursor, 1);
        }
        if (dateKey(cursor) !== key) consecutive = false;
      }
      current = consecutive ? current + 1 : 1;
      best = Math.max(best, current);
      previousKey = key;
    });
    return best;
  }

  function getChallengeCheckins() {
    const challenge = getCurrentChallenge();
    const elapsed = daysBetween(challenge.startDate, getTodayKey());
    if (elapsed < 0) return 0;
    const lastOffset = Math.min(elapsed, challenge.duration - 1);
    let count = 0;
    for (let offset = 0; offset <= lastOffset; offset += 1) {
      if (hasCheckin(dateKey(addDays(dateFromKey(challenge.startDate), offset)))) count += 1;
    }
    return count;
  }

  function getLastDays(count) {
    const today = new Date();
    return Array.from({ length: count }, (_, index) => {
      const date = addDays(today, index - count + 1);
      const key = dateKey(date);
      const scheduled = scheduledHabitsOn(key).length;
      return { date, key, scheduled, percent: scheduled ? completionPercent(key) : null, checkin: hasCheckin(key) };
    });
  }

  function getAverage(series) {
    const trackedDays = series.filter((item) => item.scheduled > 0 && item.percent !== null);
    if (!trackedDays.length) return 0;
    return Math.round(trackedDays.reduce((total, item) => total + item.percent, 0) / trackedDays.length);
  }

  function getCheckinDays(count) { return getLastDays(count).filter((item) => item.checkin).length; }
  function getSessionsForDays(count) {
    return getLastDays(count).reduce((total, item) => total + (state.sessions[item.key] || 0), 0);
  }
  function getTimerRemaining() {
    if (state.timer.endsAt) return Math.max(0, Math.ceil((state.timer.endsAt - Date.now()) / 1000));
    return Math.max(0, Math.min(state.timer.duration, state.timer.remaining));
  }
  function isTimerRunning() { return Boolean(state.timer.endsAt && getTimerRemaining() > 0); }
  function formatTimer(seconds) {
    return `${pad2(Math.floor(seconds / 60))}:${pad2(seconds % 60)}`;
  }
  function getMoodLabel(moodId) { return MOODS.find((mood) => mood.id === moodId)?.label || ''; }

  function hydrateStaticIcons(scope = document) {
    scope.querySelectorAll('[data-icon]').forEach((element) => {
      element.innerHTML = icon(element.dataset.icon, 18);
    });
  }

  function applySidebarPreference() {
    const shell = document.querySelector('.app-shell');
    const toggle = document.querySelector('.sidebar-collapse-toggle');
    if (shell) shell.classList.toggle('is-sidebar-collapsed', sidebarCollapsed);
    if (toggle) {
      const label = sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('title', label);
      toggle.setAttribute('aria-expanded', String(!sidebarCollapsed));
    }
  }

  function renderNav() {
    document.querySelectorAll('.main-nav [data-view], .settings-link').forEach((button) => {
      const active = button.dataset.view === currentView;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    const breadcrumb = document.getElementById('breadcrumb-current');
    if (breadcrumb) breadcrumb.textContent = ({ today: 'Today', habits: 'Habits', planner: 'Planner', challenges: 'Challenges', insights: 'Insights', settings: 'Settings' })[currentView] || 'Today';
    const topDate = document.getElementById('top-date');
    if (topDate) topDate.textContent = compactDate(new Date());
    const profileName = document.getElementById('profile-name');
    const profileAvatar = document.getElementById('profile-avatar');
    const visibleName = state.name || 'Your space';
    if (profileName) profileName.textContent = visibleName;
    if (profileAvatar) profileAvatar.textContent = state.name ? state.name.trim().charAt(0).toUpperCase() : 'D';
    const challenge = getCurrentChallenge();
    const sideName = document.getElementById('sidebar-challenge-name');
    const sideDay = document.getElementById('sidebar-challenge-day');
    const sideCheckins = document.getElementById('sidebar-challenge-checkins');
    const sideFill = document.getElementById('sidebar-progress-fill');
    if (sideName) sideName.textContent = challenge.name;
    if (sideDay) sideDay.textContent = `Day ${getChallengeDay()} of ${challenge.duration}`;
    if (sideCheckins) sideCheckins.textContent = `${getChallengeCheckins()} check-in${getChallengeCheckins() === 1 ? '' : 's'}`;
    if (sideFill) sideFill.style.width = `${Math.round((getChallengeCheckins() / challenge.duration) * 100)}%`;
  }

  function renderApp() {
    const host = document.getElementById('app-content');
    if (!host) return;
    applySidebarPreference();
    const pages = {
      today: renderTodayView,
      habits: renderHabitsView,
      planner: renderPlannerView,
      challenges: renderChallengesView,
      insights: renderInsightsView,
      settings: renderSettingsView,
    };
    host.innerHTML = (pages[currentView] || renderTodayView)();
    renderNav();
    document.title = `${({ today: 'Today', habits: 'Habits', planner: 'Planner', challenges: 'Challenges', insights: 'Insights', settings: 'Settings' })[currentView] || 'Today'} · Daymark`;
  }

  function ringMarkup(percent, size, className, centerMarkup) {
    const radius = size === 'large' ? 65 : size === 'medium' ? 44 : 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - Math.max(0, Math.min(100, percent)) / 100);
    const dimensions = size === 'large' ? 150 : size === 'medium' ? 103 : 120;
    const svgClass = className === 'hero-ring-wrap' ? 'hero-ring' : className === 'challenge-ring-wrap' ? 'challenge-ring' : 'active-ring-svg';
    return `<div class="${className}"><svg class="${svgClass}" viewBox="0 0 ${dimensions} ${dimensions}" aria-hidden="true"><circle class="ring-track" cx="${dimensions / 2}" cy="${dimensions / 2}" r="${radius}"/><circle class="ring-value" cx="${dimensions / 2}" cy="${dimensions / 2}" r="${radius}" stroke-dasharray="${circumference.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"/></svg>${centerMarkup}</div>`;
  }

  function renderStatCard(label, value, unit, foot, iconName, tone) {
    return `<article class="stat-card">
      <div class="stat-card-top"><span class="stat-label">${escapeHtml(label)}</span><span class="stat-icon tone-${tone}">${icon(iconName, 15)}</span></div>
      <div class="stat-value">${escapeHtml(value)}${unit ? `<small>${escapeHtml(unit)}</small>` : ''}</div>
      <div class="stat-foot">${icon('arrow-up-right', 12)}<span>${escapeHtml(foot)}</span></div>
    </article>`;
  }

  function renderTodayStats() {
    const todayKey = getTodayKey();
    const todayHabits = scheduledHabitsOn(todayKey);
    const percent = completionPercent(todayKey) ?? 0;
    const done = completedHabitsOn(todayKey);
    const weekly = getAverage(getLastDays(7));
    const tomorrowGoals = state.goals[dateKey(getTomorrowDate())] || [];
    const doneGoals = tomorrowGoals.filter((goal) => goal.done).length;
    return `<section class="stats-grid" aria-label="Your daily stats">
      ${renderStatCard('Current streak', String(getCurrentStreak()), 'days', getCurrentStreak() ? 'A little progress, every day' : 'Start with one small win', 'flame', 'amber')}
      ${renderStatCard("Today's progress", todayHabits.length ? `${percent}%` : '—', '', todayHabits.length ? `${done} of ${todayHabits.length} habits due today` : 'A well-earned rest day', 'check-circle', 'lime')}
      ${renderStatCard('7-day average', `${weekly}%`, '', 'Rest days do not lower your average', 'chart', 'blue')}
      ${renderStatCard("Tomorrow's plan", String(tomorrowGoals.length), 'goals', tomorrowGoals.length ? `${doneGoals} checked off so far` : 'Give tomorrow a head start', 'calendar', 'violet')}
    </section>`;
  }

  function getHabitIcon(habit) {
    const icons = Object.values(CATEGORY_ICONS);
    return icons.includes(habit.icon) ? habit.icon : CATEGORY_ICONS[habit.category] || 'sparkles';
  }

  function renderHabitRow(habit, options = {}) {
    const todayKey = getTodayKey();
    const scheduledToday = scheduledHabitsOn(todayKey).some((item) => item.id === habit.id);
    const checked = isCheckedOn(todayKey, habit.id);
    const managed = options.managed === true;
    const safeId = escapeHtml(habit.id);
    const name = escapeHtml(habit.name);
    const symbol = getHabitIcon(habit);
    const detail = habit.detail ? `<p class="habit-detail">${escapeHtml(habit.detail)}</p>` : '';
    const meta = managed
      ? `<div class="management-row-meta"><span class="category-pill">${escapeHtml(habit.category)}</span><span class="habit-time">${icon('clock', 10)}${escapeHtml(habit.time)}</span><span class="schedule-pill" title="${escapeHtml(formatSchedule(habit.days))}">${escapeHtml(formatSchedule(habit.days))}</span></div>`
      : '';
    const time = !managed ? `<span class="habit-time">${icon('clock', 10)}${escapeHtml(habit.time)}</span>` : '';
    const unavailable = managed && !scheduledToday;
    return `<li class="habit-row${checked ? ' is-complete' : ''}${unavailable ? ' is-off-day' : ''}">
      <span class="habit-symbol tone-${symbol}">${icon(symbol, 18)}</span>
      <div class="habit-copy">
        <div class="habit-title-line"><span class="habit-name">${name}</span>${time}</div>
        ${managed ? meta : detail}
      </div>
      <div class="habit-row-actions">
        <button type="button" class="check-toggle${checked ? ' is-checked' : ''}" role="checkbox" aria-checked="${checked}" aria-label="${unavailable ? `${name} is not scheduled today` : `${checked ? 'Mark' : 'Complete'} ${name}`}" data-action="toggle-habit" data-id="${safeId}"${unavailable ? ' disabled' : ''}>${icon('check', 14)}</button>
        ${managed ? `<button class="icon-button" type="button" aria-label="Edit ${name}" data-action="edit-habit" data-id="${safeId}">${icon('edit', 15)}</button><button class="icon-button is-danger" type="button" aria-label="Delete ${name}" data-action="delete-habit" data-id="${safeId}">${icon('trash', 15)}</button>` : ''}
      </div>
    </li>`;
  }

  function renderHabitsCard() {
    const todayKey = getTodayKey();
    const todayHabits = scheduledHabitsOn(todayKey);
    const done = completedHabitsOn(todayKey);
    const total = todayHabits.length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    const nextHabitDay = getNextScheduledDate();
    const content = total
      ? `<ul class="habit-list">${todayHabits.map((habit) => renderHabitRow(habit)).join('')}</ul>`
      : state.habits.length
        ? `<div class="habit-empty"><div><span class="habit-empty-icon">${icon('moon', 20)}</span><strong>Nothing due today. Enjoy the breathing room.</strong><p>Your next habit day is ${nextHabitDay ? escapeHtml(formatDate(nextHabitDay, { weekday: 'long', month: 'short', day: 'numeric' })) : 'coming up soon'}. Rest days are part of a good routine.</p></div></div>`
        : `<div class="habit-empty"><div><span class="habit-empty-icon">${icon('checklist', 20)}</span><strong>Start with a habit that feels doable.</strong><p>There is no perfect routine. Add one small thing you would like to make time for.</p></div></div>`;
    return `<section class="card card-pad habits-card" aria-labelledby="today-habits-title">
      <div class="card-header">
        <div class="card-heading"><span class="card-heading-icon">${icon('check-square', 18)}</span><div class="card-heading-copy"><h2 id="today-habits-title">Today's habits</h2><p>${total ? 'A few small promises, just for today.' : 'Your schedule should leave room to breathe.'}</p></div></div>
        <button class="button-link" type="button" data-view="habits">Manage ${icon('arrow', 14)}</button>
      </div>
      <div class="habit-progress-block"><div class="progress-meta"><span>Daily progress</span><span><strong>${done}</strong> / ${total} due${total ? ` <span class="progress-percent">${percent}%</span>` : ''}</span></div><div class="progress-track" role="progressbar" aria-label="Today's habit completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div></div>
      ${content}
      <div class="card-note">${icon('sparkles', 13)}<span>${total ? 'Done is better than perfect. Even one check-in counts.' : 'Rest is part of your plan, too.'}</span></div>
    </section>`;
  }

  function renderChallengeCard() {
    const challenge = getCurrentChallenge();
    const checkins = getChallengeCheckins();
    const checkinPercent = Math.round((checkins / challenge.duration) * 100);
    const startDate = dateFromKey(challenge.startDate);
    const week = getLastDays(7).map((day) => {
      const isToday = day.key === getTodayKey();
      const isInChallenge = daysBetween(challenge.startDate, day.key) >= 0;
      const complete = isInChallenge && day.checkin;
      return `<div class="challenge-day${complete ? ' is-done' : ''}${isToday ? ' is-today' : ''}" title="${escapeHtml(compactDate(day.date))}${complete ? ' — check-in complete' : ''}"><span class="challenge-day-dot">${icon('check', 11)}</span><span>${formatDate(day.date, { weekday: 'narrow' })}</span></div>`;
    }).join('');
    return `<section class="card challenge-card" aria-labelledby="challenge-card-title">
      <div class="card-header"><span class="challenge-status">ACTIVE CHALLENGE</span><button class="icon-button" type="button" aria-label="Open challenge library" data-view="challenges">${icon('arrow-up-right', 16)}</button></div>
      <div class="challenge-main">
        <div class="challenge-copy"><h2 id="challenge-card-title">${escapeHtml(challenge.name)}</h2><p>${escapeHtml(challenge.description)}</p><div class="challenge-day-label"><strong>Day ${getChallengeDay()}</strong><span>of ${challenge.duration}</span></div></div>
        ${ringMarkup(checkinPercent, 'medium', 'challenge-ring-wrap', `<div class="challenge-ring-copy"><strong>${checkins}</strong><span>check-ins</span></div>`)}
      </div>
      <button class="button-link" type="button" data-view="challenges">View challenge ${icon('arrow', 14)}</button>
      <div class="challenge-week" aria-label="Check-ins this week">${week}</div>
      <div class="challenge-footer"><span>Consistency, not perfection.</span><strong>${checkins} / ${challenge.duration} days</strong></div>
    </section>`;
  }

  function smoothActivityPath(points) {
    if (!points.length) return '';
    if (points.length === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let index = 0; index < points.length - 1; index += 1) {
      const previous = points[Math.max(0, index - 1)];
      const start = points[index];
      const end = points[index + 1];
      const next = points[Math.min(points.length - 1, index + 2)];
      const controlOneX = start.x + (end.x - previous.x) / 6;
      const controlOneY = start.y + (end.y - previous.y) / 6;
      const controlTwoX = end.x - (next.x - start.x) / 6;
      const controlTwoY = end.y - (next.y - start.y) / 6;
      path += ` C ${controlOneX.toFixed(2)} ${controlOneY.toFixed(2)}, ${controlTwoX.toFixed(2)} ${controlTwoY.toFixed(2)}, ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
    }
    return path;
  }

  function renderActivityPlot(series, id) {
    const width = 700;
    const height = 270;
    const top = 20;
    const bottom = 230;
    const points = series.map((item, index) => {
      const value = item.percent ?? 0;
      const x = ((index + .5) / series.length) * width;
      const y = item.scheduled ? top + ((100 - value) / 100) * (bottom - top) : bottom + 18;
      return { item, value, x, y, restDay: item.scheduled === 0 };
    });
    const segments = [];
    let activeSegment = [];
    points.forEach((point) => {
      if (point.restDay) {
        if (activeSegment.length) segments.push(activeSegment);
        activeSegment = [];
      } else activeSegment.push(point);
    });
    if (activeSegment.length) segments.push(activeSegment);
    const linePaths = segments.filter((segment) => segment.length > 1).map(smoothActivityPath);
    const areaPaths = segments.filter((segment) => segment.length > 1).map((segment) => {
      const curve = smoothActivityPath(segment);
      const first = segment[0];
      const last = segment[segment.length - 1];
      return `${curve} L ${last.x.toFixed(2)} ${bottom} L ${first.x.toFixed(2)} ${bottom} Z`;
    });
    const gridLines = [top, (top + bottom) / 2, bottom].map((y, index) => `<line class="activity-grid-line${index === 2 ? ' is-base' : ''}" x1="0" y1="${y}" x2="${width}" y2="${y}"/>`).join('');
    const pointMarkup = points.map(({ item, value, x, y, restDay }) => {
      const today = item.key === getTodayKey();
      const label = `${formatDate(item.date, { weekday: 'long', month: 'short', day: 'numeric' })}: ${restDay ? 'rest day' : `${value}% complete`}`;
      const pointClass = `activity-point${today ? ' is-today' : ''}${restDay ? ' is-rest' : ''}`;
      return `<span class="${pointClass}" style="left:${((x / width) * 100).toFixed(3)}%;top:${((y / height) * 100).toFixed(3)}%" title="${escapeHtml(label)}"></span>`;
    }).join('');
    return `<div class="activity-line-plot"><svg class="activity-line-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs><linearGradient id="${id}-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#c5ee78" stop-opacity=".24"/><stop offset="100%" stop-color="#c5ee78" stop-opacity=".015"/></linearGradient><linearGradient id="${id}-stroke" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#8eaa62"/><stop offset="55%" stop-color="#c5ee78"/><stop offset="100%" stop-color="#e1ffab"/></linearGradient></defs><g>${gridLines}</g>${areaPaths.map((path) => `<path class="activity-area" d="${path}" fill="url(#${id}-area)"/>`).join('')}${linePaths.map((path) => `<path class="activity-line" d="${path}" stroke="url(#${id}-stroke)"/>`).join('')}</svg><div class="activity-point-layer${series.length > 10 ? ' is-compact' : ''}" aria-hidden="true">${pointMarkup}</div></div>`;
  }

  function renderWeeklyCard() {
    const series = getLastDays(7);
    const average = getAverage(series);
    const trackedSeries = series.filter((item) => item.scheduled > 0);
    const bestDay = trackedSeries.reduce((best, item) => item.percent > (best?.percent ?? -1) ? item : best, null);
    const hasActivity = series.some((item) => item.checkin);
    const chartDescription = series.map((item) => `${formatDate(item.date, { weekday: 'long' })}: ${item.scheduled ? `${item.percent}%` : 'rest day'}`).join('; ');
    const labels = series.map((item) => `<span${item.key === getTodayKey() ? ' class="is-today"' : ''}>${escapeHtml(formatDate(item.date, { weekday: 'short' }).replace('.', ''))}</span>`).join('');
    return `<section class="card chart-card" aria-labelledby="weekly-chart-title">
      <div class="card-header"><div class="card-heading"><span class="card-heading-icon">${icon('chart', 18)}</span><div class="card-heading-copy"><h2 id="weekly-chart-title">Your week, in rhythm</h2><p>Completion on days you planned a habit.</p></div></div><span class="chart-period">${icon('calendar', 12)} 7 days</span></div>
      <div class="chart-summary"><strong>${average}%</strong><span>average completion</span><span class="chart-legend">Habits done</span></div>
      <div class="activity-chart" role="img" aria-label="Habit completion over the last seven days, average ${average} percent. ${escapeHtml(chartDescription)}"><div class="activity-chart-axis" aria-hidden="true"><span>100%</span><span>50%</span><span>0%</span></div>${renderActivityPlot(series, 'week-activity')}<div class="activity-day-labels" aria-hidden="true">${labels}</div></div>
      <div class="chart-foot">${hasActivity && bestDay ? `<span>Best day: <strong>${escapeHtml(formatDate(bestDay.date, { weekday: 'long' }))}</strong></span><button class="button-link" type="button" data-view="insights">More insights ${icon('arrow', 13)}</button>` : `<span class="chart-empty-message">Your first check-in will bring this chart to life.</span><button class="button-link" type="button" data-view="insights">See insights ${icon('arrow', 13)}</button>`}</div>
    </section>`;
  }

  function renderFocusCard() {
    const todayKey = getTodayKey();
    const focus = state.focus[todayKey];
    const showForm = editingFocus || !focus;
    return `<section class="card focus-card" aria-labelledby="focus-card-title">
      <div class="card-overline">ONE THING AT A TIME</div>
      <div class="focus-title-line"><h2 id="focus-card-title">Today's focus</h2>${focus && !editingFocus ? `<button class="button-link" type="button" data-action="edit-focus">Edit ${icon('edit', 13)}</button>` : ''}</div>
      ${showForm
        ? `<p class="focus-empty">What would make today feel like a good day?</p><form class="inline-form" data-form="focus"><input class="inline-input" name="focus" type="text" maxlength="150" required autocomplete="off" placeholder="Set one small priority…" aria-label="Today's main focus" value="${escapeHtml(focus?.text || '')}" /><button class="inline-submit" type="submit" aria-label="Save today's focus">${icon('arrow', 16)}</button></form>`
        : `<div class="focus-task${focus.done ? ' is-done' : ''}"><button class="check-toggle${focus.done ? ' is-checked' : ''}" type="button" role="checkbox" aria-checked="${focus.done}" aria-label="${focus.done ? 'Mark focus incomplete' : 'Complete today’s focus'}" data-action="toggle-focus">${icon('check', 14)}</button><div class="focus-task-copy"><strong>${escapeHtml(focus.text)}</strong><small>${focus.done ? 'That is one meaningful thing, done.' : 'A clear intention for the day.'}</small></div></div>`}
    </section>`;
  }

  function renderFocusTimerCard() {
    const remaining = getTimerRemaining();
    const running = isTimerRunning();
    const sessionsToday = state.sessions[getTodayKey()] || 0;
    const progress = Math.round(((state.timer.duration - remaining) / state.timer.duration) * 100);
    const status = running ? 'Stay with one thing. You have got this.' : remaining === 0 ? 'Session complete. Take a breath before the next thing.' : 'A small, focused sprint is enough.';
    return `<section class="card timer-card" aria-labelledby="focus-timer-title">
      <div class="card-header"><div class="card-heading"><span class="card-heading-icon timer-heading-icon">${icon('clock', 18)}</span><div class="card-heading-copy"><h2 id="focus-timer-title">Focus timer</h2><p>Give one thing your full attention.</p></div></div><span class="timer-live-label${running ? ' is-running' : ''}">${running ? 'IN SESSION' : 'POMODORO'}</span></div>
      <div class="timer-display-row"><div class="timer-readout"><strong id="focus-timer-time">${formatTimer(remaining)}</strong><span id="focus-timer-status">${status}</span></div><div class="timer-session-count"><strong>${sessionsToday}</strong><span>sessions today</span></div></div>
      <div class="timer-progress-track" role="progressbar" aria-label="Focus session progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span id="focus-timer-progress-fill" style="width:${progress}%"></span></div>
      <div class="timer-presets" role="group" aria-label="Focus session length">${TIMER_PRESETS.map((minutes) => `<button type="button" class="timer-preset${state.timer.duration === minutes * 60 ? ' is-selected' : ''}" data-action="timer-preset" data-minutes="${minutes}" aria-pressed="${state.timer.duration === minutes * 60}"${running ? ' disabled' : ''}>${minutes} min</button>`).join('')}</div>
      <div class="timer-controls"><button id="focus-timer-toggle" class="button button-primary button-small" type="button" data-action="timer-toggle">${icon(running ? 'pause' : 'play', 14)} ${running ? 'Pause session' : remaining === 0 ? 'Start again' : 'Start focus'}</button><button class="button button-secondary button-small" type="button" data-action="timer-reset">Reset</button></div>
    </section>`;
  }

  function renderMoodCard() {
    const key = getTodayKey();
    const reflection = state.reflections[key] || { mood: '', note: '' };
    const mood = selectedMoodDay === key ? selectedMood : reflection.mood;
    const note = reflectionDraftDay === key ? reflectionDraft : reflection.note;
    const moodOptions = MOODS.map((item) => `<button class="mood-choice${mood === item.id ? ' is-selected' : ''}" type="button" data-action="select-mood" data-id="${item.id}" aria-pressed="${mood === item.id}"><span>${icon(item.icon, 17)}</span><small>${item.label}</small></button>`).join('');
    const status = mood ? `${getMoodLabel(mood)} noted. Add a thought if you like.` : 'Optional · a quick check-in can help you notice patterns.';
    return `<section class="card mood-card" aria-labelledby="mood-card-title"><div class="mood-layout"><div class="mood-intro"><p class="card-overline">A MOMENT FOR YOU</p><h2 id="mood-card-title">How are you,<br/><span>really?</span></h2><p>No score, no streak. Just a small space to notice how today feels.</p><span class="mood-privacy-note">${icon('lock', 12)} Only saved on this device</span></div><div class="mood-content"><div class="mood-choices" role="group" aria-label="Choose your mood">${moodOptions}</div><form data-form="reflection" class="reflection-form"><label class="form-label" for="reflection-note">A note to yourself <span>optional</span></label><textarea id="reflection-note" class="form-control reflection-input" name="note" maxlength="280" placeholder="What is on your mind today?">${escapeHtml(note || '')}</textarea><div class="reflection-footer"><span id="mood-selection-status" aria-live="polite">${escapeHtml(status)}</span><button class="button button-secondary button-small" type="submit">Save check-in ${icon('check', 13)}</button></div></form></div></div></section>`;
  }

  function renderGoalRow(goal, dayKey, options = {}) {
    const slotPill = options.showSlot !== false
      ? `<span class="goal-time-pill">${escapeHtml(formatGoalRange(goal))}</span>`
      : '';
    return `<li class="goal-row${goal.done ? ' is-done' : ''}${options.planner ? ' planner-goal-row' : ''}"><button class="check-toggle${goal.done ? ' is-checked' : ''}" type="button" role="checkbox" aria-checked="${goal.done}" aria-label="${goal.done ? 'Mark incomplete' : 'Complete'} ${escapeHtml(goal.text)}" data-action="toggle-goal" data-day="${dayKey}" data-id="${escapeHtml(goal.id)}">${icon('check', 13)}</button><span class="goal-text">${escapeHtml(goal.text)}</span>${slotPill}<button class="icon-button goal-delete" type="button" aria-label="Remove goal ${escapeHtml(goal.text)}" data-action="delete-goal" data-day="${dayKey}" data-id="${escapeHtml(goal.id)}">${icon('close', 14)}</button></li>`;
  }

  function renderTomorrowCard() {
    const tomorrow = getTomorrowDate();
    const key = dateKey(tomorrow);
    const goals = state.goals[key] || [];
    const focus = state.focus[key];
    const completed = goals.filter((goal) => goal.done).length;
    const timeOptions = PLAN_HOURS.map((hour) => `<option value="${hour}"${hour === '09:00' ? ' selected' : ''}>${hour}</option>`).join('');
    const goalRows = goals.length
      ? `<ul class="goal-list">${goals.map((goal) => renderGoalRow(goal, key)).join('')}</ul>`
      : `<div class="goal-empty"><span class="goal-empty-icon">${icon('sparkles', 15)}</span><span><strong>A softer start begins here.</strong><br>Add one small thing you would like to do tomorrow.</span></div>`;
    return `<section class="card tomorrow-card" aria-labelledby="tomorrow-title">
      <div class="tomorrow-layout">
        <div class="tomorrow-intro"><div class="tomorrow-date">${icon('calendar', 14)} ${escapeHtml(formatDate(tomorrow, { weekday: 'long', month: 'long', day: 'numeric' }))}</div><h2 id="tomorrow-title">Plan for tomorrow</h2><p>Leave a little note for your future self. Keep it kind, clear, and doable.</p><div class="tomorrow-progress">${icon('check-circle', 14)}<span>${goals.length ? `${completed} of ${goals.length} goal${goals.length === 1 ? '' : 's'} checked off` : 'No pressure. One goal is a great start.'}</span></div><div class="tomorrow-priority-preview"><span>${icon('target', 14)}</span><span><small>TOP PRIORITY</small><strong>${focus ? escapeHtml(focus.text) : 'Not set yet'}</strong></span></div><button class="button-link planner-open-link" type="button" data-view="planner">Open full planner ${icon('arrow', 13)}</button></div>
        <div class="tomorrow-content">${goalRows}<form class="inline-form goal-form" data-form="goal"><input class="inline-input" type="text" name="goal" maxlength="150" required autocomplete="off" placeholder="Add a small, doable goal…" aria-label="Add a goal for tomorrow"/><select class="inline-time-select" name="slot" aria-label="Choose a time for this goal">${timeOptions}</select><button class="inline-submit" type="submit" aria-label="Add goal for tomorrow">${icon('plus', 16)}</button></form></div>
      </div>
    </section>`;
  }

  function renderPlannerView() {
    const tomorrow = getTomorrowDate();
    const key = dateKey(tomorrow);
    const goals = state.goals[key] || [];
    const priority = state.focus[key];
    const habits = scheduledHabitsOn(key);
    const completed = goals.filter((goal) => goal.done).length;
    const plannedHours = new Set(goals.flatMap(getGoalCoveredHours)).size;
    const timeOptions = PLAN_HOURS.map((hour) => `<option value="${hour}"${hour === '09:00' ? ' selected' : ''}>${hour}</option>`).join('');
    const durationOptions = GOAL_DURATIONS.map((duration) => `<option value="${duration}"${duration === 1 ? ' selected' : ''}>${duration} hour${duration === 1 ? '' : 's'}</option>`).join('');
    const hourlyTimeline = PLAN_DAYPARTS.map((part) => {
      const partGoals = goals.filter((goal) => part.hours.includes(Number(normalizeGoalHour(goal.slot).slice(0, 2))));
      const hours = part.hours.map((hour) => {
        const time = PLAN_HOURS[hour];
        const hourGoals = goals.filter((goal) => normalizeGoalHour(goal.slot) === time);
        const continuingGoals = goals.filter((goal) => normalizeGoalHour(goal.slot) !== time && getGoalCoveredHours(goal).includes(hour));
        const content = hourGoals.length
          ? `<ul class="planner-hour-task-list">${hourGoals.map((goal) => renderGoalRow(goal, key, { planner: true })).join('')}</ul>`
          : continuingGoals.length
            ? `<ul class="planner-continuation-list">${continuingGoals.map((goal) => `<li><span class="planner-continuation-mark">${icon('arrow', 11)}</span><span><strong>${escapeHtml(goal.text)}</strong><small>Continues · ${escapeHtml(formatGoalRange(goal))}</small></span></li>`).join('')}</ul>`
            : `<button class="planner-empty-hour" type="button" data-action="focus-planner-hour" data-id="${time}" aria-label="Add a plan for ${time}">${icon('plus', 12)} Open hour · add a plan</button>`;
        return `<div class="planner-hour-row${continuingGoals.length ? ' is-occupied' : ''}"><time class="planner-hour-label" datetime="${key}T${time}">${time}</time><span class="planner-hour-rail" aria-hidden="true"><i></i></span><div class="planner-hour-content">${content}</div></div>`;
      }).join('');
      return `<section class="planner-daypart"><header class="planner-block-heading"><span class="planner-block-icon">${icon(part.icon, 17)}</span><span class="planner-block-title"><strong>${part.name}</strong><small>${part.range}</small></span><span class="planner-block-count">${partGoals.length}</span></header><div class="planner-hour-list">${hours}</div></section>`;
    }).join('');
    const habitsContent = habits.length
      ? `<ul class="planner-habit-list">${habits.map((habit) => `<li><span class="habit-symbol tone-${getHabitIcon(habit)}">${icon(getHabitIcon(habit), 16)}</span><span><strong>${escapeHtml(habit.name)}</strong><small>${escapeHtml(habit.time)} · ${escapeHtml(habit.category)}</small></span></li>`).join('')}</ul>`
      : `<div class="planner-rest-note">${icon('moon', 16)}<span>No habits scheduled. Tomorrow is a planned rest day.</span></div>`;
    return `<div class="planner-view">
      <header class="page-intro"><div class="page-intro-copy"><p class="eyebrow">TOMORROW · ${escapeHtml(formatDate(tomorrow, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase())}</p><h1>Give tomorrow<br/><span>a head start.</span></h1><p>Plan the day hour by hour. Add structure where it helps and leave breathing room where it does not.</p></div><div class="page-intro-action"><button class="button button-secondary" type="button" data-view="today">${icon('arrow-left', 15)} Back to today</button></div></header>
      <section class="stats-grid" aria-label="Tomorrow plan summary">${renderStatCard('Tasks planned', String(goals.length), 'tasks', goals.length ? `${completed} already checked` : 'Add a few doable steps', 'list', 'lime')}${renderStatCard('Habits on the calendar', String(habits.length), 'habits', habits.length ? 'Already part of your rhythm' : 'A roomier day is planned', 'check-circle', 'blue')}${renderStatCard('Hours with a plan', String(plannedHours), 'of 24', plannedHours ? 'Your day has a clear shape' : 'Start with one time block', 'clock', 'amber')}${renderStatCard('Main priority', priority ? 'Set' : 'Open', '', priority ? 'One clear intention' : 'Choose one important thing', 'target', 'violet')}</section>
      <div class="planner-layout"><div class="planner-sidebar">
        <section class="card planner-priority-card"><div class="planner-card-heading"><span class="card-heading-icon">${icon('target', 18)}</span><div><p class="card-overline">ONE IMPORTANT THING</p><h2>Tomorrow's priority</h2></div></div><p class="planner-card-copy">If tomorrow goes well because of one thing, what should it be?</p><form class="planner-priority-form" data-form="tomorrow-focus"><input class="form-control" name="focus" maxlength="150" required autocomplete="off" placeholder="Name the one thing…" aria-label="Tomorrow's main priority" value="${escapeHtml(priority?.text || '')}"/><button class="button button-primary button-small" type="submit">${priority ? 'Update priority' : 'Save priority'} ${icon('check', 13)}</button></form></section>
        <section class="card planner-habits-card"><div class="planner-card-heading"><span class="card-heading-icon">${icon('checklist', 18)}</span><div><p class="card-overline">ALREADY IN YOUR ROUTINE</p><h2>Habits due tomorrow</h2></div></div><p class="planner-card-copy">Your scheduled habits are included automatically.</p>${habitsContent}</section>
      </div><section class="card planner-schedule-card"><div class="planner-schedule-header"><div><p class="card-overline">AN INTENTIONAL DAY</p><h2>Tomorrow, hour by hour</h2><p>Every hour is visible. Tap an open slot to add a task at that exact time.</p></div><span class="planner-date-chip">${icon('calendar', 13)} ${escapeHtml(formatDate(tomorrow, { month: 'short', day: 'numeric' }))}</span></div><div class="planner-dayparts">${hourlyTimeline}</div><form class="planner-add-form" data-form="goal"><label class="sr-only" for="planner-goal-input">Add a task for tomorrow</label><input class="form-control" id="planner-goal-input" name="goal" type="text" maxlength="150" required autocomplete="off" placeholder="Add a task…"/><label class="sr-only" for="planner-slot-input">Choose a start hour</label><select class="form-control" id="planner-slot-input" name="slot">${timeOptions}</select><label class="sr-only" for="planner-duration-input">Choose duration</label><select class="form-control planner-duration-select" id="planner-duration-input" name="duration">${durationOptions}</select><button class="button button-primary" type="submit">${icon('plus', 15)} Add task</button></form></section></div>
      <p class="page-footnote">Plans are suggestions, not rules. Tomorrow can change—and so can this plan.</p>
    </div>`;
  }

  function renderTodayView() {
    const todayKey = getTodayKey();
    const done = completedHabitsOn(todayKey);
    const total = scheduledHabitsOn(todayKey).length;
    const percent = completionPercent(todayKey) ?? 0;
    const challenge = getCurrentChallenge();
    const nameGreeting = state.name ? `Welcome back, ${escapeHtml(state.name)}.` : 'A fresh start is waiting—no perfect routine required.';
    const ring = ringMarkup(percent, 'small', 'hero-ring-wrap', `<div class="hero-ring-copy"><strong>${total ? `${percent}%` : '—'}</strong><span>${total ? 'today' : 'rest day'}</span></div>`);
    return `<div class="today-view">
      <section class="hero" aria-labelledby="home-title">
        <div class="hero-copy"><div class="eyebrow"><span class="live-dot"></span><span>${escapeHtml(longDate(new Date()).toUpperCase())}</span><span class="eyebrow-divider">·</span><span>DAY ${getChallengeDay()} OF ${challenge.duration}</span></div><h1 id="home-title">Make today<br/><span>count.</span></h1><p>${nameGreeting} Small promises, kept often, become a life that feels more like yours.</p><div class="hero-actions"><button class="button button-primary" type="button" data-action="add-habit">${icon('plus', 16)} Add a habit</button><button class="button-link" type="button" data-view="insights">See your progress ${icon('arrow', 14)}</button></div></div>
        <div class="hero-visual" aria-label="${total ? `${percent} percent of today's scheduled habits complete` : 'Today is a rest day'}">${ring}<div class="hero-progress-copy"><span>Today's rhythm</span><strong>${total ? `${done} of ${total} due` : 'Room to reset'}</strong><small>${done === total && total ? 'You showed up for yourself.' : total ? 'Every little bit moves you forward.' : 'A good routine makes room to rest.'}</small></div></div>
      </section>
      ${renderTodayStats()}
      <div class="dashboard-grid">
        <div class="dashboard-column">${renderHabitsCard()}${renderWeeklyCard()}</div>
        <div class="dashboard-column">${renderChallengeCard()}${renderFocusCard()}${renderFocusTimerCard()}</div>
        ${renderTomorrowCard()}
        ${renderMoodCard()}
      </div>
      <p class="page-footnote">A good routine is one you can return to. Start again whenever you need to.</p>
    </div>`;
  }

  function renderHabitsView() {
    const done = completedHabitsOn(getTodayKey());
    const total = state.habits.length;
    const dueToday = scheduledHabitsOn(getTodayKey()).length;
    const todayPercent = dueToday ? Math.round((done / dueToday) * 100) : 0;
    const content = total
      ? `<ul class="habit-list">${state.habits.map((habit) => renderHabitRow(habit, { managed: true })).join('')}</ul>`
      : `<div class="habit-management-empty"><div><span class="habit-empty-icon">${icon('checklist', 20)}</span><strong class="habit-name">Your list is a blank page.</strong><p class="habit-detail">Add one small habit to begin shaping your routine.</p><button class="button button-primary button-small" type="button" data-action="add-habit">${icon('plus', 14)} Add your first habit</button></div></div>`;
    return `<div class="habits-view">
      <header class="page-intro"><div class="page-intro-copy"><p class="eyebrow">YOUR DAILY RHYTHM</p><h1>Habits that fit<br/><span>your real life.</span></h1><p>Make your routine personal. Small, repeatable actions are the ones that tend to stick.</p></div><div class="page-intro-action"><button class="button button-primary" type="button" data-action="add-habit">${icon('plus', 16)} New habit</button></div></header>
      <section class="stats-grid" aria-label="Habit summary">${renderStatCard('Your habits', String(total), 'active', 'A routine built around you', 'list', 'lime')}${renderStatCard('Due today', String(dueToday), 'habits', `${done} checked · ${dueToday ? 'Daily rhythm' : 'Planned rest day'}`, 'check-circle', 'blue')}${renderStatCard('Current streak', String(getCurrentStreak()), 'days', getCurrentStreak() ? 'Keep your gentle momentum' : 'A new streak starts today', 'flame', 'amber')}${renderStatCard('Challenge day', String(getChallengeDay()), `of ${getCurrentChallenge().duration}`, getCurrentChallenge().name, 'flag', 'violet')}</section>
      <div class="management-layout">
        <section class="card management-card" aria-labelledby="habit-library-title"><div class="card-header"><div class="card-heading"><span class="card-heading-icon">${icon('checklist', 18)}</span><div class="card-heading-copy"><h2 id="habit-library-title">Your habit list</h2><p>Set a weekly rhythm. Rest days are built in.</p></div></div><span class="category-pill">${total} total</span></div><div class="habit-progress-block"><div class="progress-meta"><span>Today's completion</span><span><strong>${dueToday ? `${todayPercent}%` : 'Rest day'}</strong></span></div><div class="progress-track"><span style="width:${todayPercent}%"></span></div></div>${content}<div class="card-note">${icon('lock', 13)}<span>Your habit check-ins stay in this browser, on this device.</span></div></section>
        <aside class="card tips-card"><span class="card-heading-icon">${icon('lightbulb', 18)}</span><h2>Make it easy to begin.</h2><p>You do not need a perfect plan. Make the next step small enough to repeat.</p><ol class="tip-list"><li class="tip-item"><span class="tip-number">01</span><span><strong>Start smaller than you think.</strong><small>Two minutes is enough to build the rhythm.</small></span></li><li class="tip-item"><span class="tip-number">02</span><span><strong>Give it a place in your day.</strong><small>Pair a new habit with something you already do.</small></span></li><li class="tip-item"><span class="tip-number">03</span><span><strong>Begin again, without guilt.</strong><small>A missed day is a pause, not a reset.</small></span></li></ol></aside>
      </div>
      <p class="page-footnote">Your habits are yours to shape. Add, edit, or remove them whenever life changes.</p>
    </div>`;
  }

  function renderChallengeLibraryCard(challenge) {
    const active = challenge.id === state.challenge.id;
    return `<article class="challenge-option${active ? ' is-current' : ''}"><div class="challenge-option-top"><span class="challenge-option-icon">${icon(challenge.icon, 18)}</span><span class="duration-pill">${challenge.duration} days</span></div><h3>${escapeHtml(challenge.name)}</h3><p>${escapeHtml(challenge.description)}</p><div class="challenge-option-bottom"><span>${escapeHtml(challenge.detail)}</span>${active ? `<button class="button button-quiet button-small" type="button" disabled>${icon('check', 13)} In progress</button>` : `<button class="button button-secondary button-small" type="button" data-action="join-challenge" data-id="${escapeHtml(challenge.id)}">Start this challenge ${icon('arrow', 13)}</button>`}</div></article>`;
  }

  function renderChallengesView() {
    const challenge = getCurrentChallenge();
    const checkins = getChallengeCheckins();
    const progress = Math.round((checkins / challenge.duration) * 100);
    return `<div class="challenges-view">
      <header class="page-intro"><div class="page-intro-copy"><p class="eyebrow">A LITTLE COMMITMENT, A LOT OF POSSIBILITY</p><h1>Choose a challenge.<br/><span>Find your momentum.</span></h1><p>Pick a gentle structure to show up for. Your check-ins from the habit tracker count as progress.</p></div></header>
      <section class="card active-challenge-panel" aria-labelledby="active-challenge-title"><div class="active-challenge-copy"><p class="eyebrow">YOUR ACTIVE CHALLENGE · DAY ${getChallengeDay()} OF ${challenge.duration}</p><h2 id="active-challenge-title">${escapeHtml(challenge.name)}</h2><p>${escapeHtml(challenge.description)} Progress is measured by the days you check in—not by being perfect.</p><div class="active-challenge-meta"><span>Started <strong>${escapeHtml(formatDate(dateFromKey(challenge.startDate), { month: 'short', day: 'numeric', year: 'numeric' }))}</strong></span><span>Check-ins <strong>${checkins} / ${challenge.duration}</strong></span></div><div style="margin-top:17px"><button class="button button-primary button-small" type="button" data-view="habits">Go to today's habits ${icon('arrow', 14)}</button></div></div>${ringMarkup(progress, 'large', 'active-challenge-ring', `<div class="active-ring-copy"><strong>${checkins}</strong><span>check-ins</span></div>`)}</section>
      <div class="challenge-library-head"><div><h2>Find a challenge that feels right</h2><p>Switching challenges starts a fresh count. Your habits and check-ins stay saved.</p></div></div>
      <div class="challenge-library-grid">${CHALLENGES.map(renderChallengeLibraryCard).join('')}</div>
      <section class="challenge-how" aria-label="How challenges work"><div class="challenge-how-item"><span>${icon('target', 17)}</span><div><strong>Choose your pace</strong><small>Pick a timeline that feels encouraging, not overwhelming.</small></div></div><div class="challenge-how-item"><span>${icon('check-circle', 17)}</span><div><strong>Check in your way</strong><small>Complete at least one habit to count a day as a check-in.</small></div></div><div class="challenge-how-item"><span>${icon('sparkles', 17)}</span><div><strong>Keep showing up</strong><small>A missed day never erases the progress you have made.</small></div></div></section>
    </div>`;
  }

  function renderMonthChart() {
    const series = getLastDays(30);
    const description = series.map((item) => `${formatDate(item.date, { month: 'short', day: 'numeric' })}: ${item.scheduled ? `${item.percent}%` : 'rest day'}`).join('; ');
    return { series, plot: renderActivityPlot(series, 'month-activity'), description };
  }

  function renderHeatmap(series) {
    return `<div class="heatmap" role="img" aria-label="A 30 day habit completion heatmap, with darker squares for less activity">${series.map((item) => {
      const percent = item.percent ?? 0;
      const level = item.scheduled === 0 || percent === 0 ? 0 : percent <= 25 ? 1 : percent <= 50 ? 2 : percent <= 75 ? 3 : 4;
      const label = item.scheduled === 0 ? 'rest day' : `${percent}% complete`;
      return `<span class="heat-cell" data-level="${level}" title="${escapeHtml(formatDate(item.date, { month: 'short', day: 'numeric' }))}: ${label}"></span>`;
    }).join('')}</div>`;
  }

  function renderConsistencyList(series) {
    if (!state.habits.length) return `<div class="insight-empty">${icon('sparkles', 14)}<span>Add a habit to see how your routines are taking shape.</span></div>`;
    const habits = state.habits.map((habit) => {
      const dueDays = series.filter((item) => habit.days.includes(item.date.getDay()));
      const count = dueDays.filter((item) => isCheckedOn(item.key, habit.id)).length;
      return { habit, count, dueCount: dueDays.length, percent: dueDays.length ? Math.round((count / dueDays.length) * 100) : 0 };
    }).sort((a, b) => b.count - a.count);
    const activeDays = series.filter((item) => item.checkin).length;
    return `<div class="consistency-list">${habits.slice(0, 6).map(({ habit, count, dueCount, percent }) => {
      const symbol = getHabitIcon(habit);
      return `<div class="consistency-row"><span class="habit-symbol tone-${symbol}">${icon(symbol, 14)}</span><div class="consistency-copy"><strong>${escapeHtml(habit.name)}</strong><div class="progress-track"><span style="width:${percent}%"></span></div></div><span class="consistency-value">${count} / ${dueCount}</span></div>`;
    }).join('')}</div>${activeDays ? '' : `<div class="insight-empty">${icon('sparkles', 14)}<span>Your first check-in will start your progress story.</span></div>`}`;
  }

  function renderMoodInsight(series) {
    const counts = MOODS.map((mood) => ({
      ...mood,
      count: series.filter((day) => state.reflections[day.key]?.mood === mood.id).length,
    }));
    const total = counts.reduce((sum, mood) => sum + mood.count, 0);
    const bars = counts.map((mood) => `<div class="mood-insight-row"><span class="mood-insight-icon">${icon(mood.icon, 13)}</span><span class="mood-insight-label">${mood.label}</span><div class="progress-track"><span style="width:${total ? Math.round((mood.count / total) * 100) : 0}%"></span></div><strong>${mood.count}</strong></div>`).join('');
    return `<section class="card mood-insights-card"><div class="card-heading"><span class="card-heading-icon">${icon('mind', 18)}</span><div class="card-heading-copy"><h2>How the month felt</h2><p>${total} mood check-in${total === 1 ? '' : 's'} · last 30 days</p></div></div>${total ? `<div class="mood-insight-list">${bars}</div><p class="mood-insight-foot">Patterns are information, not a grade.</p>` : `<div class="insight-empty">${icon('sparkles', 14)}<span>Try a quick mood check-in on the home page. This space is just for noticing, never judging.</span></div>`}</section>`;
  }

  function renderInsightsView() {
    const series = getLastDays(30);
    const average = getAverage(series.slice(-7));
    const monthlyAverage = getAverage(series);
    const checkins = series.filter((item) => item.checkin).length;
    const focusSessions = getSessionsForDays(30);
    const chart = renderMonthChart();
    const hadActivity = checkins > 0;
    const mostConsistent = state.habits.map((habit) => ({ habit, count: series.filter((item) => isCheckedOn(item.key, habit.id)).length })).sort((a, b) => b.count - a.count)[0];
    const insightHeading = hadActivity && mostConsistent?.count ? 'Look at you, showing up.' : 'It all starts with one tick.';
    const insightCopy = hadActivity && mostConsistent?.count
      ? `You checked in on ${checkins} of the last 30 days. “${escapeHtml(mostConsistent.habit.name)}” is your most consistent habit so far. Keep making it yours.`
      : 'There is no catch-up required and no perfect streak to chase. Check off one small thing today and your progress story begins.';
    return `<div class="insights-view">
      <header class="page-intro"><div class="page-intro-copy"><p class="eyebrow">NOTICE THE SMALL WINS</p><h1>Your progress,<br/><span>at a glance.</span></h1><p>Look back with curiosity, not judgment. Every check-in is evidence that you made time for yourself.</p></div></header>
      <section class="stats-grid insight-stats" aria-label="Progress summary">${renderStatCard('7-day completion', `${average}%`, '', 'Average of your daily habits', 'chart', 'lime')}${renderStatCard('Days checked in', String(checkins), 'of 30', 'At least one habit completed', 'check-circle', 'blue')}${renderStatCard('Best streak', String(getBestStreak()), 'days', 'Your longest run so far', 'flame', 'amber')}${renderStatCard('Focus sessions', String(focusSessions), 'sessions', 'Completed with your timer', 'clock', 'violet')}</section>
      <div class="insights-layout"><div class="insights-main">
        <section class="card insights-chart-card" aria-labelledby="month-chart-title"><div class="card-header"><div class="card-heading"><span class="card-heading-icon">${icon('chart', 18)}</span><div class="card-heading-copy"><h2 id="month-chart-title">A month of little wins</h2><p>Daily completion for the last 30 days.</p></div></div><span class="chart-period">${icon('calendar', 12)} 30 days</span></div><div class="chart-summary"><strong>${monthlyAverage}%</strong><span>average completion</span><span class="chart-legend">Daily habits</span></div><div class="activity-chart month-activity-chart" role="img" aria-label="Daily habit completion across the last 30 days. ${escapeHtml(chart.description)}"><div class="activity-chart-axis" aria-hidden="true"><span>100%</span><span>50%</span><span>0%</span></div>${chart.plot}<div class="month-x-labels" aria-hidden="true"><span>${formatDate(series[0].date, { month: 'short', day: 'numeric' })}</span><span>${formatDate(series[9].date, { month: 'short', day: 'numeric' })}</span><span>${formatDate(series[19].date, { month: 'short', day: 'numeric' })}</span><span>Today</span></div></div></section>
        <div class="insights-bottom"><section class="card heatmap-card"><div class="card-heading-copy"><h2 class="card-title">Your consistency map</h2><p class="heatmap-intro">Planned days brighten as you check habits off; rest days stay quiet.</p></div>${renderHeatmap(series)}<div class="heatmap-legend"><span>Less</span><i class="heat-cell" data-level="0"></i><i class="heat-cell" data-level="1"></i><i class="heat-cell" data-level="2"></i><i class="heat-cell" data-level="3"></i><i class="heat-cell" data-level="4"></i><span>More</span></div></section><section class="card consistency-card"><div class="card-heading-copy"><h2 class="card-title">Habit consistency</h2><p class="heatmap-intro">Days completed in the last 30.</p></div>${renderConsistencyList(series)}</section></div>
      </div><aside class="insight-aside"><section class="card insight-note-card"><span class="insight-note-icon">${icon('sparkles', 19)}</span><h2>${insightHeading}</h2><p>${insightCopy}</p><div class="insight-callout">${icon('lightbulb', 14)}<span>Consistency is built in ordinary moments, not perfect ones.</span></div></section>${renderMoodInsight(series)}<section class="card insight-note-card"><span class="insight-note-icon">${icon('target', 19)}</span><h2>Keep it gentle.</h2><p>Try choosing just one habit to focus on this week. Once it feels natural, you can add another.</p><button class="button button-secondary button-small" type="button" data-view="habits" style="margin-top:15px">Review your habits ${icon('arrow', 13)}</button></section></aside></div>
      <p class="page-footnote">Your progress belongs to you. The numbers are here to help, never to judge.</p>
    </div>`;
  }

  function renderSettingsView() {
    return `<div class="settings-view">
      <header class="page-intro"><div class="page-intro-copy"><p class="eyebrow">MAKE THIS SPACE YOURS</p><h1>A little more<br/><span>personal.</span></h1><p>Manage your profile and your saved progress. Your tracker works without an account.</p></div></header>
      <div class="settings-layout"><div class="settings-stack">
        <section class="card settings-card"><h2>Your profile</h2><p>Choose the name you would like to see around Daymark. This stays on this device.</p><form class="settings-form" data-form="profile"><div><label class="form-label" for="profile-name-input">Display name</label><input class="form-control" id="profile-name-input" name="name" type="text" maxlength="32" autocomplete="nickname" placeholder="What should we call you?" value="${escapeHtml(state.name)}"/><p class="form-help">Leave this empty if you prefer a quiet, nameless workspace.</p></div><button class="button button-primary button-small" type="submit">Save profile ${icon('check', 14)}</button></form></section>
        <section class="card settings-card"><h2>Your data</h2><p>Your habits, schedules, moods, focus sessions, and plans are saved locally in this browser. Export a copy any time.</p><div class="data-action-list"><div class="data-action-row"><div class="data-action-copy"><strong>Export your data</strong><small>Download a JSON backup of your habits and progress.</small></div><button class="button button-secondary button-small" type="button" data-action="export">${icon('download', 14)} Export</button></div><div class="data-action-row"><div class="data-action-copy"><strong>Clear activity</strong><small>Remove check-ins, mood notes, focus sessions, and tomorrow's goals. Keep your habits.</small></div><button class="button button-quiet button-small" type="button" data-action="clear-activity">Clear activity</button></div><div class="data-action-row"><div class="data-action-copy"><strong>Start fresh</strong><small>Restore the starter habits and clear all saved progress.</small></div><button class="button button-danger button-small" type="button" data-action="reset-all">Reset app</button></div></div></section>
      </div><aside class="card settings-side-card"><span class="privacy-icon">${icon('lock', 19)}</span><h2>Just for you.</h2><p>Daymark has no login, no server, and no tracking. Your information stays in your browser unless you choose to export it.</p><span class="local-storage-badge">${icon('check-circle', 12)} Saved on this device</span><div class="card-note" style="margin-top:20px">${icon('sparkles', 13)}<span>Your progress is private, personal, and always yours to keep.</span></div></aside></div>
    </div>`;
  }

  function openHabitModal(habitId = '') {
    const existing = state.habits.find((habit) => habit.id === habitId);
    const title = existing ? 'Edit your habit' : 'Add a new habit';
    const category = existing?.category || 'Wellness';
    const activeDays = Array.isArray(existing?.days) ? existing.days : [0, 1, 2, 3, 4, 5, 6];
    const categoryOptions = CATEGORIES.map((option) => `<option value="${option}"${category === option ? ' selected' : ''}>${option}</option>`).join('');
    const timeOptions = TIMES.map((option) => `<option value="${option}"${(existing?.time || 'Anytime') === option ? ' selected' : ''}>${option}</option>`).join('');
    const dayOptions = WEEKDAYS.map((day) => `<label class="weekday-option" title="${WEEKDAY_NAMES[day.value]}"><input type="checkbox" name="days" value="${day.value}" aria-label="${WEEKDAY_NAMES[day.value]}"${activeDays.includes(day.value) ? ' checked' : ''}/><span>${day.label}</span></label>`).join('');
    document.getElementById('modal-root').innerHTML = `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="habit-modal-title"><header class="modal-header"><div><h2 id="habit-modal-title">${title}</h2><p>Keep it simple, specific, and kind to your future self.</p></div><button class="icon-button" type="button" aria-label="Close dialog" data-action="close-modal">${icon('close', 17)}</button></header><form data-form="habit" data-id="${existing ? escapeHtml(existing.id) : ''}"><div class="modal-body"><div class="modal-field"><label class="form-label" for="habit-name-input">Habit name</label><input class="form-control" id="habit-name-input" name="name" type="text" maxlength="56" required autocomplete="off" placeholder="e.g. Take a 10-minute walk" value="${escapeHtml(existing?.name || '')}"/></div><div class="modal-field"><label class="form-label" for="habit-detail-input">A little reminder <span style="color:var(--subtle);font-weight:400">(optional)</span></label><input class="form-control" id="habit-detail-input" name="detail" type="text" maxlength="100" autocomplete="off" placeholder="e.g. Around the block is enough" value="${escapeHtml(existing?.detail || '')}"/></div><div class="modal-field"><label class="form-label" for="habit-category-input">Category</label><div class="modal-select-wrap"><select class="form-control" id="habit-category-input" name="category">${categoryOptions}</select></div></div><div class="modal-field"><label class="form-label" for="habit-time-input">Best time</label><div class="modal-select-wrap"><select class="form-control" id="habit-time-input" name="time">${timeOptions}</select></div></div><fieldset class="modal-field weekday-field"><legend class="form-label">Repeat on</legend><div class="weekday-picker">${dayOptions}</div><p class="form-help">Pick the days that fit. The habit will stay off your list on rest days.</p></fieldset></div><footer class="modal-footer"><button class="button button-secondary button-small" type="button" data-action="close-modal">Cancel</button><button class="button button-primary button-small" type="submit">${existing ? 'Save changes' : 'Add habit'} ${icon('check', 14)}</button></footer></form></section></div>`;
    document.body.classList.add('has-modal');
    window.requestAnimationFrame(() => document.getElementById('habit-name-input')?.focus());
  }

  function closeModal() {
    document.getElementById('modal-root').innerHTML = '';
    document.body.classList.remove('has-modal');
  }

  function showToast(message) {
    const host = document.getElementById('toast-host');
    if (!host) return;
    host.innerHTML = `<div class="toast">${icon('check-circle', 16)}<span>${escapeHtml(message)}</span></div>`;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      const toast = host.querySelector('.toast');
      if (!toast) return;
      toast.classList.add('is-leaving');
      window.setTimeout(() => { host.innerHTML = ''; }, 220);
    }, 2600);
  }

  function toggleHabit(habitId) {
    const key = getTodayKey();
    if (!scheduledHabitsOn(key).some((habit) => habit.id === habitId)) return;
    if (!state.logs[key]) state.logs[key] = {};
    const wasChecked = Boolean(state.logs[key][habitId]);
    if (wasChecked) delete state.logs[key][habitId];
    else state.logs[key][habitId] = true;
    const dueCount = scheduledHabitsOn(key).length;
    const allDone = dueCount > 0 && completedHabitsOn(key) === dueCount;
    saveState();
    renderApp();
    if (!wasChecked && allDone) showToast('Daily rhythm complete. Look at you.');
  }

  function toggleGoal(dayKey, goalId) {
    const list = state.goals[dayKey] || [];
    const goal = list.find((item) => item.id === goalId);
    if (!goal) return;
    goal.done = !goal.done;
    saveState();
    renderApp();
  }

  function startChallenge(challengeId) {
    const challenge = CHALLENGES.find((item) => item.id === challengeId);
    if (!challenge || challenge.id === state.challenge.id) return;
    state.challenge = { id: challenge.id, startDate: getTodayKey() };
    saveState();
    renderApp();
    showToast(`${challenge.name} is yours. Day one starts now.`);
  }

  function startTimerTicker() {
    if (timerTicker || !state.timer.endsAt) return;
    timerTicker = window.setInterval(() => {
      if (state.timer.endsAt) updateFocusTimer();
      else {
        window.clearInterval(timerTicker);
        timerTicker = null;
      }
    }, 1000);
  }

  function updateFocusTimer() {
    if (!state.timer.endsAt) return;
    const remaining = getTimerRemaining();
    if (remaining <= 0) {
      state.timer.endsAt = null;
      state.timer.remaining = 0;
      const key = getTodayKey();
      state.sessions[key] = (state.sessions[key] || 0) + 1;
      if (timerTicker) window.clearInterval(timerTicker);
      timerTicker = null;
      saveState();
      renderApp();
      showToast('Focus session complete. Take a breath and enjoy the win.');
      return;
    }
    const display = document.getElementById('focus-timer-time');
    const fill = document.getElementById('focus-timer-progress-fill');
    const track = fill?.parentElement;
    const status = document.getElementById('focus-timer-status');
    const progress = Math.round(((state.timer.duration - remaining) / state.timer.duration) * 100);
    if (display) display.textContent = formatTimer(remaining);
    if (fill) fill.style.width = `${progress}%`;
    if (track) track.setAttribute('aria-valuenow', String(progress));
    if (status) status.textContent = 'Stay with one thing. You have got this.';
  }

  function toggleFocusTimer() {
    if (isTimerRunning()) {
      state.timer.remaining = getTimerRemaining();
      state.timer.endsAt = null;
      saveState();
      renderApp();
      return;
    }
    if (getTimerRemaining() <= 0) state.timer.remaining = state.timer.duration;
    state.timer.endsAt = Date.now() + state.timer.remaining * 1000;
    saveState();
    renderApp();
    startTimerTicker();
  }

  function resetFocusTimer() {
    state.timer.endsAt = null;
    state.timer.remaining = state.timer.duration;
    saveState();
    renderApp();
  }

  function setFocusTimerPreset(minutes) {
    const duration = Number(minutes) * 60;
    if (isTimerRunning() || !TIMER_PRESETS.includes(Number(minutes))) return;
    state.timer.duration = duration;
    state.timer.remaining = duration;
    state.timer.endsAt = null;
    saveState();
    renderApp();
  }

  function selectMood(moodId) {
    const mood = MOODS.find((item) => item.id === moodId);
    if (!mood) return;
    const key = getTodayKey();
    selectedMoodDay = key;
    selectedMood = mood.id;
    document.querySelectorAll('.mood-choice').forEach((button) => {
      const active = button.dataset.id === mood.id;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const status = document.getElementById('mood-selection-status');
    if (status) status.textContent = `${mood.label} selected. Add a thought if you like.`;
  }

  function exportData() {
    const content = JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `daymark-backup-${getTodayKey()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Your Daymark backup is ready to download.');
  }

  function handleAction(actionElement) {
    const action = actionElement.dataset.action;
    const id = actionElement.dataset.id;
    switch (action) {
      case 'toggle-sidebar':
        sidebarCollapsed = !sidebarCollapsed;
        applySidebarPreference();
        try {
          localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
        } catch (error) {
          console.warn('Daymark could not save the sidebar preference.', error);
        }
        break;
      case 'add-habit':
        openHabitModal();
        break;
      case 'edit-habit':
        openHabitModal(id);
        break;
      case 'delete-habit': {
        const habit = state.habits.find((item) => item.id === id);
        if (!habit || !window.confirm(`Remove “${habit.name}” from your habit list? Its past check-ins stay in your history.`)) return;
        state.habits = state.habits.filter((item) => item.id !== id);
        saveState();
        renderApp();
        showToast('Habit removed from your routine.');
        break;
      }
      case 'toggle-habit':
        toggleHabit(id);
        break;
      case 'toggle-goal':
        toggleGoal(actionElement.dataset.day, id);
        break;
      case 'delete-goal': {
        const key = actionElement.dataset.day;
        if (Array.isArray(state.goals[key])) {
          state.goals[key] = state.goals[key].filter((goal) => goal.id !== id);
          saveState();
          renderApp();
        }
        break;
      }
      case 'edit-focus':
        editingFocus = true;
        renderApp();
        window.requestAnimationFrame(() => document.querySelector('input[name="focus"]')?.focus());
        break;
      case 'toggle-focus': {
        const key = getTodayKey();
        if (!state.focus[key]) return;
        state.focus[key].done = !state.focus[key].done;
        saveState();
        renderApp();
        break;
      }
      case 'timer-toggle':
        toggleFocusTimer();
        break;
      case 'timer-reset':
        resetFocusTimer();
        break;
      case 'timer-preset':
        setFocusTimerPreset(actionElement.dataset.minutes);
        break;
      case 'select-mood':
        selectMood(id);
        break;
      case 'focus-planner-hour': {
        const slotInput = document.getElementById('planner-slot-input');
        const taskInput = document.getElementById('planner-goal-input');
        if (slotInput && PLAN_HOURS.includes(id)) slotInput.value = id;
        if (taskInput) taskInput.focus();
        break;
      }
      case 'join-challenge':
        startChallenge(id);
        break;
      case 'close-modal':
        closeModal();
        break;
      case 'export':
        exportData();
        break;
      case 'clear-activity':
        if (!window.confirm('Clear all habit check-ins, daily focus, mood notes, focus sessions, and tomorrow’s goals? Your habits and challenge will stay.')) return;
        state.logs = {};
        state.focus = {};
        state.goals = {};
        state.reflections = {};
        state.sessions = {};
        selectedMoodDay = '';
        selectedMood = '';
        reflectionDraftDay = '';
        reflectionDraft = '';
        state.timer.endsAt = null;
        state.timer.remaining = state.timer.duration;
        if (timerTicker) window.clearInterval(timerTicker);
        timerTicker = null;
        saveState();
        renderApp();
        showToast('Your activity has been cleared. Your habits are still here.');
        break;
      case 'reset-all':
        if (!window.confirm('Reset Daymark to its starter habits and erase all saved progress on this device?')) return;
        if (timerTicker) window.clearInterval(timerTicker);
        timerTicker = null;
        state = makeDefaultState();
        currentView = 'today';
        editingFocus = false;
        selectedMoodDay = '';
        selectedMood = '';
        reflectionDraftDay = '';
        reflectionDraft = '';
        saveState();
        renderApp();
        showToast('A fresh workspace is ready.');
        break;
      default:
        break;
    }
  }

  function handleSubmit(event) {
    const form = event.target.closest('form[data-form]');
    if (!form) return;
    event.preventDefault();
    const formData = new FormData(form);
    const formType = form.dataset.form;

    if (formType === 'habit') {
      const name = String(formData.get('name') || '').trim().slice(0, 56);
      const detail = String(formData.get('detail') || '').trim().slice(0, 100);
      const category = CATEGORIES.includes(formData.get('category')) ? formData.get('category') : 'Other';
      const time = TIMES.includes(formData.get('time')) ? formData.get('time') : 'Anytime';
      const selectedDays = typeof formData.getAll === 'function'
        ? [...new Set(formData.getAll('days').map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))]
        : [0, 1, 2, 3, 4, 5, 6];
      const days = selectedDays.length ? selectedDays : [0, 1, 2, 3, 4, 5, 6];
      if (!name) return;
      const existing = state.habits.find((habit) => habit.id === form.dataset.id);
      if (existing) {
        Object.assign(existing, { name, detail, category, time, icon: CATEGORY_ICONS[category], days });
        saveState();
        closeModal();
        renderApp();
        showToast('Your habit has been updated.');
      } else {
        state.habits.push({ id: randomId(), name, detail, category, time, icon: CATEGORY_ICONS[category], days, createdAt: getTodayKey() });
        saveState();
        closeModal();
        renderApp();
        showToast('A new habit is ready when you are.');
      }
      return;
    }

    if (formType === 'goal') {
      const text = String(formData.get('goal') || '').trim().slice(0, 150);
      if (!text) return;
      const key = dateKey(getTomorrowDate());
      const selectedSlot = formData.get('slot');
      const slot = PLAN_HOURS.includes(selectedSlot) ? selectedSlot : '09:00';
      const duration = normalizeGoalDuration(formData.get('duration'));
      const dayGoals = Array.isArray(state.goals[key]) ? state.goals[key] : [];
      if (hasGoalTimeConflict(dayGoals, slot, duration)) {
        showToast('That time overlaps another plan. Choose another hour or a shorter block.');
        return;
      }
      state.goals[key] = dayGoals;
      state.goals[key].push({ id: randomId(), text, done: false, slot, duration });
      saveState();
      renderApp();
      showToast('Added to tomorrow’s plan.');
      return;
    }

    if (formType === 'focus') {
      const text = String(formData.get('focus') || '').trim().slice(0, 150);
      if (!text) return;
      const key = getTodayKey();
      state.focus[key] = { text, done: state.focus[key]?.done || false };
      editingFocus = false;
      saveState();
      renderApp();
      showToast('Your focus is set. One thing at a time.');
      return;
    }

    if (formType === 'tomorrow-focus') {
      const text = String(formData.get('focus') || '').trim().slice(0, 150);
      if (!text) return;
      const key = dateKey(getTomorrowDate());
      state.focus[key] = { text, done: false };
      saveState();
      renderApp();
      showToast('Tomorrow’s priority is set. Keep the rest simple.');
      return;
    }

    if (formType === 'reflection') {
      const key = getTodayKey();
      const note = String(formData.get('note') || '').trim().slice(0, 280);
      const mood = selectedMoodDay === key ? selectedMood : state.reflections[key]?.mood || '';
      if (!mood && !note) {
        showToast('Choose a mood or add a note to save your check-in.');
        return;
      }
      state.reflections[key] = { mood, note };
      selectedMoodDay = '';
      selectedMood = '';
      reflectionDraftDay = '';
      reflectionDraft = '';
      saveState();
      renderApp();
      showToast('Your daily check-in is saved, just for you.');
      return;
    }

    if (formType === 'profile') {
      state.name = String(formData.get('name') || '').trim().slice(0, 32);
      saveState();
      renderApp();
      showToast(state.name ? `Good to have you here, ${state.name}.` : 'Your profile has been updated.');
    }
  }

  function handleView(viewElement) {
    const nextView = viewElement.dataset.view;
    if (!['today', 'habits', 'planner', 'challenges', 'insights', 'settings'].includes(nextView)) return;
    currentView = nextView;
    editingFocus = false;
    renderApp();
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  document.addEventListener('click', (event) => {
    const backdrop = event.target.closest('.modal-backdrop');
    if (backdrop && event.target === backdrop) {
      closeModal();
      return;
    }
    const viewElement = event.target.closest('[data-view]');
    if (viewElement) {
      event.preventDefault();
      handleView(viewElement);
      return;
    }
    const actionElement = event.target.closest('[data-action]');
    if (actionElement) handleAction(actionElement);
  });

  document.addEventListener('submit', handleSubmit);
  document.addEventListener('input', (event) => {
    const input = event.target.closest('#reflection-note');
    if (!input) return;
    reflectionDraftDay = getTodayKey();
    reflectionDraft = input.value;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('has-modal')) closeModal();
  });

  // Use the local calendar date for all summaries and keep the shell's icons accessible.
  hydrateStaticIcons();
  renderApp();
  if (state.timer.endsAt) startTimerTicker();
})();
