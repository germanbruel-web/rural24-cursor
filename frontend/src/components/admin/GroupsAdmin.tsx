// ====================================================================
// GROUPS ADMIN - Gestión de grupos de atributos dinámicos
// Panel de administración para crear/editar/reordenar grupos
// ====================================================================

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, GripVertical, AlertCircle, CheckCircle2, Folder, FolderPlus } from 'lucide-react';
import {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  reorderGroups,
  createDefaultGroups,
  type AttributeGroup,
} from '../../services/v2/groupsService';
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
// SORTABLE GROUP ITEM
// ====================================================================
interface SortableGroupProps {
  group: AttributeGroup;
  onEdit: (group: AttributeGroup) => void;
  onDelete: (id: string) => void;
  attributeCount?: number;
}

function SortableGroup({ group, onEdit, onDelete, attributeCount = 0 }: SortableGroupProps) {
  const {
    attributes: dndAttributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all flex items-center justify-between ${
        isDragging ? 'shadow-2xl z-50' : ''
      }`}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Handle draggable */}
        <button
          {...dndAttributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-green-100 rounded-lg transition-all"
          title="Arrastrar para reordenar"
        >
          <GripVertical className="w-5 h-5 text-gray-400 hover:text-green-600" />
        </button>
        
        {/* Ícono de carpeta */}
        <div className="p-2 bg-green-100 rounded-lg">
          <Folder className="w-5 h-5 text-green-600" />
        </div>
        
        {/* Contenido del grupo */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-gray-900">{group.display_name}</h4>
            {!group.is_active && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                Inactivo
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {group.name} • {attributeCount} atributo{attributeCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(group)}
          className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-all"
          title="Editar grupo"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(group.id)}
          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all"
          title="Eliminar grupo"
          disabled={attributeCount > 0}
        >
          <Trash2 className={`w-4 h-4 ${attributeCount > 0 ? 'opacity-30' : ''}`} />
        </button>
      </div>
    </div>
  );
}

// ====================================================================
// MAIN COMPONENT
// ====================================================================
interface GroupsAdminProps {
  subcategoryId: string;
  subcategoryName?: string;
  attributeCounts?: Record<string, number>; // groupId -> count
  onGroupsChange?: (groups: AttributeGroup[]) => void;
}

export function GroupsAdmin({ 
  subcategoryId, 
  subcategoryName,
  attributeCounts = {},
  onGroupsChange,
}: GroupsAdminProps) {
  const [groups, setGroups] = useState<AttributeGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AttributeGroup | null>(null);
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ====================================================================
  // EFFECTS
  // ====================================================================
  useEffect(() => {
    if (subcategoryId) {
      loadGroups();
    }
  }, [subcategoryId]);

  // ====================================================================
  // DATA LOADING
  // ====================================================================
  async function loadGroups() {
    setLoading(true);
    try {
      const data = await getGroups(subcategoryId);
      setGroups(data);
      onGroupsChange?.(data);
    } catch (error) {
      showMessage('error', 'Error cargando grupos');
    } finally {
      setLoading(false);
    }
  }

  // ====================================================================
  // HANDLERS
  // ====================================================================
  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  function openCreateModal() {
    setEditingGroup(null);
    setFormDisplayName('');
    setFormIsActive(true);
    setShowModal(true);
  }

  function openEditModal(group: AttributeGroup) {
    setEditingGroup(group);
    setFormDisplayName(group.display_name);
    setFormIsActive(group.is_active);
    setShowModal(true);
  }

  async function handleSave() {
    if (!formDisplayName.trim()) {
      showMessage('error', 'El nombre del grupo es requerido');
      return;
    }

    setSaving(true);
    try {
      if (editingGroup) {
        // Actualizar
        await updateGroup(editingGroup.id, {
          display_name: formDisplayName,
          is_active: formIsActive,
        });
        showMessage('success', '✓ Grupo actualizado');
      } else {
        // Crear
        await createGroup({
          subcategory_id: subcategoryId,
          name: '',
          display_name: formDisplayName,
          sort_order: groups.length,
          is_active: formIsActive,
        });
        showMessage('success', '✓ Grupo creado');
      }
      setShowModal(false);
      await loadGroups();
    } catch (error: any) {
      showMessage('error', error.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const group = groups.find(g => g.id === id);
    const count = attributeCounts[id] || 0;
    
    if (count > 0) {
      showMessage('error', `No se puede eliminar: tiene ${count} atributo(s) asignados`);
      return;
    }

    if (!confirm(`¿Eliminar el grupo "${group?.display_name}"?`)) return;

    try {
      await deleteGroup(id);
      showMessage('success', '✓ Grupo eliminado');
      await loadGroups();
    } catch (error) {
      showMessage('error', 'Error al eliminar');
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = groups.findIndex((g) => g.id === active.id);
    const newIndex = groups.findIndex((g) => g.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic UI update
    const reordered = arrayMove(groups, oldIndex, newIndex);
    setGroups(reordered);

    try {
      await reorderGroups(subcategoryId, reordered.map((g) => g.id));
      showMessage('success', '✓ Orden actualizado');
      onGroupsChange?.(reordered);
    } catch (error) {
      // Revertir en caso de error
      setGroups(groups);
      showMessage('error', 'Error al reordenar');
    }
  }

  async function handleCreateDefaults() {
    if (groups.length > 0) {
      if (!confirm('Ya existen grupos. ¿Agregar los grupos por defecto de todas formas?')) return;
    }

    try {
      await createDefaultGroups(subcategoryId);
      showMessage('success', '✓ Grupos por defecto creados');
      await loadGroups();
    } catch (error) {
      showMessage('error', 'Error al crear grupos por defecto');
    }
  }

  // ====================================================================
  // RENDER
  // ====================================================================
  if (!subcategoryId) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Selecciona una subcategoría para gestionar sus grupos</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Folder className="w-5 h-5 text-green-600" />
              Grupos de Atributos
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {subcategoryName && `${subcategoryName} • `}
              {groups.length} grupo{groups.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {groups.length === 0 && (
              <button
                onClick={handleCreateDefaults}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all"
              >
                <FolderPlus className="w-4 h-4" />
                Crear grupos por defecto
              </button>
            )}
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
            >
              <Plus className="w-4 h-4" />
              Nuevo Grupo
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mx-6 mt-4 p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Lista de grupos */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-600 border-t-transparent mx-auto" />
            <p className="text-gray-500 mt-4">Cargando grupos...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">No hay grupos definidos para esta subcategoría</p>
            <button
              onClick={handleCreateDefaults}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
            >
              Crear grupos por defecto
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={groups.map(g => g.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {groups.map((group) => (
                  <SortableGroup
                    key={group.id}
                    group={group}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    attributeCount={attributeCounts[group.id] || 0}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingGroup ? 'Editar Grupo' : 'Nuevo Grupo'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Nombre del Grupo *
                </label>
                <input
                  type="text"
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                  placeholder="Ej: Información General"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="groupActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="groupActive" className="text-sm font-medium text-gray-700">
                  Grupo activo (visible en formularios)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formDisplayName.trim()}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingGroup ? 'Guardar Cambios' : 'Crear Grupo'}
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
