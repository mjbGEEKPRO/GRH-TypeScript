import React from "react";

// Interfaces
interface ModalCompteDesactiveProps {
  open?: boolean;
  onClose?: () => void;
  onContact?: () => void;
}

/**
 * Modal affichée lorsqu'un compte utilisateur est désactivé
 * @param open - État d'ouverture du modal (défaut: true)
 * @param onClose - Callback appelé à la fermeture du modal
 * @param onContact - Callback appelé lors du clic sur "Contacter l'administration"
 */
const ModalCompteDesactive: React.FC<ModalCompteDesactiveProps> = ({
  open = true,
  onClose = () => {
    window.location.href = "/";
  },
  onContact = () => {},
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gradient-to-b from-black/60 to-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 mx-4 max-w-xl w-full">
        <div className="transform transition-all duration-300 ease-out scale-100">
          <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/10">
            {/* Header with Indigo Purple gradient */}
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {/* Shield / Lock icon */}
                  <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-white text-lg font-semibold leading-tight">
                    Compte désactivé
                  </h3>
                  <p className="mt-1 text-indigo-100 text-sm/relaxed">
                    Accès non autorisé
                  </p>
                </div>

                <button
                  onClick={onClose}
                  aria-label="Fermer"
                  className="ml-3 -mr-2 rounded-md p-2 text-indigo-100 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.293 6.293a1 1 0 011.414 0L10 8.586l2.293-2.293a1 1 0 111.414 1.414L11.414 10l2.293 2.293a1 1 0 01-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 01-1.414-1.414L8.586 10 6.293 7.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    <strong>Compte désactivé.</strong> Veuillez contacter
                    l'administration pour le récupérer. Vous avez désactivé
                    votre compte.
                  </p>

                  <p className="mt-3 text-xs text-slate-400">
                    Si vous pensez que c'est une erreur, fournissez le maximum
                    d'informations (nom d'utilisateur, adresse e‑mail, date
                    approximative) au support.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
                <button
                  onClick={onContact}
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-indigo-600 text-white shadow hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Contacter l'administration
                </button>

                <button
                  onClick={onClose}
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg px-4 py-2 text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>

            {/* Footer subtle */}
            <div className="px-6 py-3 bg-gradient-to-t from-slate-50 to-white border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Assistance disponible du lundi au vendredi
                </span>
                <span className="font-mono text-slate-300">Réf. #AC-403</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalCompteDesactive;