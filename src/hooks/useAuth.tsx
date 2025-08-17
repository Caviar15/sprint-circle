import { useState, useEffect, createContext, useContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        
        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in:', session.user.email)
          toast({
            title: "Welcome!",
            description: "You've been signed in successfully."
          })
        }

        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed for:', session?.user?.email)
        }
      }
    )

    // Handle URL fragments for magic link authentication
    const handleAuthCallback = async () => {
      try {
        // Check if we have auth tokens in the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        
        if (accessToken) {
          console.log('Processing auth callback from URL')
          // Supabase will automatically handle the session from URL fragments
          // Just trigger a session check
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Error processing auth callback:', error)
            toast({
              title: "Authentication Error",
              description: "Failed to process login. Please try again.",
              variant: "destructive"
            })
          } else if (session && mounted) {
            console.log('Session established from URL callback')
            setSession(session)
            setUser(session.user)
            setLoading(false)
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname)
          }
        } else {
          // No auth tokens in URL, check for existing session
          const { data: { session } } = await supabase.auth.getSession()
          if (mounted) {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('Error in auth initialization:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    handleAuthCallback()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [toast])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      })
    }
  }

  const signInWithEmail = async (email: string) => {
    const redirectUrl = `${window.location.origin}/boards`
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl
      }
    })
    
    return { error }
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signOut,
      signInWithEmail
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}