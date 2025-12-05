import { ReactNode, useState } from 'react';
import { NavLink } from '@/components/NavLink';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Gift,
  MapPin,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: TrendingUp, label: 'Forecasts', path: '/forecasts' },
  { icon: Package, label: 'Smart Inventory', path: '/inventory' },
  { icon: Gift, label: 'Promo Planner', path: '/promo' },
  { icon: MapPin, label: 'Store Layout', path: '/layout' },
  { icon: BarChart3, label: 'Model Quality', path: '/quality' },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground">RetailDSS</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
                collapsed && 'justify-center'
              )}
              activeClassName="bg-primary/10 text-primary font-medium"
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Settings */}
        <div className="p-2 border-t border-border">
          <NavLink
            to="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors',
              collapsed && 'justify-center'
            )}
            activeClassName="bg-primary/10 text-primary font-medium"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 transition-all duration-300',
          collapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {children}
      </main>
    </div>
  );
}
