export interface Profile {
  id: string
  email: string
  display_name: string | null
  credits: number
  created_at: string
  updated_at: string
}

export interface BingoGame {
  id: string
  name: string
  max_cards: number
  card_price: number
  status: "waiting" | "active" | "finished"
  current_number: number | null
  numbers_called: number[]
  winner_id: string | null
  created_at: string
  started_at: string | null
  finished_at: string | null
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
