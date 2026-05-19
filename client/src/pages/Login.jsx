import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, ShieldCheck, Microscope, ShieldAlert, X, KeyRound, CheckCircle2, ChevronRight } from 'lucide-react';
import api from '../api/axios';

const SECURITY_QUESTIONS = [
    'What was the name of your first laboratory or department?',
    'What are the last 4 digits of your official employee/student ID?',
    'In what city did you attend your primary university?',
    'What is the last name of your first scientific supervisor or mentor?'
];

// ─── Forgot Password Modal ────────────────────────────────────────────────────
const ForgotPasswordModal = ({ onClose }) => {
    const [step, setStep]             = useState(1);  // 1 = username, 2 = questions+new pw
    const [username, setUsername]     = useState('');
    const [questions, setQuestions]   = useState({ q1: '', q2: '' });
    const [answers, setAnswers]       = useState({ a1: '', a2: '' });
    const [newPassword, setNewPassword] = useState('');
    const [confirmPw, setConfirmPw]   = useState('');
    const [error, setError]           = useState('');
    const [success, setSuccess]       = useState('');
    const [loading, setLoading]       = useState(false);

    const handleStep1 = async (e) => {
        e.preventDefault();
        setError('');
        if (!username.trim()) { setError('Please enter your username.'); return; }
        setLoading(true);
        try {
            const res = await api.post('/auth/forgot-password-step1', { username: username.trim() });
            setQuestions({ q1: res.data.question1, q2: res.data.question2 });
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not find that account.');
        } finally { setLoading(false); }
    };

    const handleStep2 = async (e) => {
        e.preventDefault();
        setError('');
        if (!answers.a1.trim() || !answers.a2.trim()) { setError('Please answer both security questions.'); return; }
        if (!newPassword) { setError('Please enter a new password.'); return; }
        if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (newPassword !== confirmPw) { setError('Passwords do not match.'); return; }
        setLoading(true);
        try {
            const res = await api.post('/auth/forgot-password-step2', {
                username,
                answer1: answers.a1,
                answer2: answers.a2,
                newPassword
            });
            setSuccess(res.data.message || 'Password reset successful! You may now log in.');
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Please check your answers.');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}/>

            {/* Modal */}
            <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-xl">
                            <KeyRound className="w-5 h-5 text-emerald-400"/>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">Account Recovery</h3>
                            <p className="text-slate-500 text-xs">
                                {step === 1 ? 'Step 1 of 2 — Identify Account' : 'Step 2 of 2 — Verify & Reset'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                <div className="p-6">
                    {/* Step Indicator */}
                    <div className="flex items-center gap-2 mb-6">
                        <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-emerald-500' : 'bg-slate-700'}`}/>
                        <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-700'}`}/>
                    </div>

                    {/* SUCCESS STATE */}
                    {success ? (
                        <div className="text-center space-y-4 py-4">
                            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto"/>
                            <p className="text-white font-bold text-lg">{success}</p>
                            <button onClick={onClose}
                                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-500 transition-all">
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* ERROR BANNER */}
                            {error && (
                                <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">
                                    <ShieldAlert className="w-4 h-4 flex-shrink-0"/> {error}
                                </div>
                            )}

                            {/* STEP 1: Username */}
                            {step === 1 && (
                                <form onSubmit={handleStep1} className="space-y-4">
                                    <div>
                                        <p className="text-slate-400 text-sm mb-4">
                                            Enter your username to retrieve your security questions.
                                        </p>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Username</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-500"/>
                                            <input
                                                type="text" autoFocus
                                                value={username}
                                                onChange={e => setUsername(e.target.value)}
                                                placeholder="Your LIMS username"
                                                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white text-sm placeholder-slate-500"
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading}
                                        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                        {loading ? 'Searching...' : <><span>Find My Account</span><ChevronRight className="w-4 h-4"/></>}
                                    </button>
                                </form>
                            )}

                            {/* STEP 2: Security Questions + New Password */}
                            {step === 2 && (
                                <form onSubmit={handleStep2} className="space-y-4">
                                    <p className="text-slate-400 text-sm">
                                        Answer your two security questions, then set a new password.
                                    </p>

                                    {[
                                        { q: questions.q1, key: 'a1', label: 'Answer 1' },
                                        { q: questions.q2, key: 'a2', label: 'Answer 2' }
                                    ].map(({ q, key, label }) => (
                                        <div key={key}>
                                            <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">{label}</label>
                                            <p className="text-slate-300 text-sm mb-2 italic">"{q}"</p>
                                            <input
                                                type="text"
                                                value={answers[key]}
                                                onChange={e => setAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                                                placeholder="Your answer (not case sensitive)"
                                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white text-sm placeholder-slate-500"
                                            />
                                        </div>
                                    ))}

                                    <div className="pt-2 border-t border-white/5 space-y-3">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-500"/>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                                placeholder="Min. 6 characters"
                                                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white text-sm placeholder-slate-500"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-500"/>
                                            <input
                                                type="password"
                                                value={confirmPw}
                                                onChange={e => setConfirmPw(e.target.value)}
                                                placeholder="Confirm new password"
                                                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white text-sm placeholder-slate-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-1">
                                        <button type="button" onClick={() => { setStep(1); setError(''); }}
                                            className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold border border-white/5 hover:bg-slate-700 transition-all text-sm">
                                            ← Back
                                        </button>
                                        <button type="submit" disabled={loading}
                                            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all text-sm disabled:opacity-50">
                                            {loading ? 'Resetting...' : 'Reset Password'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Login Page ───────────────────────────────────────────────────────────────
const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
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
            window.location.href = '/dashboard';
        } catch (err) {
            setError(err.response?.data?.msg || 'Invalid Credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden">
            {/* Forgot Password Modal */}
            {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)}/>}

            {/* Background Ambience */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-900/80"></div>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

                {/* Left Side: Brand Identity */}
                <div className="p-12 flex flex-col justify-between text-white bg-white/5 relative">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 font-bold text-xl">PU</div>
                            <div className="w-px h-12 bg-white/20"></div>
                            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xl">GA</div>
                        </div>
                        <h1 className="text-4xl font-bold mb-2 tracking-tight">Bacteriophage <span className="text-emerald-400">LIMS</span></h1>
                        <p className="text-slate-400 text-lg">Next-Gen Biological Asset Management</p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400"><ShieldCheck className="w-6 h-6"/></div>
                            <div>
                                <h3 className="font-bold text-lg">Secure Access</h3>
                                <p className="text-slate-400 text-sm">Enterprise-grade role-based security.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400"><Microscope className="w-6 h-6"/></div>
                            <div>
                                <h3 className="font-bold text-lg">Research Focused</h3>
                                <p className="text-slate-400 text-sm">Tools designed for Phage Therapy & Genomics.</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-sm font-bold text-slate-400 pt-8 border-t border-white/10">
                        © 2026 University of the Punjab. Developed by Global Access.
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="p-12 flex flex-col justify-center bg-slate-900/50 backdrop-blur-md">
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                    <p className="text-slate-400 mb-8">Please sign in to access your dashboard.</p>

                    {error && (
                        <div className="bg-red-500/10 text-red-400 p-4 rounded-lg mb-6 text-sm flex items-center gap-2 border border-red-500/20">
                            <ShieldAlert className="w-4 h-4"/> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">Username or Email</label>
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500"/>
                                <input
                                    type="text" name="username" required
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
                                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500"/>
                                <input
                                    type="password" name="password" required
                                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-white placeholder-slate-500"
                                    placeholder="••••••••"
                                    value={credentials.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/50"/>
                                <span className="text-slate-400">Remember me</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowForgot(true)}
                                className="text-emerald-400 font-bold hover:underline hover:text-emerald-300 transition-colors"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-2 group"
                        >
                            {loading ? 'Authenticating...' : (
                                <>Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/></>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
