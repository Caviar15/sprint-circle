import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase, getCurrentUser } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boardId: string
  laneId: string | null
  onTaskCreated: () => void
}

export default function CreateTaskDialog({ 
  open, 
  onOpenChange, 
  boardId, 
  laneId, 
  onTaskCreated 
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [estimatePoints, setEstimatePoints] = useState('1')
  const [isPrivate, setIsPrivate] = useState(false)
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!title.trim() || !laneId) return

    setCreating(true)
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('tasks')
        .insert({
          board_id: boardId,
          lane_id: laneId,
          title: title.trim(),
          description: description.trim() || null,
          estimate_points: parseInt(estimatePoints),
          is_private: isPrivate,
          creator_id: user.id,
          position: 0 // TODO: Calculate proper position
        })

      if (error) throw error

      toast({
        title: "Success",
        description: "Task created successfully"
      })

      // Reset form
      setTitle('')
      setDescription('')
      setEstimatePoints('1')
      setIsPrivate(false)
      onOpenChange(false)
      onTaskCreated()
    } catch (error) {
      console.error('Error creating task:', error)
      toast({
        title: "Error",
        description: "Failed to create task",
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
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your sprint board.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description..."
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="points">Estimate Points</Label>
            <Select value={estimatePoints} onValueChange={setEstimatePoints}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 5, 8, 13].map(point => (
                  <SelectItem key={point} value={point.toString()}>
                    {point} {point === 1 ? 'point' : 'points'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
            <Label htmlFor="private">Private task (only visible to you and board owner)</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={creating || !title.trim()}>
            {creating ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}