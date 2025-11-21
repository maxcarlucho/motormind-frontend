import { CircleCheckBig } from 'lucide-react';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { apiUrl } from '@/constants/env';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { useAuth } from '@/context/Auth.context';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [timer, setTimer] = useState(30);
  const { enqueueSnackbar } = useSnackbar();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!linkSent) return;

    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, linkSent]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSendingMagicLink(true);

    try {
      console.log('Attempting login with API URL:', apiUrl);
      const res = await axios.post(`${apiUrl}/auth/magic-link`, { email });

      if (res) {
        setLinkSent(true);
      }
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Ocurrió un error al enviar el link. Por favor, intenta nuevamente.', {
        variant: 'error',
      });
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="container mx-auto max-w-md px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex w-60 justify-center px-3 text-center">
            <img src="/logo_motormind.png" alt="Motormind" />
          </div>
          <h1 className="mb-2 text-xl font-bold md:text-2xl">
            {linkSent ? 'Enlace enviado' : 'Accede a tu cuenta'}
          </h1>
          <p className="text-muted text-sm md:text-base">
            {linkSent
              ? 'Revisa tu correo electrónico para continuar'
              : 'Te enviaremos un enlace a tu correo para iniciar sesión'}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          {linkSent ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg bg-green-50 p-4">
                <div className="mr-2">
                  <CircleCheckBig size={16} className="text-green-700" />
                </div>
                <p className="text-xs font-medium text-green-700 md:text-sm">
                  Hemos enviado un enlace a tu correo electrónico para que puedas acceder a tu
                  cuenta. Por favor, revisa tu bandeja de entrada y sigue las instrucciones para
                  acceder a tu cuenta.
                </p>
              </div>

              <p className="text-muted text-center text-xs md:text-sm">
                ¿No encuentras nuestro email?
              </p>

              <Button
                variant="default"
                size="lg"
                className="w-full"
                onClick={() => {
                  handleSubmit();
                  setTimer(30);
                }}
                disabled={timer > 0}
              >
                {timer > 0 ? `Reenviar email (${timer}s)` : 'Reenviar email'}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="mb-1 block text-xs font-medium text-gray-700 md:text-sm">
                  Correo electrónico
                </p>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                />
              </div>

              <Button className="w-full" type="submit" disabled={isSendingMagicLink}>
                {isSendingMagicLink ? 'Enviando...' : 'Enviar enlace'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
