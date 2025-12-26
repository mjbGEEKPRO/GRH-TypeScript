/**
 * Utilitaires pour générer des messages de salutation en fonction de l'heure
 */

// Types
type GreetingType = "morning" | "afternoon" | "evening";

interface GreetingConfig {
  message: string;
  type: GreetingType;
  emoji?: string;
}

// Configuration des plages horaires
const TIME_RANGES = {
  morning: { start: 6, end: 12 },
  afternoon: { start: 12, end: 18 },
  evening: { start: 18, end: 6 }, // 18h-6h (inclut la nuit)
} as const;

/**
 * Retourne un message de salutation en fonction de l'heure actuelle
 * - 6h-12h : "Bonjour"
 * - 12h-18h : "Bon après-midi"
 * - 18h-6h : "Bonsoir"
 * 
 * @returns Message de salutation approprié
 */
export const getGreeting = (): string => {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= TIME_RANGES.afternoon.start && hour < TIME_RANGES.afternoon.end) {
    return "Bon après-midi";
  } else if (hour >= TIME_RANGES.evening.start || hour < TIME_RANGES.morning.start) {
    return "Bonsoir";
  } else {
    return "Bonjour";
  }
};

/**
 * Retourne un objet de salutation détaillé avec emoji
 * @param includeEmoji - Inclure un emoji dans le message (défaut: false)
 * @returns Objet contenant le message, le type et l'emoji optionnel
 */
export const getGreetingWithDetails = (includeEmoji: boolean = false): GreetingConfig => {
  const now = new Date();
  const hour = now.getHours();

  let config: GreetingConfig;

  if (hour >= TIME_RANGES.afternoon.start && hour < TIME_RANGES.afternoon.end) {
    config = {
      message: "Bon après-midi",
      type: "afternoon",
      emoji: includeEmoji ? "☀️" : undefined,
    };
  } else if (hour >= TIME_RANGES.evening.start || hour < TIME_RANGES.morning.start) {
    config = {
      message: "Bonsoir",
      type: "evening",
      emoji: includeEmoji ? "🌙" : undefined,
    };
  } else {
    config = {
      message: "Bonjour",
      type: "morning",
      emoji: includeEmoji ? "🌅" : undefined,
    };
  }

  return config;
};

/**
 * Retourne un message de salutation personnalisé avec le nom
 * @param name - Nom de la personne à saluer
 * @param includeEmoji - Inclure un emoji (défaut: false)
 * @returns Message de salutation personnalisé
 * 
 * @example
 * getPersonalizedGreeting("Jean") // "Bonjour Jean"
 * getPersonalizedGreeting("Jean", true) // "Bonjour Jean 🌅"
 */
export const getPersonalizedGreeting = (name: string, includeEmoji: boolean = false): string => {
  const greeting = getGreeting();
  const details = getGreetingWithDetails(includeEmoji);
  
  if (includeEmoji && details.emoji) {
    return `${greeting} ${name} ${details.emoji}`;
  }
  
  return `${greeting} ${name}`;
};

/**
 * Vérifie si c'est le matin
 * @returns true si l'heure actuelle est entre 6h et 12h
 */
export const isMorning = (): boolean => {
  const hour = new Date().getHours();
  return hour >= TIME_RANGES.morning.start && hour < TIME_RANGES.morning.end;
};

/**
 * Vérifie si c'est l'après-midi
 * @returns true si l'heure actuelle est entre 12h et 18h
 */
export const isAfternoon = (): boolean => {
  const hour = new Date().getHours();
  return hour >= TIME_RANGES.afternoon.start && hour < TIME_RANGES.afternoon.end;
};

/**
 * Vérifie si c'est le soir/la nuit
 * @returns true si l'heure actuelle est entre 18h et 6h
 */
export const isEvening = (): boolean => {
  const hour = new Date().getHours();
  return hour >= TIME_RANGES.evening.start || hour < TIME_RANGES.morning.start;
};

export default getGreeting;