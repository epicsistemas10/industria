-- Insert de serviços (transformados em 'peças')
-- Map: JSON.servico -> pecas.nome
--      JSON.codigo  -> pecas.codigo_fabricante
--      JSON.categoria/descricao/aplicavel -> pecas.observacoes (guardados como JSON string)
-- Execute este arquivo no editor SQL do Supabase para inserir os registros.

BEGIN;

INSERT INTO pecas (nome, codigo_fabricante, observacoes)
VALUES
('Ajuste e alinhamento de eixos', 'SER001', '{"categoria":"Mecânica","descricao":"Realiza alinhamento dos eixos principais e secundários.","aplicavel":["Prensa","Ventiladores","Fitas","Roscas","HL","Ensacadeira"]}'),
('Substituição de chavetas', 'SER002', '{"categoria":"Mecânica","descricao":"Troca e ajuste de chavetas desgastadas ou soltas.","aplicavel":["Prensa","Descarocador","Ventiladores","Roscas"]}'),
('Aperto geral de parafusos', 'SER003', '{"categoria":"Mecânica","descricao":"Reaperto completo de parafusos estruturais e mecânicos.","aplicavel":["Todos"]}'),
('Revisão de acoplamentos', 'SER004', '{"categoria":"Mecânica","descricao":"Verificação de desgastes, folgas e travamentos.","aplicavel":["Prensa","Ventiladores","Roscas","HL"]}'),
('Ajuste de acoplamentos', 'SER005', '{"categoria":"Mecânica","descricao":"Correção de desalinhamentos e vibrações.","aplicavel":["Ventiladores","Prensa","Fitas","Roscas"]}'),
('Troca de rolamentos', 'SER006', '{"categoria":"Mecânica","descricao":"Substituição de rolamentos com desgaste ou travamento.","aplicavel":["Todos"]}'),
('Troca de mancais', 'SER007', '{"categoria":"Mecânica","descricao":"Substituição de mancais em eixos, roscas e transportadores.","aplicavel":["Fitas","Roscas","Ventiladores","HL"]}'),
('Troca de buchas', 'SER008', '{"categoria":"Mecânica","descricao":"Correção de folgas estruturais em máquinas.","aplicavel":["Prensa","Descarocador","HL"]}'),
('Troca de esticador', 'SER009', '{"categoria":"Mecânica","descricao":"Instalação de novos esticadores de correias ou correntes.","aplicavel":["Fitas","Roscas","Batedores","Ventiladores"]}'),
('Troca de correias', 'SER030', '{"categoria":"Correias","descricao":"Substituição de correias danificadas ou desgastadas.","aplicavel":["Prensa","Ventiladores","Descarocador","Fitas","HL"]}'),
('Alinhamento de correias', 'SER031', '{"categoria":"Correias","descricao":"Correção de desalinhamento e ajustes laterais.","aplicavel":["Fitas","Ventiladores","Batedores"]}'),
('Tensionamento de correias', 'SER032', '{"categoria":"Correias","descricao":"Ajuste do tensionamento ideal para funcionamento seguro.","aplicavel":["Todos que usam correias"]}'),
('Limpeza de motores elétricos', 'SER050', '{"categoria":"Elétrica","descricao":"Limpeza interna e externa de motores.","aplicavel":["Todos"]}'),
('Inspeção de cabos e terminais', 'SER051', '{"categoria":"Elétrica","descricao":"Checagem de aquecimento, oxidação e mau contato.","aplicavel":["CCMs","Painéis","Motores"]}'),
('Termografia elétrica', 'SER052', '{"categoria":"Elétrica","descricao":"Análise de pontos quentes em conexões e barramentos.","aplicavel":["CCMs","Motores","Painéis"]}'),
('Limpeza de hélices de ventiladores', 'SER080', '{"categoria":"Ventilação","descricao":"Remoção de plumas e sujeiras que causam vibração.","aplicavel":["Ventiladores","Ciclones","HL"]}'),
('Balanceamento de rotor', 'SER081', '{"categoria":"Ventilação","descricao":"Ajuste dinâmico para reduzir vibração e ruído.","aplicavel":["Ventiladores","Ciclones","Condensadores"]}'),
('Troca da correia transportadora', 'SER100', '{"categoria":"Fitas Transportadoras","descricao":"Substituição completa de correia de borracha.","aplicavel":["Fita Transportadora de Caroço"]}'),
('Ajuste dos roletes', 'SER101', '{"categoria":"Fitas Transportadoras","descricao":"Correção de desalinhamento dos roletes.","aplicavel":["Fitas"]}'),
('Troca de helicoide da rosca', 'SER120', '{"categoria":"Roscas","descricao":"Substituição de helicoide desgastada.","aplicavel":["Rosca de Casca","Rosca de Fibrilha"]}'),
('Troca de acoplamento da rosca', 'SER121', '{"categoria":"Roscas","descricao":"Troca de acoplamento danificado.","aplicavel":["Roscas"]}'),
('Pintura geral da máquina', 'SER140', '{"categoria":"Pintura","descricao":"Pintura industrial completa, renovação estética.","aplicavel":["Todos"]}'),
('Pintura de estruturas metálicas', 'SER141', '{"categoria":"Pintura","descricao":"Aplicação de tinta anticorrosiva em plataformas e suportes.","aplicavel":["Plataformas","Passarelas","Estruturas"]}'),
('Calibração de sensores', 'SER180', '{"categoria":"Automação","descricao":"Ajuste de sensores indutivos, capacitivos e fotocélulas.","aplicavel":["Todos com automação"]}'),
('Teste de inversor de frequência', 'SER181', '{"categoria":"Automação","descricao":"Checagem de parâmetros, rampas e falhas.","aplicavel":["Motores","Prensa","Ventiladores"]}'),
('Troca de serras do descarocador', 'SER200', '{"categoria":"Descarocador","descricao":"Substituição das serras de corte.","aplicavel":["Descarocador"]}'),
('Revisão da caixa de alimentação', 'SER202', '{"categoria":"Alimentação","descricao":"Regulagem da comporta, sensores e fluxo de pluma.","aplicavel":["Caixa de Alimentação"]}'),
('Revisão da briqueteadeira', 'SER209', '{"categoria":"Briqueteadeira","descricao":"Limpeza, ajuste, troca de roletes e verificação de pressão.","aplicavel":["Briqueteadeira"]}');

COMMIT;

-- Observações:
-- - Este arquivo insere registros sem associá-los a um `componente_id` ou valores financeiros/vida útil.
-- - Se você quiser vincular a um `componente_id`, substitua NULL por um UUID específico e ajuste conforme necessário.
-- - Os dados extras estão em `observacoes` como JSON text; se preferir separar em colunas, altere o esquema antes.
