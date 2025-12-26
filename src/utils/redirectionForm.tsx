import api from "./api";

interface EmployerUser {
  id: string | number;
  prenom: string;
  nom: string;
  email?: string;
  departement: string;
  role?: string;
  telephone?: string;
  statut?: boolean;
}

interface TokenExpiryInfo {
  expiryDate: Date;
  loginDate: Date;
  expiresInMinutes: number;
  isExpired: boolean;
  timeLeft: number;
  timeLeftMinutes: number;
}

interface ModalContent {
  title: string;
  message: string;
}

interface AuthUtils {
  _isLoggingOut: boolean;
  _interceptorSetup: boolean;
  autoLogoutTimer: NodeJS.Timeout | null;
  logoutHandler?: (content: ModalContent) => void;
  showLogoutModal?: (content: ModalContent) => void;

  setUserData: (
    userData: EmployerUser,
    token: string,
    expiresAt: string,
    expiresIn: number
  ) => void;
  getUserData: () => EmployerUser | null;
  getToken: () => string | null;
  getTokenExpiryInfo: () => TokenExpiryInfo | null;
  isTokenExpiredLocally: () => boolean;
  hasAuthData: () => boolean;
  checkTokenValidity: () => Promise<boolean>;
  verifyAndRedirect: () => Promise<boolean>;
  setLogoutHandler: (handler: (content: ModalContent) => void) => void;
  scheduleAutoLogout: () => void;
  getTimeLeftDisplay: () => string;
  redirectToLogin: () => void;
  getRedirectPath: (user: EmployerUser) => string;
  logout: (reason?: string) => Promise<void>;
  setupapiInterceptor: () => void;
  debugTokenState: () => void;
  isAuthenticated: () => boolean;
}

export const authUtils: AuthUtils = {
  _isLoggingOut: false,
  _interceptorSetup: false,
  autoLogoutTimer: null,

  setUserData: (
    userData: EmployerUser,
    token: string,
    expiresAt: string,
    expiresIn: number
  ): void => {
    localStorage.setItem("user_data", JSON.stringify(userData));
    localStorage.setItem("access_token", token);
    localStorage.setItem("token_expires_at", expiresAt);
    localStorage.setItem("token_expires_in", expiresIn.toString());
    localStorage.setItem("login_time", Date.now().toString());

    console.log(
      "✅ Token sauvé, expire à:",
      new Date(expiresAt).toLocaleString()
    );
  },

  getUserData: (): EmployerUser | null => {
    const userData = localStorage.getItem("user_data");
    return userData ? JSON.parse(userData) : null;
  },

  getToken: (): string | null => {
    return localStorage.getItem("access_token");
  },

  getTokenExpiryInfo: (): TokenExpiryInfo | null => {
    const expiresAt = localStorage.getItem("token_expires_at");
    const expiresIn = localStorage.getItem("token_expires_in");
    const loginTime = localStorage.getItem("login_time");

    if (!expiresAt || !loginTime) {
      return null;
    }

    const expiryDate = new Date(expiresAt);
    const loginDate = new Date(parseInt(loginTime));
    const now = new Date();

    return {
      expiryDate,
      loginDate,
      expiresInMinutes: parseInt(expiresIn || "60"),
      isExpired: now > expiryDate,
      timeLeft: Math.max(0, expiryDate.getTime() - now.getTime()),
      timeLeftMinutes: Math.max(
        0,
        Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60))
      ),
    };
  },

  isTokenExpiredLocally: (): boolean => {
    const expiryInfo = authUtils.getTokenExpiryInfo();

    if (!expiryInfo) {
      return true;
    }

    return expiryInfo.isExpired;
  },

  hasAuthData: (): boolean => {
    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user_data");
    return !!(token && userData);
  },

  checkTokenValidity: async (): Promise<boolean> => {
    const token = authUtils.getToken();

    if (!token) {
      return false;
    }

    if (authUtils.isTokenExpiredLocally()) {
      return false;
    }

    try {
      const response = await api.get("/api/check-token", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      return response.data.success;
    } catch {
      return false;
    }
  },

  verifyAndRedirect: async (): Promise<boolean> => {
    if (authUtils._isLoggingOut) {
      return false;
    }

    if (!authUtils.hasAuthData()) {
      authUtils.redirectToLogin();
      return false;
    }

    if (authUtils.isTokenExpiredLocally()) {
      authUtils.logout("Session expirée");
      return false;
    }

    const isTokenValid = await authUtils.checkTokenValidity();
    if (!isTokenValid) {
      authUtils.logout("Session invalide");
      return false;
    }

    return true;
  },

  setLogoutHandler(handler: (content: ModalContent) => void): void {
    authUtils.logoutHandler = handler;
  },

  scheduleAutoLogout: (): void => {
    const expiryInfo = authUtils.getTokenExpiryInfo();

    if (!expiryInfo || expiryInfo.isExpired) {
      return;
    }

    const timeLeft = expiryInfo.timeLeft;

    if (timeLeft > 0) {
      if (authUtils.autoLogoutTimer) {
        clearTimeout(authUtils.autoLogoutTimer);
      }

      authUtils.autoLogoutTimer = setTimeout(() => {
        console.log("Session expirée automatiquement.");

        // Afficher le modal avant de déconnecter
        if (authUtils.logoutHandler) {
          authUtils.logoutHandler({
            title: "⏰ Session Expirée",
            message:
              "Votre session a expiré. Vous allez être déconnecté automatiquement.",
          });
        }

        // Déconnecter après 3 secondes pour laisser le temps de voir le modal
        setTimeout(() => {
          authUtils.logout("Session expirée automatiquement");
        }, 3000);
      }, timeLeft);
    }
  },

  getTimeLeftDisplay: (): string => {
    const expiryInfo = authUtils.getTokenExpiryInfo();

    if (!expiryInfo || expiryInfo.isExpired) {
      return "Expiré";
    }

    const minutes = expiryInfo.timeLeftMinutes;

    if (minutes < 1) {
      return "Expire bientôt";
    } else if (minutes === 1) {
      return "1 minute restante";
    } else {
      return `${minutes} minutes restantes`;
    }
  },

  redirectToLogin: (): void => {
    window.location.href = "/";
  },

  getRedirectPath: (user: EmployerUser): string => {
    switch (user.departement) {
      case "Administration":
        return "/admin";
      default:
        return "/departement/employer";
    }
  },

  logout: async (reason?: string): Promise<void> => {
    // Protection contre les appels multiples
    if (authUtils._isLoggingOut) {
      console.log("Logout déjà en cours...");
      return;
    }

    authUtils._isLoggingOut = true;

    try {
      const token = authUtils.getToken();
      if (token) {
        console.log("Appel API logout...", reason || "");
        try {
          await api.post(
            "/api/logout",
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              timeout: 5000,
            }
          );

          if (authUtils.autoLogoutTimer) {
            clearTimeout(authUtils.autoLogoutTimer);
            authUtils.autoLogoutTimer = null;
          }

          localStorage.clear();

          if (reason && reason !== "Session expirée automatiquement") {
            alert(`Déconnexion effectuée avec succès. ${reason}`);
          }

          window.location.href = "/";
        } catch {
          localStorage.clear();
          window.location.href = "/";
        }
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      localStorage.clear();
      window.location.href = "/";
    } finally {
      setTimeout(() => {
        authUtils._isLoggingOut = false;
      }, 2000);
    }
  },

  setupapiInterceptor: (): void => {
    if (authUtils._interceptorSetup) {
      return;
    }

    const publicUrls: string[] = [
      "/api/postes",
      "/api/login",
      "/api/verif",
      "/api/users",
      "/api/emeilverif",
      "/api/passReset",
      "http://localhost:5000/users",
      "/api/logout",
      "/api/approuver",
    ];

    const isPublicUrl = (url?: string): boolean => {
      return publicUrls.some((publicUrl) => url && url.includes(publicUrl));
    };

    api.interceptors.request.use(
      (config) => {
        if (isPublicUrl(config.url)) {
          return config;
        }

        if (authUtils._isLoggingOut) {
          return Promise.reject(new Error("Logout en cours"));
        }

        const token = authUtils.getToken();
        if (token && !authUtils.isTokenExpiredLocally()) {
          config.headers.Authorization = `Bearer ${token}`;
        } else if (!isPublicUrl(config.url)) {
          authUtils.logout("Token manquant ou expiré");
          return Promise.reject(new Error("Token manquant ou expiré"));
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    api.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const url = error.config?.url;

        if (
          status === 401 &&
          !isPublicUrl(url) &&
          !authUtils._isLoggingOut &&
          window.location.pathname !== "/"
        ) {
          console.log("Token invalide détecté, déconnexion...");
          authUtils.logout("Token invalide");
        }

        return Promise.reject(error);
      }
    );

    authUtils._interceptorSetup = true;
    console.log("Interceptors configurés");
  },

  debugTokenState: (): void => {
    const token = authUtils.getToken();
    const hasAuthData = authUtils.hasAuthData();
    const isExpired = authUtils.isTokenExpiredLocally();
    const isLoggingOut = authUtils._isLoggingOut;

    console.log("Debug Token State:", {
      hasToken: !!token,
      tokenLength: token?.length,
      hasAuthData,
      isExpired,
      isLoggingOut,
    });
  },

  isAuthenticated: (): boolean => {
    return authUtils.hasAuthData() && !authUtils.isTokenExpiredLocally();
  },
};
