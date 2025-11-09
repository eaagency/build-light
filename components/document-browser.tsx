"use client";

import { useState, useEffect, useRef } from "react";
import { EmptyState } from "./empty-state";

interface Document {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  modifiedTime?: string;
}

interface Folder {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

interface DocumentBrowserProps {
  projectId: string;
  projectName: string;
}

export function DocumentBrowser({ projectId, projectName }: DocumentBrowserProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<{ id: string; name: string }[]>([
    { id: "", name: projectName },
  ]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [shareModal, setShareModal] = useState<{ id: string; name: string } | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState<"reader" | "writer" | "commenter">("reader");
  const [sharing, setSharing] = useState(false);
  const [newFolderModal, setNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, [projectId, currentFolderId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const endpoint = currentFolderId
        ? `/api/projects/${projectId}/documents/folders/${currentFolderId}`
        : `/api/projects/${projectId}/documents`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (response.ok) {
        setFolders(data.folders || []);
        setDocuments(data.driveDocuments || data.documents || []);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(Array.from(e.target.files));
    }
  };

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        if (currentFolderId) {
          formData.append("folderId", currentFolderId);
        }

        const response = await fetch(`/api/projects/${projectId}/documents`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      // Reload documents after upload
      await loadDocuments();
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const navigateToFolder = (folder: Folder) => {
    setCurrentFolderId(folder.id);
    setCurrentPath([...currentPath, { id: folder.id, name: folder.name }]);
  };

  const navigateToPath = (index: number) => {
    const newPath = currentPath.slice(0, index + 1);
    setCurrentPath(newPath);
    setCurrentFolderId(index === 0 ? null : newPath[index].id);
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return "";
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("image")) return "🖼️";
    if (mimeType.includes("video")) return "🎥";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
      return "📊";
    if (mimeType.includes("document") || mimeType.includes("word")) return "📝";
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
      return "📑";
    return "📎";
  };

  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/documents/${documentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      // Reload documents after deletion
      await loadDocuments();
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete document");
    }
  };

  const handleShare = async () => {
    if (!shareModal || !shareEmail) return;

    setSharing(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/documents/${shareModal.id}/share`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: shareEmail,
            role: shareRole,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to share document");
      }

      alert(`Document shared successfully with ${shareEmail}`);
      setShareModal(null);
      setShareEmail("");
      setShareRole("reader");
    } catch (error) {
      console.error("Share error:", error);
      alert("Failed to share document");
    } finally {
      setSharing(false);
    }
  };

  const handleGetShareLink = async (documentId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/documents/${documentId}/share`
      );

      if (!response.ok) {
        throw new Error("Failed to get share link");
      }

      const data = await response.json();
      navigator.clipboard.writeText(data.shareLink);
      alert("Share link copied to clipboard!");
    } catch (error) {
      console.error("Get share link error:", error);
      alert("Failed to get share link");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setCreatingFolder(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/documents/create-folder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            folderName: newFolderName,
            parentId: currentFolderId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create folder");
      }

      // Reload documents after folder creation
      await loadDocuments();
      setNewFolderModal(false);
      setNewFolderName("");
    } catch (error) {
      console.error("Create folder error:", error);
      alert("Failed to create folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadDocuments();
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${projectId}/documents/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: searchQuery }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setDocuments(data.documents || []);
        setFolders([]); // Hide folders during search
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">Documents</h2>
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              {currentPath.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  {index > 0 && <span>/</span>}
                  <button
                    onClick={() => navigateToPath(index)}
                    className="hover:text-accent transition-colors"
                  >
                    {item.name}
                  </button>
                </div>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setNewFolderModal(true)}
              className="inline-flex items-center gap-2 bg-card border border-border hover:bg-muted text-foreground font-semibold px-6 py-3 rounded-lg transition-colors"
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
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              New Folder
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-primary font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              {uploading ? "Uploading..." : "Upload Files"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search documents..."
              className="w-full px-4 py-2 pl-10 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <svg
              className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-accent hover:bg-accent/90 text-primary font-medium rounded-lg transition-colors"
          >
            Search
          </button>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                loadDocuments();
              }}
              className="px-4 py-2 bg-card border border-border hover:bg-muted text-foreground font-medium rounded-lg transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Drag and drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 transition-colors ${
          dragActive
            ? "border-accent bg-accent/10"
            : "border-border bg-card"
        }`}
      >
        <div className="text-center">
          <div className="text-5xl mb-4">📁</div>
          <p className="text-lg font-medium text-foreground mb-2">
            Drag and drop files here
          </p>
          <p className="text-muted-foreground">
            or click the Upload Files button above
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      ) : (
        <>
          {/* Folders */}
          {folders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary">Folders</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => navigateToFolder(folder)}
                    className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:shadow-lg hover:border-accent/50 transition-all text-left"
                  >
                    <span className="text-3xl">📁</span>
                    <span className="font-medium text-foreground truncate">
                      {folder.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {documents.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary">Files</h3>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="text-3xl flex-shrink-0">
                        {getFileIcon(doc.mimeType)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {doc.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(doc.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {doc.webViewLink && (
                        <a
                          href={doc.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-accent hover:bg-accent/90 text-primary font-medium rounded-lg transition-colors"
                        >
                          Open
                        </a>
                      )}
                      <button
                        onClick={() => setShareModal({ id: doc.id, name: doc.name })}
                        className="px-4 py-2 bg-card border border-border hover:bg-muted text-foreground font-medium rounded-lg transition-colors"
                        title="Share with email"
                      >
                        Share
                      </button>
                      <button
                        onClick={() => handleGetShareLink(doc.id)}
                        className="px-4 py-2 bg-card border border-border hover:bg-muted text-foreground font-medium rounded-lg transition-colors"
                        title="Copy share link"
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
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(doc.id)}
                        className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium rounded-lg transition-colors"
                        title="Delete document"
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
                ))}
              </div>
            </div>
          ) : folders.length === 0 ? (
            <EmptyState
              icon="📄"
              title="No documents yet"
              description="Upload your first document to get started. Drag and drop files or click the Upload button."
            />
          ) : null}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-primary mb-4">
              Delete Document?
            </h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this document? This action cannot be
              undone and will remove the file from Google Drive.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-card border border-border hover:bg-muted text-foreground font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {newFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-primary mb-4">
              Create New Folder
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Folder Name
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                placeholder="Enter folder name"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setNewFolderModal(false);
                  setNewFolderName("");
                }}
                className="px-4 py-2 bg-card border border-border hover:bg-muted text-foreground font-medium rounded-lg transition-colors"
                disabled={creatingFolder}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={creatingFolder || !newFolderName.trim()}
                className="px-4 py-2 bg-accent hover:bg-accent/90 text-primary font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {creatingFolder ? "Creating..." : "Create Folder"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-primary mb-2">
              Share Document
            </h3>
            <p className="text-muted-foreground mb-6">{shareModal.name}</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Permission Level
                </label>
                <select
                  value={shareRole}
                  onChange={(e) =>
                    setShareRole(e.target.value as "reader" | "writer" | "commenter")
                  }
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="reader">Viewer - Can view only</option>
                  <option value="commenter">Commenter - Can view and comment</option>
                  <option value="writer">Editor - Can view and edit</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setShareModal(null);
                  setShareEmail("");
                  setShareRole("reader");
                }}
                className="px-4 py-2 bg-card border border-border hover:bg-muted text-foreground font-medium rounded-lg transition-colors"
                disabled={sharing}
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={sharing || !shareEmail}
                className="px-4 py-2 bg-accent hover:bg-accent/90 text-primary font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {sharing ? "Sharing..." : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
