import React, { useState, useEffect } from 'react';
import { Organization, SubscriptionTier, BillingFrequency, SUBSCRIPTION_PLANS } from '../../types';
import { CameraIcon, ColorSwatchIcon, OfficeBuildingIcon, ShieldCheckIcon } from '../icons';

interface OrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (org: Partial<Organization>) => Promise<void>;
  organizationToEdit?: Organization | null;
}

const PRESET_COLORS = [
  '#005A9C', // Navy Blue (UEMOL)
  '#8B0000', // Deep Burgundy (Galileo)
  '#1e7b4f', // Emerald Green
  '#4338CA', // Indigo
  '#B45309', // Amber / Gold
  '#7C3AED', // Violet
  '#0E7490', // Cyan
  '#BE123C', // Crimson
];

export const OrganizationModal: React.FC<OrganizationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  organizationToEdit,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [slug, setSlug] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#005A9C');
  const [logoUrl, setLogoUrl] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionTier>('Standard');
  const [billingType, setBillingType] = useState<BillingFrequency>('Annual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organizationToEdit) {
      setName(organizationToEdit.name);
      setCode(organizationToEdit.code || '');
      setSlug(organizationToEdit.id);
      setPrimaryColor(organizationToEdit.primaryColor || '#005A9C');
      setLogoUrl(organizationToEdit.logoUrl || '');
      setStatus(organizationToEdit.status || 'ACTIVE');
      setSubscriptionType((organizationToEdit.subscriptionType as SubscriptionTier) || 'Standard');
      setBillingType((organizationToEdit.billingType as BillingFrequency) || 'Annual');
    } else {
      setName('');
      setCode('');
      setSlug('');
      setPrimaryColor('#005A9C');
      setLogoUrl('');
      setStatus('ACTIVE');
      setSubscriptionType('Standard');
      setBillingType('Annual');
    }
    setError(null);
  }, [organizationToEdit, isOpen]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!organizationToEdit) {
      const generatedSlug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
      
      const words = val.trim().split(/\s+/);
      const generatedCode = words.length > 1
        ? words.map(w => w[0]?.toUpperCase()).join('').slice(0, 4) + '-01'
        : val.slice(0, 3).toUpperCase() + '-01';
      setCode(generatedCode);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo supera los 5MB permitidos.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 256;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round(height * (MAX_SIZE / width));
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round(width * (MAX_SIZE / height));
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setLogoUrl(compressed);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la institución es obligatorio.');
      return;
    }
    if (!code.trim()) {
      setError('El código institucional es obligatorio.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        id: slug || organizationToEdit?.id,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        primaryColor,
        logoUrl: logoUrl.trim() || null,
        status,
        subscriptionType,
        billingType,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar la institución.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <OfficeBuildingIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {organizationToEdit ? 'Editar Institución Educativa' : 'Nueva Institución Educativa'}
              </h3>
              <p className="text-xs text-slate-500">Configuración global del colegio y tenant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nombre Oficial de la Institución
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej. Unidad Educativa Manuela Cañizares"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-800 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Código Institucional
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej. UEM-01"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Identificador / Slug (Tenant)
              </label>
              <input
                type="text"
                disabled={!!organizationToEdit}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="uemol"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Color institucional */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Color Primario Institucional (Brand Color)
            </label>
            <div className="flex items-center space-x-3 mt-1">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-28 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase"
              />
              <div className="flex items-center space-x-1.5 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPrimaryColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${primaryColor.toLowerCase() === c.toLowerCase() ? 'scale-115 border-slate-900 shadow' : 'border-white hover:scale-105'}`}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Logo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Logotipo o Escudo Escolar
            </label>
            <div className="flex items-center space-x-4 mt-1">
              <div
                className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ borderColor: primaryColor }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain p-1" />
                ) : (
                  <CameraIcon className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="URL del logo (https://...)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors">
                    <span>Subir archivo...</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Quitar logo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Plan y Suscripción SaaS */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Plan de Suscripción Institucional
              </label>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Límites y Capacidades
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1">Nivel de Plan</label>
                <select
                  value={subscriptionType}
                  onChange={(e) => setSubscriptionType(e.target.value as SubscriptionTier)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  <option value="Free">Gratuito (Free)</option>
                  <option value="Basic">Básico (Basic)</option>
                  <option value="Standard">Estándar (Standard)</option>
                  <option value="Premium">Premium</option>
                  <option value="Enterprise">Empresarial (Enterprise)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1">Facturación</label>
                <select
                  value={billingType}
                  onChange={(e) => setBillingType(e.target.value as BillingFrequency)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  <option value="None">Sin cargo / Cortesía</option>
                  <option value="Monthly">Mensual</option>
                  <option value="Annual">Anual (Recomendado)</option>
                </select>
              </div>
            </div>

            {/* Plan Info Card */}
            {SUBSCRIPTION_PLANS[subscriptionType] && (
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">
                    Plan {SUBSCRIPTION_PLANS[subscriptionType].label}:
                  </span>{' '}
                  {SUBSCRIPTION_PLANS[subscriptionType].description} (Capacidad:{' '}
                  <strong>{SUBSCRIPTION_PLANS[subscriptionType].maxVoters} electores</strong>,{' '}
                  <strong>{SUBSCRIPTION_PLANS[subscriptionType].maxElections} elecciones simultáneas</strong>).
                </div>
              </div>
            )}
          </div>

          {/* Estado de la institución */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Estado de Acceso
            </label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${status === 'ACTIVE' ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={status === 'ACTIVE'}
                  onChange={() => setStatus('ACTIVE')}
                  className="sr-only"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />
                <div>
                  <div className="text-sm">Activa</div>
                  <div className="text-xs text-slate-500 font-normal">Acceso habilitado para estudiantes y docentes</div>
                </div>
              </label>

              <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${status === 'INACTIVE' ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input
                  type="radio"
                  name="status"
                  value="INACTIVE"
                  checked={status === 'INACTIVE'}
                  onChange={() => setStatus('INACTIVE')}
                  className="sr-only"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2" />
                <div>
                  <div className="text-sm">Suspendida / Inactiva</div>
                  <div className="text-xs text-slate-500 font-normal">Votaciones pausadas temporalmente</div>
                </div>
              </label>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-md transition-all disabled:bg-slate-400"
            >
              {isSubmitting ? 'Guardando...' : organizationToEdit ? 'Actualizar Institución' : 'Crear Institución'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
