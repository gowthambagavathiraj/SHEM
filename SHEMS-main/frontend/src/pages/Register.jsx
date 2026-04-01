import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, Mail, Lock, Briefcase, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'HOMEOWNER',
        specialization: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authService.register(formData);
            console.log("Registered successfully");
            navigate('/login');
        } catch (err) {
            const msg = err.response?.data;
            if (typeof msg === 'object') {
                setError(Object.values(msg).join(", "));
            } else {
                setError(msg || "Registration failed. Please try again.");
            }
            console.error("Registration Error", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#007CC3] via-[#005bb7] to-[#004a93] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-white/20"
            >
                <div className="flex justify-center mb-6">
                    <div className="bg-white p-3 rounded-xl shadow-lg">
                        <h1 className="text-2xl font-bold text-[#007CC3]">Infosys</h1>
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-6 text-center">Create Account</h2>

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-white/80 text-sm">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-white/50 w-5 h-5" />
                                <input
                                    type="text"
                                    name="fullName"
                                    onChange={handleChange}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-300"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-white/80 text-sm">Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 text-white/50 w-5 h-5" />
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    onChange={handleChange}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-300"
                                    placeholder="+1 234..."
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-white/80 text-sm">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-white/50 w-5 h-5" />
                            <input
                                type="email"
                                name="email"
                                onChange={handleChange}
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
                                name="password"
                                onChange={handleChange}
                                className="w-full bg-white/10 border border-white/20 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-300"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-white/80 text-sm">I am a...</label>
                        <select
                            name="role"
                            onChange={handleChange}
                            className="w-full bg-white/10 border border-white/20 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-sky-300 [&>option]:text-black"
                        >
                            <option value="HOMEOWNER">Homeowner</option>
                            <option value="TECHNICIAN">Technician</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>

                    {formData.role === 'TECHNICIAN' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-2"
                        >
                            <label className="text-white/80 text-sm">Specialization</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-3 text-white/50 w-5 h-5" />
                                <input
                                    type="text"
                                    name="specialization"
                                    onChange={handleChange}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-300"
                                    placeholder="e.g. Solar, HVAC"
                                />
                            </div>
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-[#007CC3] font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 mt-4 shadow-lg disabled:opacity-50"
                    >
                        {loading ? 'Creating Account...' : <><span className="mr-1">Create Account</span> <ArrowRight className="w-5 h-5" /></>}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-white/60 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-white font-medium hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
