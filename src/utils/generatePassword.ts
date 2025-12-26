/**
 * Utilitaires pour la génération de mots de passe sécurisés
 */

// Constantes pour les caractères autorisés
const PASSWORD_CHARS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  specialChars: "@$!%*#?&",
} as const;

// Configuration par défaut
const PASSWORD_CONFIG = {
  minLength: 12,
  maxLength: 16,
  defaultLength: 12,
} as const;

/**
 * Sélectionne un caractère aléatoire dans une chaîne donnée
 * @param chars - Chaîne de caractères à utiliser
 * @returns Un caractère aléatoire
 */
const getRandomChar = (chars: string): string => {
  return chars.charAt(Math.floor(Math.random() * chars.length));
};

/**
 * Mélange les éléments d'un tableau (algorithme Fisher-Yates)
 * @param array - Tableau à mélanger (modifié en place)
 */
const shuffleArray = <T>(array: T[]): void => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

/**
 * Génère un mot de passe sécurisé
 * Le mot de passe contient obligatoirement :
 * - Au moins une minuscule
 * - Au moins une majuscule
 * - Au moins un chiffre
 * - Au moins un caractère spécial (@$!%*#?&)
 * 
 * @param length - Longueur souhaitée du mot de passe (défaut: 12)
 * @returns Un mot de passe sécurisé aléatoire
 * @throws Error si la longueur est invalide
 */
export const generatePassword = (length: number = PASSWORD_CONFIG.defaultLength): string => {
  // Validation de la longueur
  if (length < PASSWORD_CONFIG.minLength) {
    throw new Error(`Le mot de passe doit contenir au moins ${PASSWORD_CONFIG.minLength} caractères`);
  }

  if (length > PASSWORD_CONFIG.maxLength) {
    throw new Error(`Le mot de passe ne peut pas dépasser ${PASSWORD_CONFIG.maxLength} caractères`);
  }

  // Garantir au moins un caractère de chaque type
  const password: string[] = [
    getRandomChar(PASSWORD_CHARS.lowercase),
    getRandomChar(PASSWORD_CHARS.uppercase),
    getRandomChar(PASSWORD_CHARS.digits),
    getRandomChar(PASSWORD_CHARS.specialChars),
  ];

  // Remplir le reste avec des caractères aléatoires
  const allChars = 
    PASSWORD_CHARS.lowercase + 
    PASSWORD_CHARS.uppercase + 
    PASSWORD_CHARS.digits + 
    PASSWORD_CHARS.specialChars;

  for (let i = 4; i < length; i++) {
    password.push(getRandomChar(allChars));
  }

  // Mélanger pour éviter un motif prévisible
  shuffleArray(password);

  return password.join("");
};

/**
 * Valide la force d'un mot de passe
 * @param password - Mot de passe à valider
 * @returns Objet contenant la force et les critères validés
 */
export const validatePasswordStrength = (password: string): {
  isStrong: boolean;
  score: number;
  criteria: {
    hasLowercase: boolean;
    hasUppercase: boolean;
    hasDigit: boolean;
    hasSpecialChar: boolean;
    hasMinLength: boolean;
  };
} => {
  const criteria = {
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasSpecialChar: /[@$!%*#?&]/.test(password),
    hasMinLength: password.length >= PASSWORD_CONFIG.minLength,
  };

  const score = Object.values(criteria).filter(Boolean).length;
  const isStrong = score === 5;

  return { isStrong, score, criteria };
};

/**
 * Génère plusieurs mots de passe et retourne le plus fort
 * @param count - Nombre de mots de passe à générer
 * @param length - Longueur souhaitée
 * @returns Le mot de passe le plus fort
 */
export const generateStrongestPassword = (
  count: number = 5,
  length: number = PASSWORD_CONFIG.defaultLength
): string => {
  const passwords = Array.from({ length: count }, () => generatePassword(length));
  
  return passwords.reduce((strongest, current) => {
    const currentStrength = validatePasswordStrength(current);
    const strongestStrength = validatePasswordStrength(strongest);
    
    return currentStrength.score >= strongestStrength.score ? current : strongest;
  });
};

export default generatePassword;