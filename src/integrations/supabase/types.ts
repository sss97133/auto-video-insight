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
          confidence: number | null
          created_at: string
          event_metadata: Json | null
          event_type: string | null
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
          confidence?: number | null
          created_at?: string
          event_metadata?: Json | null
          event_type?: string | null
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
          confidence?: number | null
          created_at?: string
          event_metadata?: Json | null
          event_type?: string | null
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
      audit_items: {
        Row: {
          audit_id: string
          category: string
          created_at: string
          id: string
          item_name: string
          notes: string | null
          status: string | null
        }
        Insert: {
          audit_id: string
          category: string
          created_at?: string
          id?: string
          item_name: string
          notes?: string | null
          status?: string | null
        }
        Update: {
          audit_id?: string
          category?: string
          created_at?: string
          id?: string
          item_name?: string
          notes?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_items_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          checklist: Json | null
          completed_at: string | null
          created_at: string
          id: string
          inspector: string | null
          notes: string | null
          status: string | null
          vehicle_id: string
        }
        Insert: {
          checklist?: Json | null
          completed_at?: string | null
          created_at?: string
          id?: string
          inspector?: string | null
          notes?: string | null
          status?: string | null
          vehicle_id: string
        }
        Update: {
          checklist?: Json | null
          completed_at?: string | null
          created_at?: string
          id?: string
          inspector?: string | null
          notes?: string | null
          status?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audits_vehicle_id_fkey"
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
      face_collections: {
        Row: {
          aws_collection_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          aws_collection_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          aws_collection_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      face_records: {
        Row: {
          collection_id: string
          created_at: string | null
          external_image_id: string | null
          face_id: string
          id: string
          metadata: Json | null
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          external_image_id?: string | null
          face_id: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          external_image_id?: string | null
          face_id?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "face_records_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "face_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_videos: {
        Row: {
          created_at: string | null
          customer_email: string
          expires_at: string | null
          id: string
          share_token: string
          status: string | null
          video_recording_id: string
          viewed_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email: string
          expires_at?: string | null
          id?: string
          share_token: string
          status?: string | null
          video_recording_id: string
          viewed_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string
          expires_at?: string | null
          id?: string
          share_token?: string
          status?: string | null
          video_recording_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_videos_video_recording_id_fkey"
            columns: ["video_recording_id"]
            isOneToOne: false
            referencedRelation: "video_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          color: string | null
          confidence: number | null
          created_at: string
          damage_assessment: Json | null
          damage_confidence: number | null
          damage_detected: boolean | null
          damage_location: string[] | null
          damage_severity: string | null
          detected_at: string | null
          detected_attributes: Json | null
          entry_timestamp: string | null
          exit_timestamp: string | null
          has_spoiler: boolean | null
          has_sunroof: boolean | null
          id: string
          image_url: string | null
          last_seen: string | null
          license_plate: string
          make: string | null
          measurements: Json | null
          model: string | null
          orientation: string | null
          quality_score: number | null
          time_on_premises: unknown | null
          vehicle_measurements: Json | null
          vehicle_type: string | null
          year: number | null
        }
        Insert: {
          color?: string | null
          confidence?: number | null
          created_at?: string
          damage_assessment?: Json | null
          damage_confidence?: number | null
          damage_detected?: boolean | null
          damage_location?: string[] | null
          damage_severity?: string | null
          detected_at?: string | null
          detected_attributes?: Json | null
          entry_timestamp?: string | null
          exit_timestamp?: string | null
          has_spoiler?: boolean | null
          has_sunroof?: boolean | null
          id?: string
          image_url?: string | null
          last_seen?: string | null
          license_plate: string
          make?: string | null
          measurements?: Json | null
          model?: string | null
          orientation?: string | null
          quality_score?: number | null
          time_on_premises?: unknown | null
          vehicle_measurements?: Json | null
          vehicle_type?: string | null
          year?: number | null
        }
        Update: {
          color?: string | null
          confidence?: number | null
          created_at?: string
          damage_assessment?: Json | null
          damage_confidence?: number | null
          damage_detected?: boolean | null
          damage_location?: string[] | null
          damage_severity?: string | null
          detected_at?: string | null
          detected_attributes?: Json | null
          entry_timestamp?: string | null
          exit_timestamp?: string | null
          has_spoiler?: boolean | null
          has_sunroof?: boolean | null
          id?: string
          image_url?: string | null
          last_seen?: string | null
          license_plate?: string
          make?: string | null
          measurements?: Json | null
          model?: string | null
          orientation?: string | null
          quality_score?: number | null
          time_on_premises?: unknown | null
          vehicle_measurements?: Json | null
          vehicle_type?: string | null
          year?: number | null
        }
        Relationships: []
      }
      video_analysis: {
        Row: {
          camera_id: string
          created_at: string | null
          faces: Json | null
          frame_timestamp: string
          id: string
          labels: Json | null
          objects: Json | null
        }
        Insert: {
          camera_id: string
          created_at?: string | null
          faces?: Json | null
          frame_timestamp: string
          id?: string
          labels?: Json | null
          objects?: Json | null
        }
        Update: {
          camera_id?: string
          created_at?: string | null
          faces?: Json | null
          frame_timestamp?: string
          id?: string
          labels?: Json | null
          objects?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "valid_camera"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_analysis_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
        ]
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
      alert_event_type:
        | "unauthorized_access"
        | "unsafe_movement"
        | "equipment_malfunction"
        | "suspicious_vehicle"
        | "speed_violation"
        | "parking_violation"
        | "maintenance_needed"
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
