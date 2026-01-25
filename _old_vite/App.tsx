/**
 * Main App Component with Authentication
 * Wraps the application with AuthProvider and ProtectedRoute
 */

import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainApp } from './components/MainApp';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <MainApp />
      </ProtectedRoute>
    </AuthProvider>
  );
};

export default App;