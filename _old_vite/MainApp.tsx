import React, { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { DashboardView } from './DashboardView';
import { PatientDetail } from './PatientDetail';
import { CreateClientModal } from './CreateClientModal';
import { CreateAppointmentModal } from './CreateAppointmentModal';
import { ViewState, Patient, Session, Note } from '../types';
import { MOCK_SESSIONS } from '../constants';
import { Users, Search, Plus, Calendar as CalendarIcon, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getClients } from '../lib/api/clients';
import { getWorkspaces, createWorkspace } from '../lib/api/workspaces';
import type { Client, Workspace } from '../lib/supabase';

export const MainApp: React.FC = () => {
  const { user, profile } = useAuth();

  // State
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<Session[]>(MOCK_SESSIONS);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentClientId, setAppointmentClientId] = useState<string | null>(null);

  // Initialize workspace and load clients
  useEffect(() => {
    if (user) {
      initializeWorkspace();
    }
  }, [user]);

  const initializeWorkspace = async () => {
    try {
      setLoading(true);

      // Get user's workspaces
      const workspaces = await getWorkspaces();

      if (workspaces.length > 0) {
        // Use first workspace
        setWorkspace(workspaces[0]);
        await loadClients(workspaces[0].id);
      } else {
        // Create default workspace
        const newWorkspace = await createWorkspace({
          name: `Consultorio de ${profile?.full_name || 'Psicología'}`,
          slug: `workspace-${Date.now()}`,
        });
        setWorkspace(newWorkspace);
        // No clients yet
        setClients([]);
      }
    } catch (error) {
      console.error('Error initializing workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async (workspaceId: string) => {
    try {
      const fetchedClients = await getClients(workspaceId);
      setClients(fetchedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleCreateClient = async () => {
    if (workspace) {
      await loadClients(workspace.id);
    }
  };

  // Derived state
  const todaysSessions = sessions.filter(s => {
    const d = new Date(s.date);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  });

  const filteredClients = clients.filter(c => {
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || (c.doc_id && c.doc_id.includes(searchTerm));
  });

  const handleAddSession = (clientId: string) => {
    setAppointmentClientId(clientId);
    setShowAppointmentModal(true);
  };

  const handleAppointmentSuccess = () => {
    // Optionally refresh data or show success message
    setShowAppointmentModal(false);
    setAppointmentClientId(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando workspace...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // 1. Patient Detail View (Interstitials)
    if (currentView === 'patients' && selectedPatientId) {
        const client = clients.find(c => c.id === selectedPatientId);
        if (!client) return <div>Cliente no encontrado</div>;
        if (!workspace) return <div>Workspace no disponible</div>;
        return (
            <PatientDetail
                client={client}
                workspaceId={workspace.id}
                onBack={() => setSelectedPatientId(null)}
                onAddSession={handleAddSession}
            />
        );
    }

    // 2. Main Views
    switch (currentView) {
      case 'dashboard':
        return <DashboardView sessions={sessions} todaysSessions={todaysSessions} />;

      case 'patients':
        return (
            <div className="space-y-6 pb-20 max-w-5xl mx-auto">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pacientes</h1>
                        <p className="text-slate-500 mt-1">
                          {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'} en total
                        </p>
                    </div>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-primary text-white p-3 rounded-2xl hover:bg-primaryDark transition-all shadow-glow hover:shadow-lg active:scale-95"
                    >
                        <Plus size={24} />
                    </button>
                </header>

                {/* Search - Floating Style */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                         <Search className="text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o documento..."
                        className="w-full pl-11 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/20 focus:shadow-lg transition-all text-slate-900 placeholder-slate-400 font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Empty State */}
                {clients.length === 0 && (
                  <div className="bg-white rounded-2xl p-12 text-center">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users size={40} className="text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      No hay clientes aún
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Comienza agregando tu primer cliente
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                      <Plus size={20} />
                      Agregar Cliente
                    </button>
                  </div>
                )}

                {/* List */}
                {clients.length > 0 && (
                  <div className="space-y-3">
                      {filteredClients.map((client) => {
                        const fullName = `${client.first_name} ${client.last_name}`;
                        return (
                          <div
                              key={client.id}
                              onClick={() => setSelectedPatientId(client.id)}
                              className="bg-white p-5 rounded-2xl border border-transparent shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group flex items-center justify-between"
                          >
                              <div className="flex items-center gap-5">
                                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-teal-100 text-primaryDark flex items-center justify-center font-bold text-lg shadow-inner">
                                      {fullName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary transition-colors">
                                        {fullName}
                                      </h3>
                                      <p className="text-sm text-slate-500 font-medium">
                                        {client.phone || 'Sin teléfono'} • {client.city || 'Sin ciudad'}
                                      </p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                  </div>
                              </div>
                          </div>
                        );
                      })}
                      {filteredClients.length === 0 && clients.length > 0 && (
                          <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                  <Search size={24} className="opacity-50" />
                              </div>
                              <p className="font-medium">No se encontraron clientes.</p>
                              <p className="text-sm opacity-70">Intenta con otro término de búsqueda.</p>
                          </div>
                      )}
                  </div>
                )}
            </div>
        );

      case 'calendar':
          return (
              <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400 animate-in fade-in duration-500">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                      <CalendarIcon size={40} className="text-slate-300" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-600">Calendario Inteligente</h2>
                  <p className="mt-2 text-slate-400 max-w-xs text-center">Estamos preparando una vista de agenda avanzada con recordatorios automáticos.</p>
                  <span className="mt-8 px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-widest">En Desarrollo</span>
              </div>
          );

      case 'finance':
          return (
               <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400 animate-in fade-in duration-500">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                     <Users size={40} className="text-slate-300" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-600">Módulo Financiero</h2>
                  <p className="mt-2 text-slate-400 max-w-xs text-center">Pronto podrás gestionar facturación electrónica y reportes de ingresos.</p>
                  <span className="mt-8 px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-widest">En Desarrollo</span>
              </div>
          );

      default:
        return <div>Vista no encontrada</div>;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 selection:bg-primary/20 selection:text-primaryDark">
        <Navigation currentView={currentView} setView={(v) => {
            setCurrentView(v);
            setSelectedPatientId(null); // Reset selection on nav change
        }} />

        <main className="md:pl-72 min-h-screen transition-all duration-300">
          <div className="max-w-7xl mx-auto p-6 md:p-12 pt-8 md:pt-12">
              {renderContent()}
          </div>
        </main>
      </div>

      {/* Create Client Modal */}
      {showCreateModal && workspace && (
        <CreateClientModal
          workspaceId={workspace.id}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateClient}
        />
      )}

      {/* Create Appointment Modal */}
      {showAppointmentModal && workspace && appointmentClientId && (
        <CreateAppointmentModal
          workspaceId={workspace.id}
          client={clients.find(c => c.id === appointmentClientId)!}
          onClose={() => {
            setShowAppointmentModal(false);
            setAppointmentClientId(null);
          }}
          onSuccess={handleAppointmentSuccess}
        />
      )}
    </>
  );
};
