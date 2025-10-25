-- Création de PDV de test avec codes uniques
-- User: samuel@gmail.com 
-- Territory: afe7836f-51c9-4986-9f01-17d545ddaba0

-- PDV Test 4 - Restaurant Le Bon Goût
INSERT INTO outlet (
    code, name, channel, segment, address, status,
    territory_id, proposed_by,
    region, commune, ville, quartier, code_postal
)
SELECT 
    'PDV-TEST-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
    'Restaurant Le Bon Goût',
    'HORECA', 'A',
    'Boulevard des Restaurants, Local 12',
    'PENDING',
    'afe7836f-51c9-4986-9f01-17d545ddaba0',
    'ccc0646f-5bc2-4a9d-a31c-b8a6ad049412',
    t.region, t.commune, t.ville, t.quartier, t.code_postal
FROM territory t
WHERE t.id = 'afe7836f-51c9-4986-9f01-17d545ddaba0';

-- PDV Test 5 - Kiosque Moderne
INSERT INTO outlet (
    code, name, channel, segment, address, status,
    territory_id, proposed_by,
    region, commune, ville, quartier, code_postal
)
SELECT 
    'PDV-TEST-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
    'Kiosque Moderne',
    'PROXI', 'B',
    'Rue du Commerce, Angle gauche',
    'APPROVED',
    'afe7836f-51c9-4986-9f01-17d545ddaba0',
    'ccc0646f-5bc2-4a9d-a31c-b8a6ad049412',
    t.region, t.commune, t.ville, t.quartier, t.code_postal
FROM territory t
WHERE t.id = 'afe7836f-51c9-4986-9f01-17d545ddaba0';

-- PDV Test 6 - Magasin Grande Distribution
INSERT INTO outlet (
    code, name, channel, segment, address, status,
    territory_id, proposed_by,
    region, commune, ville, quartier, code_postal
)
SELECT 
    'PDV-TEST-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
    'Magasin Grande Distribution',
    'DISTRIB', 'A',
    'Zone Industrielle, Entrepôt 5',
    'PENDING',
    'afe7836f-51c9-4986-9f01-17d545ddaba0',
    'ccc0646f-5bc2-4a9d-a31c-b8a6ad049412',
    t.region, t.commune, t.ville, t.quartier, t.code_postal
FROM territory t
WHERE t.id = 'afe7836f-51c9-4986-9f01-17d545ddaba0';

-- Vérification des PDV créés
SELECT 
    code, name, channel, status,
    region, commune, ville, quartier, code_postal,
    created_at
FROM outlet
WHERE proposed_by = 'ccc0646f-5bc2-4a9d-a31c-b8a6ad049412'
ORDER BY created_at DESC
LIMIT 10;
