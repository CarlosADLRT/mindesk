export type ViewState = 'dashboard' | 'calendar' | 'patients' | 'finance' | 'settings';

export enum SessionStatus {
  SCHEDULED = 'Programada',
  COMPLETED = 'Realizada',
  CANCELLED = 'Cancelada',
  NO_SHOW = 'No Asistió'
}

export enum PaymentStatus {
  PENDING = 'Pendiente',
  PAID = 'Pagado',
  PACKAGE = 'Paquete'
}

export interface Package {
  id: string;
  name: string;
  totalSessions: number;
  remainingSessions: number;
  price: number;
  purchaseDate: string;
  active: boolean;
}

export interface Note {
  id: string;
  sessionId: string;
  content: string;
  createdAt: string;
  isAiGenerated?: boolean;
}

export interface Session {
  id: string;
  patientId: string;
  patientName: string;
  date: string; // ISO string
  durationMinutes: number;
  status: SessionStatus;
  paymentStatus: PaymentStatus;
  price: number;
  noteId?: string;
  packageId?: string; // If linked to a package
}

export interface Patient {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  cedula: string;
  activePackages: Package[];
  createdAt: string;
}

// User context for the psychologist
export interface UserProfile {
  name: string;
  specialty: string;
  email: string;
}
