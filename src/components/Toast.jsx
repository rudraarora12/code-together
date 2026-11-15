import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

let addToastFn = null;

export function showToast(message, type = 'success') {
  if (addToastFn) {
    addToastFn(message, type);
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastFn = (message, type) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3500);
    };

    return () => {
      addToastFn = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center space-x-2.5 px-4 py-2.5 rounded-xl border border-gray-800 bg-[#161a29]/95 text-white shadow-xl backdrop-blur-md animate-slide-up text-xs font-medium"
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-cyan-400 shrink-0" />}
          <span className="text-gray-200">{toast.message}</span>
          <button
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            className="text-gray-400 hover:text-white ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
