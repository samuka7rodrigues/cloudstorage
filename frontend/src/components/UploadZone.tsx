'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

type UploadZoneProps = {
  onUpload: (file: File) => Promise<void>;
  onCreateFolder: (name: string) => Promise<void>;
};

export default function UploadZone({ onUpload, onCreateFolder }: UploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);
      try {
        for (const file of acceptedFiles) {
          await onUpload(file);
        }
      } finally {
        setUploading(false);
      }
    },
    [onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading,
  });

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    await onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolder(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowNewFolder(!showNewFolder)}
          className="btn-secondary text-xs sm:text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New folder
        </button>
      </div>

      {showNewFolder && (
        <div className="flex items-center gap-2 animate-slide-up">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="input max-w-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
            }}
            autoFocus
          />
          <button onClick={handleCreateFolder} className="btn-primary text-xs sm:text-sm">
            Create
          </button>
          <button
            onClick={() => {
              setShowNewFolder(false);
              setNewFolderName('');
            }}
            className="btn-ghost text-xs sm:text-sm"
          >
            Cancel
          </button>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-indigo-400 bg-indigo-50/80 scale-[1.01]'
            : 'border-slate-300 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'
        } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-sm font-medium text-slate-600">Uploading files...</p>
          </div>
        ) : isDragActive ? (
          <div className="space-y-2 animate-slide-up">
            <div className="text-4xl">📂</div>
            <p className="text-base font-semibold text-indigo-600">Drop files here</p>
            <p className="text-xs text-slate-500">Release to upload</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                <span className="text-indigo-600 font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-400 mt-1">Max file size: 500 MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
