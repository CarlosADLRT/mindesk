# Manual QA Script: Session Status Management

## Prerequisites
- Database migration applied (`migrations/add_appointment_status_policies.sql`)
- Test user authenticated as provider
- At least one appointment exists in scheduled state

---

## Test Case 1: View Current Status
**Objective:** Verify status is displayed correctly

1. Open calendar view
2. Click on any scheduled appointment
3. Session sheet opens in edit mode
4. **VERIFY:** Status section shows "Programada" with blue styling
5. **VERIFY:** Three transition buttons visible: "Realizada", "Cancelada", "No Asistió"

**Expected:** Current status displays with proper label and color

---

## Test Case 2: Mark as Completed
**Objective:** Update scheduled → completed

1. Open a scheduled appointment
2. Click "Realizada" button
3. **VERIFY:** Loading spinner appears briefly
4. **VERIFY:** Status changes to "Realizada" with green styling
5. **VERIFY:** Transition buttons disappear
6. **VERIFY:** "(Estado final)" label appears
7. **VERIFY:** Calendar refreshes and event color updates
8. Close sheet and reopen same appointment
9. **VERIFY:** Status persists as "Realizada"

**Expected:** Status updates instantly, calendar refreshes, terminal state enforced

---

## Test Case 3: Mark as No Show
**Objective:** Update scheduled → no_show

1. Open a scheduled appointment
2. Click "No Asistió" button
3. **VERIFY:** Status changes to "No Asistió" with amber styling
4. **VERIFY:** Transition buttons disappear (terminal state)
5. **VERIFY:** Calendar updates

**Expected:** Transition works, terminal state enforced

---

## Test Case 4: Cancel with Reason
**Objective:** Update scheduled → canceled with metadata

1. Open a scheduled appointment
2. Click "Cancelada" button
3. **VERIFY:** Cancellation reason form appears
4. Leave reason field empty and click "Confirmar Cancelación"
5. **VERIFY:** Error message "Por favor ingrese un motivo de cancelación"
6. Enter reason: "Cliente solicitó reagendar"
7. Click "Confirmar Cancelación"
8. **VERIFY:** Status changes to "Cancelada" with red styling
9. **VERIFY:** Calendar updates
10. Check database directly
11. **VERIFY:** `canceled_at`, `canceled_by`, `cancellation_reason` fields populated

**Expected:** Cancellation requires reason, metadata saved correctly

---

## Test Case 5: Cancel Form - Back Button
**Objective:** Verify cancellation form can be dismissed

1. Open a scheduled appointment
2. Click "Cancelada" button
3. **VERIFY:** Cancellation form appears
4. Enter some text in reason field
5. Click "Volver" button
6. **VERIFY:** Form closes, returns to status buttons
7. **VERIFY:** Status remains "Programada"

**Expected:** User can abort cancellation without changing status

---

## Test Case 6: Terminal State Enforcement (UI)
**Objective:** Verify terminal states cannot transition

1. Open a completed appointment
2. **VERIFY:** Status shows "Realizada" with green styling
3. **VERIFY:** No transition buttons visible
4. **VERIFY:** "(Estado final)" label present
5. **VERIFY:** Help text: "Este estado no puede ser modificado..."

**Expected:** UI prevents transitions from terminal states

---

## Test Case 7: Terminal State Enforcement (DB)
**Objective:** Verify database blocks invalid transitions

1. Open browser console
2. Get a completed appointment ID
3. Execute direct API call:
   ```javascript
   // This should fail
   await fetch('/api/appointments/{id}', {
     method: 'PATCH',
     body: JSON.stringify({ status: 'scheduled' })
   })
   ```
4. **VERIFY:** Request fails with error
5. **VERIFY:** Error message mentions invalid transition or trigger

**Expected:** Database trigger blocks invalid transitions

---

## Test Case 8: Permission Enforcement
**Objective:** Verify only provider/owner can update status

1. Log out current user
2. Log in as a different provider (not owner of appointment)
3. Navigate to calendar, try to open appointment
4. **VERIFY:** Either appointment not visible OR status update fails with permission error

**Expected:** RLS policy enforces ownership

---

## Test Case 9: Optimistic Update & Rollback
**Objective:** Test error handling with network failure

1. Open browser DevTools → Network tab
2. Set network throttling to "Offline"
3. Open a scheduled appointment
4. Click "Realizada" button
5. **VERIFY:** Status changes immediately (optimistic)
6. **VERIFY:** After network timeout, status reverts to "Programada"
7. **VERIFY:** Error message displays

**Expected:** Optimistic update with rollback on failure

---

## Test Case 10: Calendar Refresh
**Objective:** Verify calendar updates without page reload

1. Open calendar in month view
2. Find a scheduled event (e.g., event on 15th)
3. Click event to open sheet
4. Change status to "Realizada"
5. Close sheet
6. **VERIFY:** Event color changes on calendar (green for completed)
7. Switch to week view
8. **VERIFY:** Event shows updated status/color
9. Do NOT refresh page
10. **VERIFY:** Changes persist across view switches

**Expected:** Calendar data refreshes via hook, no page reload needed

---

## Test Case 11: Multiple Rapid Updates
**Objective:** Test race conditions

1. Open a scheduled appointment
2. Rapidly click "Realizada" button 3 times
3. **VERIFY:** Only one request sent (button disabled during update)
4. **VERIFY:** Status updates once
5. **VERIFY:** No duplicate DB records or errors

**Expected:** Loading state prevents duplicate requests

---

## Test Case 12: Concurrent Users
**Objective:** Test real-time updates between sessions

1. Open calendar in two browser tabs (same user)
2. Tab 1: Open appointment A
3. Tab 2: Open same appointment A
4. Tab 1: Change status to "Realizada"
5. Tab 2: Click "Realizada" (should now be terminal)
6. **VERIFY:** Tab 2 shows error or doesn't allow transition (depends on refresh timing)
7. Tab 2: Close and reopen appointment
8. **VERIFY:** Status shows "Realizada" from Tab 1's change

**Expected:** Last-write-wins, no data corruption

---

## Acceptance Criteria
- [ ] All 12 test cases pass
- [ ] No console errors during normal flow
- [ ] Database constraints enforced
- [ ] RLS policies block unauthorized updates
- [ ] Calendar refreshes without page reload
- [ ] Terminal states immutable in UI and DB
- [ ] Cancellation reason required and saved
- [ ] Optimistic updates with error rollback working

---

## Regression Checks
- [ ] Existing appointment creation still works
- [ ] Appointment editing (time/client) still works
- [ ] Calendar drag-and-drop still works
- [ ] Appointment deletion still works
- [ ] Dashboard appointment list shows correct statuses
