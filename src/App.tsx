import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { TablesOverview } from './components/tables/TablesOverview';
import { SqlEditor } from './components/editor/SqlEditor';
import { DataGrid } from './components/grid/DataGrid';
import { TableStructure } from './components/schema/TableStructure';
import { LiveProcesslist } from './components/monitor/LiveProcesslist';
import { ExportImportModal } from './components/export/ExportImportModal';
import { ExportImportView } from './components/export/ExportImportView';
import { CreateDatabaseModal } from './components/database/CreateDatabaseModal';
import { LoginPage } from './components/auth/LoginPage';
import { ActiveTab, TableInfo, AuthUser } from './types/database';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(api.getCurrentUser());
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>('tables');
  const [databases, setDatabases] = useState<string[]>([]);
  const [currentDatabase, setCurrentDatabase] = useState<string>('u495297697_appsheet');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({ ok: true, latencyMs: 0 });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCreateDbModalOpen, setIsCreateDbModalOpen] = useState(false);

  // Check auth session
  useEffect(() => {
    const checkAuth = async () => {
      const res = await api.verifyAuth();
      if (res.ok && res.user) {
        setCurrentUser(res.user);
      } else {
        setCurrentUser(null);
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  // Initial load once authenticated
  const loadInitialData = async () => {
    try {
      // 1. Check health
      const health = await api.getHealth();
      if (health?.database) {
        setConnectionStatus({
          ok: health.database.ok,
          latencyMs: health.database.latencyMs || 0,
        });
        if (health.database.database) {
          setCurrentDatabase(health.database.database);
        }
      }

      // 2. Fetch databases
      const dbRes = await api.getDatabases();
      if (dbRes?.ok && dbRes.databases?.length > 0) {
        setDatabases(dbRes.databases);
      } else {
        setDatabases(['u495297697_appsheet']);
      }

      // 3. Fetch tables
      const targetDb = health?.database?.database || currentDatabase;
      loadTables(targetDb);
    } catch (err) {
      console.error('Failed to load initial data', err);
      setConnectionStatus({ ok: false, latencyMs: 0 });
    }
  };

  const loadTables = async (db?: string) => {
    setIsLoadingTables(true);
    const targetDb = db || currentDatabase;
    try {
      const res = await api.getTables(targetDb);
      if (res?.ok) {
        setTables(res.tables || []);
        if (res.tables?.length > 0 && !selectedTable) {
          setSelectedTable(res.tables[0].name);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingTables(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadInitialData();
    }
  }, [currentUser]);

  const handleSelectDatabase = (db: string) => {
    setCurrentDatabase(db);
    setSelectedTable(null);
    loadTables(db);
  };

  const handleDatabaseCreated = async (newDb: string) => {
    try {
      const dbRes = await api.getDatabases();
      if (dbRes?.ok && dbRes.databases?.length > 0) {
        setDatabases(dbRes.databases);
      } else {
        setDatabases((prev) => (prev.includes(newDb) ? prev : [...prev, newDb]));
      }
      handleSelectDatabase(newDb);
      setActiveTab('tables');
    } catch (err) {
      console.error('Failed to reload databases after creation', err);
    }
  };

  const handleSelectTable = (tblName: string) => {
    setSelectedTable(tblName);
    setIsMobileSidebarOpen(false);
    if (activeTab === 'export') {
      setIsExportModalOpen(true);
    } else if (activeTab === 'tables' || activeTab === 'data') {
      setActiveTab('data');
    } else if (activeTab === 'structure') {
      setActiveTab('structure');
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    setIsMobileSidebarOpen(false);
    if (tab === 'export') {
      setIsExportModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  // If verifying session
  if (isCheckingAuth) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans text-sm">
        Memverifikasi sesi...
      </div>
    );
  }

  // If not logged in, show Login Page
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-800 font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        databases={databases}
        currentDatabase={currentDatabase}
        onSelectDatabase={handleSelectDatabase}
        connectionStatus={connectionStatus}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenCreateDatabase={() => setIsCreateDbModalOpen(true)}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        tablesCount={tables.length}
      />

      {/* Workspace Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar Table Explorer */}
        <Sidebar
          tables={tables}
          selectedTable={selectedTable}
          onSelectTable={handleSelectTable}
          onOpenOverview={() => {
            setActiveTab('tables');
            setIsMobileSidebarOpen(false);
          }}
          isLoading={isLoadingTables}
          onRefresh={() => loadTables()}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Center Main Viewport */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden relative">
          {/* 1. All Tables Overview */}
          {activeTab === 'tables' && (
            <TablesOverview
              tables={tables}
              currentDatabase={currentDatabase}
              onRefresh={() => loadTables()}
              onSelectTable={(tbl, view) => {
                setSelectedTable(tbl);
                setActiveTab(view);
              }}
              onOpenCreateDatabase={currentUser?.role === 'super-admin' ? () => setIsCreateDbModalOpen(true) : undefined}
            />
          )}

          {/* 2. SQL Studio Monaco */}
          {activeTab === 'workspace' && (
            <SqlEditor tables={tables} currentDatabase={currentDatabase} />
          )}

          {/* 3. Data Grid with Full CRUD */}
          {activeTab === 'data' && (
            <DataGrid
              tableName={selectedTable}
              database={currentDatabase}
              onOpenExport={() => setIsExportModalOpen(true)}
            />
          )}

          {/* 4. Table Structure */}
          {activeTab === 'structure' && (
            <TableStructure
              tableName={selectedTable}
              currentDatabase={currentDatabase}
              onRenameSuccess={(newTbl) => {
                setSelectedTable(newTbl);
                loadTables(currentDatabase);
              }}
              onRefreshTables={() => loadTables(currentDatabase)}
            />
          )}

          {/* 5. Live Processlist */}
          {activeTab === 'monitor' && <LiveProcesslist />}

          {/* 6. Export & Import Full Page View (phpMyAdmin Style) */}
          {activeTab === 'export' && (
            <ExportImportView
              tables={tables}
              currentDatabase={currentDatabase}
              selectedTable={selectedTable}
              onSelectTable={(tbl, view) => {
                setSelectedTable(tbl);
                setActiveTab(view);
              }}
            />
          )}
        </main>
      </div>

      {/* Export & Import Modal */}
      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tables={tables}
        selectedTable={selectedTable}
      />

      {/* Create Database Modal */}
      <CreateDatabaseModal
        isOpen={isCreateDbModalOpen}
        onClose={() => setIsCreateDbModalOpen(false)}
        onSuccess={handleDatabaseCreated}
      />
    </div>
  );
};
