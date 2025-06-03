import React from 'react';

export const Button = ({ children, onClick, className = '' }) => {
    return (
      <button
        type="submit"
        onClick={onClick}
        className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-8 font-poppins ${className}`}
      >
        {children}
      </button>
    );
  };
  
  export default Button;