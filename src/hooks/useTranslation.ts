import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);

  const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    if (targetLanguage === 'en' || !text) {
      return text;
    }

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { text, targetLanguage }
      });

      if (error) throw error;

      return data.translatedText || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    } finally {
      setIsTranslating(false);
    }
  };

  return { translateText, isTranslating };
};
