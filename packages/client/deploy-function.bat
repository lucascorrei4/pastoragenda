@echo off
echo Building Vite project (includes TypeScript compilation)...
call npx vite build
echo Vite build completed with error level %errorlevel%

echo --- Verification Step ---
call npx shx cp dist/index.html ../supabase/supabase/functions/meta-tag-server/
echo File copied to function directory.
dir ../supabase/supabase/functions/meta-tag-server/

echo --- Deploying Function ---
cd ../supabase
echo Changed to supabase directory.
call npx supabase functions deploy meta-tag-server --no-verify-jwt --project-ref qllicbvfcggtveuzvbqu
echo Deployment completed with error level %errorlevel%
