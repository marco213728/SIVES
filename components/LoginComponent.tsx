import React, { useState } from 'react';
import { LockClosedIcon, UserIcon } from './icons';

interface LoginComponentProps {
  onLogin: (codigo: string, password?: string) => Promise<boolean>;
}

const LoginComponent: React.FC<LoginComponentProps> = ({ onLogin }) => {
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) {
      setError('Por favor, ingrese su código.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const success = await onLogin(codigo, password);
      if (!success) {
        setError('Credenciales incorrectas. Verifique su código y/o contraseña.');
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError('Ocurrió un error al iniciar sesión. Por favor, intente de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-slate-200">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900">
            Bienvenido a SIVES
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingrese sus credenciales para continuar.
            <br />
            <span className="font-medium">Los estudiantes no necesitan contraseña.</span>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="user-code" className="sr-only">
                Código de Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="user-code"
                  name="user-code"
                  type="text"
                  autoComplete="username"
                  required
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                  placeholder="Código de Usuario"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                  placeholder="Contraseña (solo para administradores)"
                />
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary-darker focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginComponent;
