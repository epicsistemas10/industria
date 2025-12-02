// Sistema de notificações push no navegador
import { supabase } from './supabase';

interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  // Verificar se o navegador suporta notificações
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Solicitar permissão para notificações
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Notificações push não são suportadas neste navegador');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Verificar status da permissão
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  // Registrar service worker
  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!this.isSupported()) {
      throw new Error('Service Workers não são suportados neste navegador');
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado com sucesso');
      return this.registration;
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
      throw error;
    }
  }

  // Inscrever para notificações push
  async subscribe(userId: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    if (!this.registration) {
      throw new Error('Service Worker não registrado');
    }

    try {
      // Verificar se já existe uma inscrição
      let subscription = await this.registration.pushManager.getSubscription();

      if (!subscription) {
        // Criar nova inscrição
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      // Salvar inscrição no banco de dados
      await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        subscription: JSON.stringify(subscription),
        endpoint: subscription.endpoint,
        created_at: new Date().toISOString(),
      });

      return subscription;
    } catch (error) {
      console.error('Erro ao inscrever para notificações push:', error);
      throw error;
    }
  }

  // Cancelar inscrição
  async unsubscribe(userId: string): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remover do banco de dados
      await supabase.from('push_subscriptions').delete().eq('user_id', userId);
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);
      throw error;
    }
  }

  // Enviar notificação local (sem servidor)
  async showLocalNotification(options: PushNotificationOptions): Promise<void> {
    if (this.getPermissionStatus() !== 'granted') {
      throw new Error('Permissão para notificações não concedida');
    }

    if (!this.registration) {
      await this.registerServiceWorker();
    }

    if (!this.registration) {
      throw new Error('Service Worker não registrado');
    }

    await this.registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || '/logo.png',
      badge: options.badge || '/badge.png',
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction || false,
      vibrate: [200, 100, 200],
    });
  }

  // Converter chave VAPID
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Inicializar sistema de notificações
  async initialize(userId: string): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Notificações push não são suportadas neste navegador');
      return;
    }

    const permission = this.getPermissionStatus();
    if (permission === 'granted') {
      await this.subscribe(userId);
    }
  }

  // Notificações específicas do sistema
  async notifyNewOrdemServico(os: any): Promise<void> {
    await this.showLocalNotification({
      title: '🔧 Nova Ordem de Serviço',
      body: `OS #${os.numero_os}: ${os.titulo}`,
      tag: `os-${os.id}`,
      data: { type: 'ordem_servico', id: os.id },
      requireInteraction: true,
    });
  }

  async notifyEquipamentoCritico(equipamento: any): Promise<void> {
    await this.showLocalNotification({
      title: '⚠️ Equipamento Crítico',
      body: `${equipamento.nome} requer atenção imediata!`,
      tag: `equip-${equipamento.id}`,
      data: { type: 'equipamento', id: equipamento.id },
      requireInteraction: true,
    });
  }

  async notifyRevisaoProxima(equipamento: any, dias: number): Promise<void> {
    await this.showLocalNotification({
      title: '📅 Revisão Programada',
      body: `${equipamento.nome} - Revisão em ${dias} dias`,
      tag: `revisao-${equipamento.id}`,
      data: { type: 'revisao', id: equipamento.id },
    });
  }

  async notifyMelhoriaAprovada(melhoria: any): Promise<void> {
    await this.showLocalNotification({
      title: '✅ Melhoria Aprovada',
      body: `${melhoria.titulo} foi aprovada!`,
      tag: `melhoria-${melhoria.id}`,
      data: { type: 'melhoria', id: melhoria.id },
    });
  }
}

export const pushNotificationService = new PushNotificationService();
