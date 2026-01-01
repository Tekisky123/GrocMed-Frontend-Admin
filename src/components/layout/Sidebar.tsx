import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  Shield,
  Zap,
  Bell,
  Settings,
} from "lucide-react";
import logo from "@/assets/logo-removebg-preview.png";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Orders", icon: ShoppingCart, href: "/orders" },
  { label: "Products", icon: Package, href: "/products" },
  { label: "Customers", icon: Users, href: "/customers" },
  { label: "Delivery Partners", icon: Truck, href: "/delivery-partners" },
  { label: "Offers & Coupons", icon: Zap, href: "/offers" },
  { label: "Push Notifications", icon: Bell, href: "/notifications" },
  { label: "Admin Management", icon: Shield, href: "/admin-management" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const location = useLocation();

  // Close sidebar on navigation for mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && open) {
        setOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [open, setOpen]);

  useEffect(() => {
    if (window.innerWidth < 1024 && open) {
      setOpen(false);
    }
  }, [location.pathname]);

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      {/* Overlay - visible on mobile when sidebar is open */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-100 transition-all duration-300 z-[70] ${open ? "w-72 translate-x-0" : "w-20 -translate-x-full lg:translate-x-0 lg:w-72"
          } lg:static lg:h-screen lg:flex-shrink-0 overflow-hidden`}
      >
        {/* Logo section */}
        <div className="flex items-center h-20 px-5 border-b border-gray-50 bg-white overflow-hidden relative">
          <div className={`flex items-center gap-3 transition-all duration-300 min-w-[200px] ${!open ? "opacity-0 invisible lg:opacity-100 lg:visible" : "opacity-100 visible"
            }`}>
            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
              <img src={logo} alt="GrocMed Logo" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight whitespace-nowrap">
              <p className="font-bold text-gray-900 text-xl tracking-tight">GrocMed</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Admin Panel</p>
            </div>
          </div>

          {!open && (
            <div className="absolute inset-0 flex items-center justify-center lg:hidden">
              <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group overflow-hidden ${active
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-gray-500 hover:bg-gray-50 hover:text-accent"
                  }`}
                title={!open ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`} />
                <span className={`text-[15px] font-medium transition-all duration-300 whitespace-nowrap ${!open ? "opacity-0 invisible lg:opacity-100 lg:visible" : "opacity-100 visible"
                  }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Branding Footer */}
        <div className="p-6 border-t border-gray-50 bg-gray-50/30 overflow-hidden h-20 flex items-center justify-center relative">
          <div className={`transition-all duration-300 whitespace-nowrap ${!open ? "opacity-0 invisible lg:opacity-100 lg:visible" : "opacity-100 visible"
            }`}>
            <p className="text-[11px] text-gray-400 text-center font-bold tracking-widest uppercase">© 2024 GROCMED</p>
          </div>
          {!open && (
            <div className="absolute font-black text-primary text-sm tracking-tighter lg:hidden">GM</div>
          )}
        </div>
      </aside>
    </>
  );
};
