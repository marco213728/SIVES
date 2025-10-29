// FIX: Define interfaces for data models used in the application.
export interface User {
  id: number;
  organizationId: number;
  codigo: string;
  rol: 'Estudiante' | 'Admin';
  ha_votado: number[]; // Array of election IDs voted in
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  curso: string;
  paralelo: string;
  email?: string;
  password?: string;
}

export interface Election {
  id: number;
  organizationId: number;
  nombre: string;
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string; // YYYY-MM-DD
  estado: 'Activa' | 'Cerrada' | 'Próxima';
  resultados_publicos: boolean;
  descripcion?: string;
}

export interface Candidate {
  id: number;
  eleccion_id: number;
  nombres: string;
  apellido: string;
  partido_politico: string;
  cargo: string;
  foto_url: string;
  descripcion?: string;
}

export interface Vote {
  id: number;
  organizationId: number;
  eleccion_id: number;
  user_id: number;
  candidato_id: number | null; // null for blank vote
  write_in_name?: string; // for write-in votes
  fecha_voto: string; // ISO string
  receipt: string;
}

export interface Organization {
  id: number;
  slug: string; // for URL identification, e.g., 'alberto-allauca'
  name: string;
  logoUrl: string | null;
  primaryColor: string;
}