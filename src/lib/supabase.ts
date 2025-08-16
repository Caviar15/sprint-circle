import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fbbrlmokqmcglhmstfod.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiYnJsbW9rcW1jZ2xobXN0Zm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjUxMzIsImV4cCI6MjA3MDk0MTEzMn0.1mqStFmmoI-33Fq7WIH72U_jm8ud2gM7Rx8nKEBkS8M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  visibility: 'private' | 'friends' | 'public'
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

// Auth helpers
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const signOut = async () => {
  await supabase.auth.signOut()
}

export const signInWithEmail = async (email: string) => {
  return await supabase.auth.signInWithOtp({ email })
}