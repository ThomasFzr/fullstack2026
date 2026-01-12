-- Données de test pour MiniBnB

-- Utilisateurs de test
INSERT INTO users (email, password_hash, first_name, last_name, role, is_host) VALUES
('john.doe@example.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'John', 'Doe', 'user', false),
('jane.smith@example.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'Jane', 'Smith', 'host', true),
('bob.host@example.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'Bob', 'Host', 'host', true);

-- Note: Les mots de passe hashés ci-dessus sont des exemples. En production, utilisez bcrypt avec des mots de passe réels.
-- Pour tester, vous devrez créer des utilisateurs via l'API d'inscription.
