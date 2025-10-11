//Données utilisateur retournées dans les réponses d'authentification

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  territory?: string;
  territoryName?: string;
  photoUrl?: string;
  phone?: string;
  employeeId?: string;
  hireDate?: string;
  manager?: string;
}

//Structure de réponse d'authentification standard
export interface AuthResponse {
  success: boolean;
  message: string;
  user: UserResponse;
  access_token: string;
  refresh_token?: string;
}

// Structure de réponse du profil

export interface ProfileResponse {
  success: boolean;
  user: UserResponse;
}
