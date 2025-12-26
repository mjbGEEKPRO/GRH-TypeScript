import React from "react";
import { usePermissions } from "../contexte/contextPermissions/PermissionContext";

interface CanProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, loading } =
    usePermissions();

  if (loading) {
    return fallback;
  }

  let hasAccess = false;
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  return hasAccess ? <>{children}</> : fallback;
};

interface CannotProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  children: React.ReactNode;
}

export const Cannot: React.FC<CannotProps> = ({
  permission,
  permissions,
  requireAll = false,
  children,
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, loading } =
    usePermissions();

  if (loading) {
    return null;
  }

  let hasAccess = false;
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  return !hasAccess ? <>{children}</> : null;
};

type WithPermissionProps = Record<string, unknown>;

interface WithPermissionsProps {
  permissions: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

const withPermission = <P extends WithPermissionProps>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission: string,
  FallbackComponent: React.ComponentType | null = null
) => {
  return (props: P) => {
    const { hasPermission, loading } = usePermissions();

    if (loading) {
      return FallbackComponent ? (
        <FallbackComponent />
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Vérification des permissions...</p>
          </div>
        </div>
      );
    }

    if (!hasPermission(requiredPermission)) {
      return FallbackComponent ? (
        <FallbackComponent />
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-4">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Accès Refusé
            </h2>
            <p className="text-gray-600 mb-4">
              Vous n'avez pas les permissions nécessaires pour accéder à cette
              page.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

const withPermissions = <P extends Record<string, unknown>>(
  WrappedComponent: React.ComponentType<P>,
  config: WithPermissionsProps
) => {
  return (props: P) => {
    const { hasAllPermissions, hasAnyPermission, loading } = usePermissions();
    const { permissions, requireAll = false, fallback } = config;

    if (loading) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Vérification des permissions...</p>
          </div>
        </div>
      );
    }

    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasAccess) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-4">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Accès Refusé
            </h2>
            <p className="text-gray-600 mb-4">
              Vous n'avez pas les permissions nécessaires pour accéder à cette
              page.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

interface AccessDeniedProps {
  section?: string;
  showBackButton?: boolean;
  className?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  section = "cette section",
  showBackButton = true,
  className = "",
}) => (
  <div
    className={`text-center py-16 bg-white rounded-3xl shadow-lg border border-red-100 ${className}`}
  >
    <div className="text-6xl mb-4">🔒</div>
    <h2 className="text-2xl font-bold text-gray-800 mb-2">
      💔Cher amie ce n'est pas de ta faute mais l'accès t'est refusé
    </h2>
    <p className="text-gray-600 mb-4">
      Vous n'avez pas les permissions nécessaires pour accéder à {section}.
    </p>
    <div className="text-sm text-gray-500 bg-gray-50 inline-block px-4 py-2 rounded-lg mb-4">
      Contactez un administrateur pour obtenir l'accès
    </div>
    {showBackButton && (
      <div>
        <button
          onClick={() => window.history.back()}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors mt-2"
        >
          Retour
        </button>
      </div>
    )}
  </div>
);

export { withPermission, withPermissions };