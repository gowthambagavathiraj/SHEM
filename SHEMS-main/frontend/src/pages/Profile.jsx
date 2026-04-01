
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, MapPin, Save } from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        address: '',
        preferences: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Saving Profile", profile);
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-20 p-4">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Complete Your Profile</h2>
                <p className="text-slate-500 mb-6">Tell us a bit more about your home to get personalized insights.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="font-medium text-slate-700">Home Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                            <textarea
                                className="w-full border border-slate-300 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                rows="3"
                                placeholder="123 Energy St, Solar City..."
                                value={profile.address}
                                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="font-medium text-slate-700">Energy Preferences</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                            <textarea
                                className="w-full border border-slate-300 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                rows="3"
                                placeholder="I prefer to use appliances after 9 PM..."
                                value={profile.preferences}
                                onChange={(e) => setProfile({ ...profile, preferences: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" /> Save & Continue to Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
