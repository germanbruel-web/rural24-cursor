import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Building2 } from 'lucide-react';
import type { Category, Subcategory } from '../../../types/v2';
import { getMyCompanies } from '../../../services/empresaService';
import type { MyCompany } from '../../../services/empresaService';
import { ProfileGate } from '../../dashboard/ProfileGate';

export interface CategorySelectorProps {
  categories: Category[];
  subcategories: Subcategory[];
  selectedCategory: string;
  selectedSubcategory: string;
  showProfileGate: boolean;
  pendingSubcategoryName: string;
  initialExpandedL2Sub?: string;
  onSelectCategory: (categoryId: string) => void;
  onSelectLeaf: (subcategory: Subcategory, isServicioEmpresa: boolean) => void;
  onClearCategory: () => void;
  onProfileGateEmpresaCreated: (empresa: MyCompany) => void;
  onShowProfileGate: (subcategoryDisplayName: string) => void;
}

export function CategorySelector({
  categories,
  subcategories,
  selectedCategory,
  selectedSubcategory,
  showProfileGate,
  pendingSubcategoryName,
  initialExpandedL2Sub,
  onSelectCategory,
  onSelectLeaf,
  onClearCategory,
  onProfileGateEmpresaCreated,
  onShowProfileGate,
}: CategorySelectorProps) {
  const [expandedL2Sub, setExpandedL2Sub] = useState<string>(initialExpandedL2Sub ?? '');
  const [mobileNavLevel, setMobileNavLevel] = useState<1 | 2 | 3>(1);
  const [drillDirection, setDrillDirection] = useState<'forward' | 'back'>('forward');

  if (showProfileGate) {
    return (
      <ProfileGate
        subcategoryDisplayName={pendingSubcategoryName}
        onEmpresaCreated={onProfileGateEmpresaCreated}
      />
    );
  }

  const l2Subs = subcategories.filter(s => !s.parent_id);
  const childrenMap: Record<string, Subcategory[]> = {};
  subcategories.filter(s => s.parent_id).forEach(s => {
    if (!childrenMap[s.parent_id!]) childrenMap[s.parent_id!] = [];
    childrenMap[s.parent_id!].push(s);
  });
  const l3Subs = expandedL2Sub ? (childrenMap[expandedL2Sub] || []) : [];
  const showL3Col = l3Subs.length > 0;
  const selectedCat = categories.find(c => c.id === selectedCategory);
  const expandedL2Sub_data = l2Subs.find(s => s.id === expandedL2Sub);

  const handleSelectLeaf = async (leafSub: Subcategory, parentSlug?: string) => {
    const isServicioEmpresa = leafSub.slug === 'servicios' || leafSub.slug === 'empresas' || parentSlug === 'servicios' || parentSlug === 'empresas';
    if (isServicioEmpresa) {
      const empresas = await getMyCompanies();
      if (empresas.length === 0) {
        onShowProfileGate(leafSub.display_name);
        return;
      }
    }
    onSelectLeaf(leafSub, isServicioEmpresa);
  };

  const MobileRow = ({ label, isActive, isSelected, isServicio, onClick }: {
    label: string; isActive?: boolean;
    isSelected?: boolean; isServicio?: boolean; onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-[14px] text-left transition-colors border-b border-gray-100 last:border-b-0 active:bg-gray-50 ${
        isActive ? 'bg-brand-50' : 'bg-white'
      }`}
    >
      {isServicio && <Building2 className="w-5 h-5 text-brand-500 flex-shrink-0" />}
      <span className={`flex-1 text-base font-medium ${isActive ? 'text-brand-800' : 'text-gray-800'}`}>
        {label}
      </span>
      {isSelected
        ? <Check className="w-5 h-5 text-brand-600 flex-shrink-0" />
        : <ChevronRight className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-brand-500' : 'text-gray-300'}`} />
      }
    </button>
  );

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ── MOBILE: Drill-down navigation (< lg) ── */}
      <div className="lg:hidden">
        {mobileNavLevel > 1 && (
          <button
            onClick={() => {
              setDrillDirection('back');
              if (mobileNavLevel === 2) {
                setMobileNavLevel(1);
                onClearCategory();
                setExpandedL2Sub('');
              } else {
                setMobileNavLevel(2);
                setExpandedL2Sub('');
              }
            }}
            className="flex items-center gap-1 text-brand-600 text-sm font-medium mb-3 py-1"
          >
            <ChevronLeft className="w-4 h-4" />
            {mobileNavLevel === 2 ? 'Categorías' : selectedCat?.display_name}
          </button>
        )}

        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
          {mobileNavLevel === 1 && 'Seleccioná una categoría'}
          {mobileNavLevel === 2 && selectedCat?.display_name}
          {mobileNavLevel === 3 && expandedL2Sub_data?.display_name}
        </p>

        <div
          key={`mob-${mobileNavLevel}-${drillDirection}`}
          className={`border border-gray-200 rounded-xl overflow-hidden divide-y-0 ${drillDirection === 'back' ? 'drill-enter-back' : 'drill-enter-forward'}`}
        >
          {mobileNavLevel === 1 && categories.map((cat) => (
            <MobileRow
              key={cat.id}
              label={cat.display_name}
              isActive={selectedCategory === cat.id}
              onClick={() => {
                setDrillDirection('forward');
                onSelectCategory(cat.id);
                setExpandedL2Sub('');
                setMobileNavLevel(2);
              }}
            />
          ))}

          {mobileNavLevel === 2 && (
            l2Subs.length === 0
              ? <div className="p-4 text-sm text-gray-400 italic">Cargando...</div>
              : l2Subs.map((sub) => {
                  const hasChildren = (childrenMap[sub.id] || []).length > 0;
                  const isServicio = sub.slug === 'servicios' || sub.slug === 'empresas';
                  const isActive = hasChildren ? expandedL2Sub === sub.id : selectedSubcategory === sub.id;
                  return (
                    <MobileRow
                      key={sub.id}
                      label={sub.display_name}
                      isActive={isActive}
                      isSelected={!hasChildren && selectedSubcategory === sub.id}
                      isServicio={isServicio}
                      onClick={() => {
                        if (hasChildren) {
                          setDrillDirection('forward');
                          setExpandedL2Sub(sub.id);
                          setMobileNavLevel(3);
                        } else {
                          handleSelectLeaf(sub);
                        }
                      }}
                    />
                  );
                })
          )}

          {mobileNavLevel === 3 && l3Subs.map((child) => {
            const parentSlug = expandedL2Sub_data?.slug;
            return (
              <MobileRow
                key={child.id}
                label={child.display_name}
                isSelected={selectedSubcategory === child.id}
                onClick={() => handleSelectLeaf(child, parentSlug)}
              />
            );
          })}
        </div>
      </div>

      {/* ── DESKTOP: Miller columns (lg+) ── */}
      <div className="hidden lg:block">
        <div className="mb-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">¿Qué vas a publicar?</h2>
          <p className="text-sm lg:text-base text-gray-500">
            Seleccioná categoría → subcategoría{showL3Col ? ' → tipo' : ''}
          </p>
        </div>
        <div className={`grid gap-0 border border-gray-200 rounded-xl overflow-hidden ${showL3Col ? 'grid-cols-3' : selectedCategory ? 'grid-cols-2' : 'grid-cols-1'}`}>

          {/* COLUMNA 1 — L1 */}
          <div className="flex flex-col border-r border-gray-200 bg-gray-50">
            <div className="px-3 py-2 bg-gray-100 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</p>
            </div>
            <div className="flex flex-col overflow-y-auto max-h-[420px]">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (isSelected) {
                        onClearCategory();
                        setExpandedL2Sub('');
                      } else {
                        onSelectCategory(cat.id);
                        setExpandedL2Sub('');
                      }
                    }}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between transition-all border-b border-gray-100 last:border-b-0 ${
                      isSelected ? 'bg-brand-600 text-white font-semibold' : 'hover:bg-white text-gray-800 hover:text-brand-700'
                    }`}
                  >
                    <span className="text-sm font-medium">{cat.display_name}</span>
                    {isSelected && <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-80" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLUMNA 2 — L2 */}
          {selectedCategory && (
            <div className={`flex flex-col ${showL3Col ? 'border-r border-gray-200' : ''} bg-white`}>
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subcategoría</p>
              </div>
              <div className="flex flex-col overflow-y-auto max-h-[420px]">
                {l2Subs.length === 0 ? (
                  <div className="p-4 text-sm text-gray-400 italic">Cargando...</div>
                ) : l2Subs.map((sub) => {
                  const hasChildren = (childrenMap[sub.id] || []).length > 0;
                  const isServicioEmpresa = sub.slug === 'servicios' || sub.slug === 'empresas';
                  const isActive = hasChildren ? expandedL2Sub === sub.id : selectedSubcategory === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => {
                        if (hasChildren) {
                          setExpandedL2Sub(isActive ? '' : sub.id);
                        } else {
                          setExpandedL2Sub('');
                          handleSelectLeaf(sub);
                        }
                      }}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between transition-all border-b border-gray-100 last:border-b-0 ${
                        isActive ? 'bg-brand-50 text-brand-800 font-semibold border-l-2 border-l-brand-500' : 'hover:bg-gray-50 text-gray-800 hover:text-brand-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isServicioEmpresa && <Building2 className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />}
                        <span className="text-sm truncate">{sub.display_name}</span>
                      </div>
                      {hasChildren
                        ? <ChevronRight className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                        : isActive && <Check className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                      }
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* COLUMNA 3 — L3 */}
          {showL3Col && (
            <div className="flex flex-col bg-white">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {expandedL2Sub_data?.display_name ?? 'Tipo'}
                </p>
              </div>
              <div className="flex flex-col overflow-y-auto max-h-[420px]">
                {l3Subs.map((child) => {
                  const parentSlug = expandedL2Sub_data?.slug;
                  const isSelected = selectedSubcategory === child.id;
                  return (
                    <button
                      key={child.id}
                      onClick={() => handleSelectLeaf(child, parentSlug)}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between transition-all border-b border-gray-100 last:border-b-0 ${
                        isSelected ? 'bg-brand-600 text-white font-semibold' : 'hover:bg-gray-50 text-gray-800 hover:text-brand-700'
                      }`}
                    >
                      <span className="text-sm">{child.display_name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
