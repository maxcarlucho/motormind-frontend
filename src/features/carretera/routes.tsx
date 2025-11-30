import { RouteObject } from 'react-router-dom';
import { CarreteraHome } from './pages/CarreteraHome';
import { ClientLanding } from './pages/ClientLanding';
import { GruistaDashboard } from './pages/GruistaDashboard';
import { GruistaDetail } from './pages/GruistaDetail';
import { WorkshopReception } from './pages/WorkshopReception';
import { WorkshopDashboard } from './pages/WorkshopDashboard';
import { OperatorDashboard } from './pages/OperatorDashboard';
import { RequireAuth } from './components/RequireAuth';
import { RequireAccessToken } from './components/RequireAccessToken';

export const carreteraRoutes: RouteObject[] = [
    {
        path: '/carretera',
        element: <RequireAuth><CarreteraHome /></RequireAuth>, // Main hub requires auth
    },
    {
        path: '/operador',
        element: <RequireAuth><OperatorDashboard /></RequireAuth>, // Operator requires auth
    },
    {
        path: '/carretera/c/:id',
        // Client requires a valid SCOPED token (not full auth)
        // Token is validated for: correct caseId, not expired, type='client'
        element: (
            <RequireAccessToken tokenType="client">
                <ClientLanding />
            </RequireAccessToken>
        ),
    },
    {
        path: '/carretera/g/dashboard',
        element: <RequireAuth><GruistaDashboard /></RequireAuth>, // Gruista requires auth
    },
    {
        path: '/carretera/g/:id',
        element: <RequireAuth><GruistaDetail /></RequireAuth>, // Gruista detail requires auth
    },
    {
        path: '/carretera/t/dashboard',
        element: <RequireAuth><WorkshopDashboard /></RequireAuth>, // Workshop dashboard requires auth
    },
    {
        path: '/carretera/t/:id',
        // Workshop requires a valid SCOPED token (not full auth)
        // Token is validated for: correct caseId, not expired, type='workshop'
        // Multiple people at the workshop can use the same link (shareable)
        // Works in incognito mode - no Motormind login required
        element: (
            <RequireAccessToken tokenType="workshop">
                <WorkshopReception />
            </RequireAccessToken>
        ),
    },
];
