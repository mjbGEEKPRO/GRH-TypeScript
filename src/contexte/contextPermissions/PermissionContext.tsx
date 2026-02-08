import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import api from "../../utils/api";
import { authUtils } from "../../utils/Intercepteur";

interface Permission {
  id?: string | number;
  nom: string;
  slug: string;
  description?: string;
}

interface PermissionContextValue {
  permissions: Permission[];
  loading: boolean;
  error: string | null;
  hasPermission: (permissionName: string) => boolean;
  hasAllPermissions: (permissionNames: string[]) => boolean;
  hasAnyPermission: (permissionNames: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
  clearPermissions: () => void;
}

interface PermissionProviderProps {
  children: ReactNode;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(
  undefined,
);

export const usePermissions = (): PermissionContextValue => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error(
      "usePermissions doit être utilisé dans un PermissionProvider",
    );
  }
  return context;
};

export const PermissionProvider: React.FC<PermissionProviderProps> = ({
  children,
}) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const token = authUtils.getToken();
      if (!token || !authUtils.isAuthenticated()) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      const response = await api.get("/api/user/permissions", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        setPermissions(response.data.permissions || []);
      }
    } catch (err: any) {
      setError(err.message);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authUtils.isAuthenticated()) {
      loadPermissions();
    } else {
      setPermissions([]);
      setLoading(false);
    }
  }, [loadPermissions]);

  const hasPermission = useCallback(
    (permissionName: string): boolean => {
      if (!permissionName) return false;
      return permissions.some(
        (perm) => perm.nom === permissionName || perm.slug === permissionName,
      );
    },
    [permissions],
  );

  const hasAllPermissions = useCallback(
    (permissionNames: string[]): boolean => {
      if (!Array.isArray(permissionNames) || permissionNames.length === 0)
        return false;
      return permissionNames.every((nom) => hasPermission(nom));
    },
    [hasPermission],
  );

  const hasAnyPermission = useCallback(
    (permissionNames: string[]): boolean => {
      if (!Array.isArray(permissionNames) || permissionNames.length === 0)
        return false;
      return permissionNames.some((nom) => hasPermission(nom));
    },
    [hasPermission],
  );

  const clearPermissions = useCallback((): void => {
    setPermissions([]);
    setLoading(false);
    setError(null);
  }, []);

  const value: PermissionContextValue = {
    permissions,
    loading,
    error,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    refreshPermissions: loadPermissions,
    clearPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};
