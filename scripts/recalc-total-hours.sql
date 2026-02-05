-- Recalculate total_hours from time_in and time_out for all records
UPDATE time_logs t
SET total_hours = ROUND(TIMESTAMPDIFF(SECOND, t.time_in, t.time_out) / 3600, 2)
WHERE id >= 0 AND time_out IS NOT NULL;
