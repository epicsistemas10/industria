import React from 'react';

interface Props {
  equipamento: any;
  className?: string;
  numberClassName?: string;
}

export default function EquipamentoName({ equipamento, className = '', numberClassName = 'text-yellow-300' }: Props) {
  if (!equipamento) return null;
  const nome = typeof equipamento === 'string' ? equipamento : (equipamento.nome || '');
  const numero = typeof equipamento === 'string' ? undefined : (equipamento.numero ?? equipamento.numero_equipamento ?? equipamento.numero_eq);

  return (
    <span className={className}>
      {nome}
      {numero !== undefined && numero !== null && String(numero).trim() !== '' && (
        <span className={`ml-2 font-medium ${numberClassName}`}>{String(numero)}º</span>
      )}
    </span>
  );
}
