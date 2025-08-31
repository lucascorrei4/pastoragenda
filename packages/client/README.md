# PastorTalk Client

This is the frontend React application for PastorTalk, built with Vite, TypeScript, and Tailwind CSS.

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
The application requires Supabase environment variables to function properly. Run the setup script:

```bash
npm run setup-env
```

This will create a `.env` file with the required variables. You'll need to:

1. Go to your [Supabase project dashboard](https://supabase.com/dashboard)
2. Navigate to **Settings** > **API**
3. Copy the **Project URL** and replace `VITE_SUPABASE_URL` in the `.env` file
4. Copy the **anon public** key and replace `VITE_SUPABASE_ANON_KEY` in the `.env` file

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run setup-env` - Set up environment variables
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `VITE_APP_URL` | Your application URL | No (defaults to localhost:3000) |

## Troubleshooting

### Page Loading in Loop
If you experience infinite loading loops, check:
1. Environment variables are properly set in `.env`
2. Supabase project is accessible
3. Network connectivity to Supabase

### No XHR Requests
If no network requests are being made:
1. Verify environment variables are loaded
2. Check browser console for errors
3. Ensure Supabase client is properly initialized

### Public Pages Not Working
Public pages depend on the same Supabase configuration. Ensure:
1. Environment variables are set correctly
2. Supabase project has the required tables and policies
3. No authentication errors in the console

## Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/      # React contexts (Auth, Theme)
├── i18n/         # Internationalization
├── lib/          # Utility libraries and Supabase client
├── pages/        # Page components
└── App.tsx       # Main application component
```

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend as a service
- **React Router** - Client-side routing
- **React Hot Toast** - Notifications
- **Lucide React** - Icons
