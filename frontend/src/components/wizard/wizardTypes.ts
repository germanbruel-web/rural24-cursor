// ============================================================
// WIZARD BLOCK TYPES — Sprint 8B
// Contrato de props compartido entre BlockRenderer y bloques
// ============================================================

import type React from 'react';
import type { UploadedImage } from '../SimpleImageUploader/SimpleImageUploader';
import type { Province } from '../../services/v2/locationsService';
import type { Category, Subcategory } from '../../types/v2';

export interface AutoFillContext {
  categoria: string;
  categorySlug: string;
  subcategoria: string;
  subcategorySlug: string;
  marca?: string;
  modelo?: string;
  año?: string;
  condicion?: string;
  provincia: string;
  localidad: string;
  atributos: Record<string, string>;
}

/** Props completas que PublicarAviso pasa a BlockRenderer */
export interface WizardBlockProps {
  // ── Price ────────────────────────────────────────────────
  price: string;
  setPrice: (v: string) => void;
  currency: 'ARS' | 'USD';
  setCurrency: (v: 'ARS' | 'USD') => void;
  priceUnit: string;
  setPriceUnit: (v: string) => void;
  priceUnitOptions: { value: string; label: string }[];
  priceType: string;
  setPriceType: (v: string) => void;

  // ── Location ─────────────────────────────────────────────
  province: string;
  setProvince: (v: string) => void;
  locality: string;
  setLocality: (v: string) => void;
  provinces: Province[];

  // ── Images ───────────────────────────────────────────────
  uploadedImages: UploadedImage[];
  uploadedImagesRef: React.MutableRefObject<UploadedImage[]>;
  onImagesChange: (images: UploadedImage[]) => void;

  // ── Title / Description ──────────────────────────────────
  title: string;
  description: string;
  titleError: string | null;
  descriptionError: string | null;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  autoFillContext: AutoFillContext;

  // ── Color picker ─────────────────────────────────────────
  bgColor: string;
  setBgColor: (v: string) => void;

  // ── Avatar upload ─────────────────────────────────────────
  avatarUrl: string;
  setAvatarUrl: (v: string) => void;

  // ── Empresa selector ─────────────────────────────────────
  selectedBusinessProfileId: string | null;
  onBusinessProfileChange: (id: string | null) => void;

  // ── Dynamic fields ───────────────────────────────────────
  categoryId: string;
  subcategoryId: string;
  categoryDisplayName: string;
  subcategoryDisplayName: string;
  selectedPageType: 'particular' | 'empresa';
  attributeValues: Record<string, any>;
  onAttributeChange: (name: string, value: any) => void;
  expandedGroup: string;
  onGroupToggle: (id: string) => void;
  completedGroups: Set<string>;
  categories: Category[];
  subcategories: Subcategory[];
  onChangeCategory: () => void;
}
