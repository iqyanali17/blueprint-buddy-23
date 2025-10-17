import React, { useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

/**
 * VoiceInput Component
 * 
 * This component provides voice-to-text functionality for the chat interface.
 * It uses the browser's MediaRecorder API to capture audio and OpenAI's Whisper API
 * to transcribe speech to text.
 * 
 * Features:
 * - Real-time audio recording with visual feedback
 * - Automatic transcription using OpenAI Whisper API
 * - Error handling and user notifications
 * - Loading states and disabled states during processing
 */
export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript }) => {
  // State management for recording and processing status
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const { toast } = useToast();

  /**
   * Start Recording Function
   * 
   * 1. Request microphone access from the browser
   * 2. Create MediaRecorder instance to capture audio
   * 3. Store audio chunks as they're recorded
   * 4. When recording stops, convert to base64 and send to backend
   */
  const startRecording = async () => {
    try {
      // Request microphone permission and get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      // Create MediaRecorder with webm format (widely supported)
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      const audioChunks: Blob[] = [];

      // Collect audio data as it's recorded
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      // Handle recording completion
      recorder.onstop = async () => {
        // Combine all audio chunks into a single blob
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        
        // Convert blob to base64 for API transmission
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsProcessing(true);

          try {
            // Call the speech-to-text edge function
            // This function sends audio to OpenAI Whisper API for transcription
            const { data, error } = await supabase.functions.invoke('speech-to-text', {
              body: { audio: base64Audio }
            });

            if (error) {
              console.error('Edge function error:', error);
              throw error;
            }

            // If transcription successful, pass text to parent component
            if (data?.text) {
              onTranscript(data.text);
              toast({
                title: "🎤 Transcription Complete",
                description: "Your voice has been converted to text successfully!",
              });
            } else {
              throw new Error('No transcription returned');
            }
          } catch (error) {
            console.error('Transcription error:', error);
            toast({
              title: "❌ Transcription Failed",
              description: error instanceof Error ? error.message : "Could not convert speech to text. Please try again.",
              variant: "destructive",
            });
          } finally {
            setIsProcessing(false);
          }
        };

        // Start reading the audio blob
        reader.readAsDataURL(audioBlob);
        
        // Clean up: stop all audio tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      // Show recording started notification
      toast({
        title: "🎙️ Recording Started",
        description: "Speak clearly into your microphone...",
      });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      
      // Handle permission denied or other errors
      toast({
        title: "🚫 Microphone Access Denied",
        description: "Please allow microphone access in your browser settings to use voice input.",
        variant: "destructive",
      });
    }
  };

  /**
   * Stop Recording Function
   * 
   * Stops the active MediaRecorder, which triggers the processing pipeline
   */
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      
      toast({
        title: "⏹️ Recording Stopped",
        description: "Processing your audio...",
      });
    }
  };

  return (
    <div className="relative">
      {/* Main voice input button */}
      <Button
        variant="outline"
        size="icon"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className="relative transition-all duration-200 hover:scale-105"
        title={isRecording ? "Stop Recording" : isProcessing ? "Processing..." : "Start Voice Input"}
      >
        {/* Show different icons based on state */}
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : isRecording ? (
          <>
            <MicOff className="h-4 w-4 text-destructive" />
            {/* Pulsing red indicator when recording */}
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
          </>
        ) : (
          <Mic className="h-4 w-4 text-medical" />
        )}
      </Button>
      
      {/* "Listening..." indicator badge */}
      {isRecording && (
        <Badge 
          variant="destructive" 
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap animate-pulse"
        >
          🎙️ Listening...
        </Badge>
      )}
      
      {/* "Processing..." indicator badge */}
      {isProcessing && (
        <Badge 
          variant="secondary" 
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
        >
          ⚙️ Processing...
        </Badge>
      )}
    </div>
  );
};
