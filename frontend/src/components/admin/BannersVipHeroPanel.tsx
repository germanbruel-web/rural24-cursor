/**
 * BannersVipHeroPanel - Gestión Simplificada de Banners VIP Hero
 * 
 * UX/UI:
 * - Vista en 2 columnas: Desktop | Mobile
 * - Design System Rural24 (#16a135 verde principal)
 * - Íconos Lucide React
 * - CRUD inline: Examinar, Modificar, Destacar, Pausar, Borrar
 * 
 * Lógica:
 * - Desktop: 1 destacado por defecto, resto por hover categoría
 * - Mobile: Carrusel con destacado primero
 * - Validación: Siempre debe haber 1 destacado por device
 */

import { useState, useEffect } from 'react';
import { 
  Upload, 
  Trash2, 
  Edit2, 
  Star, 
  Pause, 
  Play, 
  Monitor, 
  Smartphone,
  ExternalLink,
  AlertCircle,
  Check
} from 'lucide-react';
import { notify } from '../../utils/notifications';
import { uploadService } from '../../services/uploadService';
import * as bannersService from '../../services/bannersService';
import type { Banner } from '../../../types';

const CATEGORIES = [
  'Maquinarias',
  'Ganadería',
  'Insumos Agropecuarios',
  'Inmuebles Rurales',
  'Servicios Rurales',
];

// Helper: Parsear fecha DD/MM/YYYY o YYYY-MM-DD a ISO string
function parseDate(input: string): string | null {
  try {
    // Soportar DD/MM/YYYY
    if (input.includes('/')) {
      const parts = input.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T23:59:59Z`);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }
    // Soportar YYYY-MM-DD
    else if (input.includes('-')) {
      const date = new Date(`${input}T23:59:59Z`);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    return null;
  } catch {
    return null;
  }
}

export default function BannersVipHeroPanel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await bannersService.getBannersByType('homepage_vip');
      setBanners(data);
      
      // Validar que hay destacados por device
      const hasDesktopFeatured = data.some(b => b.device_target === 'desktop' && b.is_featured && b.is_active);
      const hasMobileFeatured = data.some(b => b.device_target === 'mobile' && b.is_featured && b.is_active);
      
      if (!hasDesktopFeatured && data.some(b => b.device_target === 'desktop')) {
        notify.warning('⚠️ No hay banner Desktop destacado. Marcá uno como predeterminado.');
      }
      if (!hasMobileFeatured && data.some(b => b.device_target === 'mobile')) {
        notify.warning('⚠️ No hay banner Mobile destacado. Marcá uno como predeterminado.');
      }
    } catch (error) {
      console.error('Error cargando banners:', error);
      notify.error('Error al cargar banners');
    } finally {
      setLoading(false);
    }
  };

  // Función para extraer nombre del cliente desde filename
  const extractClientFromFilename = (filename: string): string => {
    return filename
      .replace(/\.(jpg|jpeg|png|webp|gif)$/i, '') // Quitar extensión
      .replace(/[-_]/g, ' ') // Guiones y guiones bajos → espacios
      .replace(/\d+/g, '') // Quitar números
      .replace(/\s+/g, ' ') // Múltiples espacios → 1 solo
      .trim();
  };
  // CRUD: Agregar nuevo banner
  const handleAddBanner = async (deviceTarget: 'desktop' | 'mobile') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        // Seleccionar categoría
        const category = window.prompt(
          `Categoría del banner:\n\n${CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nIngresá el número:`,
          '1'
        );
        
        if (!category) return;
        const categoryIndex = parseInt(category) - 1;
        
        if (categoryIndex < 0 || categoryIndex >= CATEGORIES.length) {
          notify.error('Categoría inválida');
          return;
        }
        
        const selectedCategory = CATEGORIES[categoryIndex];
        
        // Auto-extraer cliente del filename
        const clientName = extractClientFromFilename(file.name);
        
        // Verificar si ya existe destacado
        const existingFeatured = banners.find(
          b => b.device_target === deviceTarget && b.is_featured && b.is_active
        );
        
        let isFeatured = false;
        
        if (existingFeatured) {
          // Ya existe destacado, preguntar si quiere reemplazarlo O crear uno normal
          const response = window.confirm(
            `⚠️ IMPORTANTE: Ya existe 1 banner destacado para ${deviceTarget.toUpperCase()}\n\n` +
            `Banner actual: "${existingFeatured.client_name || 'Sin nombre'}" (categoría: ${existingFeatured.category})\n\n` +
            `¿Querés hacer ESTE el nuevo banner destacado?\n\n` +
            `✅ [OK] = SÍ, reemplazar el destacado con este\n` +
            `❌ [Cancelar] = NO, crear banner NORMAL (solo aparece en hover de categoría)`
          );
          
          if (response) {
            // Quiere reemplazar el destacado
            console.log('🔄 Desactivando featured del banner anterior:', existingFeatured.id);
            const { error: updateError } = await bannersService.updateBanner(existingFeatured.id, {
              is_featured: false
            });
            
            if (updateError) {
              console.error('❌ Error desactivando featured anterior:', updateError);
              notify.error('Error al desactivar banner anterior');
              return;
            }
            
            isFeatured = true;
            notify.info('✅ Banner anterior ya no es destacado. Creando nuevo destacado...');
          } else {
            // No quiere reemplazar, crear banner normal
            isFeatured = false;
            notify.info('ℹ️ Creando banner normal (solo aparece en hover de categoría)');
          }
        } else {
          // No hay ninguno destacado, DEBE ser destacado
          isFeatured = true;
          notify.info('ℹ️ Este será el banner predeterminado (no hay otros destacados)');
        }
        
        // Upload imagen
        setUploadingId('new');
        const imageUrl = await uploadService.uploadImage(file, 'banners');
        
        // Auto-generar título interno (BD requiere NOT NULL)
        const title = `${clientName || 'Banner'} - ${selectedCategory} (${deviceTarget})`;
        
        // Pedir fecha de expiración (opcional)
        const expiresInput = window.prompt(
          '📅 Fecha de expiración (opcional):\n\n' +
          'Formato: YYYY-MM-DD o DD/MM/YYYY\n' +
          'Ejemplo: 2026-02-15\n\n' +
          'Dejá vacío para SIN expiración:'
        );
        
        let expiresAt: string | undefined;
        if (expiresInput && expiresInput.trim()) {
          // Parsear fecha (soportar DD/MM/YYYY o YYYY-MM-DD)
          const parsed = parseDate(expiresInput.trim());
          if (parsed) {
            expiresAt = parsed;
          } else {
            notify.error('❌ Formato de fecha inválido');
            return;
          }
        }
        
        // Crear banner
        console.log('📤 Intentando crear banner:', {
          type: 'homepage_vip',
          device_target: deviceTarget,
          title,
          client_name: clientName,
          category: selectedCategory,
          is_featured: isFeatured,
          is_active: true,
          expires_at: expiresAt
        });
        
        const { error } = await bannersService.createBanner({
          type: 'homepage_vip',
          device_target: deviceTarget,
          title, // Título auto-generado para tracking interno
          image_url: imageUrl,
          client_name: clientName,
          category: selectedCategory,
          is_featured: isFeatured,
          is_active: true,
          expires_at: expiresAt, // 📅 Fecha de expiración
        });
        
        if (error) {
          console.error('❌ Error detallado:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            fullError: error
          });
          
          // Mensajes específicos por tipo de error
          if (error.message?.includes('Failed to fetch')) {
            notify.error('❌ Sin conexión a Supabase. Verificá tu internet o que el proyecto esté activo.');
          } else if (error.code === '23505') {
            notify.error('⚠️ Ya existe un banner destacado para este dispositivo. Desactivá el otro primero.');
          } else if (error.code === '42501') {
            notify.error('🔒 Permisos insuficientes. Solo SuperAdmin puede crear banners.');
          } else {
            notify.error(`Error: ${error.message || 'Desconocido'}`);
          }
          throw error;
        }
        
        notify.success(`✅ Banner ${deviceTarget} creado`);
        loadBanners();
      } catch (error) {
        console.error('💥 Error completo:', error);
      } finally {
        setUploadingId(null);
      }
    };
    
    input.click();
  };
  // CRUD: Cambiar imagen (Examinar)
  const handleChangeImage = async (bannerId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploadingId(bannerId);
      try {
        // Auto-extraer cliente del filename
        const clientName = extractClientFromFilename(file.name);
        
        // Upload a Cloudinary
        const imageUrl = await uploadService.uploadImage(file, 'banners');
        
        // Actualizar banner
        const { error } = await bannersService.updateBanner(bannerId, {
          image_url: imageUrl,
          client_name: clientName,
        });

        if (error) throw error;
        
        notify.success('✅ Imagen actualizada correctamente');
        loadBanners();
      } catch (error) {
        console.error('Error actualizando imagen:', error);
        notify.error('Error al actualizar imagen');
      } finally {
        setUploadingId(null);
      }
    };

    input.click();
  };

  // CRUD: Modificar URL link
  const handleEditLink = async (banner: Banner) => {
    const newLink = prompt('URL de destino:', banner.link_url || '');
    if (newLink === null) return; // Cancelado

    try {
      const { error } = await bannersService.updateBanner(banner.id, {
        link_url: newLink,
      });

      if (error) throw error;
      
      notify.success('✅ URL actualizada');
      loadBanners();
    } catch (error) {
      console.error('Error actualizando URL:', error);
      notify.error('Error al actualizar URL');
    }
  };

  // CRUD: Marcar como destacado (⭐)
  const handleToggleFeatured = async (banner: Banner) => {
    // Si ya está destacado, verificar que no sea el único
    if (banner.is_featured) {
      const othersActive = banners.filter(
        b => b.device_target === banner.device_target && 
             b.is_active && 
             b.is_featured && 
             b.id !== banner.id
      );
      
      if (othersActive.length === 0) {
        notify.error('❌ No podés quitar el único banner destacado. Marcá otro primero.');
        return;
      }
    }

    try {
      const { error } = await bannersService.updateBanner(banner.id, {
        is_featured: !banner.is_featured,
      });

      if (error) {
        // Si Supabase rechaza por el constraint, mostrar mensaje claro
        if (error.message?.includes('duplicate key') || error.message?.includes('idx_featured')) {
          notify.error('❌ Ya hay otro banner destacado. Quitale la estrella primero.');
        } else {
          throw error;
        }
        return;
      }
      
      notify.success(banner.is_featured ? 'Banner desmarcado' : '⭐ Banner marcado como predeterminado');
      loadBanners();
    } catch (error) {
      console.error('Error toggling featured:', error);
      notify.error('Error al cambiar destacado');
    }
  };

  // CRUD: Pausar/Activar
  const handleToggleActive = async (banner: Banner) => {
    // Si está activo y es el único destacado, ofrecer crear nuevo
    if (banner.is_active && banner.is_featured) {
      const othersActive = banners.filter(
        b => b.device_target === banner.device_target && 
             b.is_active && 
             b.is_featured && 
             b.id !== banner.id
      );
      
      if (othersActive.length === 0) {
        const wantToReplace = confirm(
          `⚠️ Este es el único banner destacado activo de ${banner.device_target.toUpperCase()}.\n\n` +
          `Si lo pausás, no habrá banner predeterminado.\n\n` +
          `¿Querés CREAR uno nuevo primero?\n\n` +
          `[OK] = Agregar banner nuevo\n` +
          `[Cancelar] = No hacer nada`
        );
        
        if (wantToReplace) {
          handleAddBanner(banner.device_target as 'desktop' | 'mobile');
        }
        return;
      }
    }

    try {
      const { error } = await bannersService.toggleBannerStatus(banner.id, !banner.is_active);
      if (error) throw error;
      
      notify.success(banner.is_active ? 'Banner pausado' : 'Banner activado');
      loadBanners();
    } catch (error) {
      console.error('Error toggling status:', error);
      notify.error('Error al cambiar estado');
    }
  };

  // CRUD: Borrar
  const handleDelete = async (banner: Banner) => {
    // Si es el único destacado activo, ofrecer flujo alternativo
    if (banner.is_active && banner.is_featured) {
      const othersActive = banners.filter(
        b => b.device_target === banner.device_target && 
             b.is_active && 
             b.is_featured && 
             b.id !== banner.id
      );
      
      if (othersActive.length === 0) {
        const wantToReplace = confirm(
          `⚠️ Este es el único banner destacado de ${banner.device_target.toUpperCase()}.\n\n` +
          `Debe haber siempre 1 destacado activo.\n\n` +
          `¿Querés CREAR uno nuevo primero?\n\n` +
          `[OK] = Agregar banner nuevo\n` +
          `[Cancelar] = No hacer nada`
        );
        
        if (wantToReplace) {
          // Trigger agregar nuevo banner
          handleAddBanner(banner.device_target as 'desktop' | 'mobile');
        }
        return;
      }
    }
    
    // Confirmación normal
    if (!confirm(`¿Eliminar banner "${banner.client_name || 'Sin nombre'}"?`)) return;

    try {
      const { error } = await bannersService.deleteBanner(banner.id);
      if (error) throw error;
      
      notify.success('Banner eliminado');
      loadBanners();
    } catch (error) {
      console.error('Error eliminando banner:', error);
      notify.error('Error al eliminar banner');
    }
  };

  // Separar banners por device
  const desktopBanners = banners.filter(b => b.device_target === 'desktop');
  const mobileBanners = banners.filter(b => b.device_target === 'mobile');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a135]"></div>
        <p className="ml-4 text-gray-600">Cargando banners...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Banner VIP Hero</h2>
          <p className="text-sm text-gray-600 mt-1">
            Desktop: Destacado por defecto + hover categorías | Mobile: Carrusel automático
          </p>
        </div>
        
        {/* Botones Agregar */}
        <div className="flex gap-3">
          <button
            onClick={() => handleAddBanner('desktop')}
            className="flex items-center gap-2 px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#128a2b] transition"
          >
            <Monitor className="w-4 h-4" />
            Agregar Desktop
          </button>
          <button
            onClick={() => handleAddBanner('mobile')}
            className="flex items-center gap-2 px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#128a2b] transition"
          >
            <Smartphone className="w-4 h-4" />
            Agregar Mobile
          </button>
        </div>
      </div>

      {/* Vista en 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna Desktop */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-gray-200">
            <Monitor className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">DESKTOP</h3>
            <span className="text-sm text-gray-500">({desktopBanners.length})</span>
          </div>

          <div className="space-y-4">
            {desktopBanners.map((banner) => (
              <BannerCard
                key={banner.id}
                banner={banner}
                uploadingId={uploadingId}
                onChangeImage={handleChangeImage}
                onEditLink={handleEditLink}
                onToggleFeatured={handleToggleFeatured}
                onToggleActive={handleToggleActive}
                onDelete={handleDelete}
              />
            ))}
            
            {desktopBanners.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay banners Desktop
              </div>
            )}
          </div>
        </div>

        {/* Columna Mobile */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-gray-200">
            <Smartphone className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">MOBILE</h3>
            <span className="text-sm text-gray-500">({mobileBanners.length})</span>
          </div>

          <div className="space-y-4">
            {mobileBanners.map((banner) => (
              <BannerCard
                key={banner.id}
                banner={banner}
                uploadingId={uploadingId}
                onChangeImage={handleChangeImage}
                onEditLink={handleEditLink}
                onToggleFeatured={handleToggleFeatured}
                onToggleActive={handleToggleActive}
                onDelete={handleDelete}
              />
            ))}
            
            {mobileBanners.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay banners Mobile
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente BannerCard individual
interface BannerCardProps {
  banner: Banner;
  uploadingId: string | null;
  onChangeImage: (id: string) => void;
  onEditLink: (banner: Banner) => void;
  onToggleFeatured: (banner: Banner) => void;
  onToggleActive: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
}

function BannerCard({
  banner,
  uploadingId,
  onChangeImage,
  onEditLink,
  onToggleFeatured,
  onToggleActive,
  onDelete,
}: BannerCardProps) {
  const isUploading = uploadingId === banner.id;
  
  // Calcular estado de expiración
  const isExpired = banner.expires_at && new Date(banner.expires_at) < new Date();
  const expiresIn = banner.expires_at 
    ? Math.ceil((new Date(banner.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div 
      className={`
        bg-white rounded-lg border-2 p-4 transition-all
        ${isExpired
          ? 'border-red-300 opacity-70'
          : banner.is_featured 
            ? 'border-[#16a135] shadow-lg' 
            : banner.is_active 
              ? 'border-gray-200 hover:border-gray-300' 
              : 'border-gray-100 opacity-60'
        }
      `}
    >
      {/* Preview de imagen */}
      <div className="relative aspect-[6/1] bg-gray-100 rounded-lg overflow-hidden mb-3">
        <img 
          src={banner.image_url} 
          alt={banner.client_name || 'Banner'}
          className="w-full h-full object-cover"
        />
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
        {banner.is_featured && (
          <div className="absolute top-2 right-2 bg-[#16a135] text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            DESTACADO
          </div>
        )}
        {!banner.is_active && (
          <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
            <Pause className="w-3 h-3" />
            PAUSADO
          </div>
        )}
        {isExpired && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            EXPIRADO
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">
            {banner.client_name || 'Sin nombre'}
          </span>
          {banner.link_url && (
            <a 
              href={banner.link_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#16a135] hover:text-[#0e7d25]"
              title="Ver destino"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
        <div className="text-sm text-gray-600">
          Categoría: <span className="font-medium">{banner.category}</span>
        </div>
        {/* Estado de expiración */}
        {banner.expires_at && (
          <div className={`text-sm font-medium ${
            isExpired 
              ? 'text-red-600' 
              : expiresIn !== null && expiresIn <= 7 
                ? 'text-orange-600' 
                : 'text-gray-600'
          }`}>
            {isExpired 
              ? `⏰ Expiró el ${new Date(banner.expires_at).toLocaleDateString('es-AR')}`
              : `📅 Expira en ${expiresIn} día${expiresIn !== 1 ? 's' : ''}`
            }
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex items-center gap-2">
        {/* Examinar (cambiar imagen) */}
        <button
          onClick={() => onChangeImage(banner.id)}
          disabled={isUploading}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
          title="Cambiar imagen"
        >
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium">Examinar</span>
        </button>

        {/* Modificar URL */}
        <button
          onClick={() => onEditLink(banner)}
          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
          title="Modificar URL"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        {/* Destacar */}
        <button
          onClick={() => onToggleFeatured(banner)}
          className={`p-2 rounded-lg transition-colors ${
            banner.is_featured
              ? 'bg-[#16a135] hover:bg-[#0e7d25] text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
          title={banner.is_featured ? 'Quitar destacado' : 'Marcar como destacado'}
        >
          <Star className={`w-4 h-4 ${banner.is_featured ? 'fill-current' : ''}`} />
        </button>

        {/* Pausar/Activar */}
        <button
          onClick={() => onToggleActive(banner)}
          className={`p-2 rounded-lg transition-colors ${
            banner.is_active
              ? 'bg-orange-50 hover:bg-orange-100 text-orange-600'
              : 'bg-green-50 hover:bg-green-100 text-green-600'
          }`}
          title={banner.is_active ? 'Pausar' : 'Activar'}
        >
          {banner.is_active ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>

        {/* Borrar */}
        <button
          onClick={() => onDelete(banner)}
          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
          title="Eliminar banner"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
