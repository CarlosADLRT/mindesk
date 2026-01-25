'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader } from 'lucide-react'
import { getClient } from '@/lib/api/clients'
import { getWorkspaces } from '@/lib/api/workspaces'
import { PatientDetail } from '@/components/PatientDetail'
import { CreateAppointmentModal } from '@/components/CreateAppointmentModal'
import type { Client, Workspace } from '@/lib/supabase'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [sessionsRefreshKey, setSessionsRefreshKey] = useState(0)

  useEffect(() => {
    loadClientData()
  }, [clientId])

  const loadClientData = async () => {
    try {
      setLoading(true)
      const [fetchedClient, workspaces] = await Promise.all([
        getClient(clientId),
        getWorkspaces(),
      ])
      setClient(fetchedClient)
      setWorkspace(workspaces[0] || null)
    } catch (error) {
      console.error('Error loading client:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSession = () => {
    setShowAppointmentModal(true)
  }

  const handleAppointmentSuccess = () => {
    setShowAppointmentModal(false)
    loadClientData()
    setSessionsRefreshKey((prev) => prev + 1)
  }

  const handleClientUpdate = () => {
    loadClientData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando información del cliente...</p>
        </div>
      </div>
    )
  }

  if (!client || !workspace) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cliente no encontrado</h2>
        <button
          onClick={() => router.push('/clients')}
          className="text-primary hover:text-primaryDark font-medium"
        >
          Volver a clientes
        </button>
      </div>
    )
  }

  return (
    <>
      <PatientDetail
        client={client}
        workspaceId={workspace.id}
        onBack={() => router.push('/clients')}
        onAddSession={handleAddSession}
        refreshKey={sessionsRefreshKey}
        onClientUpdate={handleClientUpdate}
      />

      {/* Create Appointment Modal */}
      {showAppointmentModal && (
        <CreateAppointmentModal
          workspaceId={workspace.id}
          client={client}
          onClose={() => setShowAppointmentModal(false)}
          onSuccess={handleAppointmentSuccess}
        />
      )}
    </>
  )
}
