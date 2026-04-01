import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, KeyRound } from 'lucide-react';
import { authService } from '../services/api';

const Login = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await authService.login({ email, password });
            console.log("OTP requested successfully");
            setStep(2); // Move to OTP step
        } catch (err) {
            const msg = err.response?.data;
            if (typeof msg === 'object') {
                setError(Object.values(msg).join(", "));
            } else {
                setError(msg || "Wrong user or invalid credentials.");
            }
            console.error("Login Error", err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await authService.verifyOtp({ email, otp });
            const { token, role } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            console.log("Logged in successfully as", role);
            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data;
            if (typeof msg === 'object') {
                setError(Object.values(msg).join(", "));
            } else {
                setError(msg || "Invalid OTP. Please try again.");
            }
            console.error("OTP Error", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#007CC3] via-[#005bb7] to-[#004a93] p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20"
            >
                <div className="flex justify-center mb-6">
                    <div className="bg-white p-3 rounded-xl shadow-lg">
                        <h1 className="text-2xl font-bold text-[#007CC3]">Infosys</h1>
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-6 text-center">
                    {step === 1 ? 'Welcome Back' : 'Verify OTP'}
                </h2>

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm text-center"
                    >
                        {error}
                    </motion.div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-white/80 text-sm">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-white/50 w-5 h-5" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-300"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-white/80 text-sm">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-white/50 w-5 h-5" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-300"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Link to="/forgot-password" size="sm" className="text-white/60 text-xs hover:text-white transition-colors">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-white text-[#007CC3] font-bold py-3 rounded-lg flex items-center justify-center gap-2 group ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90 transition-all shadow-lg'}`}
                        >
                            {loading ? 'Processing...' : <><span className="mr-1">Sign In</span> <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-white/80 text-sm">Enter OTP Sent to your Email</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3 text-white/50 w-5 h-5" />
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-300 text-center tracking-widest text-lg"
                                    placeholder="1 2 3 4 5 6"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-white text-[#007CC3] font-bold py-3 rounded-lg ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90 transition-all shadow-lg'}`}
                        >
                            {loading ? 'Verifying...' : 'Verify & Login'}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <p className="text-white/60 text-sm">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-white font-medium hover:underline">
                            Create Account
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
