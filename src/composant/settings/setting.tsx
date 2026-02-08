import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import { authUtils } from "../../utils/Intercepteur";

interface User {
  id: string | number;
  telephone?: string;
  adresse?: string;
  situation_familiale?: string;
}

interface SettingsProps {
  user: User;
  onClose: () => void;
  isDarkMode?: boolean;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Notifications {
  email: boolean;
  taskReminders: boolean;
  projectUpdates: boolean;
  deadlineAlerts: boolean;
}

interface Preferences {
  notifications: Notifications;
  language: string;
  autoLogout: number;
  theme: string;
}

interface PersonalInfo {
  telephone: string;
  adresse: string;
  situationFamiliale: string;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  loginAlerts: boolean;
  compte: boolean;
  sessionTimeout: number;
}

const Settings: React.FC<SettingsProps> = ({
  user,
  onClose,
  isDarkMode = true,
}) => {
  const [activeSettingsTab, setActiveSettingsTab] =
    useState<string>("password");
  const [loading, setLoading] = useState<boolean>(false);

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [preferences, setPreferences] = useState<Preferences>({
    notifications: {
      email: true,
      taskReminders: true,
      projectUpdates: true,
      deadlineAlerts: true,
    },
    language: "fr",
    autoLogout: 60,
    theme: "light",
  });

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    telephone: user?.telephone || "",
    adresse: user?.adresse || "",
    situationFamiliale: user?.situation_familiale || "",
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    loginAlerts: true,
    compte: true,
    sessionTimeout: 30,
  });

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async (): Promise<void> => {
    try {
      const response = await api.get<{
        success: boolean;
        preferences: Partial<Preferences>;
        security: Partial<SecuritySettings>;
      }>("/api/user-preferences");
      if (response.data.success) {
        setPreferences({ ...preferences, ...response.data.preferences });
        setSecuritySettings({ ...securitySettings, ...response.data.security });
      }
    } catch (error) {
      console.error("Erreur chargement préférences:", error);
    }
  };

  const handlePasswordChange = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Les nouveaux mots de passe ne correspondent pas");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error(
        "Le nouveau mot de passe doit contenir au moins 8 caractères",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await api.patch<{ success: boolean }>(
        `/api/change-password/${user.id}`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
      );

      if (response.data.success) {
        toast.success("Mot de passe modifié avec succès");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error: any) {
      if (error.response) {
        const serverErrorMessage: string = error.response.data.message;
        toast.error(`❌ ${serverErrorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompte = async (): Promise<void> => {
    const compte = false;

    try {
      console.log("compte ", compte);
      const response = await api.put<{ success: boolean; message: string }>(
        `/api/compte/${user.id}`,
        compte,
      );
      console.log("message ", response.data.message);
      if (response.data.success) {
        toast.success(`${response.data.message}`);
        authUtils.logout();
        setTimeout(() => {
          window.location.href = "/compte";
        }, 5000);
      }
    } catch {
      toast.error("Action impossible nous avons rencontrez un problème");
    }
  };

  const handlePersonalInfoUpdate = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.patch<{ success: boolean }>(
        `/api/update-personal-info/${user.id}`,
        personalInfo,
      );

      if (response.data.success) {
        toast.success("Informations personnelles mises à jour");
      }
    } catch (error: any) {
      if (error.response) {
        toast.error(`❌ ${error.response.data.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async (): Promise<void> => {
    setLoading(true);
    console.log("compte ", securitySettings);
    try {
      const response = await api.put<{ success: boolean }>(
        `/api/preferences/${user.id}`,
        {
          preferences,
          security: securitySettings,
        },
      );

      if (response.data.success) {
        toast.success("Préférences sauvegardées");
      }
    } catch (error: any) {
      if (error.response) {
        toast.error(`❌ ${error.response.data.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordSettings = (): React.ReactElement => (
    <div className="space-y-6">
      <div
        className={`${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } rounded-2xl shadow-sm border p-6`}
      >
        <h3
          className={`text-xl font-bold ${
            isDarkMode ? "text-white" : "text-gray-800"
          } mb-6 flex items-center gap-2`}
        >
          <svg
            className="w-6 h-6 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Modification du mot de passe
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label
              className={`block ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              } text-sm font-semibold mb-2`}
            >
              Mot de passe actuel *
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
              className={`w-full px-4 py-3 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400"
              } border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              placeholder="Entrez votre mot de passe actuel"
              required
            />
          </div>

          <div>
            <label
              className={`block ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              } text-sm font-semibold mb-2`}
            >
              Nouveau mot de passe *
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
              className={`w-full px-4 py-3 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400"
              } border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              placeholder="Minimum 8 caractères"
              required
              minLength={8}
            />
          </div>

          <div>
            <label
              className={`block ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              } text-sm font-semibold mb-2`}
            >
              Confirmer le nouveau mot de passe *
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
              className={`w-full px-4 py-3 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400"
              } border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              placeholder="Confirmez votre nouveau mot de passe"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </form>
      </div>

      <div
        className={`${
          isDarkMode
            ? "bg-yellow-900/30 border-yellow-700/50"
            : "bg-yellow-50 border-yellow-200"
        } border rounded-xl p-4`}
      >
        <h4
          className={`${
            isDarkMode ? "text-yellow-300" : "text-yellow-800"
          } font-semibold mb-2 flex items-center gap-2`}
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          Conseils de sécurité
        </h4>
        <ul
          className={`${
            isDarkMode ? "text-yellow-200" : "text-yellow-700"
          } text-sm space-y-1`}
        >
          <li>• Utilisez au moins 8 caractères</li>
          <li>• Mélangez majuscules, minuscules, chiffres et symboles</li>
          <li>• Évitez les informations personnelles</li>
        </ul>
      </div>
    </div>
  );

  const renderPersonalInfo = (): React.ReactElement => (
    <div
      className={`${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } rounded-2xl shadow-sm border p-6`}
    >
      <h3
        className={`text-xl font-bold ${
          isDarkMode ? "text-white" : "text-gray-800"
        } mb-6 flex items-center gap-2`}
      >
        <svg
          className="w-6 h-6 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        Informations personnelles
      </h3>
      <form onSubmit={handlePersonalInfoUpdate} className="space-y-4">
        <div>
          <label
            className={`block ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            } text-sm font-semibold mb-2`}
          >
            Téléphone
          </label>
          <input
            type="tel"
            value={personalInfo.telephone}
            onChange={(e) =>
              setPersonalInfo({ ...personalInfo, telephone: e.target.value })
            }
            className={`w-full px-4 py-3 ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400"
            } border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
            placeholder="+237 XX XX XX XX"
            maxLength={9}
          />
        </div>

        <div>
          <label
            className={`block ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            } text-sm font-semibold mb-2`}
          >
            Adresse
          </label>
          <textarea
            value={personalInfo.adresse}
            onChange={(e) =>
              setPersonalInfo({ ...personalInfo, adresse: e.target.value })
            }
            rows={3}
            className={`w-full px-4 py-3 ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400"
            } border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none`}
            placeholder="Votre adresse complète"
          />
        </div>

        <div>
          <label
            className={`block ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            } text-sm font-semibold mb-2`}
          >
            Situation matrimoniale
          </label>
          <select
            value={personalInfo.situationFamiliale}
            onChange={(e) =>
              setPersonalInfo({
                ...personalInfo,
                situationFamiliale: e.target.value,
              })
            }
            className={`w-full px-4 py-3 ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-gray-50 border-gray-300 text-gray-800"
            } border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
          >
            <option value="">Sélectionner</option>
            <option value="Célibataire">Célibataire</option>
            <option value="Marié(e)">Marié(e)</option>
            <option value="Divorcé(e)">Divorcé(e)</option>
            <option value="Veuf/Veuve">Veuf/Veuve</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {loading ? "Mise à jour..." : "Mettre à jour"}
        </button>
      </form>
    </div>
  );

  const renderNotificationSettings = (): React.ReactElement => (
    <div className="space-y-6">
      <div
        className={`${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } rounded-2xl shadow-sm border p-6`}
      >
        <h3
          className={`text-xl font-bold ${
            isDarkMode ? "text-white" : "text-gray-800"
          } mb-6 flex items-center gap-2`}
        >
          <svg
            className="w-6 h-6 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          Notifications
        </h3>
      </div>

      <div
        className={`${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } rounded-2xl shadow-sm border p-6`}
      >
        <h3
          className={`text-xl font-bold ${
            isDarkMode ? "text-white" : "text-gray-800"
          } mb-6 flex items-center gap-2`}
        >
          <svg
            className="w-6 h-6 text-purple-600"
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
          Paramètres généraux
        </h3>

        <div className="space-y-4">
          <div>
            <label
              className={`block ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              } text-sm font-semibold mb-2`}
            >
              Déconnexion automatique
            </label>
            <select
              value={preferences.autoLogout}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  autoLogout: parseInt(e.target.value),
                })
              }
              className={`w-full px-4 py-3 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-gray-50 border-gray-300 text-gray-800"
              } border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500`}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 heure</option>
              <option value={120}>2 heures</option>
            </select>
          </div>

          <div>
            <label
              className={`block ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              } text-sm font-semibold mb-2`}
            >
              Langue de l'interface
            </label>
            <select
              value={preferences.language}
              onChange={(e) =>
                setPreferences({ ...preferences, language: e.target.value })
              }
              className={`w-full px-4 py-3 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-gray-50 border-gray-300 text-gray-800"
              } border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500`}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={handlePreferencesUpdate}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
      >
        {loading ? "Sauvegarde..." : "Sauvegarder les paramètres"}
      </button>
    </div>
  );
  const renderSecuritySettings = (): React.ReactElement => (
    <div className="space-y-6">
      <div
        className={`${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } rounded-2xl shadow-sm border p-6`}
      >
        <h3
          className={`text-xl font-bold ${
            isDarkMode ? "text-white" : "text-gray-800"
          } mb-6 flex items-center gap-2`}
        >
          <svg
            className="w-6 h-6 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          Sécurité du compte
        </h3>

        <div className="space-y-3">
          <div
            className={`flex items-center justify-between p-4 ${
              isDarkMode
                ? "bg-gray-700 border-gray-600"
                : "bg-gray-50 border-gray-200"
            } rounded-xl border`}
          >
            <div>
              <h4
                className={`${
                  isDarkMode ? "text-gray-200" : "text-gray-800"
                } font-semibold`}
              >
                Authentification à deux facteurs
              </h4>
              <p
                className={`${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                } text-sm`}
              >
                Code de vérification requis à chaque connexion
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.twoFactorAuth}
                onChange={(e) =>
                  setSecuritySettings({
                    ...securitySettings,
                    twoFactorAuth: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div
                className={`w-11 h-6 rounded-full relative ${
                  securitySettings.twoFactorAuth
                    ? "bg-green-600"
                    : isDarkMode
                      ? "bg-gray-600"
                      : "bg-gray-300"
                } peer-focus:ring-4 peer-focus:ring-green-200 transition-colors`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform ${
                    securitySettings.twoFactorAuth ? "translate-x-5" : ""
                  }`}
                ></div>
              </div>
            </label>
          </div>

          <div
            className={`flex items-center justify-between p-4 ${
              isDarkMode
                ? "bg-gray-700 border-gray-600"
                : "bg-gray-50 border-gray-200"
            } rounded-xl border`}
          >
            <div>
              <h4
                className={`${
                  isDarkMode ? "text-gray-200" : "text-gray-800"
                } font-semibold`}
              >
                Alertes de connexion
              </h4>
              <p
                className={`${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                } text-sm`}
              >
                Recevoir une notification à chaque nouvelle connexion
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.loginAlerts}
                onChange={(e) =>
                  setSecuritySettings({
                    ...securitySettings,
                    loginAlerts: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div
                className={`w-11 h-6 rounded-full relative ${
                  securitySettings.loginAlerts
                    ? "bg-purple-600"
                    : isDarkMode
                      ? "bg-gray-600"
                      : "bg-gray-300"
                } peer-focus:ring-4 peer-focus:ring-purple-200 transition-colors`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform ${
                    securitySettings.loginAlerts ? "translate-x-5" : ""
                  }`}
                ></div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Zone de danger - Suppression de compte */}
      <div
        className={`${
          isDarkMode
            ? "bg-red-900/30 border-red-700/50"
            : "bg-red-50 border-red-200"
        } border rounded-xl p-6`}
      >
        <h4
          className={`${
            isDarkMode ? "text-red-300" : "text-red-800"
          } font-bold mb-2 flex items-center gap-2`}
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          Zone de danger
        </h4>
        <p
          className={`${
            isDarkMode ? "text-red-200/80" : "text-red-700"
          } text-sm mb-4`}
        >
          La suppression de votre compte est définitive et irréversible. Toutes
          vos données seront perdues.
        </p>
        <button
          onClick={() => {
            if (
              window.confirm(
                "⚠️ ATTENTION : Cette action est définitive et irréversible.\n\nToutes vos données seront définitivement supprimées :\n• Votre profil utilisateur\n• Vos projets et tâches\n• Votre historique\n• Vos paramètres\n\nÊtes-vous absolument sûr de vouloir supprimer votre compte ?",
              )
            ) {
              handleCompte();
            }
          }}
          className={`w-full ${
            isDarkMode
              ? "bg-red-700 hover:bg-red-800 border-red-600"
              : "bg-red-600 hover:bg-red-700 border-red-700"
          } border-2 text-white py-3 px-4 rounded-xl transition-all font-semibold flex items-center justify-center gap-2`}
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Supprimer définitivement mon compte
        </button>
      </div>

      <button
        onClick={handlePreferencesUpdate}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
      >
        {loading ? "Sauvegarde..." : "Sauvegarder les paramètres"}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        } rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Paramètres</h2>
              <p className="text-white/80 mt-1">
                Gérez votre compte et vos préférences
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Navigation des onglets */}
          <div
            className={`w-64 ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } border-r p-4`}
          >
            <nav className="space-y-2">
              {[
                {
                  id: "password",
                  label: "Mot de passe",
                  icon: (
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
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  ),
                },
                {
                  id: "personal",
                  label: "Infos personnelles",
                  icon: (
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  ),
                },
                {
                  id: "notifications",
                  label: "Notifications",
                  icon: (
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
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  ),
                },
                {
                  id: "security",
                  label: "Sécurité",
                  icon: (
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
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  ),
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSettingsTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeSettingsTab === tab.id
                      ? "bg-purple-100 text-purple-700 font-semibold shadow-sm"
                      : isDarkMode
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Contenu des onglets */}
          <div className="flex-1 p-8 overflow-y-auto">
            {activeSettingsTab === "password" && renderPasswordSettings()}
            {activeSettingsTab === "personal" && renderPersonalInfo()}
            {activeSettingsTab === "notifications" &&
              renderNotificationSettings()}
            {activeSettingsTab === "security" && renderSecuritySettings()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
