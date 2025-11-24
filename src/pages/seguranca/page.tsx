import { useState } from 'react';
import { twoFactorAuthService } from '../../lib/two-factor-auth';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

export default function ConfiguracaoSeguranca() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  // Verificar se 2FA está ativado
  const checkTwoFactorStatus = async () => {
    if (!user) return;
    try {
      const enabled = await twoFactorAuthService.isTwoFactorEnabled(user.id);
      setTwoFactorEnabled(enabled);
    } catch (err) {
      console.error('Erro ao verificar status 2FA:', err);
    }
  };

  // Iniciar configuração 2FA
  const handleSetupTwoFactor = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const setup = await twoFactorAuthService.setupTwoFactor(user.id, user.email || '');
      setQrCode(setup.qrCode);
      setSecret(setup.secret);
      setBackupCodes(setup.backupCodes);
      setShowSetup(true);
      success('Configuração 2FA iniciada!');
    } catch (err) {
      showError('Erro ao configurar 2FA');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Ativar 2FA
  const handleEnableTwoFactor = async () => {
    if (!user || !verificationCode) return;
    setLoading(true);
    try {
      const enabled = await twoFactorAuthService.enableTwoFactor(user.id, verificationCode);
      if (enabled) {
        setTwoFactorEnabled(true);
        setShowSetup(false);
        setShowBackupCodes(true);
        success('Autenticação 2FA ativada com sucesso!');
      } else {
        showError('Código de verificação inválido');
      }
    } catch (err) {
      showError('Erro ao ativar 2FA');
      console.error(err);
    } finally {
      setLoading(false);
      setVerificationCode('');
    }
  };

  // Desativar 2FA
  const handleDisableTwoFactor = async () => {
    if (!user || !verificationCode) return;
    setLoading(true);
    try {
      const disabled = await twoFactorAuthService.disableTwoFactor(user.id, verificationCode);
      if (disabled) {
        setTwoFactorEnabled(false);
        success('Autenticação 2FA desativada');
      } else {
        showError('Código de verificação inválido');
      }
    } catch (err) {
      showError('Erro ao desativar 2FA');
      console.error(err);
    } finally {
      setLoading(false);
      setVerificationCode('');
    }
  };

  // Regenerar códigos de backup
  const handleRegenerateBackupCodes = async () => {
    if (!user || !verificationCode) return;
    setLoading(true);
    try {
      const newCodes = await twoFactorAuthService.regenerateBackupCodes(user.id, verificationCode);
      setBackupCodes(newCodes);
      setShowBackupCodes(true);
      success('Códigos de backup regenerados!');
    } catch (err) {
      showError('Erro ao regenerar códigos');
      console.error(err);
    } finally {
      setLoading(false);
      setVerificationCode('');
    }
  };

  // Copiar códigos de backup
  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    success('Códigos copiados para a área de transferência!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <i className="ri-shield-check-line mr-3"></i>
            Configurações de Segurança
          </h1>
          <p className="text-slate-400">
            Proteja sua conta com autenticação de dois fatores
          </p>
        </div>

        {/* Status 2FA */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                twoFactorEnabled 
                  ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                  : 'bg-gradient-to-br from-slate-600 to-slate-700'
              }`}>
                <i className={`${
                  twoFactorEnabled ? 'ri-shield-check-fill' : 'ri-shield-line'
                } text-3xl text-white`}></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Autenticação de Dois Fatores (2FA)
                </h3>
                <p className="text-slate-400">
                  {twoFactorEnabled 
                    ? '✅ Ativada - Sua conta está protegida' 
                    : '⚠️ Desativada - Recomendamos ativar para maior segurança'}
                </p>
              </div>
            </div>
            <button
              onClick={twoFactorEnabled ? () => setShowSetup(true) : handleSetupTwoFactor}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                twoFactorEnabled
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg'
              }`}
            >
              {loading ? (
                <i className="ri-loader-4-line animate-spin"></i>
              ) : twoFactorEnabled ? (
                <>
                  <i className="ri-close-circle-line mr-2"></i>
                  Desativar 2FA
                </>
              ) : (
                <>
                  <i className="ri-shield-check-line mr-2"></i>
                  Ativar 2FA
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal de Configuração */}
        {showSetup && !twoFactorEnabled && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 mb-6">
            <h3 className="text-2xl font-bold text-white mb-6">
              <i className="ri-qr-code-line mr-2"></i>
              Configurar Autenticação 2FA
            </h3>

            {/* Passo 1: Escanear QR Code */}
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Escaneie o QR Code
                  </h4>
                  <p className="text-slate-400 mb-4">
                    Use um aplicativo autenticador como Google Authenticator, Authy ou Microsoft Authenticator
                  </p>
                  {qrCode && (
                    <div className="bg-white p-4 rounded-lg inline-block">
                      <img src={qrCode} alt="QR Code 2FA" className="w-64 h-64" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Passo 2: Código Manual */}
            <div className="mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Ou insira o código manualmente
                  </h4>
                  <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                    <code className="text-green-400 text-lg font-mono">{secret}</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Passo 3: Verificar */}
            <div className="mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Digite o código de verificação
                  </h4>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-blue-500"
                    maxLength={6}
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSetup(false)}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnableTwoFactor}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? (
                  <i className="ri-loader-4-line animate-spin"></i>
                ) : (
                  <>
                    <i className="ri-check-line mr-2"></i>
                    Ativar 2FA
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Modal de Desativação */}
        {showSetup && twoFactorEnabled && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-red-500/50 mb-6">
            <h3 className="text-2xl font-bold text-white mb-4">
              <i className="ri-error-warning-line mr-2 text-red-400"></i>
              Desativar Autenticação 2FA
            </h3>
            <p className="text-slate-400 mb-6">
              ⚠️ Desativar a autenticação de dois fatores tornará sua conta menos segura. Digite o código do seu aplicativo autenticador para confirmar.
            </p>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-red-500 mb-6"
              maxLength={6}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSetup(false)}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                onClick={handleDisableTwoFactor}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? (
                  <i className="ri-loader-4-line animate-spin"></i>
                ) : (
                  <>
                    <i className="ri-close-circle-line mr-2"></i>
                    Confirmar Desativação
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Códigos de Backup */}
        {showBackupCodes && backupCodes.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/50 mb-6">
            <h3 className="text-2xl font-bold text-white mb-4">
              <i className="ri-key-2-line mr-2 text-yellow-400"></i>
              Códigos de Backup
            </h3>
            <p className="text-slate-400 mb-6">
              ⚠️ Guarde estes códigos em um local seguro. Cada código pode ser usado apenas uma vez caso você perca acesso ao seu aplicativo autenticador.
            </p>
            <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 mb-6">
              <div className="grid grid-cols-2 gap-3">
                {backupCodes.map((code, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono">{index + 1}.</span>
                    <code className="text-green-400 font-mono text-lg">{code}</code>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCopyBackupCodes}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all whitespace-nowrap"
              >
                <i className="ri-file-copy-line mr-2"></i>
                Copiar Códigos
              </button>
              <button
                onClick={() => setShowBackupCodes(false)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-semibold transition-all whitespace-nowrap"
              >
                <i className="ri-check-line mr-2"></i>
                Entendi, Guardei os Códigos
              </button>
            </div>
          </div>
        )}

        {/* Regenerar Códigos de Backup */}
        {twoFactorEnabled && !showBackupCodes && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-4">
              <i className="ri-refresh-line mr-2"></i>
              Regenerar Códigos de Backup
            </h3>
            <p className="text-slate-400 mb-6">
              Se você perdeu seus códigos de backup ou já usou todos, pode gerar novos códigos. Os códigos antigos serão invalidados.
            </p>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Digite o código do app autenticador"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-center text-lg font-mono tracking-widest focus:outline-none focus:border-blue-500 mb-4"
              maxLength={6}
            />
            <button
              onClick={handleRegenerateBackupCodes}
              disabled={loading || verificationCode.length !== 6}
              className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? (
                <i className="ri-loader-4-line animate-spin"></i>
              ) : (
                <>
                  <i className="ri-refresh-line mr-2"></i>
                  Regenerar Códigos
                </>
              )}
            </button>
          </div>
        )}

        {/* Informações de Segurança */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-400 mb-3">
            <i className="ri-information-line mr-2"></i>
            Dicas de Segurança
          </h3>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <i className="ri-checkbox-circle-fill text-blue-400 mt-1"></i>
              <span>Use um aplicativo autenticador confiável como Google Authenticator ou Authy</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="ri-checkbox-circle-fill text-blue-400 mt-1"></i>
              <span>Guarde seus códigos de backup em um local seguro e offline</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="ri-checkbox-circle-fill text-blue-400 mt-1"></i>
              <span>Nunca compartilhe seus códigos de verificação com ninguém</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="ri-checkbox-circle-fill text-blue-400 mt-1"></i>
              <span>Mantenha seu dispositivo móvel seguro com senha ou biometria</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
