import React, { useState, useEffect } from 'react';
import { Organization } from '../../types';

interface OrganizationSettingsPanelProps {
    settings: Organization;
    onUpdateSettings: (settings: Organization) => void;
}

const OrganizationSettingsPanel: React.FC<OrganizationSettingsPanelProps> = ({ settings, onUpdateSettings }) => {
    const [orgName, setOrgName] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        setOrgName(settings.name || '');
    }, [settings]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings({
            ...settings,
            name: orgName,
        });
        
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-3">Organization Settings</h3>
            
            <form onSubmit={handleSave} className="space-y-6">
                <div>
                    <label htmlFor="orgName" className="block text-sm font-medium text-gray-700">Organization Name</label>
                    <p className="text-xs text-gray-500 mb-1">The organization name will be displayed to voters when logging in and voting in your elections.</p>
                    <input 
                        type="text" 
                        id="orgName" 
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    />
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

export default OrganizationSettingsPanel;