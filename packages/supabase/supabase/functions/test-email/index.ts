// Test email function to verify BREVO_API_KEY is working
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const brevoApiKey = Deno.env.get("BREVO_API_KEY")
    
    if (!brevoApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'BREVO_API_KEY environment variable is not set',
          status: 'missing_key'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Test email payload
    const emailPayload = {
      sender: {
        name: "PastorAgenda Test",
        email: "test@pastoragenda.com"
      },
      to: [
        {
          email: "test@example.com"
        }
      ],
      subject: "Test Email from PastorAgenda",
      htmlContent: "<h1>Test Email</h1><p>This is a test email to verify BREVO_API_KEY is working.</p>"
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "api-key": brevoApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(emailPayload)
    })

    if (!response.ok) {
      const errorBody = await response.text()
      return new Response(
        JSON.stringify({ 
          error: `Brevo API error: ${response.status}`,
          details: errorBody,
          status: 'api_error'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: data.messageId,
        status: 'success'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Test email error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        status: 'error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
