import { useState, useEffect, useRef } from 'react';
import type { UploadedImage } from '../../../SimpleImageUploader/SimpleImageUploader';
import type { PriceConfig } from '../../../../types/v2';
import { getOptionListItemsByName } from '../../../../services/v2/optionListsService';
import { getFormForContext } from '../../../../services/v2/formsService';
import { getWizardConfig, DEFAULT_STEPS, type WizardStep } from '../../../../services/v2/wizardConfigService';
import { DraftManager, updateDraftURL, parseDraftURL, type DraftState } from '../../../../utils/draftManager';
import { validateTitle, validateDescription } from '../../../../utils/contentValidator';
import { useAccount } from '../../../../contexts/AccountContext';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function usePublicarWizardState(isEditMode: boolean) {
  const { activeAccount } = useAccount();

  // Wizard navigation
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardSteps, setWizardSteps] = useState<WizardStep[]>(DEFAULT_STEPS);
  const [draftId, setDraftId] = useState<string>('');
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  // Step 1: Category selection UI state
  const [expandedCategory, setExpandedCategory] = useState<string>('');
  const [expandedL2Sub, setExpandedL2Sub] = useState<string>('');
  const [mobileNavLevel, setMobileNavLevel] = useState<1 | 2 | 3>(1);
  const [drillDirection, setDrillDirection] = useState<'forward' | 'back'>('forward');
  const [showProfileGate, setShowProfileGate] = useState(false);
  const [pendingSubcategoryName, setPendingSubcategoryName] = useState<string>('');
  const [selectedBusinessProfileId, setSelectedBusinessProfileId] = useState<string | null>(
    activeAccount.type === 'empresa' ? activeAccount.id : null
  );

  // Step 1: Category values
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedPageType, setSelectedPageType] = useState<'particular' | 'empresa'>('particular');

  // Step 2: Attributes
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>({});
  const [expandedAttributeGroup, setExpandedAttributeGroup] = useState<string>('');
  const [completedGroups, setCompletedGroups] = useState<Set<string>>(new Set());

  // Step 3: Location
  const [province, setProvince] = useState('');
  const [locality, setLocality] = useState('');

  // Step 4: Photos
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const uploadedImagesRef = useRef<UploadedImage[]>([]);

  // Step 5: Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [priceUnit, setPriceUnit] = useState('');
  const [priceType, setPriceType] = useState('');
  const [priceConfig, setPriceConfig] = useState<PriceConfig | null>(null);
  const [priceUnitOptions, setPriceUnitOptions] = useState<{ value: string; label: string }[]>([]);
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [suggestedDescriptions, setSuggestedDescriptions] = useState<string[]>([]);
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number | null>(null);
  const [selectedDescIndex, setSelectedDescIndex] = useState<number | null>(null);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [titleDebounceTimer, setTitleDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [descDebounceTimer, setDescDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // ── Wizard config: reload when category changes ──
  useEffect(() => {
    getWizardConfig(selectedCategory || null).then(setWizardSteps);

    if (selectedSubcategory) {
      getFormForContext(selectedCategory || undefined, selectedSubcategory)
        .then((form) => {
          const cfg = form?.price_config ?? null;
          setPriceConfig(cfg);
          setPriceUnit('');
          if (cfg?.units_list) {
            getOptionListItemsByName(cfg.units_list).then(setPriceUnitOptions).catch(() => setPriceUnitOptions([]));
          } else {
            setPriceUnitOptions([]);
          }
        })
        .catch(() => { setPriceConfig(null); setPriceUnitOptions([]); });
    } else {
      setPriceConfig(null);
      setPriceUnitOptions([]);
    }
  }, [selectedCategory, selectedSubcategory]);

  // ── Auto-save draft ──
  useEffect(() => {
    if (!draftId) return;
    if (isEditMode) return;

    const currentState: DraftState = {
      draftId,
      currentStep,
      lastModified: Date.now(),
      selectedCategory,
      selectedSubcategory,
      selectedCategoryType: '',
      selectedPageType,
      attributeValues,
      province,
      locality,
      uploadedImages,
      title,
      description,
      price,
      currency,
    };
    setLastSaved(Date.now());
    DraftManager.saveDraft(currentState);
    updateDraftURL(draftId, currentStep);
  }, [
    draftId,
    isEditMode,
    currentStep,
    selectedCategory,
    selectedSubcategory,
    selectedPageType,
    attributeValues,
    province,
    locality,
    uploadedImages,
    title,
    description,
    price,
    currency,
  ]);

  // ── Draft init / recovery ──
  function initializeOrRecoverDraft() {
    if (window.location.hash.match(/^#\/edit\//)) return;

    const urlParams = parseDraftURL();

    if (urlParams.draftId) {
      const draft = DraftManager.loadDraft(urlParams.draftId);
      if (draft) { restoreDraftState(draft); return; }
    }

    const activeDraftId = DraftManager.getActiveDraftId();
    if (activeDraftId) {
      const draft = DraftManager.loadDraft(activeDraftId);
      if (draft) {
        restoreDraftState(draft);
        updateDraftURL(draft.draftId, draft.currentStep);
        return;
      }
    }

    const newDraftId = DraftManager.generateDraftId();
    setDraftId(newDraftId);
    updateDraftURL(newDraftId, 1);
  }

  function restoreDraftState(draft: DraftState) {
    setDraftId(draft.draftId);
    setCurrentStep(draft.currentStep);
    setSelectedCategory(UUID_REGEX.test(draft.selectedCategory) ? draft.selectedCategory : '');
    setSelectedSubcategory(UUID_REGEX.test(draft.selectedSubcategory) ? draft.selectedSubcategory : '');
    setSelectedPageType((draft.selectedPageType as 'particular' | 'empresa') || 'particular');
    setAttributeValues(draft.attributeValues);
    setProvince(draft.province);
    setLocality(draft.locality);
    setUploadedImages(draft.uploadedImages);
    uploadedImagesRef.current = draft.uploadedImages;
    setTitle(draft.title);
    setDescription(draft.description);
    setPrice(draft.price);
    setCurrency(draft.currency);
    setPriceUnit((draft as any).priceUnit || '');
  }

  function cleanupOldDrafts() {
    DraftManager.cleanOldDrafts();
  }

  function deleteDraft() {
    if (draftId) DraftManager.deleteDraft(draftId);
  }

  function resetToNewDraft() {
    setCurrentStep(1);
    setSelectedCategory('');
    setSelectedSubcategory('');
    setAttributeValues({});
    setProvince('');
    setLocality('');
    setUploadedImages([]);
    uploadedImagesRef.current = [];
    setTitle('');
    setDescription('');
    setPrice('');
    setExpandedAttributeGroup('');
    setCompletedGroups(new Set());
    const newDraftId = DraftManager.generateDraftId();
    setDraftId(newDraftId);
    updateDraftURL(newDraftId, 1);
  }

  // ── Anti-fraud validation with debounce ──
  function handleTitleChange(value: string) {
    setTitle(value);
    if (titleDebounceTimer) clearTimeout(titleDebounceTimer);
    const timer = setTimeout(() => {
      const result = validateTitle(value);
      setTitleError(result.isValid ? null : result.error || null);
    }, 400);
    setTitleDebounceTimer(timer);
  }

  function handleDescriptionChange(value: string) {
    setDescription(value);
    if (descDebounceTimer) clearTimeout(descDebounceTimer);
    const timer = setTimeout(() => {
      const result = validateDescription(value);
      setDescriptionError(result.isValid ? null : result.error || null);
    }, 400);
    setDescDebounceTimer(timer);
  }

  function handleImagesChange(images: UploadedImage[]) {
    setUploadedImages(images);
    uploadedImagesRef.current = images;
  }

  return {
    // Navigation
    currentStep, setCurrentStep,
    wizardSteps,
    draftId,
    lastSaved,
    // Step 1 UI
    expandedCategory, setExpandedCategory,
    expandedL2Sub, setExpandedL2Sub,
    mobileNavLevel, setMobileNavLevel,
    drillDirection, setDrillDirection,
    showProfileGate, setShowProfileGate,
    pendingSubcategoryName, setPendingSubcategoryName,
    selectedBusinessProfileId, setSelectedBusinessProfileId,
    // Step 1 values
    selectedCategory, setSelectedCategory,
    selectedSubcategory, setSelectedSubcategory,
    selectedPageType, setSelectedPageType,
    // Step 2
    attributeValues, setAttributeValues,
    expandedAttributeGroup, setExpandedAttributeGroup,
    completedGroups, setCompletedGroups,
    // Step 3
    province, setProvince,
    locality, setLocality,
    // Step 4
    uploadedImages, uploadedImagesRef,
    handleImagesChange,
    // Step 5
    title, setTitle,
    description, setDescription,
    bgColor, setBgColor,
    avatarUrl, setAvatarUrl,
    price, setPrice,
    currency, setCurrency,
    priceUnit, setPriceUnit,
    priceType, setPriceType,
    priceConfig,
    priceUnitOptions,
    suggestedTitles, setSuggestedTitles,
    suggestedDescriptions, setSuggestedDescriptions,
    selectedTitleIndex, setSelectedTitleIndex,
    selectedDescIndex, setSelectedDescIndex,
    generatingContent, setGeneratingContent,
    titleError,
    descriptionError,
    handleTitleChange,
    handleDescriptionChange,
    // Draft helpers
    initializeOrRecoverDraft,
    cleanupOldDrafts,
    deleteDraft,
    resetToNewDraft,
    restoreDraftState,
    // UUID validation (used by submit and edit mode)
    UUID_REGEX,
  };
}
