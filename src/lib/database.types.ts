export interface Database {
  public: {
    Tables: {
      quizzes: {
        Row: {
          id: string
          title: string
          description: string | null
          created_at: string
          updated_at: string
          created_by: string
          is_published: boolean
          quiz_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'mixed'
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          created_at?: string
          updated_at?: string
          created_by: string
          is_published?: boolean
          quiz_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'mixed'
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
          is_published?: boolean
          quiz_type?: 'multiple_choice' | 'true_false' | 'short_answer' | 'mixed'
        }
      }
      questions: {
        Row: {
          id: string
          quiz_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer'
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer'
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          question_text?: string
          question_type?: 'multiple_choice' | 'true_false' | 'short_answer'
          order_index?: number
          created_at?: string
        }
      }
      answer_options: {
        Row: {
          id: string
          question_id: string
          option_text: string
          is_correct: boolean
          order_index: number
        }
        Insert: {
          id?: string
          question_id: string
          option_text: string
          is_correct: boolean
          order_index: number
        }
        Update: {
          id?: string
          question_id?: string
          option_text?: string
          is_correct?: boolean
          order_index?: number
        }
      }
      quiz_responses: {
        Row: {
          id: string
          quiz_id: string
          user_id: string | null
          score: number
          total_questions: number
          completed_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          user_id?: string | null
          score: number
          total_questions: number
          completed_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          user_id?: string | null
          score?: number
          total_questions?: number
          completed_at?: string
        }
      }
      question_responses: {
        Row: {
          id: string
          response_id: string
          question_id: string
          selected_answer: string | null
          is_correct: boolean
        }
        Insert: {
          id?: string
          response_id: string
          question_id: string
          selected_answer?: string | null
          is_correct: boolean
        }
        Update: {
          id?: string
          response_id?: string
          question_id?: string
          selected_answer?: string | null
          is_correct?: boolean
        }
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
  }
} 