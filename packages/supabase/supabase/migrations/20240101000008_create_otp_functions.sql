-- Create OTP table for storing OTP codes
CREATE TABLE IF NOT EXISTS public.otp_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);

-- Enable RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to access OTP codes
CREATE POLICY "Service role can manage OTP codes" ON public.otp_codes
    FOR ALL USING (auth.role() = 'service_role');

-- Function to send OTP (generate and store OTP code)
CREATE OR REPLACE FUNCTION public.send_otp(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    otp_code TEXT;
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate 6-digit OTP code
    otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Set expiration time (10 minutes from now)
    expires_at := NOW() + INTERVAL '10 minutes';
    
    -- Clean up old OTP codes for this email
    DELETE FROM public.otp_codes 
    WHERE email = user_email 
    AND (expires_at < NOW() OR used = TRUE);
    
    -- Insert new OTP code
    INSERT INTO public.otp_codes (email, code, expires_at)
    VALUES (user_email, otp_code, expires_at);
    
    -- Return the OTP code
    RETURN otp_code;
END;
$$;

-- Function to verify OTP
CREATE OR REPLACE FUNCTION public.verify_otp(user_email TEXT, otp_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    otp_record RECORD;
BEGIN
    -- Find valid OTP code
    SELECT * INTO otp_record
    FROM public.otp_codes
    WHERE email = user_email 
    AND code = otp_code
    AND expires_at > NOW()
    AND used = FALSE
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If no valid OTP found, return false
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Mark OTP as used
    UPDATE public.otp_codes
    SET used = TRUE
    WHERE id = otp_record.id;
    
    -- Return true
    RETURN TRUE;
END;
$$;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION public.send_otp(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_otp(TEXT, TEXT) TO service_role;
