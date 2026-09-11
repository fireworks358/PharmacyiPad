import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  MapPin,
  PackageSearch,
  RefreshCw,
  Search,
  WifiOff,
  X,
} from 'lucide-react';
import { isFirebaseConfigured } from './lib/firebase';
import { formatDrugLocation, matchesDrugSearch, sortDrugsByName } from './lib/search';
import {
  readCatalogCache,
  loadCatalog,
  submitIssueReport,
  writeCatalogCache,
} from './services/catalog';

function useCatalogue() {
  const cached = useMemo(() => readCatalogCache(), []);
  const [drugs, setDrugs] = useState(cached ? cached.drugs : []);
  const [locations, setLocations] = useState(cached ? cached.locations : []);
  const [loading, setLoading] = useState(!cached && isFirebaseConfigured);
  const [fromCache, setFromCache] = useState(Boolean(cached));
  const [error, setError] = useState(
    isFirebaseConfigured ? '' : 'This portal has not been connected to Firebase yet.',
  );
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return undefined;
    }

    let cancelled = false;
    loadCatalog().then((catalogue) => {
      if (!cancelled) {
        setDrugs(catalogue.drugs);
        setLocations(catalogue.locations);
        setFromCache(false);
        setLoading(false);
        setError('');
        writeCatalogCache(catalogue.drugs, catalogue.locations);
      }
    }).catch(() => {
      if (!cancelled) {
        setLoading(false);
        setFromCache(true);
        setError(
          cached
            ? 'Could not refresh. Showing the last saved catalogue.'
            : 'Could not load the catalogue. Check the connection and try again.',
        );
      }
    });
    return () => { cancelled = true; };
  }, [cached, refreshVersion]);

  const refresh = () => {
    setLoading(true);
    setRefreshVersion((version) => version + 1);
  };
  return { drugs, locations, loading, fromCache, error, refresh };
}

function StatusPill({ fromCache, online, onRefresh }) {
  const offline = fromCache || !online;
  return (
    <button type="button" className={`portal-status ${offline ? 'portal-status--offline' : ''}`} onClick={onRefresh} title="Refresh catalogue">
      {offline ? <WifiOff size={18} /> : <CheckCircle2 size={18} />}
      <span>{offline ? 'Saved copy' : 'Up to date'}</span>
    </button>
  );
}

function DrugDetails({ drug, onClose, onReport }) {
  return (
    <div className="portal-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="portal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drug-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="portal-close" type="button" onClick={onClose} aria-label="Close">
          <X size={30} />
        </button>
        <p className="portal-eyebrow">Drug location</p>
        <h2 id="drug-title">{drug.displayName}</h2>
        {drug.aliases && drug.aliases.length > 0 && (
          <p className="portal-aliases">Also known as {drug.aliases.join(', ')}</p>
        )}

        <div className="portal-location-block">
          <MapPin size={42} aria-hidden="true" />
          <strong>{drug.locationDisplay}</strong>
        </div>

        <dl className="portal-details-list">
          {drug.strength && <><dt>Strength</dt><dd>{drug.strength}</dd></>}
          {drug.form && <><dt>Form</dt><dd>{drug.form}</dd></>}
          {drug.route && <><dt>Type / route</dt><dd>{drug.route}</dd></>}
          {drug.notes && <><dt>Notes</dt><dd>{drug.notes}</dd></>}
        </dl>

        {drug.stockStatus === 'out_of_stock' && (
          <div className="portal-warning">
            <AlertTriangle size={22} />
            <span>Marked out of stock</span>
          </div>
        )}

        <div className="portal-report-actions">
          <p>Something not right?</p>
          <button type="button" onClick={() => onReport('missing')}>Report missing</button>
          <button type="button" onClick={() => onReport('wrong_location')}>Report wrong location</button>
        </div>
      </section>
    </div>
  );
}

function ReportDialog({ drug, issueType, onClose, onSubmitted }) {
  const [suggestedLocation, setSuggestedLocation] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isWrongLocation = issueType === 'wrong_location';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await submitIssueReport({ drug, issueType, suggestedLocation, comment });
      onSubmitted();
    } catch {
      setError('The report could not be sent. Check the connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="portal-overlay portal-overlay--front" role="presentation">
      <form className="portal-report-dialog" onSubmit={handleSubmit}>
        <button className="portal-close" type="button" onClick={onClose} aria-label="Close">
          <X size={28} />
        </button>
        <p className="portal-eyebrow">Send a report</p>
        <h2>{isWrongLocation ? 'Wrong location' : 'Drug missing'}</h2>
        <p className="portal-report-summary">
          {drug.displayName} is currently listed at <strong>{drug.locationDisplay}</strong>.
        </p>

        {isWrongLocation && (
          <label>
            Where did you find it? <span>(optional)</span>
            <input
              value={suggestedLocation}
              onChange={(event) => setSuggestedLocation(event.target.value)}
              maxLength={120}
              placeholder="For example, Drawer B4"
            />
          </label>
        )}

        <label>
          Extra detail <span>(optional — do not include patient information)</span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={500}
            rows={3}
          />
        </label>

        {error && <p className="portal-form-error" role="alert">{error}</p>}
        <button className="portal-primary-button" type="submit" disabled={saving}>
          {saving ? 'Sending…' : 'Send report'}
        </button>
        <button className="portal-secondary-button" type="button" onClick={onClose} disabled={saving}>
          Cancel
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const { drugs, locations, loading, fromCache, error, refresh } = useCatalogue();
  const [query, setQuery] = useState('');
  const [activeRoute, setActiveRoute] = useState('all');
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [reportType, setReportType] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const searchInput = useRef(null);
  const inactivityTimer = useRef(null);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const resetToSearch = () => {
      setQuery('');
      setActiveRoute('all');
      setReportType('');
      setSelectedDrug(null);
      setReportSent(false);
      window.scrollTo({ top: 0, behavior: 'auto' });
      window.requestAnimationFrame(() => searchInput.current?.focus());
    };

    const restartInactivityTimer = () => {
      window.clearTimeout(inactivityTimer.current);
      inactivityTimer.current = window.setTimeout(resetToSearch, 30000);
    };

    const activityEvents = ['pointerdown', 'keydown', 'touchstart', 'input', 'wheel', 'scroll'];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, restartInactivityTimer, { passive: true });
    });
    restartInactivityTimer();

    return () => {
      window.clearTimeout(inactivityTimer.current);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, restartInactivityTimer);
      });
    };
  }, []);

  const locationsById = useMemo(() => locations.reduce((index, location) => {
    index[location.id] = location;
    return index;
  }, {}), [locations]);

  const routes = useMemo(
    () => [...new Set(drugs.map((drug) => drug.route).filter(Boolean))].sort(),
    [drugs],
  );

  const results = useMemo(() => sortDrugsByName(
    drugs
      .filter((drug) => activeRoute === 'all' || drug.route === activeRoute)
      .filter((drug) => matchesDrugSearch(drug, query, locationsById))
      .map((drug) => ({
        ...drug,
        locationDisplay: formatDrugLocation(drug, locationsById),
      })),
  ), [activeRoute, drugs, locationsById, query]);

  const closeAll = () => {
    setReportType('');
    setSelectedDrug(null);
  };

  const reportSubmitted = () => {
    closeAll();
    setReportSent(true);
    window.setTimeout(() => setReportSent(false), 5000);
  };

  return (
    <div className="portal-app">
      <header className="portal-header">
        <div className="portal-header__inner">
          <div className="portal-brand">
            <img src={`${import.meta.env.BASE_URL}Logo.png`} alt="Pharmacy" />
            <div>
              <span>Pharmacy</span>
              <strong>Drug finder</strong>
            </div>
          </div>
          <StatusPill fromCache={fromCache} online={online} onRefresh={refresh} />
        </div>
        <div className="portal-header__search">
          <label htmlFor="drug-search">What are you looking for?</label>
          <div className="portal-search-box" onClick={() => searchInput.current?.focus()}>
            <Search size={34} aria-hidden="true" />
            <input
              ref={searchInput}
              id="drug-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Drug name, brand or location"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
                <X size={30} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="portal-main">
        <section className="portal-search-section">
          <div className="portal-filter-row" aria-label="Filter by type">
            <button
              type="button"
              className={activeRoute === 'all' ? 'is-active' : ''}
              onClick={() => setActiveRoute('all')}
            >
              All
            </button>
            {routes.map((route) => (
              <button
                type="button"
                key={route}
                className={activeRoute === route ? 'is-active' : ''}
                onClick={() => setActiveRoute(route)}
              >
                {route}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="portal-error" role="alert">
            <AlertTriangle size={22} />
            <span>{error}</span>
          </div>
        )}

        <div className="portal-results-heading">
          <strong>{loading ? 'Loading catalogue…' : `${results.length} result${results.length === 1 ? '' : 's'}`}</strong>
          {!loading && <span>Tap a drug to see details</span>}
        </div>

        {!loading && results.length === 0 ? (
          <div className="portal-empty">
            <PackageSearch size={58} />
            <h2>No matching drugs</h2>
            <p>Try a brand name, generic name, or clear the type filter.</p>
            <button type="button" onClick={() => { setQuery(''); setActiveRoute('all'); }}>
              Reset search
            </button>
          </div>
        ) : (
          <div className="portal-results">
            {results.map((drug) => (
              <button className="portal-drug-card" type="button" key={drug.id} onClick={() => setSelectedDrug(drug)}>
                <span className="portal-drug-card__main">
                  <strong>{drug.displayName}</strong>
                  {drug.aliases && drug.aliases.length > 0 && <small>{drug.aliases.join(' · ')}</small>}
                  <span className="portal-drug-card__location">
                    <MapPin size={28} />
                    <b>{drug.locationDisplay}</b>
                  </span>
                </span>
                <span className="portal-drug-card__meta">
                  {drug.route && <small>{drug.route}</small>}
                  {drug.stockStatus === 'out_of_stock' && <em>Out of stock</em>}
                  <ChevronRight size={34} />
                </span>
              </button>
            ))}
          </div>
        )}
      </main>

      {selectedDrug && !reportType && (
        <DrugDetails drug={selectedDrug} onClose={() => setSelectedDrug(null)} onReport={setReportType} />
      )}
      {selectedDrug && reportType && (
        <ReportDialog drug={selectedDrug} issueType={reportType} onClose={() => setReportType('')} onSubmitted={reportSubmitted} />
      )}
      {reportSent && (
        <div className="portal-toast" role="status">
          <CheckCircle2 size={24} />
          <span>Report sent to the pharmacy team</span>
        </div>
      )}
      {loading && <div className="portal-loading" aria-label="Loading"><RefreshCw size={42} /></div>}
    </div>
  );
}
