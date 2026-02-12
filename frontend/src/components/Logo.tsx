import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity duration-200">
      <img 
        src="/logo2.png" 
        alt="IntrvuFit Logo" 
        className="h-8 w-auto transform hover:scale-110 transition-transform duration-200"
      />
    </div>
  );
};

export default Logo;