import React from 'react';

// Define styles as an object for inline styling in React
const styles: { [key: string]: React.CSSProperties } = {
  body: {
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#111827', // --dark-text
    backgroundColor: '#FFFFFF', // --white
    padding: '24px', // --spacing-container
    fontSize: '0.875rem', // --font-size-body (14px)
    lineHeight: 1.6,
  },
  section: {
    marginBottom: '32px', // --spacing-section
    padding: '24px', // --spacing-container
    border: '1px solid #E5E7EB', // --border-light
    borderRadius: '8px', // --radius-card
  },
  h1: {
    marginTop: 0,
    marginBottom: '16px', // --spacing-element
    fontWeight: 700, // --font-weight-bold
    color: '#111827', // --dark-text
    fontSize: '1.5rem', // --font-size-h-lg (24px)
  },
  h2: {
    marginTop: 0,
    marginBottom: '16px', // --spacing-element
    fontWeight: 500, // --font-weight-medium
    color: '#111827', // --dark-text
    fontSize: '1.125rem', // --font-size-h-md (18px)
  },
  h3: {
    marginTop: 0,
    marginBottom: '16px', // --spacing-element
    fontWeight: 700, // --font-weight-bold
    color: '#111827', // --dark-text
    fontSize: '0.875rem', // --font-size-body (14px)
  },
  p: {
    marginTop: 0,
    marginBottom: '16px', // --spacing-element
    color: '#111827', // --dark-text
    fontWeight: 400, // --font-weight-regular
  },
  textSecondary: { color: '#6B7280' }, // --secondary-text
  textMuted: { color: '#9CA3AF' }, // --muted-text
  textSmall: { fontSize: '0.75rem' }, // --font-size-sm (12px)
  textBold: { fontWeight: 700 },
  textMedium: { fontWeight: 500 },
  textRegular: { fontWeight: 400 },

  colorSwatchContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px', // --spacing-element
  },
  colorSwatch: {
    width: '100px',
    height: '100px',
    borderRadius: '8px', // --radius-card
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: '8px',
    fontSize: '0.75rem', // --font-size-sm
    border: '1px solid #E5E7EB', // --border-light
  },
  colorSwatchLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: '2px 4px',
    borderRadius: '4px',
    color: '#111827', // --dark-text
    display: 'inline-block',
  },
  swatchLabelDark: {
     backgroundColor: 'rgba(0, 0, 0, 0.6)',
     color: '#FFFFFF', // --white
  },

  shapeDemo: {
    display: 'flex',
    gap: '16px', // --spacing-element
    alignItems: 'center',
    marginBottom: '16px', // --spacing-element
  },
  shape: {
    width: '80px',
    height: '40px',
    border: '1px solid #D1D5DB', // --border-medium
    backgroundColor: '#F9FAFB', // --light-gray-bg
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem', // --font-size-sm
  },
  radiusButton: { borderRadius: '6px' }, // --radius-button
  radiusCard: { borderRadius: '8px' }, // --radius-card
  radiusInput: { borderRadius: '6px' }, // --radius-input
  radiusPill: { borderRadius: '9999px', width: 'auto', padding: '2px 8px' }, // --radius-pill

  shadowDemo: {
    padding: '16px', // --spacing-element
    marginBottom: '16px', // --spacing-element
    border: '1px solid #E5E7EB', // --border-light
    backgroundColor: '#FFFFFF', // --white
    width: 'fit-content',
  },
  shadowCard: { boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', borderRadius: '8px' }, // --shadow-card, --radius-card
  shadowDropdown: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', borderRadius: '6px' }, // --shadow-dropdown, --radius-input

  button: {
    display: 'inline-block',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px', // --radius-button
    fontWeight: 500, // --font-weight-medium
    fontSize: '0.875rem', // --font-size-body
    cursor: 'pointer',
    textDecoration: 'none',
    marginRight: '16px', // --spacing-element
  },
  buttonPrimary: {
    backgroundColor: '#000000', // --primary-button-bg
    color: '#FFFFFF', // --primary-button-text
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    color: '#6B7280', // --secondary-button-text
  },

  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '9999px', // --radius-pill
    fontSize: '0.75rem', // --font-size-sm
    fontWeight: 500, // --font-weight-medium
    marginRight: '16px', // --spacing-element
  },
  badgePositive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)', // --positive-badge-bg
    color: '#22c55e', // --positive-badge-text
  },
  badgeNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // --negative-badge-bg
    color: '#ef4444', // --negative-badge-text
  },

  formElement: {
    display: 'block',
    width: '100%',
    maxWidth: '300px',
    padding: '8px 12px',
    marginBottom: '16px', // --spacing-element
    border: '1px solid #D1D5DB', // --border-medium
    borderRadius: '6px', // --radius-input
    fontSize: '0.875rem', // --font-size-body
    fontFamily: 'Inter, system-ui, sans-serif', // --font-family-primary
    backgroundColor: '#FFFFFF', // --white
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    fontWeight: 500, // --font-weight-medium
    fontSize: '0.875rem', // --font-size-body
  },
};

const StyleGuidePage: React.FC = () => {
  // Vite serves files relative to the project root in development
  const htmlPath = '/Stylesheet/style.html';

  return (
    <div style={{ padding: '20px', height: 'calc(100vh - 60px)' }}> {/* Adjust height as needed */}
      <h2>Stylesheet Preview (/styleguide)</h2>
      <p>Displaying content from: <code>{htmlPath}</code></p>
      <iframe
        src={htmlPath}
        title="Stylesheet Preview"
        style={{
          width: '100%',
          height: 'calc(100% - 80px)', // Adjust based on surrounding elements
          border: '1px solid #ccc',
          borderRadius: '8px',
        }}
      />
    </div>
  );
};

export default StyleGuidePage;
