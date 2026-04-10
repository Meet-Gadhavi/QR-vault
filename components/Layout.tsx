import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { QrCode, Menu, X, User, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isPublicPage = location.pathname.startsWith('/v/');
  const isDashboard = location.pathname === '/dashboard';
  const isAdminDashboard = location.pathname.toLowerCase() === '/admindashboard';

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-90"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );

  if (isPublicPage || isAdminDashboard) {
    return <main className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
      <header className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-primary-600 p-1.5 rounded-lg group-hover:rotate-6 transition-transform">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">QR Vault</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium text-sm transition-colors">Features</Link>
              <Link to="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium text-sm transition-colors">Pricing</Link>
              
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-2"></div>

              <ThemeToggle />
              
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className={`font-medium text-sm transition-colors ${isDashboard ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'}`}>
                      My Dashboard
                  </Link>
                  <div className="flex items-center gap-4 pl-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800 cursor-default">
                      <User className="w-4 h-4" />
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <Link to="/login">
                    <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-primary-200">
                        Sign In
                    </button>
                </Link>
              )}
            </nav>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <button 
                className="p-2 text-gray-600 dark:text-gray-400"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 py-4 px-4 space-y-4 shadow-xl">
             <Link to="/" className="block text-gray-600 dark:text-gray-400 font-medium hover:text-primary-600" onClick={() => setIsMenuOpen(false)}>Features</Link>
             <Link to="/pricing" className="block text-gray-600 dark:text-gray-400 font-medium hover:text-primary-600" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
             <div className="border-t border-gray-100 dark:border-gray-800 my-2"></div>
             
             {isAuthenticated ? (
               <>
                 <Link to="/dashboard" className="block text-primary-600 dark:text-primary-400 font-medium" onClick={() => setIsMenuOpen(false)}>My Dashboard</Link>
                 <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-medium w-full text-left hover:text-red-500"
                 >
                   <LogOut className="w-4 h-4" /> Sign Out
                 </button>
               </>
             ) : (
               <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <button className="block w-full text-center bg-primary-600 text-white px-4 py-2 rounded-lg font-medium mt-4">Sign In</button>
               </Link>
             )}
          </div>
        )}
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-16 mt-auto transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-12">
          <div className="col-span-2 md:col-span-1">
             <div className="flex items-center gap-2 mb-6">
                <div className="bg-primary-600 p-1.5 rounded-lg">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">QR Vault</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Securely store and share your files with instantly generated QR codes. Fast, reliable, and accessible anywhere.
              </p>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-sm uppercase tracking-wider">Product</h4>
            <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/" className="hover:text-primary-600 transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-primary-600 transition-colors">Pricing</Link></li>
              {isAuthenticated && <li><Link to="/dashboard" className="hover:text-primary-600 transition-colors">Dashboard</Link></li>}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/about" className="hover:text-primary-600 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary-600 transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/privacy" className="hover:text-primary-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary-600 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/refund" className="hover:text-primary-600 transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-sm uppercase tracking-wider">Resources</h4>
            <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/faq" className="hover:text-primary-600 transition-colors">FAQ</Link></li>
              <li><Link to="/security" className="hover:text-primary-600 transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400 dark:text-gray-600">
          <p>© {new Date().getFullYear()} QR Vault. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              All Systems Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};