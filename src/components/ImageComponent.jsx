import React, { useState, useEffect } from 'react';
import logo from '../assets/logo.png';
import coverImage from '../assets/cover.jpg';

export const ImageComponent = () => {
  const quotes = [
    "Every project is an opportunity to learn, to figure out problems and challenges, to invent and reinvent.",
    "Project management is the art of creating the illusion that any outcome is the result of a series of predetermined, deliberate acts.",
    "The key to successful project management is having the ability to prioritize and manage your resources efficiently."
  ];

  const [currentQuote, setCurrentQuote] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentQuote((prevQuote) => (prevQuote + 1) % quotes.length);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="relative flex items-center justify-center h-full w-full">
      <img 
        src={coverImage}
        className="absolute inset-0 w-full h-full object-cover" 
      />
      <div className="absolute inset-0 bg-blue-600 opacity-75"></div>
      <div className="relative z-10 text-white p-6 text-center">
        <div className="mb-4">
          <img src={logo} alt="Logo" className="mx-auto h-6 sm:h-6 md:h-9" />
        </div>
        <p className="text-xs sm:text-xs md:text-sm italic pl-4 pr-4 font-poppins">
          {quotes[currentQuote]}
        </p>
      </div>
    </div>
  );
};

export default ImageComponent;
