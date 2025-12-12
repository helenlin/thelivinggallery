import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, content } = req.body;

  // Validate inputs
  if (!name || !email || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Create transporter using Gmail
    // Note: You'll need to set up environment variables
    // GMAIL_USER and GMAIL_PASS in Vercel
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Send email
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: 'thelivinggallery@gmail.com',
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${content.replace(/\n/g, '<br>')}</p>
      `,
      replyTo: email,
    });

    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
