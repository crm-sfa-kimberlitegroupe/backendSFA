-- Script de test : Création de PDV pour vérifier l'héritage géographique
-- User: samuel@gmail.com (ccc0646f-5bc2-4a9d-a31c-b8a6ad049412)
-- Territory: afe7836f-51c9-4986-9f01-17d545ddaba0

-- 1. Vérifier les infos du territoire
SELECT 
    id,
    code,
    name,
    region,
    commune,
    ville,
    quartier,
    code_postal
FROM territory
WHERE id = 'afe7836f-51c9-4986-9f01-17d545ddaba0';

-- 2. Vérifier l'utilisateur
SELECT 
    id,
    email,
    first_name,
    last_name,
    territory_id,
    assigned_sector_id
FROM "user"
WHERE id = 'ccc0646f-5bc2-4a9d-a31c-b8a6ad049412';

-- 3. Insérer des PDV de test (les champs géographiques seront remplis par le backend)
-- NOTE: Ces INSERT sont pour référence. Utilise plutôt l'API pour que le backend remplisse automatiquement les champs.

-- PDV Test 1 - Boutique Centre-Ville
INSERT INTO outlet (
    code,
    name,
    channel,
    segment,
    address,
    lat,
    lng,
    status,
    territory_id,
    proposed_by,
    region,
    commune,
    ville,
    quartier,
    code_postal
)
SELECT 
    'PDV-TEST-001',
    'Boutique Centre-Ville',
    'GT',
    'A',
    'Avenue principale, Centre-Ville',
    NULL,
    NULL,
    'PENDING',
    'afe7836f-51c9-4986-9f01-17d545ddaba0',
    'ccc0646f-5bc2-4a9d-a31c-b8a6ad049412',
    t.region,
    t.commune,
    t.ville,
    t.quartier,
    t.code_postal
FROM territory t
WHERE t.id = 'afe7836f-51c9-4986-9f01-17d545ddaba0';

-- PDV Test 2 - Supermarché Nord
INSERT INTO outlet (
    code,
    name,
    channel,
    segment,
    address,
    lat,
    lng,
    status,
    territory_id,
    proposed_by,
    region,
    commune,
    ville,
    quartier,
    code_postal
)
SELECT 
    'PDV-TEST-002',
    'Supermarché Nord',
    'MT',
    'B',
    'Quartier Nord, Route 123',
    NULL,
    NULL,
    'PENDING',
    'afe7836f-51c9-4986-9f01-17d545ddaba0',
    'ccc0646f-5bc2-4a9d-a31c-b8a6ad049412',
    t.region,
    t.commune,
    t.ville,
    t.quartier,
    t.code_postal
FROM territory t
WHERE t.id = 'afe7836f-51c9-4986-9f01-17d545ddaba0';

-- PDV Test 3 - Épicerie du Marché
INSERT INTO outlet (
    code,
    name,
    channel,
    segment,
    address,
    lat,
    lng,
    status,
    territory_id,
    proposed_by,
    region,
    commune,
    ville,
    quartier,
    code_postal
)
SELECT 
    'PDV-TEST-003',
    'Épicerie du Marché',
    'PROXI',
    'C',
    'Marché Central, Stand 45',
    NULL,
    NULL,
    'APPROVED',
    'afe7836f-51c9-4986-9f01-17d545ddaba0',
    'ccc0646f-5bc2-4a9d-a31c-b8a6ad049412',
    t.region,
    t.commune,
    t.ville,
    t.quartier,
    t.code_postal
FROM territory t
WHERE t.id = 'afe7836f-51c9-4986-9f01-17d545ddaba0';

-- 4. Vérifier les PDV créés avec leurs infos géographiques
SELECT 
    code,
    name,
    channel,
    status,
    region,
    commune,
    ville,
    quartier,
    code_postal,
    created_at
FROM outlet
WHERE proposed_by = 'ccc0646f-5bc2-4a9d-a31c-b8a6ad049412'
ORDER BY created_at DESC;
