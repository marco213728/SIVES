// System Roles (RBAC)
export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'STUDENT';

// Organization / Institution Entity (Tenant)
export interface Organization {
  id: string; // Slug or unique identifier (e.g., 'uemol', 'galileo')
  slug?: string;
  name: string;
  code?: string; // Institutional code (e.g., 'UEM-01')
  logoUrl?: string | null;
  primaryColor: string; // Hex color for CSS variables
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
  location?: string;
  subscriptionType?: string;
  billingType?: string;
}

// User Model (Superadmin, School Admin, Student)
export interface User {
  id: string;
  studentCode?: string;
  username?: string;
  name?: string;
  role?: UserRole;
  organizationId?: string;
  email?: string;
  password?: string;
  hasVoted?: Record<string, boolean>;

  // Compatibility fields for existing forms
  codigo: string;
  rol?: 'Estudiante' | 'Admin' | 'Superadmin';
  ha_votado: string[];
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  curso?: string;
  paralelo?: string;
}

// Isolated Election Entity
export interface Election {
  id: string;
  organizationId: string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: 'ACTIVE' | 'UPCOMING' | 'CLOSED';
  allowBlank?: boolean;
  allowNull?: boolean;
  allowWriteIn?: boolean;

  // Compatibility fields
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'Activa' | 'Cerrada' | 'Próxima';
  resultados_publicos: boolean;
  descripcion?: string;
}

// Candidate Model
export interface Candidate {
  id: string;
  electionId?: string;
  organizationId?: string;
  name?: string;
  party?: string;
  platform?: string;
  photoUrl?: string;
  color?: string;

  // Compatibility fields
  eleccion_id: string;
  nombres: string;
  apellido: string;
  partido_politico: string;
  cargo: string;
  foto_url: string;
  descripcion?: string;
}

// Cryptographic Vote Receipt
export interface VoteReceipt {
  id: string;
  electionId: string;
  organizationId: string;
  timestamp: string;
  hash: string;
}

// Internal Audit Log Entry
export interface AuditLogEntry {
  id: string;
  organizationId: string;
  electionId: string;
  receiptCode: string;
  timestamp: string;
}

// Vote Record
export interface Vote {
  id: string;
  organizationId: string;
  eleccion_id: string;
  electionId?: string;
  user_id: string;
  voterId?: string;
  candidato_id: string | null;
  candidateId?: string | null;
  write_in_name?: string;
  fecha_voto: string;
  timestamp?: string;
  receipt: string;
}

export interface SystemMetrics {
  totalOrganizations: number;
  activeOrganizations: number;
  inactiveOrganizations: number;
  totalElections: number;
  activeElections: number;
  totalVoters: number;
  totalVotes: number;
}
