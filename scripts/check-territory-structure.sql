-- Vérifier la structure de la table territory
SELECT 
    column_name, 
    data_type,
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'territory' 
    AND column_name IN ('region', 'regions', 'commune', 'communes', 'ville', 'villes', 'quartier', 'quartiers', 'code_postal', 'codes_postaux')
ORDER BY column_name;
