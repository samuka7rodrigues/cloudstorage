'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import ShareDialog from './ShareDialog';
import MoveDialog from './MoveDialog';

type FolderItem = {
  id: string;
  name: string;
  isPublic?: boolean;
  shareToken?: string | null;
  createdAt: string;
};

type FileItem = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  isPublic: boolean;
  shareToken: string;
  createdAt: string;
};

type FileListProps = {
  folders: FolderItem[];
  files: FileItem[];
  onFolderClick: (folderId: string) => void;
  onRefresh: () => void;
  onUploadToFolder?: (file: File, folderId: string) => Promise<void>;
};

function formatSize(bytes: number | bigint) {
  const num = Number(bytes);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  return `${(num / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function FolderIcon() {
  return (
    <svg className="w-8 h-8 shrink-0" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="6" fill="#eef2ff" />
      <path d="M6 10a2 2 0 012-2h4.586a2 2 0 011.414.586L16 10.414A2 2 0 0017.414 11H24a2 2 0 012 2v9a2 2 0 01-2 2H8a2 2 0 01-2-2V10z" fill="#6366f1" fillOpacity="0.2" stroke="#6366f1" strokeWidth="1.2" />
    </svg>
  );
}

function FileIcon({ mimeType }: { mimeType: string }) {
  const color = mimeType.startsWith('image/')
    ? '#10b981'
    : mimeType.startsWith('video/')
    ? '#f59e0b'
    : mimeType.startsWith('text/') || mimeType.includes('pdf')
    ? '#6366f1'
    : '#64748b';

  return (
    <svg className="w-8 h-8 shrink-0" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="6" fill={`${color}10`} />
      <path d="M19 4H10a2 2 0 00-2 2v20a2 2 0 002 2h12a2 2 0 002-2V10l-5-6z" fill={`${color}20`} stroke={color} strokeWidth="1.2" />
      <path d="M19 4v6h6" fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export default function FileList({
  folders,
  files,
  onFolderClick,
  onRefresh,
  onUploadToFolder,
}: FileListProps) {
  const [shareItem, setShareItem] = useState<{
    type: 'file' | 'folder';
    id: string;
    isPublic: boolean;
    shareToken: string;
  } | null>(null);
  const [moveItem, setMoveItem] = useState<{
    id: string;
    name: string;
    folderId: string | null;
  } | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [dropping, setDropping] = useState(false);

  async function handleDownload(fileId: string) {
    try {
      const { url } = await api.get<{ url: string }>(`/storage/download/${fileId}`);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Download failed', err);
    }
  }

  async function handleDelete(fileId: string) {
    try {
      await api.delete(`/storage/${fileId}`);
      onRefresh();
    } catch (err) {
      console.error('Delete failed', err);
    }
  }

  async function handleDropOnFolder(
    e: React.DragEvent<HTMLDivElement>,
    folderId: string,
  ) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0 || !onUploadToFolder) return;

    setDropping(true);
    try {
      for (const file of files) {
        await onUploadToFolder(file, folderId);
      }
      onRefresh();
    } finally {
      setDropping(false);
    }
  }

  if (folders.length === 0 && files.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
        </div>
        <p className="text-base font-medium text-slate-700">This folder is empty</p>
        <p className="text-sm text-slate-400 mt-1">Upload files or create folders to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {folders.map((folder, i) => {
        const isDragTarget = dragOverFolderId === folder.id;

        return (
          <div
            key={folder.id}
            className={`relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 ${
              isDragTarget
                ? 'border-2 border-indigo-400 bg-indigo-50/80 -mx-0.5 rounded-xl scale-[1.01] shadow-lg shadow-indigo-200/50'
                : 'card-hover group'
            }`}
            style={{ animationDelay: `${i * 30}ms` }}
            onClick={() => onFolderClick(folder.id)}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onUploadToFolder) setDragOverFolderId(folder.id);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onUploadToFolder) setDragOverFolderId(folder.id);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOverFolderId(null);
            }}
            onDrop={(e) => handleDropOnFolder(e, folder.id)}
          >
            {isDragTarget && (
              <div className="absolute inset-0 rounded-xl bg-indigo-500/5 pointer-events-none" />
            )}

            <FolderIcon />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {folder.name}
                {isDragTarget && (
                  <span className="ml-2 text-xs text-indigo-600 animate-pulse-soft">
                    Drop to upload
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-400">Folder &middot; {formatDate(folder.createdAt)}</p>
            </div>

            <div className={`flex items-center gap-1.5 transition-all duration-200 ${
              isDragTarget ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
              onClick={(e) => e.stopPropagation()}
            >
              {folder.isPublic ? (
                <button
                  onClick={() => setShareItem({ type: 'folder', id: folder.id, isPublic: true, shareToken: folder.shareToken || '' })}
                  className="btn-ghost text-xs px-2.5 py-1.5 text-emerald-600 hover:bg-emerald-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-3.314m-9.566 7.5l9.566 3.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                  Shared
                </button>
              ) : (
                <button
                  onClick={() => setShareItem({ type: 'folder', id: folder.id, isPublic: false, shareToken: '' })}
                  className="btn-ghost text-xs px-2.5 py-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186l9.566-3.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                  Share
                </button>
              )}
            </div>
          </div>
        );
      })}

      {files.map((file, i) => (
        <div
          key={file.id}
          className="card-hover group flex items-center gap-3 px-4 py-3"
          style={{ animationDelay: `${(folders.length + i) * 30}ms` }}
        >
          <FileIcon mimeType={file.mimeType} />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
            <p className="text-xs text-slate-400">
              {file.mimeType} &middot; {formatSize(file.size)} &middot; {formatDate(file.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={() => handleDownload(file.id)}
              className="btn-ghost text-xs px-2.5 py-1.5"
              title="Download"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </button>

            {file.isPublic ? (
              <button
                onClick={() => setShareItem({ type: 'file', id: file.id, isPublic: true, shareToken: file.shareToken })}
                className="btn-ghost text-xs px-2.5 py-1.5 text-emerald-600 hover:bg-emerald-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-3.314m-9.566 7.5l9.566 3.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                Shared
              </button>
            ) : (
              <button
                onClick={() => setShareItem({ type: 'file', id: file.id, isPublic: false, shareToken: '' })}
                className="btn-ghost text-xs px-2.5 py-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186l9.566-3.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                Share
              </button>
            )}

            <button
              onClick={() => setMoveItem({ id: file.id, name: file.name, folderId: (file as any).folderId || null })}
              className="btn-ghost text-xs px-2.5 py-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
              Move
            </button>

            <button
              onClick={() => handleDelete(file.id)}
              className="btn-ghost text-xs px-2.5 py-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}

      {shareItem && (
        <ShareDialog
          type={shareItem.type}
          id={shareItem.id}
          isPublic={shareItem.isPublic}
          shareToken={shareItem.shareToken}
          onClose={() => setShareItem(null)}
          onRefresh={onRefresh}
        />
      )}

      {moveItem && (
        <MoveDialog
          fileId={moveItem.id}
          fileName={moveItem.name}
          currentFolderId={moveItem.folderId}
          onClose={() => setMoveItem(null)}
          onMoved={onRefresh}
        />
      )}
    </div>
  );
}
