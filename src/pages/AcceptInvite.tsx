import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [inviteData, setInviteData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInviteData()
  }, [token])

  const loadInviteData = async () => {
    if (!token) {
      setError('Invalid invitation link')
      return
    }

    try {
      // Use the secure function to get invitation data
      const { data: inviteData, error: inviteError } = await supabase.rpc('get_invitation_by_token', {
        invitation_token: token
      })

      if (inviteError || !inviteData || inviteData.length === 0) {
        setError('Invitation not found or has expired')
        return
      }

      const invite = inviteData[0]

      // Get inviter information separately
      const { data: inviter } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', invite.inviter_id)
        .single()

      // Combine the data
      const enrichedInvite = {
        ...invite,
        inviter: inviter
      }

      setInviteData(enrichedInvite)
    } catch (error) {
      console.error('Error loading invite:', error)
      setError('Failed to load invitation')
    }
  }

  const acceptInvitation = async () => {
    if (!user || !inviteData) return

    setLoading(true)
    try {
      // Create user connection
      const { error: connectionError } = await supabase
        .from('user_connections')
        .insert({
          user1_id: inviteData.inviter_id,
          user2_id: user.id,
          invited_by: inviteData.inviter_id,
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })

      if (connectionError) throw connectionError

      // Update invite status
      const { error: updateError } = await supabase
        .from('invites')
        .update({ status: 'accepted' })
        .eq('token', token)

      if (updateError) throw updateError

      toast({
        title: "Connection established!",
        description: `You're now connected with ${inviteData.inviter.name || 'your friend'}. You can see each other's tasks.`
      })

      navigate('/boards')
    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast({
        title: "Error",
        description: "Failed to accept invitation",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const declineInvitation = async () => {
    if (!inviteData) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('invites')
        .update({ status: 'declined' })
        .eq('token', token)

      if (error) throw error

      toast({
        title: "Invitation declined",
        description: "You have declined the connection request"
      })

      navigate('/')
    } catch (error) {
      console.error('Error declining invitation:', error)
      toast({
        title: "Error",
        description: "Failed to decline invitation",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              Please sign in to accept this invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connection Request</CardTitle>
          <CardDescription>
            {inviteData.inviter.name || 'Someone'} wants to connect with you on SprintWithFriends
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm">
              When you connect, you'll be able to see each other's tasks in your personal boards. 
              This creates a direct 1-on-1 connection for collaborative task management.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={acceptInvitation} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Connecting...' : 'Accept & Connect'}
            </Button>
            <Button 
              variant="outline" 
              onClick={declineInvitation}
              disabled={loading}
              className="flex-1"
            >
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}