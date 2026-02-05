-- Delete ALL incomplete Feb 4 entries (no time_out)
DELETE FROM time_logs 
WHERE id >= 0 
  AND date = '2026-02-04' 
  AND time_out IS NULL;
