'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

function formatSize(bytes: number | bigint) {
  const num = Number(bytes);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  return `${(num / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

type FolderData = {
  id: string;
  name: string;
  parentId: string | null;
};

type FileData = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
};

export default function SharedFolderPage() {
  const params = useParams();
  const token = params.token as string;

  const [folder, setFolder] = useState<FolderData | null>(null);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);

  async function loadContent(subfolderId?: string) {
    setLoading(true);
    try {
      const endpoint = subfolderId
        ? `/share/folder/${token}/content/${subfolderId}`
        : `/share/folder/${token}/content`;

      const data = await api.get<{
        folder: FolderData;
        folders: FolderData[];
        files: FileData[];
      }>(endpoint);

      setFolder(data.folder);
      setFolders(data.folders);
      setFiles(data.files);

      if (subfolderId) {
        setBreadcrumbs((prev) => {
          const exists = prev.find((b) => b.id === subfolderId);
          if (exists) {
            return prev.slice(0, prev.indexOf(exists) + 1);
          }
          return [...prev, { id: data.folder.id, name: data.folder.name }];
        });
      } else {
        setBreadcrumbs([{ id: data.folder.id, name: data.folder.name }]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load folder');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContent();
  }, [token]);

  function navigateToSubfolder(folderId: string) {
    loadContent(folderId);
  }

  async function handleDownload(fileId: string) {
    try {
      const { url } = await api.get<{ url: string }>(
        `/share/folder/${token}/download/${fileId}`,
      );
      window.open(url, '_blank');
    } catch (err) {
      console.error('Download failed', err);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-base font-medium text-slate-900">Not found</p>
          <p className="text-sm text-slate-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-gradient flex items-center justify-center shadow-sm shadow-indigo-500/20">
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <h1 className="text-base font-heading font-semibold text-slate-900">
            Cloud<span className="text-indigo-600">Store</span>
          </h1>
          <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Shared folder</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card overflow-hidden">
          <div className="p-6 sm:p-8">
            {folder && (
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <svg className="w-7 h-7 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3.75 3A1.75 1.75 0 002 4.75v3.5a.75.75 0 001.5 0v-3.5a.25.25 0 01.25-.25h3.5a.75.75 0 000-1.5H3.75zM13.25 3a.75.75 0 000 1.5h3.5a.25.25 0 01.25.25v3.5a.75.75 0 001.5 0v-3.5A1.75 1.75 0 0016.75 3h-3.5zM3 13.25a.75.75 0 01.75.75v3.5a.25.25 0 00.25.25h3.5a.75.75 0 010 1.5H3.75A1.75 1.75 0 012 16.75v-3.5a.75.75 0 01.75-.75zM17 13.25a.75.75 0 01.75.75v3.5A1.75 1.75 0 0116 19.25h-3.5a.75.75 0 010-1.5h3.5a.25.25 0 00.25-.25v-3.5a.75.75 0 01.75-.75z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-heading font-semibold text-slate-900">
                    {folder.name}
                  </h1>
                  <p className="text-sm text-slate-500">Shared with you via link</p>
                </div>
              </div>
            )}

            {breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-1 text-sm text-slate-500 mb-6 pb-4 border-b border-slate-100 overflow-x-auto">
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.id} className="flex items-center gap-1 shrink-0">
                    {i > 0 && (
                      <svg className="w-3.5 h-3.5 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    )}
                    {i < breadcrumbs.length - 1 ? (
                      <button
                        onClick={() => navigateToSubfolder(crumb.id)}
                        className="hover:text-indigo-600 transition-colors px-1.5 py-0.5 rounded hover:bg-indigo-50"
                      >
                        {crumb.name}
                      </button>
                    ) : (
                      <span className="text-slate-900 font-medium px-1.5 py-0.5">{crumb.name}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 skeleton rounded-lg" />
                ))}
              </div>
            ) : folders.length === 0 && files.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500">This folder is empty</p>
              </div>
            ) : (
              <div className="space-y-1">
                {folders.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group"
                    onClick={() => navigateToSubfolder(f.id)}
                  >
                    <svg className="w-7 h-7 shrink-0" viewBox="0 0 32 32" fill="none">
                      <rect width="32" height="32" rx="6" fill="#eef2ff" />
                      <path d="M6 10a2 2 0 012-2h4.586a2 2 0 011.414.586L16 10.414A2 2 0 0017.414 11H24a2 2 0 012 2v9a2 2 0 01-2 2H8a2 2 0 01-2-2V10z" fill="#6366f1" fillOpacity="0.2" stroke="#6366f1" strokeWidth="1.2" />
                    </svg>
                    <span className="flex-1 text-sm font-medium text-slate-900">{f.name}</span>
                    <span className="text-xs text-slate-400">Folder</span>
                    <svg className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}

                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg transition-colors group"
                  >
                    <svg className="w-7 h-7 shrink-0" viewBox="0 0 32 32" fill="none">
                      <rect width="32" height="32" rx="6" fill="#6366f110" />
                      <path d="M19 4H10a2 2 0 00-2 2v20a2 2 0 002 2h12a2 2 0 002-2V10l-5-6z" fill="#6366f120" stroke="#6366f1" strokeWidth="1.2" />
                      <path d="M19 4v6h6" fill="none" stroke="#6366f1" strokeWidth="1.2" strokeLinejoin="round" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                      <p className="text-xs text-slate-400">{file.mimeType}</p>
                    </div>
                    <span className="text-xs text-slate-500">{formatSize(file.size)}</span>
                    <button
                      onClick={() => handleDownload(file.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity btn-ghost text-xs px-2.5 py-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
