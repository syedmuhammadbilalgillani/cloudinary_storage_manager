"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface CloudinaryAsset {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  resource_type: string;
  folder?: string;
  tags?: string[];
}

interface CloudinaryAssetManagerProps {
  accountId: string;
  accountName: string;
}

export function CloudinaryAssetManager({
  accountId,
  accountName,
}: CloudinaryAssetManagerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState<CloudinaryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<CloudinaryAsset | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [folder, setFolder] = useState("");
  const [nextCursor, setNextCursor] = useState("");
  const [hasMore, setHasMore] = useState(false);

  const fetchAssets = async (cursor?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (folder) params.append("folder", folder);
      if (cursor) params.append("next_cursor", cursor);

      const response = await fetch(
        `/api/cloudinary/accounts/${accountId}/assets?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch assets");
      }

      const data = await response.json();
      setAssets(cursor ? [...assets, ...data.resources] : data.resources);
      setNextCursor(data.next_cursor || "");
      setHasMore(!!data.next_cursor);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [accountId, folder]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);
      if (folder) formData.append("folder", folder);

      const response = await fetch(
        `/api/cloudinary/accounts/${accountId}/assets/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      // Refresh assets
      await fetchAssets();
      setShowUploadModal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (publicId: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    try {
      const encodedPublicId = encodeURIComponent(publicId);
      const response = await fetch(
        `/api/cloudinary/accounts/${accountId}/assets/${encodedPublicId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete asset");
      }

      // Remove from list
      setAssets(assets.filter((asset) => asset.public_id !== publicId));
      if (selectedAsset?.public_id === publicId) {
        setSelectedAsset(null);
      }
    } catch (err: any) {
      setError(err.message || "Delete failed");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {accountName} - Assets
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Manage your Cloudinary assets
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Filter by folder..."
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          />
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Upload Asset
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Upload Asset
            </h3>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleUpload}
              disabled={uploading}
              className="w-full mb-4"
            />
            {uploading && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Uploading...
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-zinc-600 dark:text-zinc-400">Loading assets...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-600 dark:text-zinc-400">No assets found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map((asset) => (
              <div
                key={asset.public_id}
                className="group relative bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedAsset(asset)}
              >
                {asset.resource_type === "image" ? (
                  <img
                    src={asset.secure_url}
                    alt={asset.public_id}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <span className="text-4xl">📄</span>
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {asset.public_id.split("/").pop()}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {formatBytes(asset.bytes)} • {asset.format}
                  </p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(asset.public_id);
                    }}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                  >
                    <svg
                      className="w-4 h-4"
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
            ))}
          </div>

          {hasMore && (
            <div className="text-center">
              <button
                onClick={() => fetchAssets(nextCursor)}
                className="px-6 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAsset(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  Asset Details
                </h3>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  ✕
                </button>
              </div>

              {selectedAsset.resource_type === "image" && (
                <img
                  src={selectedAsset.secure_url}
                  alt={selectedAsset.public_id}
                  className="w-full rounded-lg mb-4"
                />
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Public ID</p>
                  <p className="text-zinc-900 dark:text-zinc-100 font-mono break-all">
                    {selectedAsset.public_id}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Format</p>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {selectedAsset.format}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Size</p>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {formatBytes(selectedAsset.bytes)}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Dimensions</p>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {selectedAsset.width} × {selectedAsset.height}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Created</p>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {formatDate(selectedAsset.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">URL</p>
                  <a
                    href={selectedAsset.secure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    Open
                  </a>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedAsset.secure_url);
                    alert("URL copied to clipboard!");
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Copy URL
                </button>
                <button
                  onClick={() => handleDelete(selectedAsset.public_id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}