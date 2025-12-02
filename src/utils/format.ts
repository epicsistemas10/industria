export function formatEquipamentoName(equip: any): string {
  if (!equip) return '';
  if (typeof equip === 'string') return equip;
  const nome = equip.nome || '';
  const numero = equip.numero ?? equip.numero_equipamento ?? equip.numero_eq;
  // Campos adicionais que podem existir no cadastro do equipamento
  const ind = equip.ind || equip.indicativo || equip.indicador;
  const linha1 = equip.linha1 || equip.linha_1 || equip.linha;
  const linha2 = equip.linha2 || equip.linha_2;
  const iba = equip.iba;

  const parts: string[] = [];
  if (ind) parts.push(String(ind));
  if (linha1 && linha2) parts.push(`${linha1} / ${linha2}`);
  else if (linha1) parts.push(String(linha1));
  if (iba) parts.push(String(iba));

  const base = parts.length > 0 ? `${parts.join(' — ')} — ${nome}` : nome;

  if (numero !== undefined && numero !== null && String(numero).trim() !== '') {
    return `${base} ${String(numero)}º`;
  }

  return base;
}
