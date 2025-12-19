// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, Frown } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-red-100 to-pink-100 mb-4">
            <Frown className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mt-2">Page Not Found</h2>
          <p className="text-gray-600 mt-4">
            The page you're looking for doesn't exist or has been moved to a different location.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="block w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Homepage
          </Link>
          
          <Link
            to="/properties"
            className="block w-full px-6 py-3 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center"
          >
            <Search className="w-5 h-5 mr-2" />
            Browse Properties
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <Link to="/contact" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;