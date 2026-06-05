'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';

type TreeNode = {
  id: string;
  name: string;
  childs: TreeNode[];
};

function TreeNodeItem({ node, level }: { node: TreeNode; level: number }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = pathname === `/dashboard/folder/${node.id}`;
  const hasChilds = node.childs && node.childs.length > 0;

  return (
    <div>
      <Link
        href={`/dashboard/folder/${node.id}`}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-150 group ${
          isActive
            ? 'bg-sidebar-active text-sidebar-text-active font-medium'
            : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
        }`}
        style={{ paddingLeft: `${12 + level * 12}px` }}
      >
        {hasChilds && (
          <button
            onClick={(e) => {
              e.preventDefault();
              setOpen(!open);
            }}
            className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        {!hasChilds && <span className="w-3 shrink-0" />}

        <svg className="w-4 h-4 shrink-0 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3.75 3A1.75 1.75 0 002 4.75v3.5a.75.75 0 001.5 0v-3.5a.25.25 0 01.25-.25h3.5a.75.75 0 000-1.5H3.75zM13.25 3a.75.75 0 000 1.5h3.5a.25.25 0 01.25.25v3.5a.75.75 0 001.5 0v-3.5A1.75 1.75 0 0016.75 3h-3.5zM3 13.25a.75.75 0 01.75.75v3.5a.25.25 0 00.25.25h3.5a.75.75 0 010 1.5H3.75A1.75 1.75 0 012 16.75v-3.5a.75.75 0 01.75-.75zM17 13.25a.75.75 0 01.75.75v3.5A1.75 1.75 0 0116 19.25h-3.5a.75.75 0 010-1.5h3.5a.25.25 0 00.25-.25v-3.5a.75.75 0 01.75-.75z" />
        </svg>

        <span className="truncate">{node.name}</span>

        {hasChilds && (
          <span className="ml-auto text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
            {node.childs.length}
          </span>
        )}
      </Link>

      {open && hasChilds && (
        <div className="animate-fade-in">
          {node.childs.map((child) => (
            <TreeNodeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTree() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isRoot = pathname === '/dashboard';

  useEffect(() => {
    api
      .get<TreeNode[]>('/folders/tree')
      .then(setTree)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-3 px-2">
      <div className="px-3 mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Folders</span>
        <span className="text-xs text-slate-600">{tree.length}</span>
      </div>

      {loading ? (
        <div className="space-y-2 px-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 skeleton rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <Link
            href="/dashboard"
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-150 mb-0.5 ${
              isRoot
                ? 'bg-sidebar-active text-sidebar-text-active font-medium'
                : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
            </svg>
            My Files
          </Link>

          {tree.map((node) => (
            <TreeNodeItem key={node.id} node={node} level={0} />
          ))}

          {tree.length === 0 && (
            <p className="px-3 py-4 text-sm text-slate-600 text-center">No folders yet</p>
          )}
        </>
      )}
    </div>
  );
}
