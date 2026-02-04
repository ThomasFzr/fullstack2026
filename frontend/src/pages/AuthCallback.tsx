import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Page de callback après OAuth (GitHub, etc.)
 * Reçoit les tokens en query params, les stocke et redirige vers l'accueil
 */
export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    const handleCallback = async () => {
      if (!accessToken || !refreshToken) {
        setError('Connexion échouée - tokens manquants');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      try {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        await refreshUser();
        navigate('/', { replace: true });
        // Nettoyer l'URL (enlève les tokens de l'historique)
        window.history.replaceState({}, document.title, '/');
      } catch (err) {
        setError('Erreur lors de la connexion');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, refreshUser]);

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p className="error-message">{error}</p>
        <p>Redirection vers la page de connexion...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Connexion en cours...</p>
    </div>
  );
};
