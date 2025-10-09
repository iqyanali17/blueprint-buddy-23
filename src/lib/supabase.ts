export { supabase } from '@/integrations/supabase/client';

// Re-export types from generated types with friendly names
import type { Tables } from '@/integrations/supabase/types';

export type Profile = Tables<'profiles'>;
export type ChatSession = Tables<'chat_sessions'>;
export type Message = Tables<'messages'>;
export type MedicalImage = Tables<'medical_images'>;
export type MedicationReminder = Tables<'medication_reminders'>;
export type SymptomAssessment = Tables<'symptom_assessments'>;