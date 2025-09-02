# Custom Authentication Migration Guide

This guide explains how to migrate from Supabase Auth to a custom JWT-based authentication system using OTP verification and Brevo SMTP.

## Overview

The migration replaces Supabase Auth with:
- Custom JWT tokens (1-year expiration)
- OTP-only authentication (no passwords)
- Brevo SMTP for email delivery
- Enhanced profiles table with authentication fields
- Custom edge functions for authentication

## Migration Steps

### 1. Database Migration

Run the following migrations in order:

```bash
# Apply the main migration
supabase db push

# Or run individual migrations:
supabase migration up --include-all
```

The migrations will:
- Add authentication fields to the `profiles` table
- Migrate existing `auth.users` data to `profiles`
- Update foreign key relationships
- Create new authentication functions
- Update RLS policies

### 2. Environment Configuration

Update your environment variables:

#### Client (.env)
```env
# Supabase Configuration (Database only - no auth)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT Configuration
VITE_JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

#### Server (.env)
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_URL=https://yourdomain.com

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Brevo SMTP Configuration
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USERNAME=your-brevo-username@smtp-brevo.com
BREVO_SMTP_PASSWORD=your-brevo-smtp-password
```

### 3. Deploy Edge Functions

Deploy the new authentication edge functions:

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually:
supabase functions deploy auth-send-otp
supabase functions deploy auth-verify-otp
supabase functions deploy auth-validate-token
```

### 4. Update Supabase Configuration

The `config.toml` has been updated to include JWT configuration. Make sure to set the `JWT_SECRET` environment variable in your Supabase project.

## New Authentication Flow

### 1. User Registration/Login
1. User enters email address
2. System sends OTP via Brevo SMTP
3. User enters OTP code
4. System verifies OTP and creates/updates user profile
5. System returns JWT token (1-year expiration)
6. Client stores token and user data

### 2. Token Validation
- Tokens are validated on each request
- Invalid/expired tokens are automatically cleared
- User data is refreshed from server when needed

### 3. Development Mode
- Use OTP code "000000" for development testing
- Automatically creates mock user and token
- Bypasses email sending in development

## API Endpoints

### Send OTP
```
POST /functions/v1/auth-send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Verify OTP
```
POST /functions/v1/auth-verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

### Validate Token
```
POST /functions/v1/auth-validate-token
Content-Type: application/json

{
  "token": "jwt-token-here"
}
```

## Database Changes

### Profiles Table
New fields added:
- `email` (TEXT, UNIQUE) - User's email address
- `email_verified` (BOOLEAN) - Email verification status
- `last_login_at` (TIMESTAMPTZ) - Last successful login
- `otp_code` (TEXT) - Temporary OTP code
- `otp_expires_at` (TIMESTAMPTZ) - OTP expiration time
- `failed_login_attempts` (INTEGER) - Failed login counter
- `locked_until` (TIMESTAMPTZ) - Account lockout time

### Removed Dependencies
- No longer references `auth.users` table
- Foreign key constraints updated
- RLS policies updated to work without `auth.uid()`

## Email Templates

The system includes three email templates:

1. **OTP Verification** - Sent when user requests login code
2. **Welcome Email** - Sent to new users after successful verification
3. **Event Reminder** - Sent for appointment confirmations

All emails use Brevo SMTP with professional HTML templates.

## Security Features

- JWT tokens with 1-year expiration
- OTP codes expire in 10 minutes
- Automatic cleanup of expired OTPs
- Secure token validation
- No password storage (OTP-only)

## Testing

### Development Mode
1. Use email: `test@example.com`
2. Use OTP: `000000`
3. System will create mock user and token

### Production Testing
1. Use real email address
2. Check email for OTP code
3. Enter OTP to complete authentication

## Troubleshooting

### Common Issues

1. **OTP not received**
   - Check Brevo SMTP configuration
   - Verify email address is correct
   - Check spam folder

2. **Token validation fails**
   - Ensure JWT_SECRET is set correctly
   - Check token expiration
   - Verify token format

3. **Database errors**
   - Run migrations in correct order
   - Check foreign key constraints
   - Verify RLS policies

### Logs
Check Supabase function logs for detailed error information:
```bash
supabase functions logs auth-send-otp
supabase functions logs auth-verify-otp
supabase functions logs auth-validate-token
```

## Rollback Plan

If you need to rollback to Supabase Auth:

1. Restore original database schema
2. Revert client code changes
3. Update environment variables
4. Redeploy original functions

## Support

For issues or questions:
1. Check the logs first
2. Verify environment configuration
3. Test with development mode
4. Review this migration guide

## Next Steps

After successful migration:
1. Test all authentication flows
2. Update any custom integrations
3. Monitor email delivery
4. Set up monitoring for authentication errors
5. Consider implementing additional security features (rate limiting, etc.)
