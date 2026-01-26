import { TodoList } from "@/components/admin/todo-list";

export default function TodosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          My Tasks
        </h1>
        <p className="text-muted-foreground">
          Manage your personal task list and stay organized.
        </p>
      </div>

      <div className="grid gap-6">
        <TodoList />
      </div>
    </div>
  );
}
