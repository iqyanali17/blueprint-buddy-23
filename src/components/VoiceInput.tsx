import React, { useRef, useState } from 'react';
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
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast({
            title: "Voice not supported",
            description: "Your browser does not support microphone access. Please try Chrome or Edge.",
            variant: "destructive",
          });
          return;
        }
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const recognition = new SpeechRecognition();
        recognition.lang = navigator.language || 'en-US';
        recognition.interimResults = true;
        recognition.continuous = false;

        let finalTranscript = '';

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) finalTranscript += t;
            else interim += t;
          }
          if (finalTranscript.trim()) {
            onTranscript(finalTranscript.trim());
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Voice error:", event.error);
          alert("Voice input failed: " + event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
          recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
      } else {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast({
            title: "Voice not supported",
            description: "Your browser does not support microphone access. Please try Chrome or Edge.",
            variant: "destructive",
          });
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        let mimeType = '';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
          else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
          else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        }
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        const audioChunks: Blob[] = [];

        recorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        recorder.onerror = (ev) => {
          console.error('MediaRecorder error:', ev);
          toast({
            title: "Recording error",
            description: "Microphone recording failed. Please try again.",
            variant: "destructive",
          });
        };

        recorder.onstop = async () => {
          const finalType = mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunks, { type: finalType });
          const reader = new FileReader();
          
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            setIsProcessing(true);

            try {
              const { data, error } = await supabase.functions.invoke('speech-to-text', {
                body: { audio: base64Audio, mimeType: finalType, locale: navigator.language }
              });

              if (error) throw error;

              if (data.text) {
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
            }
          };

          reader.readAsDataURL(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        stopTimerRef.current = window.setTimeout(() => {
          try { recorder.state !== 'inactive' && recorder.stop(); } catch {}
        }, 60000);
      }
    } catch (error: any) {
      console.error('Error starting recording:', error);
      const name = error?.name;
      let description = "Please allow microphone access to use voice input";
      if (name === 'NotAllowedError' || name === 'SecurityError') description = "Microphone permission was denied";
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') description = "No microphone found on this device";
      toast({
        title: "Microphone access issue",
        description,
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsRecording(false);
      recognitionRef.current = null;
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
      className="relative"
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
