import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children, user }) => {
    console.log('ProtectedRoute user:', user); // Log user object
    return user ? children : <Navigate to='/login' />;
};
