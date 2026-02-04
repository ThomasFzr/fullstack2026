import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import './Auth.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

const GITHUB_ERROR_MESSAGES: Record<string, string> = {
  github_denied: 'Connexion GitHub annulée',
  github_no_code: 'Erreur lors de la connexion GitHub',
  github_not_configured: 'OAuth GitHub non configuré',
  github_token_failed: 'Échec de l\'authentification GitHub',
  github_profile_failed: 'Impossible de récupérer le profil GitHub',
  github_error: 'Erreur lors de la connexion avec GitHub',
};

export const Login = () => {
  const { login, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam && GITHUB_ERROR_MESSAGES[errorParam]) {
      setError(GITHUB_ERROR_MESSAGES[errorParam]);
      window.history.replaceState({}, document.title, '/login');
    }
  }, [searchParams]);
  
  const { 
    register: registerLogin, 
    handleSubmit: handleLoginSubmit, 
    formState: { errors: loginErrors },
    reset: resetLogin
  } = useForm<LoginFormData>();

  const { 
    register: registerRegister, 
    handleSubmit: handleRegisterSubmit, 
    formState: { errors: registerErrors },
    reset: resetRegister
  } = useForm<RegisterFormData>();

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      await login(data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erreur de connexion');
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    try {
      setError('');
      await registerUser(data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erreur lors de l\'inscription');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    resetLogin();
    resetRegister();
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => !isLogin && toggleMode()}
          >
            Connexion
          </button>
          <button 
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => isLogin && toggleMode()}
          >
            Inscription
          </button>
        </div>
        
        <h2>{isLogin ? 'Connexion' : 'Inscription'}</h2>
        {error && <div className="error-message">{error}</div>}
        
        {isLogin ? (
          <form onSubmit={handleLoginSubmit(onLoginSubmit)}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                {...registerLogin('email', { required: 'Email requis' })}
              />
              {loginErrors.email && <span className="error">{loginErrors.email.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                type="password"
                id="password"
                {...registerLogin('password', { required: 'Mot de passe requis' })}
              />
              {loginErrors.password && <span className="error">{loginErrors.password.message}</span>}
            </div>
            <button type="submit" className="btn btn-primary">
              Se connecter
            </button>
            <div className="auth-divider">
              <span>ou</span>
            </div>
            <a
              href={`${API_URL.replace('/api/v1', '')}/api/v1/auth/github`}
              className="btn btn-github"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              Se connecter avec GitHub
            </a>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit(onRegisterSubmit)}>
            <div className="form-group">
              <label htmlFor="first_name">Prénom</label>
              <input
                type="text"
                id="first_name"
                {...registerRegister('first_name', { required: 'Prénom requis' })}
              />
              {registerErrors.first_name && <span className="error">{registerErrors.first_name.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="last_name">Nom</label>
              <input
                type="text"
                id="last_name"
                {...registerRegister('last_name', { required: 'Nom requis' })}
              />
              {registerErrors.last_name && <span className="error">{registerErrors.last_name.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="register_email">Email</label>
              <input
                type="email"
                id="register_email"
                {...registerRegister('email', { required: 'Email requis' })}
              />
              {registerErrors.email && <span className="error">{registerErrors.email.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="register_password">Mot de passe</label>
              <input
                type="password"
                id="register_password"
                {...registerRegister('password', {
                  required: 'Mot de passe requis',
                  minLength: { value: 8, message: 'Minimum 8 caractères' },
                })}
              />
              {registerErrors.password && <span className="error">{registerErrors.password.message}</span>}
            </div>
            <button type="submit" className="btn btn-primary">
              S'inscrire
            </button>
            <div className="auth-divider">
              <span>ou</span>
            </div>
            <a
              href={`${API_URL.replace('/api/v1', '')}/api/v1/auth/github`}
              className="btn btn-github"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              S'inscrire avec GitHub
            </a>
          </form>
        )}
      </div>
    </div>
  );
};
