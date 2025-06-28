import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json()

    // Create transporter using Gmail SMTP
    // Note: You'll need to set up App Password in Gmail for this to work
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || 'help.pinpacks@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD, // This should be an App Password from Gmail
      },
    })

    // Email options
    const mailOptions = {
      from: process.env.GMAIL_USER || 'help.pinpacks@gmail.com',
      to: to,
      subject: subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #f56565; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; line-height: 1.6;">${message}</pre>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This email was automatically generated from the PinPacks contact form.
          </p>
        </div>
      `,
    }

    // Send email
    await transporter.sendMail(mailOptions)

    return NextResponse.json({ success: true, message: 'Email sent successfully' })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    )
  }
} 