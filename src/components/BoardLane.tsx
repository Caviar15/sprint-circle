import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import type { Lane, Task, Board } from '@/lib/types'
import TaskCard from './TaskCard'

interface BoardLaneProps {
  lane: Lane
  tasks: Task[]
  currentUser: any
  board: Board
  onCreateTask: () => void
}

export default function BoardLane({ lane, tasks, currentUser, board, onCreateTask }: BoardLaneProps) {
  const { setNodeRef } = useDroppable({
    id: lane.id,
  })

  const getTotalPoints = () => {
    return tasks.reduce((sum, task) => sum + (task.estimate_points || 0), 0)
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{lane.name}</CardTitle>
          <div className="flex items-center gap-2">
            {tasks.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {getTotalPoints()} pts
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {tasks.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-8 text-muted-foreground hover:text-foreground"
          onClick={onCreateTask}
        >
          <Plus className="w-4 h-4" />
          Add task
        </Button>

        <div ref={setNodeRef} className="space-y-3 min-h-[200px]">
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                currentUser={currentUser}
                board={board}
              />
            ))}
          </SortableContext>
        </div>
      </CardContent>
    </Card>
  )
}