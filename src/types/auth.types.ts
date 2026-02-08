
export interface User {
  id: string;
  nom: string;
  prenom: string;
  email_pro: string;
  departement:string;
  role?: string;
  compte: number; // 0 = désactivé, 1 = actif
}

export interface UserForAdmin extends Omit<User, 'id'> {
  password?: string;
  // je vais ajoutez d'autres champs nécessaires pour la création d'utilisateur
}

export interface LoginCredentials {
  email_pro: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  warning: string;
  remaining_attempts: string;
  user: User;
  access_token: string;
  expires_at: string;
  expires_in: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  user?: User;
  access_token?: string;
  expires_at?: string;
  expires_in?: number;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface CodeGenerationResult {
  code: string;
  emailSent: boolean;
}

export type InitState = 'loading' | 'ready' | 'error';