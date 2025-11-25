import { useEffect, useState } from 'react';
import { panoramasAPI } from '../lib/api';
import { storageAPI } from '../lib/storage';
import { useToast } from './useToast';

export interface PanoramaItem {
  id: string;
  titulo?: string;
  descricao?: string;
  url: string;
  created_at?: string;
}

export function usePanoramas() {
  const [panoramas, setPanoramas] = useState<PanoramaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const data = await panoramasAPI.getAll();
      setPanoramas(data || []);
    } catch (err) {
      console.error('Erro ao carregar panoramas:', err);
      toast.error('Erro ao carregar panoramas');
      setPanoramas([]);
    } finally {
      setLoading(false);
    }
  };

  const uploadAndCreate = async (file: File, meta: Partial<PanoramaItem> = {}) => {
    try {
      setLoading(true);
      const publicUrl = await storageAPI.uploadImage(file, 'panoramas', 'images');
      const created = await panoramasAPI.create({ ...meta, url: publicUrl });
      toast.success('Panorama criado');
      await load();
      return created;
    } catch (err) {
      console.error('Erro ao criar panorama:', err);
      toast.error('Erro ao criar panorama');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      setLoading(true);
      await panoramasAPI.delete(id);
      toast.success('Panorama removido');
      await load();
    } catch (err) {
      console.error('Erro ao remover panorama:', err);
      toast.error('Erro ao remover panorama');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { panoramas, loading, load, uploadAndCreate, remove };
}

export default usePanoramas;
