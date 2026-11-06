// When to remind people to save their project package: autosave off, unsaved work for ten minutes, and then at
// most every fifteen minutes. The demo is never saved, so it never reminds.
export const FIRST_REMINDER_MIN = 10;
export const SNOOZE_MIN = 15;

export function saveReminderDue({ manual, unexported, demo, unsavedSince, lastReminderAt, now }) {
  if (!manual || !unexported || demo || !unsavedSince) return false;
  const t = Date.parse(now);
  if (t - Date.parse(unsavedSince) < FIRST_REMINDER_MIN * 60000) return false;
  if (lastReminderAt && t - Date.parse(lastReminderAt) < SNOOZE_MIN * 60000) return false;
  return true;
}

// Whole minutes of unsaved work, for the status in the top bar.
export function unsavedMinutes(unsavedSince, now) {
  if (!unsavedSince) return 0;
  return Math.max(0, Math.floor((Date.parse(now) - Date.parse(unsavedSince)) / 60000));
}
