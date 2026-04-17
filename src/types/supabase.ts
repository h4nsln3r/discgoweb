export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      competition_courses: {
        Row: {
          competition_id: string
          course_id: string | null
          created_at: string | null
          id: string
          sort_order: number | null
        }
        Insert: {
          competition_id: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          sort_order?: number | null
        }
        Update: {
          competition_id?: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_courses_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_participants: {
        Row: {
          id: string
          competition_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          competition_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          competition_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      competition_photos: {
        Row: {
          id: string
          competition_id: string
          uploaded_by: string
          image_url: string
          created_at: string
        }
        Insert: {
          id?: string
          competition_id: string
          uploaded_by: string
          image_url: string
          created_at?: string
        }
        Update: {
          id?: string
          competition_id?: string
          uploaded_by?: string
          image_url?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_photos_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_organizers: {
        Row: {
          id: string
          competition_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          competition_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          competition_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_organizers_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_organizers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          start_date: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          start_date?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          start_date?: string | null
          title?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          city: string | null
          country: string | null
          created_by: string | null
          description: string | null
          id: string
          image_urls: string | null
          landskap: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          main_image_url: string | null
          name: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_urls?: string | null
          landskap?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          main_image_url?: string | null
          name: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_urls?: string | null
          landskap?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          main_image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      course_holes: {
        Row: {
          id: string
          course_id: string
          hole_number: number
          par: number
          length: number | null
        }
        Insert: {
          id?: string
          course_id: string
          hole_number: number
          par: number
          length?: number | null
        }
        Update: {
          course_id?: string
          hole_number?: number
          par?: number
          length?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_holes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      score_holes: {
        Row: {
          id: string
          score_id: string
          hole_number: number
          throws: number
        }
        Insert: {
          id?: string
          score_id: string
          hole_number: number
          throws: number
        }
        Update: {
          score_id?: string
          hole_number?: number
          throws?: number
        }
        Relationships: [
          {
            foreignKeyName: "score_holes_score_id_fkey"
            columns: ["score_id"]
            isOneToOne: false
            referencedRelation: "scores"
            referencedColumns: ["id"]
          },
        ]
      }
      discs: {
        Row: {
          id: string
          name: string
          bild: string | null
          created_at: string | null
          created_by: string | null
          speed: number | null
          glide: number | null
          turn: number | null
          fade: number | null
          disc_type: "driver" | "fairway" | "midrange" | "putter" | "other" | null
          brand: string | null
        }
        Insert: {
          id?: string
          name: string
          bild?: string | null
          created_at?: string | null
          created_by?: string | null
          speed?: number | null
          glide?: number | null
          turn?: number | null
          fade?: number | null
          disc_type?: "driver" | "fairway" | "midrange" | "putter" | "other" | null
          brand?: string | null
        }
        Update: {
          name?: string
          bild?: string | null
          created_at?: string | null
          created_by?: string | null
          speed?: number | null
          glide?: number | null
          turn?: number | null
          fade?: number | null
          disc_type?: "driver" | "fairway" | "midrange" | "putter" | "other" | null
          brand?: string | null
        }
        Relationships: []
      }
      player_bag: {
        Row: {
          id: string
          user_id: string
          disc_id: string
          created_at: string
          status: "active" | "discarded" | "worthless" | "for_trade"
          sort_order: number | null
        }
        Insert: {
          id?: string
          user_id: string
          disc_id: string
          created_at?: string
          status?: "active" | "discarded" | "worthless" | "for_trade"
          sort_order?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          disc_id?: string
          created_at?: string
          status?: "active" | "discarded" | "worthless" | "for_trade"
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_bag_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_bag_disc_id_fkey"
            columns: ["disc_id"]
            isOneToOne: false
            referencedRelation: "discs"
            referencedColumns: ["id"]
          },
        ]
      }
      disc_comments: {
        Row: {
          id: string
          disc_id: string
          user_id: string
          body: string | null
          media_type: "image" | "video" | null
          media_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          disc_id: string
          user_id: string
          body?: string | null
          media_type?: "image" | "video" | null
          media_url?: string | null
          created_at?: string
        }
        Update: {
          disc_id?: string
          user_id?: string
          body?: string | null
          media_type?: "image" | "video" | null
          media_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disc_comments_disc_id_fkey"
            columns: ["disc_id"]
            isOneToOne: false
            referencedRelation: "discs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disc_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          id: string
          name: string
          city: string | null
          country: string | null
          landskap: string | null
          logga: string | null
          bild: string | null
          about: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          city?: string | null
          country?: string | null
          landskap?: string | null
          logga?: string | null
          bild?: string | null
          about?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          name?: string
          city?: string | null
          country?: string | null
          landskap?: string | null
          logga?: string | null
          bild?: string | null
          about?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      team_member_roles: {
        Row: {
          team_id: string
          user_id: string
          role: string
        }
        Insert: {
          team_id: string
          user_id: string
          role: string
        }
        Update: {
          team_id?: string
          user_id?: string
          role?: string
        }
        Relationships: []
      }
      team_applications: {
        Row: {
          id: string
          team_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alias: string
          avatar_url: string
          city: string | null
          country: string | null
          favorite_disc: string | null
          favorite_disc_id: string | null
          phone: string | null
          team_id: string | null
          home_course: string | null
          id: string
          created_at: string | null
          is_admin: boolean
        }
        Insert: {
          alias: string
          avatar_url: string
          city?: string | null
          country?: string | null
          favorite_disc?: string | null
          favorite_disc_id?: string | null
          phone?: string | null
          team_id?: string | null
          home_course?: string | null
          id?: string
          created_at?: string | null
          is_admin?: boolean
        }
        Update: {
          alias?: string
          avatar_url?: string
          city?: string | null
          country?: string | null
          favorite_disc?: string | null
          favorite_disc_id?: string | null
          phone?: string | null
          team_id?: string | null
          home_course?: string | null
          id?: string
          created_at?: string | null
          is_admin?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_home_course_fkey"
            columns: ["home_course"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_favorite_disc_id_fkey"
            columns: ["favorite_disc_id"]
            isOneToOne: false
            referencedRelation: "discs"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          competition_id: string | null
          course_id: string
          created_at: string
          date_played: string | null
          id: string
          score: number
          throws: number | null
          user_id: string
          with_friends: string | null
        }
        Insert: {
          competition_id?: string | null
          course_id?: string
          created_at?: string
          date_played?: string | null
          id?: string
          score: number
          throws?: number | null
          user_id?: string
          with_friends?: string | null
        }
        Update: {
          competition_id?: string | null
          course_id?: string
          created_at?: string
          date_played?: string | null
          id?: string
          score?: number
          throws?: number | null
          user_id?: string
          with_friends?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scores_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_team_application: {
        Args: { p_application_id: string; p_role?: string }
        Returns: undefined
      }
      get_team_applicants: {
        Args: { p_team_id: string }
        Returns: { id: string; user_id: string; alias: string | null; avatar_url: string | null }[]
      }
      reject_team_application: {
        Args: { p_application_id: string }
        Returns: undefined
      }
      remove_team_member: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
