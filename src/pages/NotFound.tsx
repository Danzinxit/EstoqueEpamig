import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
        <img 
          src="/logoepamig.png" 
          alt="EPAMIG Logo" 
          className="w-48 mx-auto mb-8"
        />
        <div className="relative">
          <h1 className="text-9xl font-bold text-gray-800 opacity-10 absolute -top-16 left-1/2 transform -translate-x-1/2">404</h1>
          <h2 className="text-3xl font-bold text-gray-800 relative z-10">Página não encontrada</h2>
        </div>
        <p className="text-gray-600 mt-4 mb-8">
          Desculpe, a página que você está procurando não existe ou foi movida.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
        >
          <Home size={20} />
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
};

export default NotFound; 