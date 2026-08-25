import { useState } from 'react';

export default function VendorDashboardOverview() {
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null);
  const [assistantLoading, setAssistantLoading] = useState(false);

  const handleAssistantQuery = (queryType: string) => {
    setAssistantLoading(true);
    setAssistantResponse(null);
    
    let text = '';
    if (queryType === 'trends') {
      text = '📈 [Market Analysis Report]\n\nAnalysis complete. Store volume is steady, with Electronics category sales rising by 12% MoM. Peak purchasing times are noted between 6:00 PM and 9:00 PM. Recommendation: Keep inventory replenished for your top-performing items to meet peak evening demand.';
    } else if (queryType === 'pricing') {
      text = '💡 [Pricing Optimization Recommendations]\n\nBased on catalog price telemetry, base prices for your automotive accessories are currently 5.5% below competitor medians. We recommend adjusting prices upwards by 4% to maximize gross profit margins without impacting conversion rates.';
    } else if (queryType === 'copy') {
      text = '✍️ [Product Listing Assistant]\n\n"Experience high-performance build quality with our certified automotive collection. Hand-vetted durability, full customer escrow security, and quick dispatch. Upgrade your ride today."';
    }

    setTimeout(() => {
      setAssistantResponse(text);
      setAssistantLoading(false);
    }, 700);
  };

  const storeInsights = [
    {
      title: 'Restock Recommendation',
      desc: 'Demand trends suggest smartphone accessories sales will increase. Review your active stock levels.',
      type: 'warning',
      tag: 'INVENTORY',
    },
    {
      title: 'Market Pricing Alert',
      desc: 'Market rates for generic components have risen by 6%. Check if your listing price matches current rates.',
      type: 'info',
      tag: 'PRICING',
    },
    {
      title: 'Escrow Status Nominal',
      desc: 'Secure payment pathways are fully verified. All current buyer deposits are securely locked in escrow.',
      type: 'success',
      tag: 'SECURITY',
    },
  ];

  return (
    <div style={containerStyles}>
      {/* Top Welcome Card */}
      <div style={welcomeCardStyles}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={activeBadgeStyles}>MERCHANT HUB ACTIVE</span>
        </div>
        <h2 style={welcomeTitleStyles}>Merchant Store Overview</h2>
        <p style={welcomeSubtitleStyles}>
          Monitor sales settlements, catalog performance, and check performance insights below.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={statsGridStyles}>
        <div style={statCardStyles}>
          <span style={statLabelStyles}>TOTAL SETTLED SALES</span>
          <div style={statValueStyles}>₦1,248,500</div>
          <span style={{ ...statChangeStyles, color: 'var(--color-success)' }}>+12.4% vs last week</span>
        </div>

        <div style={statCardStyles}>
          <span style={statLabelStyles}>COMPLETED ORDERS</span>
          <div style={statValueStyles}>142</div>
          <span style={{ ...statChangeStyles, color: 'var(--color-success)' }}>+8.2% vs last week</span>
        </div>

        <div style={statCardStyles}>
          <span style={statLabelStyles}>ACTIVE LISTINGS</span>
          <div style={statValueStyles}>18 Items</div>
          <span style={{ ...statChangeStyles, color: '#3b82f6' }}>6 Drafts in progress</span>
        </div>

        <div style={statCardStyles}>
          <span style={statLabelStyles}>COMPLIANCE SCORE</span>
          <div style={statValueStyles}>98.4%</div>
          <span style={{ ...statChangeStyles, color: 'var(--color-primary)' }}>EXCELLENT Standing</span>
        </div>
      </div>

      {/* Grid Layout: Chart & Assistant */}
      <div style={doubleColGridStyles}>
        {/* Sales Performance Chart */}
        <div style={panelStyles}>
          <h3 style={panelTitleStyles}>Weekly Settlement Trends</h3>
          <p style={panelSubtitleStyles}>Escrow settlement volume & checkout telemetry (past 30 days)</p>
          <div style={chartWrapperStyles}>
            <svg viewBox="0 0 500 180" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(0,0,0,0.05)" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(0,0,0,0.05)" />
              <line x1="0" y1="130" x2="500" y2="130" stroke="rgba(0,0,0,0.05)" />
              
              {/* Gradient Area */}
              <path
                d="M0,150 Q70,100 140,115 T280,70 T420,90 L500,50 L500,160 L0,160 Z"
                fill="url(#chartGlow)"
              />
              
              {/* Line */}
              <path
                d="M0,150 Q70,100 140,115 T280,70 T420,90 L500,50"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2.5"
              />
            </svg>
          </div>
          <div style={chartLabelsStyles}>
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
          </div>
        </div>

        {/* AI Performance Assistant */}
        <div style={panelStyles}>
          <h3 style={panelTitleStyles}>Merchant Assistant</h3>
          <p style={panelSubtitleStyles}>Perform store checks and run automated inventory diagnostics</p>
          
          <div style={assistantActionsStyles}>
            <button onClick={() => handleAssistantQuery('trends')} style={assistantBtnStyles}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }}>
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              <span>Analyze Sales Trends</span>
            </button>
            <button onClick={() => handleAssistantQuery('pricing')} style={assistantBtnStyles}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }}>
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              <span>Optimize Pricing</span>
            </button>
            <button onClick={() => handleAssistantQuery('copy')} style={assistantBtnStyles}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }}>
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              <span>Generate Product Copy</span>
            </button>
          </div>

          <div style={assistantConsoleStyles}>
            {assistantLoading ? (
              <div style={consoleLoadingStyles}>
                <span style={spinnerStyles} />
                <span>Running diagnostic telemetry...</span>
              </div>
            ) : assistantResponse ? (
              <pre style={consoleTextStyles}>{assistantResponse}</pre>
            ) : (
              <div style={consolePlaceholderStyles}>
                Select an operations query above to run diagnostics and suggestions.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Store Insights */}
      <div style={panelStyles}>
        <h3 style={panelTitleStyles}>Store Insights & Status</h3>
        <div style={insightsListStyles}>
          {storeInsights.map((insight, idx) => (
            <div key={idx} style={insightRowStyles}>
              <div
                style={{
                  ...insightIndicatorStyles,
                  backgroundColor:
                    insight.type === 'warning'
                      ? 'var(--color-warning)'
                      : insight.type === 'info'
                      ? '#3b82f6'
                      : 'var(--color-success)',
                }}
              />
              <div style={insightContentStyles}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={insightTagStyles}>{insight.tag}</span>
                  <strong style={insightTitleStyles}>{insight.title}</strong>
                </div>
                <p style={insightDescStyles}>{insight.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling (Light Theme SaaS Vibe)
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  paddingTop: '1rem',
};

const welcomeCardStyles: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '2rem',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
};

const activeBadgeStyles: React.CSSProperties = {
  background: 'rgba(39, 174, 96, 0.08)',
  color: 'var(--color-success)',
  fontSize: '0.675rem',
  fontWeight: '700',
  padding: '2px 8px',
  borderRadius: 'var(--radius-full)',
  letterSpacing: '0.5px',
};

const welcomeTitleStyles: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: 'var(--color-text)',
  margin: '4px 0',
};

const welcomeSubtitleStyles: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text-muted)',
  lineHeight: '1.5',
};

const statsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem',
};

const statCardStyles: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
};

const statLabelStyles: React.CSSProperties = {
  fontSize: '0.675rem',
  fontWeight: '700',
  color: 'var(--color-text-muted)',
  letterSpacing: '0.5px',
};

const statValueStyles: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: 'var(--color-text)',
  margin: '6px 0',
};

const statChangeStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: '600',
};

const doubleColGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '1.5rem',
};

const panelStyles: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
};

const panelTitleStyles: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: '700',
  color: 'var(--color-text)',
  marginBottom: '4px',
};

const panelSubtitleStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--color-text-muted)',
  marginBottom: '1.25rem',
};

const chartWrapperStyles: React.CSSProperties = {
  height: '140px',
  width: '100%',
};

const chartLabelsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.675rem',
  color: 'var(--color-text-muted)',
  marginTop: '8px',
};

const assistantActionsStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginBottom: '1rem',
};

const assistantBtnStyles: React.CSSProperties = {
  background: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  borderRadius: 'var(--radius-md)',
  padding: '8px 12px',
  fontSize: '0.8rem',
  fontWeight: '600',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background-color 0.2s',
};

const assistantConsoleStyles: React.CSSProperties = {
  background: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: '1rem',
  minHeight: '110px',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.775rem',
  lineHeight: '1.5',
};

const consoleLoadingStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  color: 'var(--color-text-muted)',
  height: '70px',
};

const spinnerStyles: React.CSSProperties = {
  width: '14px',
  height: '14px',
  border: '2px solid var(--color-border)',
  borderTopColor: 'var(--color-primary)',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

const consoleTextStyles: React.CSSProperties = {
  margin: 0,
  whiteSpace: 'pre-wrap',
  color: 'var(--color-text)',
};

const consolePlaceholderStyles: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  textAlign: 'center',
  paddingTop: '1.5rem',
};

const insightsListStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const insightRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
  padding: '0.875rem',
  background: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
};

const insightIndicatorStyles: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  marginTop: '5px',
};

const insightContentStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const insightTagStyles: React.CSSProperties = {
  fontSize: '0.625rem',
  fontWeight: '700',
  padding: '1px 6px',
  borderRadius: 'var(--radius-sm)',
  background: 'rgba(0,0,0,0.04)',
  color: 'var(--color-text-muted)',
  letterSpacing: '0.5px',
};

const insightTitleStyles: React.CSSProperties = {
  fontSize: '0.85rem',
  color: 'var(--color-text)',
};

const insightDescStyles: React.CSSProperties = {
  fontSize: '0.775rem',
  color: 'var(--color-text-muted)',
  lineHeight: '1.4',
};
