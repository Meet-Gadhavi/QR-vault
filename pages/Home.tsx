import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Zap, FolderOpen, Share2, FileText, Image, Package, Utensils, GraduationCap, Briefcase, HelpCircle, CheckCircle2, Star, Quote } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();



  return (
    <div className="overflow-hidden bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-[#0a0a0a] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            New: Pro Plan with 20GB Storage
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6 animate-fade-in-up-delay-1 opacity-0">
            One QR. <span className="text-primary-600 dark:text-primary-400">Any File.</span> <br />
            Secure Sharing.
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up-delay-2 opacity-0">
            Upload photos, PDFs, ZIPs, links, or folders. Generate a single QR code that lets anyone preview and download — instantly and securely.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up-delay-2 opacity-0">
            <Link to="/login" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg shadow-primary-200 dark:shadow-primary-900/40 transition-all hover:-translate-y-1 hover:shadow-xl">
              Get Started Free (1 GB)
            </Link>
            <Link to="/pricing" className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:-translate-y-1">
              View Pricing
            </Link>
          </div>
        </div>
        
        {/* Abstract Background Element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-30 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">How It Works</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Share anything in 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { 
                icon: <FolderOpen className="w-8 h-8 text-primary-600" />, 
                title: "1. Upload Anything", 
                desc: "Drag & drop photos, PDFs, ZIPs, links, or documents into your secure vault." 
              },
              { 
                icon: <Package className="w-8 h-8 text-primary-600" />, 
                title: "2. Auto-Categorized", 
                desc: "We intelligently group your files by type and generate instant previews." 
              },
              { 
                icon: <Share2 className="w-8 h-8 text-primary-600" />, 
                title: "3. Share via QR", 
                desc: "Generate one unique QR code. Users scan to view and download files without login." 
              },
            ].map((step, i) => (
              <div key={i} className="relative group p-8 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-[#0a0a0a] hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-white/10 hover:border-primary-100 dark:hover:border-primary-900/50 top-0 hover:-top-2">
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-all duration-300">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 bg-gray-50 dark:bg-white/5 relative overflow-hidden transition-colors duration-300">
        {/* Decorative Circles */}
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-4 border-primary-100 dark:border-primary-900/20 opacity-50 animate-float"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/20 opacity-30 animate-float-delayed"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Built for Everyone</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">See how QR Vault helps different industries</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
             <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-6">
                   <Utensils className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Restaurants</h3>
                <p className="text-gray-600 dark:text-gray-400">Instantly update digital menus without re-printing QR stickers. Upload new PDFs and the QR stays the same.</p>
             </div>
             <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-6">
                   <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Real Estate</h3>
                <p className="text-gray-600 dark:text-gray-400">Share property floor plans, legal docs, and virtual tour links in one scan during open houses.</p>
             </div>
             <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-6">
                   <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Education</h3>
                <p className="text-gray-600 dark:text-gray-400">Teachers can bundle assignment PDFs, resource links, and example images into a single code for students.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Security Featurette */}
      <section className="py-24 bg-gray-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800 text-primary-300 text-sm font-medium mb-6">
                <ShieldCheck className="w-4 h-4" /> Enterprise-Grade Security
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Secure by Default. <br/>Private by Design.</h2>
              <p className="text-gray-400 text-lg mb-8">Your files are encrypted at rest and in transit. You control the lifespan of your QR codes.</p>
              <ul className="space-y-4">
                {[
                  "AES-256 Encryption for all stored files",
                  "Disable or delete QR codes instantly",
                  "No login required for downloaders (frictionless)",
                  "Automatic malware scanning"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative animate-float">
               <div className="absolute inset-0 bg-primary-500 rounded-2xl rotate-3 opacity-20 blur-xl"></div>
               <div className="relative bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">
                 <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-xs text-gray-500">Secure Vault Preview</span>
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-gray-700/50 rounded-lg">
                      <FileText className="text-blue-400" />
                      <div className="flex-1">
                        <div className="h-2 w-24 bg-gray-600 rounded mb-2 animate-pulse"></div>
                        <div className="h-2 w-16 bg-gray-600 rounded opacity-50"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-gray-700/50 rounded-lg">
                      <Image className="text-purple-400" />
                      <div className="flex-1">
                         <div className="h-2 w-32 bg-gray-600 rounded mb-2 animate-pulse"></div>
                         <div className="h-2 w-12 bg-gray-600 rounded opacity-50"></div>
                      </div>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials (Updated Design) */}
      <section className="py-24 bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Trusted by 10,000+ Users</h2>
              <p className="text-xl text-gray-500 dark:text-gray-400">See why people love using QR Vault.</p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-8">
              {[
                  {
                      quote: "I use QR Vault to share wedding photos. Guests just scan and download. No apps needed!",
                      author: "Sarah J.",
                      role: "Event Planner",
                      color: "bg-pink-100 text-pink-600"
                  },
                  {
                      quote: "The ability to update files without changing the QR code is a lifesaver for our restaurant menus.",
                      author: "Mike T.",
                      role: "Restaurant Owner",
                      color: "bg-orange-100 text-orange-600"
                  },
                  {
                      quote: "Finally, a file sharing tool that doesn't force people to create an account to view files.",
                      author: "Elena R.",
                      role: "Freelance Designer",
                      color: "bg-blue-100 text-blue-600"
                  }
              ].map((t, i) => (
                  <div key={i} className="group relative bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-white/5 hover:-translate-y-2">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                         <Quote className="w-16 h-16 text-primary-600 dark:text-primary-400 transform rotate-12" />
                      </div>
                      
                      <div className="flex items-center gap-1 mb-6">
                        {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />)}
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-8 relative z-10 font-medium">"{t.quote}"</p>
                      
                      <div className="flex items-center gap-4 border-t border-gray-50 dark:border-gray-800 pt-6">
                          <div className={`w-12 h-12 rounded-full ${t.color.replace('bg-', 'dark:bg-opacity-20 ')} flex items-center justify-center font-bold text-lg`}>
                              {t.author.charAt(0)}
                          </div>
                          <div>
                              <p className="font-bold text-gray-900 dark:text-white">{t.author}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{t.role}</p>
                          </div>
                      </div>
                  </div>
              ))}
           </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-24 bg-primary-50 dark:bg-primary-900/10 transition-colors duration-300">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
           <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">Frequently Asked Questions</h2>
           <div className="space-y-6">
              {[
                  { q: "Is it really free?", a: "Yes! Our Free plan gives you 1GB of storage forever. You can upgrade if you need more space." },
                  { q: "Do people need an app to scan?", a: "No. They just use their phone camera. No app download or login is required to view files." },
                  { q: "Can I update files later?", a: "Absolutely. The QR code is dynamic. You can add or remove files in your dashboard anytime." }
              ].map((faq, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-transparent dark:border-white/5">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <HelpCircle className="w-5 h-5 text-primary-500 dark:text-primary-400" />
                          {faq.q}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 ml-7">{faq.a}</p>
                  </div>
              ))}
           </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to simplify your file sharing?</h2>
          <p className="text-primary-100 text-lg mb-10">Join thousands of users sharing smart QR codes today.</p>
          <Link to="/login" className="inline-block bg-white text-primary-600 px-8 py-4 rounded-xl text-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
            Get Started For Free
          </Link>
          <p className="mt-4 text-sm text-primary-200">No credit card required. Cancel anytime.</p>
        </div>
      </section>
    </div>
  );
};