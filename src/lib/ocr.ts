// Sistema de OCR para leitura de placas e códigos
import Tesseract from 'tesseract.js';

interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

class OCRService {
  private worker: Tesseract.Worker | null = null;

  // Inicializar worker do Tesseract
  async initialize(): Promise<void> {
    if (this.worker) return;

    this.worker = await Tesseract.createWorker('por', 1, {
      logger: (m) => console.log(m),
    });
  }

  // Finalizar worker
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  // Processar imagem e extrair texto
  async recognizeText(image: string | File | Blob): Promise<OCRResult> {
    await this.initialize();

    if (!this.worker) {
      throw new Error('Worker OCR não inicializado');
    }

    const result = await this.worker.recognize(image);

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words.map((word) => ({
        text: word.text,
        confidence: word.confidence,
        bbox: word.bbox,
      })),
    };
  }

  // Extrair código de equipamento (formato: EQ-XXXX-XXXX)
  async extractEquipmentCode(image: string | File | Blob): Promise<string | null> {
    const result = await this.recognizeText(image);
    const text = result.text.toUpperCase();

    // Padrão: EQ-XXXX-XXXX ou EQP-XXXX-XXXX
    const codePattern = /EQ[P]?-\d{4}-\d{4}/g;
    const matches = text.match(codePattern);

    return matches ? matches[0] : null;
  }

  // Extrair código de barras (números)
  async extractBarcode(image: string | File | Blob): Promise<string | null> {
    const result = await this.recognizeText(image);
    const text = result.text.replace(/\s/g, '');

    // Padrão: 8 a 13 dígitos consecutivos
    const barcodePattern = /\d{8,13}/g;
    const matches = text.match(barcodePattern);

    return matches ? matches[0] : null;
  }

  // Extrair número de série
  async extractSerialNumber(image: string | File | Blob): Promise<string | null> {
    const result = await this.recognizeText(image);
    const text = result.text.toUpperCase();

    // Padrão: SN: XXXXXXXXXX ou S/N: XXXXXXXXXX
    const serialPattern = /S[\/]?N[:\s]+([A-Z0-9-]+)/g;
    const matches = serialPattern.exec(text);

    return matches ? matches[1] : null;
  }

  // Extrair placa de identificação completa
  async extractPlateInfo(image: string | File | Blob): Promise<{
    equipmentCode?: string;
    serialNumber?: string;
    manufacturer?: string;
    model?: string;
    year?: string;
  }> {
    const result = await this.recognizeText(image);
    const lines = result.text.split('\n').map((line) => line.trim());

    const info: any = {};

    for (const line of lines) {
      const upperLine = line.toUpperCase();

      // Código do equipamento
      if (upperLine.includes('EQUIPAMENTO') || upperLine.includes('EQUIPMENT')) {
        const codeMatch = line.match(/[A-Z]{2,3}-\d{4}-\d{4}/);
        if (codeMatch) info.equipmentCode = codeMatch[0];
      }

      // Número de série
      if (upperLine.includes('SERIAL') || upperLine.includes('S/N')) {
        const serialMatch = line.match(/[A-Z0-9-]{8,}/);
        if (serialMatch) info.serialNumber = serialMatch[0];
      }

      // Fabricante
      if (upperLine.includes('FABRICANTE') || upperLine.includes('MANUFACTURER')) {
        const parts = line.split(':');
        if (parts.length > 1) info.manufacturer = parts[1].trim();
      }

      // Modelo
      if (upperLine.includes('MODELO') || upperLine.includes('MODEL')) {
        const parts = line.split(':');
        if (parts.length > 1) info.model = parts[1].trim();
      }

      // Ano
      if (upperLine.includes('ANO') || upperLine.includes('YEAR')) {
        const yearMatch = line.match(/\d{4}/);
        if (yearMatch) info.year = yearMatch[0];
      }
    }

    return info;
  }

  // Pré-processar imagem para melhor OCR
  preprocessImage(imageElement: HTMLImageElement): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Não foi possível criar contexto do canvas');
    }

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;

    // Desenhar imagem
    ctx.drawImage(imageElement, 0, 0);

    // Converter para escala de cinza
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }

    // Aumentar contraste
    const contrast = 50;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      data[i] = factor * (data[i] - 128) + 128;
      data[i + 1] = factor * (data[i + 1] - 128) + 128;
      data[i + 2] = factor * (data[i + 2] - 128) + 128;
    }

    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL();
  }

  // Capturar imagem da câmera
  async captureFromCamera(): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');

      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          video.srcObject = stream;
          video.play();

          video.addEventListener('loadedmetadata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Não foi possível criar contexto do canvas'));
              return;
            }

            ctx.drawImage(video, 0, 0);

            // Parar stream
            stream.getTracks().forEach((track) => track.stop());

            resolve(canvas.toDataURL());
          });
        })
        .catch(reject);
    });
  }
}

export const ocrService = new OCRService();
