import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const LINKS = [
  { to: '/rules', label: 'Fee Rules' },
  { to: '/dry-run', label: 'Dry Run' },
];

export function AppNav() {
  return (
    <header className="border-b bg-background">
      <nav className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-3">
        <span className="mr-6 font-semibold text-sm">Fee Engine Admin</span>
        {LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'rounded px-3 py-1.5 text-sm transition-colors hover:bg-accent',
                isActive ? 'bg-accent font-medium' : 'text-muted-foreground'
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
