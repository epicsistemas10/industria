# 📊 Estrutura do Banco de Dados - Sistema de Gestão Industrial

## 🎯 Visão Geral

Este documento descreve a estrutura completa do banco de dados do Sistema de Gestão de Entressafra e Manutenção Industrial para Algodoeira.

## 📁 Arquivos SQL

Os arquivos SQL estão organizados na pasta `/sql` e devem ser executados na ordem numérica:

1. `01_setores.sql` - Setores da indústria
2. `02_equipamentos.sql` - Equipamentos/máquinas
3. `03_tipos_componentes.sql` - Tipos de componentes
4. `04_componentes.sql` - Componentes/peças
5. `05_equipamentos_componentes.sql` - Relação equipamentos x componentes
6. `06_historico_revisoes.sql` - Histórico de revisões
7. `07_ordens_servico.sql` - Ordens de serviço
8. `08_os_componentes.sql` - Componentes usados nas OS
9. `09_equipes.sql` - Equipes e membros
10. `10_melhorias.sql` - Melhorias sugeridas
11. `11_rls_policies.sql` - Políticas de segurança RLS

## 🗂️ Tabelas Principais

### 1. **setores**
Armazena os setores da indústria (Descaroçador, Prensa, Pneumático, etc.)

**Campos:**
- `id` (UUID) - Chave primária
- `nome` (VARCHAR) - Nome do setor
- `descricao` (TEXT) - Descrição
- `cor` (VARCHAR) - Cor para identificação visual
- `created_at`, `updated_at` (TIMESTAMP)

**Setores Padrão:**
- Descaroçador
- Prensa
- Pneumático
- Misturador
- Classificação
- Sala Elétrica
- Transporte
- Limpeza
- Secagem
- Armazenamento

---

### 2. **equipamentos**
Cadastro completo de equipamentos/máquinas da indústria

**Campos:**
- `id` (UUID) - Chave primária
- `nome` (VARCHAR) - Nome do equipamento
- `setor_id` (UUID) - FK para setores
- `descricao` (TEXT)
- `fabricante` (VARCHAR)
- `modelo` (VARCHAR)
- `ano_fabricacao` (INTEGER)
- `criticidade` (VARCHAR) - Baixa, Média, Alta, Crítica
- `status_revisao` (INTEGER) - 0 a 100%
- `foto_url` (TEXT)
- `mtbf` (INTEGER) - Tempo médio entre falhas
- `data_inicio_revisao` (DATE)
- `data_prevista_fim` (DATE)
- `posicao_x`, `posicao_y` (FLOAT) - Posição no mapa
- `created_at`, `updated_at` (TIMESTAMP)

**Índices:**
- setor_id
- criticidade
- status_revisao
- nome

---

### 3. **tipos_componentes**
Tipos/categorias de componentes

**Campos:**
- `id` (UUID)
- `nome` (VARCHAR)
- `descricao` (TEXT)
- `icone` (VARCHAR) - Classe do ícone Remix Icon
- `created_at` (TIMESTAMP)

**Tipos Padrão:**
- Rolamento
- Correia
- Engrenagem
- Elétrica
- Hidráulica
- Pneumática
- Estrutural
- Serra
- Faca
- Polia
- Eixo
- Filtro

---

### 4. **componentes**
Cadastro de componentes/peças

**Campos:**
- `id` (UUID)
- `nome` (VARCHAR)
- `codigo_interno` (VARCHAR)
- `codigo_fabricante` (VARCHAR)
- `marca` (VARCHAR)
- `tipo_id` (UUID) - FK para tipos_componentes
- `medidas` (VARCHAR)
- `estoque_minimo` (INTEGER)
- `descricao` (TEXT)
- `foto_url` (TEXT)
- `preco_unitario` (DECIMAL)
- `created_at`, `updated_at` (TIMESTAMP)

**Índices:**
- tipo_id
- codigo_interno
- nome

---

### 5. **equipamentos_componentes** (Tabela Pivô)
Relação muitos-para-muitos entre equipamentos e componentes

**Campos:**
- `id` (UUID)
- `equipamento_id` (UUID) - FK para equipamentos
- `componente_id` (UUID) - FK para componentes
- `quantidade_usada` (INTEGER)
- `posicao` (VARCHAR) - Localização no equipamento
- `observacoes` (TEXT)
- `created_at` (TIMESTAMP)

**Constraint:**
- UNIQUE(equipamento_id, componente_id, posicao)

---

### 6. **historico_revisoes**
Histórico de revisões dos equipamentos

**Campos:**
- `id` (UUID)
- `equipamento_id` (UUID) - FK para equipamentos
- `data_revisao` (DATE)
- `tipo_revisao` (VARCHAR)
- `descricao` (TEXT)
- `responsavel` (VARCHAR)
- `custo_total` (DECIMAL)
- `tempo_parada` (INTEGER) - Em horas
- `observacoes` (TEXT)
- `created_at` (TIMESTAMP)

---

### 7. **ordens_servico**
Ordens de serviço de manutenção

**Campos:**
- `id` (UUID)
- `numero_os` (VARCHAR) - Número único da OS
- `equipamento_id` (UUID) - FK para equipamentos
- `titulo` (VARCHAR)
- `descricao` (TEXT)
- `tipo` (VARCHAR) - Preventiva, Corretiva, Preditiva, Melhoria
- `prioridade` (VARCHAR) - Baixa, Média, Alta, Urgente
- `status` (VARCHAR) - Aberta, Em Andamento, Pausada, Concluída, Cancelada
- `data_abertura` (TIMESTAMP)
- `data_inicio` (TIMESTAMP)
- `data_conclusao` (TIMESTAMP)
- `responsavel` (VARCHAR)
- `equipe_id` (UUID) - FK para equipes
- `custo_pecas` (DECIMAL)
- `custo_mao_obra` (DECIMAL)
- `tempo_estimado` (INTEGER) - Em horas
- `tempo_real` (INTEGER) - Em horas
- `observacoes` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

---

### 8. **os_componentes**
Componentes utilizados em cada OS

**Campos:**
- `id` (UUID)
- `os_id` (UUID) - FK para ordens_servico
- `componente_id` (UUID) - FK para componentes
- `quantidade` (INTEGER)
- `custo_unitario` (DECIMAL)
- `custo_total` (DECIMAL)
- `created_at` (TIMESTAMP)

---

### 9. **equipes**
Equipes de manutenção

**Campos:**
- `id` (UUID)
- `nome` (VARCHAR)
- `tipo` (VARCHAR)
- `turno` (VARCHAR)
- `status` (VARCHAR) - Disponível, Em Serviço, etc.
- `created_at` (TIMESTAMP)

---

### 10. **membros_equipe**
Membros das equipes

**Campos:**
- `id` (UUID)
- `equipe_id` (UUID) - FK para equipes
- `nome` (VARCHAR)
- `funcao` (VARCHAR)
- `telefone` (VARCHAR)
- `email` (VARCHAR)
- `created_at` (TIMESTAMP)

---

### 11. **melhorias**
Melhorias sugeridas durante a safra

**Campos:**
- `id` (UUID)
- `titulo` (VARCHAR)
- `descricao` (TEXT)
- `equipamento_id` (UUID) - FK para equipamentos
- `setor_id` (UUID) - FK para setores
- `tipo` (VARCHAR)
- `prioridade` (VARCHAR)
- `status` (VARCHAR) - Pendente, Em Análise, Aprovada, Implementada, Rejeitada
- `custo_estimado` (DECIMAL)
- `beneficio_esperado` (TEXT)
- `sugerido_por` (VARCHAR)
- `data_sugestao` (DATE)
- `data_implementacao` (DATE)
- `created_at` (TIMESTAMP)

---

## 🔐 Segurança (RLS)

Todas as tabelas possuem Row Level Security (RLS) habilitado com políticas públicas para:
- SELECT (leitura)
- INSERT (inserção)
- UPDATE (atualização)
- DELETE (exclusão)

**⚠️ IMPORTANTE:** As políticas atuais são públicas para desenvolvimento. Em produção, devem ser ajustadas para autenticação adequada.

---

## 🔗 Relacionamentos

```
setores (1) ----< (N) equipamentos
equipamentos (N) ----< (N) componentes [via equipamentos_componentes]
tipos_componentes (1) ----< (N) componentes
equipamentos (1) ----< (N) historico_revisoes
equipamentos (1) ----< (N) ordens_servico
ordens_servico (N) ----< (N) componentes [via os_componentes]
equipes (1) ----< (N) membros_equipe
equipes (1) ----< (N) ordens_servico
setores (1) ----< (N) melhorias
equipamentos (1) ----< (N) melhorias
```

---

## 📝 Notas de Implementação

1. **Ordem de Execução:** Execute os arquivos SQL na ordem numérica (01 a 11)
2. **Foreign Keys:** Todas as FKs possuem ON DELETE CASCADE quando apropriado
3. **Índices:** Criados para otimizar consultas frequentes
4. **Timestamps:** Todas as tabelas possuem created_at, algumas possuem updated_at
5. **UUIDs:** Todas as chaves primárias usam UUID v4

---

## 🚀 Próximos Passos

Após conectar o Supabase e executar os scripts SQL:

1. ✅ Criar telas de cadastro
2. ✅ Implementar CRUD completo
3. ✅ Desenvolver mapa industrial interativo
4. ✅ Criar sistema de planejamento
5. ✅ Implementar dashboard TV
6. ✅ Desenvolver relatórios

---

**Versão:** 1.0  
**Data:** 2024  
**Sistema:** AlgodoTech - Gestão Industrial
