# MEDITALK Database Setup

Since migration files are read-only, you'll need to create these tables manually in your Supabase dashboard:

## SQL Commands to Run in Supabase SQL Editor

```sql
-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    date_of_birth DATE,
    phone_number TEXT,
    emergency_contact TEXT,
    medical_conditions TEXT[],
    allergies TEXT[],
    medications TEXT[],
    preferred_language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_sessions table for organizing conversations
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    session_type TEXT DEFAULT 'general',
    is_emergency BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table for chat history
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    sender TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    attachments TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medical_images table for image analysis
CREATE TABLE IF NOT EXISTS public.medical_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    analysis_result JSONB,
    image_type TEXT,
    confidence_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medication_reminders table
CREATE TABLE IF NOT EXISTS public.medication_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    reminder_times TIME[],
    start_date DATE,
    end_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create symptom_assessments table
CREATE TABLE IF NOT EXISTS public.symptom_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    symptoms JSONB NOT NULL,
    assessment_result JSONB,
    risk_level TEXT,
    recommendations TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_assessments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own chat sessions" ON public.chat_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own messages" ON public.messages
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own medical images" ON public.medical_images
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own medication reminders" ON public.medication_reminders
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own symptom assessments" ON public.symptom_assessments
    FOR ALL USING (auth.uid() = user_id);

-- Create function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_images_user_id ON public.medical_images(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_user_id ON public.medication_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_symptom_assessments_user_id ON public.symptom_assessments(user_id);
```

## Steps to Setup:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the above SQL commands
4. Run the query
5. Update the Supabase URL and anon key in `src/lib/supabase.ts`

## Features Implemented:

✅ **Authentication System** - Sign up, sign in, password reset
✅ **User Profiles** - Medical history, allergies, medications
✅ **Chat Sessions** - Organized conversations with MEDITALK
✅ **Message History** - Persistent chat history with timestamps
✅ **Medical Images** - Upload and analysis of medical images
✅ **Medication Reminders** - Track and remind about medications
✅ **Symptom Assessments** - Structured symptom tracking
✅ **Row Level Security** - User data isolation and privacy
✅ **Real-time Features** - Ready for live chat updates