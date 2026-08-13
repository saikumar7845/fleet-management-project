import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CarFront, Users, Route as RouteIcon, Wrench, LogOut, Plus, Truck, AlertTriangle, Eye, EyeOff, Sparkles, ShieldCheck, Palette, Lock, Mail, Check, Code, Copy, X, Terminal, ArrowRight, Package, RotateCcw, UploadCloud, CheckCircle2, Box, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './styles.css';

const API = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');
const api = axios.create({ baseURL: API });

api.interceptors.request.use(c => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(err);
  }
);

const user = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch (e) {
    return null;
  }
};

function Protected({ children, roles }) {
  const u = user();
  if (!u) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(u.role)) return <Navigate to="/" replace />;
  return children;
}

function Home() {
  const [currentUser, setCurrentUser] = useState(user());
  
  useEffect(() => {
    const checkUser = () => setCurrentUser(user());
    window.addEventListener('storage', checkUser);
    // Also check immediately in case login just happened
    const timer = setTimeout(checkUser, 100);
    return () => {
      window.removeEventListener('storage', checkUser);
      clearTimeout(timer);
    };
  }, []);
  
  if (!currentUser) {
    return <Login />;
  }
  
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}

function Layout({ children }) {
  const u = user();
  const nav = useNavigate();
  const loc = useLocation();
  
  const logout = () => {
    localStorage.clear();
    nav('/login');
  };
  
  const navItems = [
    ['/dashboard', 'Dashboard', LayoutDashboard],
    ['/vehicles', 'Vehicles', CarFront],
    ['/drivers', 'Drivers', Users],
    ['/trips', 'Trips', RouteIcon],
    ['/maintenance', 'Maintenance', Wrench]
  ].filter(x => u?.role === 'driver' ? ['/dashboard', '/vehicles', '/trips'].includes(x[0]) : true);

  return (
    <div className="app-new ui-v4">
      <main className="main-full">
        <header className="header-full">
          <div className="header-left">
            <div className="brand-small"><Truck /> FleetOps</div>
            <nav className="top-nav">
              {navItems.map(([to, label, Icon]) => (
                <Link 
                  key={to}
                  to={to}
                  className={`nav-link ${loc.pathname === to ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-role">{u?.role?.toUpperCase()}</span>
              <span className="user-name">{u?.name || 'User'}</span>
            </div>
            <button className="logout-btn" onClick={logout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </header>
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
}

function Login() {
  const roleCredentials = {
    admin: { email: 'admin@fleet.com', password: 'Admin@123' },
    driver: { email: 'driver@fleet.com', password: 'Driver@123' }
  };

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [form, setForm] = useState(roleCredentials.admin);
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [role, setRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const selectRole = (selectedRole) => {
    setRole(selectedRole);
    setForm(roleCredentials[selectedRole]);
    setErr('');
    setMsg('');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setErr('');
    setMsg('');
  };

  const submitLogin = async e => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    setMsg('');
    try {
      const r = await api.post('/auth/login', form);
      localStorage.setItem('token', r.data.token);
      localStorage.setItem('user', JSON.stringify(r.data.user));
      setTimeout(() => window.location.href = '/', 500);
    } catch (e) {
      console.error('Login error:', e);
      const errorMsg = e.response?.data?.message || e.message || 'Login failed. Check server connection.';
      setErr(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async e => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    setMsg('');
    try {
      const r = await api.post('/auth/register', registerForm);
      setMsg(r.data.message || 'Account registered successfully!');
      localStorage.setItem('token', r.data.token);
      localStorage.setItem('user', JSON.stringify(r.data.user));
      setTimeout(() => window.location.href = '/', 800);
    } catch (e) {
      console.error('Registration error:', e);
      const errorMsg = e.response?.data?.message || e.message || 'Registration failed.';
      setErr(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container ui-v4">
      {/* Main Login Content */}
      <div className="login-stage">
        <div className="hero-banner">
          <div className="hero-badge">
            <Sparkles size={14} /> Fleet Management Platform v2.5
          </div>
          <h1 className="hero-title">
            Streamline Your <br />
            <span className="gradient-text">Fleet Operations</span>
          </h1>
          <p className="hero-desc">
            Real-time vehicle tracking, driver trip logging, intelligent maintenance scheduling, and instant analytics in one integrated dashboard.
          </p>

          <div className="hero-stats">
            <div className="stat-card">
              <span className="stat-num">99.4%</span>
              <span className="stat-lbl">Fleet Uptime</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">10k+</span>
              <span className="stat-lbl">Trips Logged</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">Live</span>
              <span className="stat-lbl">Maintenance Alerts</span>
            </div>
          </div>
        </div>

        <div className="login-wrapper">
          <div className="login-header">
            <div className="brand big">
              <Truck className="brand-icon" /> FleetOps
            </div>
            <p className="subtitle">Fleet Management & Vehicle Tracking System</p>
          </div>

          {/* Mode Switcher: Sign In vs Register */}
          <div className="code-modal-tabs" style={{ marginBottom: '20px' }}>
            <button
              type="button"
              className={`code-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              <span>Sign In</span>
            </button>
            <button
              type="button"
              className={`code-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              <span>Register Account</span>
            </button>
          </div>

          {mode === 'login' ? (
            <>
              <div className="role-selector">
                <button
                  type="button"
                  className={`role-btn ${role === 'admin' ? 'active' : ''}`}
                  onClick={() => selectRole('admin')}
                >
                  <ShieldCheck size={18} />
                  <span>Admin / Manager</span>
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === 'driver' ? 'active' : ''}`}
                  onClick={() => selectRole('driver')}
                >
                  <CarFront size={18} />
                  <span>Driver</span>
                </button>
              </div>

              <form onSubmit={submitLogin} className="login-form">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={18} className="input-icon" />
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {err && <div className="error-message">{err}</div>}
                {msg && <div className="success-banner" style={{ marginBottom: '16px' }}><CheckCircle2 size={16} /> {msg}</div>}

                <button type="submit" className="primary login-btn" disabled={loading}>
                  {loading ? (
                    <span className="btn-loading">
                      <span className="spinner"></span> Signing in...
                    </span>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={submitRegister} className="login-form">
              <div className="form-group">
                <label htmlFor="reg-name">Full Name</label>
                <div className="input-with-icon">
                  <Users size={18} className="input-icon" />
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={registerForm.name}
                    onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="Enter your email"
                    value={registerForm.email}
                    onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-phone">Phone Number</label>
                <div className="input-with-icon">
                  <Users size={18} className="input-icon" />
                  <input
                    id="reg-phone"
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={registerForm.phone}
                    onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-password">Create Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create secure password"
                    value={registerForm.password}
                    onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {err && <div className="error-message">{err}</div>}
              {msg && <div className="success-banner" style={{ marginBottom: '16px' }}><CheckCircle2 size={16} /> {msg}</div>}

              <button type="submit" className="primary login-btn" disabled={loading}>
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner"></span> Creating Account...
                  </span>
                ) : (
                  <>
                    <span>Register Restricted Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="login-background">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div className="glow-orb orb-3"></div>
        <div className="cyber-grid"></div>
      </div>
    </div>
  );
}


function Dashboard() {
  const [d, setD] = useState(null);
  const nav = useNavigate();
  
  useEffect(() => {
    api.get('/dashboard')
      .then(r => setD(r.data))
      .catch(() => setD({
        counts: { vehicles: 0, drivers: 0, trips: 0, dueMaintenance: 0 },
        totalDistance: 0,
        totalFuel: 0,
        totalMaintenanceCost: 0,
        utilization: 0,
        byVehicle: [],
        dueMaintenance: []
      }));
  }, []);

  if (user()?.role === 'driver') return <DriverHome />;
  if (!d) return <div className="loading">Loading dashboard…</div>;

  const counts = d.counts || {};
  const cards = [
    ['Vehicles', counts.vehicles ?? 0, CarFront],
    ['Trips', counts.trips ?? 0, RouteIcon],
    ['Distance', `${d.totalDistance ?? 0} km`, RouteIcon],
    ['Maintenance Due', counts.dueMaintenance ?? 0, AlertTriangle]
  ];
  
  const navItems = [
    { title: 'Vehicles', icon: CarFront, path: '/vehicles', color: '#3b82f6' },
    { title: 'Drivers', icon: Users, path: '/drivers', color: '#10b981' },
    { title: 'Trips', icon: RouteIcon, path: '/trips', color: '#f59e0b' },
    { title: 'Maintenance', icon: Wrench, path: '/maintenance', color: '#ef4444' }
  ];
  
  const utilization = d.utilization ?? 0;
  const totalFuel = (d.totalFuel ?? 0).toFixed(1);
  const totalMaintenanceCost = (d.totalMaintenanceCost ?? 0).toLocaleString();
  const byVehicle = d.byVehicle || [];
  const dueMaintenance = d.dueMaintenance || [];

  return (
    <div>
      <section className="quick-nav">
        {navItems.map(item => (
          <div key={item.path} className="nav-card" onClick={() => nav(item.path)} style={{borderTop: `4px solid ${item.color}`, cursor: 'pointer'}}>
            <item.icon size={32} style={{color: item.color}} />
            <h4>{item.title}</h4>
            <p>{item.title} Management</p>
          </div>
        ))}
      </section>
      
      <section className="cards">
        {cards.map(([n, v, I]) => (
          <div className="card" key={n}>
            <I size={20} />
            <span>{n}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </section>
      <section className="grid2">
        <div className="panel">
          <h3>Fleet Utilization</h3>
          <div className="util">
            <div className="donut">
              <PieChart width={190} height={190}>
                <Pie data={[{ name: 'Assigned', value: utilization }, { name: 'Available', value: Math.max(0, 100 - utilization) }]} dataKey="value" innerRadius={62} outerRadius={82}>
                  <Cell key="assigned" fill="#2563eb" />
                  <Cell key="available" fill="#e2e8f0" />
                </Pie>
              </PieChart>
              <b>{utilization}%</b>
            </div>
            <div>
              <p>Assigned vehicles</p>
              <p><b>{utilization}%</b> of the fleet is currently assigned.</p>
              <p className="muted">Fuel used: {totalFuel} L<br />Maintenance cost: ₹{totalMaintenanceCost}</p>
            </div>
          </div>
        </div>
        <div className="panel">
          <h3>Vehicle Usage</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={byVehicle}>
              <XAxis dataKey="registrationNumber" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="distanceKm" fill="#2563eb" name="Distance (km)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <div className="panel">
        <h3>Service Alerts</h3>
        {dueMaintenance.length ? (
          <table>
            <thead>
              <tr><th>Vehicle</th><th>Last Service</th><th>Status</th></tr>
            </thead>
            <tbody>
              {dueMaintenance.map(v => (
                <tr key={v.id || v._id || v.registrationNumber}>
                  <td><strong>{v.registrationNumber}</strong></td>
                  <td>{v.lastServiceDate ? new Date(v.lastServiceDate).toLocaleDateString() : '—'}</td>
                  <td>
                    <span className={`badge ${v.status === 'maintenance' ? 'warn' : 'warn'}`}>
                      {v.status === 'maintenance' ? '🔧 In Maintenance' : '⚠️ Maintenance Due'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p>No service alerts.</p>}
      </div>
    </div>
  );
}

function LoadCargoModal({ vehicle, onClose, onSuccess }) {
  const [currentLoad, setCurrentLoad] = useState('');
  const [loadWeightKg, setLoadWeightKg] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      await api.post(`/vehicles/${vehicle._id}/load`, {
        currentLoad,
        loadWeightKg: Number(loadWeightKg) || 0
      });
      onSuccess();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to load cargo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="code-modal-backdrop" onClick={onClose}>
      <div className="code-modal-card cargo-modal" onClick={e => e.stopPropagation()}>
        <div className="code-modal-header">
          <div className="code-modal-title">
            <Package size={22} className="code-modal-icon" style={{ color: '#10b981' }} />
            <div>
              <h3>Newly Load Vehicle: {vehicle.registrationNumber}</h3>
              <p>Assign new cargo consignment details for the next trip</p>
            </div>
          </div>
          <button className="code-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="cargo-form">
          <div className="form-group">
            <label>Cargo Description / Load Details</label>
            <input 
              type="text" 
              placeholder="e.g. Electronics, Perishable Goods, Construction Supplies" 
              value={currentLoad} 
              onChange={e => setCurrentLoad(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Cargo Weight (kg)</label>
            <input 
              type="number" 
              min="0" 
              step="0.1" 
              placeholder="e.g. 450" 
              value={loadWeightKg} 
              onChange={e => setLoadWeightKg(e.target.value)} 
            />
          </div>

          {err && <div className="error">{err}</div>}

          <div className="cargo-form-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary" disabled={loading}>
              <UploadCloud size={16} />
              <span>{loading ? 'Loading Cargo...' : 'Confirm New Cargo Load'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DriverHome() {
  const [v, setV] = useState([]);
  const [t, setT] = useState([]);
  const [selectedLoadVehicle, setSelectedLoadVehicle] = useState(null);
  const currentUser = user();

  const load = () => {
    Promise.all([api.get('/vehicles'), api.get('/trips')])
      .then(([a, b]) => {
        setV(a.data || []);
        setT(b.data || []);
      })
      .catch(() => {
        setV([]);
        setT([]);
      });
  };

  useEffect(() => { load(); }, []);

  const deleteOwnProfile = async () => {
    if (!currentUser) return;
    const dId = currentUser.id || currentUser._id;
    if (window.confirm(`Are you sure you want to delete your driver profile (${currentUser.name})? This action will permanently remove your driver account.`)) {
      try {
        await api.delete(`/drivers/${dId}`);
        alert('Your driver profile account has been deleted successfully.');
        localStorage.clear();
        window.location.href = '/login';
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to delete driver profile');
      }
    }
  };

  return (
    <div>
      {/* Driver Profile Header Panel */}
      <div className="panel" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} style={{ color: '#2563eb' }} /> Driver Profile
            </h3>
            <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
              Logged in as <strong>{currentUser?.name || 'Driver'}</strong> ({currentUser?.email || 'driver'})
            </p>
          </div>
          <button 
            type="button"
            className="btn-action return-btn"
            onClick={deleteOwnProfile}
            title="Permanently delete your driver profile account"
            style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Trash2 size={15} /> Delete Profile Account
          </button>
        </div>
      </div>

      <section className="cards">
        <div className="card"><CarFront /><span>My Vehicles</span><strong>{v.length}</strong></div>
        <div className="card"><RouteIcon /><span>My Trips</span><strong>{t.length}</strong></div>
        <div className="card"><RouteIcon /><span>Total Distance</span><strong>{t.reduce((s, x) => s + (x.distanceKm || 0), 0)} km</strong></div>
      </section>

      <div className="panel">
        <h3>Assigned Vehicles & Cargo Status</h3>
        {v.length === 0 ? (
          <p className="muted">No vehicle currently assigned. Ask manager to assign a vehicle or pick from fleet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Registration</th>
                <th>Type</th>
                <th>Odometer</th>
                <th>Cargo / Load Details</th>
                <th>Load Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {v.map(x => (
                <tr key={x._id}>
                  <td><strong>{x.registrationNumber}</strong></td>
                  <td>{x.type}</td>
                  <td>{x.currentOdometer} km</td>
                  <td>
                    <span className="cargo-text">
                      <Box size={14} /> {x.currentLoad || 'Empty / Unloaded'}
                      {x.loadWeightKg > 0 && <small> ({x.loadWeightKg} kg)</small>}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${x.loadStatus === 'loaded' ? 'success' : 'secondary'}`}>
                      {x.loadStatus === 'loaded' ? '📦 Loaded' : '⚪ Unloaded'}
                    </span>
                  </td>
                  <td className="action-buttons">
                    <button 
                      className="btn-action load-btn"
                      onClick={() => setSelectedLoadVehicle(x)}
                      title="Load new cargo onto vehicle"
                    >
                      <Package size={14} /> Load Cargo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedLoadVehicle && (
        <LoadCargoModal 
          vehicle={selectedLoadVehicle}
          onClose={() => setSelectedLoadVehicle(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}

function Vehicles() {
  const [rows, setRows] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [show, setShow] = useState(false);
  const [selectedLoadVehicle, setSelectedLoadVehicle] = useState(null);
  const [form, setForm] = useState({ registrationNumber: '', type: '', purchaseDate: '', lastServiceDate: '', currentOdometer: 0 });
  const [msg, setMsg] = useState('');

  const load = () => Promise.all([api.get('/vehicles'), api.get('/drivers')])
    .then(([a, b]) => {
      setRows(a.data || []);
      setDrivers(b.data || []);
    })
    .catch(e => setMsg(e.response?.data?.message || 'Error loading vehicles'));

  useEffect(() => { load(); }, []);

  const add = async e => {
    e.preventDefault();
    try {
      await api.post('/vehicles', form);
      setForm({ registrationNumber: '', type: '', purchaseDate: '', lastServiceDate: '', currentOdometer: 0 });
      setShow(false);
      load();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Error creating vehicle');
    }
  };

  const assign = async id => {
    const d = prompt('Enter driver ID:\n' + drivers.map(x => `${x._id} - ${x.name}`).join('\n'));
    if (d) {
      try {
        await api.post(`/vehicles/${id}/assign`, { driverId: d });
        load();
      } catch (e) {
        setMsg(e.response?.data?.message || 'Error assigning vehicle');
      }
    }
  };

  const unassign = async (id, regNum) => {
    if (window.confirm(`Unassign driver from vehicle ${regNum}?`)) {
      try {
        await api.post(`/vehicles/${id}/unassign`);
        load();
      } catch (e) {
        setMsg(e.response?.data?.message || 'Error unassigning vehicle');
      }
    }
  };

  return (
    <div>
      <div className="toolbar">
        {user()?.role !== 'driver' && (
          <button className="primary" onClick={() => setShow(!show)}>
            <Plus size={17} /> Add Vehicle
          </button>
        )}
      </div>
      {show && (
        <form className="panel formgrid" onSubmit={add}>
          <input placeholder="Registration number" value={form.registrationNumber} onChange={e => setForm({ ...form, registrationNumber: e.target.value })} required />
          <input placeholder="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required />
          <input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} required />
          <input type="date" value={form.lastServiceDate} onChange={e => setForm({ ...form, lastServiceDate: e.target.value })} required />
          <input type="number" placeholder="Odometer" value={form.currentOdometer} onChange={e => setForm({ ...form, currentOdometer: Number(e.target.value) })} />
          <button className="primary">Save Vehicle</button>
        </form>
      )}
      <div className="panel">
        <h3>Vehicles Fleet</h3>
        {msg && <div className="success-banner"><CheckCircle2 size={16} /> {msg}</div>}
        <table>
          <thead>
            <tr>
              <th>Registration</th>
              <th>Type</th>
              <th>Odometer</th>
              <th>Cargo / Load Details</th>
              <th>Load Status</th>
              <th>Driver</th>
              <th>Vehicle Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(x => (
              <tr key={x._id}>
                <td><strong>{x.registrationNumber}</strong></td>
                <td>{x.type}</td>
                <td>{x.currentOdometer} km</td>
                <td>
                  <span className="cargo-text">
                    <Box size={14} /> {x.currentLoad || 'Empty / Unloaded'}
                    {x.loadWeightKg > 0 && <small> ({x.loadWeightKg} kg)</small>}
                  </span>
                </td>
                <td>
                  <span className={`badge ${x.loadStatus === 'loaded' ? 'success' : 'secondary'}`}>
                    {x.loadStatus === 'loaded' ? '📦 Loaded' : '⚪ Unloaded'}
                  </span>
                </td>
                <td>{x.assignedDriver?.name || '—'}</td>
                <td>
                  <span className={`badge ${x.status === 'assigned' ? 'info' : x.status === 'maintenance' ? 'warn' : 'primary'}`}>
                    {x.status === 'maintenance' ? '🔧 Maintenance' : x.status}
                  </span>
                </td>
                <td className="action-buttons">
                  {user()?.role !== 'driver' && (
                    <>
                      <button className="btn-action small" onClick={() => assign(x._id)}>Assign</button>
                      {x.assignedDriver && (
                        <button className="btn-action return-btn small" onClick={() => unassign(x._id, x.registrationNumber)}>Unassign</button>
                      )}
                    </>
                  )}
                  <button 
                    className="btn-action load-btn small" 
                    onClick={() => setSelectedLoadVehicle(x)}
                    title="Load new cargo onto vehicle"
                  >
                    <Package size={13} /> Load Cargo
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLoadVehicle && (
        <LoadCargoModal 
          vehicle={selectedLoadVehicle}
          onClose={() => setSelectedLoadVehicle(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}

function Drivers() {
  const [rows, setRows] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: 'Driver@123' });

  const load = () => api.get('/drivers').then(r => setRows(r.data || [])).catch(() => setRows([]));
  useEffect(() => { load(); }, []);

  const add = async e => {
    e.preventDefault();
    try {
      await api.post('/drivers', form);
      setShow(false);
      setForm({ name: '', email: '', phone: '', password: 'Driver@123' });
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to add driver');
    }
  };

  const removeDriver = async (id, name) => {
    if (!id) return;
    if (window.confirm(`Are you sure you want to delete driver "${name}"? This action will remove the driver account and unassign any associated vehicles.`)) {
      try {
        await api.delete(`/drivers/${id}`);
        setRows(prev => prev.filter(d => d._id !== id && d.id !== id && String(d._id || d.id) !== String(id)));
        load();
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to delete driver');
      }
    }
  };

  return (
    <div>
      <button className="primary" onClick={() => setShow(!show)}><Plus size={17} /> Add Driver</button>
      {show && (
        <form className="panel formgrid" onSubmit={add}>
          <input placeholder="Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <button className="primary">Create Driver</button>
        </form>
      )}
      <div className="panel">
        <h3>Drivers Directory</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Assigned Vehicle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(x => {
              const driverId = x._id || x.id;
              return (
                <tr key={driverId}>
                  <td><strong>{x.name}</strong></td>
                  <td>{x.email}</td>
                  <td>{x.phone || '—'}</td>
                  <td>{x.assignedVehicle || '—'}</td>
                  <td className="action-buttons">
                    <button 
                      type="button"
                      className="btn-action return-btn small" 
                      onClick={() => removeDriver(driverId, x.name)}
                      title="Delete driver account"
                    >
                      <Trash2 size={13} /> Delete Driver
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Trips() {
  const [rows, setRows] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    vehicle: '',
    startLocation: '',
    endLocation: '',
    startTime: '',
    endTime: '',
    distanceKm: '',
    fuelUsedLitres: '',
    cargoDetails: '',
    notes: ''
  });

  const load = () => Promise.all([api.get('/trips'), api.get('/vehicles')])
    .then(([a, b]) => {
      setRows(a.data || []);
      setVehicles(b.data || []);
      if (!form.vehicle && b.data?.[0]) {
        const first = b.data[0];
        setForm(f => ({
          ...f,
          vehicle: first._id,
          cargoDetails: first.currentLoad && first.currentLoad !== 'Empty / Unloaded' ? `${first.currentLoad} (${first.loadWeightKg || 0} kg)` : ''
        }));
      }
    })
    .catch(() => {
      setRows([]);
      setVehicles([]);
    });

  useEffect(() => { load(); }, []);

  const handleVehicleSelect = (vId) => {
    const found = vehicles.find(v => v._id === vId);
    setForm(f => ({
      ...f,
      vehicle: vId,
      cargoDetails: found && found.currentLoad && found.currentLoad !== 'Empty / Unloaded' ? `${found.currentLoad} (${found.loadWeightKg || 0} kg)` : f.cargoDetails
    }));
  };

  const add = async e => {
    e.preventDefault();
    try {
      await api.post('/trips', form);
      setShow(false);
      setForm({
        vehicle: vehicles[0]?._id || '',
        startLocation: '',
        endLocation: '',
        startTime: '',
        endTime: '',
        distanceKm: '',
        fuelUsedLitres: '',
        cargoDetails: '',
        notes: ''
      });
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to log trip');
    }
  };

  return (
    <div>
      <button className="primary" onClick={() => setShow(!show)}>
        <Plus size={17} /> Log Trip & Complete
      </button>
      {show && (
        <form className="panel formgrid trip-form" onSubmit={add}>
          <div className="form-group-full">
            <label>Select Vehicle</label>
            <select value={form.vehicle} onChange={e => handleVehicleSelect(e.target.value)} required>
              <option value="">Select Vehicle</option>
              {vehicles.map(v => (
                <option key={v._id} value={v._id}>
                  {v.registrationNumber} ({v.type}) {v.loadStatus === 'loaded' ? `- Cargo: ${v.currentLoad}` : ''}
                </option>
              ))}
            </select>
          </div>

          <input placeholder="Start location" required value={form.startLocation} onChange={e => setForm({ ...form, startLocation: e.target.value })} />
          <input placeholder="End location" required value={form.endLocation} onChange={e => setForm({ ...form, endLocation: e.target.value })} />
          <input type="datetime-local" required value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
          <input type="datetime-local" required value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
          <input type="number" min="0" step="0.1" placeholder="Distance km" required value={form.distanceKm} onChange={e => setForm({ ...form, distanceKm: e.target.value })} />
          <input type="number" min="0" step="0.1" placeholder="Fuel litres" required value={form.fuelUsedLitres} onChange={e => setForm({ ...form, fuelUsedLitres: e.target.value })} />
          <input placeholder="Cargo / Load Details (e.g. 500kg Electronics)" value={form.cargoDetails} onChange={e => setForm({ ...form, cargoDetails: e.target.value })} />
          <input placeholder="Trip Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />

          <button className="primary submit-trip-btn">
            <CheckCircle2 size={16} />
            <span>Log Trip (Auto-Completes & Unloads Vehicle)</span>
          </button>
        </form>
      )}
      <div className="panel">
        <h3>Trip History & Cargo Log</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Driver</th>
              <th>Vehicle</th>
              <th>Cargo / Load Details</th>
              <th>Route</th>
              <th>Distance</th>
              <th>Fuel</th>
              <th>Trip Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(x => (
              <tr key={x._id}>
                <td>{x.startTime ? new Date(x.startTime).toLocaleDateString() : '—'}</td>
                <td>{x.driver?.name || '—'}</td>
                <td><strong>{x.vehicle?.registrationNumber || '—'}</strong></td>
                <td>
                  <span className="cargo-text">
                    <Package size={14} /> {x.cargoDetails || 'Standard Freight'}
                  </span>
                </td>
                <td>{x.startLocation} → {x.endLocation}</td>
                <td>{x.distanceKm} km</td>
                <td>{x.fuelUsedLitres} L</td>
                <td>
                  <span className="badge success"><CheckCircle2 size={12} /> Completed</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Maintenance() {
  const [rows, setRows] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');
  const [viewMode, setViewMode] = useState('active'); // 'active' (default) or 'all'
  const [form, setForm] = useState({ vehicle: '', serviceDate: '', serviceType: '', cost: '', nextServiceDate: '', notes: '' });

  const load = () => {
    api.get('/maintenance')
      .then(a => setRows(a.data || []))
      .catch(() => setRows([]));

    api.get('/vehicles')
      .then(b => setVehicles(b.data || []))
      .catch(() => setVehicles([]));
  };

  useEffect(() => { load(); }, []);

  const add = async e => {
    e.preventDefault();
    try {
      if (!form.vehicle || !form.serviceDate || !form.serviceType || form.cost === '' || form.cost === null || !form.nextServiceDate) {
        alert('Please fill in all required maintenance fields.');
        return;
      }
      const payload = {
        ...form,
        cost: Number(form.cost)
      };
      const res = await api.post('/maintenance', payload);
      setShow(false);
      setMsg('Service recorded and vehicle placed under maintenance');
      setForm({ vehicle: '', serviceDate: '', serviceType: '', cost: '', nextServiceDate: '', notes: '' });
      
      // Dynamic local state update without page reload
      if (res.data) {
        const selectedVId = form.vehicle;
        const targetVehicle = vehicles.find(v => (v._id === selectedVId || v.id === selectedVId || String(v._id || v.id) === String(selectedVId)));
        const newRecord = {
          ...res.data,
          vehicle: res.data.vehicle || targetVehicle || { _id: selectedVId, registrationNumber: targetVehicle?.registrationNumber || 'Vehicle' }
        };
        setRows(prev => [newRecord, ...prev]);
        setVehicles(prev => prev.map(v => (v._id === selectedVId || v.id === selectedVId || String(v._id || v.id) === String(selectedVId)) ? { ...v, status: 'maintenance' } : v));
      }
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save maintenance record');
    }
  };

  const releaseMaintenance = async (maintId, regNum) => {
    try {
      const res = await api.post(`/maintenance/${maintId}/release`);
      setMsg(res.data?.message || `Vehicle ${regNum} successfully released from maintenance and removed from active queue`);
      
      // Dynamic local state update without page reload
      setRows(prev => prev.map(x => (x._id === maintId || x.id === maintId || String(x._id || x.id) === String(maintId)) ? { ...x, status: 'released' } : x));
      if (res.data?.vehicle) {
        const releasedVId = res.data.vehicle._id || res.data.vehicle.id;
        setVehicles(prev => prev.map(v => (v._id === releasedVId || v.id === releasedVId || String(v._id || v.id) === String(releasedVId)) ? { ...v, status: 'available' } : v));
      }
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to release vehicle from maintenance');
    }
  };

  // Filter maintenance records based on release status
  const filteredRows = rows.filter(x => {
    if (viewMode === 'active') {
      return x.status !== 'released';
    }
    return true;
  });

  const activeCount = rows.filter(x => x.status !== 'released').length;

  return (
    <div>
      <div className="toolbar">
        <button type="button" className="primary" onClick={() => setShow(!show)}>
          <Plus size={17} /> Record Service
        </button>
      </div>
      {msg && <div className="success-banner"><CheckCircle2 size={16} /> {msg}</div>}
      {show && (
        <form className="panel formgrid" onSubmit={add}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Select Vehicle for Maintenance</label>
            <select value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#f8fafc' }}>
              <option value="">-- Select Vehicle --</option>
              {vehicles.map(v => (
                <option key={v._id || v.id} value={v._id || v.id}>
                  {v.registrationNumber} ({v.type}) {v.status === 'maintenance' ? '🔧 [Currently in Maintenance]' : '✅ [Available]'}
                </option>
              ))}
            </select>
          </div>
          <input type="date" required value={form.serviceDate} onChange={e => setForm({ ...form, serviceDate: e.target.value })} />
          <input placeholder="Service type (e.g. Engine Oil, Brake Inspection)" required value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value })} />
          <input type="number" min="0" placeholder="Cost (₹)" required value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
          <input type="date" required value={form.nextServiceDate} onChange={e => setForm({ ...form, nextServiceDate: e.target.value })} />
          <input placeholder="Service Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <button type="submit" className="primary">Save & Record Service</button>
        </form>
      )}
      <div className="panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ margin: 0 }}>Maintenance Queue & History</h3>
          <div className="code-modal-tabs" style={{ background: 'transparent', padding: 0, border: 'none' }}>
            <button 
              type="button"
              className={`code-tab ${viewMode === 'active' ? 'active' : ''}`}
              onClick={() => setViewMode('active')}
            >
              <span>Active Maintenance ({activeCount})</span>
            </button>
            <button 
              type="button"
              className={`code-tab ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
            >
              <span>All History ({rows.length})</span>
            </button>
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <p className="muted" style={{ padding: '16px 0' }}>
            {viewMode === 'active' ? '🎉 No vehicles currently in active maintenance! All vehicles released and operational.' : 'No maintenance records found.'}
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Service Date</th>
                <th>Service Type</th>
                <th>Cost</th>
                <th>Next Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(x => {
                const isReleased = x.status === 'released';
                const mId = x._id || x.id;
                
                return (
                  <tr key={mId}>
                    <td><strong>{x.vehicle?.registrationNumber || '—'}</strong></td>
                    <td>
                      <span className={`badge ${!isReleased ? 'warn' : 'success'}`}>
                        {!isReleased ? '🔧 In Maintenance' : '✅ Released & Available'}
                      </span>
                    </td>
                    <td>{x.serviceDate ? new Date(x.serviceDate).toLocaleDateString() : '—'}</td>
                    <td>{x.serviceType}</td>
                    <td>₹{(x.cost || 0).toLocaleString()}</td>
                    <td>{x.nextServiceDate ? new Date(x.nextServiceDate).toLocaleDateString() : '—'}</td>
                    <td className="action-buttons">
                      {!isReleased ? (
                        <button 
                          type="button"
                          className="btn-action load-btn small" 
                          onClick={() => releaseMaintenance(mId, x.vehicle?.registrationNumber || '')}
                          title="Release vehicle from maintenance back to available status"
                        >
                          <CheckCircle2 size={13} /> Release Vehicle
                        </button>
                      ) : (
                        <span className="muted" style={{ fontSize: '12px' }}>Released</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


function App() {
  const currentUser = user();

  return (
    <Routes>
      {/* Home page: shows login if not authenticated, dashboard if authenticated */}
      <Route path="/" element={<Home />} />
      
      {/* Login explicit route (redirects to home if already logged in) */}
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
      
      {/* Protected dashboard and sub-routes */}
      <Route
        path="/dashboard"
        element={
          <Protected>
            <Layout>
              <Dashboard />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/vehicles"
        element={
          <Protected>
            <Layout>
              <Vehicles />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/drivers"
        element={
          <Protected roles={['admin', 'manager']}>
            <Layout>
              <Drivers />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/trips"
        element={
          <Protected>
            <Layout>
              <Trips />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/maintenance"
        element={
          <Protected roles={['admin', 'manager']}>
            <Layout>
              <Maintenance />
            </Layout>
          </Protected>
        }
      />
    </Routes>
  );
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
