"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteUser } from "@/app/actions-users";

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
}

export default function DeleteUserButton({
  userId,
  userName,
}: DeleteUserButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      confirm(
        `Are you sure you want to delete user ${userName || "this user"}? This action cannot be undone.`,
      )
    ) {
      setIsDeleting(true);
      const result = await deleteUser(userId);
      setIsDeleting(false);

      if (result?.error) {
        alert("Failed to delete user: " + result.error);
      }
      // Success will automatically revalidate the page due to Server Action
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-red-500 hover:text-red-700 hover:bg-red-50"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      <span className="sr-only">Delete</span>
    </Button>
  );
}
