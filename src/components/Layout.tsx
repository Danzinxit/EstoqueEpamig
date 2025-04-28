import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { Package2, Users, ArrowDownUp, Home, ClipboardCheck, Mail, Globe, User, LogOut } from 'lucide-react';
import epamigLogo from '../fotos/epamig.png';
import { useAuth } from '../contexts/AuthContext';

export function Layout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  // Verifica se o usuário é admin usando o role do perfil
  const isAdmin = user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Cabeçalho */}
      <header className="bg-gradient-to-r from-green-700 to-green-600 text-white py-4 shadow-lg">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-4">
          {/* Logo */}
          <div className="flex items-center mb-4 md:mb-0 hover:scale-105 transform transition-transform duration-300">
            <img
              src={epamigLogo}
              alt="Logo EPAMIG"
              className="h-14 w-auto mr-4 animate-pulse"
            />
            <div>
              <h5 className="text-xl font-bold mb-1">Empresa de Pesquisa Agropecuária de Minas Gerais</h5>
              <small className="text-green-100">Secretaria de Estado de Agricultura, Pecuária e Abastecimento</small>
            </div>
          </div>

          {/* Botões Rápidos */}
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://www.epamig.br"
              className="header-button group hover:scale-110 hover:shadow-lg active:scale-95 transition-all duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe size={22} className="group-hover:rotate-180 group-hover:scale-125 animate-bounce-light transform transition-transform duration-500" />
              <span>Site</span>
            </a>

            <a
              href="https://mail.google.com/mail/u/0/#inbox"
              className="header-button group hover:scale-110 hover:shadow-lg active:scale-95 transition-all duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Mail size={22} className="group-hover:scale-125 animate-bounce-light transform transition-transform duration-300" />
              <span>E-mail</span>
            </a>

            <a
              href="https://empresade125369.rm.cloudtotvs.com.br/Corpore.Net/Login.aspx"
              className="header-button group hover:scale-110 hover:shadow-lg active:scale-95 transition-all duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              <User size={22} className="group-hover:scale-125 animate-bounce-light transform transition-transform duration-300" />
              <span>Portal ADM</span>
            </a>

            {isAdmin && (
              <button
                onClick={() => navigate('/users')}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl shadow-md hover:scale-110 hover:shadow-lg active:scale-95 transition-all duration-200"
              >
                <span className="animate-bounce-light"><Users size={20} /></span>
                <span>Usuários</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl shadow-md hover:scale-110 hover:shadow-lg active:scale-95 transition-all duration-200"
            >
              <span className="animate-bounce-light"><LogOut size={20} /></span>
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navegação */}
      <nav className="bg-gradient-to-r from-green-800 to-green-700 text-white shadow-md">
        <div className="container mx-auto flex flex-wrap justify-center gap-6 py-3">
          <Link to="/" className={`nav-link group ${isActiveRoute('/') ? 'nav-link-active' : ''} hover:scale-110 hover:shadow-lg active:scale-95 transition-all duration-200`}>
            <span className="animate-bounce-light"><Home size={24} className="nav-icon" /></span>
            <span>Início</span>
          </Link>

          <Link to="/equipment" className={`nav-link group ${isActiveRoute('/equipment') ? 'nav-link-active' : ''} hover:scale-110 hover:shadow-lg active:scale-95 transition-all duration-200`}>
            <span className="animate-bounce-light"><Package2 size={24} className="nav-icon" /></span>
            <span>Equipamentos</span>
          </Link>

          <Link to="/stock-movements" className={`nav-link group ${isActiveRoute('/stock-movements') ? 'nav-link-active' : ''} hover:scale-110 hover:shadow-lg active:scale-95 transition-all duration-200`}>
            <span className="animate-bounce-light"><ArrowDownUp size={24} className="nav-icon" /></span>
            <span>Movimentações</span>
          </Link>

          <Link to="/stock-reduction" className={`nav-link group ${isActiveRoute('/stock-reduction') ? 'nav-link-active' : ''} hover:scale-110 hover:shadow-lg active:scale-95 transition-all duration-200`}>
            <span className="animate-bounce-light"><ClipboardCheck size={24} className="nav-icon" /></span>
            <span>Registrar Baixa</span>
          </Link>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Outlet />
      </main>

      {/* Rodapé */}
      <footer className="bg-gradient-to-r from-green-700 to-green-600 text-white py-4 shadow-inner">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm">&copy; {new Date().getFullYear()} EPAMIG - Sistema de Controle de Estoque</p>
          <span className="text-sm mt-2 md:mt-0">Desenvolvido com ❤️ pela equipe AINF</span>
        </div>
      </footer>
    </div>
  );
}
