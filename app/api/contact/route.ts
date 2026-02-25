import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: "AlohaShift Contact <onboarding@resend.dev>",
      to: "arensawa@gmail.com",
      subject: `[AlohaShift] ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: #1e293b;">New message from AlohaShift</h2>
          <table style="width:100%; border-collapse: collapse; margin-bottom: 16px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 13px; width: 80px;">Name</td>
              <td style="padding: 6px 0; color: #1e293b; font-size: 13px;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Email</td>
              <td style="padding: 6px 0; font-size: 13px;"><a href="mailto:${email}" style="color:#3b82f6;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Subject</td>
              <td style="padding: 6px 0; color: #1e293b; font-size: 13px;">${subject}</td>
            </tr>
          </table>
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; font-size: 14px; color: #334155; white-space: pre-wrap;">${message}</div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
