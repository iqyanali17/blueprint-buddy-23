import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Cleanup function to properly release all resources
  const cleanup = useCallback(() => {
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.log('Recognition cleanup:', e);
      }
      recognitionRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.log('MediaRecorder cleanup:', e);
      }
    }
    mediaRecorderRef.current = null;

    // Stop all media stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    setIsRecording(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startRecording = async () => {
    // Always cleanup first to ensure fresh state
    cleanup();

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        // Use Web Speech API (browser-based, no API calls needed)
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast({
            title: "Voice not supported",
            description: "Your browser does not support microphone access. Please try Chrome or Edge.",
            variant: "destructive",
          });
          return;
        }

        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const recognition = new SpeechRecognition();
        recognition.lang = navigator.language || 'en-US';
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        let finalTranscript = '';

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interim += transcript;
            }
          }
          
          if (finalTranscript.trim()) {
            onTranscript(finalTranscript.trim());
            toast({
              title: "Voice captured",
              description: "Your speech has been converted to text",
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          
          // Don't show error for 'no-speech' or 'aborted' as these are expected
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            toast({
              title: "Voice input error",
              description: `Error: ${event.error}. Please try again.`,
              variant: "destructive",
            });
          }
          
          cleanup();
        };

        recognition.onend = () => {
          console.log('Speech recognition ended');
          cleanup();
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);

        toast({
          title: "🎙️ Listening...",
          description: "Speak now. Click the mic button again to stop.",
        });

      } else {
        // Fallback to MediaRecorder + Edge Function for browsers without Web Speech API
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast({
            title: "Voice not supported",
            description: "Your browser does not support microphone access. Please try Chrome or Edge.",
            variant: "destructive",
          });
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        let mimeType = 'audio/webm';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          }
        }

        const recorder = new MediaRecorder(stream, { mimeType });
        const audioChunks: Blob[] = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        recorder.onerror = (ev) => {
          console.error('MediaRecorder error:', ev);
          toast({
            title: "Recording error",
            description: "Microphone recording failed. Please try again.",
            variant: "destructive",
          });
          cleanup();
        };

        recorder.onstop = async () => {
          setIsProcessing(true);

          try {
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            const reader = new FileReader();

            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onloadend = () => {
                const base64Audio = (reader.result as string).split(',')[1];
                resolve(base64Audio);
              };
              reader.onerror = reject;
              reader.readAsDataURL(audioBlob);
            });

            const base64Audio = await base64Promise;

            const { data, error } = await supabase.functions.invoke('speech-to-text', {
              body: { audio: base64Audio, mimeType, locale: navigator.language }
            });

            if (error) throw error;

            if (data?.text) {
              onTranscript(data.text);
              toast({
                title: "Transcription complete",
                description: "Your speech has been converted to text",
              });
            } else {
              toast({
                title: "No speech detected",
                description: "Please try again and speak clearly into the microphone.",
              });
            }
          } catch (error) {
            console.error('Transcription error:', error);
            toast({
              title: "Transcription failed",
              description: error instanceof Error ? error.message : "Could not convert speech to text",
              variant: "destructive",
            });
          } finally {
            setIsProcessing(false);
            cleanup();
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);

        toast({
          title: "🎙️ Recording...",
          description: "Speak now. Click the mic button again to stop.",
        });
      }
    } catch (error: any) {
      console.error('Error starting recording:', error);
      cleanup();

      let description = "Please allow microphone access to use voice input";
      const name = error?.name;
      
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        description = "Microphone permission was denied. Please enable it in your browser settings.";
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        description = "No microphone found on this device.";
      }

      toast({
        title: "Microphone access issue",
        description,
        variant: "destructive",
      });
    }
  };

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Stop recognition:', e);
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      cleanup();
    }
  }, [cleanup]);

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleClick}
      disabled={isProcessing}
      className="relative"
      title={isRecording ? "Stop recording" : "Start voice input"}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <>
          <MicOff className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
        </>
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
};
