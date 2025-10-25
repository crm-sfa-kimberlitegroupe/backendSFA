-- Vérifier les PDV créés avec leurs informations géographiques
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
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as creation
FROM outlet
WHERE proposed_by = 'ccc0646f-5bc2-4a9d-a31c-b8a6ad049412'
ORDER BY created_at DESC
LIMIT 10;
