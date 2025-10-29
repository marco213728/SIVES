import React from 'react';
import { ShieldExclamationIcon } from '../icons';
import * as apiService from '../../api/apiService';


const SecuritySettings: React.FC = () => {

    const handleResetData = async () => {
        if (window.confirm(
            '¿Está seguro de que desea restablecer todos los datos de la aplicación?\n\n' +
            'Esto eliminará todas las elecciones, votantes, candidatos y votos, y restaurará la aplicación a su estado original. Esta acción no se puede deshacer.'
        )) {
            await apiService.resetAllData();
            // Reload the page to apply the changes
            window.location.reload();
        }
    };


    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-brand-dark mb-4 border-b pb-3">Security Settings</h3>
            <div className="space-y-6">
                <div className="text-gray-700">
                    <p>Los ajustes de seguridad, como la autenticación de dos factores y las políticas de contraseñas, estarán disponibles aquí en una futura actualización.</p>
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
        </div>
    );
};

export default SecuritySettings;