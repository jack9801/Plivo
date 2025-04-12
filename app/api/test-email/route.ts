import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function GET() {
  // Get environment details for diagnostics
  const env = process.env.NODE_ENV || 'development';
  const timestamp = new Date().toISOString();
  
  // Log all environment variables related to email
  console.log('Email Environment Variables:', {
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_SECURE: process.env.EMAIL_SECURE,
    EMAIL_USER: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 4)}...` : undefined,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET',
    EMAIL_FROM: process.env.EMAIL_FROM,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  
  try {
    const emailResult = await sendEmail({
      to: 'mailtrap-test@example.com',
      subject: `Status Page Test Email - ${env} - ${timestamp.substring(0, 19)}`,
      text: `This is a test email from the Status Page application.
      
Environment: ${env}
Timestamp: ${timestamp}
Server: ${process.env.HOSTNAME || 'Unknown'}
SMTP Host: ${process.env.EMAIL_HOST || 'Not configured'}
SMTP Port: ${process.env.EMAIL_PORT || 'Not configured'}
SMTP User: ${process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 4)}...` : 'Not configured'}
From Address: ${process.env.EMAIL_FROM || 'Not configured'}

If you're seeing this email, your email configuration is working correctly!
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Status Page Test Email</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #333;">This is a test email from the Status Page application.</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h2 style="color: #4b5563; margin-top: 0;">Diagnostic Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Environment</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${env}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Timestamp</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${timestamp}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Server</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${process.env.HOSTNAME || 'Unknown'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">SMTP Host</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${process.env.EMAIL_HOST || 'Not configured'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">SMTP Port</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${process.env.EMAIL_PORT || 'Not configured'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">SMTP User</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 4)}...` : 'Not configured'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">From Address</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${process.env.EMAIL_FROM || 'Not configured'}</td>
              </tr>
            </table>
          </div>
          
          <p style="font-size: 16px; line-height: 1.5; color: #333; margin-top: 20px;">If you're seeing this email, your email configuration is working correctly!</p>
        </div>
      `,
    });

    console.log('Test email result:', {
      success: emailResult.success,
      messageId: emailResult.messageId,
      response: emailResult.response,
      to: 'mailtrap-test@example.com',
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 4)}...` : undefined,
      timestamp: new Date().toISOString()
    });

    if (!emailResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to send test email',
        error: emailResult.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Test email triggered, check server logs and Mailtrap inbox',
      result: emailResult
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 