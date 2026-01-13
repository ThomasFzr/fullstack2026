import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import './Auth.css';

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

export const Login = () => {
  const { login, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string>('');
  
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
          </form>
        )}
      </div>
    </div>
  );
};
