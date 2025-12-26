import React from "react";

interface ModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  val?: any;
  onClose: () => void;
  title: string;
  message: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onConfirm,
  val,
  onClose,
  title,
  message,
}) => {
  console.log("is open status", val);

  if (!isOpen) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] flex items-center justify-center w-full h-full"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90 border border-white/20 rounded-3xl shadow-2xl w-full max-w-4xl p-6">
        <h2 className="text-lg font-bold mb-4 text-white">{title}</h2>
        <p className="text-gray-200 mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            className="bg-transparent hover:bg-white/20 text-white font-bold py-2 px-4 rounded border border-white/50 mr-4"
            onClick={() => {
              onClose();
            }}
          >
            Annuler
          </button>
          <button
            className="bg-transparent hover:bg-white/20 text-white font-bold py-2 px-4 rounded border border-white/50"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
