"use client";

import { useEffect, useState } from "react";

import { Plus, Trash2, Check, Loader2, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Todo = {
  id: string;
  task: string;
  is_completed: boolean;
  user_id: string;
  created_at: string;
};

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    // Load from LocalStorage to ensure it works immediately without SQL setup
    const storedTodos = localStorage.getItem("prostruktion_todos");
    if (storedTodos) {
      try {
        setTodos(JSON.parse(storedTodos));
      } catch (e) {
        console.error("Failed to parse todos", e);
      }
    }
    setIsLoading(false);
  }, []);

  const saveTodos = (newTodos: Todo[]) => {
    setTodos(newTodos);
    localStorage.setItem("prostruktion_todos", JSON.stringify(newTodos));
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    setIsAdding(true);

    // Simulate network delay for UX
    setTimeout(() => {
      const newTodo: Todo = {
        id: crypto.randomUUID(),
        task: newTask,
        is_completed: false,
        user_id: "local-user",
        created_at: new Date().toISOString(),
      };

      saveTodos([newTodo, ...todos]);
      setNewTask("");
      setIsAdding(false);
    }, 300);
  };

  const toggleTodo = (id: string, currentStatus: boolean) => {
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, is_completed: !currentStatus } : todo,
    );
    saveTodos(updatedTodos);
  };

  const deleteTodo = (id: string) => {
    const updatedTodos = todos.filter((todo) => todo.id !== id);
    saveTodos(updatedTodos);
  };

  // Separation of tasks
  const activeTodos = todos.filter((t) => !t.is_completed);
  const completedTodos = todos.filter((t) => t.is_completed);

  return (
    <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-2 pb-6 border-b border-gray-100 dark:border-gray-900">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
          <ListTodo className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
        </div>
        <div>
          <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Task Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage your daily tasks and priorities
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={addTodo} className="flex gap-3 mb-8">
          <Input
            type="text"
            placeholder="What needs to be done?"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="flex-1 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus-visible:ring-yellow-500"
          />
          <Button
            type="submit"
            disabled={isAdding || !newTask.trim()}
            className="bg-yellow-500 text-gray-900 hover:bg-yellow-400 font-semibold px-6 transition-all shadow-sm hover:shadow-md"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add Task
          </Button>
        </form>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
          ) : todos.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
              <div className="flex justify-center mb-3">
                <ListTodo className="h-10 w-10 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                No tasks found
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Add a new task above to get started
              </p>
            </div>
          ) : (
            <>
              {/* Active Tasks */}
              {activeTodos.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 pl-1">
                    Active Tasks ({activeTodos.length})
                  </h3>
                  {activeTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="group flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-yellow-400 dark:hover:border-yellow-500/50 transition-all shadow-sm hover:shadow-md"
                    >
                      <button
                        onClick={() => toggleTodo(todo.id, todo.is_completed)}
                        className="shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-yellow-500 dark:hover:border-yellow-500 flex items-center justify-center transition-all bg-transparent"
                      >
                        <span className="sr-only">Complete</span>
                      </button>
                      <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                        {todo.task}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTodo(todo.id)}
                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Completed Tasks */}
              {completedTodos.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 pl-1">
                    Completed ({completedTodos.length})
                  </h3>
                  {completedTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="group flex items-center gap-4 p-4 rounded-lg bg-gray-50/50 dark:bg-gray-900/30 border border-transparent hover:border-gray-200 dark:hover:border-gray-800 transition-all opacity-75 hover:opacity-100"
                    >
                      <button
                        onClick={() => toggleTodo(todo.id, todo.is_completed)}
                        className="shrink-0 w-6 h-6 rounded-full border-2 border-green-500 bg-green-500 text-white flex items-center justify-center transition-all"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <span className="flex-1 text-sm text-gray-500 dark:text-gray-400 line-through decoration-gray-400">
                        {todo.task}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTodo(todo.id)}
                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
