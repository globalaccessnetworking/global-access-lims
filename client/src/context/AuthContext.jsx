import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    api.defaults.headers.common['x-auth-token'] = token;
                    // Optional: Validate token with backend if needed, for now decode or assume valid until 401
                    // Since we don't have a /me endpoint that returns full user details including permissions in this context, 
                    // we might rely on what we stored or just re-fetch profile.
                    // IMPORTANT: The backend 'login' returns user object. We should probably store it.
                    // But for safety, let's fetch current user details if token exists.
                    // We reused 'getUsers' for admin but regular user might need '/auth/me'.
                    // For now, let's assume we store user info in localStorage for simple persistence or just rely on 401s to logout.
                    // BETTER APPROACH: stored user info might be stale.
                    // Let's implement a quick check or just use the token.
                    // Since we don't have /me implemented in the plan, I will simulate it by 
                    // reading from localStorage if I saved it there, OR just use the token state.
                    // Valid enterprise app should verify token.
                    // I'll stick to simple token check.

                    const storedUser = localStorage.getItem('user');
                    if (storedUser) setUser(JSON.parse(storedUser));

                } catch (error) {
                    console.error("Auth Load Error", error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = async (username, password) => {
        try {
            const res = await api.post('/auth/login', { username, password });
            const { token, user } = res.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            api.defaults.headers.common['x-auth-token'] = token;
            setUser(user);
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['x-auth-token'];
        setUser(null);
        window.location.href = '/login';
    };

    const hasPermission = (module, access = 'read') => {
        if (!user) return false;
        if (user.role === 'Admin') return true;

        const perms = user.permissions || {};
        if (!perms[module]) return false; // No entry = No access

        if (access === 'read') return ['read', 'write'].includes(perms[module]);
        if (access === 'write') return perms[module] === 'write';

        return false;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, hasPermission, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
