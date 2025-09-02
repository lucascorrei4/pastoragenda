# Supabase Edge Functions Cleanup Guide

## Current Status

You have **5 edge functions** deployed in your Supabase project, but you only need **3** for your custom authentication system.

## Required Functions (Keep These)

### 1. `auth-send-otp`
- **Purpose**: Sends OTP code to user's email
- **Endpoint**: `/functions/v1/auth-send-otp`
- **Status**: ✅ Correctly implemented
- **Dependencies**: `send_otp` database function

### 2. `auth-verify-otp`
- **Purpose**: Verifies OTP and returns JWT token
- **Endpoint**: `/functions/v1/auth-verify-otp`
- **Status**: ✅ Correctly implemented
- **Dependencies**: `verify_otp` database function

### 3. `auth-validate-token`
- **Purpose**: Validates JWT tokens
- **Endpoint**: `/functions/v1/auth-validate-token`
- **Status**: ✅ Correctly implemented
- **Dependencies**: JWT verification service

### 4. `on-booking-created` (Optional - for notifications)
- **Purpose**: Sends booking confirmation emails
- **Endpoint**: `/functions/v1/on-booking-created`
- **Status**: ✅ Keep this for booking notifications

## Functions to Delete

### ❌ `auth-send-otp-cors-fixed`
- **Reason**: Duplicate/test version of auth-send-otp
- **Action**: Delete from Supabase dashboard

### ❌ `auth-send-otp-no-cors`
- **Reason**: Duplicate/test version of auth-send-otp
- **Action**: Delete from Supabase dashboard

## Database Functions Required

Your edge functions depend on these database functions that were missing:

### 1. `send_otp(user_email TEXT)`
- **Purpose**: Generates and stores OTP codes
- **Status**: ✅ Created in migration `20240101000008_create_otp_functions.sql`

### 2. `verify_otp(user_email TEXT, otp_code TEXT)`
- **Purpose**: Verifies OTP codes
- **Status**: ✅ Created in migration `20240101000008_create_otp_functions.sql`

### 3. Database Tables
- **`otp_codes`**: Stores OTP codes with expiration
- **`profiles`**: Updated with email, email_verified, last_login_at fields

## Cleanup Steps

### Step 1: Delete Unnecessary Functions
1. Go to your Supabase Dashboard
2. Navigate to Edge Functions
3. Delete these functions:
   - `auth-send-otp-cors-fixed`
   - `auth-send-otp-no-cors`

### Step 2: Apply Database Migrations
Run these migrations in your Supabase project:

```sql
-- Apply the OTP functions migration
-- File: packages/supabase/supabase/migrations/20240101000008_create_otp_functions.sql

-- Apply the profiles table update
-- File: packages/supabase/supabase/migrations/20240101000009_update_profiles_for_custom_auth.sql
```

### Step 3: Verify Functions
Test your authentication flow:
1. Send OTP: `POST /functions/v1/auth-send-otp`
2. Verify OTP: `POST /functions/v1/auth-verify-otp`
3. Validate Token: `POST /functions/v1/auth-validate-token`

## Environment Variables Required

Make sure these are set in your Supabase project:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Final Result

After cleanup, you should have exactly **4 edge functions**:
1. ✅ `auth-send-otp`
2. ✅ `auth-verify-otp`
3. ✅ `auth-validate-token`
4. ✅ `on-booking-created`

This gives you a clean, minimal setup for your custom authentication system.
