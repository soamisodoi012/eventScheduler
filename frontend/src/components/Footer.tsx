import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white p-4"> {/* Removed mt-6 */}
      <div className="container mx-auto text-center">
        <p className="mb-2">
          Contact us: 
          <a 
            href="https://linkedin.com/in/dejenie-derese" 
            className="text-blue-400 hover:underline ml-1"
            target="_blank" 
            rel="noopener noreferrer"
          >
            Dejenie Derese
          </a>
        </p>
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Event Scheduler. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;