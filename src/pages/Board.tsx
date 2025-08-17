import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase, getCurrentUser, type Board, type Lane, type Task } from '@/lib/supabase'
import { Settings, Plus, Lock, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import BoardLane from '@/components/BoardLane'
import TaskCard from '@/components/TaskCard'
import CreateTaskDialog from '@/components/CreateTaskDialog'

export default function Board() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [board, setBoard] = useState<Board | null>(null)
  const [lanes, setLanes] = useState<Lane[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [createTaskLaneId, setCreateTaskLaneId] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadBoardData()
      setupRealtimeSubscription()
    }
  }, [id])

  const loadBoardData = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        navigate('/login')
        return
      }
      setCurrentUser(user)

      // Load board
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', id)
        .single()

      if (boardError) throw boardError
      setBoard(boardData)

      // Load lanes
      const { data: lanesData, error: lanesError } = await supabase
        .from('lanes')
        .select('*')
        .eq('board_id', id)
        .order('position')

      if (lanesError) throw lanesError
      setLanes(lanesData || [])

      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('board_id', id)
        .order('position')

      if (tasksError) throw tasksError
      setTasks(tasksData || [])
    } catch (error) {
      console.error('Error loading board:', error)
      toast({
        title: "Error",
        description: "Failed to load board",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`board-${id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks', filter: `board_id=eq.${id}` },
        () => loadBoardData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'lanes', filter: `board_id=eq.${id}` },
        () => loadBoardData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over || active.id === over.id) return

    const taskId = active.id as string
    const newLaneId = over.id as string

    try {
      // Update task's lane
      const { error } = await supabase
        .from('tasks')
        .update({ lane_id: newLaneId })
        .eq('id', taskId)

      if (error) throw error

      // Optimistically update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, lane_id: newLaneId } : task
      ))
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        title: "Error",
        description: "Failed to move task",
        variant: "destructive"
      })
    }
  }

  const openCreateTask = (laneId: string) => {
    setCreateTaskLaneId(laneId)
    setIsCreateTaskOpen(true)
  }

  const getToDoPoints = () => {
    const toDoLane = lanes.find(lane => lane.name === 'To Do')
    if (!toDoLane) return 0
    
    return tasks
      .filter(task => task.lane_id === toDoLane.id)
      .reduce((sum, task) => sum + (task.estimate_points || 0), 0)
  }

  const getRemainingPoints = () => {
    const capacity = board?.sprint_capacity_points || 0
    const inToDo = getToDoPoints()
    return Math.max(0, capacity - inToDo)
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

  if (!board) {
    return (
      <div className="container mx-auto py-8">
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>Board Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/boards">Back to Boards</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      {/* Board Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{board.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="outline" className="gap-1">
              <Users className="w-3 h-3" />
              Private
            </Badge>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Committed:</span> {board.sprint_capacity_points} pts
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">In To Do:</span> {getToDoPoints()} pts
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Remaining:</span> {getRemainingPoints()} pts
            </div>
          </div>
        </div>
        
        <Button variant="outline" asChild>
          <Link to={`/boards/${id}/settings`} className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </Button>
      </div>

      {/* Kanban Board */}
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {lanes.map((lane) => (
            <BoardLane
              key={lane.id}
              lane={lane}
              tasks={tasks.filter(task => task.lane_id === lane.id)}
              currentUser={currentUser}
              board={board}
              onCreateTask={() => openCreateTask(lane.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <TaskCard
              task={activeTask}
              currentUser={currentUser}
              board={board}
              isDragging={true}
            />
          )}
        </DragOverlay>
      </DndContext>

      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        boardId={id!}
        laneId={createTaskLaneId}
        onTaskCreated={loadBoardData}
      />
    </div>
  )
}