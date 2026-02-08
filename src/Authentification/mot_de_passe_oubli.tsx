import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Mail, Lock, ArrowRight, RefreshCw } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  validateCode,
  validatePasswords,
  validateEmail,
} from "../verification/passverif";
import resetPass from "../email/resetPassService";
import api from "../utils/api";

// ===========================
// TYPES
// ===========================
interface ValidationErrors {
  email?: string;
  code?: string;
  password?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors?: string;
}

interface EmailVerificationResponse {
  id: number;
  nom: string;
  success: boolean;
}

// ===========================
// HELPERS
// ===========================
const generateResetCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ===========================
// COMPOSANT PRINCIPAL
// ===========================
function ForgetPassword(): React.ReactElement {
  // États UI
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [canResend, setCanResend] = useState<boolean>(true);

  // États données utilisateur
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  // États backend
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [generatedCode, setGeneratedCode] = useState<string>("");

  // États messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  // ===========================
  // COMPTE À REBOURS
  // ===========================
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  const startCountdown = (): void => {
    setCountdown(60); // 60 secondes
    setCanResend(false);
  };

  // ===========================
  // GESTION DES ERREURS API
  // ===========================
  const handleApiError = (error: any, defaultMessage: string): void => {
    if (error.response) {
      const serverMessage: string = error.response.data.message;
      const status = error.response.status;

      if ([401, 403, 404, 422].includes(status)) {
        toast.info(`❌ ${serverMessage}`);
      } else if (status === 500) {
        toast.error(`❌ ${serverMessage}`);
      }
    } else {
      toast.error(`❌ ${defaultMessage}`);
    }
  };

  // ===========================
  // ÉTAPE 1 : ENVOI DU CODE
  // ===========================
  const handleSendCode = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setValidationErrors({});

    try {
      // 1. Valider l'email
      const emailValidation: ValidationResult = await validateEmail(email);
      if (!emailValidation.isValid) {
        setValidationErrors({ email: emailValidation.errors });
        return;
      }

      // 2. Vérifier si l'email existe dans la BD
      const response = await api.post<EmailVerificationResponse>(
        "/api/emeilverif",
        { email }
      );

      if (!response.data.success) {
        toast.error("Email non trouvé");
        return;
      }

      // 3. Stocker les infos utilisateur
      setUserId(response.data.id);
      setUserName(response.data.nom);

      // 4. Générer et envoyer le code
      const resetCode = generateResetCode();
      setGeneratedCode(resetCode);
      console.log("🔐 Code de réinitialisation généré:", resetCode);
      console.log("📧 Envoi du code à:", email);

      await resetPass(email, response.data.nom, resetCode);

      toast.success("Un code a été envoyé à votre adresse email");

      // 5. Démarrer le compte à rebours
      startCountdown();

      // 6. Passer à l'étape 2
      setTimeout(() => {
        setStep(2);
      }, 1000);
    } catch (error: any) {
      handleApiError(error, "Erreur lors de l'envoi du code");
    } finally {
      setIsLoading(false);
    }
  };

  // ===========================
  // ÉTAPE 2 : VÉRIFICATION DU CODE
  // ===========================
  const handleVerifyCode = async (): Promise<void> => {
    setError(null);
    setValidationErrors({});

    // Valider le format du code
    const codeValidation: ValidationResult = await validateCode(code);
    if (!codeValidation.isValid) {
      setValidationErrors({ code: codeValidation.errors });
      return;
    }

    // Vérifier que le code correspond
    if (code !== generatedCode) {
      setError("Code de réinitialisation incorrect");
      toast.error("Code incorrect");
      return;
    }

    // Passer à l'étape 3
    setStep(3);
    toast.success("Code vérifié avec succès");
  };

  // ===========================
  // RENVOYER LE CODE
  // ===========================
  const handleResendCode = async (): Promise<void> => {
    if (!canResend) return;

    setError("");
    setCode("");

    try {
      // Générer un nouveau code
      const newResetCode = generateResetCode();
      setGeneratedCode(newResetCode);
      console.log("Nouveau code généré:", newResetCode);

      // Envoyer le nouveau code
      await resetPass(email, userName, newResetCode);

      toast.success("Un nouveau code a été envoyé");

      // Démarrer le compte à rebours
      startCountdown();
    } catch (error) {
      toast.error("Erreur lors du renvoi du code");
    }
  };

  // ===========================
  // ÉTAPE 3 : RÉINITIALISATION
  // ===========================
  const handleResetPassword = async (): Promise<void> => {
    setError(null);
    setValidationErrors({});

    // Vérifier que les mots de passe correspondent
    if (newPassword !== confirmPassword) {
      const errorMsg = "Les mots de passe ne correspondent pas";
      setValidationErrors({ password: errorMsg });
      setError(errorMsg);
      toast.error(errorMsg);
      
      return;
    }

    // Vérifier que le mot de passe n'est pas vide
    if (!newPassword || newPassword.trim() === "") {
      const errorMsg = "Le mot de passe ne peut pas être vide";
      setValidationErrors({ password: errorMsg });
      setError(errorMsg);
      toast.error(errorMsg);
      console.log("❌ Validation échouée: Mot de passe vide");
      return;
    }

    // Valider les mots de passe avec la fonction de validation
    const passwordValidation: ValidationResult = await validatePasswords(
      newPassword,
      confirmPassword
    );
    if (!passwordValidation.isValid) {
      setValidationErrors({ password: passwordValidation.errors });
      setError(passwordValidation.errors || "Erreur de validation");
      toast.error(passwordValidation.errors || "Mot de passe invalide");
      console.log("❌ Validation échouée:", passwordValidation.errors);
      return;
    }

    console.log("✅ Mots de passe validés avec succès");
    console.log("   - Longueur:", newPassword.length);
    console.log("   - User ID:", userId);

    try {
      // Mettre à jour le mot de passe
      const response = await api.put<{ message: string }>(
        `/api/passReset/${userId}`,
        { password: confirmPassword }
      );

      console.log("✅ Mot de passe mis à jour en BD");
      setSuccess(response.data.message);
      toast.success("Mot de passe réinitialisé avec succès");

      // Rediriger vers la page de connexion
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error: any) {
      console.log("❌ Erreur lors de la mise à jour en BD:", error);
      handleApiError(error, "Erreur lors de la réinitialisation");
    }
  };

  // ===========================
  // RENDER
  // ===========================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden relative z-10 p-8 lg:p-12">
        {/* Barre de progression */}
        <div className="mb-8">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  step >= s ? "bg-violet-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Contenu des étapes */}
        <div className="space-y-6">
          {/* ========== ÉTAPE 1 : EMAIL ========== */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Mot de passe oublié ?
                </h1>
                <p className="text-gray-600">
                  Entrez votre email pour recevoir un code de réinitialisation
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border ${
                        validationErrors.email
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200"
                      } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all`}
                      placeholder="votre@email.com"
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                      {validationErrors.email}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleSendCode}
                  disabled={isLoading}
                  className={`w-full py-3.5 px-6 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg ${
                    isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40"
                  }`}
                >
                  {isLoading ? (
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
                      Envoyer le code
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ========== ÉTAPE 2 : CODE ========== */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Vérifiez votre email
                </h1>
                <p className="text-gray-600">
                  Nous avons envoyé un code à{" "}
                  <span className="font-semibold text-gray-900">{email}</span>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code de vérification
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className={`w-full px-6 py-4 text-center text-3xl font-bold tracking-[0.5em] bg-gray-50 border-2 ${
                      validationErrors.code
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200"
                    } rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all`}
                    placeholder="000000"
                    maxLength={6}
                  />
                  {validationErrors.code && (
                    <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                      {validationErrors.code}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleVerifyCode}
                  className="w-full py-3.5 px-6 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg shadow-violet-500/30"
                >
                  Vérifier le code
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={handleResendCode}
                  disabled={!canResend}
                  className={`w-full py-3 px-6 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                    canResend
                      ? "bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  {canResend
                    ? "Renvoyer le code"
                    : `Renvoyer dans ${countdown}s`}
                </button>
              </div>
            </div>
          )}

          {/* ========== ÉTAPE 3 : NOUVEAU MOT DE PASSE ========== */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Nouveau mot de passe
                </h1>
                <p className="text-gray-600">
                  Créez un mot de passe sécurisé pour votre compte
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-gray-50 border ${
                      validationErrors.password
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200"
                    } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all`}
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-gray-50 border ${
                      validationErrors.password
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200"
                    } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all`}
                    placeholder="••••••••"
                  />
                  {validationErrors.password && (
                    <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                      {validationErrors.password}
                    </p>
                  )}
                </div>

                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-700">
                    Afficher les mots de passe
                  </span>
                </label>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-sm text-green-700 font-medium">
                      {success}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleResetPassword}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30"
                >
                  <CheckCircle className="w-5 h-5" />
                  Réinitialiser le mot de passe
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========== FOOTER ========== */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Vous vous souvenez de votre mot de passe ?{" "}
            <Link
              to="/"
              className="text-violet-600 hover:text-violet-700 font-semibold transition-colors"
            >
              Se connecter
            </Link>
          </p>
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

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
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
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default ForgetPassword;
