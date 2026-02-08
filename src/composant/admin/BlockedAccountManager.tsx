import React, { useState, useEffect } from "react";
import {
  Lock,
  Unlock,
  Search,
  AlertTriangle,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  Mail,
  Calendar,
  MapPin,
  Activity,
  Ban,
  UserX,
  Loader2,
} from "lucide-react";
import api from "../../utils/api";
import type { BlockedData, ActiveUsers } from "../../types/blockedAccount";
import { isBlockedUser, isBlockedIP } from "../../types/blockedAccount";

const getTimeRemaining = (blockedUntil: string): string => {
  const now = new Date();
  const until = new Date(blockedUntil);
  const diff = until.getTime() - now.getTime();

  if (diff <= 0) return "Expiré";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const BlockedAccountsManager: React.FC = () => {
  const [blockedAccounts, setBlockedAccounts] = useState<BlockedData[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUsers[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "users" | "ips">("all");
  const [selectedAccount, setSelectedAccount] = useState<
    BlockedData | ActiveUsers | null
  >(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<
    "unblock" | "block" | "unblock-ip" | ""
  >("");
  const [activeTab, setActiveTab] = useState<"blocked" | "active">("blocked");
  const [blockReason, setBlockReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [blockedRes, activeRes] = await Promise.all([
        api.get("/api/security/blocked-accounts"),
        api.get("/api/security/active-users"),
      ]);

      const blocked: BlockedData[] = [
        ...(blockedRes.data.users ?? []),
        ...(blockedRes.data.ips ?? []),
      ];

      setBlockedAccounts(blocked);
      setActiveUsers(activeRes.data.users ?? []);
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (
    account: BlockedData | ActiveUsers,
    action: "unblock" | "block" | "unblock-ip",
  ) => {
    setSelectedAccount(account);
    setActionType(action);
    setShowActionModal(true);
    setBlockReason("");
  };

  const confirmAction = async () => {
    try {
      if (!selectedAccount) return;

      if (actionType === "block" && !blockReason.trim()) {
        alert("Veuillez indiquer une raison pour le blocage");
        return;
      }

      setIsProcessing(true);

      if (actionType === "unblock") {
        await api.post(`/api/security/unblock-user/${selectedAccount.id}`);
        alert(
          `Compte ${(selectedAccount as ActiveUsers).name} débloqué avec succès`,
        );
      } else if (actionType === "block") {
        await api.post(`/api/security/block-user/${selectedAccount.id}`, {
          reason: blockReason,
        });
        alert(
          `Compte ${(selectedAccount as ActiveUsers).name} bloqué avec succès`,
        );
      } else if (actionType === "unblock-ip") {
        const ipAccount = selectedAccount as BlockedData;
        if (isBlockedIP(ipAccount)) {
          await api.post(`/api/security/unblock-ip/${ipAccount.ip_address}`);
          alert(`IP ${ipAccount.ip_address} débloquée avec succès`);
        }
      }

      setShowActionModal(false);
      setSelectedAccount(null);
      setBlockReason("");
      await loadData();
    } catch (error) {
      console.error("Erreur:", error);
      alert("❌ Erreur lors de l'opération");
    } finally {
      setIsProcessing(false);
    }
  };
  console.log("blocker : ", blockedAccounts);
  const filteredBlocked = blockedAccounts.filter((account) => {
    const matchesSearch = isBlockedUser(account)
      ? account.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.email?.toLowerCase().includes(searchTerm.toLowerCase())
      : account.ip_address?.includes(searchTerm);

    const matchesFilter =
      filterType === "all" ||
      (filterType === "users" && account.type === "user") ||
      (filterType === "ips" && account.type === "ip");

    return matchesSearch && matchesFilter;
  });

  const filteredActive = activeUsers.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const stats = {
    totalBlocked: blockedAccounts.length,
    blockedUsers: blockedAccounts.filter((a) => a.type === "user").length,
    blockedIPs: blockedAccounts.filter((a) => a.type === "ip").length,
    activeUsers: activeUsers.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Chargement des données...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Statistiques - Grid responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Carte Actifs */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-emerald-100 text-sm font-medium">
                Utilisateurs Actifs
              </p>
              <p className="text-3xl sm:text-4xl font-bold">
                {stats.activeUsers}
              </p>
              <p className="text-emerald-200 text-xs">En ligne</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <CheckCircle className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Carte Total Bloqués */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-red-100 text-sm font-medium">Total Bloqués</p>
              <p className="text-3xl sm:text-4xl font-bold">
                {stats.totalBlocked}
              </p>
              <p className="text-red-200 text-xs">Comptes & IPs</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Lock className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Carte Utilisateurs Bloqués */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-orange-100 text-sm font-medium">
                Utilisateurs
              </p>
              <p className="text-3xl sm:text-4xl font-bold">
                {stats.blockedUsers}
              </p>
              <p className="text-orange-200 text-xs">Bloqués</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <UserX className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Carte IPs Bloquées */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-purple-100 text-sm font-medium">Adresses IP</p>
              <p className="text-3xl sm:text-4xl font-bold">
                {stats.blockedIPs}
              </p>
              <p className="text-purple-200 text-xs">Bloquées</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Shield className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Panneau principal */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header avec Tabs */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <button
                onClick={() => setActiveTab("blocked")}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === "blocked"
                    ? "bg-red-600 dark:bg-red-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span className="hidden sm:inline">Comptes Bloqués</span>
                  <span className="sm:hidden">Bloqués</span>
                  {stats.totalBlocked > 0 && (
                    <span className="bg-white/30 dark:bg-black/30 px-2 py-0.5 rounded-full text-xs font-bold">
                      {stats.totalBlocked}
                    </span>
                  )}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("active")}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === "active"
                    ? "bg-emerald-600 dark:bg-emerald-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Comptes Actifs</span>
                  <span className="sm:hidden">Actifs</span>
                </span>
              </button>
            </div>

            {/* Bouton Actualiser */}
            <button
              onClick={loadData}
              disabled={loading}
              className="w-full lg:w-auto px-5 py-3 bg-blue-600 dark:bg-blue-600 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par email, nom, IP ou département..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300 shadow-sm"
              />
            </div>

            {/* Filtres pour onglet bloqués */}
            {activeTab === "blocked" && (
              <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-4 sm:px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all duration-300 ${
                    filterType === "all"
                      ? "bg-blue-600 dark:bg-blue-600 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setFilterType("users")}
                  className={`px-4 sm:px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${
                    filterType === "users"
                      ? "bg-blue-600 dark:bg-blue-600 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Utilisateurs</span>
                </button>
                <button
                  onClick={() => setFilterType("ips")}
                  className={`px-4 sm:px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${
                    filterType === "ips"
                      ? "bg-blue-600 dark:bg-blue-600 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>IPs</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Liste des comptes */}
      <div className="space-y-4">
        {activeTab === "blocked" ? (
          filteredBlocked.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                Aucun compte bloqué
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm
                  ? "Aucun résultat pour cette recherche"
                  : "Tous les comptes sont actuellement actifs"}
              </p>
            </div>
          ) : (
            filteredBlocked.map((account) => (
              <div
                key={`${account.type}-${account.id}`}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600"
              >
                {isBlockedUser(account) ? (
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0 ring-4 ring-red-50 dark:ring-red-900/20">
                        <User className="w-6 h-6 sm:w-7 sm:h-7 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-3">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white truncate">
                          {account.name}
                        </h3>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 truncate">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{account.email}</span>
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>
                              Bloqué le:{" "}
                              {new Date(account.blocked_at).toLocaleString(
                                "fr-FR",
                              )}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 truncate">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                              Dernière IP: {account.last_ip}
                            </span>
                          </p>
                        </div>
                        <div className="inline-flex">
                          <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border border-red-200 dark:border-red-800">
                            {account.reason}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAction(account, "unblock")}
                      className="w-full lg:w-auto px-6 py-3 bg-emerald-600 dark:bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-700 transition-all duration-300 font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>Débloquer</span>
                    </button>
                  </div>
                ) : isBlockedIP(account) ? (
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0 ring-4 ring-purple-50 dark:ring-purple-900/20">
                        <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-3">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white font-mono">
                          IP: {account.ip_address}
                        </h3>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-orange-500" />
                            <span className="font-semibold">
                              {account.attempts} tentatives échouées
                            </span>
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>
                              Bloqué jusqu'à:{" "}
                              {new Date(account.blocked_until).toLocaleString(
                                "fr-FR",
                              )}
                            </span>
                          </p>
                          <div className="inline-flex">
                            <span className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold border border-orange-200 dark:border-orange-800">
                              Temps restant:{" "}
                              {getTimeRemaining(account.blocked_until)}
                            </span>
                          </div>
                        </div>
                        <div className="pt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                            Emails tentés:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {account.emails_tried.map((email, idx) => (
                              <span
                                key={idx}
                                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-600 truncate max-w-full sm:max-w-xs"
                              >
                                {email}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAction(account, "unblock-ip")}
                      className="w-full lg:w-auto px-6 py-3 bg-emerald-600 dark:bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-700 transition-all duration-300 font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>Débloquer IP</span>
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          )
        ) : filteredActive.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="bg-gray-100 dark:bg-gray-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Aucun utilisateur trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm
                ? "Aucun résultat pour cette recherche"
                : "Aucun utilisateur actif"}
            </p>
          </div>
        ) : (
          filteredActive.map((user) => (
            <div
              key={user.id}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0 ring-4 ring-emerald-50 dark:ring-emerald-900/20">
                    <User className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white truncate">
                        {user.name}
                      </h3>
                      <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-lg text-xs font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Actif
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 truncate">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-2">
                        <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium">
                          {user.role}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-1 rounded text-xs font-medium">
                          {user.department}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-2">
                        <Activity className="w-4 h-4 flex-shrink-0" />
                        <span>
                          Dernière connexion:{" "}
                          {new Date(user.last_login).toLocaleString("fr-FR")}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleAction(user, "block")}
                  className="w-full lg:w-auto px-6 py-3 bg-red-600 dark:bg-red-600 text-white rounded-xl hover:bg-red-700 dark:hover:bg-red-700 transition-all duration-300 font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Ban className="w-4 h-4" />
                  <span>Bloquer</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de confirmation */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full animate-slideUp border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                {actionType === "block"
                  ? "Bloquer le compte"
                  : "Débloquer le compte"}
              </h2>
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setBlockReason("");
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Contenu */}
            <div className="mb-6 space-y-4">
              {actionType === "unblock" && selectedAccount && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                      Êtes-vous sûr de vouloir débloquer ce compte ?
                    </p>
                  </div>
                  <div className="ml-8">
                    <p className="text-sm font-bold text-gray-800 dark:text-white mb-1">
                      {(selectedAccount as ActiveUsers).name ||
                        (
                          selectedAccount as BlockedData & {
                            ip_address?: string;
                          }
                        ).ip_address}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {(selectedAccount as ActiveUsers).email}
                    </p>
                  </div>
                </div>
              )}

              {actionType === "unblock-ip" &&
                selectedAccount &&
                isBlockedIP(selectedAccount as BlockedData) && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-purple-800 dark:text-purple-300 font-medium">
                        Êtes-vous sûr de vouloir débloquer cette adresse IP ?
                      </p>
                    </div>
                    <div className="ml-8">
                      <p className="text-sm font-bold text-gray-800 dark:text-white mb-1 font-mono">
                        {
                          (
                            selectedAccount as BlockedData & {
                              ip_address: string;
                            }
                          ).ip_address
                        }
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {
                          (
                            selectedAccount as BlockedData & {
                              attempts: number;
                            }
                          ).attempts
                        }{" "}
                        tentatives enregistrées
                      </p>
                    </div>
                  </div>
                )}

              {actionType === "block" && selectedAccount && (
                <div className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                        Êtes-vous sûr de vouloir bloquer ce compte ?
                      </p>
                    </div>
                    <div className="ml-8">
                      <p className="text-sm font-bold text-gray-800 dark:text-white mb-1">
                        {(selectedAccount as ActiveUsers).name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {(selectedAccount as ActiveUsers).email}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Raison du blocage <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="Exemple: Violation des règles, activité suspecte, demande de l'utilisateur..."
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setBlockReason("");
                }}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={confirmAction}
                disabled={isProcessing}
                className={`flex-1 px-6 py-3 rounded-xl transition-all duration-300 font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  actionType === "block"
                    ? "bg-red-600 dark:bg-red-600 hover:bg-red-700 dark:hover:bg-red-700"
                    : "bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-700"
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Traitement...</span>
                  </>
                ) : (
                  <span>
                    {actionType === "block" ? "Bloquer" : "Débloquer"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockedAccountsManager;
