/**
 * Speech-to-Text Edge Function
 * 
 * This Supabase Edge Function converts audio input to text using OpenAI's Whisper API.
 * 
 * Flow:
 * 1. Receives base64-encoded audio from frontend
 * 2. Processes audio in chunks to handle large files efficiently
 * 3. Converts to binary format and creates a blob
 * 4. Sends to OpenAI Whisper API for transcription
 * 5. Returns transcribed text to frontend
 * 
 * API Requirements:
 * - OPENAI_API_KEY must be set in Supabase secrets
 * 
 * Supported Audio Formats:
 * - audio/webm (default from browser MediaRecorder)
 * - audio/mp3, audio/mp4, audio/mpeg, audio/mpga, audio/m4a, audio/wav, audio/webm
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers to allow frontend access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Process Base64 Audio in Chunks
 * 
 * Large audio files can cause memory issues if processed all at once.
 * This function splits the base64 string into manageable chunks,
 * converts each to binary, then combines them into a single Uint8Array.
 * 
 * @param base64String - The base64-encoded audio data
 * @param chunkSize - Size of each chunk (default: 32KB)
 * @returns Uint8Array containing the complete binary audio data
 */
function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  // Process base64 string in chunks
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk); // Decode base64 to binary string
    const bytes = new Uint8Array(binaryChunk.length);
    
    // Convert binary string to byte array
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  // Combine all chunks into a single Uint8Array
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

/**
 * Main Request Handler
 * 
 * Handles incoming HTTP requests for speech-to-text conversion
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body to get base64 audio data
    const { audio } = await req.json();
    
    // Get OpenAI API key from environment secrets
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    // Validate API key is configured
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured in Supabase secrets');
      throw new Error('OPENAI_API_KEY not configured. Please add it in your backend settings.');
    }
    
    // Validate audio data is provided
    if (!audio) {
      throw new Error('No audio data provided. Please ensure audio is being captured correctly.');
    }

    console.log('🎙️ Processing audio for transcription...');
    console.log(`📊 Audio data length: ${audio.length} characters`);

    // Convert base64 audio to binary using chunk processing
    // This prevents memory issues with large audio files
    const binaryAudio = processBase64Chunks(audio);
    console.log(`📦 Binary audio size: ${binaryAudio.length} bytes`);
    
    // Prepare FormData for OpenAI Whisper API
    // Whisper API requires multipart/form-data with audio file
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1'); // OpenAI's Whisper model
    
    // Optional: Add language hint for better accuracy
    // formData.append('language', 'en'); // Uncomment to specify English
    
    // Optional: Add response format
    // formData.append('response_format', 'json'); // Default is json

    console.log('📤 Sending audio to OpenAI Whisper API...');

    // Send audio to OpenAI Whisper API for transcription
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    // Parse successful response
    const result = await response.json();
    console.log('✅ Transcription successful');
    console.log(`📝 Transcribed text: "${result.text}"`);

    // Return transcribed text to frontend
    return new Response(
      JSON.stringify({ 
        text: result.text,
        success: true 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    // Log detailed error information for debugging
    console.error('❌ Error in speech-to-text function:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return user-friendly error message
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false 
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
