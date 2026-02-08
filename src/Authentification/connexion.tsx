import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import validateSchem from "../verification/verif";
import api from "../utils/api";
import { FcGoogle } from "react-icons/fc";
import { toast, ToastContainer } from "react-toastify";
import type { Id } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { authUtils } from "../utils/Intercepteur";
import type {
  LoginCredentials,
  ValidationErrors,
  LoginResponse,
} from "../types/auth.types";
import type { AxiosError } from "axios";
import type { ValidationError } from "yup";
import SupportAccessRequest from "../composant/supportSystem/SupportAccessRequest";
import SupportButton from "../composant/Button/button";

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
  const [openSupport, setOpenSupport] = useState(false);

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
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    let loadingToast: Id | null = null;

    try {
      await validateSchem.validate(infos, { abortEarly: false });

      loadingToast = toast.loading("Connexion en cours...");
      console.log("appel ppour envoie");
      const response = await api.post<LoginResponse>("/api/login", infos);

      const serverMessage = response.data.message;

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
          response.data.expires_in,
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
            axiosError.response.status === 429 ||
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Welcome Section */}
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
          <h1 className="text-4xl font-bold text-white mb-2">Bon retour !</h1>
          <p className="text-blue-200">
            Connectez-vous à votre espace GestionRH
          </p>
        </div>
        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={connecter} className="space-y-6">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email_pro"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Adresse email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className={`w-5 h-5 transition-colors ${
                      erreur.email_pro
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
                  type="text"
                  id="email_pro"
                  name="email_pro"
                  placeholder="votre.email@entreprise.cm"
                  value={infos.email_pro}
                  onChange={Valeur}
                  disabled={loading}
                  className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 ${
                    erreur.email_pro
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                  } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 transition-all ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
              </div>
              {erreur.email_pro && (
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
                  <span>{erreur.email_pro}</span>
                </div>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Mot de passe
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className={`w-5 h-5 transition-colors ${
                      erreur.password
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  type={afficher ? "text" : "password"}
                  id="password"
                  name="password"
                  value={infos.password}
                  placeholder="••••••••"
                  onChange={Valeur}
                  disabled={loading}
                  className={`w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 ${
                    erreur.password
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                  } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 transition-all ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setAfficher(!afficher)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {afficher ? (
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
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
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {erreur.password && (
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
                  <span>{erreur.password}</span>
                </div>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={afficher}
                  onChange={Afficher}
                  disabled={loading}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 transition-all"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  Affichez le mot de passe
                </span>
              </label>

              <Link
                to="/mot_de_passe_oubli"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full relative py-4 px-6 rounded-xl font-semibold text-base transition-all duration-300 shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/50 overflow-hidden group ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white hover:shadow-xl hover:shadow-indigo-500/50 transform hover:scale-[1.02] active:scale-[0.98]"
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
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    Se connecter
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
              {!loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Ou continuer avec
              </span>
            </div>
          </div>

          {/* Google Button */}
          <button className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-300 group">
            <FcGoogle className="text-2xl" />
            <span className="text-gray-700 font-medium group-hover:text-gray-900">
              Continuer avec Google
            </span>
          </button>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Nouveau sur GestionRH ?{" "}
              <Link
                to="/formulaire"
                className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors inline-flex items-center gap-1"
              >
                Créer un compte
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
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Connexion sécurisée SSL</span>
          </div>
        </div>
      </div>
      <SupportButton onClick={() => setOpenSupport(true)} />
      {openSupport && (
        <SupportAccessRequest onClose={() => setOpenSupport(false)} />
      )}

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

export default Connexion;
