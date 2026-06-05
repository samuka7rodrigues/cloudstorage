'use client';

import Link from 'next/link';

type BreadcrumbItem = {
  id: string;
  name: string;
};

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors px-1.5 py-0.5 rounded hover:bg-indigo-50"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
        </svg>
        My Files
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const href = isLast ? undefined : `/dashboard/folder/${item.id}`;

        return (
          <span key={item.id} className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
            {href ? (
              <Link
                href={href}
                className="text-slate-500 hover:text-indigo-600 transition-colors px-1.5 py-0.5 rounded hover:bg-indigo-50"
              >
                {item.name}
              </Link>
            ) : (
              <span className="text-slate-900 font-medium px-1.5 py-0.5">{item.name}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
