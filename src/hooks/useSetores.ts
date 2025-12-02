import { useEffect, useState, useCallback } from 'react';
import { setoresAPI } from '../lib/api';
import { useToast } from './useToast';

export default function useSetores() {
  const [setores, setSetores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await setoresAPI.getAll();
      setSetores(data || []);
    } catch (err) {
      console.error('Erro ao carregar setores:', err);
      showError('Erro ao carregar setores');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (payload: any) => {
    try {
      setLoading(true);
      const data = await setoresAPI.create(payload);
      success('Setor criado');
      setSetores((s) => [data, ...s]);
      return data;
    } catch (err) {
      console.error('Erro ao criar setor:', err);
      showError('Erro ao criar setor');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, payload: any) => {
    try {
      setLoading(true);
      const data = await setoresAPI.update(id, payload);
      success('Setor atualizado');
      setSetores((s) => s.map(x => x.id === id ? data : x));
      return data;
    } catch (err) {
      console.error('Erro ao atualizar setor:', err);
      showError('Erro ao atualizar setor');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      setLoading(true);
      await setoresAPI.delete(id);
      success('Setor removido');
      setSetores((s) => s.filter(x => x.id !== id));
      return true;
    } catch (err) {
      console.error('Erro ao remover setor:', err);
      showError('Erro ao remover setor');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    setores,
    loading,
    load,
    create,
    update,
    remove,
  };
}
