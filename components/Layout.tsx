import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { QrCode, Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const isPublicPage = location.pathname.startsWith('/v/');
  const isDashboard = location.pathname === '/dashboard';

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  if (isPublicPage) {
    return <main className="min-h-screen bg-gray-50">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-primary-600 p-1.5 rounded-lg">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">QR Vault</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-gray-600 hover:text-primary-600 font-medium text-sm transition-colors">Features</Link>
              <Link to="/pricing" className="text-gray-600 hover:text-primary-600 font-medium text-sm transition-colors">Pricing</Link>
              
              <div className="h-6 w-px bg-gray-200 mx-2"></div>
              
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className={`font-medium text-sm transition-colors ${isDashboard ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'}`}>
                      My Dashboard
                  </Link>
                  <div className="flex items-center gap-4 pl-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 border border-primary-200 cursor-default">
                      <User className="w-4 h-4" />
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
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

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-gray-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 py-4 px-4 space-y-4 shadow-xl">
             <Link to="/" className="block text-gray-600 font-medium" onClick={() => setIsMenuOpen(false)}>Features</Link>
             <Link to="/pricing" className="block text-gray-600 font-medium" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
             <div className="border-t border-gray-100 my-2"></div>
             
             {isAuthenticated ? (
               <>
                 <Link to="/dashboard" className="block text-primary-600 font-medium" onClick={() => setIsMenuOpen(false)}>My Dashboard</Link>
                 <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-gray-600 font-medium w-full text-left"
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

      <footer className="bg-white border-t border-gray-100 py-16 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-12">
          <div className="col-span-2 md:col-span-1">
             <div className="flex items-center gap-2 mb-6">
                <div className="bg-primary-600 p-1.5 rounded-lg">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">QR Vault</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Securely store and share your files with instantly generated QR codes. Fast, reliable, and accessible anywhere.
              </p>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 mb-6 text-sm uppercase tracking-wider">Product</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/" className="hover:text-primary-600 transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-primary-600 transition-colors">Pricing</Link></li>
              {isAuthenticated && <li><Link to="/dashboard" className="hover:text-primary-600 transition-colors">Dashboard</Link></li>}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-6 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/about" className="hover:text-primary-600 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary-600 transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-6 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/privacy" className="hover:text-primary-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary-600 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/refund" className="hover:text-primary-600 transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-6 text-sm uppercase tracking-wider">Resources</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/faq" className="hover:text-primary-600 transition-colors">FAQ</Link></li>
              <li><Link to="/security" className="hover:text-primary-600 transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
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