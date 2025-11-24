import { useState, useRef } from 'react';
import { storageAPI } from '../../lib/storage';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  bucket: string;
  folder?: string;
  label?: string;
  darkMode?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  bucket,
  folder,
  label = 'Imagem',
  darkMode = true,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(value);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validações
    if (!file.type.startsWith('image/')) {
      setError('O arquivo deve ser uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload para Supabase
      const url = await storageAPI.uploadImage(file, bucket, folder);
      onChange(url);
    } catch (err) {
      setError('Erro ao fazer upload da imagem');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (value) {
      try {
        await storageAPI.deleteImage(value, bucket);
      } catch (err) {
        console.error('Erro ao deletar imagem:', err);
      }
    }
    setPreview(undefined);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {label}
      </label>

      <div className="flex items-start gap-4">
        {/* Preview */}
        {preview ? (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-dashed border-gray-600">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {!uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors"
              >
                <i className="ri-close-line text-white text-sm"></i>
              </button>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <i className="ri-loader-4-line text-white text-2xl animate-spin"></i>
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`w-32 h-32 rounded-lg border-2 border-dashed ${
              darkMode ? 'border-gray-600 hover:border-purple-500' : 'border-gray-300 hover:border-purple-500'
            } flex flex-col items-center justify-center cursor-pointer transition-colors`}
          >
            {uploading ? (
              <i className="ri-loader-4-line text-3xl text-purple-500 animate-spin"></i>
            ) : (
              <>
                <i className="ri-image-add-line text-3xl text-gray-400 mb-2"></i>
                <span className="text-xs text-gray-400">Clique para enviar</span>
              </>
            )}
          </div>
        )}

        {/* Info */}
        <div className="flex-1">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            Formatos aceitos: JPG, PNG, WEBP
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            Tamanho máximo: 5MB
          </p>
          {error && (
            <p className="text-sm text-red-500 mt-2">
              <i className="ri-error-warning-line mr-1"></i>
              {error}
            </p>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
