import * as Yup from "yup";

// Schéma de validation pour l'étape 1 - Email
export const emailSchema = Yup.object().shape({
  email: Yup.string()
    .matches(
      /^[a-z][a-z0-9._-]*@gmail.com$/,
      "L'e-mail doit commencer par une lettre et être en minuscules exemple (jeremy@gmail.com)"
    )
    .required("L'adresse email est requise"),
});

// Schéma de validation pour l'étape 2 - Code de vérification
export const codeSchema = Yup.object().shape({
  code: Yup.string()
    .required("Le code de vérification est obligatoire")
    .matches(/^\d{6}$/, "Le code doit contenir exactement 6 chiffres")
    .length(6, "Le code doit contenir exactement 6 chiffres"),
});

// Schéma de validation pour l'étape 3 - Nouveau mot de passe
export const passwordSchema = Yup.object().shape({
  newPassword: Yup.string()
    .required("Le mot de passe est requis")
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .matches(/[a-z]/, "Au moins une lettre minuscule")
    .matches(/[A-Z]/, "Au moins une lettre majuscule")
    .matches(/\d/, "Au moins un chiffre")
    .matches(/[@$!%*#?&]/, "Au moins un caractère spécial (@$!%*?&)"),
  confirmPassword: Yup.string()
    .required("Le mot de passe est requis")
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .matches(/[a-z]/, "Au moins une lettre minuscule")
    .matches(/[A-Z]/, "Au moins une lettre majuscule")
    .matches(/\d/, "Au moins un chiffre")
    .matches(/[@$!%*#?&]/, "Au moins un caractère spécial (@$!%*?&)"),
});

// Fonctions utilitaires pour valider individuellement
export const validateEmail = async (email: string) => {
  try {
    await emailSchema.validate({ email });
    return { isValid: true, errors: null };
  } catch (error: Any) {
    return { isValid: false, errors: error.message };
  }
};

export const validateCode = async (code: string) => {
  try {
    await codeSchema.validate({ code });
    return { isValid: true, errors: null };
  } catch (error: Any) {
    return { isValid: false, errors: error.message };
  }
};

export const validatePasswords = async (newPassword: string, confirmPassword: string) => {
  try {
    await passwordSchema.validate({ newPassword, confirmPassword });
    return { isValid: true, errors: null };
  } catch (error) {
    return { isValid: false, errors: error.message };
  }
};
