export interface Ticket {
  id: number;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  unread_count: number;
}

export interface Message {
  id: number;
  ticket_id: number;
  sender_name: string;
  sender_type: "user" | "admin";
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  departement?: string;
}
