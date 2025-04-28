import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import epamigLogo from '../fotos/epamig.png';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Por favor, preencha todos os campos.');
      }

      await signIn(email, password);
      navigate('/');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Falha no login. Verifique suas credenciais.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 animate-gradient-x">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 transform hover:scale-[1.02] transition-all duration-300 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <img 
            src={epamigLogo} 
            alt="Logo EPAMIG" 
            className="h-20 w-auto mb-6 animate-float" 
          />
          <h1 className="text-2xl font-bold text-green-700 text-center animate-fade-in-up">
            Sistema de Controle de Estoque
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="transform transition-all duration-200 hover:translate-y-[-2px]">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm 
                       focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none
                       transition-all duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="seu.email@epamig.br"
              required
            />
          </div>

          <div className="transform transition-all duration-200 hover:translate-y-[-2px]">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm 
                         focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none
                         transition-all duration-200 pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500
                         hover:text-gray-700 transition-colors duration-200"
              >
                {showPassword ? (
                  <EyeOff size={20} className="animate-pulse-soft" />
                ) : (
                  <Eye size={20} className="animate-pulse-soft" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg animate-shake">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent 
                     rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 
                     hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                     focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed
                     transform hover:scale-[1.02] transition-all duration-200
                     disabled:hover:scale-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="animate-pulse">Entrando...</span>
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
