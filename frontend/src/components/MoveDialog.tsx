'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

type TreeNode = {
  id: string;
  name: string;
  childs: TreeNode[];
};

type MoveDialogProps = {
  fileId: string;
  fileName: string;
  currentFolderId: string | null;
  onClose: () => void;
  onMoved: () => void;
};

function FolderTreeItem({
  node,
  level,
  selectedId,
  onSelect,
  currentFolderId,
}: {
  node: TreeNode;
  level: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  currentFolderId: string | null;
}) {
  const [open, setOpen] = useState(true);
  const hasChilds = node.childs && node.childs.length > 0;
  const isSelected = selectedId === node.id;
  const isDisabled = node.id === currentFolderId;

  return (
    <div>
      <button
        onClick={() => !isDisabled && onSelect(node.id)}
        disabled={isDisabled}
        className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
          isSelected
            ? 'bg-indigo-50 text-indigo-700 font-medium ring-1 ring-indigo-200'
            : isDisabled
            ? 'text-slate-300 cursor-not-allowed'
            : 'text-slate-700 hover:bg-slate-50'
        }`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        {hasChilds && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
            className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''} ${isDisabled ? 'text-slate-200' : 'text-slate-400'}`}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        {!hasChilds && <span className="w-3 shrink-0" />}

        <svg className={`w-4 h-4 shrink-0 ${isDisabled ? 'text-slate-200' : 'text-indigo-400'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M3.75 3A1.75 1.75 0 002 4.75v3.5a.75.75 0 001.5 0v-3.5a.25.25 0 01.25-.25h3.5a.75.75 0 000-1.5H3.75zM13.25 3a.75.75 0 000 1.5h3.5a.25.25 0 01.25.25v3.5a.75.75 0 001.5 0v-3.5A1.75 1.75 0 0016.75 3h-3.5zM3 13.25a.75.75 0 01.75.75v3.5a.25.25 0 00.25.25h3.5a.75.75 0 010 1.5H3.75A1.75 1.75 0 012 16.75v-3.5a.75.75 0 01.75-.75zM17 13.25a.75.75 0 01.75.75v3.5A1.75 1.75 0 0116 19.25h-3.5a.75.75 0 010-1.5h3.5a.25.25 0 00.25-.25v-3.5a.75.75 0 01.75-.75z" />
        </svg>

        <span className="truncate">{node.name}</span>

        {isDisabled && (
          <span className="ml-auto text-xs text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded">current</span>
        )}
      </button>

      {open && hasChilds && (
        <div>
          {node.childs.map((child) => (
            <FolderTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              currentFolderId={currentFolderId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MoveDialog({
  fileId,
  fileName,
  currentFolderId,
  onClose,
  onMoved,
}: MoveDialogProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<TreeNode[]>('/folders/tree')
      .then(setTree)
      .catch(() => setError('Failed to load folders'))
      .finally(() => setLoading(false));
  }, []);

  async function handleMove() {
    if (selectedId === currentFolderId) return;
    setMoving(true);
    setError('');
    try {
      await api.patch(`/storage/${fileId}/move`, {
        folderId: selectedId,
      });
      onMoved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to move file');
    } finally {
      setMoving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto animate-slide-up overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-heading font-semibold text-slate-900 truncate">
                Move file
              </h2>
              <p className="text-xs text-slate-500 truncate">{fileName}</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <label className="label">Choose destination folder</label>

          {loading ? (
            <div className="space-y-2 py-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 skeleton rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto -mx-2 px-2 space-y-0.5">
              <button
                onClick={() => setSelectedId(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
                  selectedId === null
                    ? 'bg-indigo-50 text-indigo-700 font-medium ring-1 ring-indigo-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <svg className="w-4 h-4 shrink-0 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
                </svg>
                Root
              </button>

              {tree.map((node) => (
                <FolderTreeItem
                  key={node.id}
                  node={node}
                  level={0}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  currentFolderId={currentFolderId}
                />
              ))}

              {tree.length === 0 && (
                <p className="text-sm text-slate-400 py-4 text-center">No folders available</p>
              )}
            </div>
          )}
        </div>

        <div className="p-5 pt-0 space-y-3">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleMove}
              disabled={moving || selectedId === undefined || loading}
              className="btn-primary flex-1"
            >
              {moving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Moving...
                </span>
              ) : (
                'Move here'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
