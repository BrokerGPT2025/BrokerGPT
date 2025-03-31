import React from 'react';
// Import SVGs as React components (handled by vite-plugin-svgr)
import BrandLogo from '../assets/b-grey.svg';
import BrandText from '../assets/brokergpt-name-grey.svg';

// We will create/use MobileNavbar.css or App.css later for styling


// --- SVG Icon Placeholders ---
// TODO: Replace hamburger with actual SVG if available
const HamburgerIconPlaceholder: React.FC<{ className?: string }> = ({ className = "hamburger-icon-svg" }) => (
    // Simple placeholder for hamburger icon
    <div style={{ width: '30px', height: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flexShrink: 0 }} className={className}>
        <div style={{ width: '100%', height: '4px', background: '#888', borderRadius: '2px' }}></div>
        <div style={{ width: '100%', height: '4px', background: '#888', borderRadius: '2px' }}></div>
        <div style={{ width: '100%', height: '4px', background: '#888', borderRadius: '2px' }}></div>
    </div>
);
// --- End SVG Icon Placeholders ---

interface MobileNavbarProps {
  // Props for toggle state and function will be added later
  onMenuToggle: () => void;
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({ onMenuToggle }) => {
  return (
    // Using class names inspired by Webflow structure
    // The outer 'navbar' class might be applied higher up in App.tsx for responsiveness
    <div className="mobile-navbar-container"> {/* Custom container */}
        <a href="/" className="brand-9"> {/* Brand link */}
            <div className="logo"> {/* Logo container */}
                <BrandLogo />
            </div>
            <div className="sidebar-brand-text"> {/* Reusing sidebar class for text */}
                <BrandText />
            </div>
        </a>
        {/* Hamburger menu button */}
        <div className="w-nav-button" onClick={onMenuToggle} aria-label="menu" role="button" tabIndex={0}>
            <div className="w-icon-nav-menu">
                <HamburgerIconPlaceholder /> {/* TODO: Replace */}
            </div>
        </div>
    </div>
  );
};

// Mobile Menu Panel (Initially hidden, shown on toggle)
// This might need to be a separate component or managed within App.tsx state
interface MobileMenuPanelProps {
    isOpen: boolean;
    // Add navigation links here later
}
export const MobileMenuPanel: React.FC<MobileMenuPanelProps> = ({ isOpen }) => {
    if (!isOpen) return null;

    // Using class names inspired by Webflow structure
    return (
        <nav role="navigation" className="nav-menu-7"> {/* Mobile menu panel */}
            {/* TODO: Add mobile navigation links based on screenshot */}
            <a href="#" className="w-nav-link mobile-menu-item">AI Agent</a>
            <a href="#" className="w-nav-link mobile-menu-item">Client Profile</a>
            <a href="#" className="w-nav-link mobile-menu-item">Carriers</a>
            <a href="#" className="w-nav-link mobile-menu-item">Your Agency</a>
            <a href="#" className="w-nav-link mobile-menu-item">Recents</a>
            <a href="#" className="w-nav-link mobile-menu-item">Payment Links</a>
            <a href="#" className="w-nav-link mobile-menu-item">Print Certs</a>
            <a href="#" className="w-nav-link mobile-menu-item">BOR Letters</a>
            {/* <a href="#" className="w-nav-link mobile-menu-item">About</a> */}
        </nav>
    );
};


export default MobileNavbar;
