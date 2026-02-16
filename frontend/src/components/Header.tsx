import React from 'react';
import Logo from './Logo';
import { X } from 'lucide-react';

const Header: React.FC = () => {
  const handleClose = () => {
    window.parent.postMessage({ type: 'INTRVU_CLOSE_PANEL' }, '*');
  };

  return (
    <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
      <Logo />

      <div className="flex items-center gap-3">
        <button
          onClick={handleClose}
          className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all duration-200 group"
          title="Close Extension"
        >
          <X className="w-5 h-5 group-active:scale-95 transition-transform" />
        </button>
      </div>
    </header>
  );
};

export default Header;