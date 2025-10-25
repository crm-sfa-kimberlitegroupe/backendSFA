-- ==========================================
-- RAPPORT DÉTAILLÉ - PDV DE TEST
-- ==========================================

-- 1. Information du territoire source
SELECT 
    '=== TERRITOIRE SOURCE ===' as section,
    code,
    name,
    region,
    commune,
    ville,
    quartier,
    code_postal
FROM territory
WHERE id = 'afe7836f-51c9-4986-9f01-17d545ddaba0';

-- 2. Information de l'utilisateur
SELECT 
    '=== UTILISATEUR ===' as section,
    email,
    first_name || ' ' || last_name as nom_complet,
    role
FROM "user"
WHERE id = 'ccc0646f-5bc2-4a9d-a31c-b8a6ad049412';

-- 3. Liste des PDV créés avec TOUTES les informations
SELECT 
    '=== PDV CRÉÉS (avec infos géographiques héritées) ===' as section,
    code,
    name,
    channel,
    segment,
    status,
    '---' as separator1,
    region as "REGION (hérité)",
    commune as "COMMUNE (hérité)",
    ville as "VILLE (hérité)",
    quartier as "QUARTIER (hérité)",
    code_postal as "CODE_POSTAL (hérité)",
    '---' as separator2,
    TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as date_creation
FROM outlet
WHERE proposed_by = 'ccc0646f-5bc2-4a9d-a31c-b8a6ad049412'
ORDER BY created_at DESC;

-- 4. Statistiques
SELECT 
    '=== STATISTIQUES ===' as section,
    COUNT(*) as total_pdv,
    COUNT(CASE WHEN region IS NOT NULL THEN 1 END) as pdv_avec_region,
    COUNT(CASE WHEN commune IS NOT NULL THEN 1 END) as pdv_avec_commune,
    COUNT(CASE WHEN quartier IS NOT NULL THEN 1 END) as pdv_avec_quartier,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pdv_en_attente,
    COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as pdv_approuves
FROM outlet
WHERE proposed_by = 'ccc0646f-5bc2-4a9d-a31c-b8a6ad049412';
