-- Update existing device records to link them to users
-- This script will help link existing devices to user accounts

-- First, let's see what devices we have without user info
SELECT 
  d.id,
  d.device_id,
  d.push_token,
  d.platform,
  d.created_at,
  d.user_id,
  d.user_email
FROM devices d 
WHERE d.user_id IS NULL 
ORDER BY d.created_at DESC;

-- To update a specific device with user info, run:
-- UPDATE devices 
-- SET 
--   user_id = 'your-user-id-here',
--   user_email = 'user@example.com',
--   updated_at = NOW()
-- WHERE device_id = 'BP2A.250805.005';

-- To find a user by email:
-- SELECT id, email, full_name, alias 
-- FROM profiles 
-- WHERE email = 'user@example.com';
