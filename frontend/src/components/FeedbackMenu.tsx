import React from 'react';

interface FeedbackMenuProps {
  onClose: () => void;
}

const FeedbackMenu: React.FC<FeedbackMenuProps> = ({ onClose }) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-10" 
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="absolute bottom-16 right-0 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
        <div className="p-2">
          <button
            onClick={() => {
              try {
                window.open(
                  'https://mail.google.com/mail/?view=cm&fs=1&to=getintrvu@gmail.com&su=Support%20request',
                  '_blank'
                );
              } finally {
                onClose();
              }
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Speak with us
          </button>

          <button
            onClick={() => {
              try {
                window.open(
                  'https://docs.google.com/forms/d/e/1FAIpQLScPbR00X61FeowQmDIkfuU4AKMcoGm335DI2UOGHwdYVX2_sA/viewform',
                  '_blank'
                );
              } finally {
                onClose();
              }
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Give feedback
          </button>
        </div>
      </div>
    </>
  );
};

export default FeedbackMenu;