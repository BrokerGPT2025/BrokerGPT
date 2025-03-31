import React from 'react';
// Import SVGs as React components (handled by vite-plugin-svgr)
import BrandLogo from '../assets/b-grey.svg'; // Updated Brand Logo
import BrandText from '../assets/brokergpt-name-grey.svg'; // Updated Brand Text
import HideIcon from '../assets/sidebar-left.svg';
import AiAgentIcon from '../assets/ai-agent.svg';
import ClientProfileIcon from '../assets/radar.svg'; // Using radar for profile
import CarriersIcon from '../assets/carriers.svg';
import RecentsIcon from '../assets/clock.svg';
import PaymentLinksIcon from '../assets/payment.svg';
import PrintCertsIcon from '../assets/print.svg';
import BorLettersIcon from '../assets/youragency.svg'; // Using youragency for BOR

// We will create/use Sidebar.css or App.css later for styling

// OpenIcon moved to App.tsx

interface SidebarProps {
  isOpen: boolean; // Receive state
  onToggle: () => void; // Receive toggle function
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => { // Destructure props

  // TODO: Add logic to determine the current page and apply 'w--current' class to the active link
  const currentPage = 'profile'; // Example: Hardcoded for now

  return (
    <> {/* Use Fragment to return multiple top-level elements */}
      {/* Sidebar Section - Conditionally hidden/shown via CSS based on parent class */}
      <section className="left-sidebar"> {/* Main container */}

        {/* NEW Container for the Hide Icon at the top */}
        <div className="sidebar-toggle-container"> {/* New class for styling */}
          <div className="sidebar-icon" onClick={onToggle} style={{ cursor: 'pointer' }}> {/* Make icon clickable */}
            <HideIcon />
          </div>
        </div>

        {/* Brand Link */}
        <a href="/" className="sidebar-brand-link"> {/* Custom class for link */}
          <div className="sidebar-brand-container">
            <div className="sidebar-encode-logo">
              <BrandLogo />
            </div>
            <div className="sidebar-brand-text">
              <BrandText />
            </div>
          </div>
        </a>

        {/* Wrapper for the main content of the sidebar */}
        <div className="sidebar-wrapper">
            <div className="sidebar-container"> {/* Inner container for items */}

                {/* REMOVED Hide Sidebar Button from here */}
                {/* <div className="sidebar-item third"> ... </div> */}

                {/* Navigation Items */}
                <div className="sidebar-item">
                    <a href="#" className={`nav-link-block ${currentPage === 'agent' ? 'w--current' : ''}`}>
                        <div className="sidebar-icon"><AiAgentIcon /></div>
                        <div className="nav-text">AI Agent</div>
                    </a>
                </div>
                <div className="sidebar-item">
                    <a href="#" className={`nav-link-block ${currentPage === 'profile' ? 'w--current' : ''}`}>
                        <div className="sidebar-icon"><ClientProfileIcon /></div>
                        <div className="nav-text">Client Profile</div>
                    </a>
                </div>
                <div className="sidebar-item third"> {/* 'third' class for border */}
                    <a href="#" className={`nav-link-block ${currentPage === 'carriers' ? 'w--current' : ''}`}>
                        <div className="sidebar-icon"><CarriersIcon /></div>
                        <div className="nav-text">Carriers</div>
                    </a>
                </div>
                <div className="sidebar-item">
                    <a href="#" className={`nav-link-block ${currentPage === 'recents' ? 'w--current' : ''}`}>
                        <div className="sidebar-icon"><RecentsIcon /></div>
                        <div className="nav-text">Recents</div>
                    </a>
                </div>
                <div className="sidebar-item">
                    <a href="#" className={`nav-link-block ${currentPage === 'payments' ? 'w--current' : ''}`}>
                        <div className="sidebar-icon"><PaymentLinksIcon /></div>
                        <div className="nav-text">Payment Links</div>
                    </a>
                </div>
                <div className="sidebar-item">
                    <a href="#" className={`nav-link-block ${currentPage === 'certs' ? 'w--current' : ''}`}>
                        <div className="sidebar-icon"><PrintCertsIcon /></div>
                        <div className="nav-text">Print Certs</div>
                    </a>
                </div>
                <div className="sidebar-item">
                    <a href="#" className={`nav-link-block ${currentPage === 'bor' ? 'w--current' : ''}`}>
                        <div className="sidebar-icon"><BorLettersIcon /></div>
                        <div className="nav-text">BOR Letters</div>
                    </a>
                </div>
                {/* Note: Your Agency & About links were in mobile menu, add here if needed */}
            </div>
        </div>
      </section>
      {/* OpenIcon rendering moved to App.tsx */}
    </>
  );
};

export default Sidebar;
