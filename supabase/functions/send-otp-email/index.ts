import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(100000 + (array[0] % 900000));
}

function getOtpEmailHTML(code: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:Tahoma,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f4f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="420" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;">🔐 گپ‌تل</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">سیستم احراز هویت</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.8;">سلام! 👋</p>
              <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.8;">
                کد ورود شما به گپ‌تل:
              </p>
              <!-- OTP Code -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:16px 0;">
                    <div style="background:linear-gradient(135deg,#eef2ff,#e0e7ff);border:2px solid #c7d2fe;border-radius:12px;padding:20px 40px;display:inline-block;">
                      <span style="font-size:36px;font-weight:bold;color:#4338ca;letter-spacing:12px;font-family:monospace;">${code}</span>
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 8px;color:#6b7280;font-size:14px;line-height:1.8;text-align:center;">
                ⏱️ این کد تا <strong>۱۰ دقیقه</strong> معتبر است.
              </p>
              <p style="margin:0 0 0;color:#9ca3af;font-size:13px;line-height:1.8;text-align:center;">
                اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                با احترام، تیم گپ‌تل 💜
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, code } = await req.json();

    if (!email || !action) {
      return new Response(
        JSON.stringify({ error: "ایمیل و عملیات الزامی است" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === SEND OTP ===
    if (action === "send") {
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Invalidate previous unused codes for this email
      await supabaseAdmin
        .from("otp_codes")
        .update({ used: true })
        .eq("email", email)
        .eq("used", false);

      // Store new OTP
      const { error: insertError } = await supabaseAdmin
        .from("otp_codes")
        .insert({
          email,
          code: otp,
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) {
        console.error("Error storing OTP:", insertError);
        return new Response(
          JSON.stringify({ error: "خطا در ذخیره کد" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send email via Resend
      const { error: emailError } = await resend.emails.send({
        from: "GapTel <onboarding@resend.dev>",
        to: [email],
        subject: "کد ورود گپ‌تل",
        html: getOtpEmailHTML(otp),
      });

      if (emailError) {
        console.error("Error sending email:", emailError);
        return new Response(
          JSON.stringify({ error: "خطا در ارسال ایمیل" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "کد ارسال شد" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === VERIFY OTP ===
    if (action === "verify") {
      if (!code) {
        return new Response(
          JSON.stringify({ error: "کد الزامی است" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find valid OTP
      const { data: otpData, error: otpError } = await supabaseAdmin
        .from("otp_codes")
        .select("*")
        .eq("email", email)
        .eq("code", code)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (otpError || !otpData) {
        return new Response(
          JSON.stringify({ error: "کد نادرست یا منقضی شده است" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark OTP as used
      await supabaseAdmin
        .from("otp_codes")
        .update({ used: true })
        .eq("id", otpData.id);

      // Check if user exists, create if not
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find((u) => u.email === email);

      if (!existingUser) {
        // Create user with confirmed email
        const { error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
        });
        if (createError) {
          console.error("Error creating user:", createError);
          return new Response(
            JSON.stringify({ error: "خطا در ایجاد حساب کاربری" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Generate magic link for session
      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email,
        });

      if (linkError) {
        console.error("Error generating link:", linkError);
        return new Response(
          JSON.stringify({ error: "خطا در ایجاد نشست" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          token_hash: linkData.properties.hashed_token,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "عملیات نامعتبر" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "خطای سرور" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
