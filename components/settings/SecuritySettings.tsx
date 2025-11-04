import React, { useState } from 'react';
import { ShieldExclamationIcon } from '../icons';
import * as apiService from '../../api/apiService';
import { User } from '../../types';

interface SecuritySettingsProps {
    user: User;
    onUpdateUserPassword: (userId: string, current: string, newPass: string) => Promise<void>;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ user, onUpdateUserPassword }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const handleSubmitPasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError('Todos los campos son obligatorios.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Las nuevas contraseñas no coinciden.');
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError('La nueva contraseña debe tener al menos 8 caracteres.');
            return;
        }

        setIsChangingPassword(true);
        try {
            await onUpdateUserPassword(user.id, currentPassword, newPassword);
            setPasswordSuccess('¡Contraseña actualizada con éxito!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            setPasswordError(error instanceof Error ? error.message : 'Ocurrió un error inesperado.');
        } finally {
            setIsChangingPassword(false);
        }
    };
    
    const handleResetData = async () => {
        if (window.confirm(
            '¿Está seguro de que desea restablecer todos los datos de la aplicación?\\n\\n' +
            'Esto eliminará todas las elecciones, votantes, candidatos y votos, y restaurará la aplicación a su estado original. Esta acción no se puede deshacer.'
        )) {
            try {
                await apiService.resetAllData();
                // Reload the page to apply the changes
                alert("Los datos de la aplicación se han restablecido con éxito.");
                window.location.reload();
            } catch (error) {
                console.error("Failed to reset data:", error);
                alert(`Ocurrió un error al restablecer los datos: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    };


    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-8">
            <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-3">Security Settings</h3>
                
                {/* Change Password Form */}
                <form onSubmit={handleSubmitPasswordChange} className="space-y-4 pt-4">
                    <h4 className="text-md font-semibold text-gray-700">Cambiar Contraseña</h4>
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Contraseña Actual</label>
                        <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1 block w-full form-input rounded-md border-gray-300" required />
                    </div>
                     <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
                        <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 block w-full form-input rounded-md border-gray-300" required />
                    </div>
                     <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmar Nueva Contraseña</label>
                        <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full form-input rounded-md border-gray-300" required />
                    </div>

                    {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                    {passwordSuccess && <p className="text-sm text-green-600">{passwordSuccess}</p>}

                    <div>
                        <button type="submit" disabled={isChangingPassword} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-primary-darker disabled:bg-gray-400">
                            {isChangingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
                        </button>
                    </div>
                </form>

                {/* Two-Factor Authentication Placeholder */}
                 <div className="border-t pt-6 mt-6">
                     <h4 className="text-md font-semibold text-gray-700">Autenticación de Dos Factores (2FA)</h4>
                     <div className="mt-2 p-4 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-between">
                         <div>
                             <p className="font-medium text-gray-800">Estado de 2FA</p>
                             <p className="text-sm text-gray-600">Añada una capa adicional de seguridad a su cuenta.</p>
                         </div>
                         <div className="flex items-center">
                            <span className="mr-3 text-sm font-medium text-gray-500">Desactivado</span>
                            <label className="relative inline-flex items-center cursor-not-allowed">
                                <input type="checkbox" value="" className="sr-only peer" disabled/>
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-primary opacity-50"></div>
                            </label>
                        </div>
                     </div>
                     <p className="text-xs text-gray-500 mt-2">Esta función estará disponible en una futura actualización.</p>
                </div>
            </div>

            <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-red-700">Zona de Peligro</h4>
                <div className="mt-4 p-4 border border-red-300 rounded-lg bg-red-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="font-bold text-red-800">Restablecer Datos de la Aplicación</p>
                        <p className="text-sm text-red-700">Elimine permanentemente todos los datos y restaure la aplicación a su estado predeterminado.</p>
                    </div>
                    <button 
                        onClick={handleResetData}
                        className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-800 transition-colors flex items-center flex-shrink-0"
                    >
                        <ShieldExclamationIcon className="h-5 w-5 mr-2" />
                        Restablecer Datos
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;