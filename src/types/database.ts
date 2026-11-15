export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      app_admins: {
        Row: { user_id: string; created_at: string }
        Insert: { user_id: string; created_at?: string }
        Update: { user_id?: string; created_at?: string }
        Relationships: []
      }
      players: {
        Row: {
          id: string
          name: string
          nickname: string | null
          seed: number
          primary_position: string
          secondary_positions: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          nickname?: string | null
          seed: number
          primary_position: string
          secondary_positions?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          nickname?: string | null
          seed?: number
          primary_position?: string
          secondary_positions?: string[]
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      draw_sessions: {
        Row: {
          id: string
          title: string
          match_date: string
          team_count: number
          field_size: number
          status: 'draft' | 'published'
          created_by: string
          algorithm_version: string
          draw_seed: string
          created_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          title: string
          match_date: string
          team_count: number
          field_size?: number
          status: 'draft' | 'published'
          created_by: string
          algorithm_version: string
          draw_seed: string
          created_at?: string
          published_at?: string | null
        }
        Update: {
          title?: string
          match_date?: string
          team_count?: number
          status?: 'draft' | 'published'
          algorithm_version?: string
          draw_seed?: string
          published_at?: string | null
        }
        Relationships: []
      }
      draw_assignments: {
        Row: {
          id: string
          session_id: string
          player_id: string
          team_index: number
          is_starting: boolean
          reveal_order: number
          player_name_snapshot: string
          seed_snapshot: number
          position_snapshot: string
          secondary_positions_snapshot: string[]
        }
        Insert: {
          id?: string
          session_id: string
          player_id: string
          team_index: number
          is_starting?: boolean
          reveal_order: number
          player_name_snapshot: string
          seed_snapshot: number
          position_snapshot: string
          secondary_positions_snapshot?: string[]
        }
        Update: never
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      delete_published_draw: {
        Args: { p_session_id: string }
        Returns: boolean
      }
      publish_draw: {
        Args: {
          p_title: string
          p_match_date: string
          p_team_count: number
          p_algorithm_version: string
          p_draw_seed: string
          p_assignments: Json
        }
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
