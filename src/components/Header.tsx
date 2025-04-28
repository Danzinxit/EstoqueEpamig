import React from 'react';
import { User, Globe, Mail } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full bg-gradient-to-r from-green-700 to-green-600 py-2 px-8 flex items-center justify-between shadow-md">
      <div className="flex items-center space-x-4">
      <img src="/epamig.png" alt="EPAMIG" className="h-12 animate-fade-in-out" style={{ background: 'transparent' }} />
        <div>
          <h1 className="text-2xl font-bold text-white">Empresa de Pesquisa Agropecuária de Minas Gerais</h1>
          <p className="text-sm text-white">Secretaria de Estado de Agricultura, Pecuária e Abastecimento</p>
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-4 text-white">
          <a href="https://www.epamig.br" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center group transition-transform duration-200 hover:scale-110">
            <Globe size={22} className="transition-transform duration-200 group-hover:scale-125 group-hover:text-yellow-200 group-hover:animate-spin-slow" />
            <span className="text-xs transition-colors duration-200 group-hover:text-yellow-200">Site</span>
          </a>
          <a href="mailto:contato@epamig.br" className="flex flex-col items-center group transition-transform duration-200 hover:scale-110">
            <Mail size={22} className="transition-transform duration-200 group-hover:scale-125 group-hover:text-yellow-200" />
            <span className="text-xs transition-colors duration-200 group-hover:text-yellow-200">E-mail</span>
          </a>
          <a href="https://empresade125369.rm.cloudtotvs.com.br/Corpore.Net/Login.aspx" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center group transition-transform duration-200 hover:scale-110">
            <User size={22} className="transition-transform duration-200 group-hover:scale-125 group-hover:text-yellow-200" />
            <span className="text-xs transition-colors duration-200 group-hover:text-yellow-200">Portal ADM</span>
          </a>
        </div>
      </div>
    </header>
  );
} 