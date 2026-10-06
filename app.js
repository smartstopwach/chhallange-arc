(() => {
  'use strict';

  const STORAGE_KEY = 'daymark.app.v1';
  const GUEST_MIGRATION_KEY = 'daymark.guestMigrated.v1';
  let activeStorageKey = STORAGE_KEY;
  let authInitialized = false;
  let authUser = null;
  let authMessage = '';
  let activeSyncUid = '';
  let cloudSyncUnsubscribe = null;
  let cloudSaveTimer = null;
  let cloudSyncStatus = 'connecting';
  let pendingLegacyImport = false;
  let applyingRemoteState = false;
  const SIDEBAR_COLLAPSED_KEY = 'daymark.sidebarCollapsed.v1';
  const DAY_MS = 24 * 60 * 60 * 1000;
  const CATEGORIES = ['Wellness', 'Movement', 'Learning', 'Mindfulness', 'Rest', 'Other'];
  const LEGACY_HABIT_TIMES = ['Morning', 'Afternoon', 'Evening', 'Anytime'];
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
  const HABIT_TIMES = [...PLAN_HOURS, 'Anytime'];
  const HABIT_END_TIMES = Array.from({ length: 24 }, (_, index) => `${String(index + 1).padStart(2, '0')}:00`);
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
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
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
  let habitSearchQuery = '';
  let habitCategoryFilter = 'All';
  let insightsRangeDays = 30;
  let pomodoroRangeDays = 30;
  let reflectionDraftDay = '';
  let reflectionDraft = '';
  let toastTimer = null;
  let timerTicker = null;
  let lastRenderedDay = '';

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

  function isDateKey(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

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

  function makeHabitSuggestions() {
    const everyDay = [0, 1, 2, 3, 4, 5, 6];
    return [
      { id: 'habit-water', name: 'Drink a full glass of water', detail: 'Before your first coffee', category: 'Wellness', time: 'Morning', icon: 'water', days: [...everyDay] },
      { id: 'habit-move', name: 'Move for 20 minutes', detail: 'A walk totally counts', category: 'Movement', time: 'Anytime', icon: 'move', days: [...everyDay] },
      { id: 'habit-read', name: 'Read 10 pages', detail: 'A little every day adds up', category: 'Learning', time: 'Evening', icon: 'book', days: [...everyDay] },
      { id: 'habit-mindful', name: 'Take a mindful pause', detail: 'Try five slow breaths', category: 'Mindfulness', time: 'Afternoon', icon: 'mind', days: [...everyDay] },
      { id: 'habit-rest', name: 'Start winding down by 10:30', detail: 'Give tomorrow-you a head start', category: 'Rest', time: 'Evening', icon: 'moon', days: [...everyDay] },
    ];
  }

  function makeDefaultState() {
    const firstChallenge = CHALLENGES[0];
    return {
      version: 2,
      name: '',
      habits: [],
      skippedHabitSuggestions: [],
      logs: {},
      goals: {},
      focus: {},
      reflections: {},
      sessions: {},
      timer: { duration: 25 * 60, remaining: 25 * 60, endsAt: null },
      challenge: { id: firstChallenge.id, startDate: dateKey(new Date()) },
      updatedAt: 0,
    };
  }

  function isRecord(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }

  // Firestore can return map fields in a different key order than localStorage.
  // Compare normalized state by value, not by JavaScript object insertion order,
  // or an identical snapshot can be mistaken for a conflict and resaved forever.
  function stableStringify(value) {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    if (isRecord(value)) {
      const fields = Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
      return `{${fields.join(',')}}`;
    }
    return JSON.stringify(value);
  }

  function normalizeSkippedHabitSuggestions(value) {
    if (!Array.isArray(value)) return [];
    const suggestionIds = new Set(makeHabitSuggestions().map((habit) => habit.id));
    return [...new Set(value.map(String).filter((id) => suggestionIds.has(id)))];
  }

  function normalizeHabitTime(value) {
    if (HABIT_TIMES.includes(value)) return value;
    if (LEGACY_HABIT_TIMES.includes(value)) {
      return { Morning: '09:00', Afternoon: '14:00', Evening: '19:00', Anytime: 'Anytime' }[value];
    }
    return 'Anytime';
  }

  function habitTimeMinutes(value) {
    if (value === '24:00') return 24 * 60;
    if (!PLAN_HOURS.includes(value)) return null;
    return Number(value.slice(0, 2)) * 60;
  }

  function defaultHabitEndTime(startTime) {
    if (startTime === 'Anytime') return 'Anytime';
    const nextHour = Number(startTime.slice(0, 2)) + 1;
    return `${String(nextHour).padStart(2, '0')}:00`;
  }

  function normalizeHabitEndTime(value, startTime) {
    if (startTime === 'Anytime') return 'Anytime';
    const startMinutes = habitTimeMinutes(startTime);
    return HABIT_END_TIMES.includes(value) && habitTimeMinutes(value) > startMinutes
      ? value
      : defaultHabitEndTime(startTime);
  }

  function formatHabitTime(value, endValue) {
    const startTime = normalizeHabitTime(value);
    if (startTime === 'Anytime') return startTime;
    const endTime = normalizeHabitEndTime(endValue, startTime);
    const startHour = Number(startTime.slice(0, 2));
    const endHour = Number(endTime.slice(0, 2));
    const clockPart = (hour) => `${hour % 12 || 12}:00`;
    const period = (hour) => hour % 24 < 12 ? 'AM' : 'PM';
    if (startHour === 0 && endHour === 24) return '12:00 AM–12:00 AM next day';
    return period(startHour) === period(endHour)
      ? `${clockPart(startHour)}–${clockPart(endHour)} ${period(startHour)}`
      : `${clockPart(startHour)} ${period(startHour)}–${clockPart(endHour)} ${period(endHour)}`;
  }

  function renderHabitEndTimeOptions(startTime, selectedEndTime = '') {
    const startMinutes = habitTimeMinutes(startTime);
    const availableEndTimes = startMinutes === null
      ? []
      : HABIT_END_TIMES.filter((time) => habitTimeMinutes(time) > startMinutes);
    return `<option value="" disabled${selectedEndTime ? '' : ' selected'}>Choose end time</option>${availableEndTimes.map((time) => {
      const label = time === '24:00' ? '12:00 AM (midnight)' : formatClock(Number(time.slice(0, 2)));
      return `<option value="${time}"${selectedEndTime === time ? ' selected' : ''}>${label}</option>`;
    }).join('')}`;
  }

  function refreshHabitEndTimeOptions(form) {
    const startSelect = form?.querySelector('[name="startTime"]');
    const endSelect = form?.querySelector('[name="endTime"]');
    if (!startSelect || !endSelect) return;
    const selectedEndTime = endSelect.value;
    const startMinutes = habitTimeMinutes(startSelect.value);
    const availableEndTimes = startMinutes === null
      ? []
      : HABIT_END_TIMES.filter((time) => habitTimeMinutes(time) > startMinutes);
    endSelect.innerHTML = renderHabitEndTimeOptions(startSelect.value, availableEndTimes.includes(selectedEndTime) ? selectedEndTime : '');
  }

  function findHabitScheduleConflict(candidate, excludedHabitId = '') {
    const candidateStart = habitTimeMinutes(candidate.time);
    const candidateEnd = habitTimeMinutes(candidate.endTime);
    if (candidateStart === null || candidateEnd === null) return null;
    for (const habit of state.habits) {
      if (habit.id === excludedHabitId || habit.time === 'Anytime') continue;
      const sharedDays = candidate.days.filter((day) => habit.days.includes(day));
      if (!sharedDays.length) continue;
      const start = habitTimeMinutes(habit.time);
      const end = habitTimeMinutes(habit.endTime);
      if (start !== null && end !== null && candidateStart < end && start < candidateEnd) {
        return { habit, days: sharedDays };
      }
    }
    return null;
  }

  function isUnmodifiedSuggestion(habit, suggestion) {
    const suggestedStart = normalizeHabitTime(suggestion.time);
    return habit.templateId !== suggestion.id
      && habit.name === suggestion.name
      && habit.detail === suggestion.detail
      && habit.category === suggestion.category
      && habit.time === suggestedStart
      && habit.endTime === defaultHabitEndTime(suggestedStart)
      && habit.icon === suggestion.icon
      && JSON.stringify(habit.days) === JSON.stringify(suggestion.days);
  }

  function randomId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') return globalThis.crypto.randomUUID();
    return `dm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function normalizeHabit(habit, index) {
    if (!isRecord(habit)) return null;
    const name = String(habit.name || '').trim().slice(0, 56);
    if (!name) return null;
    const category = CATEGORIES.includes(habit.category) ? habit.category : 'Other';
    const time = normalizeHabitTime(habit.startTime || habit.time);
    const endTime = normalizeHabitEndTime(habit.endTime, time);
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
      endTime,
      templateId: typeof habit.templateId === 'string' ? habit.templateId.slice(0, 100) : '',
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

  function normalizeStateData(saved) {
    const defaults = makeDefaultState();
    if (!isRecord(saved)) return { state: defaults, recoveredFinishedTimer: false };
    const logs = normalizeLogs(saved.logs);
    const suggestions = makeHabitSuggestions();
    const normalizedHabits = Array.isArray(saved.habits)
      ? saved.habits.map(normalizeHabit).filter(Boolean)
      : defaults.habits;
    const habits = normalizedHabits.filter((habit) => {
      const suggestion = suggestions.find((item) => item.id === habit.id);
      if (!suggestion || !isUnmodifiedSuggestion(habit, suggestion)) return true;
      const hasHistory = Object.values(logs).some((record) => record[habit.id] === true);
      return hasHistory;
    });
    const savedChallenge = isRecord(saved.challenge) ? saved.challenge : {};
    const savedChallengeDefinition = CHALLENGES.find((item) => item.id === savedChallenge.id);
    const challenge = savedChallengeDefinition || CHALLENGES[0];
    const sessions = normalizeSessions(saved.sessions);
    const timer = normalizeTimer(saved.timer);
    const recoveredFinishedTimer = timer.justFinished;
    if (recoveredFinishedTimer) sessions[dateKey(new Date())] = (sessions[dateKey(new Date())] || 0) + 1;
    delete timer.justFinished;
    const normalizedState = {
      version: 2,
      name: typeof saved.name === 'string' ? saved.name.trim().slice(0, 32) : '',
      habits,
      skippedHabitSuggestions: normalizeSkippedHabitSuggestions(saved.skippedHabitSuggestions),
      logs,
      goals: normalizeGoals(saved.goals),
      focus: normalizeFocus(saved.focus),
      reflections: normalizeReflections(saved.reflections),
      sessions,
      timer,
      challenge: {
        id: challenge.id,
        startDate: savedChallengeDefinition && isDateKey(savedChallenge.startDate) ? savedChallenge.startDate : dateKey(new Date()),
      },
      updatedAt: Number.isFinite(Number(saved.updatedAt)) ? Number(saved.updatedAt) : 0,
    };
    return { state: normalizedState, recoveredFinishedTimer };
  }

  function loadState(storageKey = activeStorageKey) {
    const defaults = makeDefaultState();
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return defaults;
      const { state: normalizedState, recoveredFinishedTimer } = normalizeStateData(JSON.parse(raw));
      if (recoveredFinishedTimer) {
        normalizedState.updatedAt = Math.max(Date.now(), (Number(normalizedState.updatedAt) || 0) + 1);
        try {
          localStorage.setItem(storageKey, JSON.stringify(normalizedState));
        } catch (_) {
          // Keep the recovered session in memory if browser storage is unavailable.
        }
      }
      return normalizedState;
    } catch (error) {
      console.warn('Daymark could not load saved data; starting with a fresh workspace.', error);
      return defaults;
    }
  }

  function saveState(options = {}) {
    const touch = options.touch !== false;
    const shouldSync = options.sync !== false;
    if (touch) state.updatedAt = Math.max(Date.now(), (Number(state.updatedAt) || 0) + 1);
    let savedLocally = false;
    try {
      localStorage.setItem(activeStorageKey, JSON.stringify(state));
      savedLocally = true;
    } catch (error) {
      console.warn('Daymark could not save to this browser.', error);
      showToast('Your browser could not save this update. Check available storage.');
    }
    if (shouldSync && authUser && !applyingRemoteState) scheduleCloudSave();
    return savedLocally;
  }

  function hasMeaningfulState(candidate) {
    if (!isRecord(candidate)) return false;
    const timer = isRecord(candidate.timer) ? candidate.timer : {};
    return Boolean(candidate.name)
      || (Array.isArray(candidate.habits) && candidate.habits.length > 0)
      || Object.keys(candidate.logs || {}).length > 0
      || Object.values(candidate.goals || {}).some((items) => Array.isArray(items) && items.length > 0)
      || Object.keys(candidate.focus || {}).length > 0
      || Object.keys(candidate.reflections || {}).length > 0
      || Object.keys(candidate.sessions || {}).length > 0
      || Boolean(timer.endsAt)
      || Number(timer.duration) !== 25 * 60
      || Number(timer.remaining) !== Number(timer.duration);
  }

  function mergeStateSnapshots(localState, remoteState) {
    const local = isRecord(localState) ? localState : makeDefaultState();
    const remote = isRecord(remoteState) ? remoteState : makeDefaultState();
    const localIsNewer = Number(local.updatedAt) >= Number(remote.updatedAt);
    const habits = new Map((local.habits || []).map((habit) => [habit.id, habit]));
    (remote.habits || []).forEach((habit) => habits.set(habit.id, habit));
    const logs = {};
    [local.logs, remote.logs].forEach((collection) => {
      Object.entries(collection || {}).forEach(([day, record]) => {
        logs[day] = { ...(logs[day] || {}), ...(isRecord(record) ? record : {}) };
      });
    });
    const goals = {};
    [local.goals, remote.goals].forEach((collection) => {
      Object.entries(collection || {}).forEach(([day, items]) => {
        const merged = new Map((goals[day] || []).map((item) => [item.id, item]));
        (Array.isArray(items) ? items : []).forEach((item) => merged.set(item.id, item));
        goals[day] = [...merged.values()];
      });
    });
    const sessions = { ...(local.sessions || {}) };
    Object.entries(remote.sessions || {}).forEach(([day, count]) => {
      sessions[day] = Math.max(Number(sessions[day]) || 0, Number(count) || 0);
    });
    return {
      ...remote,
      name: remote.name || local.name || '',
      habits: [...habits.values()],
      skippedHabitSuggestions: [...new Set([...(local.skippedHabitSuggestions || []), ...(remote.skippedHabitSuggestions || [])])],
      logs,
      goals,
      focus: { ...(local.focus || {}), ...(remote.focus || {}) },
      reflections: { ...(local.reflections || {}), ...(remote.reflections || {}) },
      sessions,
      timer: localIsNewer ? local.timer : remote.timer,
      challenge: localIsNewer ? local.challenge : remote.challenge,
      updatedAt: Math.max(Number(local.updatedAt) || 0, Number(remote.updatedAt) || 0),
    };
  }

  function updateCloudSyncIndicator() {
    const indicator = document.getElementById('cloud-sync-status');
    if (!indicator) return;
    const labels = {
      connecting: 'Checking account',
      syncing: 'Syncing…',
      pending: 'Saving…',
      synced: 'Synced',
      offline: 'Offline · saved here',
      error: 'Sync needs attention',
    };
    indicator.textContent = labels[cloudSyncStatus] || 'Syncing…';
    indicator.dataset.status = cloudSyncStatus;
    indicator.setAttribute('aria-label', `Cloud sync status: ${indicator.textContent}`);
    const accountStatus = document.querySelector('.account-sync-state');
    if (accountStatus) {
      const accountLabels = { connecting: 'Connecting', syncing: 'Syncing', pending: 'Saving changes', synced: 'Up to date', offline: 'Offline · saved on this device', error: 'Sync needs attention' };
      accountStatus.dataset.status = cloudSyncStatus;
      accountStatus.innerHTML = `<i aria-hidden="true"></i>${escapeHtml(accountLabels[cloudSyncStatus] || 'Syncing')}`;
    }
  }

  function stopCloudSync() {
    if (typeof cloudSyncUnsubscribe === 'function') cloudSyncUnsubscribe();
    cloudSyncUnsubscribe = null;
    activeSyncUid = '';
    if (cloudSaveTimer) window.clearTimeout(cloudSaveTimer);
    cloudSaveTimer = null;
  }

  async function persistCloudSnapshot(uid, snapshot) {
    if (!window.DaymarkFirebase?.saveUserState || !authUser || authUser.uid !== uid) return;
    try {
      const result = await window.DaymarkFirebase.saveUserState(uid, snapshot, Number(snapshot.updatedAt) || 0);
      if (!authUser || authUser.uid !== uid) return;
      if (result?.accepted) {
        cloudSyncStatus = Number(state.updatedAt) === Number(snapshot.updatedAt) ? 'synced' : 'pending';
        updateCloudSyncIndicator();
        return;
      }
      if (result?.accepted === false) {
        if (!isRecord(result.remote?.state)) {
          cloudSyncStatus = 'error';
          updateCloudSyncIndicator();
          return;
        }
        const remote = normalizeStateData(result.remote.state).state;
        remote.updatedAt = Number(result.remote.updatedAtMs) || Number(remote.updatedAt) || 0;
        const merged = mergeStateSnapshots(state, remote);
        merged.updatedAt = Math.max(Date.now(), remote.updatedAt + 1, Number(state.updatedAt) || 0);
        state = merged;
        pendingLegacyImport = false;
        saveState({ touch: false });
        renderApp();
        return;
      }
      cloudSyncStatus = 'synced';
      updateCloudSyncIndicator();
    } catch (error) {
      console.warn('Daymark could not sync this update to Firestore.', error);
      cloudSyncStatus = error?.code === 'permission-denied' ? 'error' : 'offline';
      updateCloudSyncIndicator();
    }
  }

  function scheduleCloudSave() {
    if (!authUser || !window.DaymarkFirebase?.saveUserState) return;
    const uid = authUser.uid;
    if (cloudSaveTimer) window.clearTimeout(cloudSaveTimer);
    cloudSyncStatus = 'pending';
    updateCloudSyncIndicator();
    const snapshot = JSON.parse(JSON.stringify(state));
    cloudSaveTimer = window.setTimeout(() => {
      cloudSaveTimer = null;
      void persistCloudSnapshot(uid, snapshot);
    }, 500);
  }

  async function flushCloudSave() {
    if (!authUser || !cloudSaveTimer) return;
    window.clearTimeout(cloudSaveTimer);
    cloudSaveTimer = null;
    const snapshot = JSON.parse(JSON.stringify(state));
    await persistCloudSnapshot(authUser.uid, snapshot);
  }

  function applyRemoteState(remoteValue, updatedAtMs) {
    const normalizedResult = normalizeStateData(remoteValue);
    const normalized = normalizedResult.state;
    normalized.updatedAt = Number(updatedAtMs) || Number(normalized.updatedAt) || 0;
    if (normalizedResult.recoveredFinishedTimer) normalized.updatedAt = Math.max(Date.now(), normalized.updatedAt + 1);
    applyingRemoteState = true;
    state = normalized;
    saveState({ touch: false, sync: false });
    applyingRemoteState = false;
    if (normalizedResult.recoveredFinishedTimer) scheduleCloudSave();
    if (timerTicker) window.clearInterval(timerTicker);
    timerTicker = null;
    if (state.timer.endsAt) startTimerTicker();
    renderApp();
  }

  function handleCloudSnapshot(uid, snapshot) {
    if (!authUser || authUser.uid !== uid || activeSyncUid !== uid) return;
    if (snapshot.fromCache) {
      if (snapshot.exists && !hasMeaningfulState(state)) {
        applyRemoteState(snapshot.state, snapshot.updatedAtMs);
      }
      cloudSyncStatus = navigator.onLine ? 'syncing' : 'offline';
      updateCloudSyncIndicator();
      return;
    }
    if (snapshot.hasPendingWrites) {
      cloudSyncStatus = 'syncing';
      updateCloudSyncIndicator();
      return;
    }
    if (!snapshot.exists) {
      pendingLegacyImport = false;
      cloudSyncStatus = 'pending';
      scheduleCloudSave();
      return;
    }
    if (!isRecord(snapshot.state)) {
      cloudSyncStatus = 'error';
      updateCloudSyncIndicator();
      return;
    }
    const remote = normalizeStateData(snapshot.state).state;
    remote.updatedAt = Number(snapshot.updatedAtMs) || Number(remote.updatedAt) || 0;
    const localUpdatedAt = Number(state.updatedAt) || 0;
    const remoteUpdatedAt = Number(snapshot.updatedAtMs) || Number(remote.updatedAt) || 0;
    if (pendingLegacyImport) {
      state = mergeStateSnapshots(state, remote);
      state.updatedAt = Math.max(Date.now(), remoteUpdatedAt + 1);
      pendingLegacyImport = false;
      saveState({ touch: false });
      renderApp();
      return;
    }
    const equalVersionConflict = remoteUpdatedAt === localUpdatedAt
      && stableStringify(remote) !== stableStringify(state);
    if (!hasMeaningfulState(state) || remoteUpdatedAt > localUpdatedAt) {
      cloudSyncStatus = 'synced';
      applyRemoteState(snapshot.state, remoteUpdatedAt);
      updateCloudSyncIndicator();
      return;
    }
    if (equalVersionConflict) {
      state = mergeStateSnapshots(state, remote);
      state.updatedAt = Math.max(Date.now(), remoteUpdatedAt + 1);
      saveState({ touch: false });
      renderApp();
      return;
    }
    if (localUpdatedAt > remoteUpdatedAt) {
      scheduleCloudSave();
      return;
    }
    cloudSyncStatus = 'synced';
    updateCloudSyncIndicator();
  }

  function startCloudSync(uid) {
    if (!window.DaymarkFirebase?.subscribeUserState) {
      cloudSyncStatus = 'error';
      updateCloudSyncIndicator();
      return;
    }
    stopCloudSync();
    activeSyncUid = uid;
    cloudSyncStatus = 'syncing';
    updateCloudSyncIndicator();
    try {
      cloudSyncUnsubscribe = window.DaymarkFirebase.subscribeUserState(
        uid,
        (snapshot) => handleCloudSnapshot(uid, snapshot),
        (error) => {
          console.warn('Daymark could not read Firestore data.', error);
          cloudSyncStatus = error?.code === 'permission-denied' ? 'error' : 'offline';
          updateCloudSyncIndicator();
        },
      );
    } catch (error) {
      console.warn('Daymark could not start Firestore sync.', error);
      cloudSyncStatus = 'error';
      updateCloudSyncIndicator();
    }
  }

  function handleFirebaseAuthState(detail = {}) {
    authInitialized = true;
    const incomingUser = detail.user || null;
    authMessage = '';
    if (!incomingUser?.uid) {
      if (authUser) {
        stopCloudSync();
        authUser = null;
        activeStorageKey = STORAGE_KEY;
        pendingLegacyImport = false;
        state = makeDefaultState();
        if (timerTicker) window.clearInterval(timerTicker);
        timerTicker = null;
      }
      cloudSyncStatus = 'connecting';
      renderApp();
      return;
    }
    if (authUser?.uid === incomingUser.uid) {
      authUser = incomingUser;
      renderApp();
      return;
    }
    stopCloudSync();
    authUser = incomingUser;
    const userStorageKey = `${STORAGE_KEY}.user.${incomingUser.uid}`;
    let hasUserCache = false;
    let guestAlreadyMigrated = false;
    try {
      hasUserCache = localStorage.getItem(userStorageKey) !== null;
      guestAlreadyMigrated = localStorage.getItem(GUEST_MIGRATION_KEY) === 'true';
    } catch (_) {
      // Continue with the in-memory state if browser storage is unavailable.
    }
    const guestCandidate = !hasUserCache && !guestAlreadyMigrated ? loadState(STORAGE_KEY) : null;
    pendingLegacyImport = Boolean(guestCandidate && hasMeaningfulState(guestCandidate));
    activeStorageKey = userStorageKey;
    state = hasUserCache ? loadState(userStorageKey) : pendingLegacyImport ? guestCandidate : makeDefaultState();
    if (pendingLegacyImport) {
      try {
        localStorage.setItem(GUEST_MIGRATION_KEY, 'true');
      } catch (_) {
        // A later sign-in may retry importing the legacy local data.
      }
    }
    saveState({ touch: false, sync: false });
    if (timerTicker) window.clearInterval(timerTicker);
    timerTicker = null;
    if (state.timer.endsAt) startTimerTicker();
    currentView = 'today';
    cloudSyncStatus = 'syncing';
    renderApp();
    startCloudSync(incomingUser.uid);
  }

  function handleFirebaseAuthError(detail = {}) {
    authMessage = String(detail.message || 'Google sign-in could not be completed. Please try again.');
    if (authUser) showToast(authMessage);
    else renderApp();
  }

  function beginGoogleSignIn() {
    authMessage = '';
    renderApp();
    if (!window.DaymarkFirebase?.signInWithGoogle) {
      authMessage = 'Secure sign-in is still loading. Check your connection and try again.';
      renderApp();
      return;
    }
    window.DaymarkFirebase.signInWithGoogle().catch((error) => {
      handleFirebaseAuthError({ message: error?.daymarkMessage || 'Google sign-in could not be completed. Please try again.' });
    });
  }

  function beginSignOut() {
    void flushCloudSave().finally(() => {
      window.DaymarkFirebase?.signOut?.().catch((error) => {
        showToast(error?.message || 'Could not sign out. Please try again.');
      });
    });
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
    if (!record || !Object.values(record).some(Boolean)) return false;
    return Object.entries(record).some(([habitId, checked]) => {
      if (!checked) return false;
      const habit = state.habits.find((item) => item.id === habitId);
      if (!habit) return true; // Keep completed history for habits that were later removed.
      return !isDateKey(habit.createdAt) || dayKey >= habit.createdAt;
    });
  }
  function scheduledHabitsOn(dayKey) {
    const weekday = dateFromKey(dayKey).getDay();
    return state.habits.filter((habit) => {
      const habitHasStarted = !isDateKey(habit.createdAt) || dayKey >= habit.createdAt;
      const isScheduled = !Array.isArray(habit.days) || habit.days.includes(weekday);
      return habitHasStarted && isScheduled;
    });
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
    const earliestCreatedAt = state.habits.every((habit) => isDateKey(habit.createdAt))
      ? state.habits.map((habit) => habit.createdAt).sort()[0]
      : '';
    let date = new Date();
    const todayKey = dateKey(date);
    if (scheduledHabitsOn(todayKey).length && !hasCheckin(todayKey)) date = addDays(date, -1);
    let streak = 0;
    let checkedDays = 0;
    let scannedDays = 0;
    while (checkedDays < 3660 && scannedDays < 3660) {
      scannedDays += 1;
      const key = dateKey(date);
      if (earliestCreatedAt && key < earliestCreatedAt) break;
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

  function getHabitStreak(habit) {
    const repeatDays = Array.isArray(habit.days) && habit.days.length ? habit.days : [0, 1, 2, 3, 4, 5, 6];
    let date = new Date();
    const todayKey = dateKey(date);
    if (repeatDays.includes(date.getDay()) && !isCheckedOn(todayKey, habit.id)) date = addDays(date, -1);
    let streak = 0;
    let scannedDays = 0;
    while (scannedDays < 3660) {
      scannedDays += 1;
      const key = dateKey(date);
      if (isDateKey(habit.createdAt) && key < habit.createdAt) break;
      if (!repeatDays.includes(date.getDay())) {
        date = addDays(date, -1);
        continue;
      }
      if (!isCheckedOn(key, habit.id)) break;
      streak += 1;
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

  function renderAuthLoadingView() {
    return `<main class="auth-gate auth-gate-loading"><section class="auth-panel auth-loading-panel" aria-live="polite"><span class="brand-mark auth-brand-mark" aria-hidden="true"><span></span><span></span><span></span><span></span></span><p class="auth-eyebrow">DAYMARK · YOUR PRIVATE WORKSPACE</p><span class="auth-spinner" aria-hidden="true"></span><h1>Restoring your<br/><span>workspace.</span></h1><p>Checking your secure sign-in. Your habits and plans are waiting.</p></section></main>`;
  }

  function renderLoginView() {
    const firebaseReady = Boolean(window.DaymarkFirebase?.signInWithGoogle);
    const message = authMessage || (firebaseReady
      ? 'Your habits and progress sync securely to your Google account.'
      : 'Secure sign-in could not load. Check your connection and reload the page.');
    return `<main class="auth-gate"><div class="auth-glow auth-glow-one" aria-hidden="true"></div><div class="auth-glow auth-glow-two" aria-hidden="true"></div><section class="auth-panel" aria-labelledby="auth-title"><a class="auth-brand" href="#" aria-label="Daymark"><span class="brand-mark auth-brand-mark" aria-hidden="true"><span></span><span></span><span></span><span></span></span><span>daymark<span>.</span></span></a><p class="auth-eyebrow">A CALMER WAY TO SHOW UP</p><h1 id="auth-title">Make room for<br/><span>what matters.</span></h1><p class="auth-description">Your routines, reflections, and focus sessions—together in one quiet space, ready wherever you sign in.</p><button class="button button-primary auth-google-button" type="button" data-action="google-sign-in"${firebaseReady ? '' : ' disabled'}><svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11c-.5 2.5-1.9 4.6-4 6v5.1h6.5c3.8-3.5 6.1-8.6 6.1-14.8Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8L31 34.1c-1.8 1.2-4.1 2-7 2-5.3 0-9.8-3.6-11.4-8.4H5.9V33C9.3 39.6 16.1 44 24 44Z"/><path fill="#FBBC05" d="M12.6 27.7a12 12 0 0 1 0-7.4V15H5.9a20 20 0 0 0 0 17.9l6.7-5.2Z"/><path fill="#EA4335" d="M24 11.9c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 5.8 29.5 4 24 4 16.1 4 9.3 8.4 5.9 15l6.7 5.2c1.6-4.8 6.1-8.3 11.4-8.3Z"/></svg><span>Continue with Google</span></button><p class="auth-feedback${authMessage ? ' is-error' : ''}" role="status" aria-live="polite">${escapeHtml(message)}</p><div class="auth-security-note"><span class="auth-lock-icon">${icon('lock', 15)}</span><span>Private by design. Only you can access your Daymark data.</span></div><div class="auth-divider"><span></span><small>YOUR DAY, YOUR PACE</small><span></span></div><p class="auth-footnote">Sign-in is required to keep your workspace in sync across devices. We never post on your behalf.</p></section><footer class="auth-footer">A little progress, every day. <span>© Daymark</span></footer></main>`;
  }

  function renderNav() {
    document.querySelectorAll('.main-nav [data-view], .settings-link').forEach((button) => {
      const active = button.dataset.view === currentView;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    const breadcrumb = document.getElementById('breadcrumb-current');
    if (breadcrumb) breadcrumb.textContent = ({ today: 'Today', habits: 'Habits', planner: 'Planner', pomodoro: 'Pomodoro', challenges: 'Challenges', insights: 'Insights', settings: 'Settings' })[currentView] || 'Today';
    const topDate = document.getElementById('top-date');
    if (topDate) topDate.textContent = compactDate(new Date());
    const profileName = document.getElementById('profile-name');
    const profileAvatar = document.getElementById('profile-avatar');
    const visibleName = state.name || authUser?.displayName || authUser?.email || 'Your space';
    if (profileName) profileName.textContent = visibleName;
    if (profileAvatar) profileAvatar.textContent = visibleName.trim().charAt(0).toUpperCase() || 'D';
    updateCloudSyncIndicator();
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
    const renderedDay = getTodayKey();
    const authGated = !authInitialized || !authUser;
    document.body.classList.toggle('auth-gated', authGated);
    applySidebarPreference();
    if (authGated) {
      host.innerHTML = authInitialized ? renderLoginView() : renderAuthLoadingView();
      lastRenderedDay = renderedDay;
      renderNav();
      document.title = authInitialized ? 'Sign in · Daymark' : 'Daymark';
      return;
    }
    const pages = {
      today: renderTodayView,
      habits: renderHabitsView,
      planner: renderPlannerView,
      pomodoro: renderPomodoroView,
      challenges: renderChallengesView,
      insights: renderInsightsView,
      settings: renderSettingsView,
    };
    host.innerHTML = (pages[currentView] || renderTodayView)();
    lastRenderedDay = renderedDay;
    renderNav();
    document.title = `${({ today: 'Today', habits: 'Habits', planner: 'Planner', pomodoro: 'Pomodoro', challenges: 'Challenges', insights: 'Insights', settings: 'Settings' })[currentView] || 'Today'} · Daymark`;
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
    const hasHabits = state.habits.length > 0;
    return `<section class="stats-grid" aria-label="Your daily stats">
      ${renderStatCard('Current streak', String(getCurrentStreak()), 'days', getCurrentStreak() ? 'A little progress, every day' : 'Start with one small win', 'flame', 'amber')}
      ${renderStatCard("Today's progress", todayHabits.length ? `${percent}%` : '—', '', todayHabits.length ? `${done} of ${todayHabits.length} habits due today` : hasHabits ? 'A well-earned rest day' : 'Choose which habits to track', 'check-circle', 'lime')}
      ${renderStatCard('7-day average', hasHabits ? `${weekly}%` : '—', '', hasHabits ? 'Rest days do not lower your average' : 'Choose a habit to start your history', 'chart', 'blue')}
      ${renderStatCard("Tomorrow's plan", String(tomorrowGoals.length), 'goals', tomorrowGoals.length ? `${doneGoals} checked off so far` : 'Give tomorrow a head start', 'calendar', 'violet')}
    </section>`;
  }

  function getHabitIcon(habit) {
    const icons = Object.values(CATEGORY_ICONS);
    return icons.includes(habit.icon) ? habit.icon : CATEGORY_ICONS[habit.category] || 'sparkles';
  }

  function renderHabitWeekStrip(habit) {
    const week = getLastDays(7);
    const todayKey = getTodayKey();
    const statuses = week.map((day) => {
      const existed = !isDateKey(habit.createdAt) || day.key >= habit.createdAt;
      const due = existed && (!Array.isArray(habit.days) || habit.days.includes(day.date.getDay()));
      const complete = due && isCheckedOn(day.key, habit.id);
      const status = !existed ? 'not started' : !due ? 'rest day' : complete ? 'complete' : day.key === todayKey ? 'not checked yet' : 'not checked';
      const label = `${formatDate(day.date, { weekday: 'long', month: 'short', day: 'numeric' })}: ${status}`;
      return { due, complete, today: day.key === todayKey, label };
    });
    const accessibleLabel = statuses.map((item) => item.label).join('; ');
    const dots = statuses.map(({ due, complete, today, label }) => `<span class="habit-week-dot${complete ? ' is-done' : due ? today ? ' is-pending' : ' is-open' : ' is-rest'}" title="${escapeHtml(label)}"></span>`).join('');
    return `<span class="habit-week-strip" role="img" aria-label="Last seven days: ${escapeHtml(accessibleLabel)}" title="Last 7 days">${dots}</span>`;
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
    const streakDays = managed ? getHabitStreak(habit) : 0;
    const streakLabel = streakDays
      ? `${streakDays} scheduled habit day${streakDays === 1 ? '' : 's'} in a row`
      : 'No active streak yet';
    const scheduledTime = formatHabitTime(habit.time, habit.endTime);
    const meta = managed
      ? `<div class="management-row-meta"><span class="category-pill">${escapeHtml(habit.category)}</span><span class="habit-time">${icon('clock', 10)}${escapeHtml(scheduledTime)}</span><span class="schedule-pill" title="${escapeHtml(formatSchedule(habit.days))}">${escapeHtml(formatSchedule(habit.days))}</span><span class="habit-streak-pill${streakDays ? ' is-active' : ''}" aria-label="${escapeHtml(streakLabel)}" title="${escapeHtml(streakLabel)}">${icon('flame', 11)}<strong>${streakDays}</strong><small>${streakDays === 1 ? 'day' : 'days'}</small></span>${renderHabitWeekStrip(habit)}</div>`
      : '';
    const dueTime = !managed
      ? `<span class="habit-due-time" aria-label="${escapeHtml(habit.time === 'Anytime' ? 'No fixed time' : `Time range ${scheduledTime}`)}">${icon('clock', 11)}<span>${habit.time === 'Anytime' ? 'Anytime' : `Due ${escapeHtml(scheduledTime)}`}</span></span>`
      : '';
    const unavailable = managed && !scheduledToday;
    const actionLabel = unavailable
      ? `${name} is not scheduled today`
      : `${checked ? 'Undo completion for' : 'Complete'} ${name}${habit.time === 'Anytime' ? '' : `, time range ${scheduledTime}`}`;
    return `<li class="habit-row${checked ? ' is-complete' : ''}${unavailable ? ' is-off-day' : ''}">
      <span class="habit-symbol tone-${symbol}">${icon(symbol, 18)}</span>
      <div class="habit-copy">
        <div class="habit-title-line"><span class="habit-name">${name}</span></div>
        ${managed ? meta : detail}
      </div>
      <div class="habit-row-actions">
        ${dueTime}
        <button type="button" class="check-toggle${checked ? ' is-checked' : ''}" role="checkbox" aria-checked="${checked}" aria-label="${actionLabel}" data-action="toggle-habit" data-id="${safeId}" data-day="${todayKey}"${unavailable ? ' disabled' : ''}>${icon('check', 14)}</button>
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
        : `<div class="habit-empty"><div><span class="habit-empty-icon">${icon('checklist', 20)}</span><strong>No habits chosen yet.</strong><p>Pick only the ideas that feel right. Nothing is tracked until you choose it.</p><button class="button button-primary button-small" type="button" data-view="habits">${icon('checklist', 14)} Choose your habits</button></div></div>`;
    const progressSummary = total
      ? `<strong>${done}</strong> / ${total} due <span class="progress-percent">${percent}%</span>`
      : state.habits.length ? '<strong>0</strong> / 0 due' : '<strong>Choose what fits</strong>';
    return `<section class="card card-pad habits-card" aria-labelledby="today-habits-title">
      <div class="card-header">
        <div class="card-heading"><span class="card-heading-icon">${icon('check-square', 18)}</span><div class="card-heading-copy"><h2 id="today-habits-title">Today's habits</h2><p>${total ? 'A few small promises, just for today.' : state.habits.length ? 'Your schedule should leave room to breathe.' : 'Nothing is pre-selected.'}</p></div></div>
        <button class="button-link" type="button" data-view="habits">${state.habits.length ? 'Manage' : 'Choose habits'} ${icon('arrow', 14)}</button>
      </div>
      <div class="habit-progress-block"><div class="progress-meta"><span>Daily progress</span><span>${progressSummary}</span></div><div class="progress-track" role="progressbar" aria-label="Today's habit completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div></div>
      ${content}
      <div class="card-note">${icon('sparkles', 13)}<span>${total ? 'Done is better than perfect. Even one check-in counts.' : state.habits.length ? 'Rest is part of your plan, too.' : 'Nothing gets added automatically. Your routine is yours to choose.'}</span></div>
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
    const markerIndexes = new Set();
    if (series.length > 90) {
      for (let start = 0; start < points.length; start += 7) {
        const week = points.slice(start, start + 7);
        const dueDay = week.findIndex((point) => !point.restDay);
        markerIndexes.add(start + (dueDay >= 0 ? dueDay : 0));
      }
      const todayIndex = points.findIndex((point) => point.item.key === getTodayKey());
      if (todayIndex >= 0) markerIndexes.add(todayIndex);
    }
    const visiblePoints = series.length > 90 ? points.filter((_, index) => markerIndexes.has(index)) : points;
    const pointMarkup = visiblePoints.map(({ item, value, x, y, restDay }) => {
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
    const hasTrackedDays = trackedSeries.length > 0;
    const bestDay = trackedSeries.reduce((best, item) => item.percent > (best?.percent ?? -1) ? item : best, null);
    const hasActivity = series.some((item) => item.checkin);
    const chartDescription = hasTrackedDays
      ? series.map((item) => `${formatDate(item.date, { weekday: 'long' })}: ${item.scheduled ? `${item.percent}%` : 'rest day'}`).join('; ')
      : 'No habits have been chosen yet.';
    const chartPlot = hasTrackedDays
      ? renderActivityPlot(series, 'week-activity')
      : `<div class="activity-chart-empty">${icon('checklist', 18)}<span>Choose habits to start your progress line.</span></div>`;
    const labels = series.map((item) => `<span${item.key === getTodayKey() ? ' class="is-today"' : ''}>${escapeHtml(formatDate(item.date, { weekday: 'short' }).replace('.', ''))}</span>`).join('');
    return `<section class="card chart-card" aria-labelledby="weekly-chart-title">
      <div class="card-header"><div class="card-heading"><span class="card-heading-icon">${icon('chart', 18)}</span><div class="card-heading-copy"><h2 id="weekly-chart-title">Your week, in rhythm</h2><p>${hasTrackedDays ? 'Scheduled habit completion through today; rest days are not counted.' : 'Choose only the habits you want; nothing is pre-filled.'}</p></div></div><span class="chart-period">${icon('calendar', 12)} 7 days</span></div>
      <div class="chart-summary"><strong>${hasTrackedDays ? `${average}%` : '—'}</strong><span>average completion</span><span class="chart-legend">Habits done</span></div>
      <div class="activity-chart" role="img" aria-label="${hasTrackedDays ? `Habit completion over the last seven days, average ${average} percent. ${escapeHtml(chartDescription)}` : 'No habits selected yet. Choose habits to start tracking your progress.'}"><div class="activity-chart-axis" aria-hidden="true"><span>100%</span><span>50%</span><span>0%</span></div>${chartPlot}<div class="activity-day-labels" aria-hidden="true">${labels}</div></div>
      <div class="chart-foot">${hasTrackedDays && hasActivity && bestDay ? `<span>Best day: <strong>${escapeHtml(formatDate(bestDay.date, { weekday: 'long' }))}</strong></span><button class="button-link" type="button" data-view="insights">More insights ${icon('arrow', 13)}</button>` : `<span class="chart-empty-message">${hasTrackedDays ? 'Your first check-in will bring this chart to life.' : 'Your progress line appears after you add a habit.'}</span><button class="button-link" type="button" data-view="insights">See insights ${icon('arrow', 13)}</button>`}</div>
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
        ? `<p class="focus-empty">What would make today feel like a good day?</p><form class="inline-form" data-form="focus" data-day="${todayKey}"><input class="inline-input" name="focus" type="text" maxlength="150" required autocomplete="off" placeholder="Set one small priority…" aria-label="Today's main focus" value="${escapeHtml(focus?.text || '')}" /><button class="inline-submit" type="submit" aria-label="Save today's focus">${icon('arrow', 16)}</button></form>`
        : `<div class="focus-task${focus.done ? ' is-done' : ''}"><button class="check-toggle${focus.done ? ' is-checked' : ''}" type="button" role="checkbox" aria-checked="${focus.done}" aria-label="${focus.done ? 'Mark focus incomplete' : 'Complete today’s focus'}" data-action="toggle-focus" data-day="${todayKey}">${icon('check', 14)}</button><div class="focus-task-copy"><strong>${escapeHtml(focus.text)}</strong><small>${focus.done ? 'That is one meaningful thing, done.' : 'A clear intention for the day.'}</small></div></div>`}
    </section>`;
  }

  function renderFocusTimerCard(featured = false) {
    const remaining = getTimerRemaining();
    const running = isTimerRunning();
    const sessionsToday = state.sessions[getTodayKey()] || 0;
    const progress = Math.round(((state.timer.duration - remaining) / state.timer.duration) * 100);
    const status = running ? 'Stay with one thing. You have got this.' : remaining === 0 ? 'Session complete. Take a breath before the next thing.' : 'A small, focused sprint is enough.';
    return `<section class="card timer-card${featured ? ' timer-card-featured' : ''}" aria-labelledby="focus-timer-title">
      <div class="card-header"><div class="card-heading"><span class="card-heading-icon timer-heading-icon">${icon('clock', 18)}</span><div class="card-heading-copy"><h2 id="focus-timer-title">${featured ? 'Pomodoro timer' : 'Focus timer'}</h2><p>${featured ? 'Choose a sprint and stay with one thing.' : 'Give one thing your full attention.'}</p></div></div><span class="timer-live-label${running ? ' is-running' : ''}">${running ? 'IN SESSION' : 'POMODORO'}</span></div>
      <div class="timer-display-row"><div class="timer-readout"><strong id="focus-timer-time">${formatTimer(remaining)}</strong><span id="focus-timer-status">${status}</span></div><div class="timer-session-count"><strong>${sessionsToday}</strong><span>sessions today</span></div></div>
      <div class="timer-progress-track" role="progressbar" aria-label="Focus session progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span id="focus-timer-progress-fill" style="width:${progress}%"></span></div>
      <div class="timer-presets" role="group" aria-label="Focus session length">${TIMER_PRESETS.map((minutes) => `<button type="button" class="timer-preset${state.timer.duration === minutes * 60 ? ' is-selected' : ''}" data-action="timer-preset" data-minutes="${minutes}" aria-pressed="${state.timer.duration === minutes * 60}"${running ? ' disabled' : ''}>${minutes} min</button>`).join('')}</div>
      <div class="timer-controls"><button id="focus-timer-toggle" class="button button-primary button-small" type="button" data-action="timer-toggle">${icon(running ? 'pause' : 'play', 14)} ${running ? 'Pause session' : remaining === 0 ? 'Start again' : 'Start focus'}</button><button class="button button-secondary button-small" type="button" data-action="timer-reset">Reset</button></div>
      ${featured ? '' : `<div class="timer-open-link"><span>Your focus rhythm lives in Pomodoro.</span><button class="button-link" type="button" data-view="pomodoro">Open Pomodoro ${icon('arrow', 12)}</button></div>`}
    </section>`;
  }

  function renderPomodoroChart(series, rangeDays) {
    const total = series.reduce((sum, day) => sum + day.sessions, 0);
    const maxSessions = Math.max(0, ...series.map((day) => day.sessions));
    const axisMaximum = Math.max(4, Math.ceil(maxSessions / 2) * 2);
    const width = 700;
    const height = 230;
    const top = 20;
    const bottom = 190;
    const points = series.map((day, index) => ({
      day,
      x: ((index + 0.5) / series.length) * width,
      y: top + ((axisMaximum - day.sessions) / axisMaximum) * (bottom - top),
    }));
    const linePath = smoothActivityPath(points);
    const areaPath = points.length > 1
      ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${bottom} L ${points[0].x.toFixed(2)} ${bottom} Z`
      : '';
    const levels = [axisMaximum, axisMaximum / 2, 0];
    const gridLines = levels.map((level, index) => {
      const y = top + ((axisMaximum - level) / axisMaximum) * (bottom - top);
      return `<line class="pomodoro-grid-line${index === levels.length - 1 ? ' is-base' : ''}" x1="0" y1="${y}" x2="${width}" y2="${y}"/>`;
    }).join('');
    const yLabels = levels.map((level) => {
      const y = top + ((axisMaximum - level) / axisMaximum) * (bottom - top);
      return `<span style="top:${((y / height) * 100).toFixed(2)}%">${level}</span>`;
    }).join('');
    const dots = points.map(({ day, x, y }) => {
      const today = day.key === getTodayKey();
      const label = `${formatDate(day.date, { weekday: 'long', month: 'short', day: 'numeric' })}: ${day.sessions} completed focus session${day.sessions === 1 ? '' : 's'}`;
      return `<circle class="pomodoro-graph-point${today ? ' is-today' : ''}${day.sessions ? ' has-sessions' : ''}" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${today ? 5.5 : 4}"><title>${escapeHtml(label)}</title></circle>`;
    }).join('');
    const labelIndexes = [...new Set([0, Math.round((series.length - 1) * .25), Math.round((series.length - 1) * .5), Math.round((series.length - 1) * .75), series.length - 1])];
    const xLabels = labelIndexes.map((index) => `<span>${index === series.length - 1 ? 'Today' : escapeHtml(formatDate(series[index].date, { month: 'short', day: 'numeric' }))}</span>`).join('');
    const rangeButtons = [7, 30, 90].map((days) => `<button type="button" class="range-switch-button${rangeDays === days ? ' is-active' : ''}" data-action="pomodoro-range" data-days="${days}" aria-pressed="${rangeDays === days}" aria-label="Show Pomodoro sessions for ${days} days">${days}D</button>`).join('');
    const ariaLabel = `Completed Pomodoro sessions over the last ${rangeDays} days. ${total} total sessions.`;
    return `<section class="card pomodoro-chart-card" aria-labelledby="pomodoro-chart-title"><div class="card-header"><div class="card-heading"><span class="card-heading-icon pomodoro-chart-icon">${icon('chart', 18)}</span><div class="card-heading-copy"><h2 id="pomodoro-chart-title">Your focus rhythm</h2><p>Completed sessions, day by day</p></div></div><div class="insights-range-switch pomodoro-range-switch" role="group" aria-label="Choose Pomodoro chart range">${rangeButtons}</div></div><div class="pomodoro-chart-summary"><strong>${total}</strong><span>completed sessions</span><span class="pomodoro-chart-legend">Sessions per day</span></div><div class="pomodoro-chart" role="img" aria-label="${ariaLabel}"><div class="pomodoro-chart-y-axis" aria-hidden="true">${yLabels}</div><div class="pomodoro-chart-plot" aria-hidden="true"><svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" focusable="false"><defs><linearGradient id="pomodoro-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#c5a7ed" stop-opacity=".28"/><stop offset="100%" stop-color="#c5a7ed" stop-opacity=".015"/></linearGradient><linearGradient id="pomodoro-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#8ba9e9"/><stop offset="55%" stop-color="#c5a7ed"/><stop offset="100%" stop-color="#f0c1e8"/></linearGradient></defs>${gridLines}${areaPath ? `<path class="pomodoro-graph-area" d="${areaPath}"/>` : ''}<path class="pomodoro-graph-line" d="${linePath}"/>${dots}</svg></div><div class="pomodoro-chart-x-axis" aria-hidden="true">${xLabels}</div></div><div class="pomodoro-chart-foot">${total ? `<span>${series.filter((day) => day.sessions > 0).length} active focus days in this range</span>` : '<span>Your graph starts when you finish your first session.</span>'}<span>Only completed timers count</span></div></section>`;
  }

  function renderPomodoroView() {
    const series = getLastDays(pomodoroRangeDays).map((day) => ({ ...day, sessions: state.sessions[day.key] || 0 }));
    const total = series.reduce((sum, day) => sum + day.sessions, 0);
    const activeDays = series.filter((day) => day.sessions > 0).length;
    const todaySessions = state.sessions[getTodayKey()] || 0;
    const bestDay = series.reduce((best, day) => day.sessions > (best?.sessions || 0) ? day : best, null);
    const bestSessions = bestDay?.sessions || 0;
    const bestDayLabel = bestSessions ? formatDate(bestDay.date, { month: 'short', day: 'numeric' }) : 'No best day yet';
    return `<div class="pomodoro-view"><header class="page-intro"><div class="page-intro-copy"><p class="eyebrow">ONE SPRINT AT A TIME</p><h1>Make room for<br/><span>deep focus.</span></h1><p>Choose a session length, focus on one thing, and let every completed Pomodoro build your rhythm.</p></div></header><section class="stats-grid pomodoro-stats" aria-label="Pomodoro summary">${renderStatCard('Completed sessions', String(total), 'total', `In the last ${pomodoroRangeDays} days`, 'check-circle', 'violet')}${renderStatCard('Today', String(todaySessions), 'sessions', 'Completed focus blocks', 'clock', 'blue')}${renderStatCard('Active days', String(activeDays), `of ${pomodoroRangeDays}`, 'At least one session', 'calendar', 'lime')}${renderStatCard('Best day', String(bestSessions), 'sessions', bestDayLabel, 'flame', 'amber')}</section><div class="pomodoro-layout"><div class="pomodoro-main-column">${renderFocusTimerCard(true)}${renderPomodoroChart(series, pomodoroRangeDays)}</div><aside class="pomodoro-aside"><section class="card pomodoro-guide-card"><div class="card-heading"><span class="card-heading-icon pomodoro-chart-icon">${icon('sparkles', 18)}</span><div class="card-heading-copy"><h2>A gentle focus flow</h2><p>Make the next sprint feel doable.</p></div></div><ol class="pomodoro-steps"><li><span>01</span><div><strong>Choose a length</strong><small>Pick 15, 25, or 45 minutes.</small></div></li><li><span>02</span><div><strong>Focus on one thing</strong><small>Keep the next step small and clear.</small></div></li><li><span>03</span><div><strong>Finish, then reset</strong><small>Completed sessions add to your graph.</small></div></li></ol><div class="pomodoro-note">${icon('lightbulb', 14)}<span>Pausing is okay. Only a finished timer counts as a completed session.</span></div></section><section class="card pomodoro-quiet-card"><span class="pomodoro-quiet-icon">${icon('moon', 18)}</span><h2>Progress, not pressure.</h2><p>Your chart shows focus sessions, not a score. A short, intentional sprint is a win.</p></section></aside></div><p class="page-footnote">Your focus history stays private in this browser, alongside the rest of your Daymark data.</p></div>`;
  }

  function renderMoodCard() {
    const key = getTodayKey();
    const reflection = state.reflections[key] || { mood: '', note: '' };
    const mood = selectedMoodDay === key ? selectedMood : reflection.mood;
    const note = reflectionDraftDay === key ? reflectionDraft : reflection.note;
    const moodOptions = MOODS.map((item) => `<button class="mood-choice${mood === item.id ? ' is-selected' : ''}" type="button" data-action="select-mood" data-id="${item.id}" data-day="${key}" aria-pressed="${mood === item.id}"><span>${icon(item.icon, 17)}</span><small>${item.label}</small></button>`).join('');
    const status = mood ? `${getMoodLabel(mood)} noted. Add a thought if you like.` : 'Optional · a quick check-in can help you notice patterns.';
    return `<section class="card mood-card" aria-labelledby="mood-card-title"><div class="mood-layout"><div class="mood-intro"><p class="card-overline">A MOMENT FOR YOU</p><h2 id="mood-card-title">How are you,<br/><span>really?</span></h2><p>No score, no streak. Just a small space to notice how today feels.</p><span class="mood-privacy-note">${icon('lock', 12)} Private to your account</span></div><div class="mood-content"><div class="mood-choices" role="group" aria-label="Choose your mood">${moodOptions}</div><form data-form="reflection" data-day="${key}" class="reflection-form"><label class="form-label" for="reflection-note">A note to yourself <span>optional</span></label><textarea id="reflection-note" class="form-control reflection-input" name="note" maxlength="280" placeholder="What is on your mind today?">${escapeHtml(note || '')}</textarea><div class="reflection-footer"><span id="mood-selection-status" aria-live="polite">${escapeHtml(status)}</span><button class="button button-secondary button-small" type="submit">Save check-in ${icon('check', 13)}</button></div></form></div></div></section>`;
  }

  function renderGoalRow(goal, dayKey, options = {}) {
    const slotPill = options.showSlot !== false
      ? `<span class="goal-time-pill">${escapeHtml(formatGoalRange(goal))}</span>`
      : '';
    return `<li class="goal-row${goal.done ? ' is-done' : ''}${options.planner ? ' planner-goal-row' : ''}"><button class="check-toggle${goal.done ? ' is-checked' : ''}" type="button" role="checkbox" aria-checked="${goal.done}" aria-label="${goal.done ? 'Mark incomplete' : 'Complete'} ${escapeHtml(goal.text)}" data-action="toggle-goal" data-day="${dayKey}" data-id="${escapeHtml(goal.id)}">${icon('check', 13)}</button><span class="goal-text">${escapeHtml(goal.text)}</span>${slotPill}<button class="icon-button goal-delete" type="button" aria-label="Remove goal ${escapeHtml(goal.text)}" data-action="delete-goal" data-day="${dayKey}" data-id="${escapeHtml(goal.id)}">${icon('close', 14)}</button></li>`;
  }

  function renderTodayPlanCard(todayKey = getTodayKey()) {
    const today = dateFromKey(todayKey);
    const key = todayKey;
    const goals = [...(state.goals[key] || [])].sort((left, right) => normalizeGoalHour(left.slot).localeCompare(normalizeGoalHour(right.slot)));
    if (!goals.length) return '';
    const completed = goals.filter((goal) => goal.done).length;
    const percent = Math.round((completed / goals.length) * 100);
    const rows = goals.map((goal) => renderGoalRow(goal, key)).join('');
    return `<section class="card today-plan-card" aria-labelledby="today-plan-title"><div class="today-plan-header"><div class="today-plan-heading"><span class="card-heading-icon">${icon('calendar', 18)}</span><div><p class="card-overline">PLANNED FOR TODAY</p><h2 id="today-plan-title">Today's plan</h2><p>${escapeHtml(formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' }))} · Your next-day plan shows up here on its date.</p></div></div><button class="button-link" type="button" data-view="planner">Plan tomorrow ${icon('arrow', 13)}</button></div><div class="today-plan-progress"><div class="progress-meta"><span>Planned tasks</span><span><strong>${completed} of ${goals.length} complete</strong></span></div><div class="progress-track" role="progressbar" aria-label="Today's planned task completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div></div><ul class="goal-list">${rows}</ul></section>`;
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
        <div class="tomorrow-content">${goalRows}<form class="inline-form goal-form" data-form="goal" data-day="${key}"><input class="inline-input" type="text" name="goal" maxlength="150" required autocomplete="off" placeholder="Add a small, doable goal…" aria-label="Add a goal for tomorrow"/><select class="inline-time-select" name="slot" aria-label="Choose a time for this goal">${timeOptions}</select><button class="inline-submit" type="submit" aria-label="Add goal for tomorrow">${icon('plus', 16)}</button></form></div>
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
      ? `<ul class="planner-habit-list">${habits.map((habit) => `<li><span class="habit-symbol tone-${getHabitIcon(habit)}">${icon(getHabitIcon(habit), 16)}</span><span><strong>${escapeHtml(habit.name)}</strong><small>${escapeHtml(formatHabitTime(habit.time, habit.endTime))} · ${escapeHtml(habit.category)}</small></span></li>`).join('')}</ul>`
      : state.habits.length
        ? `<div class="planner-rest-note">${icon('moon', 16)}<span>No habits scheduled. Tomorrow is a planned rest day.</span></div>`
        : `<div class="planner-rest-note">${icon('checklist', 16)}<span>No habits chosen yet. <button class="button-link" type="button" data-view="habits">Choose what fits ${icon('arrow', 12)}</button></span></div>`;
    return `<div class="planner-view">
      <header class="page-intro"><div class="page-intro-copy"><p class="eyebrow">TOMORROW · ${escapeHtml(formatDate(tomorrow, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase())}</p><h1>Give tomorrow<br/><span>a head start.</span></h1><p>Plan the day hour by hour. Add structure where it helps and leave breathing room where it does not.</p></div><div class="page-intro-action"><button class="button button-secondary" type="button" data-view="today">${icon('arrow-left', 15)} Back to today</button></div></header>
      <section class="stats-grid" aria-label="Tomorrow plan summary">${renderStatCard('Tasks planned', String(goals.length), 'tasks', goals.length ? `${completed} already checked` : 'Add a few doable steps', 'list', 'lime')}${renderStatCard('Habits on the calendar', String(habits.length), 'habits', habits.length ? 'Already part of your rhythm' : state.habits.length ? 'Planned rest day' : 'Nothing chosen yet', 'check-circle', 'blue')}${renderStatCard('Hours with a plan', String(plannedHours), 'of 24', plannedHours ? 'Your day has a clear shape' : 'Start with one time block', 'clock', 'amber')}${renderStatCard('Main priority', priority ? 'Set' : 'Open', '', priority ? 'One clear intention' : 'Choose one important thing', 'target', 'violet')}</section>
      <div class="planner-layout"><div class="planner-sidebar">
        <section class="card planner-priority-card"><div class="planner-card-heading"><span class="card-heading-icon">${icon('target', 18)}</span><div><p class="card-overline">ONE IMPORTANT THING</p><h2>Tomorrow's priority</h2></div></div><p class="planner-card-copy">If tomorrow goes well because of one thing, what should it be?</p><form class="planner-priority-form" data-form="tomorrow-focus" data-day="${key}"><input class="form-control" name="focus" maxlength="150" required autocomplete="off" placeholder="Name the one thing…" aria-label="Tomorrow's main priority" value="${escapeHtml(priority?.text || '')}"/><button class="button button-primary button-small" type="submit">${priority ? 'Update priority' : 'Save priority'} ${icon('check', 13)}</button></form></section>
        <section class="card planner-habits-card"><div class="planner-card-heading"><span class="card-heading-icon">${icon('checklist', 18)}</span><div><p class="card-overline">ALREADY IN YOUR ROUTINE</p><h2>Habits due tomorrow</h2></div></div><p class="planner-card-copy">Your scheduled habits are included automatically.</p>${habitsContent}</section>
      </div><section class="card planner-schedule-card"><div class="planner-schedule-header"><div><p class="card-overline">AN INTENTIONAL DAY</p><h2>Tomorrow, hour by hour</h2><p>Every hour is visible. Tap an open slot to add a task at that exact time.</p></div><span class="planner-date-chip">${icon('calendar', 13)} ${escapeHtml(formatDate(tomorrow, { month: 'short', day: 'numeric' }))}</span></div><div class="planner-dayparts">${hourlyTimeline}</div><form class="planner-add-form" data-form="goal" data-day="${key}"><label class="sr-only" for="planner-goal-input">Add a task for tomorrow</label><input class="form-control" id="planner-goal-input" name="goal" type="text" maxlength="150" required autocomplete="off" placeholder="Add a task…"/><label class="sr-only" for="planner-slot-input">Choose a start hour</label><select class="form-control" id="planner-slot-input" name="slot">${timeOptions}</select><label class="sr-only" for="planner-duration-input">Choose duration</label><select class="form-control planner-duration-select" id="planner-duration-input" name="duration">${durationOptions}</select><button class="button button-primary" type="submit">${icon('plus', 15)} Add task</button></form></section></div>
      <p class="page-footnote">Plans are suggestions, not rules. Tomorrow can change—and so can this plan.</p>
    </div>`;
  }

  function renderTodayView() {
    const todayKey = getTodayKey();
    const done = completedHabitsOn(todayKey);
    const total = scheduledHabitsOn(todayKey).length;
    const hasHabits = state.habits.length > 0;
    const percent = completionPercent(todayKey) ?? 0;
    const challenge = getCurrentChallenge();
    const nameGreeting = state.name ? `Welcome back, ${escapeHtml(state.name)}.` : 'A fresh start is waiting—no perfect routine required.';
    const ring = ringMarkup(percent, 'small', 'hero-ring-wrap', `<div class="hero-ring-copy"><strong>${total ? `${percent}%` : '—'}</strong><span>${total ? 'today' : hasHabits ? 'rest day' : 'your choice'}</span></div>`);
    return `<div class="today-view">
      <section class="hero" aria-labelledby="home-title">
        <div class="hero-copy"><div class="eyebrow"><span class="live-dot"></span><span>${escapeHtml(longDate(new Date()).toUpperCase())}</span><span class="eyebrow-divider">·</span><span>DAY ${getChallengeDay()} OF ${challenge.duration}</span></div><h1 id="home-title">Make today<br/><span>count.</span></h1><p>${nameGreeting} Small promises, kept often, become a life that feels more like yours.</p><div class="hero-actions">${hasHabits ? `<button class="button button-primary" type="button" data-action="add-habit">${icon('plus', 16)} Add a habit</button>` : `<button class="button button-primary" type="button" data-view="habits">${icon('checklist', 16)} Choose your habits</button>`}<button class="button-link" type="button" data-view="insights">See your progress ${icon('arrow', 14)}</button></div></div>
        <div class="hero-visual" aria-label="${total ? `${percent} percent of today's scheduled habits complete` : hasHabits ? 'Today is a rest day' : 'No habits chosen yet; nothing is tracked automatically'}">${ring}<div class="hero-progress-copy"><span>Today's rhythm</span><strong>${total ? `${done} of ${total} due` : hasHabits ? 'Room to reset' : 'Choose what fits'}</strong><small>${done === total && total ? 'You showed up for yourself.' : total ? 'Every little bit moves you forward.' : hasHabits ? 'A good routine makes room to rest.' : 'Nothing is added until you say yes.'}</small></div></div>
      </section>
      ${renderTodayStats()}
      <div class="dashboard-grid">
        <div class="dashboard-column">${renderHabitsCard()}${renderWeeklyCard()}</div>
        <div class="dashboard-column">${renderChallengeCard()}${renderFocusCard()}${renderFocusTimerCard()}</div>
        ${renderTodayPlanCard(todayKey)}
        ${renderTomorrowCard()}
        ${renderMoodCard()}
      </div>
      <p class="page-footnote">A good routine is one you can return to. Start again whenever you need to.</p>
    </div>`;
  }

  function getFilteredHabits() {
    const query = habitSearchQuery.trim().toLocaleLowerCase();
    return state.habits.filter((habit) => {
      const matchesCategory = habitCategoryFilter === 'All' || habit.category === habitCategoryFilter;
      const matchesQuery = !query || [habit.name, habit.detail, habit.category].some((value) => String(value || '').toLocaleLowerCase().includes(query));
      return matchesCategory && matchesQuery;
    });
  }

  function renderHabitLibraryContent(filteredHabits = getFilteredHabits()) {
    if (!state.habits.length) return `<div class="habit-management-empty"><div><span class="habit-empty-icon">${icon('checklist', 20)}</span><strong class="habit-name">Nothing is pre-selected.</strong><p class="habit-detail">Choose an idea below or create your own. Daymark will only track habits you add.</p><button class="button button-primary button-small" type="button" data-action="add-habit">${icon('plus', 14)} Create a custom habit</button></div></div>`;
    if (!filteredHabits.length) return `<div class="habit-filter-empty"><span class="habit-empty-icon">${icon('search', 18)}</span><strong>No habits found</strong><p>Try a different name or category. Your habits are still here.</p><button class="button-link" type="button" data-action="clear-habit-filters">Clear search and filters ${icon('close', 13)}</button></div>`;
    return `<ul class="habit-list">${filteredHabits.map((habit) => renderHabitRow(habit, { managed: true })).join('')}</ul>`;
  }

  function renderHabitSuggestionCard(suggestion) {
    const added = state.habits.some((habit) => habit.id === suggestion.id);
    const skipped = state.skippedHabitSuggestions.includes(suggestion.id);
    const symbol = getHabitIcon(suggestion);
    const name = escapeHtml(suggestion.name);
    const actions = added
      ? `<span class="suggestion-choice-status is-added">${icon('check-circle', 14)} Already in your habits</span>`
      : skipped
        ? `<span class="suggestion-choice-status is-skipped">Not for me</span><button class="button button-quiet button-small" type="button" data-action="restore-habit-suggestion" data-id="${escapeHtml(suggestion.id)}">Undo</button>`
        : `<button class="button button-secondary button-small" type="button" data-action="add-suggested-habit" data-id="${escapeHtml(suggestion.id)}" aria-label="Add ${name} to my habits">${icon('plus', 13)} Add this</button><button class="suggestion-skip-button" type="button" data-action="skip-habit-suggestion" data-id="${escapeHtml(suggestion.id)}" aria-label="Not for me: ${name}">Not for me</button>`;
    return `<article class="habit-suggestion-card${added ? ' is-added' : skipped ? ' is-skipped' : ''}"><div class="suggestion-card-top"><span class="habit-symbol tone-${symbol}">${icon(symbol, 17)}</span><span class="category-pill">${escapeHtml(suggestion.category)}</span></div><div class="suggestion-card-copy"><h3>${name}</h3><p>${escapeHtml(suggestion.detail)}</p></div><div class="suggestion-card-meta">Suggested time: ${escapeHtml(suggestion.time)} <span>·</span> Every day</div><div class="suggestion-card-actions">${actions}</div></article>`;
  }

  function renderHabitSuggestions() {
    return `<section class="card habit-suggestions" aria-labelledby="habit-suggestions-title"><div class="habit-suggestions-heading"><span class="card-heading-icon">${icon('sparkles', 18)}</span><div class="card-heading-copy"><p class="card-overline">OPTIONAL STARTING IDEAS</p><h2 id="habit-suggestions-title">Choose what fits you</h2><p>These are only ideas. Nothing is added or tracked unless you choose it.</p></div></div><div class="habit-suggestion-grid">${makeHabitSuggestions().map(renderHabitSuggestionCard).join('')}</div></section>`;
  }

  function updateHabitLibrary() {
    const results = document.getElementById('habit-library-results');
    if (!results) return;
    const filteredHabits = getFilteredHabits();
    results.innerHTML = renderHabitLibraryContent(filteredHabits);
    const count = document.getElementById('habit-library-count');
    if (count) {
      count.textContent = state.habits.length
        ? `${filteredHabits.length} of ${state.habits.length} habit${state.habits.length === 1 ? '' : 's'}`
        : 'No habits chosen yet';
    }
  }

  function renderHabitsView() {
    const done = completedHabitsOn(getTodayKey());
    const total = state.habits.length;
    const filteredHabits = getFilteredHabits();
    const dueToday = scheduledHabitsOn(getTodayKey()).length;
    const todayPercent = dueToday ? Math.round((done / dueToday) * 100) : 0;
    const categoryOptions = ['All', ...CATEGORIES].map((category) => `<option value="${escapeHtml(category)}"${category === habitCategoryFilter ? ' selected' : ''}>${category === 'All' ? 'All categories' : escapeHtml(category)}</option>`).join('');
    const resultCount = total ? `${filteredHabits.length} of ${total} habit${total === 1 ? '' : 's'}` : 'No habits chosen yet';
    const habitToolbar = total ? `<div class="habit-library-toolbar"><label class="habit-search-field"><span>${icon('search', 15)}</span><input class="form-control" id="habit-search" type="search" autocomplete="off" placeholder="Search habits…" aria-label="Search your habits" value="${escapeHtml(habitSearchQuery)}"/></label><label class="sr-only" for="habit-category-filter">Filter by category</label><select class="form-control habit-category-filter" id="habit-category-filter">${categoryOptions}</select></div>` : '';
    const content = renderHabitLibraryContent(filteredHabits);
    const completionLabel = dueToday ? `${todayPercent}%` : total ? 'Rest day' : 'Choose habits';
    return `<div class="habits-view">
      <header class="page-intro"><div class="page-intro-copy"><p class="eyebrow">YOUR DAILY RHYTHM</p><h1>Habits that fit<br/><span>your real life.</span></h1><p>Make your routine personal. Small, repeatable actions are the ones that tend to stick.</p></div><div class="page-intro-action"><button class="button button-primary" type="button" data-action="add-habit">${icon('plus', 16)} New habit</button></div></header>
      <section class="stats-grid" aria-label="Habit summary">${renderStatCard('Your habits', String(total), 'active', total ? 'A routine built around you' : 'Nothing added automatically', 'list', 'lime')}${renderStatCard('Due today', String(dueToday), 'habits', `${done} checked · ${dueToday ? 'Daily rhythm' : total ? 'Planned rest day' : 'Choose what fits'}`, 'check-circle', 'blue')}${renderStatCard('Current streak', String(getCurrentStreak()), 'days', getCurrentStreak() ? 'Keep your gentle momentum' : 'A new streak starts today', 'flame', 'amber')}${renderStatCard('Challenge day', String(getChallengeDay()), `of ${getCurrentChallenge().duration}`, getCurrentChallenge().name, 'flag', 'violet')}</section>
      <div class="management-layout">
        <section class="card management-card" aria-labelledby="habit-library-title"><div class="card-header"><div class="card-heading"><span class="card-heading-icon">${icon('checklist', 18)}</span><div class="card-heading-copy"><h2 id="habit-library-title">Your habit list</h2><p>${total ? 'Set a weekly rhythm. Rest days are built in.' : 'Only habits you choose appear here.'}</p></div></div><span class="category-pill">${total} total</span></div>${habitToolbar}<div class="habit-library-count" id="habit-library-count" aria-live="polite">${resultCount}</div><div class="habit-progress-block"><div class="progress-meta"><span>Today's completion</span><span><strong>${completionLabel}</strong></span></div><div class="progress-track"><span style="width:${todayPercent}%"></span></div></div><div id="habit-library-results">${content}</div><div class="card-note">${icon('lock', 13)}<span>Your check-ins are saved privately to your account and cached on this device.</span></div></section>
        <aside class="card tips-card"><span class="card-heading-icon">${icon('lightbulb', 18)}</span><h2>Make it easy to begin.</h2><p>You do not need a perfect plan. Make the next step small enough to repeat.</p><ol class="tip-list"><li class="tip-item"><span class="tip-number">01</span><span><strong>Start smaller than you think.</strong><small>Two minutes is enough to build the rhythm.</small></span></li><li class="tip-item"><span class="tip-number">02</span><span><strong>Give it a place in your day.</strong><small>Pair a new habit with something you already do.</small></span></li><li class="tip-item"><span class="tip-number">03</span><span><strong>Begin again, without guilt.</strong><small>A missed day is a pause, not a reset.</small></span></li></ol></aside>
      </div>
      ${renderHabitSuggestions()}
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

  function renderInsightsChart(series = getLastDays(insightsRangeDays)) {
    const hasTrackedDays = series.some((item) => item.scheduled > 0);
    const description = series.length > 90 || !hasTrackedDays ? '' : series.map((item) => `${formatDate(item.date, { weekday: 'short', month: 'short', day: 'numeric' })}: ${item.scheduled ? `${item.percent}%` : 'rest day'}`).join('; ');
    const plot = hasTrackedDays
      ? renderActivityPlot(series, 'insights-activity')
      : `<div class="activity-chart-empty">${icon('checklist', 18)}<span>Choose habits to start your progress line.</span></div>`;
    return { series, plot, description, hasTrackedDays };
  }

  function renderHeatmap(series, isYear = false) {
    const rangeName = isYear ? 'the past year' : 'the last 30 days';
    const leadingDays = isYear ? series[0].date.getDay() : 0;
    const spacerMarkup = '<span class="heat-cell heat-cell-empty" aria-hidden="true"></span>'.repeat(leadingDays);
    return `<div class="heatmap${isYear ? ' heatmap-year' : ''}" role="img" aria-label="A habit completion heatmap covering ${rangeName}, with brighter squares for more completion">${spacerMarkup}${series.map((item) => {
      const percent = item.percent ?? 0;
      const level = item.scheduled === 0 || percent === 0 ? 0 : percent <= 25 ? 1 : percent <= 50 ? 2 : percent <= 75 ? 3 : 4;
      const label = item.scheduled === 0 ? 'rest day' : `${percent}% complete`;
      return `<span class="heat-cell" data-level="${level}" title="${escapeHtml(formatDate(item.date, { weekday: 'short', month: 'short', day: 'numeric' }))}: ${label}"></span>`;
    }).join('')}</div>`;
  }

  function renderConsistencyList(series) {
    if (!state.habits.length) return `<div class="insight-empty">${icon('sparkles', 14)}<span>Choose a habit you want to track and your consistency will show here.</span></div>`;
    const habits = state.habits.map((habit) => {
      const dueDays = series.filter((item) => (!isDateKey(habit.createdAt) || item.key >= habit.createdAt) && habit.days.includes(item.date.getDay()));
      const count = dueDays.filter((item) => isCheckedOn(item.key, habit.id)).length;
      return { habit, count, dueCount: dueDays.length, percent: dueDays.length ? Math.round((count / dueDays.length) * 100) : 0 };
    }).sort((a, b) => b.count - a.count);
    const activeDays = series.filter((item) => item.checkin).length;
    return `<div class="consistency-list">${habits.slice(0, 6).map(({ habit, count, dueCount, percent }) => {
      const symbol = getHabitIcon(habit);
      return `<div class="consistency-row"><span class="habit-symbol tone-${symbol}">${icon(symbol, 14)}</span><div class="consistency-copy"><strong>${escapeHtml(habit.name)}</strong><div class="progress-track"><span style="width:${percent}%"></span></div></div><span class="consistency-value">${count} / ${dueCount}</span></div>`;
    }).join('')}</div>${activeDays ? '' : `<div class="insight-empty">${icon('sparkles', 14)}<span>Your first check-in will start your progress story.</span></div>`}`;
  }

  function renderMoodInsight(series, rangeName = 'month') {
    const isYear = rangeName === 'year';
    const counts = MOODS.map((mood) => ({
      ...mood,
      count: series.filter((day) => state.reflections[day.key]?.mood === mood.id).length,
    }));
    const total = counts.reduce((sum, mood) => sum + mood.count, 0);
    const bars = counts.map((mood) => `<div class="mood-insight-row"><span class="mood-insight-icon">${icon(mood.icon, 13)}</span><span class="mood-insight-label">${mood.label}</span><div class="progress-track"><span style="width:${total ? Math.round((mood.count / total) * 100) : 0}%"></span></div><strong>${mood.count}</strong></div>`).join('');
    return `<section class="card mood-insights-card"><div class="card-heading"><span class="card-heading-icon">${icon('mind', 18)}</span><div class="card-heading-copy"><h2>${isYear ? 'How the year felt' : 'How the month felt'}</h2><p>${total} mood check-in${total === 1 ? '' : 's'} · ${isYear ? 'past year' : 'last 30 days'}</p></div></div>${total ? `<div class="mood-insight-list">${bars}</div><p class="mood-insight-foot">Patterns are information, not a grade.</p>` : `<div class="insight-empty">${icon('sparkles', 14)}<span>Try a quick mood check-in on the home page. This space is just for noticing, never judging.</span></div>`}</section>`;
  }

  function renderInsightsView() {
    const rangeDays = insightsRangeDays === 365 ? 365 : 30;
    const isYear = rangeDays === 365;
    const rangeLabel = isYear ? '1 year' : '30 days';
    const rangeDescription = isYear ? 'the past year' : 'the last 30 days';
    const series = getLastDays(rangeDays);
    const average = getAverage(series.slice(-7));
    const hasRecentTrackedDays = series.slice(-7).some((item) => item.scheduled > 0);
    const rangeAverage = getAverage(series);
    const checkins = series.filter((item) => item.checkin).length;
    const focusSessions = getSessionsForDays(rangeDays);
    const chart = renderInsightsChart(series);
    const recentAverageLabel = hasRecentTrackedDays ? `${average}%` : '—';
    const rangeAverageLabel = chart.hasTrackedDays ? `${rangeAverage}%` : '—';
    const mostConsistent = state.habits
      .map((habit) => ({
        habit,
        count: series.filter((item) => (!isDateKey(habit.createdAt) || item.key >= habit.createdAt)
          && (!Array.isArray(habit.days) || habit.days.includes(item.date.getDay()))
          && isCheckedOn(item.key, habit.id)).length,
      }))
      .sort((a, b) => b.count - a.count)[0];
    const insightHeading = checkins && mostConsistent?.count ? 'Look at you, showing up.' : 'It all starts with one tick.';
    const insightCopy = checkins && mostConsistent?.count
      ? `You checked in on ${checkins} of ${rangeDays} days. “${escapeHtml(mostConsistent.habit.name)}” is your most consistent habit so far. Keep making it yours.`
      : 'There is no catch-up required and no perfect streak to chase. Check off one small thing today and your progress story begins.';
    const rangeButtons = `<div class="insights-range-switch" role="group" aria-label="Choose the progress chart range"><button class="range-switch-button${!isYear ? ' is-active' : ''}" type="button" data-action="insights-range" data-days="30" aria-label="Show the last 30 days" aria-pressed="${!isYear}">30D</button><button class="range-switch-button${isYear ? ' is-active' : ''}" type="button" data-action="insights-range" data-days="365" aria-label="Show the last year" aria-pressed="${isYear}">1Y</button></div>`;
    const labelIndices = isYear ? [0, 61, 122, 182, 243, 304, 364] : [0, 9, 19, 29];
    const xLabels = labelIndices.map((index, position) => {
      const date = series[index].date;
      const options = isYear ? (position === 0 ? { month: 'short', year: '2-digit' } : { month: 'short' }) : { month: 'short', day: 'numeric' };
      return `<span>${index === series.length - 1 ? 'Today' : escapeHtml(formatDate(date, options))}</span>`;
    }).join('');
    return `<div class="insights-view">
      <header class="page-intro"><div class="page-intro-copy"><p class="eyebrow">NOTICE THE SMALL WINS</p><h1>Your progress,<br/><span>at a glance.</span></h1><p>Look back with curiosity, not judgment. Every check-in is evidence that you made time for yourself.</p></div></header>
      <section class="stats-grid insight-stats" aria-label="Progress summary">${renderStatCard('7-day completion', recentAverageLabel, '', hasRecentTrackedDays ? 'Average of your daily habits' : 'Choose a habit to start your history', 'chart', 'lime')}${renderStatCard('Days checked in', String(checkins), `of ${rangeDays}`, 'At least one habit completed', 'check-circle', 'blue')}${renderStatCard('Best streak', String(getBestStreak()), 'days', 'Your longest run so far', 'flame', 'amber')}${renderStatCard('Focus sessions', String(focusSessions), 'sessions', 'Within this period', 'clock', 'violet')}</section>
      <div class="insights-layout"><div class="insights-main">
        <section class="card insights-chart-card" aria-labelledby="range-chart-title"><div class="card-header"><div class="card-heading"><span class="card-heading-icon">${icon('chart', 18)}</span><div class="card-heading-copy"><h2 id="range-chart-title">${isYear ? 'A year' : 'A month'} of little wins</h2><p>${chart.hasTrackedDays ? `Scheduled habit completion for ${rangeDescription}, through today.` : 'Nothing is tracked until you choose a habit.'}</p></div></div><div class="insights-range-tools">${rangeButtons}<span class="chart-period">${icon('calendar', 12)} ${rangeLabel}</span></div></div><div class="chart-summary"><strong>${rangeAverageLabel}</strong><span>${chart.hasTrackedDays ? 'average completion' : 'no habits selected'}</span><span class="chart-legend">Daily habits</span></div><div class="activity-chart month-activity-chart" role="img" aria-label="${chart.hasTrackedDays ? `Daily habit completion across ${rangeLabel}, through today. ${isYear ? `${rangeAverage}% average completion and ${checkins} check-in days.` : escapeHtml(chart.description)}` : 'No habits selected yet. Choose habits to start tracking your progress.'}"><div class="activity-chart-axis" aria-hidden="true"><span>100%</span><span>50%</span><span>0%</span></div>${chart.plot}<div class="month-x-labels${isYear ? ' is-year-range' : ''}" aria-hidden="true">${xLabels}</div></div></section>
        <div class="insights-bottom${isYear ? ' is-year-range' : ''}"><section class="card heatmap-card"><div class="card-heading-copy"><h2 class="card-title">Your consistency map</h2><p class="heatmap-intro">Planned days brighten as you check habits off; rest days stay quiet.</p></div>${renderHeatmap(series, isYear)}<div class="heatmap-legend"><span>Less</span><i class="heat-cell" data-level="0"></i><i class="heat-cell" data-level="1"></i><i class="heat-cell" data-level="2"></i><i class="heat-cell" data-level="3"></i><i class="heat-cell" data-level="4"></i><span>More</span></div></section><section class="card consistency-card"><div class="card-heading-copy"><h2 class="card-title">Habit consistency</h2><p class="heatmap-intro">Days completed within this period.</p></div>${renderConsistencyList(series)}</section></div>
      </div><aside class="insight-aside"><section class="card insight-note-card"><span class="insight-note-icon">${icon('sparkles', 19)}</span><h2>${insightHeading}</h2><p>${insightCopy}</p><div class="insight-callout">${icon('lightbulb', 14)}<span>Consistency is built in ordinary moments, not perfect ones.</span></div></section>${renderMoodInsight(series, isYear ? 'year' : 'month')}<section class="card insight-note-card"><span class="insight-note-icon">${icon('target', 19)}</span><h2>Keep it gentle.</h2><p>Try choosing just one habit to focus on this week. Once it feels natural, you can add another.</p><button class="button button-secondary button-small" type="button" data-view="habits" style="margin-top:15px">Review your habits ${icon('arrow', 13)}</button></section></aside></div>
      <p class="page-footnote">Your progress belongs to you. The numbers are here to help, never to judge.</p>
    </div>`;
  }

  function renderAccountSettingsCard() {
    const displayName = authUser?.displayName || state.name || 'Google account';
    const email = authUser?.email || '';
    const avatar = authUser?.photoURL
      ? `<img src="${escapeHtml(authUser.photoURL)}" referrerpolicy="no-referrer" alt=""/>`
      : escapeHtml(displayName.trim().charAt(0).toUpperCase() || 'D');
    const syncLabel = ({ connecting: 'Connecting', syncing: 'Syncing', pending: 'Saving changes', synced: 'Up to date', offline: 'Offline · saved on this device', error: 'Sync needs attention' })[cloudSyncStatus] || 'Syncing';
    return `<section class="card account-settings-card"><div class="account-settings-main"><span class="account-settings-avatar">${avatar}</span><div class="account-settings-copy"><span class="account-settings-label">SIGNED IN WITH GOOGLE</span><strong>${escapeHtml(displayName)}</strong><small>${escapeHtml(email)}</small></div></div><div class="account-settings-footer"><span class="account-sync-state" data-status="${escapeHtml(cloudSyncStatus)}"><i aria-hidden="true"></i>${escapeHtml(syncLabel)}</span><button class="button button-quiet button-small" type="button" data-action="sign-out">Sign out</button></div></section>`;
  }

  function renderSettingsView() {
    return `<div class="settings-view">
      <header class="page-intro"><div class="page-intro-copy"><p class="eyebrow">MAKE THIS SPACE YOURS</p><h1>A little more<br/><span>personal.</span></h1><p>Manage your profile, signed-in device, and synchronized progress.</p></div></header>
      <div class="settings-layout"><div class="settings-stack">
        ${renderAccountSettingsCard()}
        <section class="card settings-card"><h2>Your profile</h2><p>Choose the name you would like to see around Daymark. It is saved with your synced workspace.</p><form class="settings-form" data-form="profile"><div><label class="form-label" for="profile-name-input">Display name</label><input class="form-control" id="profile-name-input" name="name" type="text" maxlength="32" autocomplete="nickname" placeholder="What should we call you?" value="${escapeHtml(state.name)}"/><p class="form-help">Leave this empty if you prefer a quiet, nameless workspace.</p></div><button class="button button-primary button-small" type="submit">Save profile ${icon('check', 14)}</button></form></section>
        <section class="card settings-card"><h2>Your data</h2><p>Your habits, schedules, moods, focus sessions, and plans save instantly on this device, then sync to your private Firestore account when online. Export a copy any time.</p><div class="data-action-list"><div class="data-action-row"><div class="data-action-copy"><strong>Export your data</strong><small>Download a JSON backup of your habits and progress.</small></div><button class="button button-secondary button-small" type="button" data-action="export">${icon('download', 14)} Export</button></div><div class="data-action-row"><div class="data-action-copy"><strong>Clear activity</strong><small>Remove check-ins, mood notes, focus sessions, and tomorrow's goals. Keep your habits.</small></div><button class="button button-quiet button-small" type="button" data-action="clear-activity">Clear activity</button></div><div class="data-action-row"><div class="data-action-copy"><strong>Start fresh</strong><small>Clear saved progress and start with no active habits. Add only what you choose.</small></div><button class="button button-danger button-small" type="button" data-action="reset-all">Reset app</button></div></div></section>
      </div><aside class="card settings-side-card"><span class="privacy-icon">${icon('lock', 19)}</span><h2>Your space, kept yours.</h2><p>Sign-in is required. Your Daymark document is scoped to your Google account, protected by Firebase rules, and cached locally for quick access when you are offline.</p><span class="local-storage-badge">${icon('check-circle', 12)} Saved locally · cloud sync</span><div class="card-note" style="margin-top:20px">${icon('sparkles', 13)}<span>Your progress stays private to your signed-in account and syncs across your devices.</span></div></aside></div>
    </div>`;
  }

  function openHabitModal(habitId = '', suggestionId = '') {
    const existing = state.habits.find((habit) => habit.id === habitId);
    const suggestion = makeHabitSuggestions().find((habit) => habit.id === suggestionId);
    const title = existing ? 'Edit your habit' : suggestion ? 'Make this habit yours' : 'Add a new habit';
    const category = existing?.category || suggestion?.category || 'Wellness';
    const activeDays = Array.isArray(existing?.days) ? existing.days : suggestion?.days || [0, 1, 2, 3, 4, 5, 6];
    const selectedTime = existing?.time || '';
    const selectedStartTime = selectedTime === 'Anytime' ? '' : selectedTime;
    const selectedEndTime = selectedStartTime ? existing?.endTime || '' : '';
    const categoryOptions = CATEGORIES.map((option) => `<option value="${option}"${category === option ? ' selected' : ''}>${option}</option>`).join('');
    const startTimeOptions = `<option value="" disabled${selectedStartTime ? '' : ' selected'}>Choose start time</option>${PLAN_HOURS.map((hour) => `<option value="${hour}"${selectedStartTime === hour ? ' selected' : ''}>${formatClock(Number(hour.slice(0, 2)))}</option>`).join('')}`;
    const endTimeOptions = renderHabitEndTimeOptions(selectedStartTime, selectedEndTime);
    const dayOptions = WEEKDAYS.map((day) => `<label class="weekday-option" title="${WEEKDAY_NAMES[day.value]}"><input type="checkbox" name="days" value="${day.value}" aria-label="${WEEKDAY_NAMES[day.value]}"${activeDays.includes(day.value) ? ' checked' : ''}/><span>${day.label}</span></label>`).join('');
    const modalIntro = existing?.time === 'Anytime'
      ? 'Set a start and end time for this habit. Its previous schedule had no fixed time.'
      : suggestion
        ? 'Choose when this habit starts and ends. Its time cannot overlap another habit on the same days.'
        : 'Choose a start and end time. Habits on the same days cannot overlap.';
    document.getElementById('modal-root').innerHTML = `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="habit-modal-title"><header class="modal-header"><div><h2 id="habit-modal-title">${title}</h2><p>${modalIntro}</p></div><button class="icon-button" type="button" aria-label="Close dialog" data-action="close-modal">${icon('close', 17)}</button></header><form data-form="habit" data-id="${existing ? escapeHtml(existing.id) : ''}" data-suggestion-id="${suggestion ? escapeHtml(suggestion.id) : ''}"><div class="modal-body"><div class="modal-field"><label class="form-label" for="habit-name-input">Habit name</label><input class="form-control" id="habit-name-input" name="name" type="text" maxlength="56" required autocomplete="off" placeholder="e.g. Take a 10-minute walk" value="${escapeHtml(existing?.name || suggestion?.name || '')}"/></div><div class="modal-field"><label class="form-label" for="habit-detail-input">A little reminder <span style="color:var(--subtle);font-weight:400">(optional)</span></label><input class="form-control" id="habit-detail-input" name="detail" type="text" maxlength="100" autocomplete="off" placeholder="e.g. Around the block is enough" value="${escapeHtml(existing?.detail || suggestion?.detail || '')}"/></div><div class="modal-field"><label class="form-label" for="habit-category-input">Category</label><div class="modal-select-wrap"><select class="form-control" id="habit-category-input" name="category">${categoryOptions}</select></div></div><div class="modal-field"><span class="form-label">Time range</span><div class="habit-time-range-fields"><div class="modal-field"><label class="form-label" for="habit-start-time-input">Start time</label><div class="modal-select-wrap"><select class="form-control" id="habit-start-time-input" name="startTime" required>${startTimeOptions}</select></div></div><div class="modal-field"><label class="form-label" for="habit-end-time-input">End time</label><div class="modal-select-wrap"><select class="form-control" id="habit-end-time-input" name="endTime" required>${endTimeOptions}</select></div></div></div><p class="form-help">End time must be later than start. Ranges on the same days cannot overlap.</p></div><fieldset class="modal-field weekday-field"><legend class="form-label">Repeat on</legend><div class="weekday-picker">${dayOptions}</div><p class="form-help">Pick the days that fit. The habit will stay off your list on rest days.</p></fieldset></div><footer class="modal-footer"><button class="button button-secondary button-small" type="button" data-action="close-modal">Cancel</button><button class="button button-primary button-small" type="submit">${existing ? 'Save changes' : 'Add habit'} ${icon('check', 14)}</button></footer></form></section></div>`;
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

  function toggleHabit(habitId, dayKey = getTodayKey()) {
    const key = isDateKey(dayKey) ? dayKey : getTodayKey();
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

  function settleElapsedFocusTimer() {
    if (state.timer.endsAt && getTimerRemaining() <= 0) updateFocusTimer();
  }

  function toggleFocusTimer() {
    settleElapsedFocusTimer();
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
    settleElapsedFocusTimer();
    state.timer.endsAt = null;
    state.timer.remaining = state.timer.duration;
    saveState();
    renderApp();
  }

  function setFocusTimerPreset(minutes) {
    const duration = Number(minutes) * 60;
    if (!TIMER_PRESETS.includes(Number(minutes))) return;
    settleElapsedFocusTimer();
    if (isTimerRunning()) return;
    state.timer.duration = duration;
    state.timer.remaining = duration;
    state.timer.endsAt = null;
    saveState();
    renderApp();
  }

  function selectMood(moodId, dayKey = getTodayKey()) {
    const mood = MOODS.find((item) => item.id === moodId);
    if (!mood) return;
    const key = isDateKey(dayKey) ? dayKey : getTodayKey();
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
      case 'google-sign-in':
        beginGoogleSignIn();
        break;
      case 'sign-out':
        beginSignOut();
        break;
      case 'insights-range': {
        const requestedDays = Number(actionElement.dataset.days);
        if (requestedDays !== 30 && requestedDays !== 365) return;
        insightsRangeDays = requestedDays;
        renderApp();
        break;
      }
      case 'pomodoro-range': {
        const requestedDays = Number(actionElement.dataset.days);
        if (![7, 30, 90].includes(requestedDays)) return;
        pomodoroRangeDays = requestedDays;
        renderApp();
        break;
      }
      case 'clear-habit-filters':
        habitSearchQuery = '';
        habitCategoryFilter = 'All';
        if (document.getElementById('habit-search')) document.getElementById('habit-search').value = '';
        if (document.getElementById('habit-category-filter')) document.getElementById('habit-category-filter').value = 'All';
        updateHabitLibrary();
        window.requestAnimationFrame(() => document.getElementById('habit-search')?.focus());
        break;
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
      case 'add-suggested-habit': {
        const suggestion = makeHabitSuggestions().find((habit) => habit.id === id);
        if (!suggestion || state.habits.some((habit) => habit.id === id)) return;
        openHabitModal('', id);
        break;
      }
      case 'skip-habit-suggestion':
        if (makeHabitSuggestions().some((habit) => habit.id === id) && !state.habits.some((habit) => habit.id === id)) {
          if (!state.skippedHabitSuggestions.includes(id)) state.skippedHabitSuggestions.push(id);
          saveState();
          renderApp();
        }
        break;
      case 'restore-habit-suggestion':
        state.skippedHabitSuggestions = state.skippedHabitSuggestions.filter((suggestionId) => suggestionId !== id);
        saveState();
        renderApp();
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
        toggleHabit(id, actionElement.dataset.day);
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
        const key = isDateKey(actionElement.dataset.day) ? actionElement.dataset.day : getTodayKey();
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
        selectMood(id, actionElement.dataset.day);
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
        if (!window.confirm('Start fresh with an empty habit list and erase all saved progress in your Daymark account? You can choose suggestions later.')) return;
        if (timerTicker) window.clearInterval(timerTicker);
        timerTicker = null;
        state = makeDefaultState();
        currentView = 'today';
        editingFocus = false;
        selectedMoodDay = '';
        selectedMood = '';
        habitSearchQuery = '';
        habitCategoryFilter = 'All';
        reflectionDraftDay = '';
        reflectionDraft = '';
        saveState();
        renderApp();
        showToast('A fresh, blank routine is ready. Choose only what feels right.');
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
      const time = formData.get('startTime');
      const endTime = formData.get('endTime');
      if (!PLAN_HOURS.includes(time) || !HABIT_END_TIMES.includes(endTime) || habitTimeMinutes(endTime) <= habitTimeMinutes(time)) {
        showToast('Choose a valid start and end time.');
        return;
      }
      const selectedDays = typeof formData.getAll === 'function'
        ? [...new Set(formData.getAll('days').map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))]
        : [0, 1, 2, 3, 4, 5, 6];
      const days = selectedDays.length ? selectedDays : [0, 1, 2, 3, 4, 5, 6];
      if (!name) return;
      const existing = state.habits.find((habit) => habit.id === form.dataset.id);
      const suggestion = makeHabitSuggestions().find((habit) => habit.id === form.dataset.suggestionId);
      if (suggestion && state.habits.some((habit) => habit.id === suggestion.id)) {
        closeModal();
        showToast('That habit is already in your routine.');
        return;
      }
      const conflict = findHabitScheduleConflict({ time, endTime, days }, existing?.id || '');
      if (conflict) {
        const overlappingDays = conflict.days.map((day) => WEEKDAY_NAMES[day]).join(', ');
        showToast(`Time overlaps with “${conflict.habit.name}” on ${overlappingDays}. Adjust the range or repeat days.`);
        return;
      }
      if (existing) {
        Object.assign(existing, { name, detail, category, time, endTime, icon: CATEGORY_ICONS[category], days });
        habitSearchQuery = '';
        habitCategoryFilter = 'All';
        saveState();
        closeModal();
        renderApp();
        showToast('Your habit has been updated.');
      } else {
        state.habits.push({ id: suggestion?.id || randomId(), templateId: suggestion?.id || '', name, detail, category, time, endTime, icon: CATEGORY_ICONS[category], days, createdAt: getTodayKey() });
        if (suggestion) state.skippedHabitSuggestions = state.skippedHabitSuggestions.filter((suggestionId) => suggestionId !== suggestion.id);
        habitSearchQuery = '';
        habitCategoryFilter = 'All';
        saveState();
        closeModal();
        renderApp();
        showToast(suggestion ? 'Your chosen habit is ready with its time range set.' : 'Your new habit is ready with its time range set.');
      }
      return;
    }

    if (formType === 'goal') {
      const text = String(formData.get('goal') || '').trim().slice(0, 150);
      if (!text) return;
      const key = isDateKey(form.dataset.day) ? form.dataset.day : dateKey(getTomorrowDate());
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
      const key = isDateKey(form.dataset.day) ? form.dataset.day : getTodayKey();
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
      const key = isDateKey(form.dataset.day) ? form.dataset.day : dateKey(getTomorrowDate());
      state.focus[key] = { text, done: false };
      saveState();
      renderApp();
      showToast('Tomorrow’s priority is set. Keep the rest simple.');
      return;
    }

    if (formType === 'reflection') {
      const key = isDateKey(form.dataset.day) ? form.dataset.day : getTodayKey();
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
    if (!['today', 'habits', 'planner', 'pomodoro', 'challenges', 'insights', 'settings'].includes(nextView)) return;
    currentView = nextView;
    editingFocus = false;
    renderApp();
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function refreshForNewDay() {
    if (getTodayKey() !== lastRenderedDay) {
      const editingForm = document.activeElement?.closest?.('form[data-form]');
      if (editingForm) {
        window.setTimeout(refreshForNewDay, 30_000);
        return;
      }
      renderApp();
    }
    scheduleDayChangeCheck();
  }

  function scheduleDayChangeCheck() {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1, 0);
    const delay = Math.max(1_000, nextMidnight.getTime() - now.getTime());
    window.setTimeout(refreshForNewDay, delay);
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
    const reflectionInput = event.target.closest('#reflection-note');
    if (reflectionInput) {
      reflectionDraftDay = getTodayKey();
      reflectionDraft = reflectionInput.value;
      return;
    }
    const searchInput = event.target.closest('#habit-search');
    if (searchInput) {
      habitSearchQuery = searchInput.value;
      updateHabitLibrary();
    }
  });
  document.addEventListener('change', (event) => {
    const startTime = event.target.closest('[name="startTime"]');
    if (startTime) {
      refreshHabitEndTimeOptions(startTime.closest('form[data-form="habit"]'));
      return;
    }
    const categoryFilter = event.target.closest('#habit-category-filter');
    if (!categoryFilter) return;
    habitCategoryFilter = CATEGORIES.includes(categoryFilter.value) ? categoryFilter.value : 'All';
    updateHabitLibrary();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('has-modal')) closeModal();
  });

  window.addEventListener('daymark:auth-state', (event) => handleFirebaseAuthState(event.detail || {}));
  window.addEventListener('daymark:auth-error', (event) => handleFirebaseAuthError(event.detail || {}));
  window.addEventListener('daymark:firebase-ready', () => {
    if (authInitialized && !authUser) renderApp();
  });
  window.addEventListener('online', () => {
    if (!authUser) return;
    cloudSyncStatus = 'syncing';
    updateCloudSyncIndicator();
  });
  window.addEventListener('offline', () => {
    if (!authUser) return;
    cloudSyncStatus = 'offline';
    updateCloudSyncIndicator();
  });
  window.addEventListener('pagehide', () => { void flushCloudSave(); });

  // Use the local calendar date for all summaries and keep the shell's icons accessible.
  hydrateStaticIcons();
  if (window.DaymarkFirebaseState?.initialized) handleFirebaseAuthState(window.DaymarkFirebaseState);
  else renderApp();
  scheduleDayChangeCheck();
  if (state.timer.endsAt) startTimerTicker();
})();
