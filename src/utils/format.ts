export function formatEquipamentoName(equip: any): string {
  if (!equip) return '';
  if (typeof equip === 'string') return equip;
  const nome = equip.nome || '';
  const numero = equip.numero ?? equip.numero_equipamento ?? equip.numero_eq;
  if (numero !== undefined && numero !== null && String(numero).trim() !== '') {
    return `${nome} ${String(numero)}º`;
  }
  return nome;
}
