import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode, Star, ArrowRight, Lock, User, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Auth: React.FC = () => {
  const { login, signup, loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');
    
    try {
        if (isLogin) {
            await login(email, password);
            navigate('/dashboard');
        } else {
            await signup(email, password);
            setMsg('Account created! Please check your email to confirm.');
            setIsLogin(true);
        }
    } catch (err: any) {
        console.error(err);
        setError(err.message || 'Authentication failed.');
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      try {
          await loginWithGoogle();
      } catch (e: any) {
          setError(e.message);
      }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex transition-colors duration-300">
      {/* Left Side: Form */}
      <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white dark:bg-[#0a0a0a] z-10 w-full lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-10 text-center lg:text-left">
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
                <div className="bg-primary-600 p-1.5 rounded-lg">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">QR Vault</span>
            </Link>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {isLogin ? 'Access your secure vault dashboard.' : 'Start sharing files securely today.'}
            </p>
          </div>

          <div className="mt-8">
            {/* Google Login */}
            <button 
                onClick={handleGoogleLogin}
                type="button"
                className="w-full flex justify-center items-center gap-3 px-4 py-3 border border-gray-300 dark:border-white/10 shadow-sm bg-white dark:bg-white/5 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
            >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Sign in with Google
            </button>

            <div className="mt-6 relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-[#0a0a0a] text-gray-500 dark:text-gray-400">Or continue with email</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                {error && <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800 flex items-start gap-2"><Lock className="w-4 h-4 mt-0.5 shrink-0"/> {error}</div>}
                {msg && <div className="text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800 flex items-start gap-2"><ShieldCheck className="w-4 h-4 mt-0.5 shrink-0"/> {msg}</div>}
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white rounded-lg placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all"
                            placeholder="you@example.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white rounded-lg placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Please wait...</span>
                        </>
                    ) : (
                        <>
                            {isLogin ? 'Sign In' : 'Sign Up'} <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>
            
            <div className="mt-6 text-center">
                <button 
                    onClick={() => { setIsLogin(!isLogin); setError(''); setMsg(''); }}
                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500"
                >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Visual */}
      <div className="hidden lg:block relative w-0 flex-1 bg-gray-900">
         <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-indigo-900 opacity-90"></div>
         <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary-400 blur-3xl opacity-20 animate-pulse"></div>
         <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-400 blur-3xl opacity-20"></div>
         
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

         <div className="relative h-full flex flex-col justify-center px-20 text-white">
            <div className="mb-8 animate-fade-in-up">
                <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />)}
                </div>
                <h3 className="text-4xl font-bold leading-tight mb-6">
                    "QR Vault simplified our entire document distribution process. It's the cleanest way to share files."
                </h3>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold border border-white/30">
                        JD
                    </div>
                    <div>
                        <p className="font-bold text-lg">James Davidson</p>
                        <p className="text-primary-200">Operations Director, TechFlow</p>
                    </div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};