// System Roles (RBAC)
export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'STUDENT';

// SaaS Subscription Tier for Educational Institutions
export type SubscriptionTier = 'Free' | 'Basic' | 'Standard' | 'Premium' | 'Enterprise';
export type BillingFrequency = 'None' | 'Monthly' | 'Annual';

export interface PlanFeatureLimits {
  tier: SubscriptionTier;
  label: string;
  maxVoters: number | 'Ilimitado';
  maxElections: number | 'Ilimitado';
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, PlanFeatureLimits> = {
  Free: {
    tier: 'Free',
    label: 'Gratuito',
    maxVoters: 100,
    maxElections: 1,
    description: 'Padrón de hasta 100 electores, 1 elección activa.',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-300',
  },
  Basic: {
    tier: 'Basic',
    label: 'Básico',
    maxVoters: 500,
    maxElections: 3,
    description: 'Padrón de hasta 500 electores, 3 elecciones simultáneas.',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    badgeBorder: 'border-sky-300',
  },
  Standard: {
    tier: 'Standard',
    label: 'Estándar',
    maxVoters: 1500,
    maxElections: 5,
    description: 'Padrón hasta 1,500 estudiantes, actas digitales y recibos SHA-256.',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-300',
  },
  Premium: {
    tier: 'Premium',
    label: 'Premium',
    maxVoters: 5000,
    maxElections: 10,
    description: 'Hasta 5,000 electores, soporte prioritario, fotos en alta resolución.',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
  },
  Enterprise: {
    tier: 'Enterprise',
    label: 'Enterprise',
    maxVoters: 'Ilimitado',
    maxElections: 'Ilimitado',
    description: 'Padrón y elecciones ilimitadas, multi-sede, soporte institucional 24/7.',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-300',
  },
};

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
  subscriptionType?: SubscriptionTier | string;
  billingType?: BillingFrequency | string;
  maxVoters?: number;
  maxElections?: number;
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

// Vote Record (Ballot Secrecy: user_id and voterId are decoupled from ballot choices)
export interface Vote {
  id: string;
  organizationId: string;
  eleccion_id: string;
  electionId?: string;
  user_id?: string; // Optional for backward compatibility; omitted in new votes for secrecy
  voterId?: string; // Optional for backward compatibility; omitted in new votes for secrecy
  candidato_id: string | null;
  candidateId?: string | null;
  write_in_name?: string;
  fecha_voto: string;
  timestamp?: string;
  receipt: string; // Cryptographic verification hash
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

// Public Official Results
export interface ElectionResult {
  id: string; // electionId
  electionId: string;
  organizationId: string;
  publishedAt: string;
  totalVotes: number;
  sortedCandidates: Array<{
    id: string;
    nombres: string;
    apellido: string;
    party?: string;
    partido_politico?: string;
    cargo?: string;
    photoUrl?: string;
    foto_url?: string;
    voteCount: number;
    percentage: string;
  }>;
  blankVotes: number;
  blankPercentage: string;
  sortedWriteIns: Array<{
    name: string;
    voteCount: number;
    percentage: string;
  }>;
  isOfficial: boolean;
}

// Voter Participation Record (Decoupled from ballot choices)
export interface VoterParticipation {
  id: string;
  organizationId: string;
  studentId: string;
  electionId: string;
  timestamp: string;
}
