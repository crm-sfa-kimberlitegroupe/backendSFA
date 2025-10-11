export class User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  territoryId?: string;

  // Informations supplémentaires
  phone?: string;
  employeeId?: string;
  hireDate?: Date;
  managerId?: string;

  // Photo de profil (Cloudinary)
  photoUrl?: string;

  // Protection contre les tentatives de connexion (SCRUM-39)
  lockedUntil?: Date;

  // Récupération de mot de passe (SCRUM-38)
  resetToken?: string;
  resetTokenExpiry?: Date;

  // Authentification à deux facteurs (SCRUM-40)
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;

  // Vérification d'email (Bonus)
  emailVerified: boolean;
  emailVerificationToken?: string;

  createdAt: Date;
  updatedAt: Date;
}
