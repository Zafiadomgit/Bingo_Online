export interface Profile {
  id: string
  email: string
  display_name: string | null
  credits: number
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export interface BingoGame {
  id: string
  name: string
  max_cards: number
  card_price: number
  status: "waiting" | "active" | "finished" | "WAITING" | "ACTIVE" | "FINISHED"
  current_number: number | null
  numbers_called: number[]
  winner_id: string | null
  created_at: string
  started_at: string | null
  finished_at: string | null
  prize_line: number
  prize_two_lines: number
  prize_full_card: number
  currency?: string
  line_winners?: any[]
  two_lines_winners?: any[]
  full_card_winners?: any[]
}

export interface Winner {
  card_id: string
  card_number: number
  user_id: string
  user_email: string
  user_name?: string
  prize_type: 'line' | 'two_lines' | 'full_card'
  prize_amount: number
  won_at: string
}

export interface BingoCard {
  id: string
  game_id: string
  user_id: string
  card_number: number
  numbers: number[]
  marked_positions: boolean[]
  is_winner: boolean
  created_at: string
}

export interface Payment {
  id: string
  user_id: string
  game_id: string
  amount: number
  status: "pending" | "completed" | "failed"
  payment_method: string
  created_at: string
  completed_at: string | null
}
