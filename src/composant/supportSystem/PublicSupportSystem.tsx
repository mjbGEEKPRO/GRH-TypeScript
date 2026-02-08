import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MessageSquare,
  Send,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  Plus,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import EmailService from "../../email/EmailService";
import type { Ticket, User, Message } from "../../types/support";

const PublicSupportInterface: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const loadingTicketsRef = useRef(false);
  const loadingMessagesRef = useRef(false);
  const lastMessageSentRef = useRef<number>(0);

  const [newTicketData, setNewTicketData] = useState({
    subject: "",
    category: "autre",
    priority: "normale",
    message: "",
  });

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

  // Vérifier le token au montage
  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      verifyToken(token);
    } else {
      // Vérifier si on a déjà un token en localStorage
      const savedToken = localStorage.getItem("support_token");
      if (savedToken) {
        verifyToken(savedToken);
      } else {
        navigate("/");
        toast.error("Accès non autorisé");
      }
    }
  }, [searchParams, navigate]);

  const verifyToken = async (token: string) => {
    try {
      setLoading(true);

      const response = await api.post("/api/support/verify-token", { token });

      if (response.data?.success) {
        setUser(response.data.user);
        localStorage.setItem("support_token", response.data.session_token);

        // Configurer axios pour envoyer le token dans tous les appels
        api.defaults.headers.common["X-Support-Token"] =
          response.data.session_token;

        // Charger les tickets
        loadTickets();
      } else {
        navigate("/");
        toast.error("Lien invalide ou expiré");
      }
    } catch (error: any) {
      console.error("Erreur vérification token:", error);
      navigate("/");
      toast.error(error.response?.data?.message || "Lien invalide ou expiré");
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = useCallback(async () => {
    if (loadingTicketsRef.current) return;

    try {
      loadingTicketsRef.current = true;

      const response = await api.get("/api/support/public-tickets");

      if (response.data?.success) {
        setTickets(response.data.data || []);
      }
    } catch (error: any) {
      console.error("Erreur chargement tickets:", error);
      if (error.response?.status === 401) {
        handleSessionExpired();
      } else {
        toast.error("Erreur lors du chargement des tickets");
      }
    } finally {
      loadingTicketsRef.current = false;
    }
  }, []);

  const loadMessages = useCallback(async (ticketId: number) => {
    if (loadingMessagesRef.current) return;

    try {
      loadingMessagesRef.current = true;

      const response = await api.get(
        `/api/support/public-messages/${ticketId}`,
      );

      if (response.data?.success) {
        setMessages(response.data.data || []);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error: any) {
      console.error("Erreur chargement messages:", error);
      if (error.response?.status === 401) {
        handleSessionExpired();
      } else {
        toast.error("Erreur lors du chargement des messages");
      }
    } finally {
      loadingMessagesRef.current = false;
    }
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || sendingMessage) return;

    const now = Date.now();
    if (now - lastMessageSentRef.current < 1000) {
      toast.warning("Veuillez patienter avant d'envoyer un autre message");
      return;
    }

    const messageToSend = newMessage.trim();

    try {
      setSendingMessage(true);
      setNewMessage("");
      lastMessageSentRef.current = now;

      const response = await api.post("/api/support/public-send-message", {
        ticket_id: selectedTicket.id,
        message: messageToSend,
      });

      if (response.data?.success) {
        const optimisticMessage: Message = {
          id: Date.now(),
          ticket_id: selectedTicket.id,
          sender_name: "Vous",
          sender_type: "user",
          message: messageToSend,
          is_read: false,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        scrollToBottom();

        // Envoyer notification aux admins via EmailJS
        if (response.data?.email_data) {
          try {
            await EmailService.notifyNewMessage(response.data.email_data);
          } catch (emailError) {
            console.error("Erreur EmailJS:", emailError);
          }
        }

        setTimeout(() => {
          loadMessages(selectedTicket.id);
          loadTickets();
        }, 500);
      } else {
        setNewMessage(messageToSend);
        toast.error(response.data?.message || "Erreur lors de l'envoi");
      }
    } catch (error: any) {
      console.error("Erreur envoi message:", error);
      setNewMessage(messageToSend);

      if (error.response?.status === 401) {
        handleSessionExpired();
      } else {
        toast.error(error.response?.data?.message || "Erreur lors de l'envoi");
      }
    } finally {
      setSendingMessage(false);
      messageInputRef.current?.focus();
    }
  };

  const createTicket = async () => {
    if (!newTicketData.subject.trim()) {
      toast.error("Le sujet est obligatoire");
      return;
    }

    if (!newTicketData.message.trim()) {
      toast.error("Veuillez décrire votre problème");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/api/support/tickets", {
        subject: newTicketData.subject,
        category: newTicketData.category,
        priority: newTicketData.priority,
        message: newTicketData.message,
      });

      if (response.data?.success) {
        toast.success("Ticket créé avec succès !");
        setShowNewTicketForm(false);
        setNewTicketData({
          subject: "",
          category: "autre",
          priority: "normale",
          message: "",
        });
        await loadTickets();
      }
    } catch (error: any) {
      console.error("Erreur création ticket:", error);

      if (error.response?.status === 401) {
        handleSessionExpired();
      } else {
        toast.error(
          error.response?.data?.message || "Erreur lors de la création",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const selectTicket = useCallback(
    (ticket: Ticket) => {
      setSelectedTicket(ticket);
      setMessages([]);
      loadMessages(ticket.id);
    },
    [loadMessages],
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

  const handleSessionExpired = () => {
    localStorage.removeItem("support_token");
    navigate("/");
    toast.error("Session expirée. Veuillez redemander un lien d'accès.");
  };

  const handleLogout = () => {
    localStorage.removeItem("support_token");
    navigate("/");
    toast.info("Vous avez été déconnecté");
  };

  // Auto-refresh des tickets
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadTickets();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, loadTickets]);

  // Auto-refresh des messages
  useEffect(() => {
    if (!selectedTicket) return;

    const interval = setInterval(() => {
      loadMessages(selectedTicket.id);
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedTicket, loadMessages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Vérification de l'accès...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Support Technique
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bienvenue, {user?.prenom} {user?.nom}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadTickets}
              className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setShowNewTicketForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nouveau Ticket</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* Liste des tickets */}
        <div className="w-96 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucun ticket
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Créez un ticket pour contacter le support
              </p>
              <button
                onClick={() => setShowNewTicketForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Créer un ticket
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {tickets.map((ticket) => {
                const status =
                  statusConfig[ticket.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;
                const category = categories.find(
                  (c) => c.value === ticket.category,
                );

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
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
                        {ticket.subject}
                      </h3>
                      {ticket.unread_count > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                          {ticket.unread_count}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {category?.label}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(ticket.updated_at)}
                      </span>
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
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedTicket.subject}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      {(() => {
                        const status =
                          statusConfig[
                            selectedTicket.status as keyof typeof statusConfig
                          ];
                        const StatusIcon = status.icon;
                        const category = categories.find(
                          (c) => c.value === selectedTicket.category,
                        );
                        return (
                          <>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                              {category?.label}
                            </span>
                            <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isUser = message.sender_type === "user";
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          isUser
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        } rounded-2xl px-4 py-3 shadow-sm`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">
                            {message.sender_name}
                          </span>
                          {!isUser && (
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.message}
                        </p>
                        <span
                          className={`text-xs ${
                            isUser
                              ? "text-blue-100"
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
                      ref={messageInputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Tapez votre message..."
                      className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      disabled={sendingMessage}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Appuyez sur Entrée pour envoyer, Maj+Entrée pour nouvelle
                    ligne
                  </p>
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ce ticket est fermé. Vous ne pouvez plus envoyer de
                    messages.
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

      {/* Modal Nouveau Ticket */}
      {showNewTicketForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Nouveau Ticket
              </h2>
              <button
                onClick={() => setShowNewTicketForm(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sujet *
                </label>
                <input
                  type="text"
                  value={newTicketData.subject}
                  onChange={(e) =>
                    setNewTicketData({
                      ...newTicketData,
                      subject: e.target.value,
                    })
                  }
                  placeholder="Ex: Problème de connexion"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catégorie *
                </label>
                <select
                  value={newTicketData.category}
                  onChange={(e) =>
                    setNewTicketData({
                      ...newTicketData,
                      category: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priorité
                </label>
                <select
                  value={newTicketData.priority}
                  onChange={(e) =>
                    setNewTicketData({
                      ...newTicketData,
                      priority: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="basse">Basse</option>
                  <option value="normale">Normale</option>
                  <option value="haute">Haute</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={newTicketData.message}
                  onChange={(e) =>
                    setNewTicketData({
                      ...newTicketData,
                      message: e.target.value,
                    })
                  }
                  placeholder="Décrivez votre problème..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowNewTicketForm(false)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={createTicket}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Créer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicSupportInterface;
