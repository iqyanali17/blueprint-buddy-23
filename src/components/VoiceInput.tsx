import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

/**
 * VoiceInput Component - Free Browser-Based Speech Recognition
 * 
 * This component uses the Web Speech API (browser's built-in speech recognition)
 * instead of external APIs, making it completely free with no API keys needed.
 * 
 * Supported Browsers:
 * - Chrome/Chromium (full support)
 * - Edge (full support)
 * - Safari (full support)
 * - Firefox (limited support)
 * 
 * Features:
 * - Real-time speech recognition
 * - No API costs or rate limits
 * - Instant transcription
 * - Multiple language support
 * - Visual feedback during recording
 */
export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  /**
   * Initialize Speech Recognition on Component Mount
   * 
   * Creates a SpeechRecognition instance with optimal settings:
   * - continuous: false (stops after user finishes speaking)
   * - interimResults: true (shows text as user speaks)
   * - lang: 'en-US' (can be changed for other languages)
   */
  useEffect(() => {
    // Check if browser supports Speech Recognition API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    // Create and configure Speech Recognition instance
    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after user stops speaking
    recognition.interimResults = true; // Show results while speaking
    recognition.lang = 'en-US'; // Default language (can be changed)
    recognition.maxAlternatives = 1; // Number of alternative transcriptions

    /**
     * Handle Recognition Results
     * 
     * Fired when speech is detected and transcribed.
     * Provides both interim (partial) and final results.
     */
    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      const isFinal = event.results[last].isFinal;

      console.log('🎤 Speech detected:', { transcript, isFinal });

      // If final result, send to parent component
      if (isFinal) {
        setIsProcessing(true);
        
        // Small delay to show processing state
        setTimeout(() => {
          onTranscript(transcript);
          setIsProcessing(false);
          setIsListening(false);
          
          toast({
            title: "✅ Speech Recognized",
            description: `"${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`,
          });
        }, 300);
      }
    };

    /**
     * Handle Speech Recognition Start
     * 
     * Called when the service has begun listening
     */
    recognition.onstart = () => {
      console.log('🎙️ Speech recognition started');
      setIsListening(true);
      setIsProcessing(false);
    };

    /**
     * Handle Speech Recognition End
     * 
     * Called when the service has stopped listening
     */
    recognition.onend = () => {
      console.log('⏹️ Speech recognition ended');
      setIsListening(false);
      setIsProcessing(false);
    };

    /**
     * Handle Recognition Errors
     * 
     * Common errors:
     * - no-speech: User didn't speak
     * - audio-capture: Microphone not available
     * - not-allowed: Permission denied
     * - network: Network issues (shouldn't happen with browser API)
     */
    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error);
      setIsListening(false);
      setIsProcessing(false);

      let errorMessage = 'Could not recognize speech. Please try again.';
      let errorTitle = '❌ Recognition Failed';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please speak clearly into your microphone.';
          errorTitle = '🔇 No Speech Detected';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not found. Please check your device settings.';
          errorTitle = '🎤 Microphone Not Found';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
          errorTitle = '🚫 Permission Denied';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your connection.';
          errorTitle = '🌐 Network Error';
          break;
        case 'aborted':
          // User manually stopped - don't show error
          return;
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    };

    recognitionRef.current = recognition;

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript, toast]);

  /**
   * Start Listening Function
   * 
   * Initiates speech recognition and provides user feedback
   */
  const startListening = () => {
    // Check if Speech Recognition is supported
    if (!recognitionRef.current) {
      toast({
        title: "⚠️ Not Supported",
        description: "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    try {
      recognitionRef.current.start();
      
      toast({
        title: "🎙️ Listening...",
        description: "Speak clearly into your microphone. I'll transcribe your speech automatically.",
      });
    } catch (error) {
      console.error('Error starting recognition:', error);
      
      // If already running, stop and restart
      if (error instanceof Error && error.message.includes('already started')) {
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current.start();
        }, 100);
      }
    }
  };

  /**
   * Stop Listening Function
   * 
   * Manually stops speech recognition
   */
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      
      toast({
        title: "⏹️ Stopped Listening",
        description: "Speech recognition stopped.",
      });
    }
  };

  // Check if browser supports speech recognition
  const isSupported = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;

  return (
    <div className="relative">
      {/* Main voice input button */}
      <Button
        variant="outline"
        size="icon"
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing || !isSupported}
        className="relative transition-all duration-200 hover:scale-105"
        title={
          !isSupported 
            ? "Speech recognition not supported in your browser" 
            : isListening 
            ? "Stop Listening" 
            : isProcessing 
            ? "Processing..." 
            : "Start Voice Input (Free - No API needed!)"
        }
      >
        {/* Show different icons based on state */}
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : isListening ? (
          <>
            <MicOff className="h-4 w-4 text-destructive" />
            {/* Pulsing red indicator when listening */}
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
          </>
        ) : (
          <Mic className="h-4 w-4 text-medical" />
        )}
      </Button>
      
      {/* "Listening..." indicator badge */}
      {isListening && (
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

      {/* Browser not supported indicator */}
      {!isSupported && (
        <Badge 
          variant="outline" 
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs border-warning text-warning"
        >
          ⚠️ Not supported
        </Badge>
      )}
    </div>
  );
};
