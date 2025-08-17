"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Board, Lane, Task } from "@/lib/types";
import BoardLane from "@/components/BoardLane";
import TaskCard from "@/components/TaskCard";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import InviteMemberDialog from "@/components/InviteMemberDialog";
import CreateBoardDialog from "@/components/CreateBoardDialog";
import { UserPlus, Target } from "lucide-react";

/**
 * Helper: create a default board + lanes for a user if none exists.
 * Idempotent: if a board already exists, we just return it.
 */
async function ensureBoardForUser(userId: string): Promise<Board> {
  // Try to find an existing board
  const { data: personalBoard, error: boardError } = await supabase
    .from("boards")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();

  if (boardError) throw boardError;
  if (personalBoard) return personalBoard as Board;

  // Create a new board
  const { data: newBoard, error: createErr } = await supabase
    .from("boards")
    .insert({
      owner_id: userId,
      name: "My Personal Board",
      sprint_capacity_points: 20, // sensible default; tweak as you like
    })
    .select("*")
    .single();

  if (createErr) throw createErr;

  // Create default lanes
  const defaultLanes = [
    { name: "To Do", position: 0 },
    { name: "In Progress", position: 1 },
    { name: "Done", position: 2 },
  ].map((l) => ({ ...l, board_id: newBoard.id }));

  const { error: lanesErr } = await supabase.from("lanes").insert(defaultLanes);
  if (lanesErr) throw lanesErr;

  return newBoard as Board;
}

export default function Boards() {
  const [board, setBoard] = useState<Board | null>(null);
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(null);
  const [inviteMemberDialogOpen, setInviteMemberDialogOpen] = useState(false);
  const [createBoardDialogOpen, setCreateBoardDialogOpen] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const sensors = useSensors(useSensor(PointerSensor));
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /**
   * Core loader. Accepts a known board (after ensure) to avoid double queries.
   */
  const loadBoardData = useCallback(
    async (existingBoard?: Board) => {
      if (!user) return;
      try {
        const activeBoard = existingBoard ?? (await ensureBoardForUser(user.id));
        if (!mounted.current) return;

        setBoard(activeBoard);

        // Who is connected to the current user?
        const { data: connectedUsers, error: connectionsError } = await supabase.rpc(
          "get_connected_users",
          { user_uuid: user.id }
        );

        if (connectionsError) {
          // If your RPC isn't deployed yet, we gracefully fallback to just self.
          console.warn("get_connected_users RPC failed; falling back to self-only:", connectionsError);
        }

        const allUserIds = [
          user.id,
          ...((connectedUsers?.map((c: any) => c.connected_user_id) as string[]) || []),
        ];

        // Fetch all tasks from connected users' boards (not just current board)
        const { data: allTasks, error: tasksError } = await supabase
          .from("tasks")
          .select(`
            *,
            profiles!creator_id (
              id,
              name,
              avatar_url
            )
          `)
          .in("creator_id", allUserIds)
          .order("position", { ascending: true });

        if (tasksError) throw tasksError;

        // Fetch lanes
        const { data: boardLanes, error: lanesError } = await supabase
          .from("lanes")
          .select("*")
          .eq("board_id", activeBoard.id)
          .order("position", { ascending: true });

        if (lanesError) throw lanesError;

        if (!mounted.current) return;
        setTasks(allTasks || []);
        setLanes(boardLanes || []);
      } catch (error) {
        console.error("Error loading board:", error);
        if (!mounted.current) return;
        toast({
          title: "Error",
          description: "Failed to load board",
          variant: "destructive",
        });
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [toast, user]
  );

  /**
   * On user available: ensure board exists & load it.
   */
  useEffect(() => {
    if (user) {
      setLoading(true);
      loadBoardData(); // ensureBoardForUser is called inside
    }
  }, [user, loadBoardData]);

  /**
   * Realtime subscriptions (with proper cleanup).
   */
  useEffect(() => {
    if (!board) return;

    const channel = supabase
      .channel(`board-changes-${board.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `board_id=eq.${board.id}` },
        () => loadBoardData(board)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lanes", filter: `board_id=eq.${board.id}` },
        () => loadBoardData(board)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [board, loadBoardData]);

  const handleDragStart = (event: DragStartEvent) => {
    const t = tasks.find((tt) => tt.id === event.active.id);
    setActiveTask(t || null);
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || !board || active.id === over.id) {
        setActiveTask(null);
        return;
      }

      const task = tasks.find((t) => t.id === active.id);

      // Only allow task creator to move their tasks
      if (!task || task.creator_id !== user?.id) {
        setActiveTask(null);
        toast({
          title: "Permission denied",
          description: "You can only move your own tasks",
          variant: "destructive",
        });
        return;
      }

      try {
        const taskId = String(active.id);
        const newLaneId = String(over.id);

        const { error } = await supabase
          .from("tasks")
          .update({ lane_id: newLaneId })
          .eq("id", taskId)
          .eq("creator_id", user.id);

        if (error) throw error;

        // Optimistic update
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, lane_id: newLaneId } as Task : t))
        );

        toast({ title: "Task moved", description: "Task updated successfully" });
      } catch (error) {
        console.error("Error moving task:", error);
        toast({
          title: "Error",
          description: "Failed to move task",
          variant: "destructive",
        });
        loadBoardData(board);
      } finally {
        setActiveTask(null);
      }
    },
    [board, tasks, user, toast, loadBoardData]
  );

  const openCreateTaskDialog = (laneId: string) => {
    setSelectedLaneId(laneId);
    setCreateTaskDialogOpen(true);
  };

  const handleTaskCreated = () => {
    if (board) loadBoardData(board);
  };

  const handleBoardCreated = () => {
    setCreateBoardDialogOpen(false);
    loadBoardData();
  };

  const getToDoPoints = () => {
    const todoLane = lanes.find((lane) => lane.name === "To Do");
    if (!todoLane) return 0;
    return tasks
      .filter((task) => task.lane_id === todoLane.id)
      .reduce((sum, task) => sum + (task.estimate_points || 0), 0);
  };

  const getRemainingPoints = () => {
    if (!board) return 0;
    const cap = board.sprint_capacity_points ?? 0;
    return Math.max(0, cap - getToDoPoints());
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!board) {
    // Should be rare now: ensureBoardForUser creates one. Keep graceful fallback.
    return (
      <div className="container mx-auto py-8">
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>Board Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We couldn't find a board for your account. Create one to get started.
            </p>
            <div className="mt-6 flex justify-center">
              <Button onClick={() => setCreateBoardDialogOpen(true)}>Create Board</Button>
            </div>
          </CardContent>
        </Card>

        <CreateBoardDialog
          open={createBoardDialogOpen}
          onOpenChange={setCreateBoardDialogOpen}
          onBoardCreated={handleBoardCreated}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Board Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">{board.name ?? "My Personal Board"}</h1>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="gap-1">
                  <Target className="w-3 h-3" />
                  Sprint: {board.sprint_capacity_points ?? 0} pts
                </Badge>
                <Badge
                  variant={
                    getToDoPoints() > (board.sprint_capacity_points ?? 0)
                      ? "destructive"
                      : "secondary"
                  }
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
              <Button variant="outline" size="sm" onClick={() => setInviteMemberDialogOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Connect with Friend
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Your personal workspace. Tasks from connected friends appear read-only.
          </p>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-6 p-6 min-w-max">
            {lanes.map((lane) => (
              <div key={lane.id} className="w-80 flex-shrink-0">
                <BoardLane
                  lane={lane}
                  tasks={tasks.filter((task) => task.lane_id === lane.id)}
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

        {/* Create Board Dialog (kept as a manual fallback) */}
        <CreateBoardDialog
          open={createBoardDialogOpen}
          onOpenChange={setCreateBoardDialogOpen}
          onBoardCreated={handleBoardCreated}
        />

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} currentUser={user} board={board} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}