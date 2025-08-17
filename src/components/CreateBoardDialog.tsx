import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'

interface CreateBoardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBoardCreated: () => void
}

export default function CreateBoardDialog({ open, onOpenChange, onBoardCreated }: CreateBoardDialogProps) {
  const [boardName, setBoardName] = useState('My Personal Board')
  const [creating, setCreating] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const handleCreateBoard = async () => {
    if (!boardName.trim() || !user) return
    
    setCreating(true)
    try {
      // Create the board
      const { data: newBoard, error: boardError } = await supabase
        .from('boards')
        .insert({
          name: boardName.trim(),
          owner_id: user.id,
          visibility: 'private',
          sprint_capacity_points: 20
        })
        .select()
        .single()

      if (boardError) throw boardError

      // The trigger should automatically create lanes, but let's make sure
      const { data: existingLanes } = await supabase
        .from('lanes')
        .select('id')
        .eq('board_id', newBoard.id)

      if (!existingLanes || existingLanes.length === 0) {
        // Create default lanes if they don't exist
        const { error: lanesError } = await supabase
          .from('lanes')
          .insert([
            { board_id: newBoard.id, name: 'To Do', position: 1 },
            { board_id: newBoard.id, name: 'In Progress', position: 2 },
            { board_id: newBoard.id, name: 'Done', position: 3 }
          ])

        if (lanesError) throw lanesError
      }

      toast({
        title: "Success",
        description: "Your personal board has been created successfully."
      })

      onBoardCreated()
      onOpenChange(false)
      setBoardName('My Personal Board')
    } catch (error) {
      console.error('Error creating board:', error)
      toast({
        title: "Error",
        description: "Failed to create board. Please try again.",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Your Personal Board</DialogTitle>
          <DialogDescription>
            You need to create your first personal board to get started with task management.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="boardName">Board Name</Label>
            <Input
              id="boardName"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder="Enter board name..."
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleCreateBoard} 
            disabled={creating || !boardName.trim()}
          >
            {creating ? 'Creating...' : 'Create Board'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}