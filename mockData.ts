// FIX: Provide mock data for the application.
import { User, Election, Candidate, Vote, Organization } from './types';

export const organizations: Organization[] = [
  { 
    id: '1', 
    slug: 'uemol',
    name: 'UEMOL',
    logoUrl: null,
    primaryColor: '#0bacfa',
  },
  {
    id: '2',
    slug: 'galileo-galilei',
    name: 'Unidad Educativa Galileo Galilei',
    logoUrl: 'https://i.imgur.com/gQC52iH.png',
    primaryColor: '#8B0000',
  }
];

export const users: User[] = [
  // Org 1
  { id: '1', organizationId: '1', codigo: '2025001', rol: 'Estudiante', ha_votado: [], primer_nombre: 'Ana', segundo_nombre: 'María', primer_apellido: 'García', segundo_apellido: 'López', curso: 'Décimo EGB', paralelo: 'A' },
  { id: '2', organizationId: '1', codigo: '2025002', rol: 'Estudiante', ha_votado: ['1'], primer_nombre: 'Luis', segundo_nombre: 'Alberto', primer_apellido: 'Pérez', segundo_apellido: 'Rodríguez', curso: 'Décimo EGB', paralelo: 'B' },
  { id: '3', organizationId: '1', codigo: '2025003', rol: 'Estudiante', ha_votado: [], primer_nombre: 'María', segundo_nombre: 'Fernanda', primer_apellido: 'Rodríguez', segundo_apellido: 'Sánchez', curso: 'Noveno EGB', paralelo: 'A' },
  { id: '4', organizationId: '1', codigo: 'admin', rol: 'Admin', ha_votado: [], primer_nombre: 'Marco', segundo_nombre: '', primer_apellido: 'Lema', segundo_apellido: '', curso: 'N/A', paralelo: 'N/A', email: 'marco213728@gmail.com', password: 'password123', email_verificado: false },
  { id: '5', organizationId: '1', codigo: '2025004', rol: 'Estudiante', ha_votado: [], primer_nombre: 'Carlos', segundo_nombre: 'Eduardo', primer_apellido: 'Sánchez', segundo_apellido: 'Martínez', curso: 'Onceavo Grado', paralelo: 'C' },
  { id: '6', organizationId: '1', codigo: '2025005', rol: 'Estudiante', ha_votado: [], primer_nombre: 'Sofia', segundo_nombre: 'Valentina', primer_apellido: 'López', segundo_apellido: 'Hernández', curso: 'Onceavo Grado', paralelo: 'C' },
  // Org 2
  { id: '7', organizationId: '2', codigo: 'GG2401', rol: 'Estudiante', ha_votado: [], primer_nombre: 'David', segundo_nombre: '', primer_apellido: 'Benavidez', segundo_apellido: 'Cortes', curso: '1ero BGU', paralelo: 'A' },
  { id: '8', organizationId: '2', codigo: 'GG2402', rol: 'Estudiante', ha_votado: [], primer_nombre: 'Elena', segundo_nombre: 'Isabel', primer_apellido: 'Vargas', segundo_apellido: 'Mora', curso: '2do BGU', paralelo: 'B' },
  { id: '9', organizationId: '2', codigo: 'admin_gg', rol: 'Admin', ha_votado: [], primer_nombre: 'Directora', segundo_nombre: '', primer_apellido: 'Susana', segundo_apellido: 'Guerra', curso: 'N/A', paralelo: 'N/A', email: 'directora.gg@example.com', password: 'password123', email_verificado: false },
];

const getDate = (offsetDays: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split('T')[0]; // Format to YYYY-MM-DD
};


export const elections: Election[] = [
  // Org 1
  { id: '1', organizationId: '1', nombre: 'Elección de Presidente Estudiantil', fecha_inicio: getDate(-2), fecha_fin: getDate(2), estado: 'Activa', resultados_publicos: false, descripcion: 'Elección anual para el presidente del consejo estudiantil.', permitir_voto_blanco: true, permitir_voto_nulo: true, permitir_voto_otro: true },
  { id: '2', organizationId: '1', nombre: 'Elección de Representante de Grado', fecha_inicio: getDate(-2), fecha_fin: getDate(2), estado: 'Activa', resultados_publicos: false, permitir_voto_blanco: true, permitir_voto_nulo: false, permitir_voto_otro: false },
  { id: '3', organizationId: '1', nombre: 'Elección de Tesorero', fecha_inicio: getDate(10), fecha_fin: getDate(15), estado: 'Próxima', resultados_publicos: true, permitir_voto_blanco: false, permitir_voto_nulo: false, permitir_voto_otro: false },
  { id: '4', organizationId: '1', nombre: 'Referéndum de Mascotas', fecha_inicio: getDate(-10), fecha_fin: getDate(-5), estado: 'Cerrada', resultados_publicos: true, descripcion: 'Votación para decidir si se permite una mascota en la escuela.', permitir_voto_blanco: false, permitir_voto_nulo: false, permitir_voto_otro: false },
  // Org 2
  { id: '5', organizationId: '2', nombre: 'Consejo Estudiantil Galileo 2024', fecha_inicio: getDate(-1), fecha_fin: getDate(5), estado: 'Activa', resultados_publicos: true, descripcion: 'Elección del nuevo consejo para el periodo 2024-2025', permitir_voto_blanco: true, permitir_voto_nulo: true, permitir_voto_otro: false },
  { id: '6', organizationId: '2', nombre: 'Comité de Deportes', fecha_inicio: getDate(-20), fecha_fin: getDate(-15), estado: 'Cerrada', resultados_publicos: true, permitir_voto_blanco: true, permitir_voto_nulo: true, permitir_voto_otro: true },
];

export const candidates: Candidate[] = [
  // Election 1 (Org 1)
  { id: '1', eleccion_id: '1', primer_nombre: 'Juan', segundo_nombre: '', primer_apellido: 'Gomez', segundo_apellido: '', partido_politico: 'Partido Innovación', cargo: 'Presidente', foto_url: 'https://picsum.photos/seed/juan/200', descripcion: 'Prometo mejorar las instalaciones deportivas y organizar más eventos culturales.', listColor: '#ff6347', listLogoUrl: 'https://i.imgur.com/sS8AMmf.png' },
  { id: '2', eleccion_id: '1', primer_nombre: 'Laura', segundo_nombre: '', primer_apellido: 'Martinez', segundo_apellido: '', partido_politico: 'Frente Unido Estudiantil', cargo: 'Presidente', foto_url: 'https://picsum.photos/seed/laura/200', descripcion: 'Mi enfoque es la excelencia académica y el apoyo entre compañeros.', listColor: '#4682b4', listLogoUrl: 'https://i.imgur.com/4YQd9wP.png' },
  // Election 2 (Org 1)
  { id: '3', eleccion_id: '2', primer_nombre: 'Pedro', segundo_nombre: '', primer_apellido: 'Diaz', segundo_apellido: '', partido_politico: 'Alianza Pro-Grado', cargo: 'Representante', foto_url: 'https://picsum.photos/seed/pedro/200' },
  { id: '4', eleccion_id: '2', primer_nombre: 'Isabel', segundo_nombre: '', primer_apellido: 'Castillo', segundo_apellido: '', partido_politico: 'Movimiento Estudiantil', cargo: 'Representante', foto_url: 'https://picsum.photos/seed/isabel/200' },
  // Election 3 (Org 1)
  { id: '5', eleccion_id: '3', primer_nombre: 'Ricardo', segundo_nombre: '', primer_apellido: 'Morales', segundo_apellido: '', partido_politico: 'Finanzas Claras', cargo: 'Tesorero', foto_url: 'https://picsum.photos/seed/ricardo/200' },
  // Election 4 (Org 1)
  { id: '6', eleccion_id: '4', primer_nombre: 'Opción Sí', segundo_nombre: '', primer_apellido: '', segundo_apellido: '', partido_politico: 'Pro-Mascotas', cargo: 'Opción', foto_url: 'https://picsum.photos/seed/si/200' },
  { id: '7', eleccion_id: '4', primer_nombre: 'Opción No', segundo_nombre: '', primer_apellido: '', segundo_apellido: '', partido_politico: 'Anti-Mascotas', cargo: 'Opción', foto_url: 'https://picsum.photos/seed/no/200' },
  // Election 5 (Org 2)
  { id: '8', eleccion_id: '5', primer_nombre: 'Lista A', segundo_nombre: '', primer_apellido: 'Progreso', segundo_apellido: '', partido_politico: 'Progreso Estudiantil', cargo: 'Consejo', foto_url: 'https://picsum.photos/seed/listaA/200', listColor: '#32cd32' },
  { id: '9', eleccion_id: '5', primer_nombre: 'Lista B', segundo_nombre: '', primer_apellido: 'Unidad', segundo_apellido: '', partido_politico: 'Fuerza Unida', cargo: 'Consejo', foto_url: 'https://picsum.photos/seed/listaB/200', listColor: '#ffd700' },
];

export const votes: Vote[] = [
    // Org 1
    { id: '1', organizationId: '1', eleccion_id: '1', user_id: '2', candidato_id: '1', fecha_voto: new Date().toISOString(), receipt: 'rcpt-1-2-xyz' },
    { id: '2', organizationId: '1', eleccion_id: '4', user_id: '1', candidato_id: '6', fecha_voto: '2024-09-02T10:00:00Z', receipt: 'rcpt-4-1-abc' },
    { id: '3', organizationId: '1', eleccion_id: '4', user_id: '2', candidato_id: '6', fecha_voto: '2024-09-02T11:00:00Z', receipt: 'rcpt-4-2-def' },
    { id: '4', organizationId: '1', eleccion_id: '4', user_id: '3', candidato_id: '7', fecha_voto: '2024-09-03T09:00:00Z', receipt: 'rcpt-4-3-ghi' },
    // Org 2
    { id: '5', organizationId: '2', eleccion_id: '6', user_id: '7', candidato_id: null, write_in_name: 'Equipo de Fútbol', fecha_voto: '2024-08-15T10:00:00Z', receipt: 'rcpt-6-7-jkl' },
];