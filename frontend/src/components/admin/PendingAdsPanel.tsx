import { useState, useEffect } from 'react';
import { getPendingAds, approveAd, rejectAd } from '../../services/adsService';
import { notify } from '../../utils/notifications';
import { Clock, Check, X, User, Calendar, MapPin, DollarSign, Eye, AlertCircle } from 'lucide-react';
import type { Ad } from '../../../types';

export default function PendingAdsPanel() {
  const [pendingAds, setPendingAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  useEffect(() => {
    loadPendingAds();
  }, []);

  const loadPendingAds = async () => {
    try {
      setLoading(true);
      const ads = await getPendingAds();
      setPendingAds(ads);
    } catch (error: any) {
      console.error('Error loading pending ads:', error);
      notify.error('Error al cargar avisos pendientes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (adId: string) => {
    try {
      setActionLoading(adId);
      const { error } = await approveAd(adId);
      if (error) throw new Error(error.message);
      
      notify.success('Aviso aprobado exitosamente');
      setPendingAds(prev => prev.filter(ad => ad.id !== adId));
    } catch (error: any) {
      console.error('Error approving ad:', error);
      notify.error(error.message || 'Error al aprobar el aviso');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (adId: string) => {
    if (!rejectionReason.trim()) {
      notify.error('Debes proporcionar un motivo del rechazo');
      return;
    }

    try {
      setActionLoading(adId);
      const { error } = await rejectAd(adId, rejectionReason);
      if (error) throw new Error(error.message);
      
      notify.success('Aviso rechazado');
      setPendingAds(prev => prev.filter(ad => ad.id !== adId));
      setShowRejectModal(null);
      setRejectionReason('');
    } catch (error: any) {
      console.error('Error rejecting ad:', error);
      notify.error(error.message || 'Error al rechazar el aviso');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (adId: string) => {
    setShowRejectModal(adId);
    setRejectionReason('');
  };

  const closeRejectModal = () => {
    setShowRejectModal(null);
    setRejectionReason('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a135]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-gray-900">Avisos FREE Pendientes de Aprobación</h2>
        </div>
        <p className="text-gray-600">
          Revisa y modera todos los avisos de <strong>usuarios gratuitos (FREE y FREE-VERIFICADO)</strong> antes de publicarlos. 
          Solo los usuarios <strong>Premium</strong> publican directamente sin moderación.
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-orange-500" />
          <span className="text-gray-700">
            {pendingAds.length} {pendingAds.length === 1 ? 'aviso FREE pendiente' : 'avisos FREE pendientes'}
          </span>
        </div>
      </div>

      {/* Ads List */}
      {pendingAds.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            ¡Todo al día!
          </h3>
          <p className="text-gray-600">
            No hay avisos pendientes de aprobación en este momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {pendingAds.map((ad) => (
            <div key={ad.id} className="bg-white rounded-lg shadow-sm border border-orange-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header with Status Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{ad.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>
                        {ad.seller?.full_name || 'Usuario Anónimo'}
                        {ad.seller?.email && ` (${ad.seller.email})`}
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full whitespace-nowrap">
                    ⏳ Pendiente
                  </span>
                </div>

                {/* Images */}
                {ad.images && ad.images.length > 0 && (
                  <div className="mb-4">
                    <div className="grid grid-cols-4 gap-2">
                      {ad.images.slice(0, 4).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${ad.title} - ${idx + 1}`}
                          className="w-full h-24 object-cover rounded border border-gray-200"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <p className="text-gray-700 mb-4">{ad.description}</p>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  {ad.price && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-600">Precio</p>
                        <p className="font-bold text-green-600">
                          {ad.currency} {ad.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {ad.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-600">Ubicación</p>
                        <p className="font-medium text-gray-900">{ad.location}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Creado</p>
                      <p className="font-medium text-gray-900">
                        {new Date(ad.created_at).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Categoría</p>
                      <p className="font-medium text-gray-900">{ad.category}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                {(ad.contact_phone || ad.contact_email) && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-1">Información de Contacto:</p>
                    {ad.contact_phone && (
                      <p className="text-sm text-blue-800">📞 {ad.contact_phone}</p>
                    )}
                    {ad.contact_email && (
                      <p className="text-sm text-blue-800">✉️ {ad.contact_email}</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleApprove(ad.id)}
                    disabled={actionLoading === ad.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === ad.id ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                    Aprobar y Publicar
                  </button>
                  
                  <button
                    onClick={() => openRejectModal(ad.id)}
                    disabled={actionLoading === ad.id}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-5 h-5" />
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">Rechazar Aviso</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Proporciona un motivo claro del rechazo. El usuario recibirá esta información.
            </p>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ej: El contenido no cumple con nuestras políticas de uso..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
            />
            
            <div className="flex gap-3">
              <button
                onClick={closeRejectModal}
                disabled={actionLoading === showRejectModal}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={actionLoading === showRejectModal || !rejectionReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === showRejectModal ? (
                  <span className="animate-spin inline-block">⏳</span>
                ) : (
                  'Confirmar Rechazo'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
