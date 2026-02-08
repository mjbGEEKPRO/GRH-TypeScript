import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean; // Contrôle l'affichage de la modal
  onClose: () => void; // Callback pour fermer la modal
  title: string; // Titre de la modal
  children: React.ReactNode; // Contenu de la modal
  confirmText?: string; // Texte du bouton de confirmation
  cancelText?: string; // Texte du bouton d'annulation
  onConfirm?: () => void; // Callback pour l'action de confirmation
  onCancel?: () => void; // Callback pour l'action d'annulation
  className?: string; // Classe CSS optionnelle pour personnalisation
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  onConfirm,
  onCancel,
  className = "",
}) => {
  // Ne rien afficher si la modal est fermée
  if (!isOpen) return null;

  // Fermeture au clic en dehors de la modal
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Gestion du clavier (fermeture avec la touche Échap)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 ${className}`}
      >
        {/* En-tête de la modal */}
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h2
            id="modal-title"
            className="text-xl font-semibold text-gray-900 dark:text-gray-100"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Fermer"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Contenu de la modal */}
        <div className="max-h-[60vh] overflow-y-auto text-gray-700 dark:text-gray-300 mb-6 px-3">
          {children}
        </div>

        {/* Boutons d'action */}
        {(onConfirm || onCancel) && (
          <div className="flex justify-end space-x-4">
            {onCancel && (
              <button
                onClick={() => {
                  onCancel();
                  // onClose(); // Removed automatic close
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none transition duration-200"
              >
                {cancelText}
              </button>
            )}
            {onConfirm && (
              <button
                onClick={() => {
                  onConfirm();
                  // onClose(); // Removed automatic close
                }}
                type="button"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none transition duration-200"
              >
                {confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
