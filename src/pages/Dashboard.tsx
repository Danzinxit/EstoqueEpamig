import { Link } from 'react-router-dom';
import { Package, ArrowUpDown, ArrowDown } from 'lucide-react';

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Sistema de Controle de Estoque</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/equipment" className="block">
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <Package className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold">Equipamentos</h2>
            </div>
            <p className="text-gray-600">Gerenciar cadastro de equipamentos e controle de estoque</p>
          </div>
        </Link>

        <Link to="/stock-movements" className="block">
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <ArrowUpDown className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Movimentações</h2>
            </div>
            <p className="text-gray-600">Registrar entradas e saídas de equipamentos</p>
          </div>
        </Link>

        <Link to="/stock-reduction" className="block">
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <ArrowDown className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-semibold">Registrar Baixa</h2>
            </div>
            <p className="text-gray-600">Registrar baixas de equipamentos com número de chamado</p>
          </div>
        </Link>
      </div>
    </div>
  );
}