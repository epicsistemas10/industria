import React, { useState } from 'react';
import { storageAPI } from '../../../lib/storage';

export default function MigrateMapImagePage() {
  const [localImage, setLocalImage] = useState<string | null>(() => {
    try {
      return window?.localStorage?.getItem('map_image') || null;
    } catch (e) {
      return null;
    }
  });
  const [status, setStatus] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!localImage) return setStatus('Nenhuma imagem encontrada em localStorage.map_image');

    try {
      setStatus('Convertendo imagem...');

      // Convert data URL to Blob by fetching it (works in most browsers)
      const res = await fetch(localImage);
      const blob = await res.blob();
      const ext = (blob.type || 'image/png').split('/').pop() || 'png';
      const fileName = `map-image-${Date.now()}.${ext}`;
      const file = new File([blob], fileName, { type: blob.type || 'image/png' });

      setStatus('Fazendo upload para Supabase (bucket "mapas")...');
      const publicUrl = await storageAPI.uploadImage(file, 'mapas');

      // Save public URL back to localStorage so the app uses it
      window.localStorage.setItem('map_image', publicUrl);
      setLocalImage(publicUrl);
      setStatus('Upload concluído com sucesso. localStorage atualizado com a URL pública.');
    } catch (err: any) {
      console.error('Erro na migração:', err);
      setStatus(`Erro ao migrar imagem: ${err?.message || String(err)}`);
    }
  };

  const handleClear = () => {
    try {
      window.localStorage.removeItem('map_image');
      setLocalImage(null);
      setStatus('Chave localStorage.map_image removida');
    } catch (err) {
      setStatus('Não foi possível remover a chave do localStorage');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Migrar imagem do localStorage → bucket `mapas`</h2>

      <div className="mb-4">
        <strong>localStorage.map_image:</strong>
        <div className="mt-2">
          {localImage ? (
            <div>
              <div className="mb-2 break-words max-w-screen-sm">{localImage}</div>
              {localImage.startsWith('data:') ? (
                <img src={localImage} alt="preview" style={{ maxWidth: 420, maxHeight: 300, border: '1px solid #333' }} />
              ) : (
                <img src={localImage} alt="preview" style={{ maxWidth: 420, maxHeight: 300, border: '1px solid #333' }} />
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">nenhuma imagem encontrada</div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={handleUpload}
          disabled={!localImage}
        >
          Fazer upload para `mapas`
        </button>

        <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={handleClear}>
          Remover localStorage.map_image
        </button>
      </div>

      {status && <div className="mt-4 text-sm">{status}</div>}

      <div className="mt-6 text-sm text-gray-600">
        Observações:
        <ul className="list-disc ml-5">
          <li>A página deve ser aberta no navegador onde a imagem existe em localStorage (quem fez o upload original).</li>
          <li>Verifique se as variáveis de ambiente do Supabase (`VITE_PUBLIC_SUPABASE_URL` e `VITE_PUBLIC_SUPABASE_ANON_KEY`) estão configuradas na implantação.</li>
          <li>O bucket `mapas` precisa existir e permitir objetos públicos.</li>
        </ul>
      </div>
    </div>
  );
}
