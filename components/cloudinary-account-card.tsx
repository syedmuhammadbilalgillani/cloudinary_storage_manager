"use client";

import { useState } from "react";
import { format } from "date-fns";

interface CloudinaryAccount {
  id: string;
  name: string;
  cloudName: string;
  createdAt: string;
  updatedAt: string;
}

interface CloudinaryAccountCardProps {
  account: CloudinaryAccount;
  onEdit: (account: CloudinaryAccount) => void;
  onDelete: (id: string) => void;
  onViewAssets: () => void;
}

export function CloudinaryAccountCard({
  account,
  onEdit,
  onDelete,
  onViewAssets,
}: CloudinaryAccountCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(account.id);
    setIsDeleting(false);
    setShowConfirm(false);
  };

  return (
    <div className="group relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            {account.name}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">
            {account.cloudName}
          </p>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(account)}
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Edit account"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete account"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mb-4">
        <span>
          Created {format(new Date(account.createdAt), "MMM d, yyyy")}
        </span>
        {account.updatedAt !== account.createdAt && (
          <span>
            Updated {format(new Date(account.updatedAt), "MMM d, yyyy")}
          </span>
        )}
      </div>

      <button
        onClick={onViewAssets}
        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        View Assets
      </button>

      {showConfirm && (
        <div className="absolute inset-0 bg-zinc-900/80 dark:bg-zinc-950/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-sm mx-4 border border-zinc-200 dark:border-zinc-800">
            <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Delete Account?
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Are you sure you want to delete &quot;{account.name}&quot;? This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}