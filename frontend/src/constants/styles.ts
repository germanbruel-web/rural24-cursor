/**
 * Clases Tailwind compartidas — DRY.
 * Importar en lugar de redefinir en cada componente.
 */

export const formStyles = {
  input: 'w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-400',
  inputError: 'w-full px-4 py-3 text-base bg-white border-2 border-red-500 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder:text-gray-400',
  label: 'block text-sm font-semibold text-gray-700 mb-2',
  help: 'mt-1.5 text-sm text-gray-500',
  errorText: 'mt-1.5 text-sm text-red-600 flex items-center gap-1',
} as const;
