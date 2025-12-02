import React, { useState } from 'react';
import { storageAPI } from '../../../lib/storage';

export default function MigrateCompanyLogoPage() {
  const [localLogo, setLocalLogo] = useState<string | null>(() => {
    try { return window?.localStorage?.getItem('company_logo') || null; } catch (e) { return null; }
  });
  const [status, setStatus] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!localLogo) return setStatus('Nenhuma logo encontrada em localStorage.company_logo');
    try {
      setStatus('Convertendo logo...');
      const res = await fetch(localLogo);
      const blob = await res.blob();
      const ext = (blob.type || 'image/png').split('/').pop() || 'png';
      const fileName = `company_logo.${ext}`; // fixed filename so app can use it
      const file = new File([blob], fileName, { type: blob.type || 'image/png' });

      setStatus('Fazendo upload para Supabase (bucket "mapas")...');
      const publicUrl = await storageAPI.uploadImage(file, 'mapas', undefined, 'company_logo.png');

      // Save public URL back to localStorage so the UI picks it up immediately
      try { window.localStorage.setItem('company_logo', publicUrl); } catch (e) {}
      setLocalLogo(publicUrl);
      setStatus('Upload concluído. URL pública salva em localStorage.company_logo');
    } catch (err: any) {
      console.error('Erro na migração da logo:', err);
      setStatus(`Erro ao migrar logo: ${err?.message || String(err)}`);
    }
  };

  const handleClear = () => {
    try {
      window.localStorage.removeItem('company_logo');
      setLocalLogo(null);
      setStatus('Chave localStorage.company_logo removida');
    } catch (err) {
      setStatus('Não foi possível remover a chave do localStorage');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Migrar logo da empresa (localStorage → bucket `mapas`)</h2>

      <div className="mb-4">
        <strong>localStorage.company_logo:</strong>
        <div className="mt-2">
          {localLogo ? (
            <div>
              <div className="mb-2 break-words max-w-screen-sm">{localLogo}</div>
              <img src={localLogo} alt="preview" style={{ maxWidth: 300, maxHeight: 200, border: '1px solid #333' }} />
            </div>
          ) : (
            <div className="text-sm text-gray-500">nenhuma logo encontrada</div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleUpload} disabled={!localLogo}>Fazer upload para `mapas`</button>
        <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={handleClear}>Remover localStorage.company_logo</button>
      </div>

      {status && <div className="mt-4 text-sm">{status}</div>}

      <div className="mt-6 text-sm text-gray-600">
        Observações:
        <ul className="list-disc ml-5">
          <li>Abra esta página no navegador onde a logo foi originalmente enviada (onde `localStorage.company_logo` existe).</li>
          <li>O bucket `mapas` deve existir e permitir objetos públicos. Se não existir, crie-o no painel do Supabase.</li>
          <li>Após upload, a URL pública será salva em `localStorage.company_logo` e o Dashboard TV deverá passar a exibir a logo.</li>
        </ul>
      </div>
    </div>
  );
}
