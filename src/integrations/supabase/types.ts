export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_type: string
          camera_id: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          severity: string
          status: string | null
          vehicle_id: string | null
        }
        Insert: {
          alert_type: string
          camera_id?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          severity: string
          status?: string | null
          vehicle_id?: string | null
        }
        Update: {
          alert_type?: string
          camera_id?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          severity?: string
          status?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics: {
        Row: {
          camera_id: string | null
          event_data: Json | null
          event_type: string
          id: string
          timestamp: string
          vehicle_id: string | null
        }
        Insert: {
          camera_id?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          timestamp?: string
          vehicle_id?: string | null
        }
        Update: {
          camera_id?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          timestamp?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      cameras: {
        Row: {
          configuration: Json | null
          created_at: string
          id: string
          is_recording: boolean | null
          location: string
          name: string
          status: string
          streaming_url: string | null
          type: string
          updated_at: string
        }
        Insert: {
          configuration?: Json | null
          created_at?: string
          id?: string
          is_recording?: boolean | null
          location: string
          name: string
          status?: string
          streaming_url?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          configuration?: Json | null
          created_at?: string
          id?: string
          is_recording?: boolean | null
          location?: string
          name?: string
          status?: string
          streaming_url?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          confidence: number | null
          created_at: string
          detected_at: string | null
          id: string
          image_url: string | null
          last_seen: string | null
          license_plate: string
          make: string | null
          model: string | null
          year: number | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          detected_at?: string | null
          id?: string
          image_url?: string | null
          last_seen?: string | null
          license_plate: string
          make?: string | null
          model?: string | null
          year?: number | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          detected_at?: string | null
          id?: string
          image_url?: string | null
          last_seen?: string | null
          license_plate?: string
          make?: string | null
          model?: string | null
          year?: number | null
        }
        Relationships: []
      }
      video_recordings: {
        Row: {
          camera_id: string | null
          created_at: string
          end_time: string | null
          id: string
          metadata: Json | null
          start_time: string
          status: string | null
          storage_path: string
        }
        Insert: {
          camera_id?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          metadata?: Json | null
          start_time: string
          status?: string | null
          storage_path: string
        }
        Update: {
          camera_id?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          metadata?: Json | null
          start_time?: string
          status?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_recordings_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
