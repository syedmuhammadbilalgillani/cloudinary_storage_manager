"use client";

import { useState } from "react";

interface CloudinaryAccountFormProps {
  account?: {
    id: string;
    name: string;
    cloudName: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function CloudinaryAccountForm({
  account,
  onSuccess,
  onCancel,
}: CloudinaryAccountFormProps) {
  const [formData, setFormData] = useState({
    name: account?.name || "",
    cloudName: account?.cloudName || "",
    apiKey: "",
    apiSecret: "",
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!account;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = isEdit
        ? `/api/cloudinary/accounts/${account.id}`
        : "/api/cloudinary/accounts";
      const method = isEdit ? "PUT" : "POST";

      const body: any = {
        name: formData.name,
        cloudName: formData.cloudName,
      };

      // Only include credentials if provided or if creating new account
      if (!isEdit || formData.apiKey || formData.apiSecret) {
        if (formData.apiKey) body.apiKey = formData.apiKey;
        if (formData.apiSecret) body.apiSecret = formData.apiSecret;
      }

      if (!isEdit && (!formData.apiKey || !formData.apiSecret)) {
        setError("API Key and API Secret are required for new accounts");
        setLoading(false);
        return;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save account");
      } else {
        onSuccess();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
        >
          Account Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="My Cloudinary Account"
        />
      </div>

      <div>
        <label
          htmlFor="cloudName"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
        >
          Cloud Name
        </label>
        <input
          id="cloudName"
          type="text"
          required
          value={formData.cloudName}
          onChange={(e) =>
            setFormData({ ...formData, cloudName: e.target.value })
          }
          className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="your-cloud-name"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="apiKey"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            API Key
          </label>
          {isEdit && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Leave empty to keep current
            </span>
          )}
        </div>
        <input
          id="apiKey"
          type={showSecrets ? "text" : "password"}
          required={!isEdit}
          value={formData.apiKey}
          onChange={(e) =>
            setFormData({ ...formData, apiKey: e.target.value })
          }
          className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
          placeholder="••••••••••••"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="apiSecret"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            API Secret
          </label>
          <button
            type="button"
            onClick={() => setShowSecrets(!showSecrets)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showSecrets ? "Hide" : "Show"}
          </button>
        </div>
        <input
          id="apiSecret"
          type={showSecrets ? "text" : "password"}
          required={!isEdit}
          value={formData.apiSecret}
          onChange={(e) =>
            setFormData({ ...formData, apiSecret: e.target.value })
          }
          className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
          placeholder="••••••••••••"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {loading ? "Saving..." : isEdit ? "Update Account" : "Create Account"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}