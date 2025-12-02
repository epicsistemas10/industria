                <textarea value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-blue-500 outline-none`} rows={3} maxLength={500} />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className={`flex-1 px-6 py-3 rounded-lg border ${darkMode ? 'border-slate-600 text-gray-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} transition-all whitespace-nowrap cursor-pointer`}>Cancelar</button>
                <button type="submit" disabled={!formData.equipamento_id || !formData.servico_id || !formData.equipe_id} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Adicionar Atividade</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

