import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Simple hash function for storing OTP codes
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, code, fullName, accountType, password } = await req.json();
    
    console.log(`OTP action: ${action} for email: ${email}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "send") {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      
      if (!resendApiKey) {
        console.error("RESEND_API_KEY not configured");
        return new Response(JSON.stringify({ error: "Email service not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const resend = new Resend(resendApiKey);
      const otp = generateCode();
      const codeHash = await hashCode(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      // Delete any existing OTP for this email
      await supabase.from("email_otps").delete().eq("email", email);

      // Store the new OTP
      const { error: insertError } = await supabase.from("email_otps").insert({
        email,
        code_hash: codeHash,
        expires_at: expiresAt,
        full_name: fullName || null,
        account_type: accountType || "patient",
      });

      if (insertError) {
        console.error("Failed to store OTP:", insertError);
        return new Response(JSON.stringify({ error: "Failed to generate verification code" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Send email via Resend
      const emailFrom = Deno.env.get("EMAIL_FROM") || "MEDITALK <onboarding@resend.dev>";
      
      try {
        const emailResponse = await resend.emails.send({
          from: emailFrom,
          to: [email],
          subject: "Your MEDITALK Verification Code",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #0ea5e9; text-align: center;">MEDITALK</h1>
              <h2 style="text-align: center;">Email Verification</h2>
              <p>Hello${fullName ? ` ${fullName}` : ''},</p>
              <p>Your verification code is:</p>
              <div style="background-color: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0369a1;">${otp}</span>
              </div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this code, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              <p style="color: #6b7280; font-size: 12px; text-align: center;">
                MEDITALK - Your AI-Powered Medical Support System
              </p>
            </div>
          `,
        });

        console.log("Resend API response:", JSON.stringify(emailResponse));

        // Check if Resend returned an error
        if (emailResponse.error) {
          console.error("Resend error:", emailResponse.error);
          // Clean up the stored OTP since email failed
          await supabase.from("email_otps").delete().eq("email", email);
          
          // Provide helpful error message
          let errorMessage = "Failed to send verification email";
          if (emailResponse.error.message?.includes("verify a domain")) {
            errorMessage = "Email service configuration issue. Please contact support or try again later.";
          }
          
          return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log("Email sent successfully to:", email);

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (emailError: any) {
        console.error("Failed to send email:", emailError);
        // Clean up the stored OTP since email failed
        await supabase.from("email_otps").delete().eq("email", email);
        return new Response(JSON.stringify({ error: emailError?.message || "Failed to send verification email" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "verify") {
      if (!code) {
        return new Response(JSON.stringify({ error: "Verification code is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const codeHash = await hashCode(code);

      // Get the stored OTP
      const { data: otpRecord, error: fetchError } = await supabase
        .from("email_otps")
        .select("*")
        .eq("email", email)
        .single();

      if (fetchError || !otpRecord) {
        console.log("OTP not found for email:", email);
        return new Response(JSON.stringify({ error: "Invalid or expired code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if expired
      if (new Date(otpRecord.expires_at) < new Date()) {
        console.log("OTP expired for email:", email);
        await supabase.from("email_otps").delete().eq("email", email);
        return new Response(JSON.stringify({ error: "Verification code has expired" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify the code
      if (otpRecord.code_hash !== codeHash) {
        console.log("Invalid OTP code for email:", email);
        return new Response(JSON.stringify({ error: "Invalid verification code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Code is valid - now create the user account
      if (!password) {
        return new Response(JSON.stringify({ error: "Password is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create user with admin API
      const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: otpRecord.full_name,
          account_type: otpRecord.account_type,
        },
      });

      if (signUpError) {
        console.error("Failed to create user:", signUpError);
        // Provide user-friendly error message
        let errorMessage = signUpError.message;
        if (signUpError.message?.includes("already been registered") || (signUpError as any).code === "email_exists") {
          errorMessage = "An account with this email already exists. Please sign in instead.";
        }
        return new Response(JSON.stringify({ error: errorMessage }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete the OTP record
      await supabase.from("email_otps").delete().eq("email", email);

      console.log("User created successfully:", email);

      // Return success - user should now sign in
      return new Response(JSON.stringify({ 
        ok: true,
        message: "Account created successfully. Please sign in.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in signup-otp function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
