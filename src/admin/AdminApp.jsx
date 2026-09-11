import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  Check,
  Download,
  Edit3,
  LogOut,
  MapPinned,
  Package,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { isFirebaseConfigured } from '../lib/firebase';
import { normalizeSearchValue } from '../lib/search';
import {
  loginAdmin,
  logoutAdmin,
  saveDrug,
  saveLocation,
  setDrugStatus,
  setLocationStatus,
  subscribeToAdminData,
  updateReportStatus,
  verifyAdmin,
  watchAuth,
} from '../services/admin';

function Login({ error, onLogin, busy }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={(event) => { event.preventDefault(); onLogin(email, password); }}>
        <div className="admin-login-logo"><ShieldCheck size={36} /></div>
        <p className="admin-kicker">Staff access</p>
        <h1>Pharmacy catalogue</h1>
        <p>Sign in with your staff Email/Password account.</p>
        <label>Email address<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" /></label>
        <label>Password<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
        {error && <div className="admin-alert" role="alert"><AlertCircle size={19} />{error}</div>}
        <button className="admin-primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Close"><X size={23} /></button></header>
        {children}
      </section>
    </div>
  );
}

function DrugForm({ drug, locations, user, onClose, onSaved }) {
  const [values, setValues] = useState(() => ({
    displayName: drug ? drug.displayName : '',
    aliasesText: drug ? (drug.aliases || []).join('\n') : '',
    strength: drug ? drug.strength || '' : '',
    form: drug ? drug.form || '' : '',
    route: drug ? drug.route || '' : '',
    locationIds: drug ? drug.locationIds || [] : [],
    locationNote: drug ? drug.locationNote || '' : '',
    notes: drug ? drug.notes || '' : '',
    stockStatus: drug ? drug.stockStatus || 'in_stock' : 'in_stock',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const change = (field, value) => setValues((current) => ({ ...current, [field]: value }));
  const toggleLocation = (id) => change(
    'locationIds',
    values.locationIds.indexOf(id) === -1
      ? [...values.locationIds, id]
      : values.locationIds.filter((value) => value !== id),
  );

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await saveDrug({
        ...values,
        aliases: values.aliasesText.split(/[\n,]/),
      }, drug, user);
      onSaved();
    } catch (caught) {
      setError(caught.message || 'Could not save this drug.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-form" onSubmit={submit}>
      <div className="admin-form-grid">
        <label className="admin-span-2">Drug name *<input required maxLength={160} value={values.displayName} onChange={(event) => change('displayName', event.target.value)} /></label>
        <label className="admin-span-2">Aliases <span>one per line or comma separated</span><textarea rows={3} maxLength={800} value={values.aliasesText} onChange={(event) => change('aliasesText', event.target.value)} /></label>
        <label>Strength<input maxLength={80} value={values.strength} onChange={(event) => change('strength', event.target.value)} /></label>
        <label>Form<input maxLength={80} value={values.form} onChange={(event) => change('form', event.target.value)} placeholder="Ampoule, tablet…" /></label>
        <label>Type / route<input maxLength={80} value={values.route} onChange={(event) => change('route', event.target.value)} placeholder="IV, oral…" /></label>
        <label>Stock status<select value={values.stockStatus} onChange={(event) => change('stockStatus', event.target.value)}><option value="in_stock">In stock</option><option value="out_of_stock">Out of stock</option></select></label>
        <fieldset className="admin-span-2"><legend>Locations</legend><div className="admin-checkbox-grid">
          {locations.filter((location) => location.status === 'active').map((location) => (
            <label key={location.id}><input type="checkbox" checked={values.locationIds.indexOf(location.id) !== -1} onChange={() => toggleLocation(location.id)} />{location.label}</label>
          ))}
          {locations.length === 0 && <p>Add a location first.</p>}
        </div></fieldset>
        <label className="admin-span-2">Location detail<input maxLength={160} value={values.locationNote} onChange={(event) => change('locationNote', event.target.value)} placeholder="Optional extra directions" /></label>
        <label className="admin-span-2">Notes<textarea rows={3} maxLength={1000} value={values.notes} onChange={(event) => change('notes', event.target.value)} /></label>
      </div>
      {error && <div className="admin-alert"><AlertCircle size={18} />{error}</div>}
      <div className="admin-form-actions"><button type="button" onClick={onClose}>Cancel</button><button className="admin-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save drug'}</button></div>
    </form>
  );
}

function LocationForm({ location, user, onClose, onSaved }) {
  const [label, setLabel] = useState(location ? location.label : '');
  const [area, setArea] = useState(location ? location.area || '' : '');
  const [sortOrder, setSortOrder] = useState(location ? location.sortOrder || 0 : 0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await saveLocation({ label, area, sortOrder }, location, user);
      onSaved();
    } catch (caught) {
      setError(caught.message || 'Could not save this location.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-form" onSubmit={submit}>
      <label>Location label *<input required maxLength={120} value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Drawer A3" /></label>
      <label>Area <span>optional grouping</span><input maxLength={80} value={area} onChange={(event) => setArea(event.target.value)} placeholder="Main theatre" /></label>
      <label>Sort order<input type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} /></label>
      {error && <div className="admin-alert"><AlertCircle size={18} />{error}</div>}
      <div className="admin-form-actions"><button type="button" onClick={onClose}>Cancel</button><button className="admin-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save location'}</button></div>
    </form>
  );
}

function DrugManager({ drugs, locations, user, onError }) {
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState(undefined);
  const locationsById = useMemo(() => Object.fromEntries(locations.map((location) => [location.id, location])), [locations]);
  const filtered = drugs.filter((drug) => {
    if (!showArchived && drug.status === 'archived') return false;
    const haystack = normalizeSearchValue([drug.displayName, ...(drug.aliases || []), drug.route, drug.strength].join(' '));
    return haystack.indexOf(normalizeSearchValue(search)) !== -1;
  });

  const changeStatus = async (drug) => {
    const next = drug.status === 'archived' ? 'active' : 'archived';
    if (next === 'archived' && !window.confirm(`Archive ${drug.displayName}? It will disappear from the iPad but can be restored.`)) return;
    try { await setDrugStatus(drug, next, user); } catch (caught) { onError(caught.message); }
  };

  const exportCsv = () => {
    const quote = (value) => `"${String(value || '').replace(/"/g, '""')}"`;
    const header = ['Name', 'Aliases', 'Strength', 'Form', 'Route', 'Locations', 'Notes', 'Stock status', 'Record status'];
    const rows = drugs.map((drug) => [
      drug.displayName,
      (drug.aliases || []).join('; '),
      drug.strength,
      drug.form,
      drug.route,
      (drug.locationIds || []).map((id) => locationsById[id] ? locationsById[id].label : id).join('; '),
      drug.notes,
      drug.stockStatus,
      drug.status,
    ]);
    const blob = new Blob([[header, ...rows].map((row) => row.map(quote).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pharmacy-catalogue-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <section>
      <div className="admin-toolbar">
        <div className="admin-search"><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search drugs and aliases" /></div>
        <label className="admin-toggle"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />Show archived</label>
        <button type="button" onClick={exportCsv}><Download size={18} />Export CSV</button>
        <button className="admin-primary" type="button" onClick={() => setEditing(null)}><Plus size={18} />Add drug</button>
      </div>
      <div className="admin-table-wrap"><table><thead><tr><th>Drug</th><th>Location</th><th>Type / route</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
        {filtered.map((drug) => (
          <tr key={drug.id} className={drug.status === 'archived' ? 'is-archived' : ''}>
            <td><strong>{drug.displayName}</strong>{drug.aliases && drug.aliases.length > 0 && <small>{drug.aliases.join(', ')}</small>}</td>
            <td>{(drug.locationIds || []).map((id) => locationsById[id] ? locationsById[id].label : 'Unknown').join(', ') || '—'}</td>
            <td>{drug.route || '—'}</td>
            <td><span className={`admin-badge ${drug.status === 'archived' ? 'admin-badge--grey' : drug.stockStatus === 'out_of_stock' ? 'admin-badge--red' : 'admin-badge--green'}`}>{drug.status === 'archived' ? 'Archived' : drug.stockStatus === 'out_of_stock' ? 'Out of stock' : 'Active'}</span></td>
            <td className="admin-row-actions"><button type="button" onClick={() => setEditing(drug)} title="Edit"><Edit3 size={18} /></button><button type="button" onClick={() => changeStatus(drug)} title={drug.status === 'archived' ? 'Restore' : 'Archive'}>{drug.status === 'archived' ? <RotateCcw size={18} /> : <Archive size={18} />}</button></td>
          </tr>
        ))}
      </tbody></table></div>
      {editing !== undefined && <Modal title={editing ? `Edit ${editing.displayName}` : 'Add drug'} onClose={() => setEditing(undefined)}><DrugForm key={editing ? editing.id : 'new'} drug={editing} locations={locations} user={user} onClose={() => setEditing(undefined)} onSaved={() => setEditing(undefined)} /></Modal>}
    </section>
  );
}

function LocationManager({ locations, drugs, user, onError }) {
  const [editing, setEditing] = useState(undefined);
  const [showArchived, setShowArchived] = useState(false);
  const visible = locations.filter((location) => showArchived || location.status !== 'archived');
  const usageCount = (id) => drugs.filter((drug) => drug.status !== 'archived' && (drug.locationIds || []).indexOf(id) !== -1).length;
  const changeStatus = async (location) => {
    const next = location.status === 'archived' ? 'active' : 'archived';
    if (next === 'archived' && usageCount(location.id) > 0) {
      onError('Move active drugs away from this location before archiving it.');
      return;
    }
    if (next === 'archived' && !window.confirm(`Archive ${location.label}? It can be restored later.`)) return;
    try { await setLocationStatus(location, next, user); } catch (caught) { onError(caught.message); }
  };

  return (
    <section>
      <div className="admin-toolbar"><label className="admin-toggle"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />Show archived</label><button className="admin-primary" type="button" onClick={() => setEditing(null)}><Plus size={18} />Add location</button></div>
      <div className="admin-location-grid">{visible.map((location) => (
        <article key={location.id} className={location.status === 'archived' ? 'is-archived' : ''}>
          <MapPinned size={24} /><div><h3>{location.label}</h3><p>{location.area || 'No area set'} · {usageCount(location.id)} active drug{usageCount(location.id) === 1 ? '' : 's'}</p></div>
          <div><button type="button" onClick={() => setEditing(location)}><Edit3 size={17} />Edit</button><button type="button" onClick={() => changeStatus(location)}>{location.status === 'archived' ? <RotateCcw size={17} /> : <Archive size={17} />}{location.status === 'archived' ? 'Restore' : 'Archive'}</button></div>
        </article>
      ))}</div>
      {editing !== undefined && <Modal title={editing ? `Edit ${editing.label}` : 'Add location'} onClose={() => setEditing(undefined)}><LocationForm key={editing ? editing.id : 'new'} location={editing} user={user} onClose={() => setEditing(undefined)} onSaved={() => setEditing(undefined)} /></Modal>}
    </section>
  );
}

function ReportManager({ reports, user, onError }) {
  const open = reports.filter((report) => report.status === 'open');
  const closed = reports.filter((report) => report.status !== 'open');
  const update = async (report, status) => {
    const note = window.prompt(`Optional note for ${status === 'resolved' ? 'resolving' : 'dismissing'} this report:`, '') || '';
    try { await updateReportStatus(report, status, note, user); } catch (caught) { onError(caught.message); }
  };
  const formatDate = (timestamp) => timestamp && timestamp.toDate ? timestamp.toDate().toLocaleString() : 'Just now';
  const card = (report) => (
    <article className={`admin-report ${report.status !== 'open' ? 'admin-report--closed' : ''}`} key={report.id}>
      <div className="admin-report__top"><span className={`admin-badge ${report.issueType === 'missing' ? 'admin-badge--red' : 'admin-badge--amber'}`}>{report.issueType === 'missing' ? 'Missing' : 'Wrong location'}</span><time>{formatDate(report.createdAt)}</time></div>
      <h3>{report.drugNameSnapshot}</h3><p>Listed location: <strong>{report.locationSnapshot || 'Not recorded'}</strong></p>
      {report.suggestedLocation && <p>Suggested location: <strong>{report.suggestedLocation}</strong></p>}
      {report.comment && <blockquote>{report.comment}</blockquote>}
      {report.resolutionNote && <p className="admin-resolution">Resolution: {report.resolutionNote}</p>}
      {report.status === 'open' && <div className="admin-report__actions"><button className="admin-success" type="button" onClick={() => update(report, 'resolved')}><Check size={17} />Resolve</button><button type="button" onClick={() => update(report, 'dismissed')}><X size={17} />Dismiss</button></div>}
    </article>
  );
  return <section><h2 className="admin-section-title">Open reports <span>{open.length}</span></h2><div className="admin-report-grid">{open.length ? open.map(card) : <div className="admin-empty"><Check size={35} /><p>No open reports.</p></div>}</div>{closed.length > 0 && <><h2 className="admin-section-title admin-section-title--secondary">Recently closed</h2><div className="admin-report-grid">{closed.slice(0, 20).map(card)}</div></>}</section>;
}

function Dashboard({ user }) {
  const [tab, setTab] = useState('drugs');
  const [drugs, setDrugs] = useState([]);
  const [locations, setLocations] = useState([]);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => subscribeToAdminData({ onDrugs: setDrugs, onLocations: setLocations, onReports: setReports, onError: (caught) => setError(caught.message || 'Could not load data.') }), []);
  const openCount = reports.filter((report) => report.status === 'open').length;

  return (
    <div className="admin-app">
      <header className="admin-header"><div><img src={`${import.meta.env.BASE_URL}Logo.png`} alt="" /><span><small>Pharmacy</small><strong>Catalogue admin</strong></span></div><div><span className="admin-user">{user.email}</span><button type="button" onClick={logoutAdmin}><LogOut size={18} />Sign out</button></div></header>
      <nav className="admin-nav"><button className={tab === 'drugs' ? 'is-active' : ''} onClick={() => setTab('drugs')}><Package size={19} />Drugs <span>{drugs.filter((drug) => drug.status !== 'archived').length}</span></button><button className={tab === 'locations' ? 'is-active' : ''} onClick={() => setTab('locations')}><MapPinned size={19} />Locations <span>{locations.filter((location) => location.status !== 'archived').length}</span></button><button className={tab === 'reports' ? 'is-active' : ''} onClick={() => setTab('reports')}><AlertCircle size={19} />Reports {openCount > 0 && <span className="admin-count-alert">{openCount}</span>}</button></nav>
      <main className="admin-main">{error && <div className="admin-alert admin-alert--page"><AlertCircle size={19} />{error}<button onClick={() => setError('')}><X size={17} /></button></div>}{tab === 'drugs' && <DrugManager drugs={drugs} locations={locations} user={user} onError={setError} />}{tab === 'locations' && <LocationManager locations={locations} drugs={drugs} user={user} onError={setError} />}{tab === 'reports' && <ReportManager reports={reports} user={user} onError={setError} />}</main>
    </div>
  );
}

export default function AdminApp() {
  const [state, setState] = useState({ loading: true, user: null, error: '' });

  useEffect(() => watchAuth(async (user) => {
    if (!user) { setState({ loading: false, user: null, error: '' }); return; }
    try {
      const approved = await verifyAdmin(user);
      if (!approved) { await logoutAdmin(); setState({ loading: false, user: null, error: 'Sign in with an Email/Password staff account.' }); return; }
      setState({ loading: false, user, error: '' });
    } catch {
      setState({ loading: false, user: null, error: 'Could not verify staff access.' });
    }
  }), []);

  const login = async (email, password) => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try { await loginAdmin(email, password); } catch { setState({ loading: false, user: null, error: 'Email or password was not accepted.' }); }
  };

  if (!isFirebaseConfigured) return <Login busy={false} error="Firebase configuration is missing. See README.md before signing in." onLogin={() => {}} />;
  if (state.loading) return <div className="admin-splash"><ShieldCheck size={45} /><p>Checking access…</p></div>;
  if (!state.user) return <Login busy={state.loading} error={state.error} onLogin={login} />;
  return <Dashboard user={state.user} />;
}
