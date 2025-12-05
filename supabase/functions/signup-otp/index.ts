import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import SHA256 from "https://esm.sh/crypto-js@4.2.0/sha256.js";
import Hex from "https://esm.sh/crypto-js@4.2.0/enc-hex.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EMAIL_API_KEY = Deno.env.get("RESEND_API_KEY") || Deno.env.get("EMAIL_API_KEY") || "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "MEDITALK <onboarding@resend.dev>";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function toSHA256Hex(input: string): string {
  return SHA256(input).toString(Hex);
}

function generateCode(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

async function sendEmail(to: string, code: string) {
  if (!EMAIL_API_KEY) {
    console.warn("EMAIL_API_KEY/RESEND_API_KEY missing; skipping email send in dev.");
    return;
  }
  const subject = "Your MEDITALK verification code";
  const text = `Your verification code is ${code}. It expires in 5 minutes.`;
  const html = `<p>Your verification code is <b>${code}</b>. It expires in 5 minutes.</p>`;

  // Resend API (preferred)
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
    throw new Error("Failed to send verification email");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { action, email, fullName, password, accountType, code } = await req.json();

    if (!action || !email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "send") {
      // Reject if account already exists (signup-only flow)
      const { data: existingProfile, error: profileCheckErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .limit(1);
      if (profileCheckErr) throw profileCheckErr;
      if (existingProfile && existingProfile.length > 0) {
        return new Response(
          JSON.stringify({ error: "Account already exists. Please log in instead." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const otp = generateCode();
      const hash = toSHA256Hex(`${email}:${otp}`);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      // Upsert OTP record
      const { error: upsertErr } = await supabase
        .from("email_otps")
        .upsert(
          { email, code_hash: hash, expires_at: expiresAt, full_name: fullName ?? null, account_type: accountType ?? null },
          { onConflict: "email" },
        );
      if (upsertErr) throw upsertErr;

      // Send email
      await sendEmail(email, otp);

      return new Response(JSON.stringify({ ok: true, dev_code: !EMAIL_API_KEY ? otp : undefined }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      if (!code || !password || !fullName || !accountType) {
        return new Response(JSON.stringify({ error: "Missing code, password, fullName, or accountType" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Reject if account already exists (signup-only flow)
      const { data: existingProfile2, error: profileCheckErr2 } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .limit(1);
      if (profileCheckErr2) throw profileCheckErr2;
      if (existingProfile2 && existingProfile2.length > 0) {
        return new Response(
          JSON.stringify({ error: "Account already exists. Please log in instead." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { data: recs, error: selErr } = await supabase
        .from("email_otps")
        .select("code_hash, expires_at")
        .eq("email", email)
        .limit(1);
      if (selErr) throw selErr;
      if (!recs || recs.length === 0) {
        return new Response(JSON.stringify({ error: "Verification code not found. Please request a new one." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const record = recs[0];
      const now = Date.now();
      const exp = Date.parse(record.expires_at);
      if (isNaN(exp) || now > exp) {
        // Clean up expired
        await supabase.from("email_otps").delete().eq("email", email);
        return new Response(JSON.stringify({ error: "Code expired. Please request a new one." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const candidateHash = toSHA256Hex(`${email}:${code}`);
      if (candidateHash !== record.code_hash) {
        return new Response(JSON.stringify({ error: "Invalid verification code." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Enforce single admin account
      if (accountType === "admin") {
        const { data: admins, error: adminErr } = await supabase
          .from("user_roles")
          .select("id")
          .eq("role", "admin")
          .limit(1);
        if (adminErr) throw adminErr;
        if (admins && admins.length > 0) {
          return new Response(JSON.stringify({ error: "An Admin account already exists. Only one Admin is allowed." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Create user with email confirmed
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, account_type: accountType },
      });
      if (createErr) {
        return new Response(JSON.stringify({ error: createErr.message || "Failed to create user" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = created?.user?.id;
      if (userId) {
        // Ensure profile exists with provided metadata (trigger also handles this, but explicit insert keeps requirement)
        const { error: profileErr } = await supabase
          .from("profiles")
          .insert({ id: userId, email, full_name: fullName });
        if (profileErr) {
          // If duplicate due to trigger, ignore unique violations
          const msg = profileErr.message || "";
          if (!/duplicate key|unique constraint/i.test(msg)) {
            console.warn("Profile insert failed:", msg);
          }
        }

        // Assign role
        const role = accountType === "admin" ? "admin" : "user";
        const { error: roleErr } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (roleErr) console.warn("Failed to assign role:", roleErr.message);
      }

      // Clean up OTP
      await supabase.from("email_otps").delete().eq("email", email);

      // Auto-login: create a session for the user and return it to the client
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        console.warn("Auto-login failed:", signInErr.message);
      }

      return new Response(
        JSON.stringify({ ok: true, session: signInData?.session ?? null, user: signInData?.user ?? created?.user ?? null }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (action === "direct_signup") {
      if (!password || !fullName || !accountType) {
        return new Response(JSON.stringify({ error: "Missing password, fullName, or accountType" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Reject if account already exists
      const { data: existingProfile3, error: profileCheckErr3 } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .limit(1);
      if (profileCheckErr3) throw profileCheckErr3;
      if (existingProfile3 && existingProfile3.length > 0) {
        return new Response(
          JSON.stringify({ error: "Account already exists. Please log in instead." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Enforce single admin account
      if (accountType === "admin") {
        const { data: admins2, error: adminErr2 } = await supabase
          .from("user_roles")
          .select("id")
          .eq("role", "admin")
          .limit(1);
        if (adminErr2) throw adminErr2;
        if (admins2 && admins2.length > 0) {
          return new Response(JSON.stringify({ error: "An Admin account already exists. Only one Admin is allowed." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Create user directly with email confirmed
      const { data: created2, error: createErr2 } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, account_type: accountType },
      });
      if (createErr2) {
        return new Response(JSON.stringify({ error: createErr2.message || "Failed to create user" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId2 = created2?.user?.id;
      if (userId2) {
        const { error: profileErr2 } = await supabase
          .from("profiles")
          .insert({ id: userId2, email, full_name: fullName });
        if (profileErr2) {
          const msg2 = profileErr2.message || "";
          if (!/duplicate key|unique constraint/i.test(msg2)) {
            console.warn("Profile insert failed:", msg2);
          }
        }

        const role2 = accountType === "admin" ? "admin" : "user";
        const { error: roleErr2 } = await supabase.from("user_roles").insert({ user_id: userId2, role: role2 });
        if (roleErr2) console.warn("Failed to assign role:", roleErr2.message);
      }

      // Create a session (optional best-effort)
      const { data: signInData2, error: signInErr2 } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr2) {
        console.warn("Auto-login failed:", signInErr2.message);
      }

      return new Response(
        JSON.stringify({ ok: true, session: signInData2?.session ?? null, user: signInData2?.user ?? created2?.user ?? null }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("signup-otp error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
