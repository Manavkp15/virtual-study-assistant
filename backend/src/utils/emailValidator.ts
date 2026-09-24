/**
 * Email validation and normalization utility
 * Enforces proper email formatting and RFC compliance on the backend.
 */

export const normalizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;

  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;

  // Disallow spaces inside email
  if (/\s/.test(trimmed)) return false;

  // Disallow double dots
  if (trimmed.includes('..')) return false;

  // Check structure: localPart@domain.tld
  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;

  const [localPart, domainPart] = parts;
  if (!localPart || !domainPart) return false;
  if (localPart.length > 64 || domainPart.length > 255) return false;

  // Disallow leading or trailing dots in local part or domain part
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
  if (domainPart.startsWith('.') || domainPart.endsWith('.')) return false;

  // Local part validation: alphanumeric + allowed special chars
  const localRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
  if (!localRegex.test(localPart)) return false;

  // Domain part must contain at least one dot separating labels
  const domainLabels = domainPart.split('.');
  if (domainLabels.length < 2) return false;

  // Validate each domain label
  const labelRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
  for (const label of domainLabels) {
    if (!label || label.length > 63) return false;
    if (!labelRegex.test(label)) return false;
  }

  // TLD (last domain label) must be strictly letters and at least 2 characters long (e.g., .com, .org, .in, .edu)
  const tld = domainLabels[domainLabels.length - 1];
  const tldRegex = /^[a-zA-Z]{2,}$/;
  if (!tldRegex.test(tld)) return false;

  return true;
};
