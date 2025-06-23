import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LoginForm } from './components/LoginForm';
import { LoadingSpinner } from './components/LoadingSpinner';
import { DataSourceSettings } from './components/DataSourceSettings';
import { Footer } from './components/Footer';
import { useAuth } from './hooks/useAuth';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <Dashboard />
      </main>
      <Footer />
      <DataSourceSettings />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;