/**
 * ResellerPointsPanel.tsx
 * Panel de administración de puntos de revendedores
 * TODO: Implementar funcionalidad completa
 */

import { Construction } from 'lucide-react';

export function ResellerPointsPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#1b2f23]">Puntos de Revendedores</h2>
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
        <div className="text-gray-400 mb-4">
          <Construction className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          En construcción
        </h3>
        <p className="text-gray-500">
          Este panel estará disponible próximamente.
        </p>
      </div>
    </div>
  );
}

export default ResellerPointsPanel;