'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Brand from './Brand';

// Top brand strip — used in page headers
export function PageBrand({ tagline = false, size = 'sm' }) {
  return <Brand size={size} showTagline={tagline} />;
}

// Inline SVG icons — no extra deps, sharp at any size.
const IconDashboard = () => (
  <svg className="nav-icon" viewBox="0 0 24 24">
    <path d="M3 13h4v8H3zM10 3h4v18h-4zM17 9h4v12h-4z" />
  </svg>
);

const IconScan = () => (
  <svg className="nav-icon" viewBox="0 0 24 24">
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    <path d="M7 9v6M11 9v6M15 9v6M19 9v6" />
  </svg>
);

const IconSearch = () => (
  <svg className="nav-icon" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const IconReports = () => (
  <svg className="nav-icon" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" />
  </svg>
);

const IconAdmin = () => (
  <svg className="nav-icon" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

const navItems = [
  { href: '/', label: 'Home', Icon: IconDashboard },
  { href: '/scan', label: 'Scan', Icon: IconScan },
  { href: '/search', label: 'Search', Icon: IconSearch },
  { href: '/reports', label: 'Reports', Icon: IconReports },
  { href: '/admin', label: 'Admin', Icon: IconAdmin },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {navItems.map(({ href, label, Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`nav-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
