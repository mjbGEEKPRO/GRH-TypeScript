import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import schema from "../verification/validation";
import api from "../utils/api";
import { toast, ToastContainer } from "react-toastify";
import type { Id } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "./select";
import type { AxiosError } from "axios";
import type { ValidationError } from "yup";
import type { ApiErrorResponse,ApiResponse } from "../types/apiResponse";

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



const Formulaire: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
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

  const validateDateNaissance = (date: string): boolean => {
    if (!date) return false;
    const selectedDate = new Date(date);
    const selectedYear = selectedDate.getFullYear();
    if (selectedYear < 1927 || selectedYear > 2025) {
      return false;
    }
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
      if (!validateDateNaissance(infos.date_naissance)) {
        setErreur({
          ...erreur,
          date_naissance: "La date de naissance doit être entre 1927",
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

  const isStep1Complete = infos.nom && infos.prenom && infos.email;
  const isStep2Complete =
    infos.date_naissance &&
    infos.lieu_naissance &&
    infos.telephone &&
    infos.poste;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl mb-6 shadow-2xl">
            <svg
              className="w-10 h-10 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Créer un compte
          </h1>
          <p className="text-blue-200">
            Rejoignez GestionRH en quelques étapes
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {/* Step 1 */}
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= 1
                    ? "bg-white border-white text-indigo-600"
                    : "bg-white/10 border-white/30 text-white"
                } font-semibold transition-all`}
              >
                {currentStep > 1 ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  "1"
                )}
              </div>
              <span className="ml-2 text-white text-sm font-medium hidden sm:inline">
                Informations
              </span>
            </div>

            {/* Connector */}
            <div
              className={`w-12 sm:w-24 h-0.5 ${
                currentStep >= 2 ? "bg-white" : "bg-white/30"
              } transition-all`}
            ></div>

            {/* Step 2 */}
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= 2
                    ? "bg-white border-white text-indigo-600"
                    : "bg-white/10 border-white/30 text-white"
                } font-semibold transition-all`}
              >
                2
              </div>
              <span className="ml-2 text-white text-sm font-medium hidden sm:inline">
                Détails
              </span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={Ajouter} className="space-y-6">
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Informations personnelles
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Commencez par vos informations de base
                  </p>
                </div>

                {/* Nom & Prénom */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="nom"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Nom
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className={`w-5 h-5 transition-colors ${
                            erreur.nom
                              ? "text-red-400"
                              : "text-gray-400 group-focus-within:text-indigo-500"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <input
                        id="nom"
                        name="nom"
                        type="text"
                        placeholder="Doe"
                        value={infos.nom}
                        onChange={Valeur}
                        disabled={loading}
                        className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 ${
                          erreur.nom
                            ? "border-red-300 focus:border-red-500"
                            : "border-gray-200 focus:border-indigo-500"
                        } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all ${
                          loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>
                    {erreur.nom && (
                      <div className="mt-2 flex items-center gap-1.5 text-red-600 text-sm">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{erreur.nom}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="prenom"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Prénom
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className={`w-5 h-5 transition-colors ${
                            erreur.prenom
                              ? "text-red-400"
                              : "text-gray-400 group-focus-within:text-indigo-500"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="prenom"
                        name="prenom"
                        placeholder="jane"
                        value={infos.prenom}
                        onChange={Valeur}
                        disabled={loading}
                        className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 ${
                          erreur.prenom
                            ? "border-red-300 focus:border-red-500"
                            : "border-gray-200 focus:border-indigo-500"
                        } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all ${
                          loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>
                    {erreur.prenom && (
                      <div className="mt-2 flex items-center gap-1.5 text-red-600 text-sm">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{erreur.prenom}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Adresse email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg
                        className={`w-5 h-5 transition-colors ${
                          erreur.email
                            ? "text-red-400"
                            : "text-gray-400 group-focus-within:text-indigo-500"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="jane.doe@exemple.domaine"
                      value={infos.email}
                      disabled={loading}
                      onChange={Valeur}
                      className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 ${
                        erreur.email
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-200 focus:border-indigo-500"
                      } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all ${
                        loading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                  {erreur.email && (
                    <div className="mt-2 flex items-center gap-1.5 text-red-600 text-sm">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{erreur.email}</span>
                    </div>
                  )}
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => isStep1Complete && setCurrentStep(2)}
                  disabled={!isStep1Complete}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-base transition-all duration-300 shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/50 ${
                    isStep1Complete
                      ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-indigo-500/50 transform hover:scale-[1.02]"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    Continuer
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            )}

            {/* Step 2: Additional Details */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Informations complémentaires
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Quelques détails supplémentaires
                  </p>
                </div>

                {/* Date & Lieu de naissance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="date_naissance"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Date de naissance
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className={`w-5 h-5 transition-colors ${
                            erreur.date_naissance
                              ? "text-red-400"
                              : "text-gray-400 group-focus-within:text-indigo-500"
                          }`}
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
                      </div>
                      <input
                        type="date"
                        id="date_naissance"
                        name="date_naissance"
                        value={infos.date_naissance}
                        onChange={Valeur}
                        disabled={loading}
                        min="1927-01-01"
                        className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 ${
                          erreur.date_naissance
                            ? "border-red-300 focus:border-red-500"
                            : "border-gray-200 focus:border-indigo-500"
                        } rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all ${
                          loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>
                    {age && age >= 0 && (
                      <p className="mt-2 text-indigo-600 text-sm flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Âge : {age} ans
                      </p>
                    )}
                    {erreur.date_naissance && (
                      <div className="mt-2 flex items-center gap-1.5 text-red-600 text-sm">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{erreur.date_naissance}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="lieu_naissance"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Lieu de naissance
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className={`w-5 h-5 transition-colors ${
                            erreur.lieu_naissance
                              ? "text-red-400"
                              : "text-gray-400 group-focus-within:text-indigo-500"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="lieu_naissance"
                        name="lieu_naissance"
                        placeholder="Douala, Yaoundé"
                        value={infos.lieu_naissance}
                        onChange={Valeur}
                        disabled={loading}
                        className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 ${
                          erreur.lieu_naissance
                            ? "border-red-300 focus:border-red-500"
                            : "border-gray-200 focus:border-indigo-500"
                        } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all ${
                          loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>
                    {erreur.lieu_naissance && (
                      <div className="mt-2 flex items-center gap-1.5 text-red-600 text-sm">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{erreur.lieu_naissance}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Téléphone & Poste */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="telephone"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Téléphone
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className={`w-5 h-5 transition-colors ${
                            erreur.telephone
                              ? "text-red-400"
                              : "text-gray-400 group-focus-within:text-indigo-500"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <input
                        type="number"
                        id="telephone"
                        name="telephone"
                        placeholder="6xx xxx xxx ou 2xx xxx xxx"
                        disabled={loading}
                        value={infos.telephone}
                        onChange={Valeur}
                        className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 ${
                          erreur.telephone
                            ? "border-red-300 focus:border-red-500"
                            : "border-gray-200 focus:border-indigo-500"
                        } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all ${
                          loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>
                    {erreur.telephone && (
                      <div className="mt-2 flex items-center gap-1.5 text-red-600 text-sm">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{erreur.telephone}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Poste
                    </label>
                    <Select
                      value={infos.poste}
                      onChange={PosteChange}
                      error={erreur.poste}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 py-3.5 px-6 rounded-xl font-semibold text-base bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-300/50"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 17l-5-5m0 0l5-5m-5 5h12"
                        />
                      </svg>
                      Retour
                    </span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !isStep2Complete}
                    className={`flex-1 relative py-3.5 px-6 rounded-xl font-semibold text-base transition-all duration-300 shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/50 overflow-hidden group ${
                      loading || !isStep2Complete
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-indigo-500/50 transform hover:scale-[1.02]"
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5"
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
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          Créer mon compte
                          <svg
                            className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </>
                      )}
                    </span>
                    {!loading && isStep2Complete && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </button>
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="text-blue-800 text-sm font-semibold">
                        Vérification par email
                      </p>
                      <p className="text-blue-600 text-xs mt-1">
                        Un code de vérification sera envoyé à votre adresse
                        email
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Sign In Link */}
          <div className="mt-8 text-center pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              Vous avez déjà un compte ?{" "}
              <Link
                to="/"
                className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors inline-flex items-center gap-1"
              >
                Se connecter
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white text-sm">
            <svg
              className="w-4 h-4 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Vos données sont protégées et sécurisées</span>
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

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Formulaire;
