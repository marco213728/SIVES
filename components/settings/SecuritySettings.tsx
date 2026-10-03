import React, { useState } from 'react';
import { ShieldExclamationIcon } from '../icons';
import * as apiService from '../../api/apiService';

const SecuritySettings: React.FC = () => {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handleConfirmReset = async () => {
        setIsResetting(true);
        await apiService.resetAllData();
        window.location.reload();
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-3">Configuración de Seguridad</h3>
            <div className="space-y-6">
                <div className="text-gray-700">
                    <p>Los ajustes de seguridad, como la autenticación de dos factores y las políticas de contraseñas para administradores, protegen la integridad de las elecciones escolares.</p>
                </div>

                <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold text-red-700">Zona de Peligro</h4>
                    <div className="mt-4 p-4 border border-red-300 rounded-lg bg-red-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="font-bold text-red-800">Restablecer Datos de la Aplicación</p>
                            <p className="text-sm text-red-700">Elimine permanentemente todos los datos y restaure la aplicación a su estado predeterminado.</p>
                        </div>
                        <button 
                            onClick={() => setShowConfirmModal(true)}
                            className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-800 transition-colors flex items-center flex-shrink-0"
                        >
                            <ShieldExclamationIcon className="h-5 w-5 mr-2" />
                            Restablecer Datos
                        </button>
                    </div>
                </div>
            </div>

            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-red-200">
                        <div className="flex items-center space-x-3 text-red-600 mb-4">
                            <ShieldExclamationIcon className="h-8 w-8 flex-shrink-0" />
                            <h3 className="text-xl font-bold text-slate-900">¿Restablecer todos los datos?</h3>
                        </div>
                        <p className="text-slate-600 text-sm mb-6">
                            Esta acción eliminará todas las elecciones creadas, candidatos postulados, padrón electoral y votos registrados, restaurando el sistema a los datos iniciales de fábrica. Esta acción no se puede deshacer.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                disabled={isResetting}
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={isResetting}
                                onClick={handleConfirmReset}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm shadow transition-colors"
                            >
                                {isResetting ? 'Restableciendo...' : 'Sí, Restablecer Todo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecuritySettings;
