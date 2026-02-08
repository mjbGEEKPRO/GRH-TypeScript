// Types corrigés et améliorés pour le gestionnaire de comptes bloqués

export type BlockedUser = {
  id: number;
  name: string;
  email: string;
  role?: string;
  department?: string;
  blocked_at: string;
  reason: string;
  type: "user";
};

export type BlockedIP = {
  id: number;
  ip_address: string;
  blocked_until: string;
  attempts_count: number;
  emails_tried?: string[];
  type: "ip";
};

// Union type pour les comptes bloqués
export type BlockedData = BlockedUser | BlockedIP;

export interface ActiveUsers {
  id: string | number;
  email: string;
  name: string;
  department: string;
  role: string;
  last_login: string;
  ip_address?: string;
  status?: string;
}

// Type guards pour vérifier le type de compte bloqué
export const isBlockedUser = (account: BlockedData): account is BlockedUser => {
  return account.type === "user";
};

export const isBlockedIP = (account: BlockedData): account is BlockedIP => {
  return account.type === "ip";
};
