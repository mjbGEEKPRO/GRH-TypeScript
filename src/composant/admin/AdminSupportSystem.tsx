import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  X,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  RefreshCw,
  Filter,
  Search,
  BarChart3,
  User,
  Mail,
  Flag,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../utils/api";

interface Ticket {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  last_message: string;
  last_message_at: string;
  message_count: number;
  unread_admin: number;
  unread_user: number;
}

interface Message {
  id: number;
  ticket_id: number;
  sender_name: string;
  sender_type: "user" | "admin";
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Statistics {
  total_tickets: number;
  tickets_ouverts: number;
  tickets_en_cours: number;
  tickets_resolus: number;
  tickets_fermes: number;
  comptes_bloques: number;
  problemes_connexion: number;
  problemes_permission: number;
  messages_non_lus: number;
}

const AdminSupportSystem: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const categories = [
    { value: "compte_bloque", label: "Compte Bloqué", color: "red" },
    { value: "connexion", label: "Problème de Connexion", color: "orange" },
    { value: "permission", label: "Problème de Permission", color: "yellow" },
    { value: "bug", label: "Bug / Erreur", color: "purple" },
    { value: "autre", label: "Autre", color: "gray" },
  ];

  const statusConfig = {
    ouvert: { label: "Ouvert", icon: AlertCircle, color: "blue" },
    en_cours: { label: "En Cours", icon: Clock, color: "orange" },
    resolu: { label: "Résolu", icon: CheckCircle, color: "green" },
    ferme: { label: "Fermé", icon: XCircle, color: "gray" },
  };

  const priorityConfig = {
    basse: { label: "Basse", color: "gray" },
    normale: { label: "Normale", color: "blue" },
    haute: { label: "Haute", color: "orange" },
    urgente: { label: "Urgente", color: "red" },
  };

  // Charger les tickets
  const loadTickets = async (): Promise<void> => {
    try {
      setLoading(true);

      const response = await api.get("/api/support/tickets");

      if (response.data.success) {
        setTickets(response.data.data || []);
        applyFilters(response.data.data || []);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des tickets");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques
  const loadStatistics = async () => {
    try {
      const response = await api.get("/api/support/statistics");

      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error("Erreur chargement statistiques:", error);
    }
  };

  // Charger les messages d'un ticket
  const loadMessages = async (ticketId: number) => {
    try {
      const response = await api.get(
        `/api/support/tickets/${ticketId}/messages`,
      );

      if (response.data.success) {
        setMessages(response.data.data || []);
        scrollToBottom();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des messages");
      console.error(error);
    }
  };

  // Envoyer un message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      setSendingMessage(true);
      const response = await api.post(
        `/api/support/tickets/${selectedTicket.id}/messages`,
        { message: newMessage },
      );

      if (response.data.success) {
        setNewMessage("");
        loadMessages(selectedTicket.id);
        loadTickets();
        loadStatistics();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message");
      console.error(error);
    } finally {
      setSendingMessage(false);
    }
  };

  // Changer le statut du ticket
  const updateTicketStatus = async (ticketId: number, newStatus: string) => {
    try {
      const response = await api.patch(`/api/support/tickets/${ticketId}`, {
        status: newStatus,
      });

      if (response.data.success) {
        toast.success("Statut mis à jour");
        loadTickets();
        loadStatistics();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(response.data.data);
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    }
  };

  // Changer la priorité du ticket
  const updateTicketPriority = async (
    ticketId: number,
    newPriority: string,
  ) => {
    try {
      const response = await api.patch(`/api/support/tickets/${ticketId}`, {
        priority: newPriority,
      });

      if (response.data.success) {
        toast.success("Priorité mise à jour");
        loadTickets();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(response.data);
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    }
  };

  // Supprimer un ticket
  const deleteTicket = async (ticketId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce ticket ?")) return;

    try {
      const response = await api.delete(`/api/support/tickets/${ticketId}`);

      if (response.data.success) {
        toast.success("Ticket supprimé");
        loadTickets();
        loadStatistics();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(null);
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    }
  };

  // Sélectionner un ticket
  const selectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    loadMessages(ticket.id);
  };

  // Appliquer les filtres
  const applyFilters = (ticketsList: Ticket[]) => {
    let filtered = ticketsList;

    // Filtre de recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.user_email.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filtre de statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Filtre de catégorie
    if (categoryFilter !== "all") {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    // Filtre de priorité
    if (priorityFilter !== "all") {
      filtered = filtered.filter((t) => t.priority === priorityFilter);
    }

    setFilteredTickets(filtered);
  };

  // Scroll vers le bas
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    loadTickets();
    loadStatistics();
    const interval = setInterval(() => {
      loadTickets();
      loadStatistics();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters(tickets);
  }, [searchTerm, statusFilter, categoryFilter, priorityFilter, tickets]);

  useEffect(() => {
    if (selectedTicket) {
      const interval = setInterval(
        () => loadMessages(selectedTicket.id),
        10000,
      );
      return () => clearInterval(interval);
    }
  }, [selectedTicket]);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header avec statistiques */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              Gestion du Support
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Administration des tickets de support
            </p>
          </div>
          <button
            onClick={() => {
              loadTickets();
              loadStatistics();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Rafraîchir</span>
          </button>
        </div>

        {/* Statistiques */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">
                {statistics.total_tickets}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Total
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">
                {statistics.tickets_ouverts}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Ouverts
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-orange-600">
                {statistics.tickets_en_cours}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                En cours
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">
                {statistics.tickets_resolus}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Résolus
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-600">
                {statistics.comptes_bloques}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Cpt. Bloqués
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-orange-600">
                {statistics.problemes_connexion}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Connexion
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-600">
                {statistics.problemes_permission}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Permissions
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-600">
                {statistics.messages_non_lus}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Non lus
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Recherche */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Filtre Statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(statusConfig).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>

          {/* Filtre Catégorie */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">Toutes catégories</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Filtre Priorité */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">Toutes priorités</option>
            {Object.entries(priorityConfig).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredTickets.length} ticket(s)
          </div>
        </div>
      </div>

      {/* Contenu Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Liste des tickets */}
        <div className="w-96 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
          {loading && filteredTickets.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucun ticket
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucun ticket ne correspond aux critères
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredTickets.map((ticket) => {
                const status =
                  statusConfig[ticket.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;
                const category = categories.find(
                  (c) => c.value === ticket.category,
                );
                const priority =
                  priorityConfig[
                    ticket.priority as keyof typeof priorityConfig
                  ];

                return (
                  <button
                    key={ticket.id}
                    onClick={() => selectTicket(ticket)}
                    className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      selectedTicket?.id === ticket.id
                        ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
                          {ticket.subject}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {ticket.user_name}
                          </span>
                        </div>
                      </div>
                      {ticket.unread_admin > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                          {ticket.unread_admin}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium bg-${category?.color}-100 text-${category?.color}-700 dark:bg-${category?.color}-900/30 dark:text-${category?.color}-300`}
                      >
                        {category?.label}
                      </span>
                      <span
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-${status.color}-100 text-${status.color}-700 dark:bg-${status.color}-900/30 dark:text-${status.color}-300`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                      <span
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-${priority.color}-100 text-${priority.color}-700 dark:bg-${priority.color}-900/30 dark:text-${priority.color}-300`}
                      >
                        <Flag className="w-3 h-3" />
                        {priority.label}
                      </span>
                    </div>

                    {ticket.last_message && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                        {ticket.last_message}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(ticket.updated_at)}
                      </span>
                      <span>{ticket.message_count} messages</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Zone de conversation */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
          {selectedTicket ? (
            <>
              {/* Header du ticket */}
              <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedTicket.subject}
                    </h2>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {selectedTicket.user_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {selectedTicket.user_email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedTicket.created_at)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Actions admin */}
                <div className="flex items-center gap-3">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) =>
                      updateTicketStatus(selectedTicket.id, e.target.value)
                    }
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {Object.entries(statusConfig).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedTicket.priority}
                    onChange={(e) =>
                      updateTicketPriority(selectedTicket.id, e.target.value)
                    }
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {Object.entries(priorityConfig).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => deleteTicket(selectedTicket.id)}
                    className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isAdmin = message.sender_type === "admin";
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          isAdmin
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        } rounded-2xl px-4 py-3 shadow-sm`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">
                            {message.sender_name}
                          </span>
                          {isAdmin && (
                            <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.message}
                        </p>
                        <span
                          className={`text-xs ${
                            isAdmin
                              ? "text-white/70"
                              : "text-gray-500 dark:text-gray-400"
                          } mt-1 block`}
                        >
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input message */}
              {selectedTicket.status !== "ferme" ? (
                <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex items-end gap-3">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Répondre au ticket..."
                      className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      disabled={sendingMessage}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Entrée pour envoyer, Maj+Entrée pour nouvelle ligne
                  </p>
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ce ticket est fermé
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Sélectionnez un ticket
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choisissez un ticket pour voir la conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupportSystem;
