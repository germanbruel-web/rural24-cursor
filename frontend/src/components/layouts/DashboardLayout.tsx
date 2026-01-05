import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMenuItems } from '../../utils/rolePermissions';
import {
  LayoutDashboard,
  Package,
  User,
  Users,
  Search,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  X,
  Clock,
  MessageSquare,
  Edit3,
  Settings as SettingsIcon,
  Star,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: any) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  badge?: string | number;
  requiredRole?: 'premium' | 'superadmin';
  divider?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentPage,
  onNavigate,
}) => {
  const { profile, isAdmin, signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Obtener ítems del menú filtrados por rol
  const allowedMenuItems = getMenuItems(profile?.role);

  // 🐛 DEBUG: Ver qué items se están mostrando
  console.log('🔍 DashboardLayout Debug:', {
    userRole: profile?.role,
    userEmail: profile?.email,
    allowedMenuItems: allowedMenuItems.map(i => i.id),
    hasCategoriesAdmin: allowedMenuItems.some(i => i.id === 'categories-admin'),
    hasFeaturedAds: allowedMenuItems.some(i => i.id === 'featured-ads')
  });

  // Mapeo de iconos según el ID del ítem
  const iconMap: Record<string, React.ReactNode> = {
    home: <Home className="w-5 h-5" />,
    'my-ads': <Package className="w-5 h-5" />,
    inbox: <MessageSquare className="w-5 h-5" />,
    'pending-ads': <Clock className="w-5 h-5" />,
    'deleted-ads': <Clock className="w-5 h-5" />,
    users: <Users className="w-5 h-5" />,
    banners: <ImageIcon className="w-5 h-5" />,
    'categories-admin': <SettingsIcon className="w-5 h-5" />,
    'attributes-admin': <Edit3 className="w-5 h-5" />,
    'backend-settings': <SettingsIcon className="w-5 h-5" />,
    'featured-ads': <Star className="w-5 h-5" />,
    profile: <User className="w-5 h-5" />,
  };

  // Construir menú dinámico según rol
  const menuItems: MenuItem[] = allowedMenuItems.map(item => ({
    id: item.id,
    label: item.label,
    icon: iconMap[item.id] || null,
    onClick: () => onNavigate(item.id),
    divider: item.divider,
  }));

  const renderMenuItem = (item: MenuItem) => {
    if (item.divider) {
      return <div key={item.id} className="my-2 border-t border-gray-200" />;
    }

    const isActive = currentPage === item.id;

    return (
      <button
        key={item.id}
        onClick={() => {
          item.onClick();
          setMobileMenuOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
          isActive
            ? 'bg-[#16a135] text-white shadow-md'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <span className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#16a135]'}>
          {item.icon}
        </span>
        {!sidebarCollapsed && (
          <>
            <span className="flex-1 text-left font-medium">{item.label}</span>
            {item.badge && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
              }`}>
                {item.badge}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo / Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <button onClick={() => onNavigate('home')} className="flex items-center gap-2">
              <img 
                src="/images/logos/rural24-dark.webp" 
                alt="RURAL24" 
                className="h-8 w-auto"
              />
            </button>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* User Info */}
        <div className={`p-4 border-b border-gray-200 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate text-sm">
                  {profile?.full_name || 'Usuario'}
                </div>
                <div className="flex gap-1 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    profile?.role === 'superadmin'
                      ? 'bg-purple-100 text-purple-800'
                      : profile?.role === 'adminscrap'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {profile?.role === 'superadmin' ? '👑 SuperAdmin' : 
                     profile?.role === 'adminscrap' ? '🔍 Scraping' : '👤 Free'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map(renderMenuItem)}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={async () => {
              await signOut();
              window.location.hash = '#/';
              setTimeout(() => window.location.reload(), 100);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span className="font-medium">Salir</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Sidebar */}
        <aside
          className={`absolute top-0 left-0 h-full w-64 bg-white transform transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#16a135] to-[#0e7d25] rounded-lg flex items-center justify-center text-white font-bold">
                C
              </div>
              <span className="font-bold text-gray-900">Clasify</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate text-sm">
                  {profile?.full_name || 'Usuario'}
                </div>
                <div className="flex gap-1 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    profile?.role === 'superadmin'
                      ? 'bg-purple-100 text-purple-800'
                      : profile?.role === 'adminscrap'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {profile?.role === 'superadmin' ? '👑 SuperAdmin' : 
                     profile?.role === 'adminscrap' ? '🔍 Scraping' : '👤 Free'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {menuItems.map(renderMenuItem)}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={async () => {
                setMobileMenuOpen(false);
                await signOut();
                window.location.hash = '#/';
                setTimeout(() => window.location.reload(), 100);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Salir</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar Mobile */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#16a135] to-[#0e7d25] rounded-lg flex items-center justify-center text-white font-bold">
              R
            </div>
            <span className="font-bold text-gray-900">RURAL24</span>
          </button>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
