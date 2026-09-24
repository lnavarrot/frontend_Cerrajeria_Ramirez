import PageMeta from '@/components/PageMeta';
import { Link } from 'react-router';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { authService } from '@/services/authService';

const Index = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setContraseña] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await authService.login(email, password);
      navigate(session.user.role === 'client' ? '/client-dashboard' : session.user.role === 'technician' ? '/technician-dashboard' : '/dashboard');
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
          'No fue posible iniciar sesión'
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <PageMeta title="Login" />
      <div className="relative min-h-screen w-full flex justify-center items-center py-16 md:py-10">
        <div className="card md:w-lg w-screen z-10">
          <div className="text-center px-10 py-12">
            <Link to="/index" className="flex justify-center">
              <div className="text-xl font-bold text-primary">CERRAJERÍA RAMÍREZ, S.A.</div>
            </Link>

            <div className="mt-8 text-center">
              <h4 className="mb-2.5 text-xl font-semibold text-primary">Bienvenido</h4>
              <p className="text-base text-default-500">Ingresa al Portal de Atención y Soporte Técnico.</p>
            </div>

            <form onSubmit={handleSubmit} className="text-left w-full mt-10">
              <div className="mb-4">
                <label htmlFor="email" className="block font-medium text-default-900 text-sm mb-2">
                  Correo electrónico
                </label>
                <input
                  type="text"
                  id="email"
                  className="form-input"
                  placeholder="Ingrese su correo"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                />
              </div>

              <div className="mb-4">
                <Link
                  to="/basic-reset-password"
                  className="text-primary font-medium text-sm mb-2 float-end"
                >
                  ¿Olvidó su contraseña?
                </Link>
                <label
                  htmlFor="Contraseña"
                  className="block font-medium text-default-900 text-sm mb-2"
                >
                  Contraseña
                </label>
                <input
                  type="password"
                  id="Contraseña"
                  className="form-input"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={event => setContraseña(event.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 mb-4">
                <input id="checkbox-1" type="checkbox" className="form-checkbox" />
                <label className="text-default-900 text-sm font-medium" htmlFor="checkbox-1">
                  Recordarme
                </label>
              </div>

              <div className="mt-10 text-center">
                {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn bg-primary text-white w-full disabled:opacity-60"
                >
                  {loading ? 'Ingresando...' : 'Iniciar sesión'}
                </button>
              </div>

              <div className="mt-10 text-center">
                <p className="text-base text-default-500">
                  ¿Eres cliente y aún no tienes cuenta?{' '}
                  <Link
                    to="/basic-register"
                    className="font-semibold underline hover:text-primary transition duration-200"
                  >
                    Crear cuenta de cliente
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        <div className="absolute inset-0 overflow-hidden">
          <svg
            aria-hidden="true"
            className="absolute inset-0 size-full fill-black/2 stroke-black/5 dark:fill-white/2.5 dark:stroke-white/2.5"
          >
            <defs>
              <pattern
                id="authPattern"
                width="56"
                height="56"
                patternUnits="userSpaceOnUse"
                x="50%"
                y="16"
              >
                <path d="M.5 56V.5H72" fill="none"></path>
              </pattern>
            </defs>
            <rect width="100%" height="100%" strokeWidth="0" fill="url(#authPattern)"></rect>
          </svg>
        </div>
      </div>
    </>
  );
};

export default Index;
