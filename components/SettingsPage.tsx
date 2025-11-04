import React, { useState } from 'react';
import { User, Organization } from '../types';
import { UserIcon, OfficeBuildingIcon, ColorSwatchIcon, ShieldExclamationIcon } from './icons';
import GeneralSettings from './settings/GeneralSettings';
import OrganizationSettingsPanel from './settings/OrganizationSettings';
import AppearanceSettings from './settings/AppearanceSettings';
import SecuritySettings from './settings/SecuritySettings';


interface SettingsPageProps {
    user: User;
    organization: Organization;
    onUpdateUser: (user: User) => void;
    onUpdateOrganization: (settings: Organization) => void;
    onNavigateToDashboard: () => void;
    onUpdateUserPassword: (userId: string, current: string, newPass: string) => Promise<void>;
}

type SettingsTab = 'general' | 'organization' | 'appearance' | 'security';

const SettingsPage: React.FC<SettingsPageProps> = (props) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    
    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return <GeneralSettings user={props.user} onUpdateUser={props.onUpdateUser} />;
            case 'organization':
                return <OrganizationSettingsPanel settings={props.organization} onUpdateSettings={props.onUpdateOrganization} />;
            case 'appearance':
                 return <AppearanceSettings settings={props.organization} onUpdateSettings={props.onUpdateOrganization} />;
            case 'security':
                return <SecuritySettings user={props.user} onUpdateUserPassword={props.onUpdateUserPassword} />;
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Account Settings</h2>
                <button
                    onClick={props.onNavigateToDashboard}
                    className="bg-white text-brand-primary hover:bg-slate-100 font-semibold py-2 px-4 rounded-lg shadow-sm border border-gray-300"
                >
                    Volver al Dashboard
                </button>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="md:w-1/4">
                    <nav className="space-y-1">
                        <SettingsTabButton 
                            label="General" 
                            icon={<UserIcon className="h-5 w-5 mr-3"/>}
                            isActive={activeTab === 'general'}
                            onClick={() => setActiveTab('general')}
                        />
                         <SettingsTabButton 
                            label="Organization" 
                            icon={<OfficeBuildingIcon className="h-5 w-5 mr-3"/>}
                            isActive={activeTab === 'organization'}
                            onClick={() => setActiveTab('organization')}
                        />
                         <SettingsTabButton 
                            label="Appearance" 
                            icon={<ColorSwatchIcon className="h-5 w-5 mr-3"/>}
                            isActive={activeTab === 'appearance'}
                            onClick={() => setActiveTab('appearance')}
                        />
                        <SettingsTabButton 
                            label="Security" 
                            icon={<ShieldExclamationIcon className="h-5 w-5 mr-3"/>}
                            isActive={activeTab === 'security'}
                            onClick={() => setActiveTab('security')}
                        />
                    </nav>
                </aside>
                <main className="flex-1">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};


const SettingsTabButton: React.FC<{label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void}> = ({ label, icon, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive ? 'bg-brand-primary text-white' : 'text-gray-900 hover:bg-gray-200'
            }`}
        >
            {icon}
            <span className="truncate">{label}</span>
        </button>
    )
}

export default SettingsPage;