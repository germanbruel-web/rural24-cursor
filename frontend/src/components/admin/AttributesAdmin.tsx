// ====================================================================
// ATTRIBUTES ADMIN - Gestión de atributos dinámicos
// UX Profesional + Validaciones + ChipInput + Drag & Drop
// ====================================================================

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, GripVertical, AlertCircle, CheckCircle2, Download, Upload, Eye, LayoutGrid, Folder } from 'lucide-react';
import { getCategories, getSubcategories, getCategoryTypes } from '../../services/v2/formsService';
import {
  getAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  reorderAttributes,
  FIELD_TYPES,
  FIELD_GROUPS, // Fallback si no hay grupos dinámicos
  type DynamicAttributeDB,
  type CreateAttributeInput,
} from '../../services/v2/attributesService';
import { getGroups, type AttributeGroup } from '../../services/v2/groupsService';
import { GroupsAdmin } from './GroupsAdmin';
import { createTemplateFromSubcategory } from '../../services/v2/templatesService';
import { ImportTemplateModal } from './ImportTemplateModal';
import { FormPreview } from './FormPreview';
import type { Category, Subcategory } from '../../types/v2';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ====================================================================
// SORTABLE ATTRIBUTE ITEM - Componente individual draggable
// ====================================================================
interface SortableAttributeProps {
  attr: DynamicAttributeDB;
  onEdit: (attr: DynamicAttributeDB) => void;
  onDelete: (id: string) => void;
}

function SortableAttribute({ attr, onEdit, onDelete }: SortableAttributeProps) {
  const {
    attributes: dndAttributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: attr.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 hover:bg-gray-50 transition-all flex items-center justify-between ${
        isDragging ? 'shadow-2xl z-50 bg-white rounded-lg' : ''
      }`}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Handle draggable */}
        <button
          {...dndAttributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-brand-100 rounded-lg transition-all"
          title="Arrastrar para reordenar"
        >
          <GripVertical className="w-5 h-5 text-gray-400 hover:text-brand-500" />
        </button>
        
        {/* Contenido del atributo */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-gray-900">{attr.field_label}</h4>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
              {attr.field_type}
            </span>
            {attr.is_required && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                Obligatorio
              </span>
            )}
            {!attr.is_active && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                Inactivo
              </span>
            )}
            {attr.is_filterable && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                Filtro
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {attr.field_group} • {attr.field_name}
          </p>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(attr)}
          className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-all"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(attr.id)}
          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function AttributesAdmin() {
  // ====================================================================
  // STATE
  // ====================================================================
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  // const [types, setTypes] = useState<any[]>([]); // SOFT HIDE: Campo tipo deshabilitado
  const [attributes, setAttributes] = useState<DynamicAttributeDB[]>([]);
  const [dynamicGroups, setDynamicGroups] = useState<AttributeGroup[]>([]);
  const [showGroupsPanel, setShowGroupsPanel] = useState(false);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  // const [selectedTypeId, setSelectedTypeId] = useState<string>(''); // SOFT HIDE: Campo tipo deshabilitado
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Template modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Grupos disponibles (dinámicos o fallback)
  const availableGroups = dynamicGroups.length > 0
    ? dynamicGroups.map(g => ({ value: g.display_name, label: g.display_name }))
    : FIELD_GROUPS;

  // Form state
  const [formData, setFormData] = useState<Partial<CreateAttributeInput>>({
    field_name: '',
    field_label: '',
    field_type: 'text',
    field_group: 'Información General',
    field_options: [],
    is_required: false,
    is_active: true,
    sort_order: 1,
    is_filterable: false,
    filter_type: 'select',
    filter_order: 99,
  });

  // ====================================================================
  // DRAG & DROP CONFIGURATION
  // ====================================================================
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = attributes.findIndex((a) => a.id === active.id);
    const newIndex = attributes.findIndex((a) => a.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic UI update
    const reordered = arrayMove(attributes, oldIndex, newIndex);
    setAttributes(reordered);

    try {
      await reorderAttributes(reordered.map((a) => a.id));
      showMessage('success', '✓ Orden actualizado correctamente');
    } catch (error) {
      // Revertir en caso de error
      setAttributes(attributes);
      showMessage('error', 'Error al guardar el orden');
    }
  }

  // ====================================================================
  // EFFECTS
  // ====================================================================
  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadSubcategories(selectedCategoryId);
    } else {
      setSubcategories([]);
      setSelectedSubcategoryId('');
      // setTypes([]); // SOFT HIDE
      // setSelectedTypeId(''); // SOFT HIDE
    }
  }, [selectedCategoryId]);

  // SOFT HIDE: Comentado useEffect de types
  // useEffect(() => {
  //   if (selectedSubcategoryId) {
  //     loadTypes(selectedSubcategoryId);
  //   } else {
  //     setTypes([]);
  //     setSelectedTypeId('');
  //     setAttributes([]);
  //   }
  // }, [selectedSubcategoryId]);

  useEffect(() => {
    // Cargar atributos y grupos cuando se selecciona subcategoría
    if (selectedSubcategoryId) {
      loadAttributes();
      loadDynamicGroups();
    } else {
      setAttributes([]);
      setDynamicGroups([]);
    }
  }, [selectedSubcategoryId]); // SOFT HIDE: Removido selectedTypeId

  // ====================================================================
  // DATA LOADING
  // ====================================================================
  async function loadDynamicGroups() {
    try {
      const groups = await getGroups(selectedSubcategoryId);
      setDynamicGroups(groups);
      // Si hay grupos, poner el primero como default
      if (groups.length > 0) {
        setFormData(prev => ({ ...prev, field_group: groups[0].display_name }));
      }
    } catch (error) {
      console.warn('No se pudieron cargar grupos dinámicos, usando fallback');
      setDynamicGroups([]);
    }
  }

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      showMessage('error', 'Error cargando categorías');
    }
  }

  async function loadSubcategories(categoryId: string) {
    try {
      const data = await getSubcategories(categoryId);
      setSubcategories(data);
    } catch (error) {
      showMessage('error', 'Error cargando subcategorías');
    }
  }

  // SOFT HIDE: Función comentada para reversión futura
  // async function loadTypes(subcategoryId: string) {
  //   try {
  //     const data = await getCategoryTypes(subcategoryId);
  //     setTypes(data);
  //   } catch (error) {
  //     showMessage('error', 'Error cargando tipos');
  //   }
  // }

  async function loadAttributes() {
    if (!selectedSubcategoryId) return;
    
    try {
      setLoading(true);
      const filters: any = {
        subcategoryId: selectedSubcategoryId,
      };
      
      // SOFT HIDE: Filtro por tipo removido (type_id siempre null)
      // if (selectedTypeId) {
      //   filters.typeId = selectedTypeId;
      // }
      
      const data = await getAttributes(filters);
      setAttributes(data);
    } catch (error) {
      showMessage('error', 'Error cargando atributos');
    } finally {
      setLoading(false);
    }
  }

  // ====================================================================
  // CRUD OPERATIONS
  // ====================================================================
  async function handleCreate() {
    if (!selectedCategoryId || !selectedSubcategoryId) {
      showMessage('error', 'Selecciona categoría y subcategoría primero');
      return;
    }

    if (!formData.field_name || !formData.field_label) {
      showMessage('error', 'Completa nombre interno y etiqueta');
      return;
    }

    try {
      setLoading(true);

      const input: CreateAttributeInput = {
        category_id: selectedCategoryId,
        subcategory_id: selectedSubcategoryId,
        type_id: null, // SOFT HIDE: Siempre null (campo deshabilitado)
        field_name: formData.field_name!,
        field_label: formData.field_label!,
        field_type: formData.field_type || 'text',
        field_group: formData.field_group || 'Información General',
        field_options: formData.field_options || null,
        is_required: formData.is_required || false,
        min_value: formData.min_value || null,
        max_value: formData.max_value || null,
        placeholder: formData.placeholder || null,
        help_text: formData.help_text || null,
        prefix: formData.prefix || null,
        suffix: formData.suffix || null,
        sort_order: attributes.length + 1,
        is_active: true,
        is_filterable: formData.is_filterable || false,
        filter_type: formData.filter_type || 'select',
        filter_order: formData.filter_order || 99,
      };

      await createAttribute(input);
      await loadAttributes();
      
      resetForm();
      setIsCreating(false);
      showMessage('success', 'Atributo creado exitosamente');
    } catch (error: any) {
      showMessage('error', error.message || 'Error creando atributo');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    if (!editingId) return;

    try {
      setLoading(true);
      
      await updateAttribute(editingId, {
        field_name: formData.field_name,
        field_label: formData.field_label,
        field_type: formData.field_type,
        field_group: formData.field_group,
        field_options: formData.field_options,
        is_required: formData.is_required,
        min_value: formData.min_value,
        max_value: formData.max_value,
        placeholder: formData.placeholder,
        help_text: formData.help_text,
        prefix: formData.prefix,
        suffix: formData.suffix,
        is_active: formData.is_active,
        is_filterable: formData.is_filterable,
        filter_type: formData.filter_type,
        filter_order: formData.filter_order,
      });
      
      await loadAttributes();
      
      setEditingId(null);
      resetForm();
      showMessage('success', 'Atributo actualizado');
    } catch (error: any) {
      showMessage('error', error.message || 'Error actualizando atributo');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este atributo? Los avisos existentes no se verán afectados.')) return;

    try {
      setLoading(true);
      await deleteAttribute(id);
      await loadAttributes();
      showMessage('success', 'Atributo eliminado');
    } catch (error) {
      showMessage('error', 'Error eliminando atributo');
    } finally {
      setLoading(false);
    }
  }

  // ====================================================================
  // FORM HELPERS
  // ====================================================================
  function startEdit(attr: DynamicAttributeDB) {
    setEditingId(attr.id);
    setFormData({
      field_name: attr.field_name,
      field_label: attr.field_label,
      field_type: attr.field_type,
      field_group: attr.field_group,
      field_options: attr.field_options || [],
      is_required: attr.is_required,
      min_value: attr.min_value,
      max_value: attr.max_value,
      placeholder: attr.placeholder,
      help_text: attr.help_text,
      prefix: attr.prefix,
      suffix: attr.suffix,
      is_active: attr.is_active,
      is_filterable: attr.is_filterable || false,
      filter_type: attr.filter_type || 'select',
      filter_order: attr.filter_order || 99,
    });
    setIsCreating(false);
  }

  function resetForm() {
    setFormData({
      field_name: '',
      field_label: '',
      field_type: 'text',
      field_group: 'Información General',
      field_options: [],
      is_required: false,
      is_active: true,
      sort_order: 1,
      is_filterable: false,
      filter_type: 'select',
      filter_order: 99,
    });
    setIsCreating(false);
    setEditingId(null);
  }

  // ====================================================================
  // TEMPLATE MANAGEMENT
  // ====================================================================
  
  async function handleSaveAsTemplate() {
    if (!selectedCategoryId || !selectedSubcategoryId) {
      showMessage('error', 'Seleccioná categoría y subcategoría primero');
      return;
    }

    if (attributes.length === 0) {
      showMessage('error', 'No hay atributos para guardar como template');
      return;
    }

    setShowSaveTemplateModal(true);
  }

  async function confirmSaveTemplate() {
    if (!templateName.trim()) {
      showMessage('error', 'Ingresá un nombre para el template');
      return;
    }

    try {
      setSavingTemplate(true);
      
      await createTemplateFromSubcategory({
        name: templateName,
        description: templateDescription,
        categoryId: selectedCategoryId,
        subcategoryId: selectedSubcategoryId,
      });

      showMessage('success', `✓ Template "${templateName}" guardado exitosamente`);
      setShowSaveTemplateModal(false);
      setTemplateName('');
      setTemplateDescription('');
    } catch (error: any) {
      showMessage('error', 'Error guardando template: ' + error.message);
    } finally {
      setSavingTemplate(false);
    }
  }

  function handleImportSuccess(count: number) {
    showMessage('success', `✓ ${count} atributo${count !== 1 ? 's' : ''} importado${count !== 1 ? 's' : ''} exitosamente`);
    loadAttributes();
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  // ====================================================================
  // CHIP INPUT (field_options)
  // ====================================================================
  const [optionInput, setOptionInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkMode, setShowBulkMode] = useState(false);

  function addOption() {
    if (!optionInput.trim()) return;
    
    const currentOptions = formData.field_options || [];
    if (currentOptions.includes(optionInput.trim())) {
      showMessage('error', 'Esta opción ya existe');
      return;
    }
    
    setFormData({
      ...formData,
      field_options: [...currentOptions, optionInput.trim()],
    });
    setOptionInput('');
  }

  function removeOption(option: string) {
    setFormData({
      ...formData,
      field_options: (formData.field_options || []).filter(o => o !== option),
    });
  }

  // ====================================================================
  // BULK INPUT (carga masiva)
  // ====================================================================
  function parseBulkOptions(input: string): string[] {
    return input
      .split(/[,\n]+/)                              // Separar por comas O saltos de línea
      .map(s => s.trim())                           // Limpiar espacios
      .filter(s => s.length > 0)                    // Filtrar vacíos
      .filter((v, i, arr) => arr.indexOf(v) === i); // Deduplicar
  }

  function processBulkOptions() {
    if (!bulkInput.trim()) {
      showMessage('error', 'Escribe al menos una opción');
      return;
    }

    const newOptions = parseBulkOptions(bulkInput);
    const currentOptions = formData.field_options || [];
    
    // Detectar duplicados con opciones existentes
    const duplicates = newOptions.filter(opt => currentOptions.includes(opt));
    
    if (duplicates.length > 0) {
      showMessage('error', `Opciones duplicadas: ${duplicates.join(', ')}`);
      return;
    }

    // Agregar todas las nuevas opciones
    setFormData({
      ...formData,
      field_options: [...currentOptions, ...newOptions],
    });

    showMessage('success', `${newOptions.length} opción${newOptions.length !== 1 ? 'es' : ''} agregada${newOptions.length !== 1 ? 's' : ''}`);
    setBulkInput('');
    setShowBulkMode(false); // Colapsar después de agregar
  }

  // Contador en tiempo real de opciones detectadas
  const detectedOptions = bulkInput.trim() ? parseBulkOptions(bulkInput) : [];
  const detectedCount = detectedOptions.length;

  // ====================================================================
  // RENDER
  // ====================================================================
  const showForm = isCreating || editingId;
  const needsOptions = formData.field_type === 'select' || formData.field_type === 'multiselect';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atributos Dinámicos</h1>
          <p className="text-gray-600 mt-1">
            Define los campos del formulario de cada subcategoría o tipo específico
          </p>
        </div>
        
        {attributes.length > 0 && (
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              showPreview
                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showPreview ? (
              <>
                <LayoutGrid className="w-5 h-5" />
                Ocultar Preview
              </>
            ) : (
              <>
                <Eye className="w-5 h-5" />
                Mostrar Preview
              </>
            )}
          </button>
        )}
      </div>

      {/* Grid Layout: Editor | Preview */}
      <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* COLUMNA IZQUIERDA: EDITOR */}
        <div className="space-y-6">

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl ${
          message.type === 'success' ? 'bg-brand-50 border-2 border-brand-200' : 'bg-red-50 border-2 border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-brand-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span className={message.type === 'success' ? 'text-brand-700' : 'text-red-800'}>
            {message.text}
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-white rounded-xl border-2 border-gray-200">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            1. Categoría
          </label>
          <select
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setSelectedSubcategoryId('');
              // setSelectedTypeId(''); // SOFT HIDE
            }}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition-all"
          >
            <option value="">Seleccionar categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.display_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            2. Subcategoría
          </label>
          <select
            value={selectedSubcategoryId}
            onChange={(e) => {
              setSelectedSubcategoryId(e.target.value);
              // setSelectedTypeId(''); // SOFT HIDE
            }}
            disabled={!selectedCategoryId}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Seleccionar subcategoría</option>
            {subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.display_name}
              </option>
            ))}
          </select>
        </div>

        {/* SOFT HIDE: Campo Tipo comentado para reversión futura */}
        {/* <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            3. Tipo <span className="text-gray-500 text-xs">(opcional)</span>
          </label>
          <select
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            disabled={!selectedSubcategoryId}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Todos los tipos</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.display_name}
              </option>
            ))}
          </select>
          {types.length === 0 && selectedSubcategoryId && (
            <p className="text-xs text-gray-500 mt-1">
              Esta subcategoría no tiene tipos específicos
            </p>
          )}
        </div> */}
      </div>

      {/* SOFT HIDE: Info Badge comentado (usaba selectedTypeId y types) */}
      {/* {selectedSubcategoryId && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <div className="flex-1">
            <p className="text-sm text-blue-900">
              {selectedTypeId ? (
                <>
                  <strong>Filtrando por tipo:</strong> Los atributos que crees se aplicarán específicamente a{' '}
                  <strong>{types.find(t => t.id === selectedTypeId)?.display_name}</strong>
                </>
              ) : (
                <>
                  <strong>Sin filtro de tipo:</strong> Los atributos se aplicarán a toda la subcategoría{' '}
                  <strong>{subcategories.find(s => s.id === selectedSubcategoryId)?.display_name}</strong>
                </>
              )}
            </p>
          </div>
        </div>
      )} */}

      {/* Create Button */}
      {selectedSubcategoryId && !showForm && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-all font-semibold shadow-lg shadow-brand-200"
            >
              <Plus className="w-5 h-5" />
              Crear Atributo
            </button>
            
            <button
              onClick={() => setShowGroupsPanel(!showGroupsPanel)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-semibold shadow-lg ${
                showGroupsPanel 
                  ? 'bg-amber-500 text-white shadow-amber-200 hover:bg-amber-600' 
                  : 'bg-amber-100 text-amber-700 shadow-amber-100 hover:bg-amber-200'
              }`}
            >
              <Folder className="w-5 h-5" />
              {showGroupsPanel ? 'Cerrar Grupos' : 'Gestionar Grupos'}
            </button>
            
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold shadow-lg shadow-blue-200"
            >
              <Download className="w-5 h-5" />
              Importar Template
            </button>
            
            {attributes.length > 0 && (
              <button
                onClick={handleSaveAsTemplate}
                className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all font-semibold shadow-lg shadow-purple-200"
              >
                <Upload className="w-5 h-5" />
                Guardar como Template
              </button>
            )}
          </div>
          
          {/* Panel de Grupos */}
          {showGroupsPanel && (
            <GroupsAdmin
              subcategoryId={selectedSubcategoryId}
              subcategoryName={subcategories.find(s => s.id === selectedSubcategoryId)?.display_name}
              attributeCounts={attributes.reduce((acc, attr) => {
                const group = dynamicGroups.find(g => g.display_name === attr.field_group);
                if (group) {
                  acc[group.id] = (acc[group.id] || 0) + 1;
                }
                return acc;
              }, {} as Record<string, number>)}
              onGroupsChange={(groups) => {
                setDynamicGroups(groups);
              }}
            />
          )}
          
          {/* Nota explicativa sobre filtros */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Para mostrar un atributo en los filtros de búsqueda, 
              haz clic en el botón <Edit2 className="w-3 h-3 inline" /> de cualquier atributo 
              y activa la opción <span className="font-semibold">Mostrar en filtros</span>.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="p-6 bg-white rounded-xl border-2 border-gray-200 space-y-6">
          <div className="flex items-center justify-between border-b-2 border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {editingId ? 'Editar Atributo' : 'Nuevo Atributo'}
            </h2>
            <button
              onClick={resetForm}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre interno */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Nombre interno (field_name) *
              </label>
              <input
                type="text"
                value={formData.field_name}
                onChange={(e) => setFormData({ ...formData, field_name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="marca, modelo, potencia_hp..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">Se guardará en minúsculas con guiones bajos</p>
            </div>

            {/* Etiqueta */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Etiqueta visible *
              </label>
              <input
                type="text"
                value={formData.field_label}
                onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
                placeholder="Marca, Modelo, Potencia (HP)..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition-all"
              />
            </div>

            {/* Tipo de campo */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Tipo de campo *
              </label>
              <select
                value={formData.field_type}
                onChange={(e) => setFormData({ ...formData, field_type: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition-all"
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Grupo */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Grupo *
              </label>
              <select
                value={formData.field_group}
                onChange={(e) => setFormData({ ...formData, field_group: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition-all"
              >
                {availableGroups.map((group) => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Min/Max (solo para number) */}
            {formData.field_type === 'number' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Valor mínimo
                  </label>
                  <input
                    type="number"
                    value={formData.min_value || ''}
                    onChange={(e) => setFormData({ ...formData, min_value: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Valor máximo
                  </label>
                  <input
                    type="number"
                    value={formData.max_value || ''}
                    onChange={(e) => setFormData({ ...formData, max_value: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Prefijo
                  </label>
                  <input
                    type="text"
                    value={formData.prefix || ''}
                    onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                    placeholder="$, USD, etc."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Sufijo
                  </label>
                  <input
                    type="text"
                    value={formData.suffix || ''}
                    onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                    placeholder="HP, kg, hs, etc."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition-all"
                  />
                </div>
              </>
            )}

            {/* Placeholder */}
            <div className={formData.field_type === 'number' ? '' : 'md:col-span-2'}>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Placeholder
              </label>
              <input
                type="text"
                value={formData.placeholder || ''}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                placeholder="Ej: Ingrese la marca..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition-all"
              />
            </div>

            {/* Help text */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Texto de ayuda
              </label>
              <input
                type="text"
                value={formData.help_text || ''}
                onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                placeholder="Texto explicativo que aparecerá debajo del campo"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition-all"
              />
            </div>
          </div>

          {/* Opciones (ChipInput + Bulk Mode) */}
          {needsOptions && (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Opciones disponibles *
              </label>
              
              {/* Chips existentes */}
              {(formData.field_options || []).length > 0 && (
                <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                  {(formData.field_options || []).map((option) => (
                    <div
                      key={option}
                      className="flex items-center gap-2 px-3 py-2 bg-brand-100 text-brand-700 rounded-lg text-sm font-medium"
                    >
                      <span>{option}</span>
                      <button
                        onClick={() => removeOption(option)}
                        className="hover:bg-brand-200 rounded p-0.5 transition-all"
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Toggle: Bulk Mode / Individual Mode */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowBulkMode(!showBulkMode)}
                  type="button"
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    showBulkMode 
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {showBulkMode ? 'Modo Masivo (activo)' : 'Activar carga masiva'}
                </button>
                <span className="text-sm text-gray-500">
                  {showBulkMode ? 'Pega múltiples opciones separadas por comas o saltos de línea' : 'o agrega opciones una por una'}
                </span>
              </div>

              {/* BULK MODE: Textarea masivo */}
              {showBulkMode && (
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-900">Carga Masiva de Opciones</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Separa las opciones con <strong>comas</strong>, <strong>saltos de línea</strong> o ambos
                      </p>
                    </div>
                    {detectedCount > 0 && (
                      <span className="px-3 py-1 bg-blue-200 text-blue-900 rounded-lg text-sm font-bold">
                        {detectedCount} opción{detectedCount !== 1 ? 'es' : ''} detectada{detectedCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <textarea
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder={`Ejemplo:\nNuevo, Usado, Reacondicionado\n\no bien:\n\nNuevo\nUsado\nReacondicionado`}
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-mono text-sm"
                  />

                  {/* Preview de opciones detectadas */}
                  {detectedCount > 0 && (
                    <div className="p-3 bg-white rounded-lg border border-blue-200">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Vista previa:</p>
                      <div className="flex flex-wrap gap-2">
                        {detectedOptions.map((opt, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={processBulkOptions}
                      disabled={detectedCount === 0}
                      type="button"
                      className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Agregar {detectedCount > 0 ? `${detectedCount} opción${detectedCount !== 1 ? 'es' : ''}` : 'opciones'}
                    </button>
                    <button
                      onClick={() => {
                        setBulkInput('');
                        setShowBulkMode(false);
                      }}
                      type="button"
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* INDIVIDUAL MODE: Input simple */}
              {!showBulkMode && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                    placeholder="Escribe una opción y presiona Enter"
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition-all"
                  />
                  <button
                    onClick={addOption}
                    type="button"
                    className="px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-all font-semibold"
                  >
                    Agregar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_required}
                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-gray-300 text-brand-400 focus:ring-4 focus:ring-brand-100"
              />
              <span className="text-sm font-medium text-gray-700">Campo obligatorio</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_filterable || false}
                onChange={(e) => setFormData({ ...formData, is_filterable: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-gray-300 text-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <span className="text-sm font-medium text-gray-700">Mostrar en filtros</span>
            </label>

            {editingId && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-2 border-gray-300 text-brand-400 focus:ring-4 focus:ring-brand-100"
                />
                <span className="text-sm font-medium text-gray-700">Activo</span>
              </label>
            )}
          </div>

          {/* Opciones de filtro (solo si is_filterable está activo) */}
          {formData.is_filterable && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-4">
              <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                Configuración de Filtro
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de filtro
                  </label>
                  <select
                    value={formData.filter_type || 'select'}
                    onChange={(e) => setFormData({ ...formData, filter_type: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="select">Dropdown (selección única)</option>
                    <option value="checkbox">Checkbox (selección múltiple)</option>
                    <option value="range">Rango (min-max)</option>
                    <option value="chips">Chips (etiquetas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orden en filtros
                  </label>
                  <input
                    type="number"
                    value={formData.filter_order || 99}
                    onChange={(e) => setFormData({ ...formData, filter_order: parseInt(e.target.value) || 99 })}
                    min={1}
                    max={100}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
            <button
              onClick={editingId ? handleUpdate : handleCreate}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-all font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {editingId ? 'Guardar Cambios' : 'Crear Atributo'}
            </button>

            <button
              onClick={resetForm}
              disabled={loading}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* List - Normal Mode */}
      {selectedSubcategoryId && !showForm && (
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              Lista de Atributos ({attributes.length})
            </h3>
            {attributes.length > 1 && (
              <p className="text-sm text-gray-600 mt-1">
                <strong>Arrastrá</strong> los atributos para cambiar el orden en el formulario de publicación
              </p>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : attributes.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No hay atributos creados para esta subcategoría
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={attributes.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y-2 divide-gray-100">
                  {attributes.map((attr) => (
                    <SortableAttribute
                      key={attr.id}
                      attr={attr}
                      onEdit={startEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

        </div>
        {/* FIN COLUMNA IZQUIERDA */}

        {/* COLUMNA DERECHA: PREVIEW */}
        {showPreview && (
          <div className="sticky top-6 h-fit max-h-[calc(100vh-8rem)]">
            <FormPreview
              attributes={attributes}
              categoryName={categories.find(c => c.id === selectedCategoryId)?.display_name}
              subcategoryName={subcategories.find(s => s.id === selectedSubcategoryId)?.display_name}
            />
          </div>
        )}
      </div>
      {/* FIN GRID LAYOUT */}

      {/* Import Template Modal */}
      <ImportTemplateModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        targetCategoryId={selectedCategoryId}
        targetSubcategoryId={selectedSubcategoryId}
        onSuccess={handleImportSuccess}
      />

      {/* Save as Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b-2 border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Guardar como Template</h2>
                <button
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Guardá estos {attributes.length} atributo{attributes.length !== 1 ? 's' : ''} como template reutilizable
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Nombre del Template *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder={`${categories.find(c => c.id === selectedCategoryId)?.display_name}_${subcategories.find(s => s.id === selectedSubcategoryId)?.display_name}`}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Ej: Template completo con todos los campos de maquinaria agrícola"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t-2 border-gray-200">
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                disabled={savingTemplate}
                className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSaveTemplate}
                disabled={!templateName.trim() || savingTemplate}
                className="px-6 py-3 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 transition-all shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingTemplate ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
