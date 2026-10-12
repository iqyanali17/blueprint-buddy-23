import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Camera, AlertCircle } from 'lucide-react';
import { VoiceInput } from '@/components/VoiceInput';
import { User } from '@supabase/supabase-js';

export type QuickActionType = 'symptoms' | 'medications' | 'emergency' | 'image' | 'dashboard' | 'profile';

interface ChatInputBarProps {
  user: User | null;
  loading: boolean;
  onSendMessage: (message: string) => Promise<void>;
  onSendImage: (file: File, caption: string) => Promise<void>;
  onQuickAction: (action: QuickActionType) => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = React.memo(({
  user,
  loading,
  onSendMessage,
  onSendImage,
  onQuickAction,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleInlineImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const currentCaption = inputMessage;
    setInputMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    await onSendImage(file, currentCaption);
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
  };

  const handleSend = async () => {
    const text = inputMessage.trim();
    if (!text) return;
    setInputMessage('');
    await onSendMessage(text);
  };

  return (
    <div className="p-3 sm:p-6 border-t bg-background">
      {user && (
        <div className="flex items-center gap-2 mb-3 sm:mb-4 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
          <Button
            variant="outline"
            size="sm"
            className="text-medical border-medical hover:bg-medical hover:text-white whitespace-nowrap text-xs sm:text-sm flex-shrink-0"
            onClick={() => onQuickAction('dashboard')}
          >
            Dashboard
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-medical border-medical hover:bg-medical hover:text-white whitespace-nowrap text-xs sm:text-sm flex-shrink-0"
            onClick={() => onQuickAction('symptoms')}
          >
            Symptoms
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-healing border-healing hover:bg-healing hover:text-white whitespace-nowrap text-xs sm:text-sm flex-shrink-0"
            onClick={() => onQuickAction('medications')}
          >
            Meds
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-primary border-primary hover:bg-primary hover:text-white whitespace-nowrap text-xs sm:text-sm flex-shrink-0"
            onClick={() => onQuickAction('image')}
          >
            Image
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-emergency border-emergency hover:bg-emergency hover:text-white whitespace-nowrap text-xs sm:text-sm flex-shrink-0"
            onClick={() => onQuickAction('emergency')}
          >
            Emergency
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground border-muted-foreground hover:bg-muted-foreground hover:text-white whitespace-nowrap text-xs sm:text-sm flex-shrink-0"
            onClick={() => onQuickAction('profile')}
          >
            Profile
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Input
            placeholder={user ? "Describe symptoms or ask a question..." : "Sign in to chat..."}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            className="pr-16 sm:pr-20 border-medical/20 focus:border-medical text-sm"
            disabled={!user}
          />
          {user && (
            <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <VoiceInput onTranscript={handleVoiceTranscript} />
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={handleImageButtonClick}
              >
                <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInlineImageSelected}
          />
        </div>
        <Button
          onClick={handleSend}
          variant="medical"
          size="sm"
          className="px-3 sm:px-6"
          disabled={!user || !inputMessage.trim() || loading}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Medical Disclaimer */}
      <div className="flex items-start gap-2 mt-3 sm:mt-4 p-2 sm:p-3 bg-warning/5 border border-warning/20 rounded-lg">
        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-warning mt-0.5 flex-shrink-0" />
        <div className="text-[10px] sm:text-xs text-muted-foreground">
          <p className="font-medium text-warning mb-0.5 sm:mb-1">Medical Disclaimer</p>
          <p className="leading-relaxed">
            MEDITALK provides general health info for educational purposes only.
            Always consult qualified healthcare providers for medical concerns.
          </p>
        </div>
      </div>
    </div>
  );
});

ChatInputBar.displayName = 'ChatInputBar';

export default ChatInputBar;
