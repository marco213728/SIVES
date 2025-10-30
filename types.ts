// FIX: Define interfaces for data models used in the application.
export interface User {
  id: string;
  organizationId: string;
  codigo: string;
  rol: 'Estudiante' | 'Admin';
  ha_votado: string[]; // Array of election IDs voted in
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
  id: string;
  organizationId: string;
  nombre: string;
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string; // YYYY-MM-DD
  estado: 'Activa' | 'Cerrada' | 'Próxima';
  resultados_publicos: boolean;
  descripcion?: string;
}

export interface Candidate {
  id: string;
  eleccion_id: string;
  nombres: string;
  apellido: string;
  partido_politico: string;
  cargo: string;
  foto_url: string;
  descripcion?: string;
}

export interface Vote {
  id: string;
  organizationId: string;
  eleccion_id: string;
  user_id: string;
  candidato_id: string | null; // null for blank vote
  write_in_name?: string; // for write-in votes
  fecha_voto: string; // ISO string
  receipt: string;
}

export interface Organization {
  id: string;
  slug: string; // for URL identification, e.g., 'alberto-allauca'
  name: string;
  logoUrl: string | null;
  primaryColor: string;
}