import React from 'react';
import { ShieldCheckIcon } from '../icons';

const SecuritySettings: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-3">Configuración de Seguridad y Criptografía</h3>
            <div className="space-y-6">
                <div className="text-gray-700">
                    <p>Los ajustes de seguridad, la autenticación multifactor y el cifrado de votos protegen la integridad de las elecciones escolares.</p>
                </div>

                <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold text-slate-800">Protección e Inmutabilidad de Datos Electorales</h4>
                    <p className="text-sm text-slate-600 mt-1">
                        Las elecciones, padrones electorales y actas de sufragio están protegidas en Firebase Firestore. Los votos son estrictamente de solo creación (inmutables) y no pueden ser modificados ni eliminados por los clientes.
                    </p>

                    <div className="mt-4 p-4 border border-emerald-300 rounded-lg bg-emerald-50 flex items-start gap-3">
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
        </div>
    );
};

export default SecuritySettings;
