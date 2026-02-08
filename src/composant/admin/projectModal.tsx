import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../utils/api";
import { AxiosError } from "axios";
// 🔐 Importer les composants de permissions
import { Can, AccessDenied } from "../../Toggle_guard/PermissionGuard";
import { usePermissions } from "../../contexte/contextPermissions/PermissionContext";

interface Department {
  id: string | number;
  nom: string;
  description?: string;
}

interface Project {
  id: string | number;
  nom: string;
  budget: number;
  date_fin_prevue: string;
  description: string;
  departements: string[];
  statut: "En cours" | "Terminé" | "A faire";
  dateCreation?: string;
}

interface ProjectForm {
  nom: string;
  budget: string;
  date_fin_prevue: string;
  description: string;
  departements: string[];
  statut: "En cours" | "Terminé" | "A faire";
}

interface ApiErrorResponse {
  message: string;
}

const ProjectManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);

  // 🔐 Hook des permissions
  const { hasPermission } = usePermissions();

  const [projectForm, setProjectForm] = useState<ProjectForm>({
    nom: "",
    budget: "",
    date_fin_prevue: "",
    description: "",
    departements: [],
    statut: "En cours",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin-data`);
      setProjects(res.data.data.projects);
      setDepartments(res.data.data.departements);
    } catch {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = (
    departmentName: string,
    checked: boolean,
  ): void => {
    if (departmentName === "all") {
      if (checked) {
        setProjectForm({
          ...projectForm,
          departements: departments.map((d) => d.nom),
        });
      } else {
        setProjectForm({ ...projectForm, departements: [] });
      }
    } else {
      const newDepartements = checked
        ? [...projectForm.departements, departmentName]
        : projectForm.departements.filter((d) => d !== departmentName);

      setProjectForm({ ...projectForm, departements: newDepartements });
    }
  };

  const createProject = async (): Promise<void> => {
    // 🔐 Vérifier la permission avant de créer
    if (!hasPermission("projects.create")) {
      toast.error("Vous n'avez pas la permission de créer des projets");
      return;
    }

    if (
      !projectForm.nom ||
      !projectForm.budget ||
      !projectForm.date_fin_prevue ||
      projectForm.departements.length === 0
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      const newProject: Project = {
        id: projects.length + 1,
        ...projectForm,
        budget: parseFloat(projectForm.budget),
        dateCreation: new Date().toISOString().split("T")[0],
      };

      const res = await api.post("/api/newprojects", newProject);
      if (res.data.success) {
        setProjects([...projects, newProject]);
        setShowProjectModal(false);
        setProjectForm({
          nom: "",
          budget: "",
          date_fin_prevue: "",
          description: "",
          departements: [],
          statut: "En cours",
        });
        toast.success(res.data.message);
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
      }
    }
  };

  const deleteProject = async (projectId: string | number): Promise<void> => {
    // 🔐 Vérifier la permission avant de supprimer
    if (!hasPermission("projects.delete")) {
      toast.error("Vous n'avez pas la permission de supprimer des projets");
      return;
    }

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
      return;
    }

    try {
      const response = await api.delete(`/api/deleted/${projectId}`);
      if (response.data.success) {
        toast.success(response.data.message);
        setProjects(projects.filter((p) => p.id !== projectId));
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      if (axiosError.response) {
        const serverErrorMessage = axiosError.response.data.message;
        if (
          axiosError.response.status === 422 ||
          axiosError.response.status === 403 ||
          axiosError.response.status === 401 ||
          axiosError.response.status === 400
        ) {
          toast.info(serverErrorMessage);
        } else if (axiosError.response.status === 500) {
          toast.error(`❌ ${serverErrorMessage}`);
        }
      } else {
        toast.error("❌ Erreur ");
      }
    }
  };

  const getProgressPercentage = (): number => {
    return 5;
  };

  const getStatusColor = (statut: Project["statut"]): string => {
    switch (statut) {
      case "En cours":
        return "from-blue-400 to-blue-500";
      case "Terminé":
        return "from-green-400 to-green-500";
      default:
        return "from-purple-400 to-purple-500";
    }
  };

  // 🔐 Vérifier si l'utilisateur peut voir les projets
  if (!hasPermission("projects.view")) {
    return <AccessDenied section="la gestion des projets" />;
  }

  return (
    <div>
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Mes Projets</h1>
            <p className="text-gray-500 text-sm mt-1">
              Total projets:{" "}
              <span className="font-semibold">{projects.length}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button className="p-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <button
              onClick={loadData}
              className="p-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
              title="Rafraîchir les projets"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            {/* 🔐 Bouton "Nouveau Projet" protégé */}
            <Can
              permission="projects.create"
              fallback={
                <button
                  onClick={() =>
                    toast.error(
                      "Vous n'avez pas la permission de créer des projets",
                    )
                  }
                  className="px-5 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium relative group"
                  title="Permission requise"
                >
                  + Nouveau Projet 🔒
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Permission refusée
                  </span>
                </button>
              }
            >
              <button
                onClick={() => setShowProjectModal(true)}
                className="px-5 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md font-medium"
              >
                + Nouveau Projet
              </button>
            </Can>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group relative overflow-hidden"
          >
            {/* Illustration/Icon Section */}
            <div className="flex items-center mb-4">
              <div
                className={`w-20 h-20 bg-gradient-to-br ${getStatusColor(
                  project.statut,
                )} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}
              >
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

              {/* 🔐 Bouton de suppression protégé */}
              <div className="ml-auto flex items-center gap-2">
                <Can
                  permission="projects.delete"
                  fallback={
                    <button
                      onClick={() =>
                        toast.error(
                          "Vous n'avez pas la permission de supprimer",
                        )
                      }
                      className="p-2 text-gray-300 cursor-not-allowed rounded-lg"
                      title="Permission requise"
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
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  }
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(project.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
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
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </Can>
              </div>
            </div>

            {/* Project Title */}
            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
              {project.nom}
            </h3>

            {/* Project Description */}
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {project.description || "Aucune description disponible"}
            </p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progression</span>
                <span className="font-semibold">
                  {getProgressPercentage()}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`bg-gradient-to-r ${getStatusColor(
                    project.statut,
                  )} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>

            {/* Project Info */}
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{project.budget.toLocaleString()} FCFA</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>
                  Échéance:{" "}
                  {new Date(project.date_fin_prevue).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Départements:</span>
                <span className="text-xs font-medium text-gray-700">
                  {project.departements.slice(0, 2).join(", ")}
                </span>
              </div>
              <button
                className={`w-8 h-8 bg-gradient-to-r ${getStatusColor(
                  project.statut,
                )} rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 🔐 Modal de création de projet protégé */}
      {showProjectModal && (
        <Can
          permission="projects.create"
          fallback={
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-3xl p-8 max-w-md text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Accès Refusé
                </h2>
                <p className="text-gray-600 mb-4">
                  Vous n'avez pas la permission de créer des projets.
                </p>
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          }
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Créer un nouveau projet
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Nom du projet *
                  </label>
                  <input
                    type="text"
                    placeholder="Entrez le nom du projet"
                    value={projectForm.nom}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, nom: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Budget (FCFA) *
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={projectForm.budget}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, budget: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Date de fin prévue *
                  </label>
                  <input
                    type="date"
                    value={projectForm.date_fin_prevue}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        date_fin_prevue: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Départements concernés *
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-50 rounded-xl p-4 border border-gray-300">
                    <label className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          projectForm.departements.length === departments.length
                        }
                        onChange={(e) =>
                          handleDepartmentChange("all", e.target.checked)
                        }
                        className="w-4 h-4 text-purple-500 bg-white border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-gray-800 font-medium">
                        Tous les départements
                      </span>
                    </label>
                    <hr className="border-gray-200 my-2" />

                    {departments.map((dept) => (
                      <label
                        key={dept.id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={projectForm.departements.includes(dept.nom)}
                          onChange={(e) =>
                            handleDepartmentChange(dept.nom, e.target.checked)
                          }
                          className="w-4 h-4 text-purple-500 bg-white border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-gray-700">{dept.nom}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    {projectForm.departements.length} département(s)
                    sélectionné(s)
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Description du projet
                  </label>
                  <textarea
                    placeholder="Décrivez brièvement le projet..."
                    value={projectForm.description}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        description: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={createProject}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all shadow-md"
                >
                  Créer le projet
                </button>
              </div>
            </div>
          </div>
        </Can>
      )}

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

export default ProjectManagement;
