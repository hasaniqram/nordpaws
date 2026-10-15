export function canSendReminder({verified, enabled, recipientMatches, providerReady, idempotencyReady}) {
  return verified === true && enabled === true && recipientMatches === true &&
    providerReady === true && idempotencyReady === true
}
export function reminderKey(adminId, productId, dueOn, advanceDays) {
  if (!adminId || !productId || !/^\d{4}-\d{2}-\d{2}$/.test(dueOn) ||
      ![1,3,7,14,30].includes(advanceDays)) return null
  return [adminId,productId,dueOn,advanceDays].join(':')
}
