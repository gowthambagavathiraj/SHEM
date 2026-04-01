import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Zap, Home, DollarSign, LogOut, Users, Settings, Wrench,
    ClipboardList, User, Bell, ChevronRight, ChevronLeft, Activity, Shield,
    Database, AlertTriangle, CheckCircle, Clock, Star, Cpu,
    Plus, Trash2, Wind, Lightbulb, Thermometer, Car,
    WashingMachine, RefrigeratorIcon, ToggleLeft, ToggleRight, X,
    Copy, CheckCheck, Radio, Download, Calendar, BarChart3
} from 'lucide-react';
import { 
    LineChart, Line, AreaChart, Area, XAxis, YAxis, 
    CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { userService, deviceService, energyService, scheduleService, adminService, recommendationService } from '../services/api';

// ─── REALISTIC POWER SIMULATION ENGINE ────────────────────────────────────────
// Each device type has its own wattage behaviour pattern.
// This mimics what a real IoT current sensor would send via telemetry.
const simulatePower = (device, tick) => {
    const r = device.powerRating || 100;
    const noise = () => (Math.random() - 0.5) * r * 0.04; // ±2% random noise
    switch (device.type) {
        case 'REFRIGERATOR': {
            // Compressor cycles: ON ~40% of time, OFF rest. Full cycle ~8 ticks
            const phase = Math.floor(tick / 8) % 3; // 0=startup, 1=running, 2=off
            if (phase === 2) return Math.max(0, r * 0.05 + noise()); // standby
            if (phase === 0) return Math.min(r, r * 1.2 + noise()); // startup spike
            return r * 0.65 + noise(); // normal running
        }
        case 'FAN':
            // Oscillates between 70–90% (wind speed variation)
            return r * (0.7 + 0.2 * Math.abs(Math.sin(tick * 0.3))) + noise();
        case 'AC': {
            // Compressor on/off cycle every ~10 ticks
            const cycle = Math.sin(tick * 0.1);
            return r * (cycle > 0 ? 0.9 : 0.15) + noise();
        }
        case 'LIGHT':
            // Very stable, tiny flicker
            return r * 0.98 + noise() * 0.2;
        case 'WATER_HEATER':
            // Heating element: full power then cuts off when hot
            return (tick % 12 < 8) ? r * 0.98 + noise() : r * 0.05;
        case 'WASHING_MACHINE': {
            // Drum motor varies: wash, rinse, spin phases each 5 ticks
            const phase2 = Math.floor(tick / 5) % 3;
            return [r * 0.4, r * 0.3, r * 0.95][phase2] + noise();
        }
        case 'EV_CHARGER':
            // Gradually reduces as battery fills (simulate 80% state)
            return Math.max(r * 0.2, r * 0.85 - tick * 0.5) + noise();
        default:
            return r * 0.75 + noise();
    }
};

// ─── ICONS PER DEVICE TYPE ─────────────────────────────────────────────────────
const DeviceIcon = ({ type, className }) => {
    const icons = {
        FAN: Wind, AC: Thermometer, LIGHT: Lightbulb,
        WATER_HEATER: Thermometer, EV_CHARGER: Car,
        WASHING_MACHINE: WashingMachine, REFRIGERATOR: RefrigeratorIcon, OTHER: Cpu
    };
    const Icon = icons[type] || Cpu;
    return <Icon className={className} />;
};

// ─── PREMIUM DARK THEME DEVICE CARD ───────────────────────────────────────────
const DeviceCard = ({ device, onToggle, onPowerChange, onDelete, onEdit, expanded, onExpand }) => {
    const isOn = device.status === 'ON';
    const percent = device.powerRating > 0 ? Math.round((device.currentPower / device.powerRating) * 100) : 0;

    return (
        <div className={`overflow-hidden transition-all duration-500 ease-in-out rounded-2xl cursor-pointer ${isOn ? 'bg-[#1a2e22]/40 border border-[#21d366]/30 shadow-[0_0_15px_rgba(33,211,102,0.1)]' : 'bg-[#181a19] hover:bg-[#1d201e]'}`} onClick={() => onExpand(expanded ? null : device.id)}>
            {/* Header (Always Visible) */}
            <div className="flex items-center justify-between p-4 relative">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors duration-300 ${isOn ? 'bg-[#21d366]/20' : 'bg-[#252a27]'}`}>
                        <DeviceIcon type={device.type} className={`w-6 h-6 ${isOn ? 'text-[#21d366] drop-shadow-[0_0_8px_rgba(33,211,102,0.8)]' : 'text-slate-400'}`} />
                    </div>
                    <div>
                        <p className="font-semibold text-white text-base tracking-wide">{device.name}</p>
                        <p className="text-xs text-slate-400 capitalize mt-0.5">{device.type.replace('_', ' ')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${isOn ? 'text-[#21d366]' : 'text-slate-500'}`}>{isOn ? `${(device.currentPower || 0).toFixed(1)}W` : 'Off'}</span>
                    <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`} />
                </div>
            </div>

            {/* Expanded Controls Area */}
            <div className={`transition-all duration-500 ease-in-out ${expanded ? 'max-h-64 opacity-100 p-4 border-t border-slate-800' : 'max-h-0 opacity-0 px-4 py-0 overflow-hidden'}`} onClick={e => e.stopPropagation()}>
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-300">Power State</span>
                        <div onClick={() => onToggle(device.id)} className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${isOn ? 'bg-[#21d366]' : 'bg-slate-700'}`}>
                            <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${isOn ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    {isOn && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Simulate Load</span>
                                <span>Max: {device.powerRating}W</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={device.powerRating || 100}
                                step={0.5}
                                value={device.currentPower}
                                onChange={e => onPowerChange(device.id, parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#21d366]"
                            />
                            {/* Visual Power Bar */}
                            <div className="w-full bg-slate-800 rounded-full h-1 mt-3 overflow-hidden">
                                <div className="h-full bg-[#21d366] transition-all duration-300 ease-out shadow-[0_0_10px_#21d366]" style={{ width: `${Math.min(percent, 100)}%` }} />
                            </div>
                        </div>
                    )}

                    <div className="pt-2 flex justify-between gap-3">
                        <button onClick={() => onEdit(device)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors bg-blue-400/10 px-3 py-2 rounded-lg font-medium">
                            <Settings className="w-4 h-4" /> Edit Details
                        </button>
                        <button onClick={() => onDelete(device.id)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors bg-red-400/10 px-3 py-2 rounded-lg font-medium">
                            <Trash2 className="w-4 h-4" /> Remove Device
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── PREMIUM ADD DEVICE MODAL ──────────────────────────────────────────────────
const AddDeviceModal = ({ onSave, onClose, editDevice = null }) => {
    const [form, setForm] = useState({ 
        name: editDevice ? editDevice.name : '', 
        type: editDevice ? editDevice.type : 'FAN', 
        powerRating: editDevice ? editDevice.powerRating : '' 
    });
    const [loading, setLoading] = useState(false);

    const DEVICE_TYPES = [
        { value: 'FAN', label: 'Fan' }, { value: 'AC', label: 'Air Conditioner' },
        { value: 'LIGHT', label: 'Smart Bulb' }, { value: 'WATER_HEATER', label: 'Water Heater' },
        { value: 'EV_CHARGER', label: 'EV Charger' }, { value: 'WASHING_MACHINE', label: 'Washing Machine' },
        { value: 'REFRIGERATOR', label: 'Refrigerator' }, { value: 'OTHER', label: 'Smart Plug / Other' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = { ...form, powerRating: parseFloat(form.powerRating) || 0 };
            let res;
            if (editDevice) {
                res = await deviceService.updateDevice(editDevice.id, data);
            } else {
                res = await deviceService.addDevice(data);
            }
            onSave(res.data);
            onClose();
        } catch {
            alert(`Failed to ${editDevice ? 'update' : 'add'} device`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#181a19] w-full rounded-t-3xl sm:rounded-3xl max-w-sm p-6 border border-slate-800 shadow-2xl transform transition-all animate-in slide-in-from-bottom-10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white tracking-wide">{editDevice ? 'Edit Device' : 'Add Device'}</h3>
                    <button onClick={onClose} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition"><X className="w-4 h-4 text-slate-300" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Device Name</label>
                        <input type="text" required placeholder="e.g., Living Room Lights" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                            className="w-full bg-[#0c0e0d] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#21d366] transition-colors" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Device Type</label>
                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                            className="w-full bg-[#0c0e0d] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#21d366] appearance-none" style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`}}>
                            {DEVICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Max Power (Watts)</label>
                        <input type="number" required placeholder="e.g., 60" value={form.powerRating} onChange={e => setForm({ ...form, powerRating: e.target.value })}
                            className="w-full bg-[#0c0e0d] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#21d366] transition-colors" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-[#21d366] text-[#0c0e0d] font-bold text-lg py-3.5 rounded-xl hover:bg-[#1ebd5b] transition-colors disabled:opacity-50 mt-4">
                        {loading ? 'Saving...' : 'Save Device'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// ─── BOTTOM NAV ITEM ──────────────────────────────────────────────────────────
const NavItem = ({ icon: Icon, label, active, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-1 w-16 group">
        <Icon className={`w-5 h-5 transition-colors ${active ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]' : 'text-slate-500 group-hover:text-slate-300'}`} />
        <span className={`text-[10px] font-medium transition-colors ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{label}</span>
    </button>
);

// ─── PREMIUM DEVICES TAB (MOBILE SIMULATOR WRAPPER) ──────────────────────────
const DevicesTab = ({ setCurrentPage, setOverloadAlert }) => {
    const [devices, setDevices] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingDevice, setEditingDevice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedCard, setExpandedCard] = useState(null);
    const [autoSim] = useState(true); // Always on for sleekness
    const tickRef = useRef(0);

    const refreshDevices = () => {
        deviceService.getDevices().then(r => setDevices(r.data)).catch(() => {});
    };

    useEffect(() => {
        deviceService.getDevices().then(r => setDevices(r.data)).finally(() => setLoading(false));
    }, []);

    // Telemetry Engine (Silent) — updates React state every 2s
    useEffect(() => {
        if (!autoSim) return;
        const interval = setInterval(() => {
            tickRef.current += 1;
            setDevices(prev => {
                const next = prev.map(d => {
                    if (d.status !== 'ON') return d;
                    return { ...d, currentPower: parseFloat(simulatePower(d, tickRef.current).toFixed(1)) };
                });
                if (setOverloadAlert) {
                    const totalW = next.filter(d => d.status === 'ON').reduce((sum, d) => sum + (d.currentPower || 0), 0);
                    setOverloadAlert(totalW > 2500);
                }
                return next;
            });
        }, 2000);
        return () => clearInterval(interval);
    }, [autoSim, setOverloadAlert]);

    // DB Sync Engine — persists simulated currentPower to backend every 10s so PDF shows real data
    useEffect(() => {
        const syncInterval = setInterval(() => {
            setDevices(prev => {
                prev.filter(d => d.status === 'ON').forEach(d => {
                    deviceService.updatePower(d.id, d.currentPower).catch(() => {});
                });
                return prev; // no state change, just side-effect
            });
        }, 10000);
        return () => clearInterval(syncInterval);
    }, []);


    const handleToggle = async (id) => {
        const res = await deviceService.toggleDevice(id);
        setDevices(prev => prev.map(d => d.id === id ? res.data : d));
    };

    const handlePowerChange = async (id, watts) => {
        setDevices(prev => prev.map(d => d.id === id ? { ...d, currentPower: watts } : d));
        deviceService.updatePower(id, watts).catch(() => {});
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this device?')) return;
        await deviceService.deleteDevice(id);
        refreshDevices();
    };

    if (loading) return <div className="text-center text-slate-400 py-20 flex flex-col items-center"><Cpu className="w-8 h-8 animate-spin mb-4 text-[#21d366]"/>Syncing...</div>;

    return (
        <div className="space-y-6">
            {/* Header Area with Add Button */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Devices</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">{devices.filter(d => d.status === 'ON').length} active right now</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)} 
                    className="flex items-center gap-2 bg-[#21d366] hover:bg-[#1ebd5b] text-[#0c0e0d] font-bold px-6 py-2.5 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Add New Device
                </button>
            </div>

            {/* Device List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {devices.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600 font-semibold text-lg">No Devices Connected</p>
                        <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">Start building your smart home by adding your first device.</p>
                        <button 
                            onClick={() => setShowModal(true)}
                            className="mt-6 text-[#21d366] font-bold hover:underline"
                        >
                            Connect Device Now →
                        </button>
                    </div>
                ) : (
                    devices.map(device => (
                        <DeviceCard
                            key={device.id} device={device}
                            expanded={expandedCard === device.id} onExpand={setExpandedCard}
                            onToggle={handleToggle} onPowerChange={handlePowerChange} onDelete={handleDelete}
                            onEdit={setEditingDevice}
                        />
                    ))
                )}
            </div>

            {/* Modal Overlay (Global Context) */}
            {(showModal || editingDevice) && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <AddDeviceModal 
                        editDevice={editingDevice}
                        onSave={() => refreshDevices()} 
                        onClose={() => { setShowModal(false); setEditingDevice(null); }} 
                    />
                </div>
            )}
        </div>
    );
};

// ─── MILESTONE 4: PREMIUM BILLING & COST FORECASTING ────────────────────────
const BillingTab = ({ devices, energyHistory }) => {
    const [tariff, setTariff] = useState(7.5); // ₹ per kWh
    const [budget, setBudget] = useState(2500);

    const activePowerW = devices.filter(d => d.status === 'ON').reduce((a, b) => a + (b.currentPower || 0), 0);
    const hourlyCost = (activePowerW / 1000) * tariff;
    const dailyEst = hourlyCost * 24;
    const monthlyEst = dailyEst * 30;

    const budgetPercent = Math.min(100, (monthlyEst / budget) * 100);

    // Grouping usage by device for breakdown
    const deviceBreakdown = devices.map(d => {
        const isON = d.status === 'ON';
        const estMonthly = isON ? (d.currentPower / 1000) * 24 * 30 * tariff : 0;
        return { name: d.name, type: d.type, cost: estMonthly, status: d.status };
    }).sort((a, b) => b.cost - a.cost);

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Billing & Forecast</h2>
                <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold">
                    Tariff: ₹{tariff}/kWh
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Cost Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-blue-200">
                        <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-2">Estimated Monthly Bill</p>
                        <h1 className="text-5xl font-black mb-6">₹{monthlyEst.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h1>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-blue-100">Budget: ₹{budget}</span>
                                <span>{budgetPercent.toFixed(1)}% used</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                                <div className={`h-full transition-all duration-1000 ${budgetPercent > 90 ? 'bg-orange-400' : 'bg-white'}`} style={{ width: `${budgetPercent}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Daily Run Rate</p>
                            <p className="text-slate-800 text-xl font-bold mt-1">₹{dailyEst.toFixed(1)}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Current Load</p>
                            <p className="text-slate-800 text-xl font-bold mt-1">{(activePowerW/1000).toFixed(2)} kW</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-slate-700 text-sm font-bold text-sm">Electricity Tariff</label>
                                <span className="text-blue-600 font-black">₹{tariff}/kWh</span>
                            </div>
                            <input type="range" min={4} max={15} step={0.1} value={tariff} onChange={e => setTariff(parseFloat(e.target.value))} 
                                   className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-slate-700 text-sm font-bold text-sm">Monthly Budget</label>
                                <span className="text-slate-800 font-black">₹{budget}</span>
                            </div>
                            <input type="range" min={1000} max={10000} step={100} value={budget} onChange={e => setBudget(parseInt(e.target.value))} 
                                   className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-800" />
                        </div>
                    </div>
                </div>

                {/* Right Column: Breakdown */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-slate-800 font-bold text-lg mb-6 flex items-center gap-2">
                             <DollarSign className="w-5 h-5 text-blue-600" />
                             Device Cost Breakdown
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {deviceBreakdown.filter(d => d.cost > 0 || d.status === 'ON').map(d => (
                                <div key={d.name} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100 hover:border-blue-200 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-lg bg-white border border-slate-100 text-slate-400 group-hover:text-blue-600 transition-colors">
                                            <DeviceIcon type={d.type} className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-slate-800 font-bold text-sm">{d.name}</p>
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{d.status}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-800 font-black">₹{d.cost.toFixed(0)}</p>
                                        <p className="text-[10px] text-slate-500">per month</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex items-start gap-4">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                             <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-amber-900 font-bold text-sm">Saving Tip</p>
                            <p className="text-amber-700 text-xs mt-1">Refining your AC usage between 2 PM and 4 PM could save you approximately ₹450 this month.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── MILESTONE 4: PREMIUM ANALYTICS DASHBOARD ────────────────────────────────

const AnalyticsTab = ({ setCurrentPage, energyHistory, fetchHistory, isMounted }) => {
    const [range, setRange] = useState('24h');
    const [tariff, setTariff] = useState(7); // ₹ per kWh
    const [comparison, setComparison] = useState({ thisWeek: {}, lastWeek: {} });
    const [summary, setSummary] = useState({ totalKwh: 0, estimatedCost: 0, peakHour: 18, dailyAvg: 0 });
    const [liveDevices, setLiveDevices] = useState([]); // ← own fetch, always fresh

    // Fetch live devices independently so toggle state from DevicesTab is always reflected
    useEffect(() => {
        const load = () => deviceService.getDevices().then(r => setLiveDevices(r.data)).catch(() => {});
        load();
        const poll = setInterval(load, 5000); // refresh every 5s
        return () => clearInterval(poll);
    }, []);

    // Load comparison and summary from backend
    useEffect(() => {
        energyService.getComparison().then(r => setComparison(r.data)).catch(() => {
            // Simulate rich week comparison data if DB is empty
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const thisWeek = {}, lastWeek = {};
            days.forEach(d => {
                thisWeek[d] = parseFloat((Math.random() * 4 + 1).toFixed(2));
                lastWeek[d] = parseFloat((Math.random() * 4 + 1).toFixed(2));
            });
            setComparison({ thisWeek, lastWeek });
        });
        energyService.getSummary(range).then(r => setSummary(r.data)).catch(() => {});
    }, [range]);

    // Live power from self-fetched devices
    const livePowerW = liveDevices.filter(d => d.status === 'ON').reduce((a, d) => a + (d.currentPower || 0), 0);
    const livePowerKw = (livePowerW / 1000).toFixed(2);
    const activeCount = liveDevices.filter(d => d.status === 'ON').length;

    // Merge history + live data for trend chart
    const trendData = energyHistory.length > 0 ? energyHistory : [];


    // Build week comparison bar chart data
    const comparisonData = Object.keys(comparison.thisWeek || {}).map(day => ({
        day,
        thisWeek: parseFloat((comparison.thisWeek[day] || 0).toFixed(2)),
        lastWeek: parseFloat((comparison.lastWeek[day] || 0).toFixed(2)),
    }));

    // Build 24-hour peak/off-peak chart (simulated realistic IoT pattern)
    const peakData = Array.from({ length: 24 }, (_, h) => {
        const isPeak = h >= 18 && h <= 22;
        const isOffPeak = h >= 0 && h <= 5;
        const base = isPeak ? 2.8 : isOffPeak ? 0.4 : 1.4;
        const val = parseFloat((base + Math.random() * 0.5).toFixed(2));
        return {
            hour: `${h}:00`,
            kWh: val,
            fill: isPeak ? '#f59e0b' : isOffPeak ? '#22d3ee' : '#21d366',
        };
    });
    const peakHour = peakData.reduce((max, d) => d.kWh > max.kWh ? d : max, peakData[0]);

    // Cost prediction
    const projectedMonthlyKwh = livePowerKw * 24 * 30;
    const projectedCost = (projectedMonthlyKwh * tariff).toFixed(0);

    // This week total vs last week total for % change
    const thisTotal = Object.values(comparison.thisWeek || {}).reduce((a, b) => a + b, 0);
    const lastTotal = Object.values(comparison.lastWeek || {}).reduce((a, b) => a + b, 0);
    const pctChange = lastTotal > 0 ? (((thisTotal - lastTotal) / lastTotal) * 100).toFixed(1) : 0;
    const isImproved = parseFloat(pctChange) <= 0;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header with Range Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Energy Analytics</h2>
                    <p className="text-slate-500 text-sm">Detailed insights into your home's power consumption.</p>
                </div>
                <div className="flex bg-white rounded-xl shadow-sm p-1 gap-1 border border-slate-200">
                    {[['24h','Today'], ['week','This Week'], ['month','Month']].map(([val, label]) => (
                        <button key={val} onClick={() => { setRange(val); fetchHistory(val); }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${range === val ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top Row: Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Live Power</p>
                    <p className="text-slate-800 text-3xl font-black mt-2">{livePowerKw}<span className="text-lg font-medium text-slate-400"> kW</span></p>
                    <p className="text-green-600 text-[11px] font-bold mt-2 flex items-center gap-1">
                         <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                         {activeCount} devices active
                    </p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Estimated Cost</p>
                    <p className="text-slate-800 text-3xl font-black mt-2">₹{summary.estimatedCost || (livePowerKw * 8 * tariff).toFixed(0)}</p>
                    <p className="text-amber-600 text-[11px] font-bold mt-2">Projection based on current rate</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Peak Hour Today</p>
                    <p className="text-slate-800 text-3xl font-black mt-2">{peakHour.hour}</p>
                    <p className="text-blue-500 text-[11px] font-bold mt-2">{peakHour.kWh} kWh consumed</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Efficiency vs Last Week</p>
                    <p className={`text-3xl font-black mt-2 ${isImproved ? 'text-green-600' : 'text-red-500'}`}>{isImproved ? '↓' : '↑'}{Math.abs(pctChange)}%</p>
                    <p className={`text-[11px] font-bold mt-2 ${isImproved ? 'text-green-600' : 'text-red-500'}`}>{isImproved ? 'Improved Performance!' : 'Higher than average'}</p>
                </div>
            </div>

            {/* Middle Row: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="mb-6">
                        <p className="text-slate-800 font-bold">Consumption Trend</p>
                        <p className="text-slate-400 text-xs">Real-time power usage monitoring</p>
                    </div>
                    <div className="h-[280px]">
                        {isMounted && trendData.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="timestamp"
                                    tickFormatter={s => { const d = new Date(s); return range === '24h' ? d.toLocaleTimeString([], {hour:'numeric',hour12:true}) : d.toLocaleDateString([],{weekday:'short'}); }}
                                    stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{backgroundColor:'#fff',border:'1px solid #f1f5f9',borderRadius:'12px',boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Area type="monotone" dataKey="consumption" stroke="#3b82f6" strokeWidth={3} fill="url(#gBlue)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <p className="text-slate-800 font-bold">Weekly Comparison</p>
                            <p className="text-slate-400 text-xs">This week vs last week</p>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] font-bold">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"/>This</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block"/>Last</span>
                        </div>
                    </div>
                    <div className="h-[280px]">
                        {isMounted && comparisonData.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparisonData} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false}/>
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false}/>
                                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{backgroundColor:'#fff',border:'1px solid #f1f5f9',borderRadius:'12px'}} />
                                <Bar dataKey="thisWeek" name="This Week" fill="#3b82f6" radius={[4,4,0,0]} />
                                <Bar dataKey="lastWeek" name="Last Week" fill="#e2e8f0" radius={[4,4,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Detailed Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="mb-6">
                        <p className="text-slate-800 font-bold">Hourly Distribution (24h)</p>
                        <p className="text-slate-400 text-xs">Identify high consumption periods</p>
                    </div>
                    <div className="h-[200px]">
                        {isMounted && peakData.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={peakData} barCategoryGap="10%">
                                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} interval={2} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor:'#fff',border:'1px solid #f1f5f9',borderRadius:'12px'}} />
                                <Bar dataKey="kWh" radius={[2,2,0,0]}>
                                    {peakData.map((entry, i) => (
                                        <rect key={i} fill={entry.fill} fillOpacity={0.8}/>
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        )}
                    </div>
                    <div className="mt-6 flex items-center gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <Lightbulb className="w-6 h-6 text-blue-600 shrink-0" />
                        <p className="text-blue-800 text-xs leading-relaxed font-medium">
                            <span className="font-bold">Smart Recommendation:</span> Your usage patterns show a high concentration in peak hours. Shifting your washing machine cycle to 11 PM would reduce your estimated monthly bill by ₹180.
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-slate-800 font-bold mb-4">Export Analysis</p>
                        <p className="text-slate-500 text-sm mb-6">Generate a comprehensive PDF report of your energy consumption and cost forecasts.</p>
                        
                        <div className="space-y-4 mb-8">
                             <div className="flex items-center gap-3 text-sm text-slate-600">
                                 <CheckCircle className="w-4 h-4 text-green-500" /> Hourly usage breakdown
                             </div>
                             <div className="flex items-center gap-3 text-sm text-slate-600">
                                 <CheckCircle className="w-4 h-4 text-green-500" /> Cost saving opportunities
                             </div>
                             <div className="flex items-center gap-3 text-sm text-slate-600">
                                 <CheckCircle className="w-4 h-4 text-green-500" /> Device-level analysis
                             </div>
                        </div>
                    </div>

                    <button onClick={async () => {
                        try {
                            const res = await energyService.downloadReport();
                            const url = window.URL.createObjectURL(new Blob([res.data]));
                            const link = document.createElement('a');
                            link.href = url; link.setAttribute('download', 'energy_report.pdf');
                            document.body.appendChild(link); link.click();
                        } catch { alert('Failed to download report'); }
                    }} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-95">
                        <Download className="w-5 h-5" /> Download PDF Report
                    </button>
                </div>
            </div>
        </div>
    );
};


// ─── HOMEOWNER OVERVIEW TAB ────────────────────────────────────────────────────
const HomeownerDashboard = ({ profile, onNavigate, devices = [], energyHistory = [], schedules = [], onAddSchedule, onDeleteSchedule, onDownloadReport, recommendations = [], onRefreshInsights, isMounted }) => {
    const totalPower = devices.filter(d => d.status === 'ON').reduce((acc, d) => acc + (d.currentPower || 0), 0);
    const activeCount = devices.filter(d => d.status === 'ON').length;
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await onRefreshInsights?.();
        setRefreshing(false);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-blue-500"><Zap className="w-5 h-5 text-white" /></div>
                    <div>
                        <p className="text-slate-500 text-sm">Live Consumption</p>
                        <p className="text-2xl font-bold text-slate-800">{totalPower.toFixed(1)} W</p>
                        <span className="text-xs text-green-600">{activeCount} device(s) on</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-orange-500"><Cpu className="w-5 h-5 text-white" /></div>
                    <div>
                        <p className="text-slate-500 text-sm">Total Devices</p>
                        <p className="text-2xl font-bold text-slate-800">{devices.length}</p>
                        <span className="text-xs text-slate-400">{devices.length - activeCount} idle</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-green-500"><DollarSign className="w-5 h-5 text-white" /></div>
                    <div>
                        <p className="text-slate-500 text-sm">Est. Daily Cost</p>
                        <p className="text-2xl font-bold text-slate-800">₹{((totalPower * 8) / 1000 * 7).toFixed(2)}</p>
                        <span className="text-xs text-slate-400">at ₹7/kWh</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Quick device status */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-slate-700 flex items-center gap-2"><Cpu className="w-4 h-4 text-blue-500" />Device Status</h3>
                        <button onClick={() => onNavigate('devices')} className="text-xs text-blue-500 hover:underline">Manage →</button>
                    </div>
                    {devices.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-4">No devices added yet</p>
                    ) : (
                        devices.slice(0, 5).map(d => (
                            <div key={d.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                <div className="flex items-center gap-2">
                                    <DeviceIcon type={d.type} className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm text-slate-700">{d.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-400">{(d.currentPower || 0).toFixed(1)}W</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.status === 'ON' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>{d.status}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* ── Live Smart Insights (Milestone 5) ── */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            Smart Insights
                            {recommendations.length > 0 && (
                                <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                                    {recommendations.length}
                                </span>
                            )}
                        </h3>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="text-xs text-blue-500 hover:underline flex items-center gap-1 disabled:opacity-50"
                        >
                            {refreshing ? '⏳ Refreshing...' : '🔄 Refresh'}
                        </button>
                    </div>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {recommendations.length === 0 ? (
                            <p className="text-slate-400 text-sm text-center py-4 italic">Loading personalized insights...</p>
                        ) : (
                            recommendations.slice(0, 6).map((r, i) => (
                                <div key={r.id || i} className="flex items-start gap-2.5 py-2 border-b border-slate-50 last:border-0">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                    <p className="text-sm text-slate-700 leading-snug">{r.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <EnergyAnalytics data={energyHistory} onDownload={onDownloadReport} isMounted={isMounted} />
                </div>
                <div className="lg:col-span-1">
                    <SchedulingSection
                        schedules={schedules}
                        devices={devices}
                        onAdd={onAddSchedule}
                        onDelete={onDeleteSchedule}
                    />
                </div>
            </div>
        </div>
    );
};


// ─── ADMIN DASHBOARD ───────────────────────────────────────────────────────────
const AdminDashboard = ({ policies = [], onUpdatePolicy }) => (
    <div className="space-y-6">
        {/* Existing stats... */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
                { label: 'Total Users', value: '1,482', sub: '↑ 3.2% this week', icon: Users, bg: 'bg-violet-500', subColor: 'text-green-600' },
                { label: 'Active Sessions', value: '284', sub: 'Peak: 8 PM – 10 PM', icon: Activity, bg: 'bg-orange-500', subColor: 'text-orange-500' },
                { label: 'System Health', value: '99.9%', sub: 'All systems normal', icon: Shield, bg: 'bg-green-500', subColor: 'text-green-600' },
            ].map(s => (
                <div key={s.label} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${s.bg}`}><s.icon className="w-5 h-5 text-white" /></div>
                    <div>
                        <p className="text-slate-500 text-sm">{s.label}</p>
                        <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                        <span className={`text-xs ${s.subColor}`}>{s.sub}</span>
                    </div>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Energy Policies */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-violet-500" />System Energy Policies</h3>
                <div className="space-y-4">
                    {policies.map(p => (
                        <div key={p.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-700">{p.policyKey.replace(/_/g, ' ')}</span>
                                <input
                                    type="number"
                                    className="w-20 px-2 py-1 text-sm border rounded"
                                    defaultValue={p.value}
                                    onBlur={(e) => onUpdatePolicy({ ...p, value: parseFloat(e.target.value) })}
                                />
                            </div>
                            <p className="text-xs text-slate-500">{p.description}</p>
                        </div>
                    ))}
                    {policies.length === 0 && (
                        <div className="text-center py-4">
                            <button
                                onClick={() => onUpdatePolicy({ policyKey: 'MAX_USER_WATTAGE', value: 5000, description: 'Maximum allowed wattage per home' })}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                + Initialize Default Policy
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-violet-500" />User Overview</h3>
                {[{ role: 'Homeowners', count: 1240 }, { role: 'Technicians', count: 185 }, { role: 'Admins', count: 57 }].map(r => (
                    <div key={r.role} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                        <span className="text-sm text-slate-700">{r.role}</span>
                        <span className="text-sm font-semibold text-slate-600">{r.count.toLocaleString()}</span>
                    </div>
                ))}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><Database className="w-4 h-4 text-violet-500" />System Status</h3>
                {[
                    { service: 'Database', icon: CheckCircle, color: 'text-green-600', status: 'Healthy' },
                    { service: 'Email Service', icon: CheckCircle, color: 'text-green-600', status: 'Healthy' },
                    { service: 'Auth Service', icon: CheckCircle, color: 'text-green-600', status: 'Healthy' },
                    { service: 'Scheduled Jobs', icon: Clock, color: 'text-blue-600', status: 'Running' },
                ].map(s => (
                    <div key={s.service} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                        <span className="text-sm text-slate-700">{s.service}</span>
                        <span className={`flex items-center gap-1 text-xs font-medium ${s.color}`}><s.icon className="w-3.5 h-3.5" />{s.status}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// ─── TECHNICIAN DASHBOARD ──────────────────────────────────────────────────────
const TechnicianDashboard = ({ profile }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
                { label: 'Open Requests', value: '7', sub: '3 High Priority', icon: ClipboardList, bg: 'bg-emerald-500', subColor: 'text-red-500' },
                { label: 'Completed Today', value: '4', sub: 'Above average', icon: CheckCircle, bg: 'bg-blue-500', subColor: 'text-green-600' },
                { label: 'Pending Parts', value: '2', sub: 'Estimated: 2 days', icon: AlertTriangle, bg: 'bg-orange-500', subColor: 'text-orange-500' },
            ].map(s => (
                <div key={s.label} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${s.bg}`}><s.icon className="w-5 h-5 text-white" /></div>
                    <div>
                        <p className="text-slate-500 text-sm">{s.label}</p>
                        <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                        <span className={`text-xs ${s.subColor}`}>{s.sub}</span>
                    </div>
                </div>
            ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-emerald-500" />Active Requests</h3>
                {[
                    { id: '#SR-1042', desc: 'Solar panel installation', priority: 'High', client: 'Ramesh P.' },
                    { id: '#SR-1041', desc: 'Smart meter calibration', priority: 'Normal', client: 'Anita K.' },
                    { id: '#SR-1039', desc: 'EV charger fault', priority: 'High', client: 'Suresh M.' },
                ].map(r => (
                    <div key={r.id} className="py-3 border-b border-slate-50 last:border-0">
                        <div className="flex justify-between"><span className="text-xs text-slate-400 font-mono">{r.id}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>{r.priority}</span>
                        </div>
                        <p className="text-sm text-slate-700 mt-0.5">{r.desc}</p>
                        <p className="text-xs text-slate-400">Client: {r.client}</p>
                    </div>
                ))}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><Wrench className="w-4 h-4 text-emerald-500" />Maintenance Log</h3>
                {[
                    { date: 'Today 10:30 AM', task: 'Solar meter replaced at Block B' },
                    { date: 'Today 09:00 AM', task: 'Smart switch firmware update' },
                    { date: 'Yesterday', task: 'Inverter battery inspection at C4' },
                ].map(l => (
                    <div key={l.task} className="py-2.5 border-b border-slate-50 last:border-0">
                        <p className="text-sm text-slate-700">{l.task}</p>
                        <div className="flex justify-between"><span className="text-xs text-slate-400">{l.date}</span><span className="text-xs text-green-600">Done</span></div>
                    </div>
                ))}
                {profile?.specialization && <p className="mt-4 text-xs text-slate-400">⭐ {profile.specialization}</p>}
            </div>
        </div>
    </div>
);

// ─── PROFILE PAGE ──────────────────────────────────────────────────────────────
const ProfilePage = ({ role, profile, onSave, saving }) => {
    const [form, setForm] = useState({
        fullName: profile?.fullName || '',
        phoneNumber: profile?.phoneNumber || '',
        address: profile?.address || '',
        devicePreferences: profile?.devicePreferences || '',
    });

    useEffect(() => {
        setForm({
            fullName: profile?.fullName || '',
            phoneNumber: profile?.phoneNumber || '',
            address: profile?.address || '',
            devicePreferences: profile?.devicePreferences || '',
        });
    }, [profile]);

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-700 to-sky-600 p-6">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3">
                        <User className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">{profile?.fullName || 'Your Profile'}</h2>
                    <p className="text-white/70 text-sm">{profile?.email}</p>
                    <span className="mt-1 inline-block text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">{role}</span>
                </div>
                <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Full Name</label>
                            <input type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Your full name" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Phone Number</label>
                            <input type="text" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" placeholder="+91 XXXXX XXXXX" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Home Address</label>
                        <textarea rows={3} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="123 Energy Street, Solar City" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">{role === 'TECHNICIAN' ? 'Specialization' : 'Device Preferences'}</label>
                        <textarea rows={3} value={form.devicePreferences} onChange={e => setForm({ ...form, devicePreferences: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder={role === 'TECHNICIAN' ? 'e.g. Solar panels, HVAC systems...' : 'e.g. Avoid AC after 9 PM...'} />
                    </div>
                    <button type="submit" disabled={saving}
                        className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// ─── SIDEBAR ────────────────────────────────────────────────────────────────────
const Sidebar = ({ role, currentPage, setCurrentPage, onSignOut }) => {
    const getNav = () => {
        const base = [{ id: 'dashboard', label: 'Dashboard', icon: Home }, { id: 'profile', label: 'Profile', icon: User }];
        if (role === 'HOMEOWNER') return [base[0], { id: 'devices', label: 'My Devices', icon: Cpu }, { id: 'analytics', label: 'Energy Tracking', icon: Activity }, { id: 'billing', label: 'Billing', icon: DollarSign }, base[1]];
        if (role === 'ADMIN') return [base[0], { id: 'users', label: 'User Mgmt', icon: Users }, { id: 'settings', label: 'Settings', icon: Settings }, base[1]];
        return [base[0], { id: 'requests', label: 'Service Requests', icon: ClipboardList }, { id: 'maintenance', label: 'Maintenance', icon: Wrench }, base[1]];
    };

    const colorMap = { ADMIN: 'slate', HOMEOWNER: 'blue', TECHNICIAN: 'sky' };
    const color = colorMap[role] || 'blue';

    return (
        <aside className="w-64 bg-white shadow-md flex flex-col shrink-0">
            <div className={`p-6 border-b bg-gradient-to-br from-${color}-600 to-${color}-700`}>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Zap className="fill-white w-6 h-6" />INFOZIANT</h1>
                <span className="mt-2 inline-block text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">{role}</span>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {getNav().map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setCurrentPage(id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${currentPage === id ? `bg-${color}-50 text-${color}-700` : 'text-slate-600 hover:bg-slate-50'}`}>
                        <Icon className="w-4 h-4" /> {label}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t">
                <button onClick={onSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg font-medium text-sm transition-colors">
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </div>
        </aside>
    );
};

// ─── ENERGY ANALYTICS ──────────────────────────────────────────────────────────
const EnergyAnalytics = ({ data, onDownload, isMounted }) => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Energy Consumption Analytics</h3>
                </div>
                <button
                    onClick={onDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
                >
                    <Download className="w-4 h-4" /> Export Report (PDF)
                </button>
            </div>

            <div className="h-[300px] w-full">
                {isMounted && data && data.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={(str) => new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                stroke="#94a3b8"
                                fontSize={12}
                            />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="consumption" stroke="#2563eb" fillOpacity={1} fill="url(#colorCons)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-blue-900">Insight</p>
                        <p className="text-xs text-blue-700/80">Your energy usage peaked at 2.4kW today. Consider shifting Washing Machine usage to off-peak hours.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── ALARM STYLE TIME PICKER ───────────────────────────────────────────────────
const TimePicker = ({ label, value, onChange }) => {
    // value is "HH:mm" in 24h
    let h24 = parseInt(value.split(':')[0] || '0', 10);
    let m = value.split(':')[1] || '00';
    let p = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    let h12Str = h12.toString().padStart(2, '0');

    const updateTime = (newH, newM, newP) => {
        let finalH = parseInt(newH, 10);
        if (newP === 'PM' && finalH !== 12) finalH += 12;
        if (newP === 'AM' && finalH === 12) finalH = 0;
        onChange(`${finalH.toString().padStart(2, '0')}:${newM}`);
    };

    return (
        <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
            <div className="flex bg-slate-50 border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                <select value={h12Str} onChange={e => updateTime(e.target.value, m, p)} className="bg-transparent pl-3 pr-1 py-2 text-sm outline-none cursor-pointer hover:bg-slate-100 flex-1 border-r border-slate-200 appearance-none font-medium">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => <option key={num} value={num.toString().padStart(2, '0')}>{num.toString().padStart(2, '0')}</option>)}
                </select>
                <select value={m} onChange={e => updateTime(h12Str, e.target.value, p)} className="bg-transparent pl-2 pr-1 py-2 text-sm outline-none cursor-pointer hover:bg-slate-100 flex-1 border-r border-slate-200 appearance-none font-medium text-slate-600">
                    {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(mins => <option key={mins} value={mins}>{mins}</option>)}
                </select>
                <select value={p} onChange={e => updateTime(h12Str, m, e.target.value)} className="bg-transparent pl-2 pr-2 py-2 text-sm outline-none cursor-pointer hover:bg-slate-100 font-bold appearance-none text-blue-700">
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                </select>
            </div>
        </div>
    );
};

// ─── SCHEDULING SECTION ────────────────────────────────────────────────────────
const SchedulingSection = ({ schedules, devices, onAdd, onDelete }) => {
    const [form, setForm] = useState({ deviceId: '', startTime: '08:00', endTime: '18:00', action: 'ON' });

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Automation Schedules</h3>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if(form.deviceId) onAdd(form); }} className="flex flex-col gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Device</label>
                    <select
                        value={form.deviceId}
                        onChange={e => setForm({...form, deviceId: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Choose a device to schedule</option>
                        {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                
                <div className="flex gap-4">
                    <div className="flex-1">
                        <TimePicker label="Start Time" value={form.startTime} onChange={v => setForm({...form, startTime: v})} />
                    </div>
                    <div className="flex-1">
                        <TimePicker label="End Time" value={form.endTime} onChange={v => setForm({...form, endTime: v})} />
                    </div>
                </div>

                <button type="submit" disabled={!form.deviceId} className="w-full bg-blue-600 text-white p-2.5 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Plus className="w-5 h-5" /> Set Automation
                </button>
            </form>


            <div className="space-y-3">
                {schedules.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                <Clock className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">{s.deviceName}</p>
                                <p className="text-xs text-slate-500">{s.startTime} - {s.endTime} | {s.action}</p>
                            </div>
                        </div>
                        <button onClick={() => onDelete(s.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {schedules.length === 0 && <p className="text-center text-sm text-slate-400 py-4 italic">No schedules set.</p>}
            </div>
        </div>
    );
};

// ─── MAIN DASHBOARD ─────────────────────────────────────────────────────────────
const Dashboard = () => {
    const navigate = useNavigate();
    const role = localStorage.getItem('role') || 'HOMEOWNER';
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [isMounted, setIsMounted] = useState(false);
    const [profile, setProfile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [energyHistory, setEnergyHistory] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [selectedRange, setSelectedRange] = useState('24h');
    const [devices, setDevices] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [policies, setPolicies] = useState([]);
    const [toast, setToast] = useState(null);          // { msg, type: 'success'|'warning' }
    const [overloadAlert, setOverloadAlert] = useState(false); // in-app overload banner

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        setIsMounted(true);
        if (!localStorage.getItem('token')) { navigate('/login'); return; }
        userService.getProfile().then(r => setProfile(r.data)).catch(() => { });
        fetchHistory();
        fetchSchedules();
        if (role === 'ADMIN') {
            fetchPolicies();
        }
        deviceService.getDevices().then(r => setDevices(r.data || [])).catch(() => {});
        // Load recommendations
        recommendationService.getRecommendations().then(r => setRecommendations(r.data || [])).catch(() => {});
    }, [navigate]);

    // In-app overload monitor: re-checks every 30 seconds
    useEffect(() => {
        const check = () => {
            deviceService.getDevices().then(r => {
                const liveDevices = r.data || [];
                setDevices(liveDevices);
                const totalW = liveDevices.filter(d => d.status === 'ON')
                    .reduce((sum, d) => sum + (d.currentPower || 0), 0);
                setOverloadAlert(totalW > 2500);
            }).catch(() => {});
        };
        const interval = setInterval(check, 30000);
        return () => clearInterval(interval);
    }, []);

    // ── Schedule Toast Notification ──────────────────────────────────────────────
    const notifiedSchedules = useRef(new Set());
    
    useEffect(() => {
        const checkSchedules = () => {
            const now = new Date();
            const currentH = now.getHours().toString().padStart(2, '0');
            const currentM = now.getMinutes().toString().padStart(2, '0');
            const currentTimeStr = `${currentH}:${currentM}`;

            schedules.forEach(s => {
                const startStr = s.startTime.substring(0, 5);
                const endStr = s.endTime.substring(0, 5);

                if (startStr === currentTimeStr) {
                    const key = `${s.id}_start_${currentTimeStr}`;
                    if (!notifiedSchedules.current.has(key)) {
                        showToast(`⏰ Schedule Started: ${s.deviceName} turned ON.`, 'success');
                        notifiedSchedules.current.add(key);
                    }
                }
                
                if (endStr === currentTimeStr) {
                    const key = `${s.id}_end_${currentTimeStr}`;
                    if (!notifiedSchedules.current.has(key)) {
                        showToast(`✅ Schedule Completed: ${s.deviceName} turned OFF.`, 'success');
                        notifiedSchedules.current.add(key);
                    }
                }
            });
        };
        const interval = setInterval(checkSchedules, 20000);
        return () => clearInterval(interval);
    }, [schedules]);

    // ── Voice Alert Hook ─────────────────────────────────────────────────────────
    const voiceTriggered = useRef(false);

    const playVoiceAlert = useCallback(() => {
        if ('speechSynthesis' in window) {
            const culprits = devices
                .filter(d => d.status === 'ON' && (d.powerRating > 1000 || d.currentPower > 1000))
                .map(d => d.name)
                .join(" and ");
            const actionText = culprits ? `Please turn off your ${culprits}.` : "Please turn off high power appliances.";
            window.speechUtterance = new SpeechSynthesisUtterance(`Warning! Energy limits crossed. ${actionText}`);
            window.speechSynthesis.speak(window.speechUtterance);
        }
    }, [devices]);

    const playNormalSpeech = useCallback(() => {
        if ('speechSynthesis' in window) {
            window.speechUtterance = new SpeechSynthesisUtterance("System is operating normally. No energy limits crossed.");
            window.speechSynthesis.speak(window.speechUtterance);
        }
    }, []);
    
    useEffect(() => {
        if (overloadAlert && !voiceTriggered.current) {
            voiceTriggered.current = true;
            playVoiceAlert();
        } else if (!overloadAlert) {
            voiceTriggered.current = false;
        }
    }, [overloadAlert, playVoiceAlert]);

    const fetchPolicies = async () => {
        try {
            if (role !== 'ADMIN') return;
            const r = await adminService.getPolicies();
            setPolicies(r.data || []);
        } catch (err) {
            console.warn('Could not fetch admin policies:', err.message);
        }
    };

    const handleUpdatePolicy = async (policy) => {
        try {
            await adminService.updatePolicy(policy);
            fetchPolicies();
        } catch { alert('Failed to update policy'); }
    };

    const fetchHistory = async (range = '24h') => {
        try {
            const r = await energyService.getHistory(range);
            if (r.data && r.data.length > 0) {
                setEnergyHistory(r.data);
            } else {
                // Generate beautiful dummy data if DB is empty to simulate IoT readings natively
                const dummy = [];
                const now = new Date();
                const points = range === '24h' ? 24 : 7;
                for (let i = points; i >= 0; i--) {
                    const t = new Date(now);
                    if (range === '24h') t.setHours(t.getHours() - i);
                    else t.setDate(t.getDate() - i);

                    const hour = t.getHours();
                    // Realistic consumption curve: higher in evenings
                    const base = (hour >= 18 && hour <= 23) ? 2500 : (hour >= 0 && hour <= 6 ? 400 : 1200);
                    const variance = Math.random() * 600;
                    dummy.push({
                        timestamp: t.toISOString(),
                        consumption: base + variance
                    });
                }
                setEnergyHistory(dummy);
            }
        } catch { console.error('Failed to fetch history'); }
    };

    const fetchSchedules = async () => {
        try {
            const r = await scheduleService.getSchedules();
            setSchedules(r.data || []);
        } catch (err) { console.error('Failed to fetch schedules', err); }
    };

    const handleAddSchedule = async (form) => {
        try {
            const res = await scheduleService.createSchedule(form);
            fetchSchedules();
            const dev = devices.find(d => String(d.id) === String(form.deviceId));
            showToast(`✅ Schedule set! ${dev?.name || 'Device'} will turn ON at ${form.startTime} and OFF at ${form.endTime}`, 'success');
        } catch { alert('Failed to add schedule'); }
    };

    const handleDeleteSchedule = async (id) => {
        try {
            await scheduleService.deleteSchedule(id);
            fetchSchedules();
        } catch { alert('Failed to delete schedule'); }
    };

    const handleDownloadReport = async () => {
        try {
            const res = await energyService.downloadReport();
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'energy_report.pdf');
            document.body.appendChild(link);
            link.click();
        } catch { alert('Failed to download report'); }
    };

    const handleSignOut = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const handleSaveProfile = async (form) => {
        setSaving(true);
        try {
            await userService.updateProfile(form);
            const r = await userService.getProfile();
            setProfile(r.data);
            setSaveMsg('✅ Profile saved!');
        } catch { setSaveMsg('❌ Save failed'); }
        finally { setSaving(false); setTimeout(() => setSaveMsg(''), 3000); }
    };

    const handleRefreshInsights = async () => {
        await recommendationService.refreshRecommendations();
        const r = await recommendationService.getRecommendations();
        setRecommendations(r.data || []);
    };

    const titleMap = {
        dashboard: 'Dashboard', devices: 'My Devices', analytics: 'Energy Tracking', profile: 'My Profile',
        users: 'User Management', settings: 'System Settings',
        requests: 'Service Requests', maintenance: 'Maintenance Log', billing: 'Billing',
    };

    const renderContent = () => {
        if (currentPage === 'profile') return <ProfilePage role={role} profile={profile} onSave={handleSaveProfile} saving={saving} />;
        if (currentPage === 'devices' && role === 'HOMEOWNER') return <DevicesTab setCurrentPage={setCurrentPage} setOverloadAlert={setOverloadAlert} />;
        if (currentPage === 'analytics' && role === 'HOMEOWNER') return <AnalyticsTab setCurrentPage={setCurrentPage} energyHistory={energyHistory} fetchHistory={fetchHistory} isMounted={isMounted} />;
        if (currentPage === 'billing' && role === 'HOMEOWNER') return <BillingTab devices={devices} energyHistory={energyHistory} />;
        if (role === 'ADMIN') return <AdminDashboard policies={policies} onUpdatePolicy={handleUpdatePolicy} />;
        if (role === 'TECHNICIAN') return <TechnicianDashboard profile={profile} />;
        return (
            <HomeownerDashboard
                profile={profile}
                onNavigate={setCurrentPage}
                devices={devices}
                energyHistory={energyHistory}
                schedules={schedules}
                onAddSchedule={handleAddSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onDownloadReport={handleDownloadReport}
                recommendations={recommendations}
                onRefreshInsights={handleRefreshInsights}
                isMounted={isMounted}
            />
        );
    };


    return (
        <div className="min-h-screen bg-slate-100 flex">
            <Sidebar role={role} currentPage={currentPage} setCurrentPage={setCurrentPage} onSignOut={handleSignOut} />
            <main className="flex-1 p-8 overflow-y-auto relative">

                {/* ── Overload Alert Banner ─────────────────────────────────── */}
                {overloadAlert && (
                    <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-300 text-red-800 px-5 py-3 rounded-xl shadow-sm animate-pulse">
                        <span className="text-xl">⚠️</span>
                        <div className="flex-1">
                            <p className="font-bold text-sm">Energy Overload Detected!</p>
                            <p className="text-xs text-red-600">Your home is consuming more than 2.5 kW. Turn off high-power appliances to avoid overload charges. An alert email has been sent.</p>
                        </div>
                        <button onClick={() => setOverloadAlert(false)} className="text-red-400 hover:text-red-600 text-lg font-bold">×</button>
                    </div>
                )}

                {/* ── Toast Notification ───────────────────────────────────── */}
                {toast && (
                    <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold flex items-center gap-2 transition-all ${
                        toast.type === 'success' ? 'bg-green-600' : 'bg-amber-500'
                    }`}>
                        <span>{toast.msg}</span>
                        <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">×</button>
                    </div>
                )}

                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{titleMap[currentPage] || 'Dashboard'}</h2>
                        <p className="text-slate-500 text-sm mt-0.5">
                            {currentPage === 'dashboard' && role === 'HOMEOWNER' ? `Welcome, ${profile?.fullName?.split(' ')[0] || 'Homeowner'}` : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Live Status Indicator */}
                        <button 
                            onClick={overloadAlert ? playVoiceAlert : playNormalSpeech}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:scale-105 transition-transform ${overloadAlert ? 'bg-red-500 text-white animate-pulse' : 'bg-[#21d366]/20 text-green-700 hover:bg-[#21d366]/30'}`}
                        >
                            <div className={`w-2 h-2 rounded-full ${overloadAlert ? 'bg-white' : 'bg-[#21d366]'}`}></div>
                            {overloadAlert ? 'ALERT: OVERLOAD' : 'SYSTEM NORMAL'}
                        </button>

                        {saveMsg && <span className="text-sm bg-white px-3 py-1 rounded-full shadow-sm">{saveMsg}</span>}
                        {/* Bell icon shows live dot if overload */}
                        <button className="p-2 bg-white rounded-lg shadow-sm hover:bg-slate-50 relative">
                            <Bell className="w-5 h-5 text-slate-500" />
                            {overloadAlert && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>}
                            {recommendations.length > 0 && !overloadAlert && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white"></span>}
                        </button>
                        <button onClick={() => setCurrentPage('profile')} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm hover:bg-slate-50">
                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-slate-700">{profile?.fullName?.split(' ')[0] || 'Profile'}</span>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                </header>
                {renderContent()}
            </main>
        </div>
    );
};

export default Dashboard;
