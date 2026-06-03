export interface ErrorResponse {
  error: true;
  message: string;
  code?: string;
  details?: string;
}

export interface SuccessResponse<T> {
  error: false;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  error: false;
  message?: string;
  data: T;
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export type ApiResponse<T> =
  | ErrorResponse
  | SuccessResponse<T>
  | PaginatedResponse<T>;

export interface Room {
  id: string;
  hidden: boolean;
  name: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  deleted: boolean;
  can_manage: boolean;
}

export interface CreateRoomRequest {
  name: string;
  hidden: boolean;
}

export interface ParticipantActionRequest {
  participant_id: string;
}

export interface TokenResponse {
  token: string;
  url: string;
  roomName: string;
  participantIdentity: string;
  expiresAt: string;
}

export type Profile = {
  user_id: string;
  avatar?: string | null;
  heading?: string | null;
  description?: string | null;
  meta?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  patronymic?: string | null;
  students?: IdentityStudent[];
  employees?: IdentityEmployee[];
  contacts?: ProfileContacts;
  socials?: unknown;
};

export type IdentityStudent = {
  faculty: string | null;
  department: string | null;
  direction: string | null;
  profile: string | null;
  group: string | null;
  edu_form: string | null;
  recordbook: string | null;
  status: {
    name: string | null;
    id: number | null;
  };
};

export type IdentityEmployee = {
  subdivision: string | null;
  employee_post: string | null;
  employee_type: string | null;
};

export type ProfileContacts = {
  phone: string | null;
  personal_email: string | null;
  corporative_email: string | null;
};
