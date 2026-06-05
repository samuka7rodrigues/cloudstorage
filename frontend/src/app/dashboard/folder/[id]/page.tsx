'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Breadcrumbs from '@/components/Breadcrumbs';
import FileList from '@/components/FileList';
import UploadZone from '@/components/UploadZone';

export default function FolderPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.id as string;

  const [content, setContent] = useState<{
    folders: any[];
    files: any[];
    total: number;
  } | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContent = useCallback(async () => {
    try {
      const [contentData, breadcrumbsData] = await Promise.all([
        api.get<{ folders: any[]; files: any[]; total: number }>(
          `/folders/${folderId}/content`,
        ),
        api.get<{ id: string; name: string }[]>(
          `/folders/${folderId}/breadcrumbs`,
        ),
      ]);
      setContent(contentData);
      setBreadcrumbs(breadcrumbsData);
    } catch (err: any) {
      console.error('Failed to load content', err);
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  function navigateToFolder(targetFolderId: string) {
    router.push(`/dashboard/folder/${targetFolderId}`);
  }

  async function handleUpload(file: File) {
    try {
      const { presignedUrl, storageKey } = await api.post<{
        presignedUrl: string;
        storageKey: string;
      }>('/storage/request', {
        fileName: file.name,
        mimeType: file.type,
        folderId,
      });

      await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      await api.post('/storage/confirm', {
        storageKey,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        folderId,
      });

      loadContent();
    } catch (err: any) {
      console.error('Upload failed', err);
    }
  }

  async function handleCreateFolder(name: string) {
    try {
      await api.post('/folders', { name, parentId: folderId });
      loadContent();
    } catch (err: any) {
      console.error('Failed to create folder', err);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-64 skeleton" />
        <div className="h-32 skeleton" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Breadcrumbs items={breadcrumbs} />
        <p className="text-xs text-slate-400">
          {content ? `${content.total} item${content.total !== 1 ? 's' : ''}` : ''}
        </p>
      </div>

      <UploadZone
        onUpload={(file) => handleUpload(file)}
        onCreateFolder={handleCreateFolder}
      />

      {content && (
        <FileList
          folders={content.folders}
          files={content.files}
          onFolderClick={navigateToFolder}
          onRefresh={loadContent}
          onUploadToFolder={handleUpload}
        />
      )}
    </div>
  );
}
