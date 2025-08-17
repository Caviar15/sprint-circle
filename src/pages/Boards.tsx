import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase, getCurrentUser, type Board } from '@/lib/supabase'
import { Plus, Users, Settings, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Boards() {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    loadBoards()
  }, [])

  const loadBoards = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        navigate('/login')
        return
      }

      // Get boards where user is owner or member
      const { data: userBoards, error: boardsError } = await supabase
        .from('boards')
        .select(`
          *,
          board_members!inner(role)
        `)
        .or(`owner_id.eq.${user.id},board_members.user_id.eq.${user.id}`)

      if (boardsError) throw boardsError

      setBoards(userBoards || [])
    } catch (error) {
      console.error('Error loading boards:', error)
      toast({
        title: "Error",
        description: "Failed to load boards",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createBoard = async () => {
    if (!newBoardName.trim()) return

    setCreating(true)
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      // Create board
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({
          name: newBoardName.trim(),
          owner_id: user.id,
          visibility: 'private',
          sprint_capacity_points: 20
        })
        .select()
        .single()

      if (boardError) throw boardError

      // Create default lanes
      const defaultLanes = [
        { name: 'Backlog', position: 0 },
        { name: 'To Do', position: 1 },
        { name: 'In Progress', position: 2 },
        { name: 'Done', position: 3 }
      ]

      const { error: lanesError } = await supabase
        .from('lanes')
        .insert(
          defaultLanes.map(lane => ({
            board_id: board.id,
            name: lane.name,
            position: lane.position
          }))
        )

      if (lanesError) throw lanesError

      // Add owner as board member
      const { error: memberError } = await supabase
        .from('board_members')
        .insert({
          board_id: board.id,
          user_id: user.id,
          role: 'owner'
        })

      if (memberError) throw memberError

      toast({
        title: "Success",
        description: "Board created successfully"
      })

      setIsCreateDialogOpen(false)
      setNewBoardName('')
      loadBoards()
    } catch (error) {
      console.error('Error creating board:', error)
      toast({
        title: "Error",
        description: "Failed to create board",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Boards</h1>
          <p className="text-muted-foreground">Manage your sprint boards and collaborate with friends</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Board
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Board</DialogTitle>
              <DialogDescription>
                Create a new sprint board to organize your tasks and collaborate with friends.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="boardName">Board Name</Label>
                <Input
                  id="boardName"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="Enter board name..."
                  onKeyDown={(e) => e.key === 'Enter' && createBoard()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createBoard} disabled={creating || !newBoardName.trim()}>
                {creating ? 'Creating...' : 'Create Board'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {boards.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>No boards yet</CardTitle>
            <CardDescription>
              Create your first board to start organizing your sprints with friends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Board
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <Card key={board.id} className="hover:shadow-md transition-shadow cursor-pointer group">
              <Link to={`/boards/${board.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {board.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/boards/${board.id}/settings`}
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      >
                        <Settings className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>Private</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{board.sprint_capacity_points} pts capacity</span>
                    </div>
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}