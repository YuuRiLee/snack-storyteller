// shadcn/ui components will be added here
// For Phase 1, we just export a utility function

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Export placeholder - shadcn components will be added in later phases
export {};
