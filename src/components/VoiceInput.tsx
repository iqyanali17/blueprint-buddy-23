import React, { useState } from 'react';
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
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsProcessing(true);

          try {
            const { data, error } = await supabase.functions.invoke('speech-to-text', {
              body: { audio: base64Audio }
            });

            if (error) throw error;

            if (data.text) {
              onTranscript(data.text);
              toast({
                title: "Transcription complete",
                description: "Your speech has been converted to text",
              });
            }
          } catch (error) {
            console.error('Transcription error:', error);
            toast({
              title: "Transcription failed",
              description: "Could not convert speech to text",
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
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice input",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
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
