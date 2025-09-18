# Google Calendar Integration Setup

This guide will help you set up Google Calendar integration for your PastorAgenda application.

## Prerequisites

1. A Google Cloud Console project
2. Google Calendar API enabled
3. OAuth2 credentials configured

## Step 1: Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click on it and press "Enable"

## Step 2: Create OAuth2 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application" as the application type
4. Add authorized redirect URIs:
   - For development: `http://localhost:5173/auth/google/callback`
   - For production: `https://yourdomain.com/auth/google/callback`
5. Save the credentials and note down:
   - Client ID
   - Client Secret

## Step 3: Environment Variables

### Client-side (.env file)

Add these variables to your `packages/client/.env` file:

```env
# Google Calendar API Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

**Important:** The `VITE_GOOGLE_CLIENT_SECRET` is only used for the OAuth token exchange and is safe to include in the client bundle for this specific use case.

### Supabase Edge Functions

Add these environment variables to your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to "Settings" > "Edge Functions"
3. Add the following environment variables:
   - `GOOGLE_CLIENT_ID`: Your Google OAuth2 Client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth2 Client Secret
   - `GOOGLE_REDIRECT_URI`: Your redirect URI

## Step 4: Database Migration

Run the database migration to add Google Calendar integration fields:

```bash
cd packages/supabase
supabase db push
```

## Step 5: Deploy Edge Functions

Deploy the Google Calendar sync edge function:

```bash
cd packages/supabase
supabase functions deploy google-calendar-sync
```

## Step 6: Install Dependencies

Install the required dependencies:

```bash
# Supabase dependencies (for edge functions)
cd packages/supabase
npm install googleapis

# Client dependencies are already included
cd packages/client
npm install
```

**Note:** The client-side integration uses direct Google Calendar API calls via fetch, so no additional client dependencies are needed.

## Step 7: Test the Integration

1. Start your development server:
   ```bash
   cd packages/client
   npm run dev
   ```

2. Go to your profile settings
3. Click on the "Google Calendar" tab
4. Click "Connect to Google Calendar"
5. Complete the OAuth flow
6. Create a test booking to verify sync

## Features

Once set up, the integration provides:

- **Automatic Sync**: New bookings are automatically created in Google Calendar
- **Event Details**: Includes attendee information, description, and reminders
- **Real-time Updates**: Changes to bookings are reflected in Google Calendar
- **Cancellation Sync**: Cancelled bookings are removed from Google Calendar
- **User Control**: Pastors can enable/disable sync in their profile settings

## Troubleshooting

### Common Issues

1. **"Google Calendar API not configured"**
   - Check that all environment variables are set correctly
   - Verify the Google Calendar API is enabled in Google Cloud Console

2. **"Failed to refresh access token"**
   - The refresh token may have expired
   - User needs to reconnect their Google Calendar

3. **"No Google Calendar event ID found"**
   - The booking may not have been synced initially
   - Try creating a new booking or manually triggering sync

### Debug Mode

Enable debug logging by checking the browser console for detailed error messages.

## Security Notes

- Never commit your Google OAuth credentials to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your OAuth credentials
- Monitor API usage in Google Cloud Console

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure the Google Calendar API is properly enabled
4. Check that your OAuth redirect URIs match exactly

For additional help, refer to the [Google Calendar API documentation](https://developers.google.com/calendar/api/v3/reference).
