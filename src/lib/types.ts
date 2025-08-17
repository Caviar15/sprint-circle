// Database types
export interface Profile {
  id: string
  name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Board {
  id: string
  owner_id: string
  name: string
  visibility: string
  sprint_capacity_points: number
  created_at: string
}

export interface BoardMember {
  board_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  created_at: string
}

export interface Lane {
  id: string
  board_id: string
  name: string
  position: number
  created_at: string
}

export interface Task {
  id: string
  board_id: string
  lane_id: string | null
  title: string
  description: string | null
  assignee_id: string | null
  estimate_points: number
  position: number
  is_private: boolean
  creator_id: string
  created_at: string
}

export interface Invite {
  id: string
  board_id: string
  invited_email: string
  inviter_id: string | null
  token: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expires_at: string
  created_at: string
}