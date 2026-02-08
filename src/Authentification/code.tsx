import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import sendEmailWithCode from "../email/sendEmailCode";
import "react-toastify/dist/ReactToastify.css";
import { toast, ToastContainer } from "react-toastify";
import api from "../utils/api";
import axios from "axios";
import type { AxiosError } from "axios";
import type {
  UserForAdmin,
  ApiResponse,
  InitState,
  CodeGenerationResult,
} from "../types/auth.types";

interface LocationState {
  email?: string;
  userForAdmin?: UserForAdmin;
}

interface ApiErrorResponse {
  message: string;
}

const Code: React.FC = () => {
  const [code, setCode] = useState<string>("");
  const [codeInputs, setCodeInputs] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
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
    console.log("code générer  : ", codeGenerer);
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

  const handleInputChange = useCallback(
    (index: number, value: string): void => {
      const numericValue = value.replace(/[^0-9]/g, "").slice(0, 1);

      const newInputs = [...codeInputs];
      newInputs[index] = numericValue;
      setCodeInputs(newInputs);

      const fullCode = newInputs.join("");
      setCode(fullCode);
      setError("");

      if (numericValue && index < 5) {
        const nextInput = document.getElementById(`code-input-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    },
    [codeInputs]
  );

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (e.key === "Backspace" && !codeInputs[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newInputs = pastedData
      .split("")
      .concat(Array(6).fill(""))
      .slice(0, 6);
    setCodeInputs(newInputs);
    setCode(pastedData);
    setError("");

    const lastFilledIndex = Math.min(pastedData.length, 5);
    const targetInput = document.getElementById(
      `code-input-${lastFilledIndex}`
    );
    if (targetInput) targetInput.focus();
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
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
            "Code vérifié avec succès ! Inscription terminée avec succès !"
          );
          window.location.href = "/";
        } else {
          setError(res.data.message || "Erreur lors de l'inscription");
        }
      } else {
        setError("Code incorrect, veuillez réessayer");
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
          toast.info(`${serverErrorMessage}`);
        } else if (axiosError.response.status === 500) {
          toast.error(`${serverErrorMessage}`);
        }
      } else {
        toast.error("Erreur de connexion");
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
      toast.info("Le code est encore valide !");
      return;
    }

    setIsResending(true);
    setEmailError(null);

    try {
      setCode("");
      setCodeInputs(["", "", "", "", "", ""]);
      setError("");
      setSuccess(false);
      const result = await generateCode();
      if (result.emailSent) {
        resetAndStartTimer();
        toast.success("Nouveau code envoyé !");
      }
    } catch {
      toast.error("Erreur lors du renvoi du code");
    } finally {
      setIsResending(false);
    }
  };

  if (initState === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (initState === "error" || !email || !userForAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <Link
            to="/formulaire"
            className="inline-block bg-indigo-600 text-white py-2.5 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Retour à l'inscription
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-indigo-600"
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
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Vérification par email
          </h1>
          <p className="text-sm text-gray-600">
            Code envoyé à{" "}
            <span className="font-medium text-gray-900">{email}</span>
          </p>
        </div>

        {/* Timer Badge */}
        {estValide && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
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
              <span className="text-sm font-medium text-amber-900">
                Expire dans {compteur}s
              </span>
            </div>
          </div>
        )}

        {/* Alerts */}
        {emailError && (
          <div className="mb-6 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">{emailError}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-900">
              Code vérifié avec succès !
            </p>
            <p className="text-sm text-green-700 mt-1">
              Redirection en cours...
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Entrez le code à 6 chiffres
            </label>
            <div className="flex gap-2 justify-center">
              {codeInputs.map((digit, index) => (
                <input
                  key={index}
                  id={`code-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={isLoading || success}
                  className={`w-12 h-12 text-center text-xl font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                    error
                      ? "border-red-300 bg-red-50 text-red-900"
                      : success
                      ? "border-green-300 bg-green-50 text-green-900"
                      : digit
                      ? "border-indigo-500 bg-indigo-50 text-gray-900"
                      : "border-gray-300 bg-white text-gray-900"
                  } ${
                    isLoading || success ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length !== 6 || success}
            className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isLoading || code.length !== 6 || success
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-3">
            Vous n'avez pas reçu le code ?
          </p>
          <button
            onClick={handleResendCode}
            disabled={estValide || isLoading || isResending || success}
            className={`text-sm font-medium transition-colors ${
              estValide || isLoading || isResending || success
                ? "text-gray-400 cursor-not-allowed"
                : "text-indigo-600 hover:text-indigo-700"
            }`}
          >
            {isResending
              ? "Envoi en cours..."
              : estValide
              ? `Renvoyer dans ${compteur}s`
              : "Renvoyer le code"}
          </button>
        </div>

        {/* Back Link */}
        <div className="mt-4 text-center">
          <Link
            to="/formulaire"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Retour à l'inscription
          </Link>
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
