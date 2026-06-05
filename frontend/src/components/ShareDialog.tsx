'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

type ShareDialogProps = {
  type: 'file' | 'folder';
  id: string;
  isPublic: boolean;
  shareToken: string;
  onClose: () => void;
  onRefresh: () => void;
};

export default function ShareDialog({
  type,
  id,
  isPublic,
  shareToken,
  onClose,
  onRefresh,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const shareUrl =
    type === 'folder'
      ? `${window.location.origin}/share/folder/${shareToken}`
      : `${window.location.origin}/share/${shareToken}`;

  async function handleToggleShare() {
    setError('');
    try {
      if (type === 'folder') {
        await api.post(`/folders/${id}/share`);
      } else {
        await api.post(`/share/${id}`);
      }
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle share');
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-auto animate-slide-up">
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isPublic ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
          }`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-3.314m-9.566 7.5l9.566 3.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold text-slate-900">
              {isPublic ? 'Shared' : 'Share'} {type === 'folder' ? 'folder' : 'file'}
            </h2>
            <p className="text-xs text-slate-500">
              {isPublic ? 'Anyone with the link can access' : 'Only you can access this'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleToggleShare}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isPublic
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-500/20'
            }`}
          >
            {isPublic ? 'Disable sharing' : 'Enable sharing'}
          </button>

          {isPublic && (
            <div className="animate-fade-in">
              <label className="label">Share link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="input text-xs flex-1 bg-slate-50"
                />
                <button
                  onClick={copyLink}
                  className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    copied
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
