-- Test notification by sending to a specific device
-- Replace the device_id with your actual device ID

-- Test sending notification to your device
SELECT 
  d.device_id,
  d.push_token,
  d.platform,
  d.user_id,
  d.user_email,
  p.full_name
FROM devices d
LEFT JOIN profiles p ON d.user_id = p.id
WHERE d.device_id = 'BP2A.250805.005';

-- To test the notification function directly:
-- You can call the send-notification function with:
-- POST /functions/v1/send-notification
-- Body: {
--   "title": "Test Notification",
--   "body": "This is a test notification",
--   "deviceId": "BP2A.250805.005"
-- }
