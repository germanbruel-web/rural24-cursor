import React, { useState, useEffect } from 'react';
import { 
  ChevronDown,
  ChevronRight,
  Plus, 
  Edit, 
  Trash2,
  Box,
  Tag,
  Wrench,
  CheckCircle,
  XCircle,
  Package,
  Layers,
  Search,
  Filter,
  Eye,
  EyeOff,
  FolderPlus,
  Save,
  X as CloseIcon,
  AlertCircle
} from 'lucide-react';
import { 
  getCategories,
  getMaquinariasSubcategories,
  getMaquinariasBrands,
  getMaquinariasModels,
  getGanaderiaSubcategories,
  getGanaderiaRazas,
  getInsumosSubcategories,
  getInsumosBrands
} from '../../../services/catalogServiceClean';
import { supabase } from '../../../services/supabaseClient';
import { generateRealisticSpecs } from '../../../services/aiModelGenerator';
import { generateCatalogJSON, downloadCatalogJSON, getCatalogStats } from '../../../services/catalogExportService';

interface TreeNode {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  type: 'category' | 'subcategory' | 'brand' | 'model';
  children?: TreeNode[];
  expanded?: boolean;
  has_brands?: boolean;
  has_models?: boolean;
  parent_id?: string;
  category_id?: string;
  subcategory_id?: string;
}

interface CreateModalData {
  type: 'category' | 'subcategory' | 'brand' | 'model';
  parent_id?: string;
  category_id?: string;
  subcategory_id?: string;
  name?: string;
  display_name?: string;
}

export const CategoriesTreeView: React.FC = () => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalData, setCreateModalData] = useState<CreateModalData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'category' | 'subcategory' | 'brand' | 'model'>('all');
  const [showInactive, setShowInactive] = useState(true);
  const [stats, setStats] = useState({ categories: 0, subcategories: 0, brands: 0, models: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    loadFullTree();
  }, []);

  const loadFullTree = async () => {
    setLoading(true);
    try {
      console.log('📚 Iniciando carga del árbol completo...');
      const cats = await getCategories();
      console.log('📊 Categorías obtenidas:', cats);
      
      if (!cats || cats.length === 0) {
        console.warn('⚠️ No se encontraron categorías. Verifica que existan datos en Supabase.');
        setTreeData([]);
        setStats({ categories: 0, subcategories: 0, brands: 0, models: 0 });
        setLoading(false);
        return;
      }
      
      const tree: TreeNode[] = await Promise.all(
        cats.map(async (cat) => {
          let subs: any[] = [];
          
          // Cargar subcategorías desde tablas independientes
          if (cat.name === 'maquinarias') {
            subs = await getMaquinariasSubcategories();
          } else if (cat.name === 'ganaderia') {
            subs = await getGanaderiaSubcategories();
          } else if (cat.name === 'insumos') {
            subs = await getInsumosSubcategories();
          } else {
            console.warn(`⚠️ Categoría ${cat.name} sin tablas independientes`);
            return {
              id: cat.id,
              name: cat.name,
              display_name: cat.display_name,
              is_active: cat.is_active,
              type: 'category' as const,
              children: []
            };
          }
          
          const subcategoriesWithBrands = await Promise.all(
            subs.map(async (sub) => {
              let brands: TreeNode[] = [];
              
              // Cargar marcas/razas según categoría
              if (cat.name === 'maquinarias') {
                const brandsData = await getMaquinariasBrands();
                brands = await Promise.all(
                  brandsData.map(async (brand) => {
                    const modelsData = await getMaquinariasModels(brand.id);
                    const models: TreeNode[] = modelsData.map(model => ({
                      id: model.id,
                      name: model.name,
                      display_name: model.display_name,
                      is_active: model.is_active,
                      type: 'model' as const
                    }));
                    
                    return {
                      id: brand.id,
                      name: brand.name,
                      display_name: brand.display_name,
                      is_active: brand.is_active,
                      type: 'brand' as const,
                      children: models
                    };
                  })
                );
              } else if (cat.name === 'ganaderia') {
                const razasData = await getGanaderiaRazas(sub.id);
                brands = razasData.map(raza => ({
                  id: raza.id,
                  name: raza.name,
                  display_name: raza.display_name,
                  is_active: raza.is_active,
                  type: 'brand' as const,
                  children: []
                }));
              } else if (cat.name === 'insumos') {
                const brandsData = await getInsumosBrands();
                brands = brandsData.map(brand => ({
                  id: brand.id,
                  name: brand.name,
                  display_name: brand.display_name,
                  is_active: brand.is_active,
                  type: 'brand' as const,
                  children: []
                }));
              }
              
              return {
                id: sub.id,
                name: sub.name,
                display_name: sub.display_name,
                is_active: sub.is_active,
                type: 'subcategory' as const,
                has_brands: cat.name !== 'inmuebles',
                has_models: cat.name === 'maquinarias',
                children: brands
              };
            })
          );
          
          return {
            id: cat.id,
            name: cat.name,
            display_name: cat.display_name,
            is_active: cat.is_active,
            type: 'category' as const,
            children: subcategoriesWithBrands
          };
        })
      );
      
      setTreeData(tree);
      // Expandir todo por defecto
      const allIds = new Set<string>();
      const collectIds = (nodes: TreeNode[]) => {
        nodes.forEach(node => {
          allIds.add(node.id);
          if (node.children) collectIds(node.children);
        });
      };
      collectIds(tree);
      setExpandedNodes(allIds);
      
      // Calcular estadísticas
      const categoriesCount = tree.length;
      const subcategoriesCount = tree.reduce((sum, cat) => sum + (cat.children?.length || 0), 0);
      const brandsCount = tree.reduce((sum, cat) => 
        sum + (cat.children?.reduce((subSum, sub) => 
          subSum + (sub.children?.length || 0), 0) || 0), 0
      );
      const modelsCount = tree.reduce((sum, cat) => 
        sum + (cat.children?.reduce((subSum, sub) => 
          subSum + (sub.children?.reduce((brandSum, brand) => 
            brandSum + (brand.children?.length || 0), 0) || 0), 0) || 0), 0
      );
      
      setStats({ categories: categoriesCount, subcategories: subcategoriesCount, brands: brandsCount, models: modelsCount });
    } catch (error) {
      console.error('Error loading tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = (type: CreateModalData['type'], parent?: TreeNode, subcategoryName?: string) => {
    setCreateModalData({
      type,
      parent_id: parent?.id,
      category_id: type === 'subcategory' ? parent?.id : parent?.category_id,
      display_name: parent?.display_name, // Guardar nombre de la marca para limpieza
      subcategory_id: type === 'brand' ? parent?.id : parent?.subcategory_id,
      name: subcategoryName || parent?.display_name, // Nombre de subcategoría para specs
    });
    setShowCreateModal(true);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!createModalData) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const display_name = formData.get('display_name') as string;

    try {
      let result;
      
      if (createModalData.type === 'category') {
        result = await supabase.from('categories').insert({
          name: name.toLowerCase().replace(/\s+/g, '_'),
          display_name,
          is_active: true
        }).select();
      } else if (createModalData.type === 'subcategory') {
        const has_brands = formData.get('has_brands') === 'on';
        const has_models = formData.get('has_models') === 'on';
        result = await supabase.from('subcategories').insert({
          category_id: createModalData.parent_id,
          name: name.toLowerCase().replace(/\s+/g, '_'),
          display_name,
          has_brands,
          has_models,
          is_active: true
        }).select();
      } else if (createModalData.type === 'brand') {
        // Nueva estructura: subcategory_id directo en brands
        result = await supabase.from('brands').insert({
          subcategory_id: createModalData.parent_id,
          name: name.toLowerCase().replace(/\s+/g, '_'),
          display_name,
          is_active: true
        }).select();
      } else if (createModalData.type === 'model') {
        const specifications = formData.get('specifications') as string;
        const bulkModels = formData.get('bulk_models') as string;
        
        // Si hay carga masiva, procesar múltiples modelos
        if (bulkModels && bulkModels.trim()) {
          const modelLines = bulkModels.split('\n').filter(line => line.trim());
          const brandName = createModalData.display_name || ''; // Nombre de la marca seleccionada
          const subcategoryName = createModalData.name || 'Maquinaria Agrícola'; // Nombre de subcategoría
          
          // Especificaciones manuales (si se proveen)
          const manualSpecs = specifications ? JSON.parse(specifications) : null;
          
          const modelsToInsert = modelLines.map(line => {
            let trimmedLine = line.trim();
            
            // Limpiar el nombre de la marca si está presente al inicio
            // Ej: "John Deere 6155M" -> "6155M"
            if (brandName && trimmedLine.toLowerCase().startsWith(brandName.toLowerCase())) {
              trimmedLine = trimmedLine.substring(brandName.length).trim();
            }
            
            // Si la línea está vacía después de limpiar, omitir
            if (!trimmedLine) return null;
            
            // Generar especificaciones automáticamente si no hay manuales
            const autoSpecs = manualSpecs || generateRealisticSpecs(trimmedLine, subcategoryName);
            
            return {
              brand_id: createModalData.parent_id,
              name: trimmedLine.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
              display_name: trimmedLine,
              specifications: autoSpecs,
              is_active: true,
              verified: false
            };
          }).filter(model => model !== null); // Filtrar nulls
          
          result = await supabase.from('models').insert(modelsToInsert).select();
        } else {
          // Modo individual (original)
          result = await supabase.from('models').insert({
            brand_id: createModalData.parent_id,
            name: name.toLowerCase().replace(/\s+/g, '_'),
            display_name,
            specifications: specifications ? JSON.parse(specifications) : {},
            is_active: true,
            verified: false
          }).select();
        }
      }

      if (result?.error) throw result.error;

      // Mensaje específico para carga masiva
      const bulkModels = formData.get('bulk_models') as string;
      const isBulkMode = createModalData.type === 'model' && bulkModels && bulkModels.trim();
      const modelCount = isBulkMode ? bulkModels.split('\n').filter(line => line.trim()).length : 1;
      
      const successMessage = isBulkMode 
        ? `✅ ${modelCount} modelos creados exitosamente`
        : `✅ ${createModalData.type === 'category' ? 'Categoría' : createModalData.type === 'subcategory' ? 'Subcategoría' : createModalData.type === 'brand' ? 'Marca' : 'Modelo'} creado exitosamente`;
      
      alert(successMessage);
      setShowCreateModal(false);
      setCreateModalData(null);
      await loadFullTree();
    } catch (error: any) {
      console.error('Error creating:', error);
      
      // Mostrar mensaje específico de Supabase
      const errorMessage = error?.message || 'Error desconocido';
      const errorCode = error?.code || '';
      
      if (errorCode === '23505' || errorMessage.includes('duplicate') || errorMessage.includes('unique constraint')) {
        alert(`❌ Error: Ya existe un elemento con ese nombre.\n\nIntenta con un nombre diferente o elimina el elemento existente primero.\n\nDetalle: ${errorMessage}`);
      } else {
        alert(`❌ Error al crear:\n\n${errorMessage}\n\nCódigo: ${errorCode}\n\nVer consola para más detalles.`);
      }
    }
  };

  const handleDelete = async (node: TreeNode) => {
    if (!confirm(`¿Estás seguro de eliminar "${node.display_name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      let result;
      
      if (node.type === 'category') {
        result = await supabase.from('categories').delete().eq('id', node.id);
      } else if (node.type === 'subcategory') {
        result = await supabase.from('subcategories').delete().eq('id', node.id);
      } else if (node.type === 'brand') {
        // Eliminación directa (CASCADE eliminará modelos automáticamente)
        result = await supabase.from('brands').delete().eq('id', node.id);
      } else if (node.type === 'model') {
        result = await supabase.from('models').delete().eq('id', node.id);
      }

      if (result?.error) throw result.error;

      alert(`✅ Eliminado exitosamente`);
      await loadFullTree();
    } catch (error: any) {
      console.error('Error deleting:', error);
      alert(`❌ Error al eliminar: ${error.message || 'Ver consola'}`);
    }
  };

  const handleToggleActive = async (node: TreeNode) => {
    try {
      let result;
      const newStatus = !node.is_active;
      
      if (node.type === 'category') {
        result = await supabase.from('categories').update({ is_active: newStatus }).eq('id', node.id);
      } else if (node.type === 'subcategory') {
        result = await supabase.from('subcategories').update({ is_active: newStatus }).eq('id', node.id);
      } else if (node.type === 'brand') {
        result = await supabase.from('brands').update({ is_active: newStatus }).eq('id', node.id);
      } else if (node.type === 'model') {
        result = await supabase.from('models').update({ is_active: newStatus }).eq('id', node.id);
      }

      if (result?.error) throw result.error;

      await loadFullTree();
    } catch (error) {
      console.error('Error toggling active:', error);
      alert('❌ Error al cambiar estado');
    }
  };



  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'category': return <Layers className="w-5 h-5 text-blue-600" />;
      case 'subcategory': return <Box className="w-4 h-4 text-green-600" />;
      case 'brand': return <Tag className="w-4 h-4 text-purple-600" />;
      case 'model': return <Wrench className="w-4 h-4 text-orange-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const renderNode = (node: TreeNode, level: number = 0, parentNode?: TreeNode) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode?.id === node.id;
    
    // Asignar parent info
    const enrichedNode = { ...node, parent_id: parentNode?.id, category_id: parentNode?.type === 'category' ? parentNode.id : parentNode?.category_id };

    return (
      <div key={node.id} className="select-none group">
        {/* Nodo principal */}
        <div 
          className={`
            flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded cursor-pointer transition-all
            ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
            ${!node.is_active ? 'opacity-50' : ''}
          `}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
          onClick={() => setSelectedNode(enrichedNode)}
        >
          {/* Expand/Collapse */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Icono del tipo */}
          {getIcon(node.type)}

          {/* Nombre */}
          <span className="flex-1 font-medium text-gray-800">
            {node.display_name}
          </span>

          {/* Badge del tipo */}
          <span className={`
            px-2 py-1 text-xs rounded-full
            ${node.type === 'category' ? 'bg-blue-100 text-blue-700' : ''}
            ${node.type === 'subcategory' ? 'bg-green-100 text-green-700' : ''}
            ${node.type === 'brand' ? 'bg-purple-100 text-purple-700' : ''}
            ${node.type === 'model' ? 'bg-orange-100 text-orange-700' : ''}
          `}>
            {node.type === 'category' ? 'Categoría' : ''}
            {node.type === 'subcategory' ? 'Subcategoría' : ''}
            {node.type === 'brand' ? 'Marca' : ''}
            {node.type === 'model' ? 'Modelo' : ''}
          </span>

          {/* Contador de hijos */}
          {hasChildren && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {node.children!.length}
            </span>
          )}

          {/* Estado activo/inactivo */}
          {node.is_active ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}

          {/* Acciones */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Agregar hijo según tipo */}
            {node.type === 'category' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openCreateModal('subcategory', enrichedNode);
                }}
                className="p-1 hover:bg-green-100 rounded text-green-600"
                title="Agregar Subcategoría"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            {node.type === 'subcategory' && node.has_brands && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openCreateModal('brand', enrichedNode);
                }}
                className="p-1 hover:bg-purple-100 rounded text-purple-600"
                title="Agregar Marca"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            {node.type === 'brand' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openCreateModal('model', { ...enrichedNode, subcategory_id: parentNode?.id });
                }}
                className="p-1 hover:bg-orange-100 rounded text-orange-600"
                title="Agregar Modelo"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            
            {/* Activar/Desactivar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleActive(node);
              }}
              className={`p-1 rounded ${node.is_active ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-green-100 text-green-600'}`}
              title={node.is_active ? 'Desactivar' : 'Activar'}
            >
              {node.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            
            {/* Eliminar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(node);
              }}
              className="p-1 hover:bg-red-100 rounded text-red-600"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hijos (recursivo) */}
        {isExpanded && hasChildren && (
          <div>
            {node.children!.map(child => renderNode(child, level + 1, enrichedNode))}
          </div>
        )}
      </div>
    );
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        allIds.add(node.id);
        if (node.children) collectIds(node.children);
      });
    };
    collectIds(treeData);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  /**
   * Genera y descarga JSON del catálogo completo
   * Para optimizar carga en frontend (sin requests a Supabase)
   */
  const handleExportJSON = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    
    try {
      console.log('🚀 Iniciando exportación a JSON...');
      
      // Generar JSON completo del catálogo
      const catalog = await generateCatalogJSON();
      
      // Mostrar estadísticas
      const stats = getCatalogStats(catalog);
      console.log('📊 Estadísticas del catálogo:', stats);
      
      // Descargar archivo
      downloadCatalogJSON(catalog);
      
      setExportSuccess(true);
      
      // Mostrar instrucciones
      alert(
        `✅ JSON exportado exitosamente!\n\n` +
        `📊 Estadísticas:\n` +
        `• Categorías: ${stats.categories}\n` +
        `• Subcategorías: ${stats.subcategories}\n` +
        `• Marcas: ${stats.brands}\n` +
        `• Modelos: ${stats.models}\n` +
        `• Tamaño: ${stats.sizeKB} KB\n\n` +
        `📝 Instrucciones:\n` +
        `1. Mover el archivo descargado a /public/catalog.json\n` +
        `2. El frontend lo cargará automáticamente en el próximo inicio\n` +
        `3. TTL: 7 días (después recargará desde Supabase)\n\n` +
        `💡 Beneficio: 0 requests a Supabase en carga inicial!`
      );
      
      // Auto-ocultar mensaje de éxito después de 5s
      setTimeout(() => setExportSuccess(false), 5000);
      
    } catch (error) {
      console.error('❌ Error exportando JSON:', error);
      alert('❌ Error al exportar JSON. Ver consola para detalles.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando árbol de categorías...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header Mejorado */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl text-white">
                  <FolderPlus className="w-8 h-8" />
                </div>
                Biblioteca de Fichas Técnicas
              </h1>
              <p className="text-gray-600 text-lg">
                Gestión completa del catálogo: Categorías → Subcategorías → Marcas → Modelos
              </p>
            </div>
            <button
              onClick={() => window.location.hash = '#/my-ads'}
              className="px-6 py-3 bg-white shadow-md text-gray-700 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              Dashboard
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Categorías</div>
                  <div className="text-3xl font-bold text-blue-600">{stats.categories}</div>
                </div>
                <Layers className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Subcategorías</div>
                  <div className="text-3xl font-bold text-green-600">{stats.subcategories}</div>
                </div>
                <Box className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Marcas</div>
                  <div className="text-3xl font-bold text-purple-600">{stats.brands}</div>
                </div>
                <Tag className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Modelos</div>
                  <div className="text-3xl font-bold text-orange-600">{stats.models}</div>
                </div>
                <Wrench className="w-12 h-12 text-orange-600 opacity-20" />
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar Mejorado */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            {/* Botones de creación rápida */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => openCreateModal('category')}
                className="px-6 py-3 bg-[#16a135] hover:bg-[#138a2c] text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-medium"
              >
                <Plus className="w-5 h-5" />
                Nueva Categoría
              </button>
              <button
                onClick={expandAll}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <ChevronDown className="w-4 h-4" />
                Expandir
              </button>
              <button
                onClick={collapseAll}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                Colapsar
              </button>
              <button
                onClick={loadFullTree}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                Recargar
              </button>
              
              {/* Botón Exportar JSON */}
              <button
                onClick={handleExportJSON}
                disabled={isExporting || stats.categories === 0}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  exportSuccess 
                    ? 'bg-green-600 text-white shadow-lg' 
                    : isExporting 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-700 hover:bg-gray-800 text-white hover:shadow-lg'
                }`}
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Exportando...
                  </>
                ) : exportSuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    ¡Exportado!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Exportar JSON
                  </>
                )}
              </button>
            </div>

            {/* Filtros y búsqueda */}
            <div className="flex gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowInactive(!showInactive)}
                className={`px-4 py-3 rounded-lg transition-colors flex items-center gap-2 ${showInactive ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'}`}
                title={showInactive ? 'Ocultar inactivos' : 'Mostrar inactivos'}
              >
                {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Layout con sidebar y árbol */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panel de información seleccionada */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Detalles
              </h3>
              
              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Tipo</div>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedNode.type === 'category' ? 'bg-blue-100 text-blue-700' :
                      selectedNode.type === 'subcategory' ? 'bg-green-100 text-green-700' :
                      selectedNode.type === 'brand' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {selectedNode.type === 'category' ? 'Categoría' :
                       selectedNode.type === 'subcategory' ? 'Subcategoría' :
                       selectedNode.type === 'brand' ? 'Marca' : 'Modelo'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Nombre</div>
                    <div className="font-medium text-gray-900">{selectedNode.display_name}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">ID</div>
                    <div className="text-xs font-mono bg-gray-100 p-2 rounded">{selectedNode.id}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Estado</div>
                    <div className="flex items-center gap-2">
                      {selectedNode.is_active ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-700 font-medium">Activo</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-700 font-medium">Inactivo</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {selectedNode.children && selectedNode.children.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Hijos</div>
                      <div className="text-2xl font-bold text-gray-900">{selectedNode.children.length}</div>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t space-y-2">
                    <button
                      onClick={() => handleToggleActive(selectedNode)}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                      {selectedNode.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {selectedNode.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleDelete(selectedNode)}
                      className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Selecciona un elemento del árbol</p>
                </div>
              )}
            </div>
          </div>

          {/* Árbol */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center gap-6 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-gray-700">Categoría</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-700">Subcategoría</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-gray-700">Marca</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-gray-700">Modelo (Ficha Técnica)</span>
                  </div>
                </div>
              </div>

              <div className="p-6 max-h-[calc(100vh-400px)] overflow-y-auto">
                {treeData.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <FolderPlus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No hay categorías</p>
                    <p className="text-sm mb-4">Comienza creando tu primera categoría</p>
                    <button
                      onClick={() => openCreateModal('category')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Crear Categoría
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {treeData.map(node => renderNode(node, 0))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de creación */}
        {showCreateModal && createModalData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b bg-gray-800 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Plus className="w-7 h-7" />
                    Crear {createModalData.type === 'category' ? 'Categoría' : 
                           createModalData.type === 'subcategory' ? 'Subcategoría' : 
                           createModalData.type === 'brand' ? 'Marca' : 'Modelo'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateModalData(null);
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-6">
                {/* Campos individuales (no necesarios en modo bulk para modelos) */}
                {createModalData.type !== 'model' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre técnico (slug)
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="ej: tractores, john_deere, modelo_5075e"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Minúsculas, sin espacios (usa guión bajo)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre para mostrar
                      </label>
                      <input
                        type="text"
                        name="display_name"
                        required
                        placeholder="ej: Tractores, John Deere, Modelo 5075E"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {createModalData.type === 'subcategory' && (
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" name="has_brands" defaultChecked className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium">Tiene marcas</span>
                    </label>
                    <label className="flex items-center gap-2 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" name="has_models" defaultChecked className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium">Tiene modelos</span>
                    </label>
                  </div>
                )}

                {createModalData.type === 'model' && (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Carga Masiva de Modelos {createModalData.display_name && <span className="text-sm font-normal">para {createModalData.display_name}</span>}
                      </h3>
                      <p className="text-sm text-blue-700 mb-3">
                        Pega una lista de modelos, uno por línea. Puedes incluir o no el nombre de la marca (se limpiará automáticamente).
                      </p>
                      <textarea
                        name="bulk_models"
                        rows={10}
                        placeholder={`Puedes pegar con marca:\n${createModalData.display_name || 'John Deere'} 6155M\n${createModalData.display_name || 'John Deere'} 7250R\n\nO solo el modelo:\n6155M\n7250R\n8320R\nPuma 185\nMagnum 340\nT7.270`}
                        className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      />
                      <p className="text-xs text-blue-600 mt-2">
                        ⚡ Inteligente: detecta y elimina el nombre de marca automáticamente si está presente
                      </p>
                    </div>

                    <div className="text-center text-gray-400 text-sm my-4">
                      <span className="bg-white px-3 py-1 rounded-full border">O individual</span>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <span>Especificaciones (JSON opcional)</span>
                        <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Auto-genera si vacio</span>
                      </label>
                      <textarea
                        name="specifications"
                        rows={6}
                        placeholder={'Dejalo vacio para generar automaticamente segun el modelo\n\nO pega JSON personalizado:\n{\n  "motor": {\n    "potencia": "75 HP",\n    "cilindros": 4\n  },\n  "dimensiones": {\n    "peso": "3500 kg"\n  }\n}'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        <strong>Auto:</strong> Genera motor, transmision, hidraulica, dimensiones segun la potencia detectada en el nombre del modelo
                      </p>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-[#16a135] hover:bg-[#138a2c] text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Crear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateModalData(null);
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
