// ====================================================================
// TEST PAGE: DynamicForm con datos reales
// ====================================================================

import React, { useEffect, useState } from 'react';
import { DynamicForm } from '../components/DynamicForm';
import type { DynamicAttribute } from '../services/catalogService';
import { supabase } from '../services/supabaseClient';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { navigateTo } from '../hooks/useNavigate';

export function TestDynamicForm() {
  const [attributes, setAttributes] = useState<DynamicAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState('tractores');

  const subcategories = [
    { value: 'tractores', label: 'Tractores' },
    { value: 'cosechadoras', label: 'Cosechadoras' },
    { value: 'pulverizadoras', label: 'Pulverizadoras' },
    { value: 'sembradoras', label: 'Sembradoras' },
    { value: 'implementos', label: 'Implementos' },
  ];

  useEffect(() => {
    loadAttributes();
  }, [selectedSubcategory]);

  const loadAttributes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener subcategory_id desde la tabla subcategories
      const { data: subData, error: subError } = await supabase
        .from('subcategories')
        .select('id')
        .eq('name', selectedSubcategory)
        .single();

      if (subError) throw subError;
      if (!subData) throw new Error('Subcategoría no encontrada');

      // Obtener atributos dinámicos
      const { data: attrs, error: attrsError } = await supabase
        .from('dynamic_attributes')
        .select('*')
        .eq('subcategory_id', subData.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (attrsError) throw attrsError;

      // Convertir al formato esperado por DynamicForm
      const formattedAttrs: DynamicAttribute[] = (attrs || []).map(attr => ({
        id: attr.id,
        slug: attr.field_name, // DynamicField usa "slug"
        name: attr.field_label, // Nombre legible
        description: attr.help_text || undefined,
        inputType: attr.field_type, // ⚠️ CRÍTICO: inputType, no "type"
        dataType: attr.field_type, // Para validaciones futuras
        isRequired: attr.is_required,
        displayOrder: attr.sort_order,
        fieldGroup: attr.field_group || 'general',
        uiConfig: {
          label: attr.field_label,
          placeholder: attr.placeholder || undefined,
          prefix: attr.prefix || undefined,
          suffix: attr.suffix || undefined,
        },
        validations: {
          min: attr.min_value !== null ? attr.min_value : undefined,
          max: attr.max_value !== null ? attr.max_value : undefined,
        },
        isFilterable: false,
        isFeatured: false,
        options: Array.isArray(attr.field_options)
          ? attr.field_options.map((opt: string) => ({ value: opt, label: opt }))
          : [],
      }));

      setAttributes(formattedAttrs);
    } catch (err) {
      console.error('Error loading attributes:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: Record<string, any>) => {
    console.log('📦 Formulario enviado:', values);
    
    try {
      // Obtener subcategory_id de la base de datos
      const { data: subcategoryData, error: subcategoryError } = await supabase
        .from('subcategories')
        .select('id, category_id')
        .eq('name', selectedSubcategory)
        .single();

      if (subcategoryError || !subcategoryData) {
        throw new Error('No se pudo encontrar la subcategoría');
      }

      // Crear el aviso en la tabla ads
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .insert({
          category_id: subcategoryData.category_id,
          subcategory_id: subcategoryData.id,
          title: values['modelo'] ? `${values['marca'] || 'Maquinaria'} ${values['modelo']}` : values['marca'] || 'Sin título',
          description: `Año: ${values['año'] || 'N/A'} - Estado: ${values['condicion'] || 'N/A'}`,
          price: values['precio'] || null,
          currency: 'USD',
          attributes: values, // Guardar todos los atributos como JSONB
          status: 'active',
          featured: false,
          approval_status: 'pending',
          user_id: null, // TODO: agregar autenticación
        })
        .select()
        .single();

      if (adError) throw adError;

      console.log('✅ Aviso guardado:', adData);
      
      // Mostrar mensaje con link al detalle
      const detailUrl = `${window.location.origin}/#/ad/${adData.id}`;
      const confirmed = confirm(
        `✅ Aviso publicado con éxito!\n\n` +
        `ID: ${adData.id}\n\n` +
        `¿Quieres ver el detalle con atributos dinámicos?\n\n` +
        `(También puedes acceder desde Dashboard → Mis Avisos → Botón "Detalle")`
      );
      
      if (confirmed) {
        navigateTo(`/ad/${adData.id}`);
      }
      
    } catch (err) {
      console.error('❌ Error guardando aviso:', err);
      alert('❌ Error al publicar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 mb-6 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            🚜 Formulario Dinámico - Test
          </h1>
          <p className="text-gray-600 mb-4">
            Selecciona una subcategoría para ver sus campos dinámicos
          </p>

          {/* Selector de subcategoría */}
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none"
          >
            {subcategories.map((sub) => (
              <option key={sub.value} value={sub.value}>
                {sub.label}
              </option>
            ))}
          </select>

          {!loading && attributes.length > 0 && (
            <p className="text-sm text-gray-500 mt-3">
              ℹ️ Esta subcategoría tiene <strong>{attributes.length}</strong> campos configurados
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
            <p className="text-gray-600">Cargando campos dinámicos...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-900 mb-1">Error al cargar campos</h3>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={loadAttributes}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Formulario */}
        {!loading && !error && attributes.length > 0 && (
          <DynamicForm
            attributes={attributes}
            onSubmit={handleSubmit}
            submitLabel="Publicar Aviso de Prueba"
          />
        )}
      </div>
    </div>
  );
}
