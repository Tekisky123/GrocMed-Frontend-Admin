import { Menu, User as UserIcon, LogOut, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  open: boolean;
  onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ open, onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 h-20 bg-white/90 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 shadow-sm">
      {/* Left side - Hamburger Menu */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className={`relative h-12 w-12 rounded-2xl transition-all duration-300 lg:hidden flex items-center justify-center ${open
              ? "bg-primary/10 text-primary"
              : "bg-primary/5 text-primary hover:bg-primary/10"
            }`}
        >
          <Menu className="w-7 h-7" />
        </Button>
      </div>

      {/* Right side - User Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="group flex items-center gap-2.5 p-1 sm:pl-2 sm:pr-2.5 h-[52px] rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
              <div className="relative">
                <img
                  src={user?.avatar}
                  alt={user?.name}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 border-primary/10 object-cover shadow-sm group-hover:scale-105 transition-transform"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-[3px] border-white shadow-sm" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-gray-800 leading-tight">{user?.name}</p>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{user?.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2.5 rounded-[22px] shadow-2xl border-gray-100/50 animate-in fade-in zoom-in-95 duration-300">
            <div className="px-3.5 py-4 mb-2 bg-gradient-to-br from-gray-50/80 to-primary/5 rounded-[18px]">
              <p className="text-sm font-black text-gray-900 leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-500 font-bold mt-1 tracking-tight truncate opacity-70">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-gray-50" />
            <DropdownMenuItem className="rounded-[14px] py-3 px-3.5 focus:bg-primary/5 focus:text-primary cursor-pointer transition-all group">
              <UserIcon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-[15px]">My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-[14px] py-3 px-3.5 focus:bg-primary/5 focus:text-primary cursor-pointer transition-all group">
              <SettingsIcon className="w-5 h-5 mr-3 group-hover:rotate-45 transition-transform" />
              <span className="font-bold text-[15px]">Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-50" />
            <DropdownMenuItem
              onClick={logout}
              className="rounded-[14px] py-3 px-3.5 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer transition-all group"
            >
              <LogOut className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform" />
              <span className="font-black text-[15px]">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
