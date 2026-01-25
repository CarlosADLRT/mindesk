import React, { useState, useEffect } from 'react';
import { COP_CURRENCY } from '../constants';
import { ArrowLeft, Plus, FileText, Save, Clock, Package as PackageIcon, Loader, Edit } from 'lucide-react';
import { getAppointmentsByDateRange, saveSessionNote } from '../lib/api/appointments';
import { EditClientModal } from './EditClientModal';
import type { Client } from '../lib/supabase';

interface PatientDetailProps {
  client: Client;
  workspaceId: string;
  onBack: () => void;
  onAddSession: (clientId: string) => void;
  refreshKey?: number;
  onClientUpdate?: () => void;
}

export const PatientDetail: React.FC<PatientDetailProps> = ({
  client,
  workspaceId,
  onBack,
  onAddSession,
  refreshKey = 0,
  onClientUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'notes'>('info');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);

  // Manual note capture state
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch appointments for this client
  useEffect(() => {
    loadAppointments();
  }, [client.id, workspaceId, refreshKey]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      // Get appointments from last 2 years to present
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 2);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // Include future appointments

      const data = await getAppointmentsByDateRange(workspaceId, startDate, endDate);

      // Filter for this specific client
      const clientAppointments = data.filter((apt: any) => apt.client_id === client.id);
      setAppointments(clientAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sort appointments by date (most recent first)
  const sortedAppointments = [...appointments].sort((a, b) =>
    new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );

  const handleSaveNote = async () => {
    if (!selectedAppointmentId || !noteContent.trim()) return;

    setIsSaving(true);
    try {
      // Save the generated note in the subjective field
      // In the future, we could parse SOAP format and split into separate fields
      await saveSessionNote(selectedAppointmentId, {
        subjective: noteContent.trim(),
        client_id: client.id,
        workspace_id: workspaceId,
      });

      // Reload appointments to reflect the new note
      await loadAppointments();

      // Reset state
      setNoteContent('');
      setSelectedAppointmentId(null);

      alert('Nota guardada exitosamente en el historial clínico.');
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Error al guardar la nota. Por favor intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const clientName = `${client.first_name} ${client.last_name}`;
  const completedAppointments = sortedAppointments.filter(apt => apt.status === 'completed');
  const appointmentsWithoutNotes = completedAppointments.filter(
    apt => !apt.session_notes || apt.session_notes.length === 0
  );
  const selectedAppointment = selectedAppointmentId
    ? appointments.find((apt) => apt.id === selectedAppointmentId) ?? null
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando información del cliente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 pb-2">
        <button onClick={onBack} className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-slate-600 transition-all shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{clientName}</h1>
           <p className="text-sm text-slate-500 font-medium">
             {client.doc_type} {client.doc_id || 'Sin documento'}
           </p>
        </div>
        <div className="flex-1"></div>
        <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-700 pl-4 pr-5 py-2.5 rounded-xl hover:border-primary hover:text-primary transition-all font-semibold"
        >
            <Edit size={18} />
            <span className="hidden sm:inline">Editar</span>
        </button>
        <button
            onClick={() => onAddSession(client.id)}
            className="flex items-center gap-2 bg-primary text-white pl-4 pr-5 py-2.5 rounded-xl shadow-glow hover:shadow-lg hover:bg-primaryDark transition-all font-semibold"
        >
            <Plus size={20} />
            <span className="hidden sm:inline">Nueva Sesión</span>
        </button>
      </div>

      {/* Tabs - Segmented Control */}
      <div className="flex p-1.5 bg-slate-100 rounded-2xl w-full max-w-md self-center sm:self-start">
        {['info', 'history', 'notes'].map(tab => (
           <button 
             key={tab}
             onClick={() => setActiveTab(tab as any)}
             className={`flex-1 py-2.5 text-sm font-semibold rounded-xl capitalize transition-all duration-200 ${
               activeTab === tab 
                ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
             }`}
           >
             {tab === 'info' ? 'Información' : tab === 'history' ? 'Historial' : 'Notas'}
           </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-24 md:pb-10 no-scrollbar">
        {/* INFO TAB */}
        {activeTab === 'info' && (
          <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-soft space-y-6">
                 <h3 className="text-lg font-bold text-slate-900 border-b border-slate-50 pb-4">Datos Personales</h3>
                 <div className="space-y-4 text-slate-600">
                     <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Nombre Completo</span>
                        <span className="font-medium text-slate-900">{clientName}</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Documento</span>
                        <span className="font-medium text-slate-900">{client.doc_type} {client.doc_id || 'No registrado'}</span>
                     </div>
                     {client.date_of_birth && (
                       <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Fecha de Nacimiento</span>
                          <span className="font-medium text-slate-900">
                            {new Date(client.date_of_birth).toLocaleDateString('es-CO')}
                          </span>
                       </div>
                     )}
                     {client.gender && (
                       <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Género</span>
                          <span className="font-medium text-slate-900">{client.gender}</span>
                       </div>
                     )}
                 </div>
             </div>

             <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-soft space-y-6">
                 <h3 className="text-lg font-bold text-slate-900 border-b border-slate-50 pb-4">Contacto</h3>
                 <div className="space-y-4 text-slate-600">
                     <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Email</span>
                        <span className="font-medium text-slate-900">{client.email || 'No registrado'}</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Teléfono</span>
                        <span className="font-medium text-slate-900">{client.phone || 'No registrado'}</span>
                     </div>
                     {client.city && (
                       <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Ciudad</span>
                          <span className="font-medium text-slate-900">{client.city}</span>
                       </div>
                     )}
                     {client.address && (
                       <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Dirección</span>
                          <span className="font-medium text-slate-900">{client.address}</span>
                       </div>
                     )}
                     <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Fecha Registro</span>
                        <span className="font-medium text-slate-900">
                          {new Date(client.created_at).toLocaleDateString('es-CO')}
                        </span>
                     </div>
                 </div>
             </div>

             {client.emergency_contact_name && (
               <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-soft space-y-6">
                   <h3 className="text-lg font-bold text-slate-900 border-b border-slate-50 pb-4">Contacto de Emergencia</h3>
                   <div className="space-y-4 text-slate-600">
                       <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Nombre</span>
                          <span className="font-medium text-slate-900">{client.emergency_contact_name}</span>
                       </div>
                       {client.emergency_contact_phone && (
                         <div className="flex flex-col">
                            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Teléfono</span>
                            <span className="font-medium text-slate-900">{client.emergency_contact_phone}</span>
                         </div>
                       )}
                   </div>
               </div>
             )}

             <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-soft space-y-6">
                 <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <PackageIcon size={20} className="text-primary"/> Paquetes Activos
                    </h3>
                    <button className="text-xs text-primary font-bold bg-secondary px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors">+ Vender</button>
                 </div>

                 <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                     <p className="text-sm italic">Funcionalidad de paquetes próximamente.</p>
                 </div>
             </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {sortedAppointments.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      No hay citas registradas
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Aún no se han programado sesiones para este cliente
                    </p>
                    <button
                      onClick={() => onAddSession(client.id)}
                      className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primaryDark transition font-medium"
                    >
                      <Plus size={20} />
                      Programar Sesión
                    </button>
                  </div>
                ) : (
                  sortedAppointments.map(appointment => {
                    const startTime = new Date(appointment.start_time);
                    const endTime = new Date(appointment.end_time);
                    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60);

                    const statusMap: Record<string, { label: string; color: string }> = {
                      scheduled: { label: 'Programada', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                      completed: { label: 'Realizada', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                      canceled: { label: 'Cancelada', color: 'bg-red-50 text-red-600 border-red-100' },
                      no_show: { label: 'No Asistió', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                    };

                    const status = statusMap[appointment.status] || { label: appointment.status, color: 'bg-slate-50 text-slate-600 border-slate-100' };
                    const hasNote = appointment.session_notes && appointment.session_notes.length > 0;

                    return (
                      <div key={appointment.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft hover:shadow-card transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                          <div className="flex items-center gap-4">
                              <div className="bg-blue-50 text-blue-600 p-3.5 rounded-xl group-hover:scale-110 transition-transform">
                                  <Clock size={20} />
                              </div>
                              <div>
                                  <p className="font-bold text-slate-900 text-lg">
                                      {startTime.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                  </p>
                                  <p className="text-sm text-slate-500 font-medium">
                                      {startTime.toLocaleTimeString('es-CO', {hour: '2-digit', minute:'2-digit'})} • {duration} min
                                      {hasNote && (
                                        <span className="ml-2 inline-flex items-center gap-1 text-primary">
                                          <FileText size={14} /> Nota clínica
                                        </span>
                                      )}
                                  </p>
                              </div>
                          </div>
                          <div className="flex items-center gap-3 pl-14 md:pl-0">
                               <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${status.color}`}>
                                  {status.label}
                              </span>
                              {appointment.amount && (
                                <div className="text-right">
                                  <p className="text-sm font-bold text-slate-900">
                                      {COP_CURRENCY.format(appointment.amount)}
                                  </p>
                                </div>
                              )}
                          </div>
                      </div>
                    );
                  })
                )}
            </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {!selectedAppointmentId ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-soft space-y-6 text-slate-800">
                <h3 className="text-2xl font-bold text-slate-900">Registrar notas clínicas</h3>
                <p className="text-slate-600">
                  Selecciona una sesión completada sin notas para documentar el seguimiento del paciente.
                </p>
                {appointmentsWithoutNotes.length > 0 ? (
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    {appointmentsWithoutNotes.map((apt) => {
                      const startTime = new Date(apt.start_time);
                      return (
                        <button
                          key={apt.id}
                          onClick={() => {
                            setSelectedAppointmentId(apt.id);
                            setNoteContent('');
                          }}
                          className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex justify-between items-center transition-all"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">
                              Sesión del {startTime.toLocaleDateString('es-CO')}
                            </p>
                            <p className="text-sm text-slate-500">
                              {startTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <FileText className="text-primary" size={18} />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-slate-500">
                    <p>
                      {completedAppointments.length === 0
                        ? 'No hay sesiones completadas aún.'
                        : 'Todas las sesiones completadas ya tienen notas registradas.'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-soft">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Sesión seleccionada</p>
                      {selectedAppointment && (
                        <p className="font-semibold text-slate-900">
                          {new Date(selectedAppointment.start_time).toLocaleDateString('es-CO', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                          ,{' '}
                          {new Date(selectedAppointment.start_time).toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedAppointmentId(null);
                        setNoteContent('');
                      }}
                      className="text-sm font-medium text-primary hover:text-primaryDark transition"
                    >
                      Cambiar sesión
                    </button>
                  </div>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Escribe aquí tus hallazgos clínicos, observaciones y plan para la sesión."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[200px] resize-none"
                  />
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => {
                        setSelectedAppointmentId(null);
                        setNoteContent('');
                      }}
                      className="px-5 py-2.5 text-slate-500 text-sm font-semibold hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveNote}
                      disabled={isSaving || !noteContent.trim()}
                      className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primaryDark shadow-lg shadow-teal-900/10 hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save size={18} /> Guardar nota
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Client Modal */}
      {showEditModal && (
        <EditClientModal
          client={client}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            onClientUpdate?.();
          }}
        />
      )}
    </div>
  );
};
