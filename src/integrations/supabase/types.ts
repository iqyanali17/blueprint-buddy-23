export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          is_emergency: boolean
          session_type: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_emergency?: boolean
          session_type: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_emergency?: boolean
          session_type?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_images: {
        Row: {
          analysis_result: Json | null
          confidence_score: number | null
          created_at: string
          id: string
          image_type: string | null
          image_url: string
          session_id: string
          user_id: string
        }
        Insert: {
          analysis_result?: Json | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          image_type?: string | null
          image_url: string
          session_id: string
          user_id: string
        }
        Update: {
          analysis_result?: Json | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          image_type?: string | null
          image_url?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_images_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_reminders: {
        Row: {
          created_at: string
          dosage: string | null
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean
          medication_name: string
          notes: string | null
          reminder_times: string[]
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean
          medication_name: string
          notes?: string | null
          reminder_times: string[]
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          medication_name?: string
          notes?: string | null
          reminder_times?: string[]
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: string[] | null
          content: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          sender: string
          session_id: string
          user_id: string
        }
        Insert: {
          attachments?: string[] | null
          content: string
          created_at?: string
          id?: string
          message_type: string
          metadata?: Json | null
          sender: string
          session_id: string
          user_id: string
        }
        Update: {
          attachments?: string[] | null
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          sender?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allergies: string[] | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          emergency_contact: string | null
          full_name: string | null
          id: string
          medical_conditions: string[] | null
          medications: string[] | null
          phone_number: string | null
          preferred_language: string | null
          updated_at: string
        }
        Insert: {
          allergies?: string[] | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          emergency_contact?: string | null
          full_name?: string | null
          id?: string
          medical_conditions?: string[] | null
          medications?: string[] | null
          phone_number?: string | null
          preferred_language?: string | null
          updated_at?: string
        }
        Update: {
          allergies?: string[] | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          emergency_contact?: string | null
          full_name?: string | null
          id?: string
          medical_conditions?: string[] | null
          medications?: string[] | null
          phone_number?: string | null
          preferred_language?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      symptom_assessments: {
        Row: {
          assessment_result: Json | null
          created_at: string
          id: string
          recommendations: string[] | null
          risk_level: string
          session_id: string
          symptoms: Json
          user_id: string
        }
        Insert: {
          assessment_result?: Json | null
          created_at?: string
          id?: string
          recommendations?: string[] | null
          risk_level: string
          session_id: string
          symptoms: Json
          user_id: string
        }
        Update: {
          assessment_result?: Json | null
          created_at?: string
          id?: string
          recommendations?: string[] | null
          risk_level?: string
          session_id?: string
          symptoms?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "symptom_assessments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "symptom_assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
