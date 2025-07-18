export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      chat_files: {
        Row: {
          chat_id: string;
          created_at: string;
          file_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          chat_id: string;
          created_at?: string;
          file_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          chat_id?: string;
          created_at?: string;
          file_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_files_chat_id_fkey';
            columns: ['chat_id'];
            isOneToOne: false;
            referencedRelation: 'chats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_files_file_id_fkey';
            columns: ['file_id'];
            isOneToOne: false;
            referencedRelation: 'files';
            referencedColumns: ['id'];
          },
        ];
      };
      chats: {
        Row: {
          created_at: string;
          finish_reason: string | null;
          id: string;
          include_profile_context: boolean;
          last_feedback_update: string;
          last_file_update: string;
          last_message_update: string;
          last_shared_message_id: string | null;
          model: string;
          name: string;
          shared_at: string | null;
          shared_by: string | null;
          sharing: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          finish_reason?: string | null;
          id?: string;
          include_profile_context: boolean;
          last_feedback_update?: string;
          last_file_update?: string;
          last_message_update?: string;
          last_shared_message_id?: string | null;
          model: string;
          name: string;
          shared_at?: string | null;
          shared_by?: string | null;
          sharing?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          finish_reason?: string | null;
          id?: string;
          include_profile_context?: boolean;
          last_feedback_update?: string;
          last_file_update?: string;
          last_message_update?: string;
          last_shared_message_id?: string | null;
          model?: string;
          name?: string;
          shared_at?: string | null;
          shared_by?: string | null;
          sharing?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chats_last_shared_message_id_fkey';
            columns: ['last_shared_message_id'];
            isOneToOne: true;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
        ];
      };
      e2b_sandboxes: {
        Row: {
          created_at: string;
          id: string;
          sandbox_id: string;
          status: string;
          template: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          sandbox_id: string;
          status?: string;
          template: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          sandbox_id?: string;
          status?: string;
          template?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          allow_email: boolean | null;
          allow_sharing: boolean | null;
          chat_id: string | null;
          created_at: string;
          detailed_feedback: string | null;
          feedback: string;
          has_files: boolean | null;
          id: string;
          message_id: string | null;
          model: string | null;
          plugin: string | null;
          rag_id: string | null;
          rag_used: boolean;
          reason: string | null;
          sequence_number: number;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          allow_email?: boolean | null;
          allow_sharing?: boolean | null;
          chat_id?: string | null;
          created_at?: string;
          detailed_feedback?: string | null;
          feedback: string;
          has_files?: boolean | null;
          id?: string;
          message_id?: string | null;
          model?: string | null;
          plugin?: string | null;
          rag_id?: string | null;
          rag_used?: boolean;
          reason?: string | null;
          sequence_number: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          allow_email?: boolean | null;
          allow_sharing?: boolean | null;
          chat_id?: string | null;
          created_at?: string;
          detailed_feedback?: string | null;
          feedback?: string;
          has_files?: boolean | null;
          id?: string;
          message_id?: string | null;
          model?: string | null;
          plugin?: string | null;
          rag_id?: string | null;
          rag_used?: boolean;
          reason?: string | null;
          sequence_number?: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_chat';
            columns: ['chat_id'];
            isOneToOne: false;
            referencedRelation: 'chats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_message';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
        ];
      };
      file_items: {
        Row: {
          content: string;
          created_at: string;
          file_id: string;
          id: string;
          name: string | null;
          openai_embedding: string | null;
          sequence_number: number;
          sharing: string;
          tokens: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          file_id: string;
          id?: string;
          name?: string | null;
          openai_embedding?: string | null;
          sequence_number: number;
          sharing?: string;
          tokens: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          file_id?: string;
          id?: string;
          name?: string | null;
          openai_embedding?: string | null;
          sequence_number?: number;
          sharing?: string;
          tokens?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'file_items_file_id_fkey';
            columns: ['file_id'];
            isOneToOne: false;
            referencedRelation: 'files';
            referencedColumns: ['id'];
          },
        ];
      };
      file_workspaces: {
        Row: {
          created_at: string;
          file_id: string;
          updated_at: string | null;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          file_id: string;
          updated_at?: string | null;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          file_id?: string;
          updated_at?: string | null;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'file_workspaces_file_id_fkey';
            columns: ['file_id'];
            isOneToOne: false;
            referencedRelation: 'files';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'file_workspaces_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
        ];
      };
      files: {
        Row: {
          chat_id: string | null;
          created_at: string;
          file_path: string;
          id: string;
          message_id: string | null;
          name: string;
          sharing: string;
          size: number;
          tokens: number;
          type: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          chat_id?: string | null;
          created_at?: string;
          file_path: string;
          id?: string;
          message_id?: string | null;
          name: string;
          sharing?: string;
          size: number;
          tokens: number;
          type: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          chat_id?: string | null;
          created_at?: string;
          file_path?: string;
          id?: string;
          message_id?: string | null;
          name?: string;
          sharing?: string;
          size?: number;
          tokens?: number;
          type?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'files_chat_id_fkey';
            columns: ['chat_id'];
            isOneToOne: false;
            referencedRelation: 'chats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'files_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
        ];
      };
      message_file_items: {
        Row: {
          created_at: string;
          file_item_id: string;
          message_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          file_item_id: string;
          message_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          file_item_id?: string;
          message_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'message_file_items_file_item_id_fkey';
            columns: ['file_item_id'];
            isOneToOne: false;
            referencedRelation: 'file_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'message_file_items_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          attachments: Json[] | null;
          chat_id: string;
          citations: string[];
          content: string;
          created_at: string;
          id: string;
          image_paths: string[];
          model: string;
          plugin: string | null;
          role: string;
          sequence_number: number;
          thinking_content: string | null;
          thinking_elapsed_secs: number | null;
          thinking_enabled: boolean;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          attachments?: Json[] | null;
          chat_id: string;
          citations?: string[];
          content: string;
          created_at?: string;
          id?: string;
          image_paths: string[];
          model: string;
          plugin?: string | null;
          role: string;
          sequence_number: number;
          thinking_content?: string | null;
          thinking_elapsed_secs?: number | null;
          thinking_enabled?: boolean;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          attachments?: Json[] | null;
          chat_id?: string;
          citations?: string[];
          content?: string;
          created_at?: string;
          id?: string;
          image_paths?: string[];
          model?: string;
          plugin?: string | null;
          role?: string;
          sequence_number?: number;
          thinking_content?: string | null;
          thinking_elapsed_secs?: number | null;
          thinking_enabled?: boolean;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_chat_id_fkey';
            columns: ['chat_id'];
            isOneToOne: false;
            referencedRelation: 'chats';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          has_onboarded: boolean;
          id: string;
          image_path: string;
          image_url: string;
          profile_context: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          has_onboarded?: boolean;
          id?: string;
          image_path: string;
          image_url: string;
          profile_context: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          has_onboarded?: boolean;
          id?: string;
          image_path?: string;
          image_url?: string;
          profile_context?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          cancel_at: string | null;
          canceled_at: string | null;
          created_at: string;
          customer_id: string;
          ended_at: string | null;
          id: string;
          plan_type: string;
          quantity: number | null;
          start_date: string | null;
          status: string;
          subscription_id: string;
          team_id: string | null;
          team_name: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          cancel_at?: string | null;
          canceled_at?: string | null;
          created_at?: string;
          customer_id: string;
          ended_at?: string | null;
          id?: string;
          plan_type: string;
          quantity?: number | null;
          start_date?: string | null;
          status: string;
          subscription_id: string;
          team_id?: string | null;
          team_name?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          cancel_at?: string | null;
          canceled_at?: string | null;
          created_at?: string;
          customer_id?: string;
          ended_at?: string | null;
          id?: string;
          plan_type?: string;
          quantity?: number | null;
          start_date?: string | null;
          status?: string;
          subscription_id?: string;
          team_id?: string | null;
          team_name?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      team_invitations: {
        Row: {
          created_at: string;
          id: string;
          invitee_email: string;
          inviter_id: string;
          status: string;
          team_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invitee_email: string;
          inviter_id: string;
          status?: string;
          team_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          invitee_email?: string;
          inviter_id?: string;
          status?: string;
          team_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'team_invitations_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      team_members: {
        Row: {
          created_at: string;
          id: string;
          invitation_id: string | null;
          role: string;
          team_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invitation_id?: string | null;
          role?: string;
          team_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          invitation_id?: string | null;
          role?: string;
          team_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'team_members_invitation_id_fkey';
            columns: ['invitation_id'];
            isOneToOne: false;
            referencedRelation: 'team_invitations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_members_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      teams: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      voice_assistant_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          is_active: boolean;
          participant_identity: string | null;
          room_name: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          is_active?: boolean;
          participant_identity?: string | null;
          room_name: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          is_active?: boolean;
          participant_identity?: string | null;
          room_name?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          created_at: string;
          default_model: string;
          id: string;
          include_profile_context: boolean;
          is_home: boolean;
          name: string;
          sharing: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          default_model: string;
          id?: string;
          include_profile_context: boolean;
          is_home?: boolean;
          name: string;
          sharing?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          default_model?: string;
          id?: string;
          include_profile_context?: boolean;
          is_home?: boolean;
          name?: string;
          sharing?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_team_invitation: {
        Args: { p_invitation_id: string };
        Returns: boolean;
      };
      check_mfa: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      check_user_has_team_or_subscription_or_invitation: {
        Args: { p_user_email: string };
        Returns: boolean;
      };
      clean_up_temp_files: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      create_duplicate_messages_for_new_chat: {
        Args: { old_chat_id: string; new_chat_id: string; new_user_id: string };
        Returns: undefined;
      };
      delete_messages_including_and_after: {
        Args: {
          p_user_id: string;
          p_chat_id: string;
          p_sequence_number: number;
        };
        Returns: undefined;
      };
      delete_storage_object: {
        Args: { bucket: string; object: string };
        Returns: Record<string, unknown>;
      };
      delete_storage_object_from_bucket: {
        Args: { bucket_name: string; object_path: string };
        Returns: Record<string, unknown>;
      };
      delete_user: {
        Args: { sel_user_id: string };
        Returns: undefined;
      };
      get_shared_chat: {
        Args: { share_id_param: string };
        Returns: {
          id: string;
          name: string;
          shared_at: string;
        }[];
      };
      get_shared_chat_messages: {
        Args: { chat_id_param: string };
        Returns: {
          id: string;
          chat_id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
          content: string;
          image_paths: string[];
          model: string;
          role: string;
          sequence_number: number;
          plugin: string;
          rag_used: boolean;
          rag_id: string;
          citations: string[];
          fragment: Json;
          thinking_enabled: boolean;
          thinking_content: string;
          thinking_elapsed_secs: number;
        }[];
      };
      get_team_members: {
        Args: { p_team_id: string };
        Returns: {
          team_id: string;
          team_name: string;
          member_id: string;
          member_user_id: string;
          member_created_at: string;
          member_role: string;
          invitation_id: string;
          invitee_email: string;
          invitation_status: string;
          invitation_created_at: string;
          invitation_updated_at: string;
        }[];
      };
      invite_user_to_team: {
        Args: { p_team_id: string; p_invitee_email: string };
        Returns: boolean;
      };
      is_message_shared: {
        Args: { message_id_param: string };
        Returns: boolean;
      };
      log_old_private_chats: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      match_file_items_openai: {
        Args: {
          query_embedding: string;
          match_count?: number;
          file_ids?: string[];
        };
        Returns: {
          id: string;
          file_id: string;
          content: string;
          tokens: number;
          similarity: number;
        }[];
      };
      non_private_file_exists: {
        Args: { p_name: string };
        Returns: boolean;
      };
      reject_team_invitation: {
        Args: { p_invitation_id: string };
        Returns: boolean;
      };
      remove_user_from_team: {
        Args: { p_team_id: string; p_user_email: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null;
          avif_autodetection: boolean | null;
          created_at: string | null;
          file_size_limit: number | null;
          id: string;
          name: string;
          owner: string | null;
          owner_id: string | null;
          public: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id: string;
          name: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id?: string;
          name?: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          owner_id: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          user_metadata: Json | null;
          version: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'objects_bucketId_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          },
        ];
      };
      s3_multipart_uploads: {
        Row: {
          bucket_id: string;
          created_at: string;
          id: string;
          in_progress_size: number;
          key: string;
          owner_id: string | null;
          upload_signature: string;
          user_metadata: Json | null;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          id: string;
          in_progress_size?: number;
          key: string;
          owner_id?: string | null;
          upload_signature: string;
          user_metadata?: Json | null;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          id?: string;
          in_progress_size?: number;
          key?: string;
          owner_id?: string | null;
          upload_signature?: string;
          user_metadata?: Json | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_bucket_id_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          },
        ];
      };
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string;
          created_at: string;
          etag: string;
          id: string;
          key: string;
          owner_id: string | null;
          part_number: number;
          size: number;
          upload_id: string;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          etag: string;
          id?: string;
          key: string;
          owner_id?: string | null;
          part_number: number;
          size?: number;
          upload_id: string;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          etag?: string;
          id?: string;
          key?: string;
          owner_id?: string | null;
          part_number?: number;
          size?: number;
          upload_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_parts_bucket_id_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 's3_multipart_uploads_parts_upload_id_fkey';
            columns: ['upload_id'];
            isOneToOne: false;
            referencedRelation: 's3_multipart_uploads';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; name: string; owner: string; metadata: Json };
        Returns: undefined;
      };
      extension: {
        Args: { name: string };
        Returns: string;
      };
      filename: {
        Args: { name: string };
        Returns: string;
      };
      foldername: {
        Args: { name: string };
        Returns: string[];
      };
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>;
        Returns: {
          size: number;
          bucket_id: string;
        }[];
      };
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string;
          prefix_param: string;
          delimiter_param: string;
          max_keys?: number;
          next_key_token?: string;
          next_upload_token?: string;
        };
        Returns: {
          key: string;
          id: string;
          created_at: string;
        }[];
      };
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string;
          prefix_param: string;
          delimiter_param: string;
          max_keys?: number;
          start_after?: string;
          next_token?: string;
        };
        Returns: {
          name: string;
          id: string;
          metadata: Json;
          updated_at: string;
        }[];
      };
      operation: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      search: {
        Args: {
          prefix: string;
          bucketname: string;
          limits?: number;
          levels?: number;
          offsets?: number;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          last_accessed_at: string;
          metadata: Json;
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

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {},
  },
} as const;
