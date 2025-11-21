import { RouteObject } from 'react-router-dom';
import { ClientLanding } from './pages/ClientLanding';
import { GruistaDashboard } from './pages/GruistaDashboard';
import { GruistaDetail } from './pages/GruistaDetail';
import { WorkshopReception } from './pages/WorkshopReception';
import { OperatorDashboard } from './pages/OperatorDashboard';

export const carreteraRoutes: RouteObject[] = [
    {
        path: '/operador',
        element: <OperatorDashboard />,
    },
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
