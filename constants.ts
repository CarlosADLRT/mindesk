import { Patient, Session, SessionStatus, PaymentStatus } from './types';

export const MOCK_PATIENTS: Patient[] = [
  {
    id: '1',
    fullName: 'Camila Rodriguez',
    email: 'camila@email.com',
    phone: '+57 300 123 4567',
    cedula: '1.020.333.444',
    createdAt: '2023-11-15T09:00:00Z',
    activePackages: [
      {
        id: 'pkg_1',
        name: 'Pack 10 Sesiones',
        totalSessions: 10,
        remainingSessions: 4,
        price: 800000,
        purchaseDate: '2024-01-10',
        active: true
      }
    ]
  },
  {
    id: '2',
    fullName: 'Andrés Felipe Gómez',
    email: 'andres.gomez@email.com',
    phone: '+57 310 987 6543',
    cedula: '80.123.456',
    createdAt: '2024-02-01T14:00:00Z',
    activePackages: []
  },
  {
    id: '3',
    fullName: 'Valentina Torres',
    email: 'valen.torres@email.com',
    phone: '+57 315 555 1234',
    cedula: '1.098.765.432',
    createdAt: '2024-03-10T10:30:00Z',
    activePackages: []
  }
];

export const MOCK_SESSIONS: Session[] = [
  {
    id: 's_1',
    patientId: '1',
    patientName: 'Camila Rodriguez',
    date: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(), // Today 10am
    durationMinutes: 50,
    status: SessionStatus.SCHEDULED,
    paymentStatus: PaymentStatus.PACKAGE,
    price: 80000,
    packageId: 'pkg_1'
  },
  {
    id: 's_2',
    patientId: '2',
    patientName: 'Andrés Felipe Gómez',
    date: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(), // Today 2pm
    durationMinutes: 50,
    status: SessionStatus.SCHEDULED,
    paymentStatus: PaymentStatus.PENDING,
    price: 90000
  },
  {
    id: 's_3',
    patientId: '3',
    patientName: 'Valentina Torres',
    date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), // Yesterday
    durationMinutes: 60,
    status: SessionStatus.COMPLETED,
    paymentStatus: PaymentStatus.PAID,
    price: 90000,
    noteId: 'n_1'
  }
];

export const COP_CURRENCY = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0
});
