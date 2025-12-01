-- Create table `servicos` (if not exists) and insert provided services
-- Fields: id, codigo (unique), nome, categoria, created_at
-- Execute this file on Supabase SQL editor to create the table and insert data.

create table if not exists servicos (
  id uuid default gen_random_uuid() primary key,
  codigo text unique,
  nome text not null,
  categoria text,
  created_at timestamptz default now()
);

BEGIN;

INSERT INTO servicos (codigo, nome, categoria) VALUES
('SER001','Ajuste e alinhamento de eixos','Mecânico'),
('SER002','Substituição de chavetas','Mecânico'),
('SER003','Aperto geral de parafusos','Mecânico'),
('SER004','Revisão de acoplamentos','Mecânico'),
('SER005','Ajuste de acoplamentos','Mecânico'),
('SER006','Troca de rolamentos','Mecânico'),
('SER007','Troca de mancais','Mecânico'),
('SER008','Troca de buchas','Mecânico'),
('SER009','Troca de esticador','Mecânico'),
('SER010','Revisão completa de eixo','Mecânico'),
('SER011','Balanceamento de eixo/rotor','Mecânico'),
('SER012','Lubrificação completa mecânica','Lubrificação'),
('SER013','Inspeção de vibração e ruído','Mecânico'),
('SER014','Inspeção de travamentos e travas de segurança','Segurança'),
('SER015','Recalço e nivelamento de máquinas','Mecânico'),
('SER016','Ajuste de bandejas e batentes','Mecânico'),
('SER017','Substituição de polias','Transmissão'),
('SER018','Substituição de roletes','Mecânico'),
('SER019','Reparo em suportes metálicos','Estrutural'),
('SER020','Solda e reforço estrutural','Estrutural'),

('SER030','Troca de correias','Transmissão'),
('SER031','Alinhamento de correias','Transmissão'),
('SER032','Tensionamento de correias','Transmissão'),
('SER033','Substituição de correias dentadas','Transmissão'),
('SER034','Substituição de correias planas','Transmissão'),
('SER035','Revisão de emendas de correia','Transmissão'),
('SER036','Conferência de desgaste das correias','Transmissão'),
('SER037','Alinhamento de polias','Transmissão'),
('SER038','Ajuste do esticador automático','Transmissão'),
('SER039','Limpeza de sistemas de correias','Transmissão'),

('SER050','Limpeza de motores elétricos','Elétrica'),
('SER051','Inspeção de cabos e terminais','Elétrica'),
('SER052','Termografia elétrica','Elétrica'),
('SER053','Teste de isolamento Megger','Elétrica'),
('SER054','Troca de contator','Elétrica'),
('SER055','Troca de relé térmico','Elétrica'),
('SER056','Teste de automação e sensores','Automação'),
('SER057','Teste de inversor de frequência','Automação'),
('SER058','Aperto geral de barramentos','Elétrica'),
('SER059','Limpeza de CCMs','Elétrica'),

('SER080','Limpeza de hélices de ventilador','Ventilação'),
('SER081','Balanceamento de rotor','Ventilação'),
('SER082','Inspeção de carcaças e vibração','Ventilação'),
('SER083','Troca de palhetas','Ventilação'),
('SER084','Inspeção de tubulação de ar','Ventilação'),
('SER085','Limpeza de dutos','Ventilação'),
('SER086','Limpeza de condensador','Ventilação'),
('SER087','Troca de manta filtrante','Ventilação'),

('SER100','Troca de correia transportadora','Fitas'),
('SER101','Ajuste de roletes','Fitas'),
('SER102','Troca de roletes superiores e inferiores','Fitas'),
('SER103','Ajuste de raspadores','Fitas'),
('SER104','Inspeção de emendas da fita','Fitas'),
('SER105','Inspeção do motorredutor da fita','Fitas'),

('SER120','Troca de helicoide da rosca','Roscas'),
('SER121','Troca de acoplamento da rosca','Roscas'),
('SER122','Lubrificação do eixo da rosca','Lubrificação'),
('SER123','Inspeção de desgaste da camisa','Roscas'),
('SER124','Limpeza interna da rosca','Roscas'),
('SER125','Ajuste de mancais da rosca','Roscas'),

('SER140','Pintura geral da máquina','Pintura'),
('SER141','Pintura de estruturas metálicas','Pintura'),
('SER142','Pintura de piso com demarcação','Pintura'),
('SER143','Retoque de pintura de segurança','Pintura'),

('SER160','Limpeza de plumas acumuladas','Limpeza'),
('SER161','Limpeza de canais de fibra','Limpeza'),
('SER162','Limpeza de ciclones','Limpeza'),
('SER163','Limpeza profunda de descarocador','Limpeza'),
('SER164','Limpeza da caixa de recuperação','Limpeza'),

('SER180','Calibração de sensores','Automação'),
('SER181','Sincronização de motores','Automação'),
('SER182','Teste de interface CLP/IHM','Automação'),

('SER200','Troca de serras do descarocador','Específico'),
('SER201','Troca de facas do HL','Específico'),
('SER202','Revisão da caixa de alimentação','Específico'),
('SER203','Revisão do tombador de fardos','Específico'),
('SER204','Revisão da ensacadeira','Específico'),
('SER205','Limpeza da pluma compactada','Específico'),
('SER206','Desobstrução de ciclones','Específico'),
('SER207','Troca de válvula de vácuo','Específico'),
('SER208','Ajuste de batedor inclinado','Específico'),
('SER209','Revisão da briqueteadeira','Específico');

COMMIT;

-- Notes:
-- - If you already deleted previous pecas entries as mentioned, this will only insert into `servicos`.
-- - Adjust column types or add extra columns if you need additional metadata (descricao, aplicavel etc.).
