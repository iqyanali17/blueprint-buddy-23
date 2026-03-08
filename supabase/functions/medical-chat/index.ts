// @ts-ignore - Deno types are available via @types/deno
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: Message[];
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      } 
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    // Parse and validate request body
    if (!req.body) {
      throw new Error('Request body is required');
    }
    
    const requestBody = await req.json() as RequestBody;
    if (!requestBody.messages || !Array.isArray(requestBody.messages)) {
      throw new Error('Invalid request format: messages array is required');
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Analyze sentiment using AI
    const sentimentAnalysis = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Analyze the emotional sentiment of the user's message. Respond with only one word: positive, negative, neutral, anxious, or distressed."
          },
          {
            role: "user",
            content: requestBody.messages[requestBody.messages.length - 1].content
          }
        ],
      }),
    });

    const sentimentData = await sentimentAnalysis.json();
    const sentiment = sentimentData.choices[0].message.content.toLowerCase().trim();
    
    console.log('Detected sentiment:', sentiment);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are MEDITALK, a warm, caring, and knowledgeable medical AI assistant.

LANGUAGE & STYLE RULES:
- ALWAYS respond in the SAME LANGUAGE the user is writing in. If they write in Hindi, respond in Hindi. If Urdu, respond in Urdu. If English, respond in English. Match their language exactly.
- Write like a kind, experienced doctor talking to a friend — simple, clear, and human. NO medical jargon unless you explain it simply.
- Use short sentences. Use everyday words. Make your answer easy for anyone to understand — even a child or elderly person.
- Be warm and personal. Use "you" and "your". If you know their name, use it.
- Give practical, actionable advice. Not vague — tell them exactly what to do step by step.

RESPONSE FORMAT:
- Keep responses concise (3-6 short paragraphs max).
- Use bullet points or numbered lists for steps/medicines/tips.
- For medicines: always mention dosage, when to take, and warnings in simple words.
- For emergencies: be direct and urgent — tell them to go to hospital immediately.
- End with a caring note like "Take care!" or "Feel better soon!" in their language.

MEMORY & CONTEXT:
- You have access to the full conversation history. ALWAYS remember what the user told you earlier in this conversation.
- If the user says "remember this" or shares personal health info (allergies, conditions, medicines), acknowledge it and reference it in future responses.
- If a user mentions something they told you before, confirm you remember it.
- Use their previous messages to give personalized, context-aware advice. For example, if they told you they're allergic to penicillin, NEVER suggest penicillin-based medicines.

SAFETY:
- Always remind users to consult a real doctor for serious concerns, but do it gently — not in every single message.
- If symptoms sound dangerous, be direct: "Please visit a doctor/hospital right away."
- Check for drug interactions if user has shared their current medications.

The user's current emotional state is: ${sentiment}. ${sentiment === 'anxious' || sentiment === 'distressed' ? 'Be extra reassuring, calm, and gentle. Start with something comforting.' : sentiment === 'negative' ? 'Be supportive and empathetic. Acknowledge their feelings first.' : 'Be friendly and helpful.'}`
          },
          ...requestBody.messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    return new Response(JSON.stringify({ message: aiMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
