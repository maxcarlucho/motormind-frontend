import { RouteObject } from 'react-router-dom';
import { ClientLanding } from './pages/ClientLanding';
import { GruistaDashboard } from './pages/GruistaDashboard';
import { GruistaDetail } from './pages/GruistaDetail';
import { WorkshopReception } from './pages/WorkshopReception';

export const carreteraRoutes: RouteObject[] = [
    {
        path: '/carretera/c/:id',
        element: <ClientLanding />,
    },
    {
        path: '/carretera/g/dashboard',
        element: <GruistaDashboard />,
    },
    {
        path: '/carretera/g/:id',
        element: <GruistaDetail />,
    },
    {
        path: '/carretera/t/:id',
        element: <WorkshopReception />,
    },
];
