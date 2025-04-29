import { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  type?: 'warning' | 'success' | 'error' | 'danger' | 'info';
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}: ConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={48} className="text-yellow-500 animate-bounce-light" />;
      case 'success':
        return <CheckCircle2 size={48} className="text-green-500 animate-bounce-light" />;
      case 'error':
        return <XCircle size={48} className="text-red-500 animate-bounce-light" />;
      case 'danger':
        return <XCircle size={48} className="text-red-500 animate-bounce-light" />;
      case 'info':
        return <AlertTriangle size={48} className="text-blue-500 animate-bounce-light" />;
      default:
        return <AlertTriangle size={48} className="text-yellow-500 animate-bounce-light" />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'success':
        return 'bg-green-500 hover:bg-green-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      case 'danger':
        return 'bg-red-500 hover:bg-red-600';
      case 'info':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-yellow-500 hover:bg-yellow-600';
    }
  };

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 animate-scale-in">
        <div className="flex flex-col items-center space-y-4">
          {getIcon()}
          <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
          <p className="text-gray-600 text-center">{message}</p>
          
          <div className="flex justify-end space-x-3 w-full mt-6">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700
                       hover:bg-gray-50 transform hover:scale-105 transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg text-white font-semibold
                       transform hover:scale-105 transition-all duration-200
                       ${getButtonColor()}`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 