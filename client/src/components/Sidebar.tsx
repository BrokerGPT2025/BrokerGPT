import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  Building2,
  History,
  CreditCard,
  Printer,
  ClipboardSignature,
  Clock,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  collapsed?: boolean;
}

const NavItem = ({ icon, label, href, active, collapsed }: NavItemProps) => (
  <li className="px-3 py-1">
    <Link href={href}>
      <div
        className={cn(
          "flex items-center hover:bg-gray-100 rounded p-2 transition-colors cursor-pointer",
          active ? "text-black font-medium" : "text-gray-700"
        )}
      >
        <div className="h-5 w-5">{icon}</div>
        {!collapsed && <span className="ml-3">{label}</span>}
      </div>
    </Link>
  </li>
);

export default function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <aside 
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-[199px]"
      )}
    >
      <div className="p-4 border-b border-gray-200">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-start" 
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
          {!collapsed && <span className="ml-2">Show side bar</span>}
        </Button>
      </div>
      
      <nav className="flex-1 overflow-y-auto scrollbar-hide">
        <ul className="py-2">
          <NavItem 
            icon={<LayoutDashboard />} 
            label="AI Agent" 
            href="/" 
            active={location === "/"} 
            collapsed={collapsed}
          />
          <NavItem 
            icon={<Users />} 
            label="Client Info" 
            href="/clients/1" 
            active={location === "/clients" || location === "/clients/1"} 
            collapsed={collapsed}
          />
          <NavItem 
            icon={<FileText />} 
            label="Carriers" 
            href="/carriers" 
            active={location === "/carriers"} 
            collapsed={collapsed}
          />
          <NavItem 
            icon={<Building2 />} 
            label="Your Agency" 
            href="/agency" 
            active={location === "/agency"} 
            collapsed={collapsed}
          />
        </ul>
        
        <div className="border-t border-gray-200 mt-2"></div>
        
        <ul className="py-2">
          <NavItem 
            icon={<History />} 
            label="Recents" 
            href="/recents" 
            active={location === "/recents"} 
            collapsed={collapsed}
          />
          <NavItem 
            icon={<CreditCard />} 
            label="Send Payment Link" 
            href="/payment" 
            active={location === "/payment"} 
            collapsed={collapsed}
          />
          <NavItem 
            icon={<Printer />} 
            label="Print Certs" 
            href="/certs" 
            active={location === "/certs"} 
            collapsed={collapsed}
          />
          <NavItem 
            icon={<ClipboardSignature />} 
            label="Send a BOR" 
            href="/bor" 
            active={location === "/bor"} 
            collapsed={collapsed}
          />
          <NavItem 
            icon={<Clock />} 
            label="Time Sensitive" 
            href="/time-sensitive" 
            active={location === "/time-sensitive"} 
            collapsed={collapsed}
          />
        </ul>
      </nav>
    </aside>
  );
}
