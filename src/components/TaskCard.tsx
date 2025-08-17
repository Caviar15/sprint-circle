import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Lock } from 'lucide-react'
import type { Task, Board } from '@/lib/types'

interface TaskCardProps {
  task: Task
  currentUser: any
  board: Board
  isDragging?: boolean
}

export default function TaskCard({ task, currentUser, board, isDragging = false }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Privacy masking logic
  const isPrivate = task.is_private
  const canViewPrivateTask = !isPrivate || 
    task.creator_id === currentUser?.id || 
    board.owner_id === currentUser?.id

  const displayTitle = canViewPrivateTask ? task.title : 'Private task'
  const displayDescription = canViewPrivateTask ? task.description : null

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? 'shadow-lg rotate-2' : ''
      } ${!canViewPrivateTask ? 'bg-muted/50' : ''}`}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-medium leading-tight ${
              !canViewPrivateTask ? 'text-muted-foreground italic' : ''
            }`}>
              {displayTitle}
            </h4>
            <div className="flex items-center gap-1 flex-shrink-0">
              {isPrivate && (
                <Lock className="w-3 h-3 text-muted-foreground" />
              )}
              {task.estimate_points && task.estimate_points > 0 && (
                <Badge variant="secondary" className="text-xs h-5">
                  {task.estimate_points}
                </Badge>
              )}
            </div>
          </div>
          
          {displayDescription && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {displayDescription}
            </p>
          )}
          
          {task.assignee_id && canViewPrivateTask && (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src="" />
                <AvatarFallback className="text-xs bg-primary/10">
                  U
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}