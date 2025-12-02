// Sistema de autenticação 2FA (Two-Factor Authentication)
import { supabase } from './supabase';

interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

class TwoFactorAuthService {
  // Gerar secret para 2FA
  private generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  }

  // Gerar códigos de backup
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  // Gerar QR Code URL
  private generateQRCodeUrl(secret: string, email: string): string {
    const issuer = 'Sistema de Manutenção';
    const label = `${issuer}:${email}`;
    const otpauth = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(otpauth)}`;
  }

  // Configurar 2FA para usuário
  async setupTwoFactor(userId: string, email: string): Promise<TwoFactorSetup> {
    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes();
    const qrCode = this.generateQRCodeUrl(secret, email);

    // Salvar no banco (ainda não ativado)
    await supabase.from('two_factor_auth').upsert({
      user_id: userId,
      secret,
      backup_codes: backupCodes,
      enabled: false,
      created_at: new Date().toISOString(),
    });

    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  // Verificar código TOTP
  private verifyTOTP(secret: string, token: string): boolean {
    // Implementação simplificada - em produção, use uma biblioteca como 'otplib'
    const timeStep = 30; // segundos
    const currentTime = Math.floor(Date.now() / 1000);
    const counter = Math.floor(currentTime / timeStep);

    // Verificar token atual e ±1 janela de tempo (90 segundos total)
    for (let i = -1; i <= 1; i++) {
      const testCounter = counter + i;
      const expectedToken = this.generateTOTP(secret, testCounter);
      if (expectedToken === token) {
        return true;
      }
    }

    return false;
  }

  // Gerar código TOTP (simplificado)
  private generateTOTP(secret: string, counter: number): string {
    // Em produção, use uma biblioteca como 'otplib' ou 'speakeasy'
    // Esta é uma implementação simplificada para demonstração
    const hash = this.hmacSHA1(secret, counter.toString());
    const offset = hash.charCodeAt(hash.length - 1) & 0xf;
    const binary = ((hash.charCodeAt(offset) & 0x7f) << 24) |
                   ((hash.charCodeAt(offset + 1) & 0xff) << 16) |
                   ((hash.charCodeAt(offset + 2) & 0xff) << 8) |
                   (hash.charCodeAt(offset + 3) & 0xff);
    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  }

  // HMAC-SHA1 simplificado
  private hmacSHA1(key: string, message: string): string {
    // Em produção, use crypto.subtle ou uma biblioteca
    // Esta é uma implementação simplificada
    return btoa(key + message);
  }

  // Ativar 2FA após verificação
  async enableTwoFactor(userId: string, token: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('two_factor_auth')
      .select('secret')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new Error('Configuração 2FA não encontrada');
    }

    const isValid = this.verifyTOTP(data.secret, token);

    if (isValid) {
      await supabase
        .from('two_factor_auth')
        .update({ enabled: true })
        .eq('user_id', userId);
      return true;
    }

    return false;
  }

  // Desativar 2FA
  async disableTwoFactor(userId: string, token: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('two_factor_auth')
      .select('secret, enabled')
      .eq('user_id', userId)
      .single();

    if (error || !data || !data.enabled) {
      throw new Error('2FA não está ativado');
    }

    const isValid = this.verifyTOTP(data.secret, token);

    if (isValid) {
      await supabase
        .from('two_factor_auth')
        .delete()
        .eq('user_id', userId);
      return true;
    }

    return false;
  }

  // Verificar código durante login
  async verifyLoginCode(userId: string, token: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('two_factor_auth')
      .select('secret, backup_codes, enabled')
      .eq('user_id', userId)
      .single();

    if (error || !data || !data.enabled) {
      return false;
    }

    // Verificar código TOTP
    if (this.verifyTOTP(data.secret, token)) {
      return true;
    }

    // Verificar código de backup
    if (data.backup_codes && data.backup_codes.includes(token)) {
      // Remover código de backup usado
      const newBackupCodes = data.backup_codes.filter((code: string) => code !== token);
      await supabase
        .from('two_factor_auth')
        .update({ backup_codes: newBackupCodes })
        .eq('user_id', userId);
      return true;
    }

    return false;
  }

  // Verificar se 2FA está ativado
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('two_factor_auth')
      .select('enabled')
      .eq('user_id', userId)
      .single();

    return !error && data?.enabled === true;
  }

  // Regenerar códigos de backup
  async regenerateBackupCodes(userId: string, token: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('two_factor_auth')
      .select('secret, enabled')
      .eq('user_id', userId)
      .single();

    if (error || !data || !data.enabled) {
      throw new Error('2FA não está ativado');
    }

    const isValid = this.verifyTOTP(data.secret, token);

    if (!isValid) {
      throw new Error('Código inválido');
    }

    const newBackupCodes = this.generateBackupCodes();

    await supabase
      .from('two_factor_auth')
      .update({ backup_codes: newBackupCodes })
      .eq('user_id', userId);

    return newBackupCodes;
  }
}

export const twoFactorAuthService = new TwoFactorAuthService();
