import { object, string, ObjectSchema } from "yup";

// Interface pour les données de validation
interface LoginFormData {
  email_pro: string;
  password: string;
}

// Schéma de validation avec typage TypeScript
const validateSchem: ObjectSchema<LoginFormData> = object().shape({
  email_pro: string()
    .matches(
      /@serdi\.cm$/,
      "L'adresse email doit être sous ce format (exp@serdi.cm)"
    )
    .required("Veuillez renseigner l'email"),

  password: string()
    .required("Veuillez renseigner votre mot de passe")
    .min(8, "Le mot de passe doit avoir au moins 8 caractères")
    .matches(
      /[A-Z]/,
      "Votre mot de passe doit contenir au moins une majuscule"
    ),
});

export default validateSchem;
export type { LoginFormData };
