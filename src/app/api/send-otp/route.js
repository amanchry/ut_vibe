import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();
    
    // Generate 6-digit OTP
    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'waterinfo.app@gmail.com',
        pass: 'pqwg xkhp eetz wjgd',
      },
    });
    
    // Send email
    await transporter.sendMail({
      from: 'UT Vibe <waterinfo.app@gmail.com>',
      to: email,
      subject: 'Your UT Vibe Verification Code 🎓',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
            <tr>
              <td align="center">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                        UT Vibe 🎉
                      </h1>
                      <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                        Campus moments, real-time
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                        Verify your email
                      </h2>
                      <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                        Hey there! 👋<br>
                        We just need to make sure this is really you. Enter the code below to complete your signup:
                      </p>
                      
                      <!-- OTP Code Box -->
                      <div style="background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0;">
                        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                          Your Verification Code
                        </p>
                        <div style="display: inline-block; background-color: #ffffff; border-radius: 8px; padding: 16px 32px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                          <h1 style="margin: 0; color: #2563EB; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                            ${otp}
                          </h1>
                        </div>
                      </div>
                      
                      <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 14px; line-height: 1.5;">
                        ⏰ This code expires in <strong style="color: #6b7280;">10 minutes</strong><br>
                        🔒 Don't share this code with anyone
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                        Didn't request this code? You can safely ignore this email.
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        © ${new Date().getFullYear()} UT Vibe. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    
    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
