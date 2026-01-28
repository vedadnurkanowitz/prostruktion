"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  ListTodo,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  Circle,
  MoreVertical,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// DnD Imports
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Priority = "low" | "medium" | "high" | "critical";
type TodoStatus = "todo" | "in_progress" | "done";

type Todo = {
  id: string;
  task: string;
  description: string;
  deadline: string;
  beneficiary: string;
  priority: Priority;
  status: TodoStatus;
  is_completed: boolean;
  user_id: string;
  created_at: string;
};

type Contact = {
  id: string;
  name: string;
  role: string;
};

// Sortable Item Component
function SortableTaskCard({
  todo,
  updateStatus,
  deleteTodo,
  getPriorityBadge,
}: {
  todo: Todo;
  updateStatus: (id: string, status: TodoStatus) => void;
  deleteTodo: (id: string) => void;
  getPriorityBadge: (p: Priority) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: todo.id,
    data: {
      type: "Task",
      todo,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 h-[150px]"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative backdrop-blur-md bg-white/60 dark:bg-gray-900/40 p-4 rounded-xl border border-white/20 dark:border-white/10 shadow-sm hover:shadow-md transition-all hover:border-white/30 dark:hover:border-white/15 cursor-default"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className={cn(
            "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border",
            getPriorityBadge(todo.priority),
          )}
        >
          {todo.priority}
        </span>

        <div className="flex items-center">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 mr-1 touch-none"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-2 text-gray-400 hover:text-gray-600"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Move to...</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => updateStatus(todo.id, "todo")}
                disabled={todo.status === "todo"}
              >
                To Do
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => updateStatus(todo.id, "in_progress")}
                disabled={todo.status === "in_progress"}
              >
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => updateStatus(todo.id, "done")}
                disabled={todo.status === "done"}
              >
                Done
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => deleteTodo(todo.id)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-1 leading-snug">
        {todo.task}
      </h4>

      {todo.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
          {todo.description}
        </p>
      )}

      <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        {todo.deadline && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>{todo.deadline}</span>
          </div>
        )}
        {todo.beneficiary && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <User className="h-3 w-3" />
            <span className="truncate">For: {todo.beneficiary}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Kanban Column Component
function KanbanColumn({
  column,
  todos,
  updateStatus,
  deleteTodo,
  getPriorityBadge,
}: {
  column: { id: TodoStatus; label: string; icon: any; color: string };
  todos: Todo[];
  updateStatus: (id: string, status: TodoStatus) => void;
  deleteTodo: (id: string) => void;
  getPriorityBadge: (p: Priority) => string;
}) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col h-full backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 p-4 rounded-2xl border border-white/20 dark:border-white/10 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-800/50">
        <column.icon className={cn("h-4 w-4", column.color)} />
        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
          {column.label}
        </h3>
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
          {todos.length}
        </span>
      </div>

      <SortableContext
        items={todos.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-3 min-h-[100px]">
          {todos.map((todo) => (
            <SortableTaskCard
              key={todo.id}
              todo={todo}
              updateStatus={updateStatus}
              deleteTodo={deleteTodo}
              getPriorityBadge={getPriorityBadge}
            />
          ))}

          {todos.length === 0 && (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg min-h-[100px] bg-gray-50/50 dark:bg-gray-900/10">
              <span className="text-xs text-gray-400 font-medium">
                Drop here
              </span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<Todo | null>(null);

  // Form State
  const [task, setTask] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [status, setStatus] = useState<TodoStatus>("todo");

  // New States for Beneficiary Selection
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [beneficiaryType, setBeneficiaryType] = useState<"contact" | "manual">(
    "contact",
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    // Fetch Todos
    const storedTodos = localStorage.getItem("prostruktion_todos");
    if (storedTodos) {
      try {
        const parsedTodos = JSON.parse(storedTodos);
        const migratedTodos = parsedTodos.map((t: any) => ({
          ...t,
          status: t.status ? t.status : t.is_completed ? "done" : "todo",
          priority: t.priority || "medium",
          description: t.description || "",
          deadline: t.deadline || "",
          beneficiary: t.beneficiary || "",
        }));
        setTodos(migratedTodos);
      } catch (e) {
        console.error("Failed to parse todos", e);
      }
    }
    setIsLoading(false);
  }, []);

  // Fetch Contacts
  useEffect(() => {
    async function fetchContacts() {
      const allContacts: Contact[] = [];

      // 1. Supabase Profiles
      try {
        const supabase = createClient();
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, role");
        if (profiles) {
          profiles.forEach((p) => {
            let derivedRole = "partner";
            if (p.role === "broker") derivedRole = "broker";
            if (p.role === "super_admin") derivedRole = "staff";

            allContacts.push({
              id: p.id,
              name: p.full_name || p.email || "Unknown",
              role: derivedRole,
            });
          });
        }
      } catch (e) {
        console.error("Supabase fetch error", e);
      }

      // 2. LocalStorage Helpers
      const loadFromLocal = (key: string, role: string) => {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const items = JSON.parse(stored);
            items.forEach((item: any) => {
              if (!allContacts.some((c) => c.name === item.name)) {
                allContacts.push({
                  id: `${role}-${item.name}`,
                  name: item.name,
                  role: role,
                });
              }
            });
          }
        } catch (e) {}
      };

      loadFromLocal("prostruktion_subcontractors", "subcontractor");
      loadFromLocal("prostruktion_contractors", "contractor");
      loadFromLocal("prostruktion_partners", "partner");
      loadFromLocal("prostruktion_mediators", "broker");

      setContacts(allContacts);
    }

    fetchContacts();
  }, []);

  const saveTodos = (newTodos: Todo[]) => {
    setTodos(newTodos);
    localStorage.setItem("prostruktion_todos", JSON.stringify(newTodos));
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;

    setIsAdding(true);

    setTimeout(() => {
      const newTodo: Todo = {
        id: crypto.randomUUID(),
        task,
        description,
        deadline,
        beneficiary,
        priority,
        status: status || "todo",
        is_completed: status === "done",
        user_id: "local-user",
        created_at: new Date().toISOString(),
      };

      saveTodos([newTodo, ...todos]);

      // Reset form
      setTask("");
      setDescription("");
      setDeadline("");
      setBeneficiary("");
      setPriority("medium");
      setStatus("todo");

      setIsAdding(false);
      setIsDialogOpen(false);
    }, 300);
  };

  const updateStatus = (id: string, newStatus: TodoStatus) => {
    const updatedTodos = todos.map((todo) =>
      todo.id === id
        ? {
            ...todo,
            status: newStatus,
            is_completed: newStatus === "done",
          }
        : todo,
    );
    saveTodos(updatedTodos);
  };

  const deleteTodo = (id: string) => {
    const updatedTodos = todos.filter((todo) => todo.id !== id);
    saveTodos(updatedTodos);
  };

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
      case "low":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    }
  };

  const columns: { id: TodoStatus; label: string; icon: any; color: string }[] =
    [
      { id: "todo", label: "To Do", icon: Circle, color: "text-gray-500" },
      {
        id: "in_progress",
        label: "In Progress",
        icon: Clock,
        color: "text-blue-500",
      },
      {
        id: "done",
        label: "Done",
        icon: CheckCircle2,
        color: "text-green-500",
      },
    ];

  // --- DnD Handlers ---

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = todos.find((t) => t.id === active.id);
    if (item) setActiveDragItem(item);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";

    if (!isActiveTask) return;

    // Dropping a Task over another Task
    if (isActiveTask && isOverTask) {
      const activeIndex = todos.findIndex((t) => t.id === activeId);
      const overIndex = todos.findIndex((t) => t.id === overId);

      if (todos[activeIndex].status !== todos[overIndex].status) {
        const updatedTodos = [...todos];
        updatedTodos[activeIndex].status = todos[overIndex].status;
        updatedTodos[activeIndex].is_completed =
          todos[overIndex].status === "done";

        // Reorder locally for fluid UI
        const reorderedTodos = arrayMove(updatedTodos, activeIndex, overIndex);
        setTodos(reorderedTodos);
      } else {
        // Same column reorder
        const reorderedTodos = arrayMove(todos, activeIndex, overIndex);
        setTodos(reorderedTodos);
      }
    }

    // Dropping a Task over a Column
    const isOverColumn = columns.some((col) => col.id === overId);
    if (isActiveTask && isOverColumn) {
      const activeIndex = todos.findIndex((t) => t.id === activeId);
      const newStatus = overId as TodoStatus;

      if (todos[activeIndex].status !== newStatus) {
        const updatedTodos = [...todos];
        updatedTodos[activeIndex].status = newStatus;
        updatedTodos[activeIndex].is_completed = newStatus === "done";
        setTodos(updatedTodos);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over) return;

    // Save final state to localStorage
    saveTodos(todos);
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  };

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-xl bg-white/40 dark:bg-gray-900/30 border border-white/20 dark:border-white/10 shadow-sm rounded-2xl p-6">
        {/* Header and Add Button Area */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
              <ListTodo className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Task Board
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage tasks with Kanban workflow
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-500 text-gray-900 hover:bg-yellow-400 font-semibold shadow-sm w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
                <DialogDescription>
                  Create a new task card for your board.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={addTodo} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="task">Task Name</Label>
                  <Input
                    id="task"
                    placeholder="What needs to be done?"
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    className="bg-white dark:bg-gray-900"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Detailed Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide more context..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-white dark:bg-gray-900 resize-none h-24"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="bg-white dark:bg-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority Limit</Label>
                    <Select
                      value={priority}
                      onValueChange={(v: Priority) => setPriority(v)}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-900">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Initial Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v: TodoStatus) => setStatus(v)}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-900">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Beneficiary Selection Section */}
                <div className="space-y-3 pt-2">
                  <Label>Beneficiary Type</Label>
                  {/* Custom Toggle using standard Buttons since RadioGroup might be missing */}
                  <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-max">
                    <button
                      type="button"
                      onClick={() => {
                        setBeneficiaryType("contact");
                        setBeneficiary("");
                      }}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                        beneficiaryType === "contact"
                          ? "bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-gray-100"
                          : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
                      )}
                    >
                      Select Contact
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBeneficiaryType("manual");
                        setBeneficiary("");
                      }}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                        beneficiaryType === "manual"
                          ? "bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-gray-100"
                          : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
                      )}
                    >
                      Manual Entry
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="beneficiary">Beneficiary</Label>
                  {beneficiaryType === "contact" ? (
                    <Select value={beneficiary} onValueChange={setBeneficiary}>
                      <SelectTrigger className="bg-white dark:bg-gray-900">
                        <SelectValue placeholder="Select a contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "subcontractor",
                          "partner",
                          "contractor",
                          "broker",
                          "staff",
                        ].map((role) => {
                          const roleContacts = contacts.filter(
                            (c) => c.role === role,
                          );
                          if (roleContacts.length === 0) return null;
                          return (
                            <SelectGroup key={role}>
                              <SelectLabel className="capitalize pl-2 text-xs text-muted-foreground">
                                {role === "broker" ? "Mediator" : role}
                              </SelectLabel>
                              {roleContacts.map((c) => (
                                <SelectItem key={c.id} value={c.name}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          );
                        })}
                        {contacts.filter(
                          (c) =>
                            ![
                              "subcontractor",
                              "partner",
                              "contractor",
                              "broker",
                              "staff",
                            ].includes(c.role),
                        ).length > 0 && (
                          <SelectGroup>
                            <SelectLabel className="pl-2 text-xs text-muted-foreground">
                              Others
                            </SelectLabel>
                            {contacts
                              .filter(
                                (c) =>
                                  ![
                                    "subcontractor",
                                    "partner",
                                    "contractor",
                                    "broker",
                                    "staff",
                                  ].includes(c.role),
                              )
                              .map((c) => (
                                <SelectItem key={c.id} value={c.name}>
                                  {c.name}
                                </SelectItem>
                              ))}
                          </SelectGroup>
                        )}
                        {contacts.length === 0 && (
                          <div className="p-2 text-xs text-center text-muted-foreground">
                            No contacts found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="beneficiary"
                      placeholder="Enter beneficiary name"
                      value={beneficiary}
                      onChange={(e) => setBeneficiary(e.target.value)}
                      className="bg-white dark:bg-gray-900"
                    />
                  )}
                </div>

                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isAdding || !task.trim()}
                    className="bg-yellow-500 text-gray-900 hover:bg-yellow-400 font-semibold"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      "Create Card"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Board Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
              {columns.map((col) => {
                const colTodos = todos.filter((t) => t.status === col.id);
                return (
                  <KanbanColumn
                    key={col.id}
                    column={col}
                    todos={colTodos}
                    updateStatus={updateStatus}
                    deleteTodo={deleteTodo}
                    getPriorityBadge={getPriorityBadge}
                  />
                );
              })}
            </div>

            {/* Drag Overlay for smooth preview */}
            <DragOverlay dropAnimation={dropAnimation}>
              {activeDragItem ? (
                <div className="group relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 p-4 rounded-xl border border-yellow-400/50 shadow-lg cursor-grabbing rotate-2 w-[300px]">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border",
                        getPriorityBadge(activeDragItem.priority),
                      )}
                    >
                      {activeDragItem.priority}
                    </span>
                    <div className="p-1 text-gray-400 mr-1">
                      <GripVertical className="h-4 w-4" />
                    </div>
                  </div>

                  <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-1 leading-snug">
                    {activeDragItem.task}
                  </h4>

                  {activeDragItem.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                      {activeDragItem.description}
                    </p>
                  )}

                  <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    {/* Placeholder for footer data */}
                    <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </Card>
    </div>
  );
}
