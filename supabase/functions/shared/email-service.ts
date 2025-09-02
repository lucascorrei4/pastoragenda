import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const SMTP_CONFIG = {
  hostname: "smtp-relay.brevo.com",
  port: 587,
  username: "81dae5002@smtp-brevo.com",
  password: "xsmtpsib-2d526e2bfe7f08961d263d9934b54bfe321178f6736469a4d7300784c945040d-qrfkwbYyP7VXgndK",
  tls: true,
}

interface SendOTPEmailParams {
  to: string
  otpCode: string
  isNewUser: boolean
}

interface SendWelcomeEmailParams {
  to: string
  userName: string
}

interface SendEventReminderParams {
  to: string
  bookerName: string
  pastorName: string
  eventTitle: string
  date: string
  time: string
  duration: number
  pastorAlias: string
}

export async function sendOTPEmail({ to, otpCode, isNewUser }: SendOTPEmailParams): Promise<void> {
  const client = new SMTPClient(SMTP_CONFIG)
  
  const subject = isNewUser ? "Welcome to PastorAgenda - Verify Your Email" : "Your PastorAgenda Login Code"
  
  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">PastorAgenda</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
          ${isNewUser ? 'Welcome to your pastoral scheduling platform!' : 'Your secure login code'}
        </p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1e293b; margin-top: 0;">
          ${isNewUser ? 'Welcome! Verify Your Email' : 'Your Login Code'}
        </h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          ${isNewUser 
            ? `Welcome to PastorAgenda! We're excited to help you manage your pastoral appointments and schedule.`
            : `Here's your secure login code for PastorAgenda.`
          }
        </p>
        
        <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 25px; text-align: center; margin: 25px 0;">
          <p style="margin: 0 0 15px 0; color: #64748b; font-size: 14px;">Your verification code:</p>
          <div style="background: #0ea5e9; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 15px; border-radius: 6px; display: inline-block; font-family: monospace;">
            ${otpCode}
          </div>
        </div>
        
        <p style="font-size: 14px; color: #64748b; margin: 20px 0;">
          This code will expire in <strong>10 minutes</strong> for your security.
        </p>
        
        ${isNewUser ? `
        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 16px;">What's Next?</h3>
          <ul style="color: #047857; margin: 0; padding-left: 20px;">
            <li>Verify your email with the code above</li>
            <li>Set up your pastoral profile</li>
            <li>Create your first event type</li>
            <li>Start receiving appointment bookings</li>
          </ul>
        </div>
        ` : ''}
        
        <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
          If you didn't request this code, please ignore this email. Your account remains secure.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; padding: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          © 2024 PastorAgenda. All rights reserved.<br>
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `

  await client.send({
    from: "PastorAgenda <noreply@pastoragenda.com>",
    to: to,
    subject: subject,
    content: emailContent,
    html: emailContent,
  })

  await client.close()
}

export async function sendWelcomeEmail({ to, userName }: SendWelcomeEmailParams): Promise<void> {
  const client = new SMTPClient(SMTP_CONFIG)
  
  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to PastorAgenda!</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to PastorAgenda!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
          Your pastoral scheduling platform is ready
        </p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1e293b; margin-top: 0;">Hello ${userName}!</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          Welcome to PastorAgenda! We're thrilled to have you join our community of pastors who are streamlining their appointment scheduling and connecting with their congregations more effectively.
        </p>
        
        <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #0ea5e9; margin-top: 0;">Get Started in 3 Easy Steps:</h3>
          <ol style="color: #374151; padding-left: 20px;">
            <li style="margin-bottom: 10px;"><strong>Complete Your Profile</strong> - Add your bio, photo, and contact information</li>
            <li style="margin-bottom: 10px;"><strong>Create Agendas</strong> - Set up different types of appointments (counseling, prayer, meetings, etc.)</li>
            <li style="margin-bottom: 10px;"><strong>Share Your Link</strong> - Give your congregation your unique booking link</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://pastoragenda.com/dashboard" 
             style="background: #0ea5e9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Go to Your Dashboard
          </a>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">💡 Pro Tips:</h3>
          <ul style="color: #b45309; margin: 0; padding-left: 20px;">
            <li>Set your availability to match your schedule</li>
            <li>Add custom questions to gather important information</li>
            <li>Use the mobile app for on-the-go management</li>
          </ul>
        </div>
        
        <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
          Need help getting started? Our support team is here to assist you every step of the way.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; padding: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          © 2024 PastorAgenda. All rights reserved.<br>
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `

  await client.send({
    from: "PastorAgenda <welcome@pastoragenda.com>",
    to: to,
    subject: "Welcome to PastorAgenda! 🎉",
    content: emailContent,
    html: emailContent,
  })

  await client.close()
}

export async function sendEventReminderEmail({ 
  to, 
  bookerName, 
  pastorName, 
  eventTitle, 
  date, 
  time, 
  duration, 
  pastorAlias 
}: SendEventReminderParams): Promise<void> {
  const client = new SMTPClient(SMTP_CONFIG)
  
  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Reminder</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Appointment Reminder</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
          Your appointment is coming up soon
        </p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1e293b; margin-top: 0;">Hello ${bookerName}!</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          This is a friendly reminder about your upcoming appointment with <strong>${pastorName}</strong>.
        </p>
        
        <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #0ea5e9; margin-top: 0;">Appointment Details</h3>
          <div style="display: grid; gap: 10px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="font-weight: bold; color: #64748b;">Event:</span>
              <span style="color: #1e293b;">${eventTitle}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="font-weight: bold; color: #64748b;">Date:</span>
              <span style="color: #1e293b;">${date}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
              <span style="font-weight: bold; color: #64748b;">Time:</span>
              <span style="color: #1e293b;">${time}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span style="font-weight: bold; color: #64748b;">Duration:</span>
              <span style="color: #1e293b;">${duration} minutes</span>
            </div>
          </div>
        </div>
        
        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 16px;">📅 Important Reminders:</h3>
          <ul style="color: #047857; margin: 0; padding-left: 20px;">
            <li>Please arrive on time for your appointment</li>
            <li>Bring any necessary documents or materials</li>
            <li>Contact ${pastorName} if you need to reschedule</li>
          </ul>
        </div>
        
        <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
          You can view ${pastorName}'s profile at: 
          <a href="https://pastoragenda.com/${pastorAlias}" style="color: #0ea5e9;">pastoragenda.com/${pastorAlias}</a>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; padding: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          © 2024 PastorAgenda. All rights reserved.<br>
          This is an automated reminder. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `

  await client.send({
    from: "PastorAgenda <reminders@pastoragenda.com>",
    to: to,
    subject: `Appointment Reminder: ${eventTitle} with ${pastorName}`,
    content: emailContent,
    html: emailContent,
  })

  await client.close()
}
