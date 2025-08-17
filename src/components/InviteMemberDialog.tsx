import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Loader2, Mail } from 'lucide-react'

interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boardId: string
}

export default function InviteMemberDialog({ open, onOpenChange, boardId }: InviteMemberDialogProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      })
      return
    }

    if (!email.includes('@')) {
      toast({
        title: "Error", 
        description: "Please enter a valid email address",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      // Generate a unique invitation token
      const token = crypto.randomUUID()

      // Insert invitation into database
      const { error } = await supabase
        .from('invites')
        .insert({
          board_id: boardId,
          invited_email: email.trim().toLowerCase(),
          token,
          status: 'pending'
        })

      if (error) throw error

      // Call edge function to send invitation email
      const { error: emailError } = await supabase.functions.invoke('send-invitation', {
        body: {
          email: email.trim().toLowerCase(),
          boardId,
          token,
          role
        }
      })

      if (emailError) {
        console.warn('Failed to send invitation email:', emailError)
        // Don't fail the whole process if email fails
        toast({
          title: "Invitation created",
          description: "Invitation created but email could not be sent. You can share the invitation link manually.",
          variant: "default"
        })
      } else {
        toast({
          title: "Invitation sent",
          description: `Invitation sent to ${email}`
        })
      }

      // Reset form and close dialog
      setEmail('')
      setRole('editor')
      onOpenChange(false)

    } catch (error: any) {
      console.error('Error creating invitation:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invite Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to collaborate on this board
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: 'editor' | 'viewer') => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor - Can create and edit tasks</SelectItem>
                <SelectItem value="viewer">Viewer - Can only view the board</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}