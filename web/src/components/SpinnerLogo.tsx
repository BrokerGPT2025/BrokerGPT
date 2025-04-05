import React from 'react';
import logo from '../assets/logo-b.svg'; // Import the logo

const SpinnerLogo: React.FC = () => {
  return (
    // Removed the outer full-screen div.
    // Adjusted styling for inline chat display: removed shadow, adjusted padding/margins.
    // Using font-baumans class (will configure in tailwind.config.js)
    <div className="flex flex-col items-center justify-center py-2 font-baumans">

      {/* logo contents */}
      <div className="relative flex items-center justify-center mb-2">

        {/* icon wrapper */}
        {/* Made spinner smaller */}
        <div className="relative w-10 h-10">

          {/* NEW: Clean spinning gradient background (Indigo to Pink) */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 animate-spin" />

          {/* icon spinner: Static logo */}
          <img
            src={logo} // Use imported logo
            alt="brokerGPT logo spinner"
            // Adjusted size and margin for smaller container
            className="absolute inset-0 m-auto w-8 h-8 rounded-full z-10"
          />
        </div>

        {/* Brand Text - Removed for cleaner inline look */}
        {/* <div className="ml-3 text-lg text-gray-700">
          brokerGPT
        </div> */}
      </div>

      {/* slogan container */}
      {/* Made text smaller */}
      <div className="text-center text-sm text-gray-600">
        thinking...
      </div>

    </div>
  );
};

export default SpinnerLogo;
