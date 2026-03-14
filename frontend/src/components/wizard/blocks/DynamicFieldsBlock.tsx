import { DynamicFormLoader } from '../../forms/DynamicFormLoader';
import type { WizardBlockProps } from '../wizardTypes';

interface Props extends Pick<WizardBlockProps,
  'categoryId' | 'subcategoryId' | 'subcategoryDisplayName' |
  'attributeValues' | 'onAttributeChange' |
  'expandedGroup' | 'onGroupToggle' | 'completedGroups'
> {}

export function DynamicFieldsBlock({
  categoryId, subcategoryId,
  subcategoryDisplayName,
  attributeValues, onAttributeChange,
  expandedGroup, onGroupToggle, completedGroups,
}: Props) {
  return (
    <DynamicFormLoader
      subcategoryId={subcategoryId}
      categoryId={categoryId || undefined}
      categoryName={categoryId}
      subcategoryName={subcategoryDisplayName}
      values={attributeValues}
      onChange={onAttributeChange}
      errors={{}}
      expandedGroup={expandedGroup}
      onGroupToggle={onGroupToggle}
      completedGroups={completedGroups}
    />
  );
}
