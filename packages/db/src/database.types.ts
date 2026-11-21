export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: {
          actor_email: string | null;
          actor_id: string | null;
          actor_role: string | null;
          id: number;
          new_data: Json | null;
          occurred_at: string;
          old_data: Json | null;
          operation: string;
          record_id: string | null;
          table_name: string;
        };
        ComputedFields: never;
        Insert: {
          actor_email?: string | null;
          actor_id?: string | null;
          actor_role?: string | null;
          id?: never;
          new_data?: Json | null;
          occurred_at?: string;
          old_data?: Json | null;
          operation: string;
          record_id?: string | null;
          table_name: string;
        };
        Update: {
          actor_email?: string | null;
          actor_id?: string | null;
          actor_role?: string | null;
          id?: never;
          new_data?: Json | null;
          occurred_at?: string;
          old_data?: Json | null;
          operation?: string;
          record_id?: string | null;
          table_name?: string;
        };
        Relationships: [];
      };
      contact_links: {
        Row: {
          asset_id: string | null;
          created_at: string;
          icon_key: string | null;
          id: string;
          is_visible: boolean;
          label: string;
          published_at: string | null;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          updated_at: string;
          url: string | null;
          variant: Database["public"]["Enums"]["link_variant"];
        };
        ComputedFields: never;
        Insert: {
          asset_id?: string | null;
          created_at?: string;
          icon_key?: string | null;
          id?: string;
          is_visible?: boolean;
          label: string;
          published_at?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
          url?: string | null;
          variant: Database["public"]["Enums"]["link_variant"];
        };
        Update: {
          asset_id?: string | null;
          created_at?: string;
          icon_key?: string | null;
          id?: string;
          is_visible?: boolean;
          label?: string;
          published_at?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
          url?: string | null;
          variant?: Database["public"]["Enums"]["link_variant"];
        };
        Relationships: [
          {
            foreignKeyName: "contact_links_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_messages: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
          read_at: string | null;
          replied_at: string | null;
          source_page: string | null;
          status: Database["public"]["Enums"]["contact_message_status"];
          subject: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
          read_at?: string | null;
          replied_at?: string | null;
          source_page?: string | null;
          status?: Database["public"]["Enums"]["contact_message_status"];
          subject?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          read_at?: string | null;
          replied_at?: string | null;
          source_page?: string | null;
          status?: Database["public"]["Enums"]["contact_message_status"];
          subject?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      experiences: {
        Row: {
          accent_color: string;
          company: string;
          created_at: string;
          description: string;
          id: string;
          is_visible: boolean;
          published_at: string | null;
          role: string;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          updated_at: string;
          year_label: string;
        };
        ComputedFields: never;
        Insert: {
          accent_color: string;
          company: string;
          created_at?: string;
          description: string;
          id?: string;
          is_visible?: boolean;
          published_at?: string | null;
          role: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
          year_label: string;
        };
        Update: {
          accent_color?: string;
          company?: string;
          created_at?: string;
          description?: string;
          id?: string;
          is_visible?: boolean;
          published_at?: string | null;
          role?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
          year_label?: string;
        };
        Relationships: [];
      };
      media_assets: {
        Row: {
          alt_text: string | null;
          bucket: string;
          byte_size: number;
          created_at: string;
          file_name: string;
          id: string;
          mime_type: string;
          object_path: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          alt_text?: string | null;
          bucket: string;
          byte_size: number;
          created_at?: string;
          file_name: string;
          id?: string;
          mime_type: string;
          object_path: string;
          updated_at?: string;
        };
        Update: {
          alt_text?: string | null;
          bucket?: string;
          byte_size?: number;
          created_at?: string;
          file_name?: string;
          id?: string;
          mime_type?: string;
          object_path?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      nav_items: {
        Row: {
          created_at: string;
          href: string;
          id: string;
          is_cta: boolean;
          is_visible: boolean;
          label: string;
          mobile_label: string | null;
          published_at: string | null;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          href: string;
          id?: string;
          is_cta?: boolean;
          is_visible?: boolean;
          label: string;
          mobile_label?: string | null;
          published_at?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          href?: string;
          id?: string;
          is_cta?: boolean;
          is_visible?: boolean;
          label?: string;
          mobile_label?: string | null;
          published_at?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      profile: {
        Row: {
          avatar_asset_id: string | null;
          created_at: string;
          display_name: string;
          full_name: string;
          id: boolean;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          avatar_asset_id?: string | null;
          created_at?: string;
          display_name: string;
          full_name: string;
          id?: boolean;
          updated_at?: string;
        };
        Update: {
          avatar_asset_id?: string | null;
          created_at?: string;
          display_name?: string;
          full_name?: string;
          id?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_avatar_asset_id_fkey";
            columns: ["avatar_asset_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_stats: {
        Row: {
          created_at: string;
          id: string;
          is_visible: boolean;
          label: string;
          published_at: string | null;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          updated_at: string;
          value: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          is_visible?: boolean;
          label: string;
          published_at?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
          value: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_visible?: boolean;
          label?: string;
          published_at?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
          value?: string;
        };
        Relationships: [];
      };
      project_technologies: {
        Row: {
          project_id: string;
          sort_order: number;
          technology_id: string;
        };
        ComputedFields: never;
        Insert: {
          project_id: string;
          sort_order?: number;
          technology_id: string;
        };
        Update: {
          project_id?: string;
          sort_order?: number;
          technology_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_technologies_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_technologies_technology_id_fkey";
            columns: ["technology_id"];
            isOneToOne: false;
            referencedRelation: "technologies";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          accent_color: string;
          accent_color_alt: string;
          category: string;
          cover_asset_id: string | null;
          created_at: string;
          description: string;
          id: string;
          is_visible: boolean;
          layout: Database["public"]["Enums"]["project_layout"];
          published_at: string | null;
          slug: string;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          accent_color: string;
          accent_color_alt: string;
          category: string;
          cover_asset_id?: string | null;
          created_at?: string;
          description: string;
          id?: string;
          is_visible?: boolean;
          layout?: Database["public"]["Enums"]["project_layout"];
          published_at?: string | null;
          slug: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          accent_color?: string;
          accent_color_alt?: string;
          category?: string;
          cover_asset_id?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          is_visible?: boolean;
          layout?: Database["public"]["Enums"]["project_layout"];
          published_at?: string | null;
          slug?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_cover_asset_id_fkey";
            columns: ["cover_asset_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
        ];
      };
      quotes: {
        Row: {
          body: string;
          created_at: string;
          highlight: string | null;
          id: string;
          is_visible: boolean;
          label: string;
          published_at: string | null;
          section_id: string;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          body: string;
          created_at?: string;
          highlight?: string | null;
          id?: string;
          is_visible?: boolean;
          label: string;
          published_at?: string | null;
          section_id: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          highlight?: string | null;
          id?: string;
          is_visible?: boolean;
          label?: string;
          published_at?: string | null;
          section_id?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quotes_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          },
        ];
      };
      section_ctas: {
        Row: {
          created_at: string;
          href: string;
          id: string;
          is_visible: boolean;
          label: string;
          published_at: string | null;
          section_id: string;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          updated_at: string;
          variant: Database["public"]["Enums"]["cta_variant"];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          href: string;
          id?: string;
          is_visible?: boolean;
          label: string;
          published_at?: string | null;
          section_id: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
          variant?: Database["public"]["Enums"]["cta_variant"];
        };
        Update: {
          created_at?: string;
          href?: string;
          id?: string;
          is_visible?: boolean;
          label?: string;
          published_at?: string | null;
          section_id?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
          variant?: Database["public"]["Enums"]["cta_variant"];
        };
        Relationships: [
          {
            foreignKeyName: "section_ctas_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          },
        ];
      };
      sections: {
        Row: {
          created_at: string;
          description: string | null;
          heading: string;
          heading_highlight: string | null;
          id: string;
          is_visible: boolean;
          key: string;
          label: string;
          marquee_words: string[];
          published_at: string | null;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          heading: string;
          heading_highlight?: string | null;
          id?: string;
          is_visible?: boolean;
          key: string;
          label: string;
          marquee_words?: string[];
          published_at?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          heading?: string;
          heading_highlight?: string | null;
          id?: string;
          is_visible?: boolean;
          key?: string;
          label?: string;
          marquee_words?: string[];
          published_at?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          availability_href: string;
          availability_label: string;
          created_at: string;
          footer_availability_label: string;
          footer_name: string;
          footer_suffix: string;
          id: boolean;
          locale: string;
          og_description: string;
          og_title: string;
          og_type: string;
          seo_description: string;
          seo_keywords: string[];
          seo_title: string;
          site_name: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          availability_href: string;
          availability_label: string;
          created_at?: string;
          footer_availability_label: string;
          footer_name: string;
          footer_suffix: string;
          id?: boolean;
          locale?: string;
          og_description: string;
          og_title: string;
          og_type?: string;
          seo_description: string;
          seo_keywords?: string[];
          seo_title: string;
          site_name: string;
          updated_at?: string;
        };
        Update: {
          availability_href?: string;
          availability_label?: string;
          created_at?: string;
          footer_availability_label?: string;
          footer_name?: string;
          footer_suffix?: string;
          id?: boolean;
          locale?: string;
          og_description?: string;
          og_title?: string;
          og_type?: string;
          seo_description?: string;
          seo_keywords?: string[];
          seo_title?: string;
          site_name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      skill_categories: {
        Row: {
          color: string;
          created_at: string;
          id: string;
          is_visible: boolean;
          label: string;
          published_at: string | null;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          color: string;
          created_at?: string;
          id?: string;
          is_visible?: boolean;
          label: string;
          published_at?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          id?: string;
          is_visible?: boolean;
          label?: string;
          published_at?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      skills: {
        Row: {
          category_id: string;
          created_at: string;
          id: string;
          is_visible: boolean;
          label: string;
          proficiency: number;
          published_at: string | null;
          sort_order: number;
          status: Database["public"]["Enums"]["content_status"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          category_id: string;
          created_at?: string;
          id?: string;
          is_visible?: boolean;
          label: string;
          proficiency: number;
          published_at?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          id?: string;
          is_visible?: boolean;
          label?: string;
          proficiency?: number;
          published_at?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["content_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "skills_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "skill_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      technologies: {
        Row: {
          created_at: string;
          hero_sort_order: number | null;
          id: string;
          is_visible: boolean;
          name: string;
          published_at: string | null;
          show_in_hero: boolean;
          show_in_tools: boolean;
          slug: string;
          status: Database["public"]["Enums"]["content_status"];
          tools_sort_order: number | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          hero_sort_order?: number | null;
          id?: string;
          is_visible?: boolean;
          name: string;
          published_at?: string | null;
          show_in_hero?: boolean;
          show_in_tools?: boolean;
          slug: string;
          status?: Database["public"]["Enums"]["content_status"];
          tools_sort_order?: number | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          hero_sort_order?: number | null;
          id?: string;
          is_visible?: boolean;
          name?: string;
          published_at?: string | null;
          show_in_hero?: boolean;
          show_in_tools?: boolean;
          slug?: string;
          status?: Database["public"]["Enums"]["content_status"];
          tools_sort_order?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      replace_project_technologies: {
        Args: { p_project_id: string; p_technology_ids?: string[] };
        Returns: undefined;
      };
      submit_contact_message: {
        Args: {
          p_email: string;
          p_message: string;
          p_name: string;
          p_source_page?: string;
          p_subject: string;
        };
        Returns: string;
      };
    };
    Enums: {
      contact_message_status: "new" | "read" | "replied" | "archived" | "spam";
      content_status: "draft" | "published" | "archived";
      cta_variant: "primary" | "secondary" | "text";
      link_variant: "button" | "icon";
      project_layout: "large" | "small";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      contact_message_status: ["new", "read", "replied", "archived", "spam"],
      content_status: ["draft", "published", "archived"],
      cta_variant: ["primary", "secondary", "text"],
      link_variant: ["button", "icon"],
      project_layout: ["large", "small"],
    },
  },
} as const;
