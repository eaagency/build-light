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

  return (
    <div className="space-y-6">
      {/* Header */}
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
    </div>
  );
}
