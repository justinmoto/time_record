-- Delete Wed Feb 4, 5:19 AM → 1:39 PM record
DELETE FROM time_logs
WHERE id >= 0
  AND date = '2026-02-04'
  AND time_in = '2026-02-04 05:19:00';
