-- Ver qué políticas existen actualmente
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('users', 'categories', 'ads')
ORDER BY tablename, policyname;
