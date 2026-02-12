import React from 'react';
import Logo from './Logo';
import { User } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white px-4 py-3 flex items-center justify-between">
      <Logo />
      
      <div className="flex items-center gap-3">
        {/* <button className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-full font-medium transition-all duration-200 text-sm">
          Upgrade
        </button>
        <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-all duration-200">
          <User className="w-4 h-4 text-gray-600" />
        </button> */}
      </div>
    </header>
  );
};

export default Header;