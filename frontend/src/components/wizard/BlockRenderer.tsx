// ============================================================
// BLOCK RENDERER — Sprint 8B
// Renderiza el bloque correcto según block.type
// Cada bloque lee del WizardBlockProps lo que necesita
// ============================================================

import React from 'react';
import type { WizardBlock } from '../../services/v2/wizardConfigService';
import type { WizardBlockProps } from './wizardTypes';

import { PriceBlock }           from './blocks/PriceBlock';
import { LocationBlock }         from './blocks/LocationBlock';
import { ImagesBlock }           from './blocks/ImagesBlock';
import { TitleDescriptionBlock } from './blocks/TitleDescriptionBlock';
import { DynamicFieldsBlock }    from './blocks/DynamicFieldsBlock';
import { EmpresaSelectorBlock }  from './blocks/EmpresaSelectorBlock';

interface Props {
  block: WizardBlock;
  wizardProps: WizardBlockProps;
}

export function BlockRenderer({ block, wizardProps: p }: Props) {
  switch (block.type) {

    case 'dynamic_fields':
      return (
        <DynamicFieldsBlock
          categoryId={p.categoryId}
          subcategoryId={p.subcategoryId}
          categoryDisplayName={p.categoryDisplayName}
          subcategoryDisplayName={p.subcategoryDisplayName}
          selectedPageType={p.selectedPageType}
          attributeValues={p.attributeValues}
          onAttributeChange={p.onAttributeChange}
          expandedGroup={p.expandedGroup}
          onGroupToggle={p.onGroupToggle}
          completedGroups={p.completedGroups}
          categories={p.categories}
          subcategories={p.subcategories}
          onChangeCategory={p.onChangeCategory}
        />
      );

    case 'empresa_selector':
      return (
        <EmpresaSelectorBlock
          selectedBusinessProfileId={p.selectedBusinessProfileId}
          onBusinessProfileChange={p.onBusinessProfileChange}
        />
      );

    case 'price':
      return (
        <PriceBlock
          price={p.price}
          setPrice={p.setPrice}
          currency={p.currency}
          setCurrency={p.setCurrency}
          priceUnit={p.priceUnit}
          setPriceUnit={p.setPriceUnit}
          priceUnitOptions={p.priceUnitOptions}
          config={block.config}
        />
      );

    case 'location':
      return (
        <LocationBlock
          province={p.province}
          setProvince={p.setProvince}
          locality={p.locality}
          setLocality={p.setLocality}
          provinces={p.provinces}
        />
      );

    case 'images':
      return (
        <ImagesBlock
          uploadedImages={p.uploadedImages}
          uploadedImagesRef={p.uploadedImagesRef}
          onImagesChange={p.onImagesChange}
          config={block.config}
        />
      );

    case 'title_description':
      return (
        <TitleDescriptionBlock
          title={p.title}
          description={p.description}
          titleError={p.titleError}
          descriptionError={p.descriptionError}
          onTitleChange={p.onTitleChange}
          onDescriptionChange={p.onDescriptionChange}
          autoFillContext={p.autoFillContext}
          config={block.config}
        />
      );

    default:
      return null;
  }
}
