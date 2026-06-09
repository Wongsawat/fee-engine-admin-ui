import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const LINKS = [
  { to: '/rules', label: 'Fee Rules' },
  { to: '/ai-drafts', label: 'AI Drafts' },
  { to: '/dry-run', label: 'Dry Run' },
];

export function AppNav() {
  return (
    <header className="bg-sidebar text-sidebar-foreground">
      <nav className="flex h-12 items-center px-4">
        <div className="mr-6 flex items-center gap-2 shrink-0">
          <img src="/logo-mark.svg" alt="" className="h-5 w-5" />
          <span className="font-semibold text-sm text-white">Fee Engine Admin</span>
        </div>
        <div className="ml-auto shrink-0">
          <img src="/wpanther-logo.png" alt="wpanther" className="h-8 w-8 rounded-full object-cover" />
        </div>
        {LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex h-full items-center px-3 text-sm transition-colors',
                isActive
                  ? 'border-b-2 border-primary font-medium text-white'
                  : 'text-sidebar-foreground/70 hover:text-white'
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
