import React, { useState, useEffect } from 'react';
import { Languages } from 'lucide-react';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

interface LanguageSelectorProps {
  onLanguageChange: (language: string) => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onLanguageChange }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    onLanguageChange(language);
    localStorage.setItem('preferredLanguage', language);
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
      onLanguageChange(savedLanguage);
    }
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Select Language</h4>
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
};
