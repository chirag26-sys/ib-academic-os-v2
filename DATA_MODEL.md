# Data Model

All user data lives in IndexedDB, database name `ib-academic-os`, version 1.
Nothing here is pre-populated except the six confirmed subjects — everything
else starts empty; you fill it in as you go.

## Stores

### `subjects` (static-ish, seeded once)
`id, name, level, color`
Seeded rows: HL Computer Science, HL Business Management, HL English,
SL Math AA&A, SL Physics, SL Dutch.

### `tasks`
`id, subjectId, assessmentId, title, outcome, dueDate, durationMin, priority, status, source, createdAt`
- `priority`: `"R" | "Y" | "G" | null` (null = auto-computed, see ARCHITECTURE.md)
- `status`: `"todo" | "done"`
- `source`: `"manual" | "ai"`

### `assessments`
`id, subjectId, title, date, time, topics, weight, status`
- `status`: `"upcoming" | "done"`

### `grades`
`id, subjectId, assessmentId, date, score, max, ibGradeEstimate, isSchoolEstimate, teacherFeedback`

### `errors`
`id, subjectId, topic, date, question, mistake, causeTags, redoRequired, retestDate, resolved`

### `studySessions`
`id, subjectId, taskId, plannedMin, actualMin, confidence, difficulty, notes, timestamp`

### `resources`
`id, subjectId, topic, type, url, source, trustLabel, lastVerified, description, tags`
- `trustLabel`: `"official" | "trusted_edu" | "teacher" | "community" | "unverified"`

### `dailyPlans`
`date (YYYY-MM-DD, key), blocks, threeWins`

### `weeklyPlans`
`weekStart (YYYY-MM-DD, key), blocks`

### `settings`
Simple key/value store. Keys used in MVP: `maxStudyMinWeekday`,
`maxStudyMinWeekend`, `protectedWindows` (gym/cricket/sleep blocks),
`aiProvider` (default `"manual"`).

## Export / import

Export produces one JSON file: `{ version, exportedAt, stores: { ...all rows... } }`.
Import wipes and replaces matching stores — you'll get a confirmation prompt
before anything is overwritten.
