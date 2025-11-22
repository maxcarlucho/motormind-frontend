import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/Auth.context';

export function RequireAuth({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to login page but save the return location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}