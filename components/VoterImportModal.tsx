import React, { useState } from 'react';
import { UploadIcon } from './icons';
import { User } from '../types';

interface VoterImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (voters: Omit<User, 'id' | 'rol' | 'ha_votado'>[]) => void;
}

const VoterImportModal: React.FC<VoterImportModalProps> = ({ isOpen, onClose, onImport }) => {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleImport = () => {
        if (!file) {
            setError('Por favor, seleccione un archivo CSV.');
            return;
        }

        setProcessing(true);
        setError('');

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
                
                if(lines.length < 2) {
                    throw new Error("El archivo CSV está vacío o solo contiene la cabecera.");
                }

                const header = lines[0].split(',').map(h => h.trim().toLowerCase());
                const requiredHeaders = ['codigo', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'curso', 'paralelo'];
                const headerIndices: Record<string, number> = {};
                
                requiredHeaders.forEach(h => {
                    const index = header.indexOf(h);
                    if (index === -1) {
                        throw new Error(`La cabecera del archivo CSV debe contener la columna '${h}'.`);
                    }
                    headerIndices[h] = index;
                });


                const voters = lines.slice(1).map((line, index) => {
                    const data = line.split(',');
                    if (data.length < requiredHeaders.length) {
                        console.warn(`Saltando línea ${index + 2}: número de columnas incorrecto.`);
                        return null;
                    }
                    
                    const codigo = data[headerIndices['codigo']]?.trim();
                    const primer_nombre = data[headerIndices['primer_nombre']]?.trim();
                    const segundo_nombre = data[headerIndices['segundo_nombre']]?.trim();
                    const primer_apellido = data[headerIndices['primer_apellido']]?.trim();
                    const segundo_apellido = data[headerIndices['segundo_apellido']]?.trim();
                    const curso = data[headerIndices['curso']]?.trim();
                    const paralelo = data[headerIndices['paralelo']]?.trim();

                    if (!codigo || !primer_nombre || !primer_apellido || !curso || !paralelo) {
                        console.warn(`Saltando línea ${index + 2}: Faltan datos obligatorios.`);
                        return null;
                    }

                    return { codigo, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, curso, paralelo };
                }).filter((v): v is Omit<User, 'id' | 'rol' | 'ha_votado'> => v !== null);
                
                if (voters.length === 0) {
                    throw new Error("No se encontraron votantes válidos en el archivo.");
                }

                onImport(voters);
            } catch (err: any) {
                setError(err.message || "Error al procesar el archivo.");
            } finally {
                setProcessing(false);
            }
        };
        reader.onerror = () => {
             setError("Error al leer el archivo.");
             setProcessing(false);
        }
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 shadow-2xl max-w-lg w-full">
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">
                    Importar Votantes desde CSV
                </h2>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        El archivo debe ser formato CSV con la cabecera en la primera línea. Columnas requeridas:
                        <code className="block bg-gray-200 px-2 py-1 rounded mt-2 text-xs">codigo,primer_nombre,segundo_nombre,primer_apellido,segundo_apellido,curso,paralelo</code>
                    </p>
                    <div>
                        <label htmlFor="file-upload" className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                            <span className="flex items-center space-x-2">
                                <UploadIcon className="w-6 h-6 text-gray-600" />
                                <span className="font-medium text-gray-600">
                                    {file ? file.name : 'Suelte el archivo o haga clic para seleccionar'}
                                </span>
                            </span>
                            <input id="file-upload" name="file-upload" type="file" className="hidden" accept=".csv,text/csv" onChange={handleFileChange} />
                        </label>
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">
                            Cancelar
                        </button>
                        <button onClick={handleImport} disabled={!file || processing} className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-primary-darker disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {processing ? 'Procesando...' : 'Importar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoterImportModal;