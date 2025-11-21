import { RouteObject } from 'react-router-dom';
import { CarreteraHome } from './pages/CarreteraHome';
import { ClientLanding } from './pages/ClientLanding';
import { GruistaDashboard } from './pages/GruistaDashboard';
import { GruistaDetail } from './pages/GruistaDetail';
import { WorkshopReception } from './pages/WorkshopReception';
import { WorkshopDashboard } from './pages/WorkshopDashboard';
import { OperatorDashboard } from './pages/OperatorDashboard';

export const carreteraRoutes: RouteObject[] = [
    {
        path: '/carretera',
        element: <CarreteraHome />,
    },
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
        path: '/carretera/t/dashboard',
        element: <WorkshopDashboard />,
    },
    {
        path: '/carretera/t/:id',
        element: <WorkshopReception />,
    },
];
