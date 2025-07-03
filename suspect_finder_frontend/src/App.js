import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

// PUBLIC_INTERFACE
/**
 * The main Suspect Finder App. Displays a modern, responsive detective UI with:
 * - Two-column layout (left: suspects/clues/lists, right: details/case narrative)
 * - Top header with navigation & theme toggle
 * - API integration for dynamic case content
 * - Search/filter for suspects and clues
 * - Highlighting twists/contradictions
 * - Responsive/accessible UX
 */
function App() {
  // App theme (light/dark)
  const [theme, setTheme] = useState('light');
  // Core data from the backend
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  // Search/filter terms
  const [suspectSearch, setSuspectSearch] = useState('');
  const [clueSearch, setClueSearch] = useState('');

  // UI state
  const [selectedSuspectId, setSelectedSuspectId] = useState(null);
  const [selectedClueId, setSelectedClueId] = useState(null);

  // Fetch all cases on first render
  useEffect(() => {
    // PUBLIC_INTERFACE
    /**
     * Fetch cases from backend API.
     */
    async function getCases() {
      try {
        const res = await fetch('/api/cases');
        if (!res.ok) throw new Error('Failed to fetch cases');
        const data = await res.json();
        setCases(data || []);
        if (data?.length) setSelectedCaseId(data[0].id);
      } catch (e) {
        setCases([]);
      }
    }
    getCases();
  }, []);

  // Find the current case based on selection
  const currentCase = useMemo(
    () => cases.find(c => c.id === selectedCaseId),
    [cases, selectedCaseId]
  );

  // Theme toggle logic
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Filters
  const filteredSuspects = useMemo(() => {
    if (!currentCase?.suspects) return [];
    return currentCase.suspects.filter(s => 
      s.name.toLowerCase().includes(suspectSearch.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(suspectSearch.toLowerCase()))
    );
  }, [currentCase, suspectSearch]);

  const filteredClues = useMemo(() => {
    if (!currentCase?.clues) return [];
    return currentCase.clues.filter(c =>
      c.description.toLowerCase().includes(clueSearch.toLowerCase()) ||
      (c.location && c.location.toLowerCase().includes(clueSearch.toLowerCase()))
    );
  }, [currentCase, clueSearch]);

  // Utility: get selected suspect/clue
  const selectedSuspect = useMemo(
    () => currentCase?.suspects?.find(s => s.id === selectedSuspectId),
    [currentCase, selectedSuspectId]
  );
  const selectedClue = useMemo(
    () => currentCase?.clues?.find(c => c.id === selectedClueId),
    [currentCase, selectedClueId]
  );

  // Utility: twists related to current case
  const caseTwists = useMemo(
    () => currentCase?.twists || [],
    [currentCase]
  );

  // Utility: highlight if a suspect or clue is referenced in a twist (contradiction)
  function isContradicted(entity, kind = 'suspect') {
    if (!caseTwists.length) return false;
    // Twist structure: { id, description, suspects:[], clues:[], ... }
    if (kind === 'suspect') {
      return caseTwists.some(t => t.suspects?.includes(entity.id));
    } else if (kind === 'clue') {
      return caseTwists.some(t => t.clues?.includes(entity.id));
    }
    return false;
  }

  // Handle selection logic (clearing the other side for clarity)
  function handleSelectSuspect(suspectId) {
    setSelectedSuspectId(suspectId);
    setSelectedClueId(null);
  }
  function handleSelectClue(clueId) {
    setSelectedClueId(clueId);
    setSelectedSuspectId(null);
  }

  // App brand color palette for CSS-in-JS/inline style
  const COLORS = {
    primary: '#060a0f',
    secondary: '#e00f00',
    accent: '#ffffff'
  };

  return (
    <div className="App" style={{ background: 'var(--bg-primary)' }}>
      {/* Header + Navigation */}
      <header className="sf-header" style={{
        backgroundColor: COLORS.primary,
        color: COLORS.accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        borderBottom: `3px solid ${COLORS.secondary}`,
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div className="sf-title" style={{ fontWeight: 'bold', fontSize: 24, letterSpacing: '0.03em', marginRight: 24 }}>
          Suspect Finder 🕵️
        </div>
        <nav className="sf-nav" style={{ display: 'flex', gap: 18 }}>
          <select
            className="sf-case-picker"
            aria-label="Select mystery case"
            value={selectedCaseId || ''}
            style={{
              borderRadius: 6, padding: '0.4em 1em', border: 'none', background: COLORS.primary, color: COLORS.accent,
              fontWeight: 500, outline: COLORS.secondary + ' solid 2px'
            }}
            onChange={e => {
              setSelectedCaseId(e.target.value);
              setSelectedClueId(null);
              setSelectedSuspectId(null);
            }}
          >
            {cases.map(cs => (
              <option value={cs.id} key={cs.id}>{cs.title || `Case #${cs.id}`}</option>
            ))}
          </select>
        </nav>
        {/* Theme toggle button */}
        <button
          className="theme-toggle"
          style={{ background: COLORS.secondary, color: COLORS.accent, borderRadius: 8, border: "none", padding: '0.5em 1em', cursor: 'pointer', fontWeight: 600 }}
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>
      {/* Main two-column layout: responsive */}
      <div className="sf-main" style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'center',
        width: '100%',
        minHeight: 'calc(100vh - 70px)',
        background: 'var(--bg-primary)',
        transition: 'all .3s'
      }}>
        {/* Left Column: Suspects & Clues (lists + filter/search) */}
        <aside className="sf-sidebar" style={{
          flex: '0 0 320px',
          maxWidth: 450,
          minWidth: 0,
          background: 'var(--bg-secondary)',
          borderRight: `1.5px solid ${COLORS.primary}`,
          padding: '2rem 0.7rem 2rem 1.2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          {/* Suspects List */}
          <div>
            <h2 style={{ color: COLORS.secondary, marginBottom: 6, letterSpacing: '0.01em', fontSize: 20 }}>Suspects</h2>
            <input
              className="sf-search"
              style={{
                width: '97%', padding: '7px 13px', borderRadius: 7, border: '1.5px solid var(--border-color)', marginBottom: 10,
                background: 'var(--bg-primary)', color: 'var(--text-primary)'
              }}
              placeholder="Search suspects..."
              value={suspectSearch}
              onChange={e => setSuspectSearch(e.target.value)}
            />
            <ul style={{
              listStyle: 'none', padding: 0, margin: 0, maxHeight: 230, overflowY: 'auto'
            }} aria-label="Suspect list">
              {filteredSuspects.map(sus => (
                <li
                  key={sus.id}
                  onClick={() => handleSelectSuspect(sus.id)}
                  className={`sf-list-entry ${selectedSuspectId === sus.id ? 'sf-selected' : ''}`}
                  style={{
                    padding: '9px 8px 8px 8px', borderRadius: 8, marginBottom: 7,
                    background: selectedSuspectId === sus.id ? COLORS.secondary : (isContradicted(sus, 'suspect') ? '#ffd9df' : 'transparent'),
                    color: selectedSuspectId === sus.id || isContradicted(sus, 'suspect') ? COLORS.primary : 'var(--text-primary)',
                    fontWeight: selectedSuspectId === sus.id ? 700 : 500,
                    cursor: 'pointer',
                    border: isContradicted(sus, 'suspect') ? `2px solid ${COLORS.secondary}` : '1.5px solid var(--border-color)',
                    transition: 'all .2s'
                  }}
                  title={sus.description}
                >
                  {sus.name}
                  {isContradicted(sus, 'suspect') && (
                    <span style={{ fontSize: 14, color: COLORS.secondary, marginLeft: 7 }} title="This suspect is involved in a twist/contradiction">⚠️</span>
                  )}
                </li>
              ))}
              {filteredSuspects.length === 0 && (
                <li style={{opacity: .6, fontStyle: 'italic', fontSize: 14, color: COLORS.primary}}>No suspects</li>
              )}
            </ul>
          </div>
          {/* Clues List */}
          <div>
            <h2 style={{ color: COLORS.secondary, marginBottom: 6, letterSpacing: '0.01em', fontSize: 20 }}>Clues</h2>
            <input
              className="sf-search"
              style={{
                width: '97%', padding: '7px 13px', borderRadius: 7, border: '1.5px solid var(--border-color)', marginBottom: 10,
                background: 'var(--bg-primary)', color: 'var(--text-primary)'
              }}
              placeholder="Search clues..."
              value={clueSearch}
              onChange={e => setClueSearch(e.target.value)}
            />
            <ul style={{
              listStyle: 'none', padding: 0, margin: 0, maxHeight: 230, overflowY: 'auto'
            }} aria-label="Clues list">
              {filteredClues.map(clue => (
                <li
                  key={clue.id}
                  onClick={() => handleSelectClue(clue.id)}
                  className={`sf-list-entry ${selectedClueId === clue.id ? 'sf-selected' : ''}`}
                  style={{
                    padding: '8px 8px 8px 8px', borderRadius: 8, marginBottom: 7,
                    background: selectedClueId === clue.id ? COLORS.secondary : (isContradicted(clue, 'clue') ? '#ffd9df' : 'transparent'),
                    color: selectedClueId === clue.id || isContradicted(clue, 'clue') ? COLORS.primary : 'var(--text-primary)',
                    fontWeight: selectedClueId === clue.id ? 700 : 500,
                    cursor: 'pointer',
                    border: isContradicted(clue, 'clue') ? `2px solid ${COLORS.secondary}` : '1.5px solid var(--border-color)',
                    transition: 'all .2s'
                  }}
                  title={clue.description}
                >
                  {clue.description}
                  {isContradicted(clue, 'clue') && (
                    <span style={{ fontSize: 14, color: COLORS.secondary, marginLeft: 7 }} title="This clue is involved in a twist/contradiction">⚡</span>
                  )}
                </li>
              ))}
              {filteredClues.length === 0 && (
                <li style={{opacity: .6, fontStyle: 'italic', fontSize: 14, color: COLORS.primary}}>No clues</li>
              )}
            </ul>
          </div>
        </aside>
        {/* Right Column: Detail View/Narrative */}
        <main className="sf-detail" style={{
          flex: 1,
          minWidth: 0,
          padding: '2rem 2rem 2rem 2.6rem',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          boxSizing: 'border-box'
        }}>
          {!currentCase && (
            <div style={{ fontSize: 21, color: COLORS.secondary }}>No case selected</div>
          )}
          {currentCase && (
            <>
              {/* Case Title & Narrative */}
              <div className="sf-case-brief" style={{ marginBottom: 38 }}>
                <h1 style={{ color: COLORS.secondary, margin: '0 0 12px 0', letterSpacing: '0.015em', fontWeight: 800 }}>
                  {currentCase.title}
                </h1>
                <p style={{ fontSize: 17, opacity: .88, marginBottom: 8 }}>{currentCase.briefing}</p>
                <div style={{ fontSize: 16, fontStyle: 'italic', opacity: .75 }}>
                  <span style={{ fontWeight: 600 }}>Crime Scene:</span> {currentCase.crime_scene || 'N/A'}
                </div>
              </div>
              {/* Entity Detail Card */}
              {/* Suspect Detail Display */}
              {selectedSuspect && (
                <section className="sf-detail-card" style={{
                  padding: '2.3em 1.6em', background: 'var(--bg-secondary)', borderRadius: 15,
                  boxShadow: '0 2px 14px 0 rgba(40,40,60,0.07)', marginBottom: 25, border: `1px solid ${COLORS.primary}`,
                  position: 'relative'
                }}>
                  <h2 style={{ margin: 0, color: COLORS.secondary }}>{selectedSuspect.name}</h2>
                  <ul style={{ fontSize: 16, margin: '7px 0 0 0', padding: 0, opacity: 0.93 }}>
                    <li><strong>Alibi:</strong> <span>{selectedSuspect.alibi || "Unknown"}</span></li>
                    <li><strong>Occupation:</strong> <span>{selectedSuspect.occupation || "Unknown"}</span></li>
                    <li><strong>Description:</strong> <span>{selectedSuspect.description}</span></li>
                  </ul>
                  {isContradicted(selectedSuspect, 'suspect') && (
                    <div style={{
                      position: 'absolute', top: 14, right: 18, color: COLORS.secondary, fontWeight: 700, fontSize: 23,
                      letterSpacing: '0.03em'
                    }}>
                      CONTRADICTION
                    </div>
                  )}
                </section>
              )}
              {/* Clue Detail Display */}
              {selectedClue && (
                <section className="sf-detail-card" style={{
                  padding: '2.1em 1.3em', background: 'var(--bg-secondary)', borderRadius: 15,
                  boxShadow: '0 2px 14px 0 rgba(40,40,60,0.07)', marginBottom: 25, border: `1px solid ${COLORS.primary}`,
                  position: 'relative'
                }}>
                  <h2 style={{ margin: 0, color: COLORS.secondary, fontSize: 22 }}>
                    Clue
                  </h2>
                  <div style={{ fontSize: 16, margin: '7px 0 0 0', opacity: 0.93 }}>
                    <strong>Description:</strong> <span>{selectedClue.description}</span>
                  </div>
                  <div><strong>Location:</strong> <span>{selectedClue.location || "Unknown"}</span></div>
                  {isContradicted(selectedClue, 'clue') && (
                    <div style={{
                      position: 'absolute', top: 14, right: 18, color: COLORS.secondary, fontWeight: 700, fontSize: 22,
                      letterSpacing: '0.03em'
                    }}>
                      TWIST
                    </div>
                  )}
                </section>
              )}
              {/* Show Twist(s) if any - associated with current selection or otherwise */}
              {( (selectedSuspect && isContradicted(selectedSuspect, 'suspect')) ||
                  (selectedClue && isContradicted(selectedClue, 'clue')) ) && (
                <section className="sf-twist-info" style={{
                  background: COLORS.secondary, color: COLORS.accent, padding: '1.15em 1.5em', borderRadius: 11,
                  marginBottom: 15, fontWeight: 600, fontSize: 17
                }}>
                  {caseTwists
                    .filter(twist =>
                      (selectedSuspect && twist.suspects?.includes(selectedSuspect.id)) ||
                      (selectedClue && twist.clues?.includes(selectedClue.id))
                    ).map(twist => (
                    <div key={twist.id}>
                      <span style={{ fontWeight: 700 }}>Twist:</span> {twist.description}
                    </div>
                  ))}
                </section>
              )}
              {/* General Twist highlights, when not focused on specific entity */}
              {!selectedSuspect && !selectedClue && caseTwists.length > 0 && (
                <section className="sf-twists-summary" style={{
                  background: '#f9eaea', color: COLORS.primary, padding: '0.9em 1.15em', borderRadius: 9,
                  marginBottom: 12, fontSize: 16, fontWeight: 500, borderLeft: `3.5px solid ${COLORS.secondary}`, opacity: 0.92
                }}>
                  <div><span role="img" aria-label="twist">🌀</span> <strong>Plot twists:</strong> {caseTwists.length > 1 ? `${caseTwists.length} twists` : 'A twist'}</div>
                  <ul style={{ margin: '0.2em 0 0 1.2em', padding: 0 }}>
                    {caseTwists.map(tw => (
                      <li key={tw.id} style={{ marginBottom: 4 }}>{tw.description}</li>
                    ))}
                  </ul>
                </section>
              )}
              {/* Solution Reveal */}
              <section className="sf-solution-card" style={{
                marginTop: 26, background: COLORS.primary, color: COLORS.accent, borderRadius: 13,
                padding: '1.35em 1.5em', fontWeight: 600, boxShadow: '0 2px 8px 0 rgba(60,60,90,0.03)'
              }}>
                <h2 style={{ fontSize: 20 }}>🪄 Solution</h2>
                <div style={{ opacity: 0.92 }}>{currentCase.solution || <span style={{opacity:.5}}>No solution provided.</span>}</div>
              </section>
            </>
          )}
        </main>
      </div>

      {/* RESPONSIVE STYLES */}
      <style>{`
        @media (max-width: 1100px) {
          .sf-main { flex-direction: column; }
          .sf-sidebar { flex-direction: row; flex-basis: unset; flex: unset; width: 100%; max-width: none; padding: 1.1em 0.35em; border-right: none; border-bottom: 2px solid ${COLORS.primary}; gap: 1.2em; }
          .sf-sidebar > div { flex: 1; min-width: 150px; }
          .sf-detail { padding: 1.6em 1em 2em 1em; }
        }
        @media (max-width: 650px) {
          .sf-header { flex-direction: column; align-items: flex-start; gap: 0.5em; padding: 0.8em 0.6em; font-size: 15px; }
          .sf-title { font-size: 19px; }
          .theme-toggle { font-size: 13px; padding: 0.4em 0.7em; }
          .sf-case-brief h1 { font-size: 19px !important; }
          .sf-sidebar { gap: 0.5em; padding: 0.5rem 0.05rem 0.7rem 0.35rem; }
          .sf-detail-card, .sf-solution-card, .sf-twists-summary { padding: 0.9em 0.4em !important; }
        }
      `}</style>
    </div>
  );
}

export default App;
