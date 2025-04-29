import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Equipment from './pages/Equipment';
import StockMovements from './pages/StockMovements';
import StockReduction from './pages/StockReduction';
import Users from './pages/Users';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Home, Package, ArrowUpDown, ClipboardCheck, LogOut, User } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  const { session, signOut, user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin';

  if (!session) {
    return <Login />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg relative">
          <div className="p-4">
            <h1 className="text-2xl font-bold text-gray-800">Estoque EPAMIG</h1>
          </div>
          {/* User Info e navegação */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <User size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {session.user.user_metadata?.full_name || session.user.email}
                </p>
                <p className="text-xs text-gray-500">
                  {session.user.user_metadata?.role || 'Usuário'}
                </p>
              </div>
            </div>
          </div>
          <nav className="mt-4">
            <Link
              to="/"
              className={`flex items-center px-4 py-2 text-gray-700 transition-all duration-200 group hover:bg-gray-100 hover:scale-105 hover:text-green-700 ${
                location.pathname === '/' ? 'bg-gray-100' : ''
              }`}
            >
              <Home size={20} className="mr-3 transition-transform duration-200 group-hover:scale-125 group-hover:text-green-600" />
              <span className="transition-colors duration-200 group-hover:text-green-700">Início</span>
            </Link>
            <Link
              to="/equipment"
              className={`flex items-center px-4 py-2 text-gray-700 transition-all duration-200 group hover:bg-gray-100 hover:scale-105 hover:text-green-700 ${
                location.pathname === '/equipment' ? 'bg-gray-100' : ''
              }`}
            >
              <Package size={20} className="mr-3 transition-transform duration-200 group-hover:scale-125 group-hover:text-green-600" />
              <span className="transition-colors duration-200 group-hover:text-green-700">Equipamentos</span>
            </Link>
            <Link
              to="/movements"
              className={`flex items-center px-4 py-2 text-gray-700 transition-all duration-200 group hover:bg-gray-100 hover:scale-105 hover:text-green-700 ${
                location.pathname === '/movements' ? 'bg-gray-100' : ''
              }`}
            >
              <ArrowUpDown size={20} className="mr-3 transition-transform duration-200 group-hover:scale-125 group-hover:text-green-600" />
              <span className="transition-colors duration-200 group-hover:text-green-700">Movimentações</span>
            </Link>
            <Link
              to="/reduction"
              className={`flex items-center px-4 py-2 text-gray-700 transition-all duration-200 group hover:bg-gray-100 hover:scale-105 hover:text-green-700 ${
                location.pathname === '/reduction' ? 'bg-gray-100' : ''
              }`}
            >
              <ClipboardCheck size={20} className="mr-3 transition-transform duration-200 group-hover:scale-125 group-hover:text-green-600" />
              <span className="transition-colors duration-200 group-hover:text-green-700">Baixa</span>
            </Link>
            <Link
              to="/users"
              className={`flex items-center px-4 py-2 text-gray-700 transition-all duration-200 group hover:bg-gray-100 hover:scale-105 hover:text-green-700 ${
                location.pathname === '/users' ? 'bg-gray-100' : ''
              }`}
            >
              <User size={20} className="mr-3 transition-transform duration-200 group-hover:scale-125 group-hover:text-green-600" />
              <span className="transition-colors duration-200 group-hover:text-green-700">Usuário</span>
            </Link>
          </nav>
          <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
            <button
              onClick={signOut}
              className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 group hover:scale-105 hover:text-red-700"
            >
              <LogOut size={20} className="mr-3 transition-transform duration-200 group-hover:scale-125 group-hover:text-red-600" />
              <span className="transition-colors duration-200 group-hover:text-red-700">Sair</span>
            </button>
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/movements" element={<StockMovements />} />
            <Route path="/reduction" element={<StockReduction />} />
            <Route path="/users" element={<Users />} />
          </Routes>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default AppWrapper;