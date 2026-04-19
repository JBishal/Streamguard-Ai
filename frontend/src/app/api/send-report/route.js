import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

function isValidEmail(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req) {
  try {
    const { to, filename, fileBase64 } = await req.json();

    if (!isValidEmail(to || "")) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }
    if (!filename || !fileBase64) {
      return NextResponse.json({ error: "Missing report attachment payload." }, { status: 400 });
    }
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
      return NextResponse.json(
        { error: "Email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM." },
        { status: 500 },
      );
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject: "StreamGuard AI Report",
      text: "Attached is your generated StreamGuard AI report.",
      attachments: [
        {
          filename,
          content: Buffer.from(fileBase64, "base64"),
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Unable to send report email." },
      { status: 500 },
    );
  }
}
