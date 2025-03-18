export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string;
          currency: string;
          id: string;
          is_debt: boolean | null;
          name: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          id?: string;
          is_debt?: boolean | null;
          name: string;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          id?: string;
          is_debt?: boolean | null;
          name?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      hourly_account_values: {
        Row: {
          account_id: string;
          hour_start: string;
          value: number;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          account_id: string;
          hour_start: string;
          value: number;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          hour_start?: string;
          value?: number;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hourly_account_values_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hourly_account_values_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      networth_history: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          user_id: string;
          value: number;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          user_id: string;
          value: number;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          user_id?: string;
          value?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_current_account_value: {
        Args: {
          account_id_param: string;
        };
        Returns: number;
      };
      calculate_account_performance: {
        Args: {
          user_id_param: string;
          start_date: string;
          end_date: string;
        };
        Returns: {
          account_id: string;
          account_name: string;
          account_type: string;
          is_debt: boolean;
          start_value: number;
          end_value: number;
          absolute_change: number;
          percent_change: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper type for Supabase schema
type PublicSchema = Database[Extract<keyof Database, "public">];

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
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

// Helper type for function returns
export type Functions<
  PublicFunctionName extends keyof PublicSchema["Functions"],
> = PublicSchema["Functions"][PublicFunctionName] extends {
  Returns: infer R;
}
  ? R
  : never;
