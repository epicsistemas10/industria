import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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

// shape of page-level permissions stored on the profile (JSON)
export type PagePermissions = Record<string, { view?: boolean; edit?: boolean; delete?: boolean }>;

export function usePermissions() {
  const { user, session } = useAuth();
  const [pagePermissions, setPagePermissions] = useState<PagePermissions>({});

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

  // Try to load page-level permissions from the `usuarios` table for the current session user.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const email = session?.user?.email || user?.email;
        if (!email) return;
        const { data, error } = await supabase.from('usuarios').select('page_permissions').eq('email', email).maybeSingle();
        if (!error && data && mounted) {
          const pp = data.page_permissions || data.pagePermissions || {};
          if (typeof pp === 'string') {
            try { setPagePermissions(JSON.parse(pp)); } catch { setPagePermissions({}); }
          } else if (pp && typeof pp === 'object') {
            setPagePermissions(pp);
          } else {
            setPagePermissions({});
          }
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [session?.user?.email, user?.email]);

  const hasPagePermission = (page: string, action: 'view' | 'edit' | 'delete') => {
    // explicit page permission wins if present
    const p = pagePermissions[page];
    if (p) {
      if (action === 'view') return !!p.view;
      if (action === 'edit') return !!p.edit;
      if (action === 'delete') return !!p.delete;
    }
    // fallback to role-level rules
    if (action === 'view') return rules[permission].canView;
    if (action === 'edit') return rules[permission].canEdit;
    if (action === 'delete') return rules[permission].canDelete;
    return false;
  };

  return {
    ...rules[permission],
    permission,
    pagePermissions,
    hasPagePermission,
  };
}
