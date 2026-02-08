import React, { useState } from "react";
import { Mail, Loader2, CheckCircle, Copy, ExternalLink } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import EmailService from "../../email/EmailService";

interface SupportAccessRequestProps {
  onClose: () => void;
}

const SupportAccessRequest: React.FC<SupportAccessRequestProps> = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [accessLink, setAccessLink] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Veuillez entrer votre email");
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Email invalide");
      return;
    }

    try {
      setLoading(true);

      // Demander le lien d'accès au backend
      const response = await api.post("/api/support/request-access", {
        email: email.toLowerCase().trim(),
      });

      if (response.data?.success) {
        const { access_link, email_data } = response.data;

        // Afficher le lien directement (pour le dev local)
        setAccessLink(access_link);
        setShowLink(true);

        // Envoyer l'email via EmailJS (production)
        try {
          const emailResult = await EmailService.sendMagicLink(email_data);
          if (emailResult.success) {
            setEmailSent(true);
            toast.success("Email envoyé avec succès !");
          } else {
            toast.warning("Lien généré, mais email non envoyé (mode dev)");
          }
        } catch (emailError) {
          console.log("Erreur EmailJS:", emailError);
          toast.warning("Lien généré, mais email non envoyé (mode dev)");
        }
      } else {
        toast.error(response.data?.message || "Erreur lors de la génération du lien");
      }
    } catch (error: any) {
      console.log("Erreur:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de la demande d'accès"
      );
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(accessLink);
    toast.success("Lien copié !");
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8">
        {!showLink ? (
          // Formulaire de demande
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Accès Support Technique
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Entrez votre email professionnel pour accéder à vos tickets
              </p>
            </div>

            <form onSubmit={handleRequestAccess} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email professionnel
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@entreprise.cm"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    "Générer le lien"
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          // Lien généré
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Lien d'accès généré !
              </h2>
              {emailSent ? (
                <p className="text-gray-600 dark:text-gray-400">
                  Un email a été envoyé à <strong>{email}</strong>
                </p>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  Copiez le lien ci-dessous pour accéder à vos tickets
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Lien d'accès (valide 24h)
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={accessLink}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={copyLink}
                    className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    title="Copier"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <a
                href={accessLink}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
              >
                <ExternalLink className="w-5 h-5" />
                Accéder maintenant
              </a>

              {emailSent && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-300">
                    Vérifiez votre boîte mail. Si vous ne voyez pas l'email,
                    vérifiez vos spams.
                  </p>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SupportAccessRequest;
