
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-800 text-slate-300 py-4">
      <div className="container mx-auto text-center text-sm">
        <p>&copy; {new Date().getFullYear()} SIVES. Sistema de Votación Escolar Segura. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};