import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const EMAIL_API_KEY = Deno.env.get("RESEND_API_KEY") || Deno.env.get("EMAIL_API_KEY") || "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "MEDITALK <onboarding@resend.dev>";

function generateCode(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

async function sendEmail(to: string, code: string) {
  if (!EMAIL_API_KEY) {
    console.warn("EMAIL_API_KEY/RESEND_API_KEY missing; skipping email send in dev.");
    return { success: false, reason: "no_api_key" };
  }
  
  const subject = "Your MEDITALK verification code";
  const text = `Your verification code is ${code}. It expires in 5 minutes.`;
  const html = `<p>Your verification code is <b>${code}</b>. It expires in 5 minutes.</p>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${EMAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Email send failed:", res.status, body);
      return { success: false, reason: "send_failed", error: body };
    }
    
    return { success: true };
  } catch (error: unknown) {
    console.error("Email send error:", error);
    return { success: false, reason: "exception", error: error instanceof Error ? error.message : String(error) };
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { action, email, fullName, accountType, code } = await req.json();

    if (!action || !email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "send") {
      const otp = generateCode();
      
      // Try to send email
      const emailResult = await sendEmail(email, otp);
      
      return new Response(JSON.stringify({ 
        ok: true, 
        dev_code: !emailResult.success ? otp : undefined,
        email_sent: emailResult.success,
        email_error: emailResult.success ? undefined : emailResult.reason
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      if (!code) {
        return new Response(JSON.stringify({ error: "Missing verification code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // For simple version, just accept any 6-digit code
      if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        return new Response(JSON.stringify({ error: "Invalid verification code format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ 
        ok: true, 
        message: "Code verified successfully (simple mode)" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("signup-otp-simple error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
