import React from 'react';

interface UserDropdownProps {
  onClose: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ onClose }) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-10" 
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div className="absolute right-0 top-16 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Plan</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">Premium</span>
          </div>
          <div className="text-xs text-gray-500 mb-3">
            <div>Monthly limit: Unlimited</div>
          </div>
          <button className="w-full bg-blue-100 text-blue-700 py-2 px-3 rounded text-sm font-medium hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            Manage Subscription
          </button>
        </div>
        
        <div className="p-2">
          <div className="px-3 py-2 text-sm text-gray-600">yourname@gmail.com</div>
          
          <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            Reset password
          </button>
          
          <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            Sign out
          </button>
          
          <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50">
            Delete account
          </button>
        </div>
      </div>
    </>
  );
};

export default UserDropdown;