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

INSERT INTO servicos (codigo, nome) VALUES
('SER001','Ajuste e alinhamento de eixos'),
('SER002','Substituição de chavetas'),
('SER003','Aperto geral de parafusos'),
('SER004','Revisão de acoplamentos'),
('SER005','Ajuste de acoplamentos'),
('SER006','Troca de rolamentos'),
('SER007','Troca de mancais'),
('SER008','Troca de buchas'),
('SER009','Troca de esticador'),
('SER010','Revisão completa de eixo'),
('SER011','Balanceamento de eixo/rotor'),
('SER012','Lubrificação completa mecânica'),
('SER013','Inspeção de vibração e ruído'),
('SER014','Inspeção de travamentos e travas de segurança'),
('SER015','Recalço e nivelamento de máquinas'),
('SER016','Ajuste de bandejas e batentes'),
('SER017','Substituição de polias'),
('SER018','Substituição de roletes'),
('SER019','Reparo em suportes metálicos'),
('SER020','Solda e reforço estrutural'),

('SER030','Troca de correias'),
('SER031','Alinhamento de correias'),
('SER032','Tensionamento de correias'),
('SER033','Substituição de correias dentadas'),
('SER034','Substituição de correias planas'),
('SER035','Revisão de emendas de correia'),
('SER036','Conferência de desgaste das correias'),
('SER037','Alinhamento de polias'),
('SER038','Ajuste do esticador automático'),
('SER039','Limpeza de sistemas de correias'),

('SER050','Limpeza de motores elétricos'),
('SER051','Inspeção de cabos e terminais'),
('SER052','Termografia elétrica'),
('SER053','Teste de isolamento Megger'),
('SER054','Troca de contator'),
('SER055','Troca de relé térmico'),
('SER056','Teste de automação e sensores'),
('SER057','Teste de inversor de frequência'),
('SER058','Aperto geral de barramentos'),
('SER059','Limpeza de CCMs'),

('SER080','Limpeza de hélices de ventilador'),
('SER081','Balanceamento de rotor'),
('SER082','Inspeção de carcaças e vibração'),
('SER083','Troca de palhetas'),
('SER084','Inspeção de tubulação de ar'),
('SER085','Limpeza de dutos'),
('SER086','Limpeza de condensador'),
('SER087','Troca de manta filtrante'),

('SER100','Troca de correia transportadora'),
('SER101','Ajuste de roletes'),
('SER102','Troca de roletes superiores e inferiores'),
('SER103','Ajuste de raspadores'),
('SER104','Inspeção de emendas da fita'),
('SER105','Inspeção do motorredutor da fita'),

('SER120','Troca de helicoide da rosca'),
('SER121','Troca de acoplamento da rosca'),
('SER122','Lubrificação do eixo da rosca'),
('SER123','Inspeção de desgaste da camisa'),
('SER124','Limpeza interna da rosca'),
('SER125','Ajuste de mancais da rosca'),

('SER140','Pintura geral da máquina'),
('SER141','Pintura de estruturas metálicas'),
('SER142','Pintura de piso com demarcação'),
('SER143','Retoque de pintura de segurança'),

('SER160','Limpeza de plumas acumuladas'),
('SER161','Limpeza de canais de fibra'),
('SER162','Limpeza de ciclones'),
('SER163','Limpeza profunda de descarocador'),
('SER164','Limpeza da caixa de recuperação'),

('SER180','Calibração de sensores'),
('SER181','Sincronização de motores'),
('SER182','Teste de interface CLP/IHM'),

('SER200','Troca de serras do descarocador'),
('SER201','Troca de facas do HL'),
('SER202','Revisão da caixa de alimentação'),
('SER203','Revisão do tombador de fardos'),
('SER204','Revisão da ensacadeira'),
('SER205','Limpeza da pluma compactada'),
('SER206','Desobstrução de ciclones'),
('SER207','Troca de válvula de vácuo'),
('SER208','Ajuste de batedor inclinado'),
('SER209','Revisão da briqueteadeira');

COMMIT;

-- Notes:
-- - If you already deleted previous pecas entries as mentioned, this will only insert into `servicos`.
-- - Adjust column types or add extra columns if you need additional metadata (descricao, aplicavel etc.).
