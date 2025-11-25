import { supabase } from './supabase';

export const storageAPI = {
  /**
   * Upload de imagem para o Supabase Storage
   * @param file - Arquivo a ser enviado
   * @param bucket - Nome do bucket (equipamentos, componentes, ordens_servico, etc)
   * @param folder - Pasta dentro do bucket (opcional)
   * @returns URL pública da imagem
   */
  async uploadImage(file: File, bucket: string, folder?: string): Promise<string> {
    try {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('O arquivo deve ser uma imagem');
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB');
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Upload do arquivo
      const attemptUpload = async () => {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;
        return data;
      };

      let uploadResult;
      try {
        uploadResult = await attemptUpload();
      } catch (err: any) {
        // If the bucket does not exist, try to create it and retry once
        const msg = (err?.message || '').toString();
        if (msg.toLowerCase().includes('bucket not found')) {
          try {
            await supabase.storage.createBucket(bucket, {
              public: true,
              fileSizeLimit: 5242880,
              allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
            });
          } catch (createErr: any) {
            // ignore if already exists or fail - we'll handle below
            console.warn(`Could not create bucket ${bucket}:`, createErr?.message || createErr);
          }

          // retry upload once
          uploadResult = await attemptUpload();
        } else {
          throw err;
        }
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(uploadResult.path);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw error;
    }
  },

  /**
   * Upload de múltiplas imagens
   * @param files - Array de arquivos
   * @param bucket - Nome do bucket
   * @param folder - Pasta dentro do bucket (opcional)
   * @returns Array de URLs públicas
   */
  async uploadMultipleImages(files: File[], bucket: string, folder?: string): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file, bucket, folder));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Erro ao fazer upload múltiplo:', error);
      throw error;
    }
  },

  /**
   * Deletar imagem do Supabase Storage
   * @param url - URL da imagem
   * @param bucket - Nome do bucket
   */
  async deleteImage(url: string, bucket: string): Promise<void> {
    try {
      // Extrair o caminho do arquivo da URL
      const urlParts = url.split(`/storage/v1/object/public/${bucket}/`);
      if (urlParts.length < 2) {
        throw new Error('URL inválida');
      }

      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      throw error;
    }
  },

  /**
   * Deletar múltiplas imagens
   * @param urls - Array de URLs
   * @param bucket - Nome do bucket
   */
  async deleteMultipleImages(urls: string[], bucket: string): Promise<void> {
    try {
      const deletePromises = urls.map(url => this.deleteImage(url, bucket));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Erro ao deletar múltiplas imagens:', error);
      throw error;
    }
  },

  /**
   * Listar arquivos de um bucket
   * @param bucket - Nome do bucket
   * @param folder - Pasta dentro do bucket (opcional)
   */
  async listFiles(bucket: string, folder?: string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      throw error;
    }
  },

  /**
   * Criar buckets necessários (executar apenas uma vez)
   */
  async createBuckets() {
    const buckets = ['equipamentos', 'componentes', 'ordens_servico', 'melhorias', 'usuarios'];

    for (const bucket of buckets) {
      try {
        const { error } = await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        });

        if (error && !error.message.includes('already exists')) {
          console.error(`Erro ao criar bucket ${bucket}:`, error);
        }
      } catch (error) {
        console.error(`Erro ao criar bucket ${bucket}:`, error);
      }
    }
  },
};
