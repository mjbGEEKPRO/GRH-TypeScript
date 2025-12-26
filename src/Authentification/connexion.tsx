import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import validateSchem from "../verification/verif";
import api from "../utils/api";
import { FcGoogle } from "react-icons/fc";
import { toast, ToastContainer } from "react-toastify";
import type { Id } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { authUtils } from "../utils/redirectionForm";
import type {
  LoginCredentials,
  ValidationErrors,
  LoginResponse,
} from "../types/auth.types";
import type { AxiosError } from "axios";
import type { ValidationError } from "yup";

interface ApiErrorResponse {
  message: string;
}

const Connexion: React.FC = () => {
  const [infos, setInfos] = useState<LoginCredentials>({
    email_pro: "",
    password: "",
  });
  const [erreur, setErreur] = useState<ValidationErrors>({});
  const [afficher, setAfficher] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    const checkIfAlreadyLoggedIn = (): void => {
      if (authUtils.isAuthenticated()) {
        console.log("Utilisateur déjà connecté, redirection...");
        const user = authUtils.getUserData();
        if (user) {
          const redirectPath = authUtils.getRedirectPath(user);
          console.log("redirection vers", redirectPath, "user info", user);
          navigate(redirectPath);
        }
      } else {
        console.log("Utilisateur pas connecté, affichage du formulaire");
      }
    };

    checkIfAlreadyLoggedIn();
  }, [navigate]);

  useEffect(() => {
    authUtils.setupapiInterceptor();
  }, []);

  const Afficher = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setAfficher(e.target.checked);
  };

  const Valeur = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInfos({ ...infos, [e.target.name]: e.target.value });
  };

  const connecter = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    let loadingToast: Id | null = null;

    try {
      await validateSchem.validate(infos, { abortEarly: false });

      loadingToast = toast.loading("Connexion en cours...");

      const response = await api.post<LoginResponse>("/api/login", infos);

      const serverMessage = response.data.message;
      console.log("compte ", response.data);

      if (response.data.user.compte === 0) {
        window.location.href = "/compte";
        return;
      }

      if (response.data.success) {
        toast.success(`✅ ${serverMessage}`, { autoClose: 2000 });

        authUtils.setUserData(
          response.data.user,
          response.data.access_token,
          response.data.expires_at,
          response.data.expires_in
        );

        const redirectPath = authUtils.getRedirectPath(response.data.user);

        window.location.href = redirectPath;

        setInfos({ email_pro: "", password: "" });
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

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-900 via-purple-800 to-cyan-600 flex items-center justify-center p-4">
      <div className="flex w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Left Side - Logo Section */}
        <div className="w-2/5 bg-gradient-to-br from-indigo-700 to-purple-900 relative overflow-hidden flex items-center justify-center p-12">
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            {/* Espace pour le logo de l'entreprise */}
            <div className="bg-white/10 backdrop-blur-lg border-2 border-white/30 rounded-3xl p-8 shadow-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center">
                  {/* Placeholder pour le logo - Remplacez par votre logo d'entreprise */}
                  <svg
                    className="w-20 h-20 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  ></svg>
                  <img src="../../public/logo.jpg" alt="Logo GestionRH" />
                </div>
                <h2 className="text-2xl font-bold text-white">GestionRH</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-3/5 p-12 bg-white">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Connexion</h1>
            <p className="text-gray-500">Accédez à votre espace GestionRH</p>
          </div>

          <form onSubmit={connecter} className="space-y-6">
            {/* Email */}
            <div className="relative">
              <input
                type="text"
                id="email_pro"
                name="email_pro"
                placeholder="Adresse email *"
                value={infos.email_pro}
                onChange={Valeur}
                disabled={loading}
                className={`w-full px-4 py-3 bg-gray-50 border ${
                  erreur.email_pro
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300"
                } rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
              {erreur.email_pro && (
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
                  {erreur.email_pro}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={afficher ? "text" : "password"}
                id="password"
                name="password"
                value={infos.password}
                placeholder="Mot de passe *"
                onChange={Valeur}
                disabled={loading}
                className={`w-full px-4 py-3 bg-gray-50 border ${
                  erreur.password
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300"
                } rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
              {erreur.password && (
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
                  {erreur.password}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={afficher}
                  onChange={Afficher}
                  disabled={loading}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                />
                <label className="text-gray-700">
                  Afficher le mot de passe
                </label>
              </div>

              <Link
                to="/mot_de_passe_oubli"
                className="text-indigo-600 hover:text-indigo-700 font-medium transition duration-200"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit Button */}
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
                    Connexion...
                  </>
                ) : (
                  "Se connecter"
                )}
              </span>
            </button>
          </form>

          {/* Google Login */}
          <div className="mt-8">
            <div className="flex items-center mb-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-gray-500 text-sm">
                Ou se connecter avec
              </span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <button className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-all duration-300 shadow-md hover:shadow-lg">
              <FcGoogle className="text-2xl" />
              <span className="text-gray-700 font-medium">
                Continuer avec Google
              </span>
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Vous n'avez pas de compte ?{" "}
              <Link
                to="/formulaire"
                className="text-indigo-600 hover:text-indigo-700 font-semibold transition duration-200"
              >
                Créer un compte
              </Link>
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

export default Connexion;
