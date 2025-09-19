import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database schema
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  date_of_birth?: string;
  phone_number?: string;
  emergency_contact?: string;
  medical_conditions?: string[];
  allergies?: string[];
  medications?: string[];
  preferred_language?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title?: string;
  session_type: 'general' | 'symptom_check' | 'emergency' | 'medication';
  is_emergency: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'image' | 'voice' | 'system';
  sender: 'user' | 'assistant';
  metadata?: Record<string, any>;
  attachments?: string[];
  created_at: string;
}

export interface MedicalImage {
  id: string;
  user_id: string;
  session_id: string;
  image_url: string;
  analysis_result?: Record<string, any>;
  image_type?: 'skin' | 'wound' | 'rash' | 'eye' | 'general';
  confidence_score?: number;
  created_at: string;
}

export interface MedicationReminder {
  id: string;
  user_id: string;
  medication_name: string;
  dosage?: string;
  frequency: string;
  reminder_times: string[];
  start_date: string;
  end_date?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SymptomAssessment {
  id: string;
  user_id: string;
  session_id: string;
  symptoms: Record<string, any>;
  assessment_result?: Record<string, any>;
  risk_level: 'low' | 'medium' | 'high' | 'emergency';
  recommendations?: string[];
  created_at: string;
}