"use client";

import { useState, useEffect, useCallback } from "react";
import { CloudinaryAccountCard } from "./cloudinary-account-card";
import { CloudinaryAccountForm } from "./cloudinary-account-form";
import { CloudinaryAssetManager } from "./cloudinary-assets-manager";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface CloudinaryAccount {
  id: string;
  name: string;
  cloudName: string;
  createdAt: string;
  updatedAt: string;
}

export function CloudinaryDashboard() {
  const { status } = useSession();
  const router = useRouter();
  const [accounts, setAccounts] = useState<CloudinaryAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const [editingAccount, setEditingAccount] = useState<
    CloudinaryAccount | undefined
  >(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signup");
    }
  }, [status, router]);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/cloudinary/accounts");
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth/signup");
          return;
        }
        throw new Error("Failed to fetch accounts");
      }
      const data = await response.json();
      setAccounts(data);
      setError("");
    } catch (err) {
      setError("Failed to load accounts. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAccounts();
    }
  }, [status, fetchAccounts]);

  const handleCreate = () => {
    setEditingAccount(undefined);
    setShowForm(true);
  };

  const handleEdit = (account: CloudinaryAccount) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/cloudinary/accounts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      await fetchAccounts();
    } catch (err) {
      setError("Failed to delete account. Please try again.");
      console.error(err);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAccount(undefined);
    fetchAccounts();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAccount(undefined);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Cloudinary Accounts
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Manage your Cloudinary account credentials securely
              </p>
            </div>
            {!showForm && (
              <button
                onClick={handleCreate}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
              >
                <span className="flex items-center gap-2">
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Account
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="mb-8 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-lg">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
              {editingAccount ? "Edit Account" : "Create New Account"}
            </h2>
            <CloudinaryAccountForm
              account={editingAccount}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        {/* Asset Manager or Accounts Grid */}
        {selectedAccount ? (
          <div>
            <button
              onClick={() => setSelectedAccount(null)}
              className="mb-4 px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Accounts
            </button>
            <CloudinaryAssetManager
              accountId={selectedAccount}
              accountName={
                accounts.find((a) => a.id === selectedAccount)?.name || ""
              }
            />
          </div>
        ) : (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-zinc-600 dark:text-zinc-400">
                  Loading accounts...
                </div>
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <svg
                  className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  No accounts yet
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Get started by creating your first Cloudinary account.
                </p>
                {!showForm && (
                  <button
                    onClick={handleCreate}
                    className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Add Account
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map((account) => (
                  <CloudinaryAccountCard
                    key={account.id}
                    account={account}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewAssets={() => setSelectedAccount(account.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}