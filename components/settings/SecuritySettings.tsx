import React, { useState } from 'react';
import { User } from '../../types';
import { ShieldCheckIcon, KeyIcon, LockClosedIcon } from '../icons';
import * as apiService from '../../api/apiService';

interface SecuritySettingsProps {
    user?: User;
    onUpdateUser?: (user: User) => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ user, onUpdateUser }) => {
    // Password update state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Email recovery state
    const [sendingRecovery, setSendingRecovery] = useState(false);
    const [recoveryFeedback, setRecoveryFeedback] = useState<{ type: 'success' | 'error'; message: string; setupLink?: string } | null>(null);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordFeedback(null);

        if (!newPassword || newPassword.length < 8) {
            setPasswordFeedback({
                type: 'error',
                message: 'La nueva contraseña debe tener al menos 8 caracteres seguros.',
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordFeedback({
                type: 'error',
                message: 'Las contraseñas ingresadas no coinciden. Verifique e intente nuevamente.',
            });
            return;
        }

        if (!user?.id) {
            setPasswordFeedback({
                type: 'error',
                message: 'No se pudo identificar la cuenta del usuario actual.',
            });
            return;
        }

        try {
            setUpdatingPassword(true);
            const res = await apiService.updateAdminPassword(user.id, newPassword);
            if (res.success) {
                setPasswordFeedback({
                    type: 'success',
                    message: 'Contraseña actualizada con éxito. Puede utilizar su nueva clave para iniciar sesión.',
                });
                setNewPassword('');
                setConfirmPassword('');
                if (onUpdateUser && user) {
                    onUpdateUser({ ...user, password: newPassword });
                }
            } else {
                setPasswordFeedback({
                    type: 'error',
                    message: res.message || 'Error al actualizar la contraseña.',
                });
            }
        } catch (err: any) {
            setPasswordFeedback({
                type: 'error',
                message: err?.message || 'Error inesperado al cambiar contraseña.',
            });
        } finally {
            setUpdatingPassword(false);
        }
    };

    const handleSendRecoveryEmail = async () => {
        const emailToSend = user?.email;
        if (!emailToSend) {
            setRecoveryFeedback({
                type: 'error',
                message: 'Esta cuenta no tiene un correo electrónico configurado.',
            });
            return;
        }

        try {
            setSendingRecovery(true);
            setRecoveryFeedback(null);
            const res = await apiService.recoverPassword(emailToSend);
            if (res.success) {
                setRecoveryFeedback({
                    type: 'success',
                    message: res.message,
                    setupLink: res.setupLink,
                });
            } else {
                setRecoveryFeedback({
                    type: 'error',
                    message: res.message || 'No se pudo enviar el correo de recuperación.',
                });
            }
        } catch (err: any) {
            setRecoveryFeedback({
                type: 'error',
                message: err?.message || 'Error al enviar correo de recuperación.',
            });
        } finally {
            setSendingRecovery(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Card 1: Change / Update Password */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                        <KeyIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Actualizar Contraseña de Acceso</h3>
                        <p className="text-xs text-slate-500">
                            Cambie la contraseña de su cuenta de administrador institucional ({user?.email || 'Admin'})
                        </p>
                    </div>
                </div>

                {passwordFeedback && (
                    <div
                        className={`mb-4 p-3.5 rounded-xl text-xs font-semibold border ${
                            passwordFeedback.type === 'success'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                    >
                        {passwordFeedback.message}
                    </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Nueva Contraseña
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LockClosedIcon className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 8 caracteres"
                                className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600 font-bold"
                            >
                                {showPassword ? 'Ocultar' : 'Ver'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Confirmar Nueva Contraseña
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LockClosedIcon className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repita la nueva contraseña"
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={updatingPassword}
                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold shadow-md transition-all hover:scale-101 disabled:bg-slate-400"
                        >
                            {updatingPassword ? 'Guardando nueva clave...' : 'Guardar Nueva Contraseña'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Card 2: Recover / Reset Password Email Link */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                        <LockClosedIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Recuperación y Restablecimiento por Correo</h3>
                        <p className="text-xs text-slate-500">
                            Envíe un enlace seguro de recuperación a su correo electrónico autorizado
                        </p>
                    </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed max-w-xl mb-4">
                    Si necesita restablecer su contraseña externamente o desde otro dispositivo, podemos enviar un enlace verificado al correo <strong className="text-slate-900">{user?.email || 'registrado'}</strong>.
                </p>

                {recoveryFeedback && (
                    <div
                        className={`mb-4 p-3.5 rounded-xl text-xs font-semibold border ${
                            recoveryFeedback.type === 'success'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                    >
                        <p>{recoveryFeedback.message}</p>
                        {recoveryFeedback.setupLink && (
                          <div className="mt-2 pt-2 border-t border-emerald-200/60">
                            <a
                              href={recoveryFeedback.setupLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs"
                            >
                              Abrir enlace de restablecimiento →
                            </a>
                          </div>
                        )}
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleSendRecoveryEmail}
                    disabled={sendingRecovery || !user?.email}
                    className="px-4 py-2 border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                    {sendingRecovery ? 'Enviando enlace...' : `Enviar Enlace de Recuperación a ${user?.email || 'mi correo'}`}
                </button>
            </div>

            {/* Card 3: Cryptography & Security Architecture */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Protección e Inmutabilidad de Datos Electorales</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                    Las elecciones, padrones electorales y actas de sufragio están protegidas en Firebase Firestore. Los votos son estrictamente de solo creación (inmutables) y no pueden ser modificados ni eliminados por los clientes.
                </p>

                <div className="mt-4 p-4 border border-emerald-300 rounded-xl bg-emerald-50 flex items-start gap-3">
                    <ShieldCheckIcon className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-emerald-950 text-sm">Integridad del Voto Secreto Garantizada</p>
                        <p className="text-xs text-emerald-800 mt-0.5">
                            La base de datos disocia permanentemente la identidad del estudiante de su selección de candidatos en la urna electrónica, emitiendo únicamente recibos SHA-256 criptográficos verificables.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;

