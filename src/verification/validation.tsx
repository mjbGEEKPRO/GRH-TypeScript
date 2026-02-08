import { object, string, date } from "yup";
import type { ObjectSchema } from "yup";

interface ValidationSchemaType {
  nom: string;
  prenom: string;
  email: string;
  poste: string;
  telephone: string;
  date_naissance: Date;
  lieu_naissance: string;
}

const schema: ObjectSchema<ValidationSchemaType> = object().shape({
  nom: string()
    .min(2, "le nom est trop court")
    .matches(/^[A-Za-zÀ-ÿ\s'-]+$/, "le nom ne doit contenir que des lettres")
    .required("Veuillez renseigner le nom"),
  prenom: string()
    .min(2, "le prenom est trop court")
    .matches(/^[A-Za-zÀ-ÿ\s'-]+$/, "le prenom ne doit contenir que des lettres")
    .required("Veuillez renseigner le prénom"),
  email: string()
    .matches(
      /^[a-z][a-z0-9._-]*@gmail.com$/,
      "L'e-mail doit commencer par une lettre et être en minuscules exemple (jeremy@gmail.com)"
    )
    .required("L'adresse email est requise"),
  poste: string()
    .matches(/^[A-Za-zÀ-ÿ\s'-]+$/, "le poste ne doit contenir que des lettres")
    .required("Le poste est requis"),
  telephone: string()
    .matches(
      /^[62]\d{8}$/,
      "le numéro doit commencer par 6 ou 2 et contenir 9 chiffres"
    )
    .required("Veuillez renseigner le numéro de téléphone"),
  date_naissance: date()
    .required("La date de naissance est requise")
    .min(new Date("1927-01-01"), "L'année doit être supérieure à 1927")
    .max(new Date("2025-12-31"), "L'année doit être inférieure à 2025"),
  lieu_naissance: string()
    .required("Le lieu de naissance est requis")
    .min(2, "Minimum 2 caractères")
    .max(100, "Maximum 100 caractères")
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Caractères non valides"),
  // password: string()
  //   .required("Le mot de passe est requis")
  //   .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  //   .matches(/[a-z]/, "Au moins une lettre minuscule")
  //   .matches(/[A-Z]/, "Au moins une lettre majuscule")
  //   .matches(/\d/, "Au moins un chiffre")
  //   .matches(/[@$!%*#?&]/, "Au moins un caractère spécial (@$!%*?&)"),
});

export default schema;