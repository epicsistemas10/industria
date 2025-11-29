import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../src/lib/supabase';

export default function DebugStoragePage() {
  const [localMap, setLocalMap] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try { setLocalMap(typeof window !== 'undefined' ? localStorage.getItem('map_image') : null); } catch (e) { setLocalMap(null); }
  }, []);

  const listFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.storage.from('mapas').list('', { limit: 100, offset: 0, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw error;
      if (!data) {
        setFiles([]);
        setLoading(false);
        return;
      }

      const withUrls = await Promise.all(data.map(async (f: any) => {
        const { data: d } = supabase.storage.from('mapas').getPublicUrl(f.name);
        let ok = false;
        try {
          const r = await fetch(d.publicUrl, { method: 'HEAD' });
          ok = r.ok;
        } catch (e) {
          ok = false;
        }
        return { ...f, publicUrl: d.publicUrl, accessible: ok };
      }));

      setFiles(withUrls);
    } catch (err: any) {
      console.error('Erro listando arquivos do bucket mapas:', err);
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <h2 className="text-xl font-bold mb-4">Debug Storage — bucket `mapas`</h2>
      <div className="mb-4">
        <div className="mb-2">localStorage.map_image:</div>
        <div className="break-words bg-slate-800 p-3 rounded">{localMap || '<empty>'}</div>
      </div>

      <div className="mb-4">
        <button onClick={listFiles} className="px-4 py-2 bg-blue-600 rounded">List files in `mapas`</button>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-400">{error}</div>}

      <div className="space-y-2">
        {files.map((f:any) => (
          <div key={f.name} className="p-3 bg-slate-800 rounded">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-medium">{f.name}</div>
              <div className="text-xs text-gray-300">{f.size || '-'} bytes</div>
            </div>
            <div className="text-xs mt-2 break-words">Public URL: <a className="text-blue-300 underline" href={f.publicUrl} target="_blank" rel="noreferrer">{f.publicUrl}</a></div>
            <div className="text-xs mt-1">Accessible: {f.accessible ? <span className="text-green-300">YES</span> : <span className="text-red-300">NO</span>}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
