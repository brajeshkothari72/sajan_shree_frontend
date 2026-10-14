import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, Package, ShoppingCart, Boxes, Factory,
  Users, Truck, FileText, BarChart, UserCheck, Smartphone, X
} from 'lucide-react';

const Sidebar = ({ expanded, mobile, onClose }) => {
  const navItems = [
    { path: '/dashboard', name: 'Dashboard', icon: Home },
    { path: '/products', name: 'Products', icon: Package },
    { path: '/orders', name: 'Orders', icon: ShoppingCart },
    { path: '/inventory', name: 'Inventory', icon: Boxes },
    { path: '/production', name: 'Production', icon: Factory },
    { path: '/customers', name: 'Customers', icon: Users },
    { path: '/suppliers', name: 'Suppliers', icon: Truck },
    { path: '/invoices', name: 'Invoicing', icon: FileText },
    { path: '/reports', name: 'Reports', icon: BarChart },
    { path: '/dispatch', name: 'Dispatch Slips', icon: Smartphone },
    { path: '/users', name: 'Users', icon: UserCheck },
  ];

  // Temporarily showing only Dashboard + Orders; other tabs stay defined above, just hidden.
  const VISIBLE_PATHS = ['/dashboard', '/orders'];
  const visibleNavItems = navItems.filter((item) => VISIBLE_PATHS.includes(item.path));

  const showLabels = expanded || mobile;

  return (
    <div
      className={`flex flex-col border-r border-border bg-card h-full overflow-hidden transition-[width] duration-300 print:hidden ${
        mobile ? 'w-64' : expanded ? 'w-64' : 'w-16'
      }`}
    >
      <div
        className={`flex items-center h-16 border-b border-border ${
          showLabels ? 'justify-between px-4' : 'justify-center px-2'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <img src="/logo.png" alt="Sajan Shree" className="h-10 w-auto object-contain shrink-0" />
          {showLabels && (
            <span className="text-lg font-bold text-foreground whitespace-nowrap">Sajan Shree</span>
          )}
        </div>
        {mobile && (
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted shrink-0">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav
        className={`flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden ${
          showLabels ? 'px-3' : 'px-2'
        }`}
      >
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={mobile ? onClose : undefined}
              title={showLabels ? undefined : item.name}
              className={({ isActive }) =>
                `flex items-center h-10 text-sm font-medium rounded-lg transition-colors ${
                  showLabels ? 'px-3' : 'justify-center'
                } ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {showLabels && <span className="ml-3 whitespace-nowrap">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
