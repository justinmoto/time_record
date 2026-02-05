-- Update time_in for specific dates (time_out stays 6:00 PM)
-- Jan 26: 9:40 AM -> 6 PM = 8.33h
UPDATE time_logs SET time_in = '2026-01-26 09:40:00', total_hours = 8.33 WHERE id >= 0 AND date = '2026-01-26' AND time_in = '2026-01-26 10:00:00';

-- Jan 29: 9:45 AM -> 6 PM = 8.25h
UPDATE time_logs SET time_in = '2026-01-29 09:45:00', total_hours = 8.25 WHERE id >= 0 AND date = '2026-01-29' AND time_in = '2026-01-29 10:00:00';

-- Feb 2: 9:30 AM -> 6 PM = 8.50h
UPDATE time_logs SET time_in = '2026-02-02 09:30:00', total_hours = 8.50 WHERE id >= 0 AND date = '2026-02-02' AND time_in = '2026-02-02 10:00:00';

-- Feb 3: 9:50 AM -> 6 PM = 8.17h
UPDATE time_logs SET time_in = '2026-02-03 09:50:00', total_hours = 8.17 WHERE id >= 0 AND date = '2026-02-03' AND time_in = '2026-02-03 10:00:00';
