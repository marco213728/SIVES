import React, { useState, useEffect } from 'react';
import { User } from '../../types';

interface GeneralSettingsProps {
    user: User;
    onUpdateUser: (user: User) => void;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ user, onUpdateUser }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'sending' | 'sent'>('idle');


    useEffect(() => {
        setName(`${user.primer_nombre} ${user.primer_apellido}`.trim());
        setEmail(user.email || '');
    }, [user]);

    const handleResendVerification = async () => {
        setVerificationStatus('sending');
        // Simulate API call to send email
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        
        // This is the simulation part: in a real app, the user would click a link in their email.
        // Here, we just mark them as verified to show the UI change and demonstrate the full flow.
        onUpdateUser({ ...user, email_verificado: true });

        setVerificationStatus('sent');

        // Reset the message after a few seconds so it doesn't persist
        setTimeout(() => setVerificationStatus('idle'), 5000);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const nameParts = name.split(' ');
        const primer_nombre = nameParts[0] || '';
        const primer_apellido = nameParts.slice(1).join(' ') || '';

        onUpdateUser({
            ...user,
            primer_nombre,
            primer_apellido,
            email,
        });
        
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-3">Profile Settings</h3>
            
            {!user.email_verificado && (
                <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-6" role="alert">
                    <p className="font-bold">Account Verification Required</p>
                    <p>Please check your email <span className="font-semibold">{user.email}</span> and click on the link to verify your email address.</p>
                    <button 
                        onClick={handleResendVerification}
                        disabled={verificationStatus === 'sending'}
                        className="mt-2 font-bold underline disabled:text-orange-400 disabled:cursor-not-allowed"
                    >
                        {verificationStatus === 'sending' ? 'Enviando...' : 'Reenviar Email de Verificación'}
                    </button>
                    {verificationStatus === 'sent' && <p className="text-green-700 font-semibold mt-2">¡Correo enviado! Para esta demostración, su correo ha sido verificado automáticamente.</p>}
                </div>
            )}
            
            <form onSubmit={handleSave} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-xs text-gray-500 mb-1">Your name or the name of the primary contact of the account.</p>
                    <input 
                        type="text" 
                        id="name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                    />
                </div>
                 <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <div className="relative mt-1">
                        <input 
                            type="email" 
                            id="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                        />
                         {user.email_verificado && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Verificado
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center space-x-4">
                     <button type="submit" className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700">
                        Save Settings
                    </button>
                    {isSaved && <p className="text-sm text-green-600">Settings saved successfully!</p>}
                </div>
            </form>
             <div className="border-t mt-8 pt-4 text-right">
                <button className="text-sm text-red-600 hover:underline">Close Account</button>
            </div>
        </div>
    );
};

export default GeneralSettings;