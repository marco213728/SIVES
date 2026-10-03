import React, { useState, useEffect, useMemo } from 'react';
import { Organization, SystemMetrics, User, Election, Vote } from '../../types';
import * as apiService from '../../api/apiService';
import { OrganizationModal } from './OrganizationModal';
import { OrgAdminModal } from './OrgAdminModal';
import {
  OfficeBuildingIcon,
  PlusIcon,
  PencilIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  SearchIcon,
  SwitchHorizontalIcon,
  CheckCircleIcon,
  XCircleIcon,
  KeyIcon,
} from '../icons';

interface SuperAdminDashboardProps {
  currentUser: User;
  onSelectOrganizationAsAdmin: (org: Organization) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  currentUser,
  onSelectOrganizationAsAdmin,
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  
  // Modals state
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [orgToEdit, setOrgToEdit] = useState<Organization | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [selectedOrgForAdmins, setSelectedOrgForAdmins] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState<'organizations' | 'metrics'>('organizations');

  const loadData = async () => {
    setLoading(true);
    try {
      const [orgs, sysMetrics] = await Promise.all([
        apiService.getOrganizations(),
        apiService.getSystemMetrics(),
      ]);
      setOrganizations(orgs);
      setMetrics(sysMetrics);
    } catch (e) {
      console.error('Error loading superadmin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveOrganization = async (orgData: Partial<Organization>) => {
    if (orgToEdit) {
      await apiService.updateOrganization(orgToEdit.id, orgData);
    } else {
      await apiService.createOrganization(orgData as any);
    }
    await loadData();
  };

  const handleToggleStatus = async (org: Organization) => {
    const nextStatus = org.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await apiService.toggleOrganizationStatus(org.id, nextStatus);
    await loadData();
  };

  const filteredOrganizations = useMemo(() => {
    return organizations.filter(org => {
      const matchesSearch =
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (org.code && org.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        org.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus =
        statusFilter === 'ALL' || org.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [organizations, searchQuery, statusFilter]);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-700/50">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-indigo-400/30">
            <ShieldCheckIcon className="w-4 h-4" />
            Control Maestro Multi-Tenant
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Panel de Superadministrador</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Gestión global de instituciones educativas, provisión de administradores escolares y supervisión del ecosistema electoral seguro.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setOrgToEdit(null);
              setIsOrgModalOpen(true);
            }}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all hover:scale-102"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Registrar Institución</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Colegios Totales</span>
              <OfficeBuildingIcon className="w-5 h-5 text-slate-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-slate-900">{metrics.totalOrganizations}</div>
            <div className="mt-1 flex items-center gap-2 text-xs font-medium">
              <span className="text-emerald-600 font-bold">{metrics.activeOrganizations} activas</span>
              <span className="text-slate-300">•</span>
              <span className="text-amber-600 font-bold">{metrics.inactiveOrganizations} suspendidas</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Elecciones</span>
              <ChartBarIcon className="w-5 h-5 text-slate-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-slate-900">{metrics.totalElections}</div>
            <div className="mt-1 text-xs text-indigo-600 font-semibold">
              {metrics.activeElections} comicios en curso
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Padrón Global</span>
              <UserGroupIcon className="w-5 h-5 text-slate-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-slate-900">{metrics.totalVoters}</div>
            <div className="mt-1 text-xs text-slate-500">Estudiantes registrados</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Votos Emitidos</span>
              <ShieldCheckIcon className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="mt-3 text-3xl font-black text-emerald-600">{metrics.totalVotes}</div>
            <div className="mt-1 text-xs text-slate-500">Recibos verificados</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Participación</span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">Promedio</span>
            </div>
            <div className="mt-3 text-3xl font-black text-indigo-900">
              {metrics.totalVoters > 0
                ? `${Math.round((metrics.totalVotes / metrics.totalVoters) * 100)}%`
                : '0%'}
            </div>
            <div className="mt-1 text-xs text-slate-500">Tasa de sufragio global</div>
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation & Controls */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('organizations')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'organizations'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Instituciones Educativas ({organizations.length})
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'metrics'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Arquitectura y Métricas
            </button>
          </div>

          {activeTab === 'organizations' && (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar institución o código..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-white border border-slate-300 rounded-xl p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg ${statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-2.5 py-1 rounded-lg ${statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}
                >
                  Activas
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('INACTIVE')}
                  className={`px-2.5 py-1 rounded-lg ${statusFilter === 'INACTIVE' ? 'bg-amber-600 text-white' : 'text-slate-600'}`}
                >
                  Suspendidas
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Organizations Table / Cards */}
        {activeTab === 'organizations' && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-16 text-slate-400">Cargando instituciones...</div>
            ) : filteredOrganizations.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                No se encontraron instituciones con el filtro aplicado.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-5">Institución / Tenant</th>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Identidad Visual</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-5 text-right">Acciones de Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredOrganizations.map((org) => {
                    const isActive = org.status === 'ACTIVE';
                    return (
                      <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Name & Logo */}
                        <td className="py-4 px-5">
                          <div className="flex items-center space-x-3.5">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center border border-slate-200 shadow-xs overflow-hidden flex-shrink-0 bg-white"
                              style={{ borderTop: `4px solid ${org.primaryColor}` }}
                            >
                              {org.logoUrl ? (
                                <img
                                  src={org.logoUrl}
                                  alt={org.name}
                                  className="w-full h-full object-contain p-1"
                                />
                              ) : (
                                <OfficeBuildingIcon className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                                {org.name}
                              </div>
                              <div className="text-xs text-slate-500 font-mono mt-0.5">
                                Slug: <span className="font-semibold text-slate-700">{org.id}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="py-4 px-4 font-mono font-bold text-slate-700">
                          <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-xs">
                            {org.code || 'N/A'}
                          </span>
                        </td>

                        {/* Branding */}
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <span
                              className="w-5 h-5 rounded-full border border-slate-300 shadow-xs"
                              style={{ backgroundColor: org.primaryColor }}
                              title={`Color primario: ${org.primaryColor}`}
                            />
                            <span className="text-xs font-mono text-slate-600 uppercase">
                              {org.primaryColor}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {isActive ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircleIcon className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              ACTIVA
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <XCircleIcon className="w-3.5 h-3.5 mr-1 text-amber-600" />
                              SUSPENDIDA
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right space-x-2 whitespace-nowrap">
                          {/* Toggle Status */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(org)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              isActive
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                            title={isActive ? 'Suspender acceso a la escuela' : 'Activar acceso a la escuela'}
                          >
                            {isActive ? 'Suspender' : 'Activar'}
                          </button>

                          {/* Manage Admins */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrgForAdmins(org);
                              setIsAdminModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 inline-flex items-center gap-1 transition-colors"
                            title="Gestionar administradores escolares"
                          >
                            <KeyIcon className="w-3.5 h-3.5" />
                            <span>Admins</span>
                          </button>

                          {/* Edit School */}
                          <button
                            type="button"
                            onClick={() => {
                              setOrgToEdit(org);
                              setIsOrgModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors inline-flex items-center"
                            title="Editar institución"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>

                          {/* Impersonate / Enter as School Admin */}
                          <button
                            type="button"
                            onClick={() => onSelectOrganizationAsAdmin(org)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-indigo-600 text-white shadow-xs inline-flex items-center gap-1.5 transition-colors"
                            title="Ingresar a la consola escolar de este colegio"
                          >
                            <SwitchHorizontalIcon className="w-3.5 h-3.5" />
                            <span>Entrar como Admin</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: System Architecture Info */}
        {activeTab === 'metrics' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50">
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <ShieldCheckIcon className="w-5 h-5 text-indigo-600" />
                  Aislamiento Estricto por Tenant
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cada institución opera con su <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">organizationId</code> único. Ni los estudiantes ni los administradores de un colegio pueden ver comicios, padrones o votos de otros planteles.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50">
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <KeyIcon className="w-5 h-5 text-emerald-600" />
                  Jerarquía de Roles (RBAC)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-800">SUPERADMIN</span> gestiona colegios y credenciales maestras. <span className="font-bold text-slate-800">ORG_ADMIN</span> controla el proceso democrático escolar. <span className="font-bold text-slate-800">STUDENT</span> emite voto secreto.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50">
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-amber-600" />
                  Branding Dinámico (White-Label)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Las variables CSS globales se inyectan en tiempo real según el colegio activo, permitiendo que cada escuela proyecte su escudo institucional y paleta corporativa.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-indigo-100 bg-indigo-50/50 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-indigo-950 text-sm">Base de Datos y Persistencia Multi-Tenant</h4>
                <p className="text-xs text-indigo-800 mt-0.5">
                  La semilla de datos incluye UEMOL, Galileo Galilei y Colegio San José, con usuarios de prueba para todos los roles.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (confirm('¿Restaurar datos predeterminados de la plataforma?')) {
                    await apiService.resetAllData();
                    await loadData();
                  }
                }}
                className="px-3 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-900 rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                Reiniciar Datos de Prueba
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <OrganizationModal
        isOpen={isOrgModalOpen}
        onClose={() => setIsOrgModalOpen(false)}
        onSave={handleSaveOrganization}
        organizationToEdit={orgToEdit}
      />

      <OrgAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        organization={selectedOrgForAdmins}
      />
    </div>
  );
};

export default SuperAdminDashboard;
