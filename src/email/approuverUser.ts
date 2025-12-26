import { getGreeting } from "../utils/greeting";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import emailjs from "@emailjs/browser";

// Interfaces
interface Utilisateur {
  nom: string;
  prenom: string;
  email: string;
  role: string;
  departement: string;
}

interface EmailParams {
  greeting: string;
  name: string;
  email: string;
  email_pro: string;
  password_pro: string;
  role: string;
  departement: string;
}

// Configuration EmailJS (à déplacer dans un fichier .env)
const EMAILJS_CONFIG = {
  serviceId: "service_agd3g1c",
  templateId: "template_hgw8gst",
  publicKey: "xdfZm5dY4lEwzjD3B",
} as const;

/**
 * Envoie les identifiants professionnels par email à un nouvel utilisateur
 * @param utilisateur - Informations de l'utilisateur
 * @param emailPro - Adresse email professionnelle
 * @param motDePassePro - Mot de passe professionnel
 * @throws Error si l'envoi échoue
 */
export const envoyerEmailIdentifiants = async (
  utilisateur: Utilisateur,
  emailPro: string,
  motDePassePro: string

): Promise<void> => {
  try {
    const params: EmailParams = {
      greeting: getGreeting(),
      name: `${utilisateur.nom} ${utilisateur.prenom}`,
      email: utilisateur.email,
      email_pro: emailPro,
      password_pro: motDePassePro,
      role: utilisateur.role,
      departement: utilisateur.departement,
    };

    console.log("📧 Envoi email identifiants:", params);

    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      params,
      EMAILJS_CONFIG.publicKey
    );

    console.log("✅ Email d'identifiants envoyé avec succès");
    toast.success("📧 Identifiants envoyés par email");
  } catch (error: any) {
    console.error("❌ Erreur envoi email identifiants:", error);
    toast.error("Erreur lors de l'envoi de l'email");
    throw new Error(`Échec de l'envoi de l'email: ${error.message}`);
  }
};

export default envoyerEmailIdentifiants;