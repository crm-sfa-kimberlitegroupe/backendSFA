-- Vérification simple : Liste des PDV de Samuel
SELECT 
    code,
    name,
    channel,
    status,
    region,
    commune,
    ville,
    quartier
FROM outlet
WHERE proposed_by = 'ccc0646f-5bc2-4a9d-a31c-b8a6ad049412'
ORDER BY created_at DESC;
