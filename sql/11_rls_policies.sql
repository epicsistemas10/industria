-- Habilitar Row Level Security (RLS)
ALTER TABLE setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_componentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE componentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipamentos_componentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_revisoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_componentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE membros_equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE melhorias ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura (SELECT)
CREATE POLICY "Permitir leitura pública" ON setores FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública" ON equipamentos FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública" ON tipos_componentes FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública" ON componentes FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública" ON equipamentos_componentes FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública" ON historico_revisoes FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública" ON ordens_servico FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública" ON os_componentes FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública" ON equipes FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública" ON membros_equipe FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública" ON melhorias FOR SELECT USING (true);

-- Políticas de Inserção (INSERT)
CREATE POLICY "Permitir inserção pública" ON setores FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir inserção pública" ON equipamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir inserção pública" ON tipos_componentes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir inserção pública" ON componentes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir inserção pública" ON equipamentos_componentes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir inserção pública" ON historico_revisoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir inserção pública" ON ordens_servico FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir inserção pública" ON os_componentes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir inserção pública" ON equipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir inserção pública" ON membros_equipe FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir inserção pública" ON melhorias FOR INSERT WITH CHECK (true);

-- Políticas de Atualização (UPDATE)
CREATE POLICY "Permitir atualização pública" ON setores FOR UPDATE USING (true);
CREATE POLICY "Permitir atualização pública" ON equipamentos FOR UPDATE USING (true);
CREATE POLICY "Permitir atualização pública" ON tipos_componentes FOR UPDATE USING (true);
CREATE POLICY "Permitir atualização pública" ON componentes FOR UPDATE USING (true);
CREATE POLICY "Permitir atualização pública" ON equipamentos_componentes FOR UPDATE USING (true);
CREATE POLICY "Permitir atualização pública" ON historico_revisoes FOR UPDATE USING (true);
CREATE POLICY "Permitir atualização pública" ON ordens_servico FOR UPDATE USING (true);
CREATE POLICY "Permitir atualização pública" ON os_componentes FOR UPDATE USING (true);
CREATE POLICY "Permitir atualização pública" ON equipes FOR UPDATE USING (true);
CREATE POLICY "Permitir atualização pública" ON membros_equipe FOR UPDATE USING (true);
CREATE POLICY "Permitir atualização pública" ON melhorias FOR UPDATE USING (true);

-- Políticas de Exclusão (DELETE)
CREATE POLICY "Permitir exclusão pública" ON setores FOR DELETE USING (true);
CREATE POLICY "Permitir exclusão pública" ON equipamentos FOR DELETE USING (true);
CREATE POLICY "Permitir exclusão pública" ON tipos_componentes FOR DELETE USING (true);
CREATE POLICY "Permitir exclusão pública" ON componentes FOR DELETE USING (true);
CREATE POLICY "Permitir exclusão pública" ON equipamentos_componentes FOR DELETE USING (true);
CREATE POLICY "Permitir exclusão pública" ON historico_revisoes FOR DELETE USING (true);
CREATE POLICY "Permitir exclusão pública" ON ordens_servico FOR DELETE USING (true);
CREATE POLICY "Permitir exclusão pública" ON os_componentes FOR DELETE USING (true);
CREATE POLICY "Permitir exclusão pública" ON equipes FOR DELETE USING (true);
CREATE POLICY "Permitir exclusão pública" ON membros_equipe FOR DELETE USING (true);
CREATE POLICY "Permitir exclusão pública" ON melhorias FOR DELETE USING (true);
