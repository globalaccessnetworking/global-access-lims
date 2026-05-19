import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ToastProvider';
import QuickSearch from './components/QuickSearch';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BioLibrary from './pages/BioLibrary';
import InventoryHub from './pages/InventoryHub';
import QueryHub from './pages/QueryHub';
import AddData from './pages/AddData';
import StorageMap from './components/StorageMap';
import StorageVisualizer from './pages/StorageVisualizer';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import LabAnalytics from './pages/LabAnalytics';
import MaintenanceLog from './pages/MaintenanceLog';
import EquipmentTracker from './pages/EquipmentTracker';
import AuditTrail from './pages/AuditTrail';
import HostRangeMatrix from './pages/HostRangeMatrix';
import BoxMatrix from './pages/BoxMatrix';
import StrainEntry from './pages/StrainEntry';
import StrainRepository from './pages/StrainRepository';
import HostBacteriaEntry from './pages/HostBacteriaEntry';
import PhageRepository from './pages/PhageRepository';
import AntibioticRepository from './pages/AntibioticRepository';
import PlasmidRepository from './pages/PlasmidRepository';
import PrimerRepository from './pages/PrimerRepository';
import DynamicModule from './pages/DynamicModule';
import InventoryEntry from './pages/InventoryEntry';
import PhageEntry from './pages/PhageEntry';
import PlasmidEntry from './pages/PlasmidEntry';
import PrimerEntry from './pages/PrimerEntry';
import Storage3D from './pages/Storage3D';
import SequenceWorkbench from './pages/SequenceWorkbench';
import ExperimentalLogbook from './pages/ExperimentalLogbook';
import ChemicalRepository from './pages/ChemicalRepository';
import LabProjectManager from './pages/LabProjectManager';
import AlertCenter from './pages/AlertCenter';
import PublicCatalog from './pages/PublicCatalog';
import TreatmentDesigner from './pages/TreatmentDesigner';
import FormBuilder from './pages/Admin/FormBuilder';
import FormExecutor from './pages/Admin/FormExecutor';
import QRGenerator from './pages/QRGenerator';
import QRReader from './pages/QRReader';
import BulkImport from './pages/BulkImport';
import FeatureSummary from './pages/FeatureSummary';
import EquipmentBooking from './pages/EquipmentBooking';
import ExperimentTemplates from './pages/ExperimentTemplates';
import SuccessRateAnalytics from './pages/SuccessRateAnalytics';
import AuditTrailViewer from './pages/AuditTrailViewer';
import ProtocolLibrary from './pages/ProtocolLibrary';
import AntibioticsDiscsEntry from './pages/AntibioticsDiscsEntry';
import LabStockEntry from './pages/LabStockEntry';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppContent = () => {
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const navigate = useNavigate();

  // Global keyboard shortcuts
  useKeyboardShortcuts([
    {
      keys: 'ctrl+k',
      action: () => setShowQuickSearch(true),
      preventDefault: true
    },
    {
      keys: 'ctrl+n',
      action: () => navigate('/experiments/new'),
      preventDefault: true
    }
  ]);

  return (
    <>
      <QuickSearch
        isOpen={showQuickSearch}
        onClose={() => setShowQuickSearch(false)}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
        <Route path="/library" element={<PrivateRoute><Layout><BioLibrary /></Layout></PrivateRoute>} />
        <Route path="/inventory-hub" element={<PrivateRoute><Layout><InventoryHub /></Layout></PrivateRoute>} />
        <Route path="/query-hub" element={<PrivateRoute><Layout><QueryHub /></Layout></PrivateRoute>} />
        <Route path="/data-entry" element={<PrivateRoute><Layout><AddData /></Layout></PrivateRoute>} />
        <Route path="/add-data" element={<PrivateRoute><Layout><AddData /></Layout></PrivateRoute>} />
        <Route path="/storage-map" element={<PrivateRoute><Layout><StorageMap /></Layout></PrivateRoute>} />
        <Route path="/storage" element={<PrivateRoute><Layout><StorageVisualizer /></Layout></PrivateRoute>} />
        <Route path="/storage-visualizer" element={<PrivateRoute><Layout><StorageVisualizer /></Layout></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><Layout><AdminPanel /></Layout></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><Layout><LabAnalytics /></Layout></PrivateRoute>} />
        <Route path="/maintenance" element={<PrivateRoute><Layout><MaintenanceLog /></Layout></PrivateRoute>} />
        <Route path="/equipment" element={<PrivateRoute><Layout><EquipmentTracker /></Layout></PrivateRoute>} />
        <Route path="/audit" element={<PrivateRoute><Layout><AuditTrail /></Layout></PrivateRoute>} />
        <Route path="/phage-matrix" element={<PrivateRoute><Layout><HostRangeMatrix /></Layout></PrivateRoute>} />
        <Route path="/matrix" element={<PrivateRoute><Layout><HostRangeMatrix /></Layout></PrivateRoute>} />
        <Route path="/box-matrix" element={<PrivateRoute><Layout><BoxMatrix /></Layout></PrivateRoute>} />
        <Route path="/strain-entry" element={<PrivateRoute><Layout><StrainEntry /></Layout></PrivateRoute>} />
        <Route path="/host-bacteria-entry" element={<PrivateRoute><Layout><HostBacteriaEntry /></Layout></PrivateRoute>} />
        <Route path="/strains" element={<PrivateRoute><Layout><StrainRepository /></Layout></PrivateRoute>} />
        <Route path="/strain-repository" element={<PrivateRoute><Layout><StrainRepository /></Layout></PrivateRoute>} />
        <Route path="/phages" element={<PrivateRoute><Layout><PhageRepository /></Layout></PrivateRoute>} />
        <Route path="/phage-repository" element={<PrivateRoute><Layout><PhageRepository /></Layout></PrivateRoute>} />
        <Route path="/antibiotics" element={<PrivateRoute><Layout><AntibioticRepository /></Layout></PrivateRoute>} />
        <Route path="/antibiotic-repository" element={<PrivateRoute><Layout><AntibioticRepository /></Layout></PrivateRoute>} />
        <Route path="/plasmids" element={<PrivateRoute><Layout><PlasmidRepository /></Layout></PrivateRoute>} />
        <Route path="/plasmid-repository" element={<PrivateRoute><Layout><PlasmidRepository /></Layout></PrivateRoute>} />
        <Route path="/primers" element={<PrivateRoute><Layout><PrimerRepository /></Layout></PrivateRoute>} />
        <Route path="/primer-repository" element={<PrivateRoute><Layout><PrimerRepository /></Layout></PrivateRoute>} />
        <Route path="/dynamic/:type" element={<PrivateRoute><Layout><DynamicModule /></Layout></PrivateRoute>} />
        <Route path="/dashboard/system/:type" element={<PrivateRoute><Layout><DynamicModule /></Layout></PrivateRoute>} />
        <Route path="/inventory-entry" element={<PrivateRoute><Layout><InventoryEntry /></Layout></PrivateRoute>} />
        <Route path="/phage-entry" element={<PrivateRoute><Layout><PhageEntry /></Layout></PrivateRoute>} />
        <Route path="/antibiotics-discs-entry" element={<PrivateRoute><Layout><AntibioticsDiscsEntry /></Layout></PrivateRoute>} />
        <Route path="/lab-stock-entry" element={<PrivateRoute><Layout><LabStockEntry /></Layout></PrivateRoute>} />
        <Route path="/plasmid-entry" element={<PrivateRoute><Layout><PlasmidEntry /></Layout></PrivateRoute>} />
        <Route path="/primer-entry" element={<PrivateRoute><Layout><PrimerEntry /></Layout></PrivateRoute>} />
        <Route path="/storage-3d" element={<PrivateRoute><Layout><Storage3D /></Layout></PrivateRoute>} />
        <Route path="/sequence-workbench" element={<PrivateRoute><Layout><SequenceWorkbench /></Layout></PrivateRoute>} />
        <Route path="/experiments" element={<PrivateRoute><Layout><ExperimentalLogbook /></Layout></PrivateRoute>} />
        <Route path="/experiments/new" element={<PrivateRoute><Layout><ExperimentalLogbook initialShowForm={true} /></Layout></PrivateRoute>} />
        <Route path="/lab-management" element={<PrivateRoute><Layout><LabProjectManager /></Layout></PrivateRoute>} />
        <Route path="/chemicals" element={<PrivateRoute><Layout><ChemicalRepository /></Layout></PrivateRoute>} />
        <Route path="/chemical-inventory" element={<PrivateRoute><Layout><ChemicalRepository /></Layout></PrivateRoute>} />
        <Route path="/projects" element={<PrivateRoute><Layout><LabProjectManager /></Layout></PrivateRoute>} />
        <Route path="/alerts" element={<PrivateRoute><Layout><AlertCenter /></Layout></PrivateRoute>} />
        <Route path="/catalog" element={<PublicCatalog />} />
        <Route path="/treatment-designer" element={<PrivateRoute><Layout><TreatmentDesigner /></Layout></PrivateRoute>} />
        <Route path="/treatment" element={<PrivateRoute><Layout><TreatmentDesigner /></Layout></PrivateRoute>} />
        <Route path="/admin/form-builder" element={<PrivateRoute><Layout><FormBuilder /></Layout></PrivateRoute>} />
        <Route path="/forms/:formId/entry" element={<PrivateRoute><Layout><FormExecutor /></Layout></PrivateRoute>} />
        <Route path="/qr-generator" element={<PrivateRoute><Layout><QRGenerator /></Layout></PrivateRoute>} />
        <Route path="/qr-reader" element={<PrivateRoute><Layout><QRReader /></Layout></PrivateRoute>} />
        <Route path="/bulk-import" element={<PrivateRoute><Layout><BulkImport /></Layout></PrivateRoute>} />
        <Route path="/features" element={<PrivateRoute><Layout><FeatureSummary /></Layout></PrivateRoute>} />
        <Route path="/equipment-booking" element={<PrivateRoute><Layout><EquipmentBooking /></Layout></PrivateRoute>} />
        <Route path="/experiment-templates" element={<PrivateRoute><Layout><ExperimentTemplates /></Layout></PrivateRoute>} />
        <Route path="/success-analytics" element={<PrivateRoute><Layout><SuccessRateAnalytics /></Layout></PrivateRoute>} />
        <Route path="/audit-trail" element={<PrivateRoute><Layout><AuditTrailViewer /></Layout></PrivateRoute>} />
        <Route path="/protocols" element={<PrivateRoute><Layout><ProtocolLibrary /></Layout></PrivateRoute>} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <AppContent />
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

