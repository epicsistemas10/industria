import { useAuth } from '../contexts/AuthContext';

export type Permission = 'admin' | 'gestor' | 'mecanico' | 'auxiliar' | 'visitante';

interface PermissionRules {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
  canManageUsers: boolean;
  canManageCosts: boolean;
  canManageTeams: boolean;
  canExecuteOS: boolean;
  canApproveImprovements: boolean;
}

export function usePermissions(): PermissionRules & { permission: Permission | null } {
  const { user } = useAuth();
  
  const permission = (user?.user_metadata?.permission || 'visitante') as Permission;

  const rules: Record<Permission, PermissionRules> = {
    admin: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canView: true,
      canManageUsers: true,
      canManageCosts: true,
      canManageTeams: true,
      canExecuteOS: true,
      canApproveImprovements: true,
    },
    gestor: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canView: true,
      canManageUsers: false,
      canManageCosts: true,
      canManageTeams: true,
      canExecuteOS: true,
      canApproveImprovements: true,
    },
    mecanico: {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canView: true,
      canManageUsers: false,
      canManageCosts: false,
      canManageTeams: false,
      canExecuteOS: true,
      canApproveImprovements: false,
    },
    auxiliar: {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canView: true,
      canManageUsers: false,
      canManageCosts: false,
      canManageTeams: false,
      canExecuteOS: false,
      canApproveImprovements: false,
    },
    visitante: {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canView: true,
      canManageUsers: false,
      canManageCosts: false,
      canManageTeams: false,
      canExecuteOS: false,
      canApproveImprovements: false,
    },
  };

  return {
    ...rules[permission],
    permission,
  };
}
