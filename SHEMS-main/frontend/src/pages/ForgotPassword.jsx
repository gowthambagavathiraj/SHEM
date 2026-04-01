import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, KeyRound, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/api';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password, 3: Success
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await authService.forgotPassword({ email });
            setStep(2);
        } catch (err) {
            console.error("Forgot password error:", err);
            const msg = typeof err.response?.data === 'string'
                ? err.response.data
                : err.response?.data?.message || "Failed to send reset link. Please try again.";
            setError(msg);
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
                    {step === 1 ? 'Forgot Password' : 'Check Your Email'}
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

                {step === 1 && (
                    <form onSubmit={handleSendOtp} className="space-y-6">
                        <p className="text-white/80 text-center text-sm">
                            Enter your email address and we'll send you a secure link to reset your password.
                        </p>
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
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-[#007CC3] font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 shadow-lg"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <div className="text-center space-y-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex justify-center"
                        >
                            <CheckCircle2 className="w-20 h-20 text-green-400" />
                        </motion.div>
                        <div className="space-y-4">
                            <p className="text-white font-semibold text-lg">Check your email</p>
                            <p className="text-white/70 text-sm">
                                We've sent a secure password reset link to:<br />
                                <span className="text-white font-medium">{email}</span>
                            </p>
                            <p className="text-white/50 text-xs mt-4">
                                The link will expire in 15 minutes. Please click the link in the email to set a new password.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-white text-[#007CC3] font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all shadow-lg"
                        >
                            Back to Login
                        </button>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-white/60 text-sm hover:text-white transition-colors">
                        Remembered your password? Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
