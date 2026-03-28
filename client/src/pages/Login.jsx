import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, ShieldCheck, Microscope, ShieldAlert } from 'lucide-react';
import api from '../api/axios';

// Placeholder for Logos - In real app, import from assets
// import resultLogo from '../assets/pu_logo.png';
// import gaLogo from '../assets/ga_logo.png';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', credentials);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            // Force header refresh/state update if needed, or just nav
            window.location.href = '/dashboard';
        } catch (err) {
            setError(err.response?.data?.msg || 'Invalid Credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-900/80"></div>

                {/* Animated Orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

                {/* Left Side: Brand Identity */}
                <div className="p-12 flex flex-col justify-between text-white bg-white/5 relative">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            {/* Logos would go here */}
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 font-bold text-xl">
                                PU
                            </div>
                            <div className="w-px h-12 bg-white/20"></div>
                            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                GA
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold mb-2 tracking-tight">Bacteriophage <span className="text-emerald-400">LIMS</span></h1>
                        <p className="text-slate-400 text-lg">Next-Gen Biological Asset Management</p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Secure Access</h3>
                                <p className="text-slate-400 text-sm">Enterprise-grade role-based security.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                                <Microscope className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Research Focused</h3>
                                <p className="text-slate-400 text-sm">Tools designed for Phage Therapy & Genomics.</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-slate-500 pt-8 border-t border-white/10">
                        &copy; 2026 University of the Punjab & Global Access Labs.
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="p-12 flex flex-col justify-center bg-slate-900/50 backdrop-blur-md">
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                    <p className="text-slate-400 mb-8">Please sign in to access your dashboard.</p>

                    {error && (
                        <div className="bg-red-500/10 text-red-400 p-4 rounded-lg mb-6 text-sm flex items-center gap-2 border border-red-500/20">
                            <ShieldAlert className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">Username or Email</label>
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    name="username"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-white placeholder-slate-500"
                                    placeholder="Enter username or email"
                                    value={credentials.username}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-white placeholder-slate-500"
                                    placeholder="••••••••"
                                    value={credentials.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/50" />
                                <span className="text-slate-400">Remember me</span>
                            </label>
                            <a href="#" className="text-emerald-400 font-bold hover:underline">Forgot Password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-2 group"
                        >
                            {loading ? 'Authenticating...' : (
                                <>Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
