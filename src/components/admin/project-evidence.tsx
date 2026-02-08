"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
  FileText,
  Trash2,
  Edit2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ProjectEvidenceProps {
  projectId: string;
}

interface EvidenceFile {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  created_at: string;
  public_url?: string;
  description?: string;
}

export function ProjectEvidence({ projectId }: ProjectEvidenceProps) {
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Edit Description State
  const [editingFile, setEditingFile] = useState<EvidenceFile | null>(null);
  const [descriptionInput, setDescriptionInput] = useState("");
  const [savingDescription, setSavingDescription] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchEvidence();
  }, [projectId]);

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("project_evidence")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching evidence:", error);
        return;
      }

      // Generate public URLs
      const filesWithUrls =
        data?.map((file) => {
          const { data: urlData } = supabase.storage
            .from("project-evidence")
            .getPublicUrl(file.file_path);

          return {
            ...file,
            public_url: urlData.publicUrl,
          };
        }) || [];

      setFiles(filesWithUrls);
    } catch (err) {
      console.error("Failed to fetch evidence:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // 1. Upload to Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${projectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("project-evidence")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Insert Record
      const { error: insertError } = await supabase
        .from("project_evidence")
        .insert({
          project_id: projectId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          description: "", // Initialize empty description
        });

      if (insertError) throw insertError;

      // 3. Refresh
      await fetchEvidence();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload evidence. Check console for details.");
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = "";
    }
  };

  const handleDelete = async (file: EvidenceFile) => {
    if (!confirm("Are you sure you want to delete this evidence?")) return;

    try {
      setLoading(true);

      // 1. Delete from Storage
      const { error: storageError } = await supabase.storage
        .from("project-evidence")
        .remove([file.file_path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        // Continue to delete record anyway if storage fails (orphan cleanup)
      }

      // 2. Delete Record
      const { error: dbError } = await supabase
        .from("project_evidence")
        .delete()
        .eq("id", file.id);

      if (dbError) throw dbError;

      await fetchEvidence();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete evidence.");
    } finally {
      setLoading(false);
    }
  };

  const openEditDescription = (file: EvidenceFile) => {
    setEditingFile(file);
    setDescriptionInput(file.description || "");
  };

  const handleSaveDescription = async () => {
    if (!editingFile) return;
    setSavingDescription(true);
    try {
      const { error } = await supabase
        .from("project_evidence")
        .update({ description: descriptionInput })
        .eq("id", editingFile.id);

      if (error) throw error;

      // Optimistic update
      setFiles(
        files.map((f) =>
          f.id === editingFile.id ? { ...f, description: descriptionInput } : f,
        ),
      );
      setEditingFile(null);
    } catch (err) {
      console.error("Failed to update description:", err);
      alert("Failed to update description.");
    } finally {
      setSavingDescription(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="h-3 w-3" /> Completion Evidence / Screenshots
        </h4>
        <div className="flex items-center gap-2">
          {uploading && (
            <span className="text-xs text-muted-foreground animate-pulse">
              Uploading...
            </span>
          )}
          <div className="relative">
            <input
              type="file"
              onChange={handleUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              accept="image/*,application/pdf"
              disabled={uploading}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Upload className="h-3 w-3 mr-1" />
              )}
              Upload Evidence
            </Button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white dark:bg-gray-950 rounded-lg border p-4 shadow-sm min-h-[100px]">
        {loading && files.length === 0 ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-xs italic">
            No evidence uploaded yet. Click upload to add screenshots or
            documents.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="group relative border rounded-md overflow-hidden bg-gray-50 dark:bg-gray-900 flex flex-col"
              >
                {/* Thumbnail */}
                {file.file_type.startsWith("image/") ? (
                  <div className="aspect-video relative bg-black/5 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={file.public_url}
                      alt={file.file_name}
                      className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(file.public_url, "_blank")}
                    />
                  </div>
                ) : (
                  <div
                    className="aspect-video shrink-0 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => window.open(file.public_url, "_blank")}
                  >
                    <FileText className="h-8 w-8 text-gray-400" />
                    <span className="text-[10px] text-muted-foreground px-2 text-center truncate w-full">
                      {file.file_name}
                    </span>
                  </div>
                )}

                {/* Overlay Actions */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-6 w-6 bg-white/80 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDescription(file);
                    }}
                    title="Edit Description"
                  >
                    <Edit2 className="h-3 w-3 text-gray-700" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file);
                    }}
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Footer Info */}
                <div className="border-t p-2 bg-white dark:bg-gray-950 flex-1 flex flex-col justify-between">
                  <div>
                    <p
                      className="text-[10px] font-medium truncate"
                      title={file.file_name}
                    >
                      {file.file_name}
                    </p>
                    {file.description ? (
                      <p
                        className="text-[10px] text-gray-600 mt-1 line-clamp-2"
                        title={file.description}
                      >
                        {file.description}
                      </p>
                    ) : (
                      <p className="text-[9px] text-muted-foreground mt-1 italic">
                        No description
                      </p>
                    )}
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-2 pt-1 border-t border-dashed">
                    {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Description Dialog */}
      <Dialog
        open={!!editingFile}
        onOpenChange={(open) => !open && setEditingFile(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Evidence Description</DialogTitle>
            <DialogDescription>
              Add details about this evidence file.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Enter description here..."
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFile(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveDescription}
              disabled={savingDescription}
            >
              {savingDescription ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
