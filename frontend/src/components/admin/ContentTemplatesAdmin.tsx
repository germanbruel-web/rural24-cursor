// ====================================================================
// CONTENT TEMPLATES ADMIN - Gestión de plantillas de títulos/descripciones
// Panel administrativo con CRUD completo
// ====================================================================

import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Save, X, GripVertical, 
  FileText, Type, AlignLeft, Copy, Eye, EyeOff,
  ChevronDown, ChevronRight, Filter, Globe, Layers,
  Info
} from 'lucide-react';
import { getCategories, getSubcategories, getCategoryTypes } from '../../services/v2/formsService';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  reorderTemplates,
  interpolateTemplate,
  TEMPLATE_VARIABLES,
  DYNAMIC_ATTRIBUTE_VARIABLES,
  type ContentTemplate,
  type CreateTemplateInput,
} from '../../services/v2/contentTemplatesService';
import type { Category, Subcategory, CategoryType } from '../../types/v2';
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
// SORTABLE TEMPLATE ITEM
// ====================================================================
interface SortableTemplateProps {
  template: ContentTemplate;
  onEdit: (t: ContentTemplate) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onPreview: (t: ContentTemplate) => void;
  onDuplicate: (t: ContentTemplate) => void;
}

function SortableTemplate({ template, onEdit, onDelete, onToggleActive, onPreview, onDuplicate }: SortableTemplateProps) {
  const {
    attributes: dndAttributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getScopeLabel = () => {
    if (template.type_id) return 'Tipo';
    if (template.subcategory_id) return 'Subcategoría';
    if (template.category_id) return 'Categoría';
    return 'Global';
  };

  const getScopeColor = () => {
    if (template.type_id) return 'bg-purple-100 text-purple-700';
    if (template.subcategory_id) return 'bg-blue-100 text-blue-700';
    if (template.category_id) return 'bg-brand-100 text-brand-600';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 hover:bg-gray-50 transition-all border-b ${
        isDragging ? 'shadow-2xl z-50 bg-white rounded-lg border' : ''
      } ${!template.is_active ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-4">
        {/* Handle draggable */}
        <button
          {...dndAttributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-brand-100 rounded-lg transition-all mt-1"
          title="Arrastrar para reordenar"
        >
          <GripVertical className="w-5 h-5 text-gray-400 hover:text-brand-500" />
        </button>
        
        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {/* Icon tipo */}
            {template.template_type === 'title' ? (
              <Type className="w-5 h-5 text-blue-600" />
            ) : (
              <AlignLeft className="w-5 h-5 text-brand-500" />
            )}
            
            <h4 className="font-semibold text-gray-900">{template.name}</h4>
            
            <span className={`px-2 py-1 text-xs font-medium rounded ${getScopeColor()}`}>
              {getScopeLabel()}
            </span>
            
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              template.template_type === 'title' 
                ? 'bg-blue-50 text-blue-700' 
                : 'bg-brand-50 text-brand-600'
            }`}>
              {template.template_type === 'title' ? 'Título' : 'Descripción'}
            </span>
          </div>
          
          {/* Scope details */}
          {(template.category || template.subcategory || template.type) && (
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
              <Layers className="w-3 h-3" />
              {template.category?.name}
              {template.subcategory && <> → {template.subcategory.name}</>}
              {template.type && <> → {template.type.name}</>}
            </div>
          )}
          
          {/* Template preview */}
          <div className="bg-gray-50 rounded p-3 text-sm text-gray-600 font-mono whitespace-pre-wrap max-h-24 overflow-hidden">
            {template.template_text.slice(0, 200)}
            {template.template_text.length > 200 && '...'}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPreview(template)}
            className="p-2 hover:bg-blue-100 rounded-lg transition-all"
            title="Vista previa"
          >
            <Eye className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={() => onDuplicate(template)}
            className="p-2 hover:bg-purple-100 rounded-lg transition-all"
            title="Duplicar"
          >
            <Copy className="w-4 h-4 text-purple-600" />
          </button>
          <button
            onClick={() => onToggleActive(template.id, !template.is_active)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            title={template.is_active ? 'Desactivar' : 'Activar'}
          >
            {template.is_active ? (
              <Eye className="w-4 h-4 text-brand-500" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => onEdit(template)}
            className="p-2 hover:bg-brand-100 rounded-lg transition-all"
            title="Editar"
          >
            <Edit2 className="w-4 h-4 text-brand-500" />
          </button>
          <button
            onClick={() => onDelete(template.id)}
            className="p-2 hover:bg-red-100 rounded-lg transition-all"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// MAIN COMPONENT
// ====================================================================
export function ContentTemplatesAdmin() {
  // State
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [types, setTypes] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSubcategory, setFilterSubcategory] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'title' | 'description'>('all');
  const [filterScope, setFilterScope] = useState<'all' | 'global' | 'category' | 'subcategory' | 'type'>('all');
  
  // Form
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContentTemplate | null>(null);
  const [formData, setFormData] = useState<CreateTemplateInput>({
    category_id: null,
    subcategory_id: null,
    type_id: null,
    template_type: 'title',
    name: '',
    template_text: '',
    sort_order: 0,
    is_active: true,
  });
  
  // Preview modal
  const [previewTemplate, setPreviewTemplate] = useState<ContentTemplate | null>(null);
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ====================================================================
  // LOAD DATA
  // ====================================================================
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, categoriesData] = await Promise.all([
        getTemplates(),
        getCategories(),
      ]);
      setTemplates(templatesData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Load subcategories when filter category changes
  useEffect(() => {
    if (filterCategory) {
      getSubcategories(filterCategory).then(setSubcategories);
    } else {
      setSubcategories([]);
    }
  }, [filterCategory]);

  // Load types when form subcategory changes
  useEffect(() => {
    if (formData.subcategory_id) {
      getCategoryTypes(formData.subcategory_id).then(setTypes);
    } else {
      setTypes([]);
    }
  }, [formData.subcategory_id]);

  // ====================================================================
  // FILTER TEMPLATES
  // ====================================================================
  const filteredTemplates = templates.filter(t => {
    // Filter by type
    if (filterType !== 'all' && t.template_type !== filterType) return false;
    
    // Filter by scope
    if (filterScope === 'global' && (t.category_id || t.subcategory_id || t.type_id)) return false;
    if (filterScope === 'category' && (!t.category_id || t.subcategory_id || t.type_id)) return false;
    if (filterScope === 'subcategory' && (!t.subcategory_id || t.type_id)) return false;
    if (filterScope === 'type' && !t.type_id) return false;
    
    // Filter by category
    if (filterCategory && t.category_id !== filterCategory) return false;
    
    // Filter by subcategory
    if (filterSubcategory && t.subcategory_id !== filterSubcategory) return false;
    
    return true;
  });

  // ====================================================================
  // HANDLERS
  // ====================================================================
  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      category_id: null,
      subcategory_id: null,
      type_id: null,
      template_type: 'title',
      name: '',
      template_text: '',
      sort_order: templates.length + 1,
      is_active: true,
    });
    setIsEditing(true);
  };

  const handleEdit = (template: ContentTemplate) => {
    setEditingTemplate(template);
    setFormData({
      category_id: template.category_id,
      subcategory_id: template.subcategory_id,
      type_id: template.type_id,
      template_type: template.template_type,
      name: template.name,
      template_text: template.template_text,
      sort_order: template.sort_order,
      is_active: template.is_active,
    });
    
    // Load subcategories and types for form
    if (template.category_id) {
      getSubcategories(template.category_id).then(setSubcategories);
    }
    if (template.subcategory_id) {
      getCategoryTypes(template.subcategory_id).then(setTypes);
    }
    
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.template_text.trim()) {
      setError('Nombre y contenido son obligatorios');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, formData);
      } else {
        await createTemplate(formData);
      }

      await loadData();
      setIsEditing(false);
      setEditingTemplate(null);
    } catch (err) {
      console.error('Error saving:', err);
      setError('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;

    try {
      await deleteTemplate(id);
      await loadData();
    } catch (err) {
      console.error('Error deleting:', err);
      setError('Error al eliminar');
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await updateTemplate(id, { is_active: active });
      await loadData();
    } catch (err) {
      console.error('Error toggling:', err);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = filteredTemplates.findIndex(t => t.id === active.id);
    const newIndex = filteredTemplates.findIndex(t => t.id === over.id);

    const reordered = arrayMove(filteredTemplates, oldIndex, newIndex);
    
    // Update local state immediately
    setTemplates(prev => {
      const otherTemplates = prev.filter(t => !filteredTemplates.some(ft => ft.id === t.id));
      return [...otherTemplates, ...reordered];
    });

    // Persist to DB
    try {
      await reorderTemplates(reordered.map(t => t.id));
    } catch (err) {
      console.error('Error reordering:', err);
      await loadData(); // Revert
    }
  };

  const insertVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      template_text: prev.template_text + variable,
    }));
  };

  const handleDuplicate = (template: ContentTemplate) => {
    setEditingTemplate(null);
    setFormData({
      category_id: template.category_id,
      subcategory_id: template.subcategory_id,
      type_id: template.type_id,
      template_type: template.template_type,
      name: `${template.name} (copia)`,
      template_text: template.template_text,
      sort_order: templates.length + 1,
      is_active: true,
    });
    
    // Load subcategories and types for form
    if (template.category_id) {
      getSubcategories(template.category_id).then(setSubcategories);
    }
    if (template.subcategory_id) {
      getCategoryTypes(template.subcategory_id).then(setTypes);
    }
    
    setIsEditing(true);
  };

  // ====================================================================
  // RENDER
  // ====================================================================
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-brand-500" />
            Plantillas de Contenido
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona plantillas para títulos y descripciones de avisos
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nueva Plantilla
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'title' | 'description')}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Todos los tipos</option>
            <option value="title">Solo Títulos</option>
            <option value="description">Solo Descripciones</option>
          </select>
          
          <select
            value={filterScope}
            onChange={(e) => setFilterScope(e.target.value as any)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Todos los niveles</option>
            <option value="global">🌐 Global</option>
            <option value="category">Categoría</option>
            <option value="subcategory">📂 Subcategoría</option>
            <option value="type">Tipo</option>
          </select>
          
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setFilterSubcategory('');
            }}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          
          {filterCategory && subcategories.length > 0 && (
            <select
              value={filterSubcategory}
              onChange={(e) => setFilterSubcategory(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Todas las subcategorías</option>
              {subcategories.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          )}
          
          <span className="text-sm text-gray-500 ml-auto">
            {filteredTemplates.length} plantillas
          </span>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredTemplates.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay plantillas que coincidan con los filtros</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTemplates.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredTemplates.map(template => (
                <SortableTemplate
                  key={template.id}
                  template={template}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  onPreview={setPreviewTemplate}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">
                {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h2>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre interno *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Título básico tractor"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
                />
              </div>
              
              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de plantilla *
                </label>
                <div className="flex gap-4">
                  <label className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer ${
                    formData.template_type === 'title' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="template_type"
                      value="title"
                      checked={formData.template_type === 'title'}
                      onChange={() => setFormData(prev => ({ ...prev, template_type: 'title' }))}
                      className="text-blue-600"
                    />
                    <Type className="w-5 h-5 text-blue-600" />
                    <span>Título</span>
                  </label>
                  <label className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer ${
                    formData.template_type === 'description' ? 'border-brand-400 bg-brand-50' : 'hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="template_type"
                      value="description"
                      checked={formData.template_type === 'description'}
                      onChange={() => setFormData(prev => ({ ...prev, template_type: 'description' }))}
                      className="text-brand-500"
                    />
                    <AlignLeft className="w-5 h-5 text-brand-500" />
                    <span>Descripción</span>
                  </label>
                </div>
              </div>
              
              {/* Scope */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                    <span className="text-gray-400 ml-1">(opcional)</span>
                  </label>
                  <select
                    value={formData.category_id || ''}
                    onChange={(e) => {
                      const catId = e.target.value || null;
                      setFormData(prev => ({ 
                        ...prev, 
                        category_id: catId,
                        subcategory_id: null,
                        type_id: null,
                      }));
                      if (catId) {
                        getSubcategories(catId).then(setSubcategories);
                      } else {
                        setSubcategories([]);
                      }
                      setTypes([]);
                    }}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">🌐 Global (todas)</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategoría
                    <span className="text-gray-400 ml-1">(opcional)</span>
                  </label>
                  <select
                    value={formData.subcategory_id || ''}
                    onChange={(e) => {
                      const subId = e.target.value || null;
                      setFormData(prev => ({ 
                        ...prev, 
                        subcategory_id: subId,
                        type_id: null,
                      }));
                      if (subId) {
                        getCategoryTypes(subId).then(setTypes);
                      } else {
                        setTypes([]);
                      }
                    }}
                    disabled={!formData.category_id}
                    className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
                  >
                    <option value="">Todas</option>
                    {subcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo
                    <span className="text-gray-400 ml-1">(opcional)</span>
                  </label>
                  <select
                    value={formData.type_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, type_id: e.target.value || null }))}
                    disabled={!formData.subcategory_id}
                    className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
                  >
                    <option value="">Todos</option>
                    {types.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Variables */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variables básicas
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATE_VARIABLES.map(v => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => insertVariable(v.key)}
                        className="px-3 py-1 bg-gray-100 hover:bg-brand-100 text-sm rounded-full transition-colors"
                        title={v.description}
                      >
                        {v.key}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    Variables de atributos técnicos
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DYNAMIC_ATTRIBUTE_VARIABLES.map(v => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => insertVariable(v.key)}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-sm rounded-full transition-colors text-blue-700"
                        title={v.description}
                      >
                        {v.key}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Tip: Usa <code className="bg-gray-100 px-1 rounded">{'{atributo:NOMBRE_CAMPO}'}</code> para cualquier atributo dinámico del formulario
                  </p>
                </div>
              </div>
              
              {/* Contenido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenido de la plantilla *
                </label>
                <textarea
                  value={formData.template_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_text: e.target.value }))}
                  placeholder={formData.template_type === 'title' 
                    ? '{marca} {modelo} {año} - {condicion}' 
                    : '{subcategoria} {marca} {modelo} en excelente estado.\n\n📍 Ubicación: {localidad}, {provincia}\n\nConsultá disponibilidad.'}
                  rows={formData.template_type === 'title' ? 3 : 8}
                  className="w-full px-4 py-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
                />
              </div>
              
              {/* Activo */}
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-5 h-5 text-brand-500 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Plantilla activa</span>
              </label>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-all"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Vista Previa</h2>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                  previewTemplate.template_type === 'title' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-brand-100 text-brand-600'
                }`}>
                  {previewTemplate.template_type === 'title' ? 'Título' : 'Descripción'}
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">Plantilla original:</p>
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-700 mb-4">
                  {previewTemplate.template_text}
                </pre>
                
                <hr className="my-4" />
                
                <p className="text-xs text-gray-500 mb-2">Ejemplo con datos:</p>
                <div className={`${previewTemplate.template_type === 'title' ? 'text-lg font-semibold' : 'text-sm'} text-gray-900 whitespace-pre-wrap`}>
                  {interpolateTemplate(previewTemplate.template_text, {
                    categoria: 'Maquinarias Agrícolas',
                    subcategoria: 'Tractores',
                    tipo: 'Tractor agrícola',
                    marca: 'John Deere',
                    modelo: '6195R',
                    año: '2023',
                    condicion: 'Usado',
                    provincia: 'Córdoba',
                    localidad: 'Río Cuarto',
                    precio: 'USD 95.000',
                  })}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
