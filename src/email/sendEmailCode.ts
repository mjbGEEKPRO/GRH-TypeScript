import emailjs from "@emailjs/browser";
import getGreeting from "../utils/greeting";

// Configuration EmailJS (à déplacer dans .env)
const EMAILJS_CONFIG = {
  serviceId: "service_agd3g1c",
  templateId: "template_l6fe2s5",
  publicKey: "xdfZm5dY4lEwzjD3B",
} as const;

// Interfaces
interface EmailCodeParams {
  greeting: string;
  name: string;
  passcode: string;
  email: string;
}

/**
 * Envoie un code de vérification par email
 * @param email - Adresse email du destinataire
 * @param nom - Nom complet du destinataire
 * @param code - Code de vérification à envoyer
 * @returns Promise<boolean> - true si l'envoi réussit, false sinon
 */
export const sendEmailWithCode = async (
  email: string,
  nom: string,
  code: string
): Promise<boolean> => {
  try {
    const params: EmailCodeParams = {
      greeting: getGreeting(),
      name: nom,
      passcode: code,
      email: email,
    };

    console.log("📧 Tentative d'envoi email vers:", email);

    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      params,
      EMAILJS_CONFIG.publicKey
    );

    // Délai pour s'assurer que l'email est bien envoyé
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));

    console.log("✅ Email avec code envoyé avec succès");
    return true;
  } catch (error: any) {
    console.error("❌ Erreur envoi email avec code:", error);
    console.error("Détails:", error.message || error);
    return false;
  }
};

export default sendEmailWithCode;