/**
 * Attention engine derives render-time flags from canonical status/date fields.
 *
 * This keeps persisted entities stable (source-of-truth inputs only) while avoiding
 * stale "attention" strings drifting from the underlying data.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const CADENCE_DAYS = {
  weekly: 7,
  monthly: 30,
  quarterly: 90
};

function normaliseDateInput(value) {
  if (!value || value === '-') return null;
  const raw = String(value).trim();
  if (!raw) return null;

  // Meeting workspace values include time ranges (for example "11 Mar 2026 · 10:00–10:30").
  const dateOnly = raw.split('·')[0].trim();
  const parsed = Date.parse(dateOnly);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function resolveCadenceDays(cadence) {
  const normalized = String(cadence || '').trim().toLowerCase();
  if (!normalized || normalized === 'optional') return null;
  return CADENCE_DAYS[normalized] || null;
}

function isActionOverdue(action, nowTs) {
  const status = String(action?.status || '').toLowerCase();
  if (status === 'complete' || status === 'closed') return false;
  if (status.includes('overdue')) return true;
  const dueTs = normaliseDateInput(action?.due);
  return dueTs !== null && dueTs < nowTs;
}

function deriveProjectAttention(project, nowTs) {
  const cadenceDays = resolveCadenceDays(project?.cadence);
  const lastReviewTs = normaliseDateInput(project?.lastReview);
  const reviewBreached = Boolean(cadenceDays && lastReviewTs && lastReviewTs + cadenceDays * DAY_MS < nowTs);
  const overdueActions = (project?.actions || []).filter((action) => isActionOverdue(action, nowTs)).length;

  if (reviewBreached || overdueActions > 0) {
    const reasons = [];
    if (reviewBreached) reasons.push('Cadence breach');
    if (overdueActions > 0) reasons.push(`${overdueActions} overdue action${overdueActions > 1 ? 's' : ''}`);
    return { label: 'Needs attention', reviewBreached, overdueActions, reasons };
  }

  return { label: 'On track', reviewBreached: false, overdueActions: 0, reasons: [] };
}

function derivePersonAttention(person, actions, nowTs) {
  const cadenceDays = resolveCadenceDays(person?.cadence);
  const lastMeetingTs = normaliseDateInput(person?.lastMeeting);
  const lastInteractionTs = normaliseDateInput(person?.lastInteraction);
  const snoozeDays = Number(person?.cadenceSnoozeDays) || 0;

  const cadenceDueTs = cadenceDays && lastMeetingTs ? lastMeetingTs + cadenceDays * DAY_MS : null;
  const snoozeUntilTs = lastInteractionTs && snoozeDays > 0 ? lastInteractionTs + snoozeDays * DAY_MS : null;

  // A short interaction can nudge cadence temporarily, but does not rewrite lastMeeting.
  const effectiveDueTs = Math.max(cadenceDueTs || -Infinity, snoozeUntilTs || -Infinity);
  const meetingCadenceExceeded = Number.isFinite(effectiveDueTs) ? nowTs > effectiveDueTs : false;
  const cadenceSnoozed = Boolean(
    cadenceDueTs && nowTs > cadenceDueTs && snoozeUntilTs && nowTs <= snoozeUntilTs
  );

  const personOverdueActions = actions.filter((action) => {
    const owner = String(action?.owner || '').trim().toLowerCase();
    return owner === String(person?.name || '').trim().toLowerCase() && isActionOverdue(action, nowTs);
  }).length;

  if (meetingCadenceExceeded || personOverdueActions > 0) {
    const reasons = [];
    if (meetingCadenceExceeded) reasons.push('Meeting cadence exceeded');
    if (personOverdueActions > 0) reasons.push(`${personOverdueActions} overdue action${personOverdueActions > 1 ? 's' : ''}`);
    return {
      label: 'Needs meeting',
      meetingCadenceExceeded,
      personOverdueActions,
      cadenceSnoozed,
      snoozeUntil: snoozeUntilTs,
      reasons
    };
  }

  return {
    label: cadenceSnoozed ? 'Snoozed' : 'Current',
    meetingCadenceExceeded: false,
    personOverdueActions,
    cadenceSnoozed,
    snoozeUntil: snoozeUntilTs,
    reasons: cadenceSnoozed ? ['Temporarily snoozed by interaction'] : []
  };
}

export function buildAttentionSnapshot(appData, now = new Date()) {
  const source = appData || {};
  const nowTs = now.getTime();

  const projects = (source.projects || []).map((project) => ({
    ...project,
    attention: deriveProjectAttention(project, nowTs)
  }));

  const people = (source.people || []).map((person) => ({
    ...person,
    attention: derivePersonAttention(person, source.actions || [], nowTs)
  }));

  return {
    projects,
    people,
    metrics: {
      projectsNeedingReview: projects.filter((project) => project.attention.label === 'Needs attention').length,
      peopleNeedingMeeting: people.filter((person) => person.attention.label === 'Needs meeting').length,
      overdueActions: (source.actions || []).filter((action) => isActionOverdue(action, nowTs)).length,
      itemsToInform: (source.informs || []).reduce((total, inform) => total + (Number(inform.pending) || 0), 0)
    }
  };
}
