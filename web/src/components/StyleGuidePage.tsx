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
  return (
    <div style={styles.body}>
      <h1 style={styles.h1}>Style Guide Visualization</h1>

      <section style={styles.section}>
        <h2 style={styles.h2}>Colors</h2>
        <div style={styles.colorSwatchContainer}>
          <div style={{ ...styles.colorSwatch, backgroundColor: '#38bdf8' }}><span style={{...styles.colorSwatchLabel, ...styles.swatchLabelDark}}>Primary Blue<br />#38bdf8</span></div>
          <div style={{ ...styles.colorSwatch, backgroundColor: '#111827' }}><span style={{...styles.colorSwatchLabel, ...styles.swatchLabelDark}}>Dark Text<br />#111827</span></div>
          <div style={{ ...styles.colorSwatch, backgroundColor: '#FFFFFF' }}><span style={styles.colorSwatchLabel}>White<br />#FFFFFF</span></div>
          <div style={{ ...styles.colorSwatch, backgroundColor: '#F9FAFB' }}><span style={styles.colorSwatchLabel}>Light Gray BG<br />#F9FAFB</span></div>
          <div style={{ ...styles.colorSwatch, backgroundColor: '#22c55e' }}><span style={{...styles.colorSwatchLabel, ...styles.swatchLabelDark}}>Success Green<br />#22c55e</span></div>
          <div style={{ ...styles.colorSwatch, backgroundColor: '#ef4444' }}><span style={{...styles.colorSwatchLabel, ...styles.swatchLabelDark}}>Error Red<br />#ef4444</span></div>
          <div style={{ ...styles.colorSwatch, backgroundColor: '#6B7280' }}><span style={{...styles.colorSwatchLabel, ...styles.swatchLabelDark}}>Secondary Text<br />#6B7280</span></div>
          <div style={{ ...styles.colorSwatch, backgroundColor: '#9CA3AF' }}><span style={{...styles.colorSwatchLabel, ...styles.swatchLabelDark}}>Muted Text<br />#9CA3AF</span></div>
          <div style={{ ...styles.colorSwatch, backgroundColor: '#E5E7EB' }}><span style={styles.colorSwatchLabel}>Border Light<br />#E5E7EB</span></div>
          <div style={{ ...styles.colorSwatch, backgroundColor: '#D1D5DB' }}><span style={styles.colorSwatchLabel}>Border Medium<br />#D1D5DB</span></div>
          <div style={{ ...styles.colorSwatch, backgroundColor: '#000000' }}><span style={{...styles.colorSwatchLabel, ...styles.swatchLabelDark}}>Button BG<br />#000000</span></div>
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.h2}>Typography</h2>
        <h1 style={styles.h1}>Heading Large (Page Title) - H1</h1>
        <h2 style={styles.h2}>Heading Medium (Section Title) - H2</h2>
        <h3 style={styles.h3}>Heading Small (Subsection Title) - H3</h3>
        <p style={styles.p}>This is standard body text (14px). Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.</p>
        <p style={{ ...styles.p, ...styles.textSecondary }}>This is secondary text color. Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        <p style={{ ...styles.p, ...styles.textMuted }}>This is muted text color. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
        <p style={styles.p}><span style={styles.textSmall}>This is small text (12px), often used for percentages or minor details.</span></p>
        <p style={styles.p}><strong style={styles.textBold}>This text is bold (700).</strong></p>
        <p style={{ ...styles.p, ...styles.textMedium }}>This text is medium weight (500).</p>
        <p style={{ ...styles.p, ...styles.textRegular }}>This text is regular weight (400).</p>
        <p style={styles.p}>Font Family: <span style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Inter, system-ui, sans-serif</span></p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.h2}>Borders and Shapes</h2>
        <div style={styles.shapeDemo}>
          <div style={{ ...styles.shape, ...styles.radiusButton }}>Button (6px)</div>
          <span>Button Radius: 6px</span>
        </div>
        <div style={styles.shapeDemo}>
          <div style={{ ...styles.shape, ...styles.radiusCard }}>Card (8px)</div>
          <span>Card Radius: 8px</span>
        </div>
        <div style={styles.shapeDemo}>
          <div style={{ ...styles.shape, ...styles.radiusInput }}>Input (6px)</div>
          <span>Input Radius: 6px</span>
        </div>
        <div style={styles.shapeDemo}>
          <div style={{ ...styles.shape, ...styles.radiusPill }}>Pill (9999px)</div>
          <span>Pill Radius: 9999px</span>
        </div>
         <p style={styles.p}>Default Border: 1px solid #E5E7EB (Applied to sections)</p>
         <p style={styles.p}>Medium Border: 1px solid #D1D5DB (Applied to shapes above)</p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.h2}>Shadows</h2>
        <div style={{ ...styles.shadowDemo, ...styles.shadowCard }}>
            Card Shadow
        </div>
        <div style={{ ...styles.shadowDemo, ...styles.shadowDropdown }}>
            Dropdown Shadow
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.h2}>Components</h2>
        <h3 style={styles.h3}>Buttons</h3>
        <button style={{ ...styles.button, ...styles.buttonPrimary }}>Primary Button</button>
        <button style={{ ...styles.button, ...styles.buttonSecondary }}>Secondary Button</button>
        <a href="#" style={{ ...styles.button, ...styles.buttonSecondary }}>Secondary Link</a>

        <h3 style={styles.h3}>Badges/Pills</h3>
        <span style={{ ...styles.badge, ...styles.badgePositive }}>+12.5%</span>
        <span style={{ ...styles.badge, ...styles.badgeNegative }}>-3.2%</span>

        <h3 style={styles.h3}>Form Elements</h3>
        <div>
            <label htmlFor="text-input" style={styles.label}>Text Input</label>
            <input type="text" id="text-input" style={styles.formElement} placeholder="Enter text here..." />
        </div>
        <div>
            <label htmlFor="select-input" style={styles.label}>Select Dropdown</label>
            <select id="select-input" style={styles.formElement}>
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
            </select>
        </div>
         <div>
            <label htmlFor="textarea-input" style={styles.label}>Text Area</label>
            <textarea id="textarea-input" style={styles.formElement} rows={4} placeholder="Enter longer text..."></textarea>
        </div>
      </section>
    </div>
  );
};

export default StyleGuidePage;
