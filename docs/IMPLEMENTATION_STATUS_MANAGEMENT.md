# Session Status Management Implementation

## Overview
Production-ready feature for managing appointment statuses with instant calendar updates, enforced transition rules, and security via RLS.

---

## Architecture

### Data Flow
```
User clicks status button
  ↓
StatusControl component
  ↓
useAppointmentStatus hook (optimistic update)
  ↓
updateAppointmentStatus API
  ↓
Supabase (RLS + transition trigger)
  ↓
Success callback → refetch calendar
  ↓
Calendar updates instantly
```

### Security Layers
1. **RLS Policy** - Only provider/owner can update
2. **DB Trigger** - Enforces transition rules at DB level
3. **Client Validation** - UI prevents invalid transitions

---

## Files Changed/Created

### Backend / Database
- ✅ `migrations/add_appointment_status_policies.sql` - Enhanced RLS + validation trigger
- ✅ `lib/api/appointments.ts` - Added `updateAppointmentStatus()` function

### Frontend / Logic
- ✅ `lib/status-transitions.ts` - Pure transition logic (DRY, testable)
- ✅ `hooks/useAppointmentStatus.ts` - Optimistic update hook
- ✅ `components/calendar/StatusControl.tsx` - Status UI component
- ✅ `components/calendar/SessionSheet.tsx` - Integrated StatusControl
- ✅ `components/calendar/CalendarShell.tsx` - Added refetch callback

### Tests
- ✅ `__tests__/status-transitions.test.ts` - Pure logic tests
- ✅ `__tests__/StatusControl.test.tsx` - Component behavior tests

### Documentation
- ✅ `docs/qa-manual-status-update.md` - Manual QA checklist (12 test cases)
- ✅ `docs/IMPLEMENTATION_STATUS_MANAGEMENT.md` - This file

---

## Key Features

### Transition Rules (Enforced at DB + UI)
- `scheduled` → `completed | canceled | no_show`
- `completed | canceled | no_show` → **TERMINAL** (no further changes)

### User Experience
- **Optimistic Updates** - UI updates instantly, rolls back on error
- **Instant Calendar Refresh** - No page reload needed
- **Contextual UI** - Terminal states show "(Estado final)" with help text
- **Cancellation Workflow** - Requires reason input before confirming
- **Loading States** - Buttons disabled during update, spinner shown

### Security
- **RLS Policy** - Update allowed only if:
  - User is appointment provider, OR
  - User is workspace owner/admin
- **Transition Validation** - DB trigger blocks invalid transitions
- **Metadata Tracking** - Cancellations save reason, timestamp, user ID

---

## Migration Instructions

### 1. Apply Database Migration
```bash
# Connect to Supabase
psql $DATABASE_URL

# Run migration
\i migrations/add_appointment_status_policies.sql
```

### 2. Verify Migration
```sql
-- Check trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'check_appointment_status_transition';

-- Check function exists
SELECT proname FROM pg_proc WHERE proname = 'validate_appointment_status_transition';

-- Check policy updated
SELECT polname, polcmd FROM pg_policies WHERE tablename = 'appointments';
```

### 3. Run Tests
```bash
npm test -- status-transitions
npm test -- StatusControl
```

### 4. Manual QA
Follow `docs/qa-manual-status-update.md` checklist

---

## API Reference

### `updateAppointmentStatus()`
```typescript
await updateAppointmentStatus(
  appointmentId: string,
  newStatus: 'scheduled' | 'completed' | 'canceled' | 'no_show',
  metadata?: { cancellationReason?: string }
)
```

**Returns:** Updated appointment with client data
**Throws:** Error if transition invalid or permission denied

### Transition Helpers
```typescript
import {
  getAllowedTransitions,
  isValidTransition,
  isTerminalStatus,
  getStatusLabel,
  getStatusColor
} from '@/lib/status-transitions'

getAllowedTransitions('scheduled') // ['completed', 'canceled', 'no_show']
isValidTransition('completed', 'scheduled') // false
isTerminalStatus('completed') // true
```

---

## Edge Cases Handled

1. **Rapid Clicks** - Button disabled during update
2. **Network Errors** - Optimistic rollback + error display
3. **Concurrent Updates** - Last-write-wins (DB enforces consistency)
4. **Missing Cancellation Reason** - Client-side validation
5. **Direct API Calls** - DB trigger blocks invalid transitions
6. **Unauthorized Users** - RLS rejects update
7. **Terminal State Attempts** - Trigger throws exception

---

## Performance

- **Zero N+1 Queries** - Single update + select with join
- **Optimistic Updates** - Zero perceived latency
- **Efficient Refresh** - Reuses existing `useCalendarData` hook
- **No Polling** - Event-driven updates only

---

## Future Enhancements

- [ ] Real-time updates via Supabase subscriptions
- [ ] Audit log table for status history
- [ ] Bulk status updates
- [ ] Undo last status change (within 5 min window)
- [ ] Email notifications on status change

---

## Rollback Plan

If issues arise:

1. **Disable Feature (UI)**
   ```typescript
   // In SessionSheet.tsx, comment out StatusControl
   {/* <StatusControl ... /> */}
   ```

2. **Revert Migration**
   ```sql
   DROP TRIGGER IF EXISTS check_appointment_status_transition ON appointments;
   DROP FUNCTION IF EXISTS validate_appointment_status_transition();

   -- Restore original update policy (check git history)
   ```

3. **Deploy Rollback**
   ```bash
   git revert <commit-hash>
   npm run build
   npm run deploy
   ```

---

## Monitoring

### Key Metrics
- Status update success rate (target: >99%)
- Average update latency (target: <500ms)
- Optimistic rollback rate (target: <1%)
- Invalid transition attempts blocked (should be >0 if users test boundaries)

### Error Patterns to Watch
- `Trigger exception: Invalid transition from X to Y` - Expected for terminal states
- `RLS permission denied` - Expected for unauthorized users
- Frequent optimistic rollbacks - May indicate network issues

---

## Support

**Database Issues:**
- Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'appointments'`
- Check trigger: `SELECT * FROM pg_trigger WHERE tgrelid = 'appointments'::regclass`

**Frontend Issues:**
- Check browser console for API errors
- Verify hook refetch callback wired correctly
- Test with Network tab to see request/response

**QA Issues:**
- See `docs/qa-manual-status-update.md`
- Run tests: `npm test`
