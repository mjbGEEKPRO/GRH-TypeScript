import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { validateCode, validatePasswords, validateEmail  } from "../../verification/passverif";
import resetPass from "../../email/resetPassService";
import api from "../../utils/api";

interface ValidationErrors {
  email?: string;
  code?: string;
  password?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors?: string;
}

function ForgetPassword(): React.ReactElement {
  const [step, setStep] = useState<number>(1);
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [id, setId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [afficher, setAfficher] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [resetCode, setResetCode] = useState<string>("");
  const [nom, setNom] = useState<string>("");

  const generateAndSendCode = async (): Promise<boolean> => {
    const codeGenerer = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("code geneerer ", codeGenerer);
    setResetCode(codeGenerer);

    try {
      const emailSent = true;
      if (emailSent) {
        await resetPass(email,nom,resetCode);
        toast.success("Un code a été envoyé à votre adresse mail");

        return true;
      } else {
        toast.error("Impossible d'envoyer l'email");
        return false;
      }
    } catch{
      toast.error("Erreur lors de l'envoi de l'email");
      return false;
    }
  };

  const handleSendCode = async (): Promise<void> => {
    setIsLoading(true);
    try {
      setError(null);
      setValidationErrors({});

      const emailValidation: ValidationResult = await validateEmail(email);
      if (!emailValidation.isValid) {
        setValidationErrors({ email: emailValidation.errors });
        setIsLoading(false);
        return;
      }

      const mail = { email };
      const res = await api.post<{ id: number; nom: string; success: boolean }>(
        "/api/emeilverif",
        mail
      );
      setId(res.data.id);
      setNom(res.data.nom);
      if (res.data.success) {
        const emailSent = true;
        if (emailSent) {
          setTimeout(() => {
            setStep(2);
            setIsLoading(false);
          }, 1000);
        } else {
          setIsLoading(false);
        }
      }
    } catch (error: any) {
      if (error.response) {
        const serverErrorMessage: string = error.response.data.message;
        if (
          error.response.status === 422 ||
          error.response.status === 403 ||
          error.response.status === 401 ||
          error.response.status === 404
        ) {
          toast.info(`❌ ${serverErrorMessage}`);
        } else if (error.response.status === 500) {
          toast.error(`❌ ${serverErrorMessage}`);
        }
      } else {
        toast.error("❌ Erreur de connexion, veuillez réessayer");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (): Promise<void> => {
    setError(null);
    setValidationErrors({});

    const codeValidation: ValidationResult = await validateCode(code);
    if (!codeValidation.isValid) {
      setValidationErrors({ code: codeValidation.errors });
      return;
    }

    if (code === resetCode) {
      setStep(3);
    } else {
      setError("Code de réinitialisation incorrect");
    }
  };

  const handleResetPassword = async (): Promise<void> => {
    setError(null);
    setValidationErrors({});

    const passwordValidation: ValidationResult = await validatePasswords(
      newPassword,
      confirmPassword
    );
    if (!passwordValidation.isValid) {
      setValidationErrors({ password: passwordValidation.errors });
      return;
    }

    try {
      const password = { password: confirmPassword };
      const res = await api.put<{ message: string }>(`/api/passReset/${id}`, password);

      setSuccess(res.data.message);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error: any) {
      if (error.response) {
        const serverErrorMessage: string = error.response.data.message;
        if (
          error.response.status === 422 ||
          error.response.status === 403 ||
          error.response.status === 401 ||
          error.response.status === 404
        ) {
          toast.info(`❌ ${serverErrorMessage}`);
        } else if (error.response.status === 500) {
          toast.error(`❌ ${serverErrorMessage}`);
        }
      } else {
        toast.error("❌ Erreur lors de la réinitialisation");
      }
    }
  };

  const Afficher = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setAfficher(e.target.checked);
  };

  const handleResendCode = async (): Promise<void> => {
    console.log("nom ", nom);
    setError("");
    setCode("");
    await generateAndSendCode();
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-900 via-purple-800 to-cyan-600 flex items-center justify-center p-4">
      <div className="flex w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Left Side - Logo Section */}
        <div className="w-2/5 bg-gradient-to-br from-indigo-700 to-purple-900 relative overflow-hidden flex items-center justify-center p-12">
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            <div className="bg-white/10 backdrop-blur-lg border-2 border-white/30 rounded-3xl p-8 shadow-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center">
                  <svg
                    className="w-20 h-20 text-white"
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
                <h2 className="text-2xl font-bold text-white mb-2">
                  Récupération
                </h2>
                <p className="text-white/70 text-sm">Mot de passe oublié</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Reset Form */}
        <div className="w-3/5 p-12 bg-white overflow-y-auto max-h-screen">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Mot de passe oublié
            </h1>
            <p className="text-gray-500">
              Suivez les étapes pour réinitialiser votre accès
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    step >= 1
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {step > 1 ? "✓" : "1"}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    step >= 1 ? "text-indigo-600" : "text-gray-400"
                  }`}
                >
                  E-mail
                </span>
              </div>

              <div
                className={`flex-1 h-1 mx-2 rounded ${
                  step > 1 ? "bg-indigo-600" : "bg-gray-200"
                }`}
              ></div>

              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    step >= 2
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {step > 2 ? "✓" : "2"}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    step >= 2 ? "text-indigo-600" : "text-gray-400"
                  }`}
                >
                  Code
                </span>
              </div>

              <div
                className={`flex-1 h-1 mx-2 rounded ${
                  step > 2 ? "bg-indigo-600" : "bg-gray-200"
                }`}
              ></div>

              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    step >= 3
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  3
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    step >= 3 ? "text-indigo-600" : "text-gray-400"
                  }`}
                >
                  Nouveau
                </span>
              </div>
            </div>
          </div>

          {/* Step 1: Email */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Adresse e-mail professionnelle
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-50 border ${
                    validationErrors.email
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300"
                  } rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                  placeholder="prenom.nom@entreprise.com"
                  disabled={isLoading}
                />
                {validationErrors.email && (
                  <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleSendCode}
                disabled={isLoading}
                className={`w-full py-3 px-6 rounded-full font-semibold transition-all duration-300 shadow-lg ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transform hover:scale-105"
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
                    Envoi en cours...
                  </span>
                ) : (
                  "Envoyer le code"
                )}
              </button>
            </div>
          )}

          {/* Step 2: Code Verification */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-indigo-700">
                  Code envoyé à <span className="font-semibold">{email}</span>
                </p>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Code de réinitialisation (6 chiffres) {resetCode}
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className={`w-full px-6 py-4 text-center text-3xl font-bold tracking-widest bg-gray-50 border ${
                    validationErrors.code
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300"
                  } rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-300`}
                  placeholder="000000"
                  maxLength={6}
                />
                {validationErrors.code && (
                  <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    {validationErrors.code}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleVerifyCode}
                className="w-full py-3 px-6 rounded-full font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Vérifier le code
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                className="w-full py-3 px-6 rounded-full font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-300"
              >
                Renvoyer le code
              </button>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  type={afficher ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-50 border ${
                    validationErrors.password
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300"
                  } rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                  placeholder="Nouveau mot de passe"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  type={afficher ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-50 border ${
                    validationErrors.password
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300"
                  } rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                  placeholder="Confirmer le mot de passe"
                />
                {validationErrors.password && (
                  <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    {validationErrors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                <input
                  type="checkbox"
                  checked={afficher}
                  onChange={Afficher}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                />
                <label className="text-gray-700 text-sm">
                  Afficher les mots de passe
                </label>
              </div>

              <button
                type="button"
                onClick={handleResetPassword}
                className="w-full py-3 px-6 rounded-full font-semibold bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Réinitialiser le mot de passe
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Vous vous souvenez de votre mot de passe ?{" "}
              <Link
                to="/"
                className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
              >
                Se connecter
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
}

export default ForgetPassword;