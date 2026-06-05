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

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;

  const [file, setFile] = useState<{
    id: string;
    name: string;
    size: number;
    mimeType: string;
    storageKey: string;
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<{
          id: string;
          name: string;
          size: number;
          mimeType: string;
          storageKey: string;
        }>(`/share/public/${token}`);
        setFile(data);
      } catch (err: any) {
        setError(err.message || 'File not found');
      }
    }
    load();
  }, [token]);

  async function handleDownload() {
    try {
      const { url } = await api.get<{ url: string }>(
        `/share/public/${token}/download`,
      );
      window.open(url, '_blank');
    } catch (err: any) {
      setError(err.message || 'Download failed');
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

  if (!file) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
          <p className="text-sm">Loading file...</p>
        </div>
      </div>
    );
  }

  const iconColor = file.mimeType.startsWith('image/')
    ? 'text-emerald-500 bg-emerald-50'
    : file.mimeType.startsWith('video/')
    ? 'text-amber-500 bg-amber-50'
    : file.mimeType.includes('pdf')
    ? 'text-red-500 bg-red-50'
    : 'text-indigo-500 bg-indigo-50';

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="card p-8 max-w-sm w-full text-center animate-slide-up">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${iconColor}`}>
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>

        <h1 className="text-lg font-heading font-semibold text-slate-900 mb-1 break-all">{file.name}</h1>
        <p className="text-sm text-slate-500 mb-1">{file.mimeType}</p>
        <p className="text-xs text-slate-400 mb-6">{formatSize(Number(file.size))}</p>

        <button
          onClick={handleDownload}
          className="btn-primary w-full"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download file
        </button>
      </div>
    </div>
  );
}
