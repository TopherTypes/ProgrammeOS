/**
 * Shared deterministic sort helpers for meeting-linked review and list screens.
 *
 * Actions carry lifecycle state, so we bucket by explicit status order first and
 * only then apply oldest-first creation ordering.
 * Decisions and updates currently have no status lifecycle field, so they use
 * oldest-first ordering only.
 */

const ACTION_STATUS_BUCKET_ORDER = {
  open: 0,
  "in-progress": 1,
  blocked: 2,
  done: 3,
  unknown: 4,
};

/**
 * @param {string|undefined|null} status
 * @returns {number}
 */
function getActionStatusBucketOrder(status) {
  const normalizedStatus = typeof status === "string" ? status.trim().toLowerCase() : "";
  return ACTION_STATUS_BUCKET_ORDER[normalizedStatus] ?? ACTION_STATUS_BUCKET_ORDER.unknown;
}

/**
 * @param {string|undefined|null} isoValue
 * @returns {number}
 */
function getCreatedAtTimestamp(isoValue) {
  const parsed = typeof isoValue === "string" ? Date.parse(isoValue) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

/**
 * @param {string|undefined|null} value
 * @returns {string}
 */
function asComparableString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * @param {{ createdAt?: string, id?: string }} left
 * @param {{ createdAt?: string, id?: string }} right
 * @returns {number}
 */
function compareOldestFirstWithStableFallback(left, right) {
  const createdAtOrder =
    getCreatedAtTimestamp(left.createdAt) - getCreatedAtTimestamp(right.createdAt);

  if (createdAtOrder !== 0) {
    return createdAtOrder;
  }

  const createdAtStringOrder = asComparableString(left.createdAt).localeCompare(
    asComparableString(right.createdAt)
  );

  if (createdAtStringOrder !== 0) {
    return createdAtStringOrder;
  }

  const idOrder = asComparableString(left.id).localeCompare(asComparableString(right.id));

  if (idOrder !== 0) {
    return idOrder;
  }

  return 0;
}

/**
 * Returns actions in deterministic display order:
 * 1) status bucket
 * 2) oldest createdAt first
 * 3) stable tie-break fallbacks
 *
 * @template T
 * @param {T[]} actions
 * @returns {T[]}
 */
export function sortActionsForDisplay(actions) {
  return actions
    .map((action, index) => ({ action, index }))
    .sort((left, right) => {
      const statusOrder =
        getActionStatusBucketOrder(left.action?.status) -
        getActionStatusBucketOrder(right.action?.status);

      if (statusOrder !== 0) {
        return statusOrder;
      }

      const createdAtOrder = compareOldestFirstWithStableFallback(left.action, right.action);

      if (createdAtOrder !== 0) {
        return createdAtOrder;
      }

      return left.index - right.index;
    })
    .map(({ action }) => action);
}

/**
 * Returns records in deterministic oldest-first order with stable tie-breakers.
 *
 * Decisions and updates intentionally use this helper (without status buckets)
 * because they do not currently model workflow status.
 *
 * @template T
 * @param {T[]} records
 * @returns {T[]}
 */
export function sortRecordsOldestFirst(records) {
  return records
    .map((record, index) => ({ record, index }))
    .sort((left, right) => {
      const createdAtOrder = compareOldestFirstWithStableFallback(left.record, right.record);

      if (createdAtOrder !== 0) {
        return createdAtOrder;
      }

      return left.index - right.index;
    })
    .map(({ record }) => record);
}
