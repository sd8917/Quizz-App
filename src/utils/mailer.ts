import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendChannelInviteEmail(to: string, channelName: string) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `You have been added to channel: ${channelName}`,
    text: `You have been added as a member to the channel "${channelName}". Log in to participate!`,
  };
  await transporter.sendMail(mailOptions);
}
