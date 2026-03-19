import { useState, useEffect, useRef } from 'react';
import { validateTitle, validateDescription } from '../../../../utils/contentValidator';

interface UseWizardValidationResult {
  titleError: string | null;
  descriptionError: string | null;
}

export function useWizardValidation(title: string, description: string): UseWizardValidationResult {
  const [titleError, setTitleError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const titleTimer = useRef<NodeJS.Timeout | null>(null);
  const descTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => {
      const result = validateTitle(title);
      setTitleError(result.isValid ? null : result.error || null);
    }, 400);
    return () => {
      if (titleTimer.current) clearTimeout(titleTimer.current);
    };
  }, [title]);

  useEffect(() => {
    if (descTimer.current) clearTimeout(descTimer.current);
    descTimer.current = setTimeout(() => {
      const result = validateDescription(description);
      setDescriptionError(result.isValid ? null : result.error || null);
    }, 400);
    return () => {
      if (descTimer.current) clearTimeout(descTimer.current);
    };
  }, [description]);

  return { titleError, descriptionError };
}
