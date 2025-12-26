import React, { useState, useEffect } from "react";
import { authUtils } from "../../utils/redirectionForm";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getGreeting } from "../../utils/greeting";
import Settings from "../interface/setting";
import api from "../../utils/api";
import Modal from "../interface/logout/modal";
import ThemeToggle from "../../component/ThemeToggle";

interface User {
  id: string | number;
  prenom: string;
  nom: string;
  email?: string;
  departement: string;
  poste?: string;
  role?: string;
  telephone?: string;
  statut?: boolean;
}

interface ModalContent {
  title: string;
  message: string;
}

interface Task {
  id: string | number;
  titre: string;
  description: string;
  statut: "A faire" | "En cours" | "En attente" | "Terminé";
  priorite: "Haute" | "Normale" | "Basse";
  date_echeance: string;
  created_at: string;
  project_id?: string | number;
  projet_id?: string | number;
  projetId?: string | number;
  projetNom?: string;
}

interface Project {
  id: string | number;
  nom: string;
  description: string;
  statut: "A faire" | "En cours" | "En attente" | "Terminé";
  budget?: number;
  progression?: number;
  date_fin_prevue?: string;
  departements?: string[];
}

// interface Stats {
//   totalTasks: number;
//   completedTasks: number;
//   inProgressTasks: number;
//   pendingTasks: number;
//   overdueTasks: number;
// }

interface ModalContent {
  title: string;
  message: string;
}

type TabType = "dashboard" | "tasks" | "projects";

const Employer: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<ModalContent>({
    title: "Déconnexion",
    message: "Êtes-vous sûr de vouloir vous déconnecter ?",
  });

  // const [stats, setStats] = useState<Stats>({
  //   totalTasks: 0,
  //   completedTasks: 0,
  //   inProgressTasks: 0,
  //   pendingTasks: 0,
  //   overdueTasks: 0,
  // });

  useEffect(() => {
    const initializeComponent = async (): Promise<void> => {
      try {
        const isAuthenticated = await authUtils.verifyAndRedirect();

        if (isAuthenticated) {
          const userData = authUtils.getUserData();
          if (userData) {
            setUser(userData);
            await loadEmployeeData();
            authUtils.scheduleAutoLogout();
          }
        }
      } catch {
        setError("Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    initializeComponent();
  }, []);

  const loadEmployeeData = async (): Promise<void> => {
    try {
      const response = await api.get("/api/employee-data");
      const data = response.data.data;

      setMyTasks(data.tasks || []);
      setMyProjects(data.projects || []);

      // calculateStats(data.tasks || []);
    } catch (error) {
      console.error("Erreur chargement données:", error);
      toast.error("Erreur lors du chargement des données");
    }
  };

  // const calculateStats = (tasks: Task[]): void => {
  //   const now = new Date();
  //   const newStats: Stats = {
  //     totalTasks: tasks.length,
  //     completedTasks: tasks.filter((t) => t.statut === "Terminé").length,
  //     inProgressTasks: tasks.filter((t) => t.statut === "En cours").length,
  //     pendingTasks: tasks.filter((t) => t.statut === "A faire").length,
  //     overdueTasks: tasks.filter(
  //       (t) => new Date(t.date_echeance) < now && t.statut !== "Terminé"
  //     ).length,
  //   };
  //   setStats(newStats);
  // };

  //gerer la déconnexion
  useEffect(() => {
    // Configurer le handler pour afficher le modal lors d'une déconnexion automatique
    authUtils.setLogoutHandler((content: ModalContent) => {
      setModalContent(content);
      setIsModalOpen(true);
    });

    // Planifier la déconnexion automatique
    authUtils.scheduleAutoLogout();

    // Cleanup
    return () => {
      if (authUtils.autoLogoutTimer) {
        clearTimeout(authUtils.autoLogoutTimer);
      }
    };
  }, []);

  // Handler pour la déconnexion manuelle
  const handleManualLogout = (): void => {
    setModalContent({
      title: "🚪 Déconnexion",
      message: "Êtes-vous sûr de vouloir vous déconnecter ?",
    });
    setIsModalOpen(true);
  };

  // Confirmer la déconnexion
  const confirmLogout = async (): Promise<void> => {
    await authUtils.logout("Déconnexion manuelle");
  };

  // Fermer le modal sans déconnecter
  const closeModal = (): void => {
    setIsModalOpen(false);
  };

  const updateTaskStatus = async (
    taskId: string | number,
    newStatus: Task["statut"]
  ): Promise<void> => {
    try {
      const res = await api.patch(`/api/tasks/${taskId}/status`, {
        statut: newStatus,
      });

      if (res.data.success) {
        toast.success(res.data.message);

        const updatedTasks = myTasks.map((task) =>
          task.id === taskId ? { ...task, statut: newStatus } : task
        );

        setMyTasks(updatedTasks);
        // calculateStats(updatedTasks);
      }
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getStatusColor = (statut: Task["statut"]): string => {
    switch (statut) {
      case "Terminé":
        return "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "En cours":
        return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
      case "En attente":
        return "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
      case "A faire":
        return "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    }
  };

  const getPriorityColor = (priorite: Task["priorite"]): string => {
    switch (priorite) {
      case "Haute":
        return "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      case "Normale":
        return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
      case "Basse":
        return "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    }
  };

  const getDepartmentIcon = (departement: string): string => {
    switch (departement) {
      case "Informatique":
        return "💻";
      case "Comptabilité":
        return "📊";
      case "Ressources humaines":
        return "👥";
      case "Administration":
        return "🏢";
      default:
        return "📋";
    }
  };

  const isTaskOverdue = (
    dateEcheance: string,
    statut: Task["statut"]
  ): boolean => {
    return new Date(dateEcheance) < new Date() && statut !== "Terminé";
  };

  const getProjectTasks = (projectId: string | number): Task[] => {
    return myTasks.filter(
      (task) =>
        task.project_id === projectId ||
        task.projet_id === projectId ||
        task.projetId === projectId
    );
  };

  const renderDashboard = (): React.ReactElement => (
    <div className="space-y-6">
      {/* Logo entreprise animé */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="inline-block p-6 bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 rounded-3xl shadow-lg animate-pulse">
          <div className="text-6xl font-bold text-white">SERDI</div>
          <div className="text-sm text-white/80 mt-2">GestionRH</div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mt-4 font-medium">
          Bienvenue dans votre espace de travail
        </p>
      </div>

      {/* Tâches prioritaires */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            Tâches prioritaires
          </h2>
          <button
            onClick={() => setActiveTab("tasks")}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium"
          >
            Voir tout →
          </button>
        </div>
        <div className="space-y-3">
          {myTasks
            .filter(
              (task) => task.priorite === "Haute" && task.statut !== "Terminé"
            )
            .slice(0, 3)
            .map((task) => (
              <div
                key={task.id}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-gray-800 dark:text-gray-100 font-semibold mb-1">
                      {task.titre}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      Échéance:{" "}
                      {new Date(task.date_echeance).toLocaleDateString()}
                      {isTaskOverdue(task.date_echeance, task.statut) && (
                        <span className="text-red-600 dark:text-red-400 ml-2 font-medium">
                          ⚠️ En retard
                        </span>
                      )}
                    </p>
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                        task.statut
                      )}`}
                    >
                      {task.statut}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {task.statut !== "En cours" && (
                      <button
                        onClick={() => updateTaskStatus(task.id, "En cours")}
                        className="px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white text-xs rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
                      >
                        Commencer
                      </button>
                    )}
                    {task.statut !== "Terminé" && (
                      <button
                        onClick={() => updateTaskStatus(task.id, "Terminé")}
                        className="px-3 py-1 bg-green-600 dark:bg-green-700 text-white text-xs rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-medium"
                      >
                        Terminer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          {myTasks.filter(
            (task) => task.priorite === "Haute" && task.statut !== "Terminé"
          ).length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              ✨ Aucune tâche prioritaire en attente
            </div>
          )}
        </div>
      </div>

      {/* Projets actifs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            Projets actifs
          </h2>
          <button
            onClick={() => setActiveTab("projects")}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium"
          >
            Voir tout →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myProjects
            .filter((p) => p.statut === "En cours")
            .map((project) => {
              const projectTasks = getProjectTasks(project.id);
              return (
                <div
                  key={project.id}
                  className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
                >
                  <h3 className="text-gray-800 dark:text-gray-100 font-semibold mb-2">
                    {project.nom}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Barre de progression */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progression</span>
                      <span className="font-semibold">
                        {project.progression || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progression || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Mes tâches: {projectTasks.length}
                    </span>
                    <button
                      onClick={() => setActiveTab("projects")}
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                    >
                      Détails →
                    </button>
                  </div>
                </div>
              );
            })}
          {myProjects.filter((p) => p.statut === "En cours").length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-400 dark:text-gray-500">
              📁 Aucun projet actif
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTasks = (): React.ReactElement => (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Mes Tâches
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gérez et suivez l'avancement de vos tâches
        </p>
      </div>

      <div className="space-y-3">
        {myTasks.length > 0 ? (
          myTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      {task.titre}
                    </h3>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium border ${getPriorityColor(
                        task.priorite
                      )}`}
                    >
                      {task.priorite}
                    </span>
                    {isTaskOverdue(task.date_echeance, task.statut) && (
                      <span className="text-xs px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800 font-medium">
                        ⚠️ En retard
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
                    {task.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-gray-400 dark:text-gray-500"
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
                        {new Date(task.date_echeance).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-gray-400 dark:text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>
                        Créée: {new Date(task.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {task.projetNom && (
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-400 dark:text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                          />
                        </svg>
                        <span>Projet: {task.projetNom}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-6 flex flex-col items-end gap-2">
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                      task.statut
                    )}`}
                  >
                    {task.statut}
                  </span>

                  <div className="flex flex-col gap-2">
                    {task.statut === "A faire" && (
                      <button
                        onClick={() => updateTaskStatus(task.id, "En cours")}
                        className="text-xs px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
                      >
                        Commencer
                      </button>
                    )}
                    {task.statut === "En cours" && (
                      <button
                        onClick={() => updateTaskStatus(task.id, "Terminé")}
                        className="text-xs px-3 py-1 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-medium"
                      >
                        Terminer
                      </button>
                    )}
                    {task.statut === "Terminé" && (
                      <button
                        onClick={() => updateTaskStatus(task.id, "En cours")}
                        className="text-xs px-3 py-1 bg-orange-600 dark:bg-orange-700 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors font-medium"
                      >
                        Rouvrir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">📝</span>
            </div>
            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
              Aucune tâche assignée
            </h3>
            <p className="text-gray-400 dark:text-gray-500">
              Vos nouvelles tâches apparaîtront ici.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderProjects = (): React.ReactElement => (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Mes Projets
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Suivez l'avancement de vos projets en cours
        </p>
      </div>

      <div className="space-y-6">
        {myProjects.length > 0 ? (
          myProjects.map((project) => {
            const projectTasks = getProjectTasks(project.id);
            return (
              <div
                key={project.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                      {project.nom}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {project.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-400 dark:text-gray-500"
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
                        <span>
                          Budget: {(project.budget || 0).toLocaleString()} FCFA
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-400 dark:text-gray-500"
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
                          {project.date_fin_prevue
                            ? new Date(
                                project.date_fin_prevue
                              ).toLocaleDateString()
                            : "Non définie"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-400 dark:text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        <span>
                          Départements:{" "}
                          {project.departements
                            ? project.departements.join(", ")
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                      project.statut
                    )}`}
                  >
                    {project.statut}
                  </span>
                </div>

                {/* Barre de progression */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-medium">Progression globale</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {project.progression || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${project.progression || 0}%` }}
                    />
                  </div>
                </div>

                {/* Mes tâches dans ce projet */}
                <div>
                  <h4 className="text-gray-800 dark:text-gray-100 font-semibold mb-3">
                    Mes tâches dans ce projet ({projectTasks.length})
                  </h4>

                  {projectTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {projectTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                              {task.titre}
                            </h5>
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium border ${getPriorityColor(
                                task.priorite
                              )}`}
                            >
                              {task.priorite}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
                            Échéance:{" "}
                            {new Date(task.date_echeance).toLocaleDateString()}
                          </p>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                              task.statut
                            )}`}
                          >
                            {task.statut}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
                      Aucune tâche assignée dans ce projet
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">📁</span>
            </div>
            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
              Aucun projet assigné
            </h3>
            <p className="text-gray-400 dark:text-gray-500">
              Vos nouveaux projets apparaîtront ici.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Vérification de votre session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center">
          <h2 className="text-gray-800 dark:text-gray-100 text-2xl font-bold mb-4">
            Erreur
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-md"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-white text-center">
          <p>Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/50">
        <div className="p-6">
          {/* Logo SERDI */}
          <div className="mb-8 text-center">
            <div className="inline-block p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                SERDI
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                GestionRH
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-3 mb-8 p-4 bg-white/10 dark:bg-gray-700/30 rounded-2xl border border-white/20 dark:border-gray-600/50">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-semibold text-sm">
                {user.prenom?.charAt(0)}
                {user.nom?.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-semibold text-sm truncate">
                {user.prenom} {user.nom}
              </h2>
              <p className="text-white/60 dark:text-gray-400 text-xs truncate">
                {user.poste}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === "dashboard"
                  ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-lg"
                  : "text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/50"
              }`}
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("tasks")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeTab === "tasks"
                  ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-lg"
                  : "text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/50"
              }`}
            >
              <div className="flex items-center space-x-3">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <span className="font-medium">Mes tâches</span>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  activeTab === "tasks"
                    ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                    : "bg-white/20 dark:bg-gray-600/50 text-white dark:text-gray-300"
                }`}
              >
                {myTasks.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("projects")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeTab === "projects"
                  ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-lg"
                  : "text-white/70 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/50"
              }`}
            >
              <div className="flex items-center space-x-3">
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
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span className="font-medium">Mes projets</span>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  activeTab === "projects"
                    ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                    : "bg-white/20 dark:bg-gray-600/50 text-white dark:text-gray-300"
                }`}
              >
                {myProjects.length}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {getGreeting()}, {user.prenom} 👋
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {getDepartmentIcon(user.departement)} {user.departement}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                {/* Bouton Paramètres */}
                <button
                  onClick={() => setShowSettings(true)}
                  className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 shadow-sm"
                  title="Paramètres"
                >
                  <svg
                    className="w-5 h-5 hover:rotate-90 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>

                {/* Bouton Déconnexion */}
                <button
                  onClick={handleManualLogout}
                  className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 py-2 px-5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 shadow-sm font-medium flex items-center gap-2"
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
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "tasks" && renderTasks()}
          {activeTab === "projects" && renderProjects()}
        </main>
      </div>

      {/* Composant Paramètres */}
      {showSettings && (
        <Settings user={user} onClose={() => setShowSettings(false)} />
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onConfirm={confirmLogout}
        onClose={closeModal}
        title={modalContent.title}
        message={modalContent.message}
      />

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
    </div>
  );
};

export default Employer;
