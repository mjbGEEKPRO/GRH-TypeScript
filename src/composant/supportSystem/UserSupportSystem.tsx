import React, { useState } from "react";
import {
  MessageSquare,
  Send,
  X,
  AlertCircle,
  Mail,
  User,
  Phone,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../utils/api";

interface UserSupportSystemProps {
  open: boolean;
  onClose: () => void;
}

const UserSupportSystem: React.FC<UserSupportSystemProps> = ({
  open,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    sujet: "",
    message: "",
    raison: "compte_bloque",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const raisons = [
    { value: "compte_bloque", label: "Mon compte est bloqué" },
    { value: "mot_de_passe_oublie", label: "J'ai oublié mon mot de passe" },
    { value: "probleme_connexion", label: "Je ne peux pas me connecter" },
    { value: "autre", label: "Autre problème" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.nom.trim() || !formData.prenom.trim()) {
      toast.error("Le nom et prénom sont obligatoires");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("L'email est obligatoire");
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Email invalide");
      return;
    }

    if (!formData.message.trim()) {
      toast.error("Veuillez décrire votre problème");
      return;
    }

    try {
      setLoading(true);

      // Appel API sans authentification
      const response = await api.post("/api/support/public-contact", {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        sujet:
          formData.sujet ||
          `Demande de support - ${raisons.find((r) => r.value === formData.raison)?.label}`,
        raison: formData.raison,
        message: formData.message,
      });

      if (response.data?.success) {
        setSubmitted(true);
        toast.success("Votre demande a été envoyée avec succès !");

        // Réinitialiser après 3 secondes
        setTimeout(() => {
          setFormData({
            nom: "",
            prenom: "",
            email: "",
            telephone: "",
            sujet: "",
            message: "",
            raison: "compte_bloque",
          });
          setSubmitted(false);
          onClose();
        }, 3000);
      } else {
        toast.error(response.data?.message || "Erreur lors de l'envoi");
      }
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de l'envoi de votre demande",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Contacter le Support
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Formulaire pour compte bloqué ou problème de connexion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {submitted ? (
            // Message de confirmation
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Demande envoyée !
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Votre demande a été transmise à l'administration.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Vous recevrez une réponse par email dans les plus brefs délais.
              </p>
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  📧 Un email de confirmation a été envoyé à{" "}
                  <strong>{formData.email}</strong>
                </p>
              </div>
            </div>
          ) : (
            // Formulaire
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Alerte info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-300">
                    <p className="font-semibold mb-1">
                      Impossible de vous connecter ?
                    </p>
                    <p>
                      Utilisez ce formulaire pour contacter l'administration.
                      Vous recevrez une réponse par email.
                    </p>
                  </div>
                </div>
              </div>

              {/* Raison du contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Raison de votre demande *
                </label>
                <select
                  value={formData.raison}
                  onChange={(e) =>
                    setFormData({ ...formData, raison: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {raisons.map((raison) => (
                    <option key={raison.value} value={raison.value}>
                      {raison.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nom et Prénom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) =>
                        setFormData({ ...formData, nom: e.target.value })
                      }
                      placeholder="Votre nom"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prénom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.prenom}
                      onChange={(e) =>
                        setFormData({ ...formData, prenom: e.target.value })
                      }
                      placeholder="Votre prénom"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email professionnel *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="votre.email@serdi.cm"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  La réponse sera envoyée à cette adresse
                </p>
              </div>

              {/* Téléphone (optionnel) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Téléphone (optionnel)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) =>
                      setFormData({ ...formData, telephone: e.target.value })
                    }
                    placeholder="(+ 237) 6xx xxx xxx ou 2xx xxx xxx"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Sujet (optionnel) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sujet (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.sujet}
                  onChange={(e) =>
                    setFormData({ ...formData, sujet: e.target.value })
                  }
                  placeholder="Ex: Déblocage de compte urgent"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Décrivez votre problème *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Décrivez en détail votre problème et les informations qui pourraient aider l'administration à vous identifier (numéro d'employé, département, etc.)"
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Plus vous donnez de détails, plus vite nous pourrons vous
                  aider
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Envoyer la demande
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSupportSystem;
