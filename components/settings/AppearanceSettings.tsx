import React, { useState, useEffect } from 'react';
import { Organization } from '../../types';
import { CameraIcon } from '../icons';

interface AppearanceSettingsProps {
    settings: Organization;
    onUpdateSettings: (settings: Organization) => void;
}

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ settings, onUpdateSettings }) => {
    const [logoUrl, setLogoUrl] = useState<string | null>('');
    const [primaryColor, setPrimaryColor] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        setLogoUrl(settings.logoUrl || null);
        setPrimaryColor(settings.primaryColor || '#005A9C');
    }, [settings]);
    
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert("File is too large. Max size is 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings({
            ...settings,
            logoUrl: logoUrl,
            primaryColor: primaryColor,
        });
        
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-3">Appearance Settings</h3>
            
            <form onSubmit={handleSave} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Logo</label>
                    <p className="text-xs text-gray-500 mb-2">Add a logo/image that voters will see when voting.</p>
                    <div className="mt-1 flex items-center space-x-4">
                        <div className="flex-shrink-0 h-24 w-24 rounded-md bg-gray-100 border border-gray-300 flex items-center justify-center">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo Preview" className="h-full w-full object-contain" />
                            ) : (
                                <CameraIcon className="h-10 w-10 text-gray-400" />
                            )}
                        </div>
                        <label htmlFor="logo-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary">
                            <span>Seleccionar archivo</span>
                            <input id="logo-upload" name="logo-upload" type="file" className="sr-only" accept="image/jpeg, image/png, image/gif" onChange={handleLogoChange}/>
                        </label>
                    </div>
                     <p className="mt-1 text-xs text-gray-500">Max file size: 2MB. Allowed types: .jpg, .gif, .png</p>
                </div>
                 <div>
                    <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">Color</label>
                    <div className="relative mt-1">
                        <input 
                            type="text" 
                            id="primaryColor" 
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="pl-12 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                        />
                         <div className="absolute inset-y-0 left-0 flex items-center pl-2">
                             <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-8 w-8 rounded-md border border-gray-300" />
                         </div>
                    </div>
                </div>
                                
                <div className="flex items-center space-x-4">
                     <button type="submit" className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700">
                        Save Settings
                    </button>
                    {isSaved && <p className="text-sm text-green-600">Settings saved successfully!</p>}
                </div>
            </form>
        </div>
    );
};

export default AppearanceSettings;