import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import schema from "../verification/validation";
import api from "../utils/api";
import { toast, ToastContainer } from "react-toastify";
import type { Id } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "../composant/interface/select";
import type { AxiosError } from "axios";
import type { ValidationError } from "yup";

interface FormulaireData {
  nom: string;
  prenom: string;
  email: string;
  poste: string;
  telephone: string;
  date_naissance: string;
  lieu_naissance: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface ApiErrorResponse {
  message: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
}

const Formulaire: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [infos, setInfos] = useState<FormulaireData>({
    nom: "",
    prenom: "",
    email: "",
    poste: "",
    telephone: "",
    date_naissance: "",
    lieu_naissance: "",
  });

  const [erreur, setErreur] = useState<ValidationErrors>({});

  const Valeur = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInfos({
      ...infos,
      [e.target.name]: e.target.value,
    });
  };

  const PosteChange = (selectedPoste: string): void => {
    setInfos({
      ...infos,
      poste: selectedPoste,
    });
  };

  // Validation de la date de naissance
  const validateDateNaissance = (date: string): boolean => {
    if (!date) return false;

    const selectedDate = new Date(date);
    const selectedYear = selectedDate.getFullYear();

    // Vérifier que l'année est entre 1927 et 2025
    if (selectedYear < 1927 || selectedYear > 2025) {
      return false;
    }

    // Vérifier que la date n'est pas dans le futur
    if (selectedDate > new Date()) {
      return false;
    }

    return true;
  };

  const Ajouter = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    let loadingToast: Id | null = null;

    try {
      // Validation personnalisée de la date de naissance
      if (!validateDateNaissance(infos.date_naissance)) {
        setErreur({
          ...erreur,
          date_naissance:
            "La date de naissance doit être entre 1927 et aujourd'hui",
        });
        setLoading(false);
        return;
      }
      console.log("donner send yup ", infos);
      await schema.validate(infos, { abortEarly: false });

      loadingToast = toast.loading("Veuillez patienter...");
      const response = await api.post<ApiResponse>("/api/verif", infos);

      if (response.data.success) {
        toast.update(loadingToast, {
          render: `✅ Envoie de l'email`,
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });

        const userForAdmin = infos;
        setTimeout(() => {
          navigate("/code", {
            state: {
              email: infos.email,
              userForAdmin: userForAdmin,
            },
          });
        }, 1500);

        // Reset du formulaire
        setInfos({
          nom: "",
          prenom: "",
          email: "",
          poste: "",
          telephone: "",
          date_naissance: "",
          lieu_naissance: "",
        });
        setErreur({});
      }
    } catch (error: unknown) {
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      // Type guard pour ValidationError de Yup
      const isValidationError = (err: unknown): err is ValidationError => {
        return (
          typeof err === "object" &&
          err !== null &&
          "name" in err &&
          err.name === "ValidationError" &&
          "inner" in err &&
          Array.isArray((err as ValidationError).inner)
        );
      };

      if (isValidationError(error)) {
        const validationErrors: ValidationErrors = {};
        error.inner.forEach((err) => {
          if (err.path) {
            validationErrors[err.path] = err.message;
          }
        });
        setErreur(validationErrors);
      } else {
        const axiosError = error as AxiosError<ApiErrorResponse>;

        if (axiosError.response) {
          const serverErrorMessage = axiosError.response.data.message;
          if (
            axiosError.response.status === 422 ||
            axiosError.response.status === 403 ||
            axiosError.response.status === 401 ||
            axiosError.response.status === 404
          ) {
            toast.info(`❌ ${serverErrorMessage}`);
          } else if (axiosError.response.status === 500) {
            toast.error(`❌ ${serverErrorMessage}`);
          }
        } else {
          toast.error("❌ Erreur de connexion");
          console.log("erreur", error);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculer l'âge pour affichage
  const calculateAge = (dateNaissance: string): number | null => {
    if (!dateNaissance) return null;
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const age = calculateAge(infos.date_naissance);

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-900 via-purple-800 to-cyan-600 flex items-center justify-center p-4">
      <div className="flex w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Left Side - Welcome Section */}
        <div className="w-2/5 bg-gradient-to-br from-indigo-700 to-purple-900 p-12 flex flex-col justify-center items-center text-white relative">
          <div className="mb-8">
            <svg
              className="w-20 h-20 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4 text-center">Bienvenue</h2>
          <p className="text-center text-blue-100 mb-8">
            Vous êtes à 30 secondes de gérer efficacement vos ressources
            humaines !
          </p>
          <Link
            to="/"
            className="px-8 py-3 bg-white text-indigo-700 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg"
          >
            Connexion
          </Link>
        </div>

        {/* Right Side - Form Section */}
        <div className="w-3/5 p-12 bg-white relative">
          {/* Top Right Buttons */}
          <div className="absolute top-6 right-6 flex gap-2">
            <button className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold hover:bg-indigo-200 transition-all">
              Employé
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition-all">
              Manager
            </button>
          </div>

          <div className="mt-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">GestionRH</h1>
            <p className="text-gray-500 mb-8">
              Inscription d'un nouvel employé
            </p>
          </div>

          <form onSubmit={Ajouter} className="space-y-5">
            {/* Nom et Prénom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  id="nom"
                  name="nom"
                  type="text"
                  placeholder="Nom *"
                  value={infos.nom}
                  onChange={Valeur}
                  disabled={loading}
                  className={`w-full px-4 py-3 bg-gray-50 border ${
                    erreur.nom ? "border-red-400 bg-red-50" : "border-gray-300"
                  } rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
                {erreur.nom && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {erreur.nom}
                  </p>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  placeholder="Prénom *"
                  value={infos.prenom}
                  onChange={Valeur}
                  disabled={loading}
                  className={`w-full px-4 py-3 bg-gray-50 border ${
                    erreur.prenom
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300"
                  } rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
                {erreur.prenom && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {erreur.prenom}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Adresse email *"
                value={infos.email}
                disabled={loading}
                onChange={Valeur}
                className={`w-full px-4 py-3 bg-gray-50 border ${
                  erreur.email ? "border-red-400 bg-red-50" : "border-gray-300"
                } rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
              {erreur.email && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {erreur.email}
                </p>
              )}
            </div>

            {/* Date de naissance */}
            <div className="relative">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Date de naissance *
              </label>
              <input
                type="date"
                id="date_naissance"
                name="date_naissance"
                value={infos.date_naissance}
                onChange={Valeur}
                disabled={loading}
                min="1927-01-01"
                max={new Date().toISOString().split("T")[0]}
                className={`w-full px-4 py-3 bg-gray-50 border ${
                  erreur.date_naissance
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300"
                } rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
              {age && age >= 0 && (
                <p className="text-indigo-600 text-xs mt-1 flex items-center">
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Âge : {age} ans
                </p>
              )}
              {erreur.date_naissance && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {erreur.date_naissance}
                </p>
              )}
            </div>

            {/* Lieu de naissance */}
            <div className="relative">
              <input
                type="text"
                id="lieu_naissance"
                name="lieu_naissance"
                placeholder="Lieu de naissance *"
                value={infos.lieu_naissance}
                onChange={Valeur}
                disabled={loading}
                className={`w-full px-4 py-3 bg-gray-50 border ${
                  erreur.lieu_naissance
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300"
                } rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
              {erreur.lieu_naissance && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {erreur.lieu_naissance}
                </p>
              )}
            </div>

            {/* Téléphone et Poste */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="number"
                  id="telephone"
                  name="telephone"
                  placeholder="Téléphone *"
                  disabled={loading}
                  value={infos.telephone}
                  onChange={Valeur}
                  className={`w-full px-4 py-3 bg-gray-50 border ${
                    erreur.telephone
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300"
                  } rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
                {erreur.telephone && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {erreur.telephone}
                  </p>
                )}
              </div>

              <div className="relative">
                <Select
                  value={infos.poste}
                  onChange={PosteChange}
                  error={erreur.poste}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-6 rounded-full font-semibold text-base transition-all duration-300 shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/50 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed opacity-70"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transform hover:scale-105"
              }`}
            >
              <span className="flex items-center justify-center">
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Veuillez patienter...
                  </>
                ) : (
                  "S'inscrire"
                )}
              </span>
            </button>
          </form>

          {/* Informations supplémentaires */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-xs">
              📅 Date de naissance acceptée : 1927 - {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default Formulaire;
