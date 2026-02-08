import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { FileSpreadsheet, FileText } from "lucide-react";

interface Connection {
  id: string | number;
  prenom: string;
  nom: string;
  email_pro: string;
  departement: string;
  roles: string;
  login_at: string;
  logout_at: string | null;
  session_duration: number | null;
  ip_address: string | null;
  created_at: string;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  from: number;
  to: number;
  total: number;
}

interface Stats {
  total_connections_today?: number;
  unique_users_today?: number;
  avg_session_duration?: number;
  total_connections_this_week?: number;
}

interface Filters {
  date_from: string;
  date_to: string;
  departement: string;
  per_page: number;
}

interface ApiErrorResponse {
  message: string;
}

interface ApiResponse {
  success: boolean;
  data: Connection[];
  pagination: Pagination;
  stats: Stats;
}

const ConnectionHistory: React.FC = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    last_page: 1,
    per_page: 50,
    from: 0,
    to: 0,
    total: 0,
  });
  const [stats, setStats] = useState<Stats>({});
  const [filters, setFilters] = useState<Filters>({
    date_from: "",
    date_to: "",
    departement: "",
    per_page: 50,
  });
  const [exporting, setExporting] = useState<boolean>(false);

  const departements: string[] = [
    "Administration",
    "Informatique",
    "Comptabilité",
    "Marketing",
    "Ressources humaines",
  ];

  const loadConnectionHistory = async (page: number = 1): Promise<void> => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, ...filters };

      Object.keys(params).forEach((key) => {
        if (
          params[key] === "" ||
          params[key] === null ||
          params[key] === undefined
        ) {
          delete params[key];
        }
      });

      const response = await api.get<ApiResponse>(
        "/api/admin/connection-history",
        { params },
      );

      if (response.data.success) {
        setConnections(response.data.data);
        setPagination(response.data.pagination);
        setStats(response.data.stats);
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      if (axiosError.response) {
        const serverErrorMessage = axiosError.response.data.message;
        if ([422, 403, 401, 404].includes(axiosError.response.status)) {
          toast.info(`❌ ${serverErrorMessage}`);
        } else if (axiosError.response.status === 500) {
          toast.error(`❌ ${serverErrorMessage}`);
        }
      } else {
        toast.error("Erreur lors du chargement des données");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async (): Promise<void> => {
    setExporting(true);
    try {
      const params: Record<string, string> = {
        date_from: filters.date_from,
        date_to: filters.date_to,
        departement: filters.departement,
        format: "csv",
      };

      Object.keys(params).forEach((key) => {
        if (params[key] === "") delete params[key];
      });

      const response = await api.get("/api/admin/connection-history/export", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const filename = `historique_connexions_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Export CSV réussi !");
    } catch (error) {
      console.log("Erreur lors de l'export CSV:", error);
      toast.error("Erreur lors de l'export CSV");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async (): Promise<void> => {
    setExporting(true);
    try {
      const params: Record<string, string> = {
        date_from: filters.date_from,
        date_to: filters.date_to,
        departement: filters.departement,
        format: "pdf",
      };

      Object.keys(params).forEach((key) => {
        if (params[key] === "") delete params[key];
      });

      const response = await api.get("/api/admin/connection-history/export", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const filename = `historique_connexions_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Export PDF réussi !");
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      toast.error("Erreur lors de l'export PDF");
    } finally {
      setExporting(false);
    }
  };

  const formatSessionDuration = (seconds: number | null): string => {
    if (!seconds) return "En cours";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const formatTime = (dateString: string | null): string => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString("fr-FR");
  };

  const handleFilterChange = (
    key: keyof Filters,
    value: string | number,
  ): void => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = (): void => {
    loadConnectionHistory(1);
  };

  const resetFilters = (): void => {
    setFilters({
      date_from: "",
      date_to: "",
      departement: "",
      per_page: 50,
    });
  };

  useEffect(() => {
    loadConnectionHistory();
    // eslint-disabled-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Historique des connexions
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Suivi des connexions et déconnexions des utilisateurs
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exporting || connections.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2 font-medium"
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Export...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                CSV
              </>
            )}
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exporting || connections.length === 0}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2 font-medium"
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Export...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="text-blue-700 dark:text-blue-400 text-sm font-medium mb-1">
            Connexions aujourd'hui
          </div>
          <div className="text-gray-800 dark:text-white text-2xl font-bold">
            {stats.total_connections_today || 0}
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <div className="text-green-700 dark:text-green-400 text-sm font-medium mb-1">
            Utilisateurs uniques
          </div>
          <div className="text-gray-800 dark:text-white text-2xl font-bold">
            {stats.unique_users_today || 0}
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
          <div className="text-purple-700 dark:text-purple-400 text-sm font-medium mb-1">
            Durée moy. session
          </div>
          <div className="text-gray-800 dark:text-white text-2xl font-bold">
            {stats.avg_session_duration
              ? `${Math.round(stats.avg_session_duration / 60)}min`
              : "0min"}
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
          <div className="text-orange-700 dark:text-orange-400 text-sm font-medium mb-1">
            Cette semaine
          </div>
          <div className="text-gray-800 dark:text-white text-2xl font-bold">
            {stats.total_connections_this_week || 0}
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange("date_from", e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange("date_to", e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Département
            </label>
            <select
              value={filters.departement}
              onChange={(e) =>
                handleFilterChange("departement", e.target.value)
              }
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les départements</option>
              {departements.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Par page
            </label>
            <select
              value={filters.per_page}
              onChange={(e) =>
                handleFilterChange("per_page", parseInt(e.target.value))
              }
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={applyFilters}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex-1 font-medium"
            >
              Filtrer
            </button>
            <button
              onClick={() => {
                resetFilters();
                setTimeout(() => loadConnectionHistory(1), 100);
              }}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th className="text-left text-gray-600 dark:text-gray-300 font-medium py-3 px-4 text-sm">
                  Utilisateur
                </th>
                <th className="text-left text-gray-600 dark:text-gray-300 font-medium py-3 px-4 text-sm">
                  Email
                </th>
                <th className="text-left text-gray-600 dark:text-gray-300 font-medium py-3 px-4 text-sm">
                  Département
                </th>
                <th className="text-left text-gray-600 dark:text-gray-300 font-medium py-3 px-4 text-sm">
                  Poste
                </th>
                <th className="text-left text-gray-600 dark:text-gray-300 font-medium py-3 px-4 text-sm">
                  Date connexion
                </th>
                <th className="text-left text-gray-600 dark:text-gray-300 font-medium py-3 px-4 text-sm">
                  Heure connexion
                </th>
                <th className="text-left text-gray-600 dark:text-gray-300 font-medium py-3 px-4 text-sm">
                  Date déconnexion
                </th>
                <th className="text-left text-gray-600 dark:text-gray-300 font-medium py-3 px-4 text-sm">
                  Heure déconnexion
                </th>
                <th className="text-left text-gray-600 dark:text-gray-300 font-medium py-3 px-4 text-sm">
                  Durée session
                </th>
                <th className="text-left text-gray-600 dark:text-gray-300 font-medium py-3 px-4 text-sm">
                  IP
                </th>
              </tr>
            </thead>
            <tbody>
              {connections.map((connection, index) => (
                <tr
                  key={connection.id}
                  className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/30 ${
                    index % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-900/20" : ""
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="text-gray-800 dark:text-white font-medium">
                      {connection.prenom} {connection.nom}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300 text-sm">
                    {connection.email_pro}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800">
                      {connection.departement}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded border border-green-200 dark:border-green-800">
                      {connection.roles}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300 text-sm">
                    {formatDate(connection.login_at)}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300 text-sm">
                    {formatTime(connection.login_at)}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300 text-sm">
                    {formatDate(connection.logout_at)}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300 text-sm">
                    {formatTime(connection.logout_at)}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        connection.logout_at
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                      }`}
                    >
                      {formatSessionDuration(connection.session_duration)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm font-mono">
                    {connection.ip_address || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {connections.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-2">
              Aucune donnée
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Aucun historique de connexion trouvé pour les critères
              sélectionnés.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            Affichage de {pagination.from} à {pagination.to} sur{" "}
            {pagination.total} résultats
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => loadConnectionHistory(pagination.current_page - 1)}
              disabled={pagination.current_page <= 1}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Précédent
            </button>

            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
              {pagination.current_page} / {pagination.last_page}
            </span>

            <button
              onClick={() => loadConnectionHistory(pagination.current_page + 1)}
              disabled={pagination.current_page >= pagination.last_page}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionHistory;
