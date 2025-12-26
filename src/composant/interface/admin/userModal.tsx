import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios, { AxiosError } from "axios";
import generatePassword from "../../../utils/generatePassword";
import envoyerEmailIdentifiants from "../../../email/approuverUser";
import api from "../../../utils/api";

interface User {
  id: string | number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  role: string;
  departement: string;
  statut: boolean;
}

interface ProfessionalData {
  emailPro: string;
  motDePassePro: string;
  departement: string;
  
}

interface ApiErrorResponse {
  message: string;
}

interface UserManagementProps {
  onNavigateToPermissions?: () => void;
}

const UserManagement: React.FC<UserManagementProps> = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [professionalData, setProfessionalData] = useState<ProfessionalData>({
    emailPro: "",
    motDePassePro: "",
    departement: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (): Promise<void> => {
    try {
      const response = await axios.get<User[]>("http://localhost:5000/users");
      console.log("valeur request", response.data);
      setUsers(response.data);
      console.log("user récupéré", response.data);
    } catch (error) {
      handleApiError(error as AxiosError<ApiErrorResponse>);
    } 
  };

  const handleApiError = (error: AxiosError<ApiErrorResponse>): void => {
    if (error.response) {
      const serverErrorMessage = error.response.data.message;
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
      console.log("erreur", error);
    }
  };

  const approuver = async (): Promise<void> => {
    if (
      !selectedUser ||
      !professionalData.emailPro ||
      !professionalData.motDePassePro
    ) {
      toast.error("Données manquantes pour l'approbation");
      return;
    }

    try {
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id ? { ...u, statut: true } : u
        )
      );

      const updata = {
        email_pro: professionalData.emailPro,
        password: professionalData.motDePassePro,
        departement: professionalData.departement,
      };

      const res = await api.put(`/api/approuver/${selectedUser.id}`, updata);

      if (res.data.success) {
        await envoyerEmailIdentifiants(
          selectedUser,
          professionalData.emailPro,
          professionalData.motDePassePro,
          
        );
        toast.success(res.data.message);
        const userForJson = res.data.user;
        await axios.post(
          `http://localhost:5000/users/${selectedUser.id}`,
          userForJson
        );

        setShowApprovalModal(false);
      }
    } catch (error) {
      handleApiError(error as AxiosError<ApiErrorResponse>);
    }
  };

  const rejeter = async (userId: string | number): Promise<void> => {
    const utilisateur = users.find((u) => u.id === userId);

    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir rejeter la demande de ${utilisateur?.prenom} ${utilisateur?.nom} ?`
      )
    ) {
      return;
    }

    try {
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, statut: false } : u))
      );
      toast.success("Demande rejetée");
    } catch (error) {
      console.log("Erreur rejet ", error);
      toast.error("Erreur lors du rejet");
    }
  };

  const handleOpenApprovalModal = (personne: User): void => {
    setSelectedUser(personne);
    setProfessionalData({
      emailPro: "",
      motDePassePro: generatePassword(),
      departement: personne.departement,
    });
    setShowApprovalModal(true);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Gestion des Utilisateurs
        </h1>
        <p className="text-gray-600 dark:text-white/70">
          Gérez les demandes d'inscription et attribuez les accès professionnels
        </p>
      </div>

      {/* Statistiques */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-white/10 backdrop-blur-lg border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-sm">
          <h3 className="text-gray-600 dark:text-white/70 text-sm font-medium mb-2">
            Total utilisateurs
          </h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">
            {users.length}
          </p>
        </div>
        <div className="bg-white dark:bg-white/10 backdrop-blur-lg border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-sm">
          <h3 className="text-gray-600 dark:text-white/70 text-sm font-medium mb-2">
            Approuvés
          </h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {users.filter((u) => u.statut).length}
          </p>
        </div>
        <div className="bg-white dark:bg-white/10 backdrop-blur-lg border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-sm">
          <h3 className="text-gray-600 dark:text-white/70 text-sm font-medium mb-2">
            En attente
          </h3>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {users.filter((u) => !u.statut).length}
          </p>
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="bg-white dark:bg-white/10 backdrop-blur-lg border border-gray-200 dark:border-white/20 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="py-4 px-6 text-left text-xs font-medium text-gray-600 dark:text-white/70 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="py-4 px-6 text-left text-xs font-medium text-gray-600 dark:text-white/70 uppercase tracking-wider">
                  Contact
                </th>
                <th className="py-4 px-6 text-left text-xs font-medium text-gray-600 dark:text-white/70 uppercase tracking-wider">
                  Poste
                </th>
                <th className="py-4 px-6 text-left text-xs font-medium text-gray-600 dark:text-white/70 uppercase tracking-wider">
                  Département
                </th>
                <th className="py-4 px-6 text-left text-xs font-medium text-gray-600 dark:text-white/70 uppercase tracking-wider">
                  Statut
                </th>
                <th className="py-4 px-6 text-left text-xs font-medium text-gray-600 dark:text-white/70 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
              {users.map((personne) => (
                <tr
                  key={personne.id}
                  className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white font-semibold text-sm">
                          {personne.prenom?.charAt(0)}
                          {personne.nom?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-gray-800 dark:text-white font-medium">
                          {personne.prenom} {personne.nom}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-gray-600 dark:text-white/80 text-sm">
                      <div>{personne.email}</div>
                      <div>{personne.telephone}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-600 dark:text-white/80 text-sm">
                      {personne.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-600 dark:text-white/80 text-sm">
                      {personne.departement}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        personne.statut
                          ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30"
                          : "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30"
                      }`}
                    >
                      {personne.statut ? "Approuvé" : "En attente"}
                    </span>
                  </td>
                  <td className="py-4 px-6 space-x-2">
                    <button
                      onClick={() => handleOpenApprovalModal(personne)}
                      disabled={personne.statut}
                      className={`inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-lg transition-all ${
                        personne.statut
                          ? "text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-500/10 cursor-not-allowed"
                          : "text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                      }`}
                    >
                      {personne.statut ? "Déjà approuvé" : "Approuver"}
                    </button>
                    <button
                      onClick={() => rejeter(personne.id)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 transition-all"
                    >
                      Rejeter
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'approbation */}
      {showApprovalModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 dark:backdrop-blur-lg border border-gray-200 dark:border-white/20 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
              Approbation de {selectedUser.prenom} {selectedUser.nom}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-white/80 text-sm font-medium mb-2">
                  Email professionnel *
                </label>
                <input
                  type="email"
                  value={professionalData.emailPro}
                  onChange={(e) =>
                    setProfessionalData({
                      ...professionalData,
                      emailPro: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="nom.departement@entreprise.com"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-white/80 text-sm font-medium mb-2">
                  Mot de passe temporaire
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={professionalData.motDePassePro}
                    onChange={(e) =>
                      setProfessionalData({
                        ...professionalData,
                        motDePassePro: e.target.value,
                      })
                    }
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setProfessionalData({
                        ...professionalData,
                        motDePassePro: generatePassword(),
                      })
                    }
                    className="px-3 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl transition-colors"
                  >
                    🔄
                  </button>
                </div>
              </div>
            </div>
            <div className="flex space-x-4 mt-8">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-xl transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={approuver}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-xl transition-colors font-medium"
              >
                Approuver
              </button>
            </div>
          </div>
        </div>
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

export default UserManagement;
