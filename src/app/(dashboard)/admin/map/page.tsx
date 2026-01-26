import ProjectMap from "@/components/admin/project-map";

export default function MapPage() {
  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Project Map
        </h1>
        <p className="text-muted-foreground">
          Geographical overview of all scheduled and active projects.
        </p>
      </div>

      <ProjectMap />
    </div>
  );
}
