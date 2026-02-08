import React, { useState, useEffect } from "react";
import {
  Shield,
  RefreshCw,
  Users,
  UserCheck,
  LogIn,
  AlertTriangle,
  MonitorPlay,
  Lock,
  TrendingUp,
  PieChart,
  FileText,
  Clock,
  User,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import api from "../../utils/api";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  failedLogins: number;
  successfulLogins: number;
  activeSessions: number;
  blockedUsers: number;
}

interface LoginActivity {
  date: string;
  success: number;
  failed: number;
}

interface RoleDistribution {
  name: string;
  value: number;
}

interface RecentLog {
  timestamp: string;
  user: string;
  action: string;
  ip: string;
  status: "success" | "failed" | "warning";
}

interface SecurityAlert {
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
}

const SecurityDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    failedLogins: 0,
    successfulLogins: 0,
    activeSessions: 0,
    blockedUsers: 0,
  });

  const [loginActivity, setLoginActivity] = useState<LoginActivity[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<RoleDistribution[]>(
    [],
  );
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDashboardData();
    // Actualiser toutes les 30 secondes
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (): Promise<void> => {
    try {
      setLoading(true);

      const res = await api.get("/api/dashboard");
      setStats(res.data.stats);
      setLoginActivity(res.data.loginActivity);
      setRoleDistribution(res.data.roleDistribution);
      setRecentLogs(res.data.recentLogs);
      setSecurityAlerts(res.data.securityAlerts);

      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const getAlertIcon = (
    severity: SecurityAlert["severity"],
  ): React.ReactElement => {
    switch (severity) {
      case "critical":
        return (
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
        );
      case "warning":
        return (
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        );
      case "info":
        return (
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        );
      default:
        return (
          <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        );
    }
  };

  const getAlertColor = (severity: SecurityAlert["severity"]): string => {
    switch (severity) {
      case "critical":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300";
      case "info":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300";
      default:
        return "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  // Mini graphique simple avec barres
  const SimpleBarChart: React.FC<{ data: LoginActivity[] }> = ({ data }) => {
    const maxValue = Math.max(
      ...data.map((d) => Math.max(d.success, d.failed)),
    );

    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>{item.date}</span>
              <span className="font-medium">{item.success + item.failed}</span>
            </div>
            <div className="flex gap-1 h-8">
              <div
                className="bg-green-500 dark:bg-green-600 rounded transition-all hover:opacity-80"
                style={{ width: `${(item.success / maxValue) * 100}%` }}
                title={`Réussies: ${item.success}`}
              />
              <div
                className="bg-red-500 dark:bg-red-600 rounded transition-all hover:opacity-80"
                style={{ width: `${(item.failed / maxValue) * 100}%` }}
                title={`Échouées: ${item.failed}`}
              />
            </div>
          </div>
        ))}
        <div className="flex items-center justify-center gap-6 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 dark:bg-green-600 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Réussies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 dark:bg-red-600 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Échouées</span>
          </div>
        </div>
      </div>
    );
  };

  // Graphique circulaire simple
  const SimplePieChart: React.FC<{ data: RoleDistribution[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const colors = [
      "#8b5cf6",
      "#ec4899",
      "#f59e0b",
      "#10b981",
      "#3b82f6",
      "#ef4444",
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {
                data.reduce(
                  (acc, item, index) => {
                    const percentage = (item.value / total) * 100;
                    const strokeDasharray = `${percentage} ${100 - percentage}`;
                    const strokeDashoffset = -acc.offset;

                    return {
                      slices: [
                        ...acc.slices,
                        <circle
                          key={index}
                          cx="50"
                          cy="50"
                          r="15.9155"
                          fill="none"
                          stroke={colors[index]}
                          strokeWidth="31.831"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all hover:opacity-80"
                        />,
                      ],
                      offset: acc.offset + percentage,
                    };
                  },
                  { slices: [] as React.ReactElement[], offset: 0 },
                ).slices
              }
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {total}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Total
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: colors[index] }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {item.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {item.value} ({((item.value / total) * 100).toFixed(0)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 dark:border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Chargement du dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-700 dark:to-purple-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <Shield className="w-10 h-10 mr-3" />
                Dashboard de Sécurité
              </h1>
              <p className="text-purple-100 dark:text-purple-200">
                Monitoring en temps réel de la sécurité du système
              </p>
            </div>
            <button
              onClick={loadDashboardData}
              className="bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 px-6 py-3 rounded-xl transition-all flex items-center gap-2 backdrop-blur-sm"
            >
              <RefreshCw className="w-5 h-5" />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {stats.totalUsers}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Utilisateurs
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
                <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Actifs
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {stats.activeUsers}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Utilisateurs actifs
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                <LogIn className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                24h
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {stats.successfulLogins}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Connexions réussies
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                24h
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {stats.failedLogins}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Échecs connexion
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-xl">
                <MonitorPlay className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Actuelles
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {stats.activeSessions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Sessions actives
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl">
                <Lock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Bloqués
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {stats.blockedUsers}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Comptes bloqués
            </div>
          </div>
        </div>

        {/* Alertes de sécurité */}
        {securityAlerts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2 text-red-600 dark:text-red-400" />
              Alertes de Sécurité
            </h2>
            <div className="space-y-3">
              {securityAlerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 ${getAlertColor(
                    alert.severity,
                  )} flex items-start gap-3`}
                >
                  {getAlertIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="font-semibold">{alert.title}</div>
                    <div className="text-sm mt-1">{alert.message}</div>
                    <div className="text-xs mt-2 opacity-75">
                      {alert.timestamp}
                    </div>
                  </div>
                  <button className="text-sm underline hover:no-underline">
                    Détails
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Activité de connexion */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
              Activité de Connexion (7 derniers jours)
            </h2>
            <SimpleBarChart data={loginActivity} />
          </div>

          {/* Distribution des rôles */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
              <PieChart className="w-6 h-6 mr-2 text-purple-600 dark:text-purple-400" />
              Distribution des Rôles
            </h2>
            <SimplePieChart data={roleDistribution} />
          </div>
        </div>

        {/* Logs récents */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
            Logs d'Activité Récents
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Date/Heure
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    <User className="w-4 h-4 inline mr-2" />
                    Utilisateur
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Action
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    <Globe className="w-4 h-4 inline mr-2" />
                    IP
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {log.timestamp}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {log.user
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {log.user}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700 dark:text-gray-300">
                      {log.action}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {log.ip}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          log.status === "success"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                            : log.status === "failed"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                              : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800"
                        }`}
                      >
                        {log.status === "success" && (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        {log.status === "failed" && (
                          <XCircle className="w-3 h-3" />
                        )}
                        {log.status === "warning" && (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {log.status === "success"
                          ? "Succès"
                          : log.status === "failed"
                            ? "Échec"
                            : "Avertissement"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium text-sm flex items-center gap-2">
              Voir tous les logs
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
