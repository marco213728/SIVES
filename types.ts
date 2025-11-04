// FIX: Define interfaces for data models used in the application.
export interface User {
  id: string;
  organizationId: string | null; // Null for SuperAdmins
  codigo: string;
  rol: 'Estudiante' | 'Admin' | 'SuperAdmin';
  ha_votado: string[]; // Array of election IDs voted in
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  curso: string;
  paralelo: string;
  email?: string;
  password?: string;
  email_verificado?: boolean;
}

export interface Election {
  id: string;
  organizationId: string;
  nombre: string;
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string; // YYYY-MM-DD
  estado: 'Activa' | 'Cerrada' | 'Próxima';
  resultados_publicos: boolean;
  descripcion?: string;
  permitir_voto_blanco?: boolean;
  permitir_voto_nulo?: boolean;
  permitir_voto_otro?: boolean;
}

export interface Candidate {
  id: string;
  eleccion_id: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  partido_politico: string;
  cargo: string;
  foto_url: string;
  descripcion?: string;
  listColor?: string | null;
  listLogoUrl?: string | null;
}

export interface Vote {
  id: string;
  organizationId: string;
  eleccion_id: string;
  user_id: string;
  candidato_id: string | null; // null for blank vote
  write_in_name?: string; // for write-in votes
  is_null_vote?: boolean; // for null votes
  fecha_voto: string; // ISO string
  receipt: string;
}

export interface Organization {
  id: string;
  slug: string; // for URL identification, e.g., 'alberto-allauca'
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  location?: string;
  subscriptionType?: 'Free' | 'Standard' | 'Premium';
  billingType?: 'Monthly' | 'Yearly' | 'None';
}