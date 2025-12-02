// Sistema de notificações por email usando Supabase Edge Functions
import { supabase } from './supabase';

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  type: 'ordem_servico' | 'equipamento' | 'melhoria' | 'alerta' | 'geral';
  priority?: 'baixa' | 'media' | 'alta' | 'urgente';
  data?: Record<string, any>;
}

export const emailService = {
  // Enviar notificação de nova ordem de serviço
  async notifyNewOrdemServico(os: any, responsavel: any) {
    const notification: EmailNotification = {
      to: responsavel.email,
      subject: `Nova Ordem de Serviço #${os.numero}`,
      body: `
        <h2>Nova Ordem de Serviço Atribuída</h2>
        <p><strong>Número:</strong> ${os.numero}</p>
        <p><strong>Título:</strong> ${os.titulo}</p>
        <p><strong>Prioridade:</strong> ${os.prioridade}</p>
        <p><strong>Equipamento:</strong> ${os.equipamento?.nome || 'N/A'}</p>
        <p><strong>Descrição:</strong> ${os.descricao}</p>
        <p><strong>Data de Abertura:</strong> ${new Date(os.data_abertura).toLocaleDateString('pt-BR')}</p>
        <br>
        <p>Acesse o sistema para mais detalhes.</p>
      `,
      type: 'ordem_servico',
      priority: os.prioridade,
      data: { os_id: os.id }
    };

    return this.sendEmail(notification);
  },

  // Notificar sobre equipamento crítico
  async notifyEquipamentoCritico(equipamento: any, usuarios: any[]) {
    const promises = usuarios.map(usuario => {
      const notification: EmailNotification = {
        to: usuario.email,
        subject: `⚠️ Alerta: Equipamento Crítico - ${equipamento.nome}`,
        body: `
          <h2 style="color: #ef4444;">⚠️ Alerta de Equipamento Crítico</h2>
          <p><strong>Equipamento:</strong> ${equipamento.nome}</p>
          <p><strong>Setor:</strong> ${equipamento.setor?.nome || 'N/A'}</p>
          <p><strong>Status:</strong> ${equipamento.status}</p>
          <p><strong>Criticidade:</strong> ${equipamento.criticidade}</p>
          <br>
          <p style="color: #ef4444;">Ação imediata necessária!</p>
        `,
        type: 'alerta',
        priority: 'urgente',
        data: { equipamento_id: equipamento.id }
      };
      return this.sendEmail(notification);
    });

    return Promise.all(promises);
  },

  // Notificar sobre melhoria aprovada
  async notifyMelhoriaAprovada(melhoria: any, solicitante: any) {
    const notification: EmailNotification = {
      to: solicitante.email,
      subject: `✅ Melhoria Aprovada: ${melhoria.titulo}`,
      body: `
        <h2 style="color: #10b981;">✅ Sua Melhoria foi Aprovada!</h2>
        <p><strong>Título:</strong> ${melhoria.titulo}</p>
        <p><strong>Tipo:</strong> ${melhoria.tipo}</p>
        <p><strong>Economia Estimada:</strong> R$ ${melhoria.economia_estimada?.toFixed(2) || '0.00'}</p>
        <p><strong>Descrição:</strong> ${melhoria.descricao}</p>
        <br>
        <p>A implementação será iniciada em breve.</p>
      `,
      type: 'melhoria',
      priority: 'media',
      data: { melhoria_id: melhoria.id }
    };

    return this.sendEmail(notification);
  },

  // Notificar sobre revisão próxima
  async notifyRevisaoProxima(equipamento: any, responsaveis: any[]) {
    const promises = responsaveis.map(responsavel => {
      const notification: EmailNotification = {
        to: responsavel.email,
        subject: `📅 Revisão Programada: ${equipamento.nome}`,
        body: `
          <h2>📅 Revisão Programada</h2>
          <p><strong>Equipamento:</strong> ${equipamento.nome}</p>
          <p><strong>Próxima Revisão:</strong> ${new Date(equipamento.proxima_revisao).toLocaleDateString('pt-BR')}</p>
          <p><strong>Setor:</strong> ${equipamento.setor?.nome || 'N/A'}</p>
          <br>
          <p>Prepare-se para a manutenção preventiva.</p>
        `,
        type: 'equipamento',
        priority: 'media',
        data: { equipamento_id: equipamento.id }
      };
      return this.sendEmail(notification);
    });

    return Promise.all(promises);
  },

  // Função genérica para enviar email
  async sendEmail(notification: EmailNotification) {
    try {
      // Aqui você pode integrar com serviços como:
      // - SendGrid
      // - Mailgun
      // - AWS SES
      // - Resend
      // Por enquanto, vamos salvar no banco para processamento posterior
      
      const { data, error } = await supabase
        .from('email_queue')
        .insert({
          to_email: notification.to,
          subject: notification.subject,
          body: notification.body,
          type: notification.type,
          priority: notification.priority || 'media',
          metadata: notification.data,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log('Email adicionado à fila:', notification.subject);
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return { success: false, error };
    }
  },

  // Buscar emails pendentes
  async getPendingEmails() {
    const { data, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Marcar email como enviado
  async markAsSent(emailId: string) {
    const { error } = await supabase
      .from('email_queue')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', emailId);

    if (error) throw error;
  }
};
