import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '../services/api';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token.");
        }
    }, [token]);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        setLoading(true);
        setError('');
        try {
            await authService.resetPassword({ token, newPassword });
            setSuccess(true);
        } catch (err) {
            console.error("Reset password error:", err);
            const msg = typeof err.response?.data === 'string'
                ? err.response.data
                : err.response?.data?.message || "Failed to reset password. The link may have expired.";
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
                    {success ? 'Success!' : 'Create New Password'}
                </h2>

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm text-center flex items-center justify-center gap-2"
                    >
                        <AlertCircle className="w-4 h-4" /> {error}
                    </motion.div>
                )}

                {!success && token && (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <p className="text-white/80 text-center text-sm">
                            Please enter your new password below.
                        </p>

                        <div className="space-y-2">
                            <label className="text-white/80 text-sm">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-white/50 w-5 h-5" />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-300"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-white/80 text-sm">Confirm New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-white/50 w-5 h-5" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-300"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-[#007CC3] font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 shadow-lg"
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                )}

                {success && (
                    <div className="text-center space-y-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex justify-center"
                        >
                            <CheckCircle2 className="w-20 h-20 text-green-400" />
                        </motion.div>
                        <p className="text-white">Your password has been updated successfully!</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-white text-[#007CC3] font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all font-bold shadow-lg"
                        >
                            Log In Now
                        </button>
                    </div>
                )}

                {!token && !success && (
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-white/10 text-white font-semibold py-3 rounded-lg hover:bg-white/20 transition-all"
                    >
                        Back to Login
                    </button>
                )}
            </motion.div>
        </div>
    );
};

export default ResetPassword;
