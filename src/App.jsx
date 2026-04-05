import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { PropertyProvider } from './context/PropertyContext';
import { ClientProvider } from './context/ClientContext';
import { FinanceProvider } from './context/FinanceContext';
import { ContractProvider } from './context/ContractContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import MigrateData from './utils/MigrateData';

// Layout
import MainLayout from './layouts/MainLayout';

// Pages
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Finance from './pages/Finance/Finance';
import TransactionDetails from './pages/Finance/TransactionDetails';
import Clients from './pages/Clients/Clients';
import ClientDetails from './pages/Clients/ClientDetails';
import BuildingsList from './pages/Buildings/BuildingsList';
import BuildingDetails from './pages/Buildings/BuildingDetails';
import ContractsManager from './pages/Contracts/ContractsManager';
import ContractWizard from './pages/Contracts/ContractWizard';
import AdminPanel from './pages/Admin/AdminPanel';
import PendingApproval from './pages/Access/PendingApproval/PendingApproval';
import RejectedAccess from './pages/Access/RejectedAccess/RejectedAccess';


function ProtectedRoute({ children }) {
  const { currentUser, userStatus } = useAuth();
  if (currentUser === undefined) return <div>Loading...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (userStatus === 'pending') return <Navigate to="/pending" replace />;
  if (userStatus === 'rejected') return <Navigate to="/rejected" replace />;
  
  return children;
}

// Set MIGRATION_DONE to true and redeploy once you've clicked "Start Migration" successfully.
const MIGRATION_DONE = true;

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          {!MIGRATION_DONE && <MigrateData />}
          <PropertyProvider>
            <ClientProvider>
              <FinanceProvider>
                <ContractProvider>
                  <BrowserRouter>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/pending" element={<PendingApproval />} />
                      <Route path="/rejected" element={<RejectedAccess />} />
                      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="finance" element={<Finance />} />
                        <Route path="finance/:id" element={<TransactionDetails />} />
                        <Route path="clients" element={<Clients />} />
                        <Route path="clients/:id" element={<ClientDetails />} />
                        <Route path="buildings" element={<BuildingsList />} />
                        <Route path="buildings/:id" element={<BuildingDetails />} />
                        <Route path="contracts" element={<ContractsManager />} />
                        <Route path="contracts/new" element={<ContractWizard />} />
                        <Route path="admin/users" element={<AdminPanel />} />
                      </Route>
                    </Routes>
                  </BrowserRouter>
                </ContractProvider>
              </FinanceProvider>
            </ClientProvider>
          </PropertyProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
