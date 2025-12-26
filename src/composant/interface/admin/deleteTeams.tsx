import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../../utils/api";
import { AxiosError } from "axios";

interface Team {
  id: string | number;
  nom: string;
  departement: string;
  description?: string;
  created_at: string;
  project_id: string | number;
}

interface DeleteTeamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  onTeamsDeleted: (teamIds: (string | number)[]) => void;
}

interface ApiErrorResponse {
  message: string;
}

const DeleteTeamsModal: React.FC<DeleteTeamsModalProps> = ({
  isOpen,
  onClose,
  teams,
  onTeamsDeleted,
}) => {
  const [selectedTeams, setSelectedTeams] = useState<(string | number)[]>([]);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [selectAll, setSelectAll] = useState<boolean>(false);

  // Reset state si le modal ouvert / fermer
  useEffect(() => {
    if (isOpen) {
      setSelectedTeams([]);
      setSelectAll(false);
    }
  }, [isOpen]);

  // Handle pour sélectionner les teams
  const handleSelectAll = (): void => {
    if (selectAll) {
      setSelectedTeams([]);
    } else {
      setSelectedTeams(teams.map((team) => team.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle pour select une team
  const handleTeamSelect = (teamId: string | number): void => {
    setSelectedTeams((prev) => {
      const newSelection = prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId];

      // Update selectAll state
      setSelectAll(newSelection.length === teams.length);
      return newSelection;
    });
  };

  // Delete selected teams
  const handleDelete = async (): Promise<void> => {
    if (selectedTeams.length === 0) {
      toast.warning("Veuillez sélectionner au moins une équipe à supprimer");
      return;
    }
    const project_id = teams.length > 0 ? teams[0].project_id : null;
    console.log("id du projet ", project_id, "id teams ", selectedTeams);

    if (!project_id) {
      toast.error("id du projet non trouvé");
      return;
    }

    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir supprimer ${selectedTeams.length} équipe(s) ? Cette action est irréversible.`
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      console.log("id avant api ", project_id);
      const response = await api.delete(`/api/projects/${project_id}`, {
        data: { team_ids: selectedTeams },
      });

      if (response.data.success) {
        toast.success(response.data.message);
        onTeamsDeleted(selectedTeams);
        onClose();
      }
    } catch (error) {
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
        toast.error("❌ Erreur ");
        console.log("erreur", error);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Don't render if modal is not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Supprimer des équipes
            </h2>
            <p className="text-white/70 text-sm mt-1">
              Sélectionnez les équipes que vous souhaitez supprimer
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-2"
            disabled={isDeleting}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

        {/* Select All Checkbox */}
        <div className="mb-4 pb-4 border-b border-white/20">
          <label className="flex items-center cursor-pointer text-white">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="w-4 h-4 text-red-600 bg-white/10 border-white/30 rounded focus:ring-red-500 focus:ring-2 mr-3"
              disabled={isDeleting}
            />
            <span className="font-medium">
              Tout sélectionner ({teams.length} équipes)
            </span>
          </label>
        </div>

        {/* Teams List */}
        <div className="max-h-96 overflow-y-auto mb-6 space-y-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedTeams.includes(team.id)
                  ? "bg-red-500/20 border-red-500/50"
                  : "bg-white/5 border-white/20 hover:bg-white/10"
              }`}
              onClick={() => !isDeleting && handleTeamSelect(team.id)}
            >
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTeams.includes(team.id)}
                  onChange={() => handleTeamSelect(team.id)}
                  className="w-4 h-4 text-red-600 bg-white/10 border-white/30 rounded focus:ring-red-500 focus:ring-2 mt-1 mr-3"
                  disabled={isDeleting}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">{team.nom}</h3>
                    <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                      {team.departement}
                    </span>
                  </div>
                  {team.description && (
                    <p className="text-white/60 text-sm">{team.description}</p>
                  )}
                  <div className="text-xs text-white/50 mt-2">
                    Créée le {new Date(team.created_at).toLocaleDateString()}
                  </div>
                </div>
              </label>
            </div>
          ))}

          {teams.length === 0 && (
            <div className="text-center py-8 text-white/50">
              <p>Aucune équipe disponible</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center">
          <div className="text-white/60 text-sm">
            {selectedTeams.length > 0 ? (
              <span className="text-red-400 font-medium">
                {selectedTeams.length} équipe(s) sélectionnée(s)
              </span>
            ) : (
              "Aucune équipe sélectionnée"
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              disabled={isDeleting}
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              disabled={selectedTeams.length === 0 || isDeleting}
              className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Suppression...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Supprimer ({selectedTeams.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteTeamsModal;
