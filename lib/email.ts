import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM ?? "VendorBridge <no-reply@vendorbridge.com>";

export async function sendCredentialsEmail(
  to: string,
  name: string,
  password: string
) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Your VendorBridge Vendor Account",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#2563EB">Welcome to VendorBridge</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your vendor account has been created. Use the credentials below to log in:</p>
        <div style="background:#F1F5F9;padding:16px;border-radius:8px;margin:16px 0">
          <p style="margin:0"><strong>Email:</strong> ${to}</p>
          <p style="margin:8px 0 0"><strong>Password:</strong> ${password}</p>
        </div>
        <p>You can Login here.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login"
           style="display:inline-block;background:#2563EB;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
          Log In
        </a>
      </div>
    `,
  });
}

export async function sendOrgUserCredentialsEmail(
  to: string,
  name: string,
  password: string
) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Your VendorBridge Account Created",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#2563EB">Welcome to VendorBridge</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your organization user account has been created. Use the credentials below to log in:</p>
        <div style="background:#F1F5F9;padding:16px;border-radius:8px;margin:16px 0">
          <p style="margin:0"><strong>Email:</strong> ${to}</p>
          <p style="margin:8px 0 0"><strong>Password:</strong> ${password}</p>
        </div>
        <p>You can Login here.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login"
           style="display:inline-block;background:#2563EB;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
          Log In
        </a>
      </div>
    `,
  });
}

export async function sendForgotPasswordEmail(
  to: string,
  name: string,
  newPassword: string
) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Your VendorBridge Password Has Been Reset",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#2563EB">Password Reset</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your password has been reset. Use the temporary password below:</p>
        <div style="background:#F1F5F9;padding:16px;border-radius:8px;margin:16px 0">
          <p style="margin:0"><strong>New Password:</strong> ${newPassword}</p>
        </div>
        <p>You can Login here.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login"
           style="display:inline-block;background:#2563EB;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
          Log In
        </a>
      </div>
    `,
  });
}
