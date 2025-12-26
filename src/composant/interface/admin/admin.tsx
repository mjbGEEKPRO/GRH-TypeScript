import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import { authUtils } from "../../../utils/redirectionForm";
import { getGreeting } from "../../../utils/greeting";
import Permissions from "../permission";
import ConnectionHistory from "./connexionHistorique";
import ProjectManagement from "./projectModal";
import TaskManagement from "./taskModal";
import UserManagement from "./userModal";
import SecurityDashboard from "./dashboard";
import Modal from "../logout/modal";
import SettingsModal from "../setting";
import ThemeToggle from "../../../component/ThemeToggle";
import { Can, AccessDenied } from "../../../component/PermissionGuard";
import { usePermissions } from "../../../contexte/contextPermissions/PermissionContext";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Shield,
  History,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Lock,
  Menu,
  X,
  Bell,
  Settings as LucideSettings,
} from "lucide-react";

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

interface NavigationItem {
  id: SectionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
}


interface ModalContent {
  title: string;
  message: string;
}

type SectionType =
  | "dashboard"
  | "users"
  | "projects"
  | "tasks"
  | "permissions"
  | "connexion"
  | "reports";

const AdminDashboard: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<SectionType>("dashboard");
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
 const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<ModalContent>({
    title: "Déconnexion",
    message: "Êtes-vous sûr de vouloir vous déconnecter ?",
  });
  const { hasPermission } = usePermissions();
  const SettingsIcon = LucideSettings;

  useEffect(() => {
    const initializeData = async (): Promise<void> => {
      try {
        const isAuthenticated = await authUtils.verifyAndRedirect();
        if (isAuthenticated) {
          const userData = authUtils.getUserData();

          if (userData?.departement !== "Administration") {
            window.location.href = "/denied";
          }

          setUser(userData);
        }
      } catch (error) {
        console.error("Erreur vérification auth:", error);
        window.location.href = "/";
      }
    };

    initializeData();
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


  const navigationItems: NavigationItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      permission: "admin.dashboard",
    },
    {
      id: "users",
      label: "Utilisateurs",
      icon: Users,
      permission: "users.view",
    },
    {
      id: "projects",
      label: "Projets",
      icon: FolderKanban,
      permission: "projects.view",
    },
    {
      id: "tasks",
      label: "Tâches",
      icon: CheckSquare,
      permission: "tasks.view",
    },
    {
      id: "permissions",
      label: "Permissions",
      icon: Shield,
      permission: "permissions.view",
    },
    {
      id: "connexion",
      label: "Historique",
      icon: History,
      permission: "connexion.history",
    },
    {
      id: "reports",
      label: "Rapports",
      icon: BarChart3,
      permission: "reports.view",
    },
  ];

  const renderContent = (): React.ReactElement => {
    switch (activeSection) {
      case "users":
        return (
          <Can
            permission="users.view"
            fallback={<AccessDenied section="la gestion des utilisateurs" />}
          >
            <UserManagement
              onNavigateToPermissions={() => setActiveSection("permissions")}
            />
          </Can>
        );

      case "projects":
        return (
          <Can
            permission="projects.view"
            fallback={<AccessDenied section="la gestion des projets" />}
          >
            <ProjectManagement />
          </Can>
        );

      case "tasks":
        return (
          <Can
            permission="tasks.view"
            fallback={<AccessDenied section="la gestion des tâches" />}
          >
            <TaskManagement
              onNavigateToPermissions={() => setActiveSection("permissions")}
            />
          </Can>
        );

      case "permissions":
        return (
          <Can
            permission="permissions.view"
            fallback={<AccessDenied section="la gestion des permissions" />}
          >
            <Permissions />
          </Can>
        );

      case "connexion":
        return (
          <Can
            permission="connexion.history"
            fallback={<AccessDenied section="l'historique des connexions" />}
          >
            <ConnectionHistory />
          </Can>
        );

      case "reports":
        return (
          <Can
            permission="reports.view"
            fallback={<AccessDenied section="les rapports" />}
          >
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Section Rapports
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Les rapports et statistiques seront bientôt disponibles.
              </p>
            </div>
          </Can>
        );

      default:
        return (
          <Can
            permission="admin.dashboard"
            fallback={<AccessDenied section="le tableau de bord" />}
          >
            <SecurityDashboard />
          </Can>
        );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Vérification des autorisations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 flex overflow-hidden">
      <ToastContainer />

      {/* Sidebar Desktop */}
      <aside
        className={`hidden lg:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-72"
        }`}
      >
        {/* Logo & Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800 dark:text-white">
                  Admin
                </h1>
                
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* User Info */}
        <div
          className={`p-4 border-b border-gray-200 dark:border-gray-800 ${
            sidebarCollapsed ? "flex justify-center" : ""
          }`}
        >
          <div
            className={`flex items-center ${
              sidebarCollapsed ? "flex-col" : "gap-3"
            }`}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-white font-bold text-sm">
                {user?.prenom?.charAt(0)}
                {user?.nom?.charAt(0)}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                  {user?.prenom} {user?.nom}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  Administrateur
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const canAccess = hasPermission(item.permission);
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => canAccess && setActiveSection(item.id)}
                  disabled={!canAccess}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative group ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/30"
                      : canAccess
                      ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      : "text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60"
                  } ${sidebarCollapsed ? "justify-center" : ""}`}
                  title={
                    sidebarCollapsed
                      ? item.label
                      : canAccess
                      ? ""
                      : "Permission requise"
                  }
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isActive
                        ? ""
                        : "group-hover:scale-110 transition-transform"
                    }`}
                  />
                  {!sidebarCollapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left truncate">
                        {item.label}
                      </span>
                      {!canAccess && <Lock className="w-4 h-4 flex-shrink-0" />}
                    </>
                  )}
                  {sidebarCollapsed && !canAccess && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Legend for restricted access */}
        <Can
          permission="admin.access"
          fallback={
            <div className={`mx-2 mb-2 ${sidebarCollapsed ? "hidden" : ""}`}>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                    Accès restreint
                  </p>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
                  Contactez l'administrateur pour plus de permissions
                </p>
              </div>
            </div>
          }
        />
        {/* Bottom Actions */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-2 space-y-1">
          <Can
            permission="admin.settings"
            fallback={
              <button
                onClick={() =>
                  toast.error("❌ Vous n'avez pas accès aux paramètres")
                }
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-not-allowed relative group ${
                  sidebarCollapsed ? "justify-center" : ""
                }`}
                title={
                  sidebarCollapsed ? "Paramètres (Accès refusé)" : "Accès refusé"
                }
              >
                <SettingsIcon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="text-sm font-medium flex-1 text-left">
                      Paramètres
                    </span>
                    <Lock className="w-4 h-4 flex-shrink-0" />
                  </>
                )}
                {sidebarCollapsed && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
                )}
              </button>
            }
          >
            <button
              onClick={() => setShowSettings(true)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
              title={sidebarCollapsed ? "Paramètres" : ""}
            >
              <SettingsIcon className="w-5 h-5 flex-shrink-0 group-hover:rotate-90 transition-transform duration-300" />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">Paramètres</span>
              )}
            </button>
          </Can>

          <button
            onClick={() => authUtils.logout()}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
            title={sidebarCollapsed ? "Déconnexion" : ""}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-sm font-medium">Déconnexion</span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800"
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-800 dark:text-white" />
        ) : (
          <Menu className="w-6 h-6 text-gray-800 dark:text-white" />
        )}
      </button>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 z-50 shadow-2xl">
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800 dark:text-white">
                    AdminPro
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    v2.0
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">
                    {user?.prenom?.charAt(0)}
                    {user?.nom?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                    {user?.prenom} {user?.nom}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Administrateur
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-2 max-h-[calc(100vh-220px)]">
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const canAccess = hasPermission(item.permission);
                  const isActive = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (canAccess) {
                          setActiveSection(item.id);
                          setMobileMenuOpen(false);
                        }
                      }}
                      disabled={!canAccess}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                          : canAccess
                          ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          : "text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-medium flex-1 text-left">
                        {item.label}
                      </span>
                      {!canAccess && <Lock className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-gray-200 dark:border-gray-800 p-2 space-y-1">
              <Can
                permission="admin.settings"
                fallback={
                  <button
                    onClick={() => {
                      toast.error("❌ Vous n'avez pas accès aux paramètres");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                  >
                    <SettingsIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium flex-1 text-left">
                      Paramètres
                    </span>
                    <Lock className="w-4 h-4" />
                  </button>
                }
              >
                <button
                  onClick={() => {
                   handleManualLogout
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <SettingsIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Paramètres</span>
                </button>
              </Can>

              <button
                onClick={() => authUtils.logout()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="flex-shrink-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="hidden lg:block">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                {getGreeting()}, {user?.prenom}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Administration -{" "}
                {
                  navigationItems.find((item) => item.id === activeSection)
                    ?.label
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <button className="relative p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"></span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Can
          permission="admin.settings"
          fallback={
            <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  Accès Refusé aux Paramètres
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Vous n'avez pas la permission d'accéder aux paramètres
                  système.
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 inline-block px-4 py-2 rounded-lg mb-6">
                  Permission requise: <strong>admin.settings</strong>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all w-full font-medium"
                >
                  Fermer
                </button>
              </div>
            </div>
          }
        >
          <SettingsModal user={user} onClose={() => setShowSettings(false)} />
        </Can>
      )}
    </div>
  );
};

export default AdminDashboard;