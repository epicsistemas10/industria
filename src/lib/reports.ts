// Sistema de geração de relatórios em PDF e Excel
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { supabase } from './supabase';

export interface ReportOptions {
  title: string;
  subtitle?: string;
  filters?: Record<string, any>;
  dateRange?: { start: Date; end: Date };
}

export const reportService = {
  // Gerar relatório de equipamentos em PDF
  async generateEquipamentosPDF(equipamentos: any[], options: ReportOptions) {
    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(18);
    doc.text(options.title, 14, 20);
    
    if (options.subtitle) {
      doc.setFontSize(12);
      doc.text(options.subtitle, 14, 28);
    }
    
    // Data do relatório
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 35);
    
    // Tabela de equipamentos
    autoTable(doc, {
      startY: 40,
      head: [['Nome', 'Setor', 'Status', 'Criticidade', 'Fabricante', 'Modelo']],
      body: equipamentos.map(eq => [
        eq.nome,
        eq.setor?.nome || 'N/A',
        eq.status || 'N/A',
        eq.criticidade,
        eq.fabricante || 'N/A',
        eq.modelo || 'N/A'
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    // Salvar PDF
    doc.save(`equipamentos_${new Date().getTime()}.pdf`);
  },

  // Gerar relatório de equipamentos em Excel
  async generateEquipamentosExcel(equipamentos: any[], options: ReportOptions) {
    const data = equipamentos.map(eq => ({
      'Nome': eq.nome,
      'Setor': eq.setor?.nome || 'N/A',
      'Status': eq.status || 'N/A',
      'Criticidade': eq.criticidade,
      'Fabricante': eq.fabricante || 'N/A',
      'Modelo': eq.modelo || 'N/A',
      'Ano': eq.ano_fabricacao || 'N/A',
      'MTBF (h)': eq.mtbf || 'N/A',
      'Última Revisão': eq.ultima_revisao ? new Date(eq.ultima_revisao).toLocaleDateString('pt-BR') : 'N/A',
      'Próxima Revisão': eq.proxima_revisao ? new Date(eq.proxima_revisao).toLocaleDateString('pt-BR') : 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Equipamentos');
    
    XLSX.writeFile(wb, `equipamentos_${new Date().getTime()}.xlsx`);
  },

  // Gerar relatório de ordens de serviço em PDF
  async generateOrdemServicoPDF(ordens: any[], options: ReportOptions) {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(options.title, 14, 20);
    
    if (options.subtitle) {
      doc.setFontSize(12);
      doc.text(options.subtitle, 14, 28);
    }
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 35);
    
    autoTable(doc, {
      startY: 40,
      head: [['Número', 'Título', 'Status', 'Prioridade', 'Equipamento', 'Custo Real']],
      body: ordens.map(os => [
        os.numero,
        os.titulo,
        os.status,
        os.prioridade,
        os.equipamento?.nome || 'N/A',
        `R$ ${os.custo_real?.toFixed(2) || '0.00'}`
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] }
    });
    
    doc.save(`ordens_servico_${new Date().getTime()}.pdf`);
  },

  // Gerar relatório de ordens de serviço em Excel
  async generateOrdemServicoExcel(ordens: any[], options: ReportOptions) {
    const data = ordens.map(os => ({
      'Número': os.numero,
      'Título': os.titulo,
      'Status': os.status,
      'Prioridade': os.prioridade,
      'Equipamento': os.equipamento?.nome || 'N/A',
      'Responsável': os.responsavel || 'N/A',
      'Equipe': os.equipe?.nome || 'N/A',
      'Data Abertura': new Date(os.data_abertura).toLocaleDateString('pt-BR'),
      'Data Início': os.data_inicio ? new Date(os.data_inicio).toLocaleDateString('pt-BR') : 'N/A',
      'Data Conclusão': os.data_conclusao ? new Date(os.data_conclusao).toLocaleDateString('pt-BR') : 'N/A',
      'Custo Estimado': `R$ ${os.custo_estimado?.toFixed(2) || '0.00'}`,
      'Custo Real': `R$ ${os.custo_real?.toFixed(2) || '0.00'}`
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ordens de Serviço');
    
    XLSX.writeFile(wb, `ordens_servico_${new Date().getTime()}.xlsx`);
  },

  // Gerar relatório de custos em PDF
  async generateCustosPDF(custos: any[], options: ReportOptions) {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(options.title, 14, 20);
    
    if (options.subtitle) {
      doc.setFontSize(12);
      doc.text(options.subtitle, 14, 28);
    }
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 35);
    
    // Calcular totais
    const total = custos.reduce((sum, c) => sum + (c.valor_total || 0), 0);
    doc.text(`Total Geral: R$ ${total.toFixed(2)}`, 14, 42);
    
    autoTable(doc, {
      startY: 48,
      head: [['Tipo', 'Descrição', 'Quantidade', 'Valor Unit.', 'Valor Total', 'Data']],
      body: custos.map(c => [
        c.tipo,
        c.descricao,
        c.quantidade || 1,
        `R$ ${c.valor_unitario?.toFixed(2) || '0.00'}`,
        `R$ ${c.valor_total?.toFixed(2) || '0.00'}`,
        new Date(c.data).toLocaleDateString('pt-BR')
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [168, 85, 247] }
    });
    
    doc.save(`custos_${new Date().getTime()}.pdf`);
  },

  // Gerar relatório de custos em Excel
  async generateCustosExcel(custos: any[], options: ReportOptions) {
    const data = custos.map(c => ({
      'Tipo': c.tipo,
      'Descrição': c.descricao,
      'Equipamento': c.equipamento?.nome || 'N/A',
      'Componente': c.componente?.nome || 'N/A',
      'Quantidade': c.quantidade || 1,
      'Valor Unitário': c.valor_unitario?.toFixed(2) || '0.00',
      'Valor Total': c.valor_total?.toFixed(2) || '0.00',
      'Data': new Date(c.data).toLocaleDateString('pt-BR'),
      'Observações': c.observacoes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Custos');
    
    // Adicionar linha de total
    const totalRow = {
      'Tipo': 'TOTAL',
      'Descrição': '',
      'Equipamento': '',
      'Componente': '',
      'Quantidade': '',
      'Valor Unitário': '',
      'Valor Total': custos.reduce((sum, c) => sum + (c.valor_total || 0), 0).toFixed(2),
      'Data': '',
      'Observações': ''
    };
    XLSX.utils.sheet_add_json(ws, [totalRow], { skipHeader: true, origin: -1 });
    
    XLSX.writeFile(wb, `custos_${new Date().getTime()}.xlsx`);
  },

  // Gerar relatório de melhorias em PDF
  async generateMelhoriasPDF(melhorias: any[], options: ReportOptions) {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(options.title, 14, 20);
    
    if (options.subtitle) {
      doc.setFontSize(12);
      doc.text(options.subtitle, 14, 28);
    }
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 35);
    
    // Calcular economia total
    const economiaTotal = melhorias
      .filter(m => m.status === 'concluida')
      .reduce((sum, m) => sum + (m.economia_estimada || 0), 0);
    doc.text(`Economia Total: R$ ${economiaTotal.toFixed(2)}`, 14, 42);
    
    autoTable(doc, {
      startY: 48,
      head: [['Título', 'Tipo', 'Status', 'Prioridade', 'Custo', 'Economia']],
      body: melhorias.map(m => [
        m.titulo,
        m.tipo,
        m.status,
        m.prioridade,
        `R$ ${m.custo_estimado?.toFixed(2) || '0.00'}`,
        `R$ ${m.economia_estimada?.toFixed(2) || '0.00'}`
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 158, 11] }
    });
    
    doc.save(`melhorias_${new Date().getTime()}.pdf`);
  },

  // Gerar relatório de melhorias em Excel
  async generateMelhoriasExcel(melhorias: any[], options: ReportOptions) {
    const data = melhorias.map(m => ({
      'Título': m.titulo,
      'Tipo': m.tipo,
      'Status': m.status,
      'Prioridade': m.prioridade,
      'Equipamento': m.equipamento?.nome || 'N/A',
      'Solicitante': m.solicitante || 'N/A',
      'Custo Estimado': m.custo_estimado?.toFixed(2) || '0.00',
      'Economia Estimada': m.economia_estimada?.toFixed(2) || '0.00',
      'Data Solicitação': new Date(m.data_solicitacao).toLocaleDateString('pt-BR'),
      'Data Implementação': m.data_implementacao ? new Date(m.data_implementacao).toLocaleDateString('pt-BR') : 'N/A',
      'Descrição': m.descricao
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Melhorias');
    
    XLSX.writeFile(wb, `melhorias_${new Date().getTime()}.xlsx`);
  },

  // Gerar relatório consolidado em PDF
  async generateConsolidatedPDF(data: any, options: ReportOptions) {
    const doc = new jsPDF();
    let yPos = 20;
    
    // Título
    doc.setFontSize(20);
    doc.text('Relatório Consolidado de Manutenção', 14, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Período: ${options.dateRange?.start.toLocaleDateString('pt-BR')} a ${options.dateRange?.end.toLocaleDateString('pt-BR')}`, 14, yPos);
    yPos += 5;
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, yPos);
    yPos += 15;
    
    // Resumo Executivo
    doc.setFontSize(14);
    doc.text('Resumo Executivo', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.text(`Total de Equipamentos: ${data.equipamentos?.length || 0}`, 14, yPos);
    yPos += 6;
    doc.text(`Ordens de Serviço: ${data.ordens?.length || 0}`, 14, yPos);
    yPos += 6;
    doc.text(`Custo Total: R$ ${data.custoTotal?.toFixed(2) || '0.00'}`, 14, yPos);
    yPos += 6;
    doc.text(`Economia com Melhorias: R$ ${data.economiaTotal?.toFixed(2) || '0.00'}`, 14, yPos);
    yPos += 15;
    
    // Equipamentos Críticos
    if (data.equipamentosCriticos?.length > 0) {
      doc.setFontSize(12);
      doc.text('Equipamentos Críticos', 14, yPos);
      yPos += 8;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Nome', 'Setor', 'Status', 'Criticidade']],
        body: data.equipamentosCriticos.map((eq: any) => [
          eq.nome,
          eq.setor?.nome || 'N/A',
          eq.status,
          eq.criticidade
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [239, 68, 68] }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Nova página se necessário
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Ordens de Serviço Pendentes
    if (data.ordensPendentes?.length > 0) {
      doc.setFontSize(12);
      doc.text('Ordens de Serviço Pendentes', 14, yPos);
      yPos += 8;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Número', 'Título', 'Prioridade', 'Equipamento']],
        body: data.ordensPendentes.map((os: any) => [
          os.numero,
          os.titulo,
          os.prioridade,
          os.equipamento?.nome || 'N/A'
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [245, 158, 11] }
      });
    }
    
    doc.save(`relatorio_consolidado_${new Date().getTime()}.pdf`);
  }

  ,
  // Gerar relatório de Estoque/Suprimentos em PDF
  async generateEstoquePDF(items: any[], options: ReportOptions) {
    const doc = new jsPDF({ compress: true });
    doc.setFontSize(16);
    doc.text(options.title || 'Relatório de Estoque', 14, 20);
    if (options.subtitle) { doc.setFontSize(11); doc.text(options.subtitle, 14, 28); }
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 36);

    const head = [['Nome', 'Código', 'Qtd', 'Mínimo', 'Alerta', 'Valor Unit.', 'Valor Total']];
    const body = (items || []).map(it => {
      const nome = it.nome || it.produto || '';
      const codigo = it.codigo_produto || it.codigo || '';
      const qtd = (it.quantidade ?? it.saldo_estoque ?? it.saldo ?? 0) || 0;
      const minimo = (it.estoque_minimo != null) ? String(it.estoque_minimo) : '-';
      const alert = (it.alerta || it.isAlert || (it.estoque_minimo != null && Number(it.estoque_minimo) > 0 && Number(qtd) < Number(it.estoque_minimo))) ? 'SIM' : '-';
      const vu = (it.valor_unitario != null) ? `R$ ${Number(it.valor_unitario).toFixed(2)}` : '-';
      const vt = (it.valor_unitario != null && qtd != null) ? `R$ ${(Number(it.valor_unitario) * Number(qtd)).toFixed(2)}` : '-';
      return [nome, codigo, Number(qtd).toLocaleString('pt-BR'), minimo, alert, vu, vt];
    });

    const totalItems = (items || []).length;
    const totalQty = (items || []).reduce((s, it) => s + (Number(it.quantidade ?? it.saldo_estoque ?? it.saldo ?? 0) || 0), 0);
    const totalValue = (items || []).reduce((s, it) => s + ((Number(it.valor_unitario || 0) * Number(it.quantidade ?? it.saldo_estoque ?? it.saldo ?? 0)) || 0), 0);
    doc.text(`Total de itens: ${totalItems} — Quantidade total: ${totalQty.toLocaleString('pt-BR')} — Valor total: R$ ${totalValue.toFixed(2)}`, 14, 44);

    autoTable(doc, {
      startY: 52,
      head: head,
      body: body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      theme: 'grid'
    });

    doc.save(`${(options.title || 'estoque').replace(/\s+/g,'_').toLowerCase()}_${new Date().getTime()}.pdf`);
  }
  ,
  // Monta texto resumido para compartilhar via WhatsApp
  buildEstoqueText(items: any[], options: ReportOptions) {
    const lines: string[] = [];
    lines.push(`${options.title || 'Relatório de Estoque'} - ${new Date().toLocaleString('pt-BR')}`);
    lines.push('');
    let totalQty = 0;
    let totalValue = 0;
    for (const it of (items || [])) {
      const nome = it.nome || it.produto || '';
      const codigo = it.codigo_produto || it.codigo || '';
      const qtd = Number(it.quantidade ?? it.saldo_estoque ?? it.saldo ?? 0) || 0;
      const minimo = (it.estoque_minimo != null) ? Number(it.estoque_minimo) : null;
      const alert = (minimo != null && minimo > 0 && qtd < minimo) ? '⚠️ ABAIXO DO MÍNIMO' : '';
      const vu = Number(it.valor_unitario || 0);
      const vt = vu * qtd;
      totalQty += qtd;
      totalValue += vt;
      lines.push(`${nome} (${codigo})`);
      lines.push(`  Qtd: ${qtd.toLocaleString('pt-BR')} — Mínimo: ${minimo != null ? minimo.toLocaleString('pt-BR') : '-'} ${alert}`);
      if (vu > 0) lines.push(`  Valor unit.: R$ ${vu.toFixed(2)} — Valor total: R$ ${vt.toFixed(2)}`);
      lines.push('');
    }
    lines.push(`Totais: itens=${(items || []).length} — qtd=${totalQty.toLocaleString('pt-BR')} — valor R$ ${totalValue.toFixed(2)}`);
    return lines.join('\n');
  }
};
