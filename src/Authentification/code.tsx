import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import sendEmailWithCode from "../email/sendEmailCode";
import "react-toastify/dist/ReactToastify.css";
import { toast, ToastContainer } from "react-toastify";
import api from "../utils/api";
import axios from "axios";
import type { AxiosError } from "axios";
import type { UserForAdmin, ApiResponse, InitState, CodeGenerationResult } from "../types/auth.types";

interface LocationState {
  email?: string;
  userForAdmin?: UserForAdmin;
}

interface ApiErrorResponse {
  message: string;
}

const Code: React.FC = () => {
  const [code, setCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [sendCode, setSendCode] = useState<string>("");
  const [compteur, setCompteur] = useState<number>(60);
  const [estValide, setEstValide] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [initState, setInitState] = useState<InitState>("loading");
  const [email, setEmail] = useState<string>("");
  const [userForAdmin, setUserForAdmin] = useState<UserForAdmin | null>(null);
  const [nom, setNom] = useState<string>("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as LocationState;

  const generateCode = useCallback(async (): Promise<CodeGenerationResult> => {
    const codeGenerer = Math.floor(100000 + Math.random() * 900000).toString();
    setSendCode(codeGenerer);

    if (email && nom) {
      const emailSent = await sendEmailWithCode(email, nom, codeGenerer);
      if (emailSent) {
        toast.success("Un code a été envoyé à votre adresse mail");
      } else {
        setEmailError("Impossible d'envoyer l'email");
      }
      return { code: codeGenerer, emailSent };
    }
    return { code: codeGenerer, emailSent: false };
  }, [email, nom]);

  const resetAndStartTimer = useCallback((): void => {
    setEstValide(false);
    setCompteur(60);
    setTimeout(() => {
      setEstValide(true);
    }, 100);
  }, []);

  useEffect(() => {
    if (locationState?.email && locationState?.userForAdmin) {
      setEmail(locationState.email);
      setUserForAdmin(locationState.userForAdmin);
      setNom(locationState.userForAdmin.nom);
      setInitState("ready");
    } else {
      setError(
        "Données de session manquantes. Veuillez recommencer l'inscription."
      );
      setInitState("error");
      setTimeout(() => {
        navigate("/formulaire");
      }, 3000);
    }
  }, [locationState, navigate]);

  useEffect(() => {
    if (initState === "ready" && email && userForAdmin && !sendCode) {
      generateCode().then(() => {
        resetAndStartTimer();
      });
    }
  }, [
    initState,
    email,
    userForAdmin,
    sendCode,
    generateCode,
    resetAndStartTimer,
  ]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (estValide && compteur > 0) {
      interval = setInterval(() => {
        setCompteur((prev) => {
          if (prev <= 1) {
            setEstValide(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [estValide, compteur]);

  const handleInputChange = useCallback((value: string): void => {
    const numericValue = value.replace(/[^0-9]/g, "").slice(0, 6);
    setCode(numericValue);
    setError("");
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (code.length !== 6) {
      setError("Le code doit contenir 6 chiffres");
      return;
    }

    if (!estValide) {
      setError("Le code a expiré");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (code === sendCode) {
        setSuccess(true);

        const res = await api.post<ApiResponse>("/api/users", userForAdmin, {
          timeout: 10000,
        });
        
        if (res.data.success) {
          const userForJson = res.data.user;
          await axios.post("http://localhost:5000/users", userForJson, {
            timeout: 5000,
          });
          toast.success(
            "✅ Code vérifié avec succès  Inscription terminée avec succès !"
          );

          window.location.href = "/";
        } else {
          setError(res.data.message || "Erreur lors de l'inscription");
        }
      } else {
        setError("❌ Code incorrect, veuillez réessayer");
      }
    } catch (error: unknown) {
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
      }
      
      if (axiosError.code === "ECONNABORTED") {
        setError("Délai d'attente dépassé.");
      } else if (axiosError.response?.status === 422) {
        setError("Données invalides.");
      } else {
        setError("Erreur lors de la vérification.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async (): Promise<void> => {
    if (estValide) {
      toast.info("⏱ Le code est encore valide !");
      return;
    }

    setIsResending(true);
    setEmailError(null);

    try {
      setCode("");
      setError("");
      setSuccess(false);
      const result = await generateCode();
      if (result.emailSent) {
        resetAndStartTimer();
        toast.success("📨 Nouveau code envoyé !");
      }
    } catch {
      toast.error("❌ Erreur lors du renvoi du code");
    } finally {
      setIsResending(false);
    }
  };

  if (initState === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-12 border border-blue-100">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Chargement...
            </h2>
            <p className="text-gray-500">Préparation de la vérification</p>
          </div>
        </div>
      </div>
    );
  }

  if (initState === "error" || !email || !userForAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md border border-blue-100">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Erreur</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              to="/formulaire"
              className="inline-block bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-8 rounded-full font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg"
            >
              Retour à l'inscription
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl mb-4 shadow-lg">
            <svg
              className="w-10 h-10 text-white"
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Vérification
          </h1>
          <p className="text-gray-600 text-sm mb-1">Code envoyé à</p>
          <p className="text-blue-600 font-semibold">
            {email} code send {sendCode}
          </p>

          {estValide && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full">
              <svg
                className="w-4 h-4 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-amber-700">
                Code valide {compteur}s
              </span>
            </div>
          )}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-blue-100">
          {/* Messages */}
          {emailError && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <p className="text-orange-700 text-sm">{emailError}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-700 font-medium">
                ✓ Code vérifié ! Redirection...
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                Code à 6 chiffres
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={isLoading}
                maxLength={6}
                className="w-full px-6 py-4 text-center text-3xl font-bold tracking-widest bg-blue-50/50 border border-blue-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-gray-300"
                placeholder="000000"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className={`w-full py-3 px-6 rounded-full font-semibold transition-all duration-300 shadow-lg ${
                isLoading || code.length !== 6
                  ? "bg-gray-300 cursor-not-allowed opacity-70 text-gray-500"
                  : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 hover:shadow-xl transform hover:scale-105"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-3"
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
                  Vérification...
                </span>
              ) : (
                "Vérifier le code"
              )}
            </button>
          </form>

          {/* Resend Section */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-500 text-sm">
              Vous n'avez pas reçu le code ?
            </p>
            <button
              onClick={handleResendCode}
              disabled={estValide || isLoading || isResending}
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending
                ? "Envoi..."
                : estValide
                ? `Renvoyer dans ${compteur}s`
                : "Renvoyer le code"}
            </button>

            <div className="pt-4 border-t border-gray-200">
              <Link
                to="/formulaire"
                className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                ← Retour à l'inscription
              </Link>
            </div>
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

export default Code;