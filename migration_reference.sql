-- Migration SQL de référence pour les fonctionnalités d'authentification avancées
-- Ce fichier est généré automatiquement par Prisma, mais fourni ici pour référence

-- ========================================
-- 1. Ajouter les nouveaux champs à la table user
-- ========================================

-- SCRUM-39: Protection contre les tentatives de connexion
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "locked_until" TIMESTAMPTZ;

-- SCRUM-38: Récupération de mot de passe
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "reset_token" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "reset_token_expiry" TIMESTAMPTZ;

-- SCRUM-40: Authentification à deux facteurs
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "two_factor_secret" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false;

-- Bonus: Vérification d'email
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "email_verification_token" TEXT;

-- ========================================
-- 2. Créer la table login_attempt
-- ========================================

CREATE TABLE IF NOT EXISTS "login_attempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "email" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempt_pkey" PRIMARY KEY ("id")
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "login_attempt_email_idx" ON "login_attempt"("email");
CREATE INDEX IF NOT EXISTS "login_attempt_ip_idx" ON "login_attempt"("ip");
CREATE INDEX IF NOT EXISTS "login_attempt_created_at_idx" ON "login_attempt"("created_at");

-- Clé étrangère
ALTER TABLE "login_attempt" ADD CONSTRAINT "login_attempt_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "user"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================================
-- 3. Créer la table refresh_token
-- ========================================

CREATE TABLE IF NOT EXISTS "refresh_token" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ,
    "ip" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- Index et contraintes
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_token_token_key" ON "refresh_token"("token");
CREATE INDEX IF NOT EXISTS "refresh_token_user_id_idx" ON "refresh_token"("user_id");
CREATE INDEX IF NOT EXISTS "refresh_token_token_idx" ON "refresh_token"("token");
CREATE INDEX IF NOT EXISTS "refresh_token_expires_at_idx" ON "refresh_token"("expires_at");

-- Clé étrangère
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "user"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================================
-- 4. Commentaires sur les colonnes (optionnel)
-- ========================================

COMMENT ON COLUMN "user"."locked_until" IS 'Date jusqu''à laquelle le compte est verrouillé après tentatives échouées';
COMMENT ON COLUMN "user"."reset_token" IS 'Token hashé pour la réinitialisation du mot de passe';
COMMENT ON COLUMN "user"."reset_token_expiry" IS 'Date d''expiration du token de réinitialisation';
COMMENT ON COLUMN "user"."two_factor_secret" IS 'Secret TOTP pour l''authentification à deux facteurs';
COMMENT ON COLUMN "user"."two_factor_enabled" IS 'Indique si l''authentification à deux facteurs est activée';
COMMENT ON COLUMN "user"."email_verified" IS 'Indique si l''email a été vérifié';
COMMENT ON COLUMN "user"."email_verification_token" IS 'Token pour la vérification de l''email';

COMMENT ON TABLE "login_attempt" IS 'Historique des tentatives de connexion pour la sécurité';
COMMENT ON TABLE "refresh_token" IS 'Tokens de rafraîchissement pour les sessions longue durée';

-- ========================================
-- 5. Requêtes utiles pour le monitoring
-- ========================================

-- Voir les tentatives de connexion échouées des dernières 24h
-- SELECT email, ip, COUNT(*) as attempts, MAX(created_at) as last_attempt
-- FROM login_attempt
-- WHERE success = false AND created_at > NOW() - INTERVAL '24 hours'
-- GROUP BY email, ip
-- ORDER BY attempts DESC;

-- Voir les comptes actuellement verrouillés
-- SELECT id, email, locked_until
-- FROM "user"
-- WHERE locked_until IS NOT NULL AND locked_until > NOW();

-- Voir les refresh tokens actifs par utilisateur
-- SELECT u.email, COUNT(rt.id) as active_tokens
-- FROM "user" u
-- LEFT JOIN refresh_token rt ON u.id = rt.user_id
-- WHERE rt.revoked_at IS NULL AND rt.expires_at > NOW()
-- GROUP BY u.email;

-- Nettoyer les refresh tokens expirés (à exécuter périodiquement)
-- DELETE FROM refresh_token
-- WHERE expires_at < NOW() OR revoked_at IS NOT NULL;

-- Nettoyer les anciennes tentatives de connexion (garder 30 jours)
-- DELETE FROM login_attempt
-- WHERE created_at < NOW() - INTERVAL '30 days';
