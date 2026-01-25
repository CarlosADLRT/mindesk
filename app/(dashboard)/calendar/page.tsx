'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getWorkspaces } from '@/lib/api/workspaces'
import { AgendaView } from '@/components/calendar/AgendaView'
import { Loader } from 'lucide-react'
import type { Workspace } from '@/lib/supabase'

export default function CalendarPage() {
  const { user } = useAuth()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadWorkspace()
    }
  }, [user])

  const loadWorkspace = async () => {
    try {
      const workspaces = await getWorkspaces()
      if (workspaces.length > 0) {
        setWorkspace(workspaces[0])
      }
    } catch (error) {
      console.error('Error loading workspace:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-12 h-12 text-primary animate-spin" />
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se encontró un workspace activo</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 top-20 left-0 right-0">
      <AgendaView workspaceId={workspace.id} />
    </div>
  )
}
