import { useState, useRef } from 'react';
import { ocrService } from '../../lib/ocr';
import { useToast } from '../../hooks/useToast';

export default function LeitorPlacas() {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [mode, setMode] = useState<'upload' | 'camera'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Upload de imagem
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setImage(imageUrl);
      processImage(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  // Iniciar câmera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (err) {
      showError('Erro ao acessar câmera');
      console.error(err);
    }
  };

  // Parar câmera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Capturar foto da câmera
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const imageUrl = canvas.toDataURL();

    setImage(imageUrl);
    stopCamera();
    processImage(imageUrl);
  };

  // Processar imagem com OCR
  const processImage = async (imageUrl: string) => {
    setLoading(true);
    try {
      const plateInfo = await ocrService.extractPlateInfo(imageUrl);
      setResult(plateInfo);
      success('Placa processada com sucesso!');
    } catch (err) {
      showError('Erro ao processar imagem');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Limpar
  const handleClear = () => {
    setImage('');
    setResult(null);
    stopCamera();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <i className="ri-qr-scan-2-line mr-3"></i>
            Leitor de Placas e Códigos
          </h1>
          <p className="text-slate-400">
            Escaneie placas de identificação, códigos de barras e números de série
          </p>
        </div>

        {/* Seletor de Modo */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setMode('upload');
              stopCamera();
            }}
            className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all whitespace-nowrap ${
              mode === 'upload'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <i className="ri-upload-2-line mr-2"></i>
            Upload de Imagem
          </button>
          <button
            onClick={() => {
              setMode('camera');
              startCamera();
            }}
            className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all whitespace-nowrap ${
              mode === 'camera'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <i className="ri-camera-line mr-2"></i>
            Usar Câmera
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Área de Captura */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-4">
              {mode === 'upload' ? (
                <>
                  <i className="ri-image-line mr-2"></i>
                  Imagem
                </>
              ) : (
                <>
                  <i className="ri-camera-line mr-2"></i>
                  Câmera
                </>
              )}
            </h3>

            {/* Upload */}
            {mode === 'upload' && !image && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 transition-all"
              >
                <i className="ri-upload-cloud-2-line text-6xl text-slate-500 mb-4"></i>
                <p className="text-slate-400 mb-2">Clique para fazer upload</p>
                <p className="text-sm text-slate-500">PNG, JPG até 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* Câmera */}
            {mode === 'camera' && !image && (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-xl bg-black"
                />
                {stream && (
                  <button
                    onClick={capturePhoto}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                  >
                    <i className="ri-camera-fill text-3xl text-slate-900"></i>
                  </button>
                )}
              </div>
            )}

            {/* Imagem Capturada */}
            {image && (
              <div className="relative">
                <img src={image} alt="Captura" className="w-full rounded-xl" />
                <button
                  onClick={handleClear}
                  className="absolute top-4 right-4 w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <i className="ri-loader-4-line animate-spin text-4xl text-blue-400 mb-4"></i>
                  <p className="text-slate-400">Processando imagem...</p>
                </div>
              </div>
            )}
          </div>

          {/* Resultados */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-4">
              <i className="ri-file-list-3-line mr-2"></i>
              Informações Extraídas
            </h3>

            {!result && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <i className="ri-scan-2-line text-6xl text-slate-600 mb-4"></i>
                <p className="text-slate-400">
                  Nenhuma informação extraída ainda
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Faça upload de uma imagem ou use a câmera
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {result.equipmentCode && (
                  <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                    <div className="text-sm text-slate-400 mb-1">Código do Equipamento</div>
                    <div className="text-xl font-bold text-green-400 font-mono">
                      {result.equipmentCode}
                    </div>
                  </div>
                )}

                {result.serialNumber && (
                  <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                    <div className="text-sm text-slate-400 mb-1">Número de Série</div>
                    <div className="text-xl font-bold text-blue-400 font-mono">
                      {result.serialNumber}
                    </div>
                  </div>
                )}

                {result.manufacturer && (
                  <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                    <div className="text-sm text-slate-400 mb-1">Fabricante</div>
                    <div className="text-lg font-semibold text-white">
                      {result.manufacturer}
                    </div>
                  </div>
                )}

                {result.model && (
                  <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                    <div className="text-sm text-slate-400 mb-1">Modelo</div>
                    <div className="text-lg font-semibold text-white">
                      {result.model}
                    </div>
                  </div>
                )}

                {result.year && (
                  <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                    <div className="text-sm text-slate-400 mb-1">Ano</div>
                    <div className="text-lg font-semibold text-white">
                      {result.year}
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                      success('Informações copiadas!');
                    }}
                    className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all whitespace-nowrap"
                  >
                    <i className="ri-file-copy-line mr-2"></i>
                    Copiar
                  </button>
                  <button
                    onClick={handleClear}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-semibold transition-all whitespace-nowrap"
                  >
                    <i className="ri-refresh-line mr-2"></i>
                    Nova Leitura
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instruções */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-400 mb-3">
            <i className="ri-lightbulb-line mr-2"></i>
            Dicas para Melhor Leitura
          </h3>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <i className="ri-checkbox-circle-fill text-blue-400 mt-1"></i>
              <span>Certifique-se de que a placa está bem iluminada</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="ri-checkbox-circle-fill text-blue-400 mt-1"></i>
              <span>Mantenha a câmera paralela à placa</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="ri-checkbox-circle-fill text-blue-400 mt-1"></i>
              <span>Evite reflexos e sombras</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="ri-checkbox-circle-fill text-blue-400 mt-1"></i>
              <span>Use imagens com boa resolução</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
