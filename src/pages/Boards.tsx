import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'

export default function Boards() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const redirectToPersonalBoard = async () => {
      if (!user) return

      try {
        // Get user's personal board
        const { data: personalBoard, error } = await supabase
          .from('boards')
          .select('id')
          .eq('owner_id', user.id)
          .single()

        if (error) throw error

        // Redirect to personal board
        navigate(`/boards/${personalBoard.id}`, { replace: true })
      } catch (error) {
        console.error('Error finding personal board:', error)
        // If no personal board found, this should not happen with the new user trigger
        // but as fallback, stay on this page
      }
    }

    redirectToPersonalBoard()
  }, [user, navigate])

  // Show loading while redirecting
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    </div>
  )
}