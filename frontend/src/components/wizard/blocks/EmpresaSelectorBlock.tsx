import React from 'react';
import { EmpresaSelectorWidget } from '../../dashboard/EmpresaSelectorWidget';
import type { WizardBlockProps } from '../wizardTypes';

interface Props extends Pick<WizardBlockProps, 'selectedBusinessProfileId' | 'onBusinessProfileChange'> {}

export function EmpresaSelectorBlock({ selectedBusinessProfileId, onBusinessProfileChange }: Props) {
  return (
    <EmpresaSelectorWidget
      selectedId={selectedBusinessProfileId}
      onChange={onBusinessProfileChange}
    />
  );
}
