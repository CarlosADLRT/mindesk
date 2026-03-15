-- Migration: Enhanced RLS for appointment status updates
-- Created: 2025-01-25
-- Description: Restrict status updates to provider/owner only + add transition validation

-- Drop existing update policy to replace with more restrictive one
DROP POLICY IF EXISTS appointments_update ON appointments;

-- New update policy: Only provider or workspace owner can update
CREATE POLICY appointments_update ON appointments
  FOR UPDATE
  USING (
    deleted_at IS NULL
    AND (
      provider_id = auth.uid() -- Provider owns the appointment
      OR workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
      )
    )
  )
  WITH CHECK (
    deleted_at IS NULL
    AND (
      provider_id = auth.uid()
      OR workspace_id IN (
        SELECT workspace_id
        FROM workspace_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
      )
    )
  );

-- Function: Validate appointment status transitions
CREATE OR REPLACE FUNCTION validate_appointment_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow any transition if status hasn't changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Enforce transition rules
  CASE OLD.status
    WHEN 'scheduled' THEN
      -- scheduled can transition to any other status
      IF NEW.status NOT IN ('completed', 'canceled', 'no_show') THEN
        RAISE EXCEPTION 'Invalid transition from scheduled to %', NEW.status;
      END IF;
    WHEN 'completed', 'canceled', 'no_show' THEN
      -- Terminal states cannot transition
      RAISE EXCEPTION 'Cannot change status from terminal state %', OLD.status;
    ELSE
      RAISE EXCEPTION 'Unknown status %', OLD.status;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Apply validation on status updates
DROP TRIGGER IF EXISTS check_appointment_status_transition ON appointments;
CREATE TRIGGER check_appointment_status_transition
  BEFORE UPDATE OF status ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment_status_transition();

-- Grant execute on function
GRANT EXECUTE ON FUNCTION validate_appointment_status_transition() TO authenticated;

-- Comment
COMMENT ON FUNCTION validate_appointment_status_transition IS
  'Enforces valid appointment status transitions: scheduled→{completed,canceled,no_show}, terminal states are immutable';
