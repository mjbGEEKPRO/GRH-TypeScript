import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeleteTeamsModal from "./admin/deleteTeams";
import api from "../../utils/api";
import Departement_poste_Create from "../departement/departement";
import { Building2 } from "lucide-react";

// Interfaces
interface Role {
  id: number;
  nom: string;
}

interface Permission {
  id: number;
  description: string;
}

interface Team {
  id: number;
  nom: string;
}

interface User {
  id: number;
  nom: string;
  email_pro: string;
  role?: Role;
  permissions?: Permission[];
  teams?: Team[];
}

interface EditFormData {
  nom: string;
  email_pro: string;
}

interface SendData {
  role_id: number | null;
  permissions: number[];
  teams: number[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  user?: T;
}

interface PermissionsApiResponse {
  users: User[];
  role: Role[];
  permissions: Permission[];
  teams: Team[];
}

const Permissions: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectUser, setSelectUser] = useState<User | null>(null);
  const [selectRoles, setSelectRoles] = useState<Role | null>(null);
  const [selectPermissions, setSelectPermissions] = useState<Permission[]>([]);
  const [selectTeams, setSelectTeams] = useState<Team[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showDepartementModal, setShowDepartementModal] =
    useState<boolean>(false);

  const [editForm, setEditForm] = useState<EditFormData>({
    nom: "",
    email_pro: "",
  });

  // Ajout du style pour le scrollbar personnalisé
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 10px;
        transition: background 0.2s;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 #f1f5f9;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const charger = async (): Promise<void> => {
    try {
      const res = await api.get<PermissionsApiResponse>("/api/permission");
      setUsers(res.data.users);
      setRoles(res.data.role);
      console.log("user ", res.data.users);
      setPermissions(res.data.permissions);
      setTeams(res.data.teams);
    } catch (error: any) {
      if (error.response) {
        const serverErrorMessage: string = error.response.data.message;
        if (
          error.response.status === 422 ||
          error.response.status === 403 ||
          error.response.status === 401 ||
          error.response.status === 404
        ) {
          toast.info(`❌ ${serverErrorMessage}`);
        } else if (error.response.status === 500) {
          toast.error(`❌ ${serverErrorMessage}`);
        }
      } else {
        toast.error("❌ Erreur ");
      }
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const UserSelection = (user: User): void => {
    setSelectUser(user);

    if (user.role?.id) {
      const fullRole = roles.find((r) => r.id === user.role!.id);
      setSelectRoles(fullRole || null);
    } else {
      setSelectRoles(null);
    }

    setSelectPermissions(user.permissions || []);
    setSelectTeams(user.teams || []);
  };

  const RoleSelection = (role: Role): void => {
    setSelectRoles(role);
  };

  const PermissionSelection = (permission: Permission): void => {
    if (selectPermissions.some((p) => p.id === permission.id)) {
      setSelectPermissions(
        selectPermissions.filter((p) => p.id !== permission.id)
      );
    } else {
      setSelectPermissions([...selectPermissions, permission]);
    }
  };

  const TeamSelection = (team: Team): void => {
    if (selectTeams.some((t) => t.id === team.id)) {
      setSelectTeams(selectTeams.filter((t) => t.id !== team.id));
    } else {
      setSelectTeams([...selectTeams, team]);
    }
  };

  const Envoie = async (): Promise<void> => {
    if (!selectUser) {
      toast.error("Aucun utilisateur sélectionné");
      return;
    }

    const sendData: SendData = {
      role_id: selectRoles ? selectRoles.id : null,
      permissions: selectPermissions.map((p) => p.id),
      teams: selectTeams.map((t) => t.id),
    };

    try {
      setLoading(true);
      console.log("debut connexion...");
      console.log("id user", selectUser.id);
      console.log("send data", sendData);
      const res = await api.put<ApiResponse<User>>(
        `/api/user/${selectUser.id}`,
        sendData
      );

      if (res.data.success) {
        setTimeout(() => {
          toast.success(res.data.message);
          setLoading(false);
          const updatedUser: User = {
            ...selectUser,
            role: res.data.user!.role,
            permissions: res.data.user!.permissions,
            teams: res.data.user!.teams,
          };
          setSelectUser(updatedUser);
          setUsers(
            users.map((u) => (u.id === selectUser.id ? updatedUser : u))
          );
        }, 1000);
      }
    } catch (error: any) {
      setLoading(false);
      toast.error("Erreur lors de la mise à jour: " + error.message);
    }
  };

  const openModal = (user: User): void => {
    setEditForm({
      nom: user.nom,
      email_pro: user.email_pro,
    });
    setShowModal(true);
  };

  const closeModal = (): void => {
    setShowModal(false);
    setEditForm({ nom: "", email_pro: "" });
  };

  const FormChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const Submit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      setLoading(true);
      console.log("donner à update", editForm);
      const res = await api.put<ApiResponse<User>>(
        `/api/useEdit/${selectUser!.id}`,
        editForm
      );

      if (res.data.success) {
        setTimeout(() => {
          toast.success(res.data.message);
          const updatedUser: User = { ...selectUser!, ...res.data.user! };
          setSelectUser(updatedUser);
          setUsers(
            users.map((u) => (u.id === selectUser!.id ? updatedUser : u))
          );
          setLoading(false);
          closeModal();
        }, 1000);
      }
    } catch (error: any) {
      setLoading(false);
      const serverErrorMessage: string = error.response.data.message;
      if (error.response.status === 422) {
        toast.info(`❌ ${serverErrorMessage}`);
      } else if (error.response.status === 500) {
        toast.error(`❌ ${serverErrorMessage}`);
      }
    }
  };

  const handleTeamsDeleted = (deletedTeamIds: number[]): void => {
    setTeams((prevTeams) =>
      prevTeams.filter((team) => !deletedTeamIds.includes(team.id))
    );
  };

  const Modal: React.FC = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            Modifier les informations
          </h3>

          <form onSubmit={Submit} className="space-y-5">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Nom complet
              </label>
              <input
                type="text"
                name="nom"
                value={editForm.nom}
                onChange={FormChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Nom complet"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Email professionnel
              </label>
              <input
                type="email"
                name="email_pro"
                value={editForm.email_pro}
                onChange={FormChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="email@entreprise.com"
              />
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sauvegarde...
                  </>
                ) : (
                  "Sauvegarder"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm mb-6">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Gestion des Permissions
            </h1>
            <p className="text-gray-500">
              Attribuez des rôles, permissions et équipes aux utilisateurs
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Liste des utilisateurs */}
            <div className="lg:w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col">
              <div className="p-6 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <svg
                    className="w-6 h-6 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                  Utilisateurs ({users.length})
                </h2>
              </div>

              <div
                className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar"
                style={{ maxHeight: "calc(600px - 120px)" }}
              >
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => UserSelection(user)}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${
                          selectUser?.id === user.id
                            ? "bg-purple-50 border-2 border-purple-500 shadow-md"
                            : "bg-white border border-gray-200 hover:border-purple-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-white font-semibold text-sm">
                              {user.nom
                                .split(" ")
                                .map((n) => n.charAt(0))
                                .join("")
                                .slice(0, 2)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 truncate">
                              {user.nom}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {user.email_pro}
                            </div>
                            {user.role && (
                              <div className="text-xs text-purple-600 mt-1 flex items-center font-medium">
                                {user.role.nom}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Panel de détails */}
            <div
              className="lg:w-2/3 p-6 overflow-y-auto custom-scrollbar"
              style={{ maxHeight: "600px" }}
            >
              {selectUser ? (
                <div className="space-y-6">
                  {/* Informations utilisateur */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">
                            {selectUser.nom
                              .split(" ")
                              .map((n) => n.charAt(0))
                              .join("")
                              .slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">
                            {selectUser.nom}
                          </h2>
                          <p className="text-gray-600">
                            {selectUser.email_pro}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(selectUser)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-colors flex items-center shadow-sm"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Modifier
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(true)}
                          disabled={teams.length === 0}
                          className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
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
                          Supprimer équipes
                        </button>
                      </div>
                      <button onClick={() => setShowDepartementModal(true)}>
                        Afficher modal
                      </button>
                    </div>

                    {/* Droits actuels */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <div className="font-semibold text-orange-700 mb-3 flex items-center text-sm">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          Rôle actuel
                        </div>
                        {selectUser.role ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-700 border border-orange-300 font-medium">
                            {selectUser.role.nom}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm italic">
                            Aucun rôle
                          </span>
                        )}
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="font-semibold text-green-700 mb-3 flex items-center text-sm">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Permissions ({selectUser.permissions?.length || 0})
                        </div>
                        {selectUser.permissions &&
                        selectUser.permissions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {selectUser.permissions
                              .slice(0, 3)
                              .map((permission) => (
                                <span
                                  key={permission.id}
                                  className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-green-100 text-green-700 border border-green-300 font-medium"
                                >
                                  {permission.description}
                                </span>
                              ))}
                            {selectUser.permissions.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{selectUser.permissions.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm italic">
                            Aucune permission
                          </span>
                        )}
                      </div>

                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <div className="font-semibold text-purple-700 mb-3 flex items-center text-sm">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          Équipes ({selectUser.teams?.length || 0})
                        </div>
                        {selectUser.teams && selectUser.teams.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {selectUser.teams.slice(0, 3).map((team) => (
                              <span
                                key={team.id}
                                className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-purple-100 text-purple-700 border border-purple-300 font-medium"
                              >
                                {team.nom}
                              </span>
                            ))}
                            {selectUser.teams.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{selectUser.teams.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm italic">
                            Aucune équipe
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Modification des droits */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                      <svg
                        className="w-6 h-6 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Modifier les droits
                    </h3>

                    <div className="space-y-6">
                      {/* Section Rôles */}
                      <div className="bg-white rounded-xl p-5 border border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                          <span className="mr-2">👑</span> Sélectionner un rôle
                        </h4>
                        <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {roles.map((role) => (
                              <button
                                key={role.id}
                                onClick={() => RoleSelection(role)}
                                className={`p-3 rounded-lg text-sm font-medium transition-all border-2 ${
                                  selectRoles?.id === role.id
                                    ? "bg-orange-100 border-orange-500 text-orange-700 shadow-md"
                                    : "bg-gray-50 border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50"
                                }`}
                              >
                                {role.nom}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Section Permissions */}
                      <div className="bg-white rounded-xl p-5 border border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                          <span className="mr-2">🔐</span> Sélectionner les
                          permissions
                        </h4>
                        <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {permissions.map((permission) => (
                              <div
                                key={permission.id}
                                className="flex flex-col"
                              >
                                <button
                                  onClick={() =>
                                    PermissionSelection(permission)
                                  }
                                  className={`p-3 rounded-lg text-sm font-medium transition-all border-2 ${
                                    selectPermissions.some(
                                      (p) => p.id === permission.id
                                    )
                                      ? "bg-green-100 border-green-500 text-green-700 shadow-md"
                                      : "bg-gray-50 border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50"
                                  }`}
                                >
                                  {permission.description}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Section Équipes */}
                      <div className="bg-white rounded-xl p-5 border border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                          <span className="mr-2">👥</span> Sélectionner les
                          équipes
                        </h4>
                        <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {teams.map((team) => (
                              <button
                                key={team.id}
                                onClick={() => TeamSelection(team)}
                                className={`p-3 rounded-lg text-sm font-medium transition-all border-2 ${
                                  selectTeams.some((t) => t.id === team.id)
                                    ? "bg-purple-100 border-purple-500 text-purple-700 shadow-md"
                                    : "bg-gray-50 border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50"
                                }`}
                              >
                                {team.nom}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bouton de sauvegarde */}
                    <div className="flex justify-end mt-6">
                      <button
                        onClick={Envoie}
                        disabled={loading}
                        className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-md disabled:opacity-50 flex items-center"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Mise à jour...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Enregistrer les droits
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                      <svg
                        className="w-10 h-10"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-600">
                      Aucun utilisateur sélectionné
                    </h3>
                    <p className="text-gray-400">
                      Choisissez un utilisateur dans la liste pour gérer ses
                      permissions
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Bouton flottant */}
      <button
        onClick={() => setShowDepartementModal(true)}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 z-40"
        title="Créer un département"
      >
        <Building2 className="w-6 h-6" />
      </button>

      <Modal />

      <DeleteTeamsModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        teams={teams}
        onTeamsDeleted={handleTeamsDeleted}
      />

      <Departement_poste_Create
        isOpen={showDepartementModal}
        onClose={() => setShowDepartementModal(false)}
      />

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

export default Permissions;
