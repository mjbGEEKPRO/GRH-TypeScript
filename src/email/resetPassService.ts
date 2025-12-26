import emailjs from '@emailjs/browser';
import getGreeting from '../utils/greeting';

// Configuration EmailJS (à déplacer dans .env)
const EMAILJS_CONFIG = {
  serviceId: 'service_agd3g1c',
  templates: {
    passwordChange: 'template_16fe255',
    taskAssignment: 'template_task123', // À remplacer par votre ID
  },
  publicKey: 'xdfZm5dV41Ewzjb3R',
} as const;

// Interfaces
interface ResetPasswordParams {
  greeting: string;
  name: string;
  password: string;
  professional_email: string;
  email: string;
}

/**
 * Envoie un email de réinitialisation de mot de passe
 * @param email - Adresse email professionnelle de l'utilisateur
 * @param nom - Nom complet de l'utilisateur
 * @param newPassword - Nouveau mot de passe temporaire
 * @returns Promise<boolean> - true si l'envoi réussit, false sinon
 */
export const resetPass = async (
  email: string,
  nom: string,
  newPassword: string
): Promise<boolean> => {
  try {
    const params: ResetPasswordParams = {
      greeting: getGreeting(),
      name: nom,
      password: newPassword,
      professional_email: email,
      email: email,
    };

    console.log("Tentative d'envoi email vers:", email);
    
    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.passwordChange,
      params,
      EMAILJS_CONFIG.publicKey
    );
    
    // Délai pour s'assurer que l'email est bien envoyé
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    
    console.log("✅ Email de réinitialisation envoyé avec succès");
    return true;
    
  } catch (error: any) {
    console.error("❌ Erreur envoi email de réinitialisation:", error);
    console.error("Détails:", error.message || error);
    return false;
  }
};

/**
 * Envoie un email d'assignation de tâche
 * @param email - Adresse email du destinataire
 * @param nom - Nom du destinataire
 * @param taskDetails - Détails de la tâche
 * @returns Promise<boolean>
 */
export const sendTaskAssignment = async (
  email: string,
  nom: string,
  taskDetails: {
    title: string;
    description: string;
    deadline?: string;
    priority?: string;
  }
): Promise<boolean> => {
  try {
    const params = {
      greeting: getGreeting(),
      name: nom,
      email: email,
      task_title: taskDetails.title,
      task_description: taskDetails.description,
      task_deadline: taskDetails.deadline || 'Non spécifié',
      task_priority: taskDetails.priority || 'Normale',
    };

    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.taskAssignment,
      params,
      EMAILJS_CONFIG.publicKey
    );
    
    console.log("✅ Email d'assignation de tâche envoyé");
    return true;
    
  } catch (error: any) {
    console.error("❌ Erreur envoi email d'assignation:", error);
    return false;
  }
};

export default resetPass;