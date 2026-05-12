INSERT INTO branches (id, name, is_active, created_at, updated_at)
VALUES ('branch-001', 'Cơ sở 1', 1, NOW(), NOW()) 
ON DUPLICATE KEY UPDATE id=id;