import React, { useReducer, useState } from "react";
import { X, Plus, Minus, Building2, Briefcase, Save, AlertCircle } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../utils/api";
// Types
interface DepartementState {
  nombre: number;
  nomDepartement: string;
  postes: string[];
}

type DepartementAction =
  | { type: "SET_NOMBRE"; payload: number }
  | { type: "SET_DEPARTEMENT"; payload: string }
  | { type: "SET_POSTE"; index: number; value: string }
  | { type: "ADD_POSTE" }
  | { type: "REMOVE_POSTE" }
  | { type: "SET_NOMBRE_POSTES"; payload: number }
  | { type: "RESET" };

interface DepartementPosteCreateProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApiResponse {
  success: boolean;
  message: string;
  departement?: {
    id: number;
    nom: string;
    postes: Array<{
      id: number;
      nom: string;
    }>;
  };
}

// Reducer
const reducer = (state: DepartementState, action: DepartementAction): DepartementState => {
  switch (action.type) {
    case "SET_NOMBRE":
      return { ...state, nombre: action.payload };
    
    case "SET_DEPARTEMENT":
      return { ...state, nomDepartement: action.payload };
    
    case "SET_POSTE": {
      const newPostes = [...state.postes];
      newPostes[action.index] = action.value;
      return { ...state, postes: newPostes };
    }
    
    case "ADD_POSTE":
      return {
        ...state,
        nombre: state.nombre + 1,
        postes: [...state.postes, ""]
      };
    
    case "REMOVE_POSTE":
      if (state.nombre > 1) {
        return {
          ...state,
          nombre: state.nombre - 1,
          postes: state.postes.slice(0, -1)
        };
      }
      return state;
    
    case "SET_NOMBRE_POSTES": {
      const diff = action.payload - state.nombre;
      let newPostesArray = [...state.postes];

      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          newPostesArray.push("");
        }
      } else if (diff < 0) {
        newPostesArray = newPostesArray.slice(0, action.payload);
      }

      return {
        ...state,
        nombre: action.payload,
        postes: newPostesArray
      };
    }
    
    case "RESET":
      return initialState;
    
    default:
      return state;
  }
};

// Initial State
const initialState: DepartementState = {
  nombre: 3,
  nomDepartement: "",
  postes: ["", "", ""]
};

// Component
const Departement_poste_Create: React.FC<DepartementPosteCreateProps> = ({ isOpen, onClose }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleNombreClick = (nombre: number): void => {
    dispatch({ type: "SET_NOMBRE_POSTES", payload: nombre });
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();

    if (!state.nomDepartement.trim()) {
      toast.error("Veuillez entrer le nom du département");
      return;
    }

    const postesVides = state.postes.filter((p) => !p.trim()).length;
    if (postesVides > 0) {
      toast.warning(`${postesVides} poste(s) n'ont pas de nom`);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/api/departements", {
        nom: state.nomDepartement,
        postes: state.postes.filter(p => p.trim())
      });

      const data: ApiResponse = await response.data;

      if (data.success) {
        toast.success(
          `Département "${state.nomDepartement}" créé avec ${state.postes.length} poste(s)`
        );
        setTimeout(() => {
          dispatch({ type: "RESET" });
          onClose();
        }, 1500);
      } else {
        toast.error(data.message || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la création du département");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-700 dark:to-purple-900 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Nouveau Département
                </h2>
                <p className="text-purple-100 text-sm">
                  Créez un département avec ses postes
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Nom du département */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nom du Département
                </label>
                <input
                  type="text"
                  value={state.nomDepartement}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    dispatch({ type: "SET_DEPARTEMENT", payload: e.target.value })
                  }
                  placeholder="Ex: Ressources Humaines, IT, Marketing..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>

              {/* Nombre de postes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Nombre de Postes
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "REMOVE_POSTE" })}
                    disabled={state.nombre <= 1}
                    className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <div className="flex-1 flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleNombreClick(num)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          state.nombre === num
                            ? "bg-purple-600 text-white shadow-md scale-110"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => dispatch({ type: "ADD_POSTE" })}
                    className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Actuellement: <span className="font-bold text-purple-600 dark:text-purple-400">{state.nombre}</span> poste(s)
                </p>
              </div>

              {/* Liste des postes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Postes à créer
                </label>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {state.postes.map((poste, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 group"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <input
                        type="text"
                        value={poste}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          dispatch({
                            type: "SET_POSTE",
                            index: index,
                            value: e.target.value
                          })
                        }
                        placeholder={`Nom du poste ${index + 1}...`}
                        className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "REMOVE_POSTE" })}
                        disabled={state.nombre <= 1}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all disabled:opacity-0"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-semibold mb-1">Information</p>
                  <p>Les postes créés seront automatiquement associés au département "{state.nomDepartement || "..."}"</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !state.nomDepartement.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Créer le Département
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
};

export default Departement_poste_Create;