import { Navigate, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';

import { useAuth } from '@/context/Auth.context';
import { Sidebar } from '@/components/organisms/Sidebar';

const Layout = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Rutas que no deben mostrar la sidebar (páginas de detalle)
  const detailRoutes = [
    '/cars/', // Detalles de vehículos
    '/appointments/', // Detalles de citas
    '/damage-assessments/', // Detalles de peritajes
    '/cars/',
    '/appointments/',
  ];

  const shouldHideSidebar = detailRoutes.some(
    (route) => location.pathname.includes(route) && location.pathname.split('/').length > 2, // Tiene más de 2 segmentos (es una página de detalle)
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex h-screen">
      {!shouldHideSidebar && <Sidebar />}
      <main className={`relative overflow-auto ${shouldHideSidebar ? 'flex-1' : 'flex-1'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
