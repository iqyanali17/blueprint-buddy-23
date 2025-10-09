-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  phone_number TEXT,
  emergency_contact TEXT,
  medical_conditions TEXT[],
  allergies TEXT[],
  medications TEXT[],
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid()::text = id::text);

-- Create chat_sessions table
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  session_type TEXT NOT NULL CHECK (session_type IN ('general', 'symptom_check', 'emergency', 'medication', 'image_analysis')),
  is_emergency BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" 
ON public.chat_sessions FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own sessions" 
ON public.chat_sessions FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own sessions" 
ON public.chat_sessions FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own sessions" 
ON public.chat_sessions FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'voice', 'system')),
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
  metadata JSONB,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" 
ON public.messages FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own messages" 
ON public.messages FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

-- Create medical_images table
CREATE TABLE public.medical_images (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  analysis_result JSONB,
  image_type TEXT CHECK (image_type IN ('skin', 'wound', 'rash', 'eye', 'general')),
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own medical images" 
ON public.medical_images FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own medical images" 
ON public.medical_images FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

-- Create medication_reminders table
CREATE TABLE public.medication_reminders (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT NOT NULL,
  reminder_times TEXT[] NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own medication reminders" 
ON public.medication_reminders FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own medication reminders" 
ON public.medication_reminders FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own medication reminders" 
ON public.medication_reminders FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own medication reminders" 
ON public.medication_reminders FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Create symptom_assessments table
CREATE TABLE public.symptom_assessments (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  symptoms JSONB NOT NULL,
  assessment_result JSONB,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'emergency')),
  recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.symptom_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own symptom assessments" 
ON public.symptom_assessments FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own symptom assessments" 
ON public.symptom_assessments FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medication_reminders_updated_at
  BEFORE UPDATE ON public.medication_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_messages_session_id ON public.messages(session_id);
CREATE INDEX idx_messages_user_id ON public.messages(user_id);
CREATE INDEX idx_medical_images_user_id ON public.medical_images(user_id);
CREATE INDEX idx_medication_reminders_user_id ON public.medication_reminders(user_id);
CREATE INDEX idx_symptom_assessments_user_id ON public.symptom_assessments(user_id);