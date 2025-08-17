import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import type { Board, Lane, Task } from '@/lib/types'
import BoardLane from '@/components/BoardLane'
import TaskCard from '@/components/TaskCard'
import CreateTaskDialog from '@/components/CreateTaskDialog'
import InviteMemberDialog from '@/components/InviteMemberDialog'
import { Plus, Users, Settings, Target, UserPlus } from 'lucide-react'

export default function Board() {
  const { id } = useParams<{ id: string }>()
  const [board, setBoard] = useState<Board | null>(null)
  const [lanes, setLanes] = useState<Lane[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false)
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(null)
  const [inviteMemberDialogOpen, setInviteMemberDialogOpen] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    if (id && user) {
      loadBoardData()
      setupRealtimeSubscription()
    }
  }, [id, user])

  const loadBoardData = async () => {
    if (!id || !user) return

    try {
      // Load board data using RLS
      const [boardResult, lanesResult, tasksResult] = await Promise.all([
        supabase.from('boards').select('*').eq('id', id).single(),
        supabase.from('lanes').select('*').eq('board_id', id).order('position'),
        supabase.from('tasks').select('*').eq('board_id', id).order('position')
      ])

      if (boardResult.error) throw boardResult.error
      if (lanesResult.error) throw lanesResult.error
      if (tasksResult.error) throw tasksResult.error

      setBoard(boardResult.data)
      setLanes(lanesResult.data || [])
      setTasks(tasksResult.data || [])
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
    if (!id) return

    const channel = supabase
      .channel('board-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `board_id=eq.${id}` }, () => {
        loadBoardData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lanes', filter: `board_id=eq.${id}` }, () => {
        loadBoardData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || !board || active.id === over.id) {
      setActiveTask(null)
      return
    }

    try {
      const taskId = active.id as string
      const newLaneId = over.id as string
      
      // Update task lane
      const { error } = await supabase
        .from('tasks')
        .update({ lane_id: newLaneId })
        .eq('id', taskId)

      if (error) throw error

      // Optimistically update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, lane_id: newLaneId } : task
      ))

      toast({
        title: "Task moved",
        description: "Task updated successfully"
      })
    } catch (error) {
      console.error('Error moving task:', error)
      toast({
        title: "Error",
        description: "Failed to move task",
        variant: "destructive"
      })
      // Reload data on error
      loadBoardData()
    } finally {
      setActiveTask(null)
    }
  }, [board, toast])

  const openCreateTaskDialog = (laneId: string) => {
    setSelectedLaneId(laneId)
    setCreateTaskDialogOpen(true)
  }

  const handleTaskCreated = () => {
    loadBoardData()
  }

  const getToDoPoints = () => {
    const todoLane = lanes.find(lane => lane.name === 'To Do')
    if (!todoLane) return 0
    return tasks
      .filter(task => task.lane_id === todoLane.id)
      .reduce((sum, task) => sum + (task.estimate_points || 0), 0)
  }

  const getRemainingPoints = () => {
    if (!board) return 0
    return Math.max(0, board.sprint_capacity_points - getToDoPoints())
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
            <p className="text-muted-foreground">The board you're looking for doesn't exist or you don't have access to it.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Board Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">{board.name}</h1>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="gap-1">
                  <Users className="w-3 h-3" />
                  {board.visibility}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Target className="w-3 h-3" />
                  Sprint: {board.sprint_capacity_points} pts
                </Badge>
                <Badge 
                  variant={getToDoPoints() > board.sprint_capacity_points ? "destructive" : "secondary"}
                  className="gap-1"
                >
                  Committed: {getToDoPoints()} pts
                </Badge>
                <Badge variant="outline" className="gap-1">
                  Remaining: {getRemainingPoints()} pts
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setInviteMemberDialogOpen(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-6 p-6 min-w-max">
            {lanes.map((lane) => (
              <div key={lane.id} className="w-80 flex-shrink-0">
                <BoardLane
                  lane={lane}
                  tasks={tasks.filter(task => task.lane_id === lane.id)}
                  currentUser={user}
                  board={board}
                  onCreateTask={() => openCreateTaskDialog(lane.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Task Creation Dialog */}
        <CreateTaskDialog
          open={createTaskDialogOpen}
          onOpenChange={setCreateTaskDialogOpen}
          boardId={board.id}
          laneId={selectedLaneId}
          onTaskCreated={handleTaskCreated}
        />

        {/* Invite Member Dialog */}
        <InviteMemberDialog
          open={inviteMemberDialogOpen}
          onOpenChange={setInviteMemberDialogOpen}
          boardId={board.id}
        />

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              currentUser={user}
              board={board}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}