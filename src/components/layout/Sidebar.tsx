import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  Shield,
  Bell,
  Settings,
  Landmark,
  ShoppingBag,
  Receipt,
  Boxes,
  FileCheck2,
  UserCog,
  Building2,
  Scale,
  BarChart3,
  MapPin,
} from "lucide-react";
import logo from "@/assets/logo-removebg-preview.png";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

type NavItem =
  | { type: "link"; label: string; icon: any; href: string }
  | { type: "section"; label: string };

const navItems: NavItem[] = [
  { type: "link", label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { type: "link", label: "Orders", icon: ShoppingCart, href: "/orders" },
  { type: "link", label: "Products", icon: Package, href: "/products" },
  { type: "link", label: "Customers", icon: Users, href: "/customers" },
  { type: "link", label: "Delivery Partners", icon: Truck, href: "/delivery-partners" },
  { type: "link", label: "Notifications", icon: Bell, href: "/notifications" },
  { type: "link", label: "Admin Management", icon: Shield, href: "/admin-management" },
  { type: "link", label: "Pincodes", icon: MapPin, href: "/pincodes" },
  { type: "link", label: "Settings", icon: Settings, href: "/settings" },
  { type: "section", label: "Accounts & Finance" },
  { type: "link", label: "Finance", icon: Landmark, href: "/finance" },
  { type: "link", label: "Purchases", icon: ShoppingBag, href: "/purchases" },
  { type: "link", label: "Sales Register", icon: Receipt, href: "/sales-register" },
  { type: "link", label: "Inventory", icon: Boxes, href: "/inventory" },
  { type: "link", label: "GST", icon: FileCheck2, href: "/gst" },
  { type: "link", label: "Payroll", icon: UserCog, href: "/payroll" },
  { type: "link", label: "Fixed Assets", icon: Building2, href: "/assets" },
  { type: "link", label: "Statutory", icon: Scale, href: "/statutory" },
  { type: "link", label: "Reports", icon: BarChart3, href: "/reports" },
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
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-100 transition-all duration-300 z-[70] flex flex-col ${open ? "w-72 translate-x-0" : "w-20 -translate-x-full lg:translate-x-0 lg:w-72"
          } lg:static lg:h-screen lg:flex-shrink-0`}
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
        <nav className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar space-y-1">
          {navItems.map((item, idx) => {
            if (item.type === "section") {
              return (
                <div key={`section-${idx}`} className={`pt-4 pb-1.5 transition-all duration-300 ${!open ? "opacity-0 invisible lg:opacity-100 lg:visible" : "opacity-100 visible"}`}>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] px-4">{item.label}</p>
                </div>
              );
            }
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-300 group ${active
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-gray-500 hover:bg-gray-50 hover:text-accent"
                  }`}
                title={!open ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`} />
                <span className={`text-sm font-medium transition-all duration-300 whitespace-nowrap ${!open ? "opacity-0 invisible lg:opacity-100 lg:visible" : "opacity-100 visible"
                  }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Branding Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-50 bg-gray-50/30 flex items-center justify-center relative h-16">
          <div className={`transition-all duration-300 whitespace-nowrap ${!open ? "opacity-0 invisible lg:opacity-100 lg:visible" : "opacity-100 visible"
            }`}>
            <p className="text-[10px] text-gray-400 text-center font-bold tracking-widest uppercase">© 2025 GrocMed</p>
          </div>
          {!open && (
            <div className="absolute font-black text-primary text-sm tracking-tighter lg:hidden">GM</div>
          )}
        </div>
      </aside>
    </>
  );
};
