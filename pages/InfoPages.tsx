import React from 'react';
import { Mail, Clock, Shield, Lock, Globe, Zap, Users, HelpCircle, Send, User, MessageSquare, AlertCircle, ShieldCheck, Rocket, Construction } from 'lucide-react';
import { mockService } from '../services/mockService';
import { useNotification } from '../contexts/NotificationContext';

const InfoLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="max-w-4xl mx-auto px-4 py-16 dark:bg-[#0a0a0a] transition-colors duration-300">
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 border-b dark:border-white/10 pb-4">{title}</h1>
    <div className="text-gray-600 dark:text-gray-400 space-y-8">
      {children}
    </div>
  </div>
);

export const About: React.FC = () => (
  <InfoLayout title="About Us">
    <div className="space-y-6">
      <p className="text-lg">QR Vault is a cloud-based platform designed to simplify file sharing using QR technology.</p>
      <p>Our platform allows users to upload files such as images, PDFs, ZIP files, and links, then instantly generate QR codes that can be scanned from any device for quick access and downloading.</p>
      
      <div className="bg-primary-50 dark:bg-primary-900/20 p-8 rounded-2xl border border-primary-100 dark:border-primary-800">
        <h2 className="text-xl font-bold text-primary-900 dark:text-primary-300 mb-4">The idea behind QR Vault is simple:</h2>
        <p className="text-primary-800 dark:text-primary-400 text-lg italic">"Make sharing files fast, secure, and accessible anywhere."</p>
      </div>

      <p>We aim to provide an easy-to-use solution for individuals, students, creators, and businesses who need a reliable way to store and share digital content.</p>
      <p>Our mission is to build a secure and efficient file-sharing ecosystem powered by QR technology and modern cloud infrastructure.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 text-center">
          <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Fast</h3>
          <p className="text-sm">Instant QR generation and high-speed downloads.</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 text-center">
          <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Secure</h3>
          <p className="text-sm">Enterprise-grade encryption for all your files.</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 text-center">
          <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Accessible</h3>
          <p className="text-sm">Scan and download from any device, anywhere.</p>
        </div>
      </div>
    </div>
  </InfoLayout>
);

export const Contact: React.FC = () => {
  const { toast } = useNotification();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await (mockService as any).submitContactForm(formData);
      toast('Message Sent', "We've received your inquiry and will get back to you soon.", 'success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast('Error', 'Failed to send message. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#0a0a0a] py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Side: Contact Info */}
          <div className="space-y-12">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
                Let's <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">Start a Conversation</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">
                Have questions about our enterprise features, storage limits, or custom solutions? 
                Our team is here to help you secure your digital vault.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Email Us</h3>
                <p className="text-sm text-gray-500 mb-2">For general inquiries</p>
                <a href="mailto:support@qrvault.app" className="text-primary-600 font-semibold hover:underline">support@qrvault.app</a>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Response Time</h3>
                <p className="text-sm text-gray-500 mb-2">Fast support</p>
                <p className="text-primary-600 font-semibold">Within 24 hours</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-primary-200">
               <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
               <div className="relative z-10">
                 <h3 className="text-xl font-bold mb-4">Why Contact Our Sales?</h3>
                 <ul className="space-y-4">
                   {[
                     'Custom storage limits for teams',
                     'Dedicated account management',
                     'Advanced security configurations',
                     'SLA-backed priority support'
                   ].map((item, i) => (
                     <li key={i} className="flex items-center gap-3 text-primary-50">
                       <Shield className="w-5 h-5 text-primary-200" />
                       <span className="font-medium">{item}</span>
                     </li>
                   ))}
                 </ul>
               </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 lg:p-10 shadow-2xl shadow-gray-200/50 dark:shadow-black/50 border border-gray-100 dark:border-white/10 relative">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Send Us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Full Name
                  </label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary-500 dark:text-white focus:ring-2 focus:ring-primary-500/20 rounded-xl px-4 py-3 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> Best Email
                  </label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-xl px-4 py-3 outline-none transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5" /> Inquiry Subject
                </label>
                <input
                  required
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-xl px-4 py-3 outline-none transition-all"
                  placeholder="Need 100GB enterprise storage"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" /> Message
                </label>
                <textarea
                  required
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-xl px-4 py-3 outline-none transition-all resize-none"
                  placeholder="Tell us about your needs..."
                />
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-200 transition-all flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending Inquiry...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Send Message
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                Our sales team typically responds to enterprise inquiries within half a business day. 
                For emergency technical support, please use the help center in your dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FAQ: React.FC = () => (
  <InfoLayout title="Frequently Asked Questions">
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary-600" />
          How does QR file sharing work?
        </h3>
        <p className="text-gray-600 ml-7">Users upload a file or link and generate a QR code. Anyone scanning the QR code can access a preview and download the content.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary-600" />
          How long are files stored?
        </h3>
        <p className="text-gray-600 ml-7">Files remain stored until the user deletes them or the storage limit is exceeded.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary-600" />
          Is my data secure?
        </h3>
        <p className="text-gray-600 ml-7">Yes. QR Vault uses secure cloud infrastructure and authentication systems to protect user data.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary-600" />
          What happens if my storage becomes full?
        </h3>
        <div className="text-gray-600 ml-7">
          <p>Users can:</p>
          <ul className="list-disc ml-5 mt-2">
            <li>Delete existing files</li>
            <li>Upgrade to a higher plan</li>
            <li>Connect external storage (such as Google Drive, if enabled)</li>
          </ul>
        </div>
      </div>
    </div>
  </InfoLayout>
);

export const Security: React.FC = () => (
  <InfoLayout title="Security">
    <div className="space-y-8">
      <p className="text-lg">QR Vault prioritizes data protection and platform security.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Storage</h3>
          <p>Files are stored using modern cloud infrastructure powered by Supabase, ensuring high availability and durability.</p>
        </div>

        <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Encrypted Connections</h3>
          <p>All data transfers between your device and our servers occur over secure encrypted (HTTPS) connections.</p>
        </div>

        <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-6">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Secure QR Links</h3>
          <p>QR codes generate unique, obfuscated links that allow users to preview and download files safely without exposing internal paths.</p>
        </div>

        <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-6">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">External Storage</h3>
          <p>Users may optionally connect services such as Google Drive for additional storage capacity, leveraging Google's world-class security.</p>
        </div>
      </div>
    </div>
  </InfoLayout>
);

export const Changelog: React.FC = () => (
  <InfoLayout title="Changelog & Updates">
    <div className="space-y-12">
      <p className="text-lg">Follow the evolution of QR Vault as we deploy new features and security enhancements.</p>
      
      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-800 before:to-transparent">
        
        {/* Update 1.4 */}
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group select-none">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-gray-900 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors group-hover:bg-primary-600 group-hover:text-white">
            <Send className="w-5 h-5" />
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md hover:border-primary-100 dark:hover:border-primary-900/40">
            <div className="flex items-center justify-between mb-2">
              <time className="font-black text-primary-600 dark:text-primary-400 text-xs uppercase tracking-widest">Update 1.4</time>
              <span className="text-[10px] font-bold text-gray-400 uppercase">April 2026</span>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">The Collection Epoch</h3>
            
            <div className="space-y-6">
              <div>
                 <span className="text-[10px] font-black text-gray-400 uppercase block mb-3 tracking-[0.2em] leading-none">Data Receiving Protocol</span>
                 <ul className="space-y-2.5">
                   {[
                     'New "Collection Mode" (Dropbox-style) for receiving files from anyone',
                     'Interactive Form Builder for custom data fields (Name, Email, etc.)',
                     'Integrated Submission Manager for real-time response tracking'
                   ].map((item, i) => (
                     <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                       <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                       {item}
                     </li>
                   ))}
                 </ul>
              </div>

              <div className="bg-primary-500/5 dark:bg-primary-500/10 p-5 rounded-2xl border border-primary-500/20">
                <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase block mb-3 tracking-[0.2em] leading-none">How to Use</span>
                <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300 font-medium italic">
                  Launch the **Create Vault** modal and flip the switcher to **Receiving Mode**. Build your custom form, set file restrictions, and share the link. Your visitors will see a secure upload portal, and you'll see their responses in your **Submission Console**.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group select-none">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-gray-900 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors group-hover:bg-primary-600 group-hover:text-white">
            <Zap className="w-5 h-5" />
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md hover:border-primary-100 dark:hover:border-primary-900/40">
            <div className="flex items-center justify-between mb-2">
              <time className="font-black text-primary-600 dark:text-primary-400 text-xs uppercase tracking-widest">Update 1.3</time>
              <span className="text-[10px] font-bold text-gray-400 uppercase">April 2026</span>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">Responsive Vault Architect</h3>
            
            <div className="space-y-6">
              <div>
                 <span className="text-[10px] font-black text-gray-400 uppercase block mb-3 tracking-[0.2em] leading-none">Key Improvements</span>
                 <ul className="space-y-2.5">
                   {[
                     'Ultra-wide 65px "Identity" inputs for a premium workflow feel',
                     'Balanced 3-column Lifecycle grid with intuitive dropdown protocols',
                     'Optimized side-by-side Asset & Redirect management for large screens'
                   ].map((item, i) => (
                     <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                       <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                       {item}
                     </li>
                   ))}
                 </ul>
              </div>

              <div className="bg-primary-500/5 dark:bg-primary-500/10 p-5 rounded-2xl border border-primary-500/20">
                <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase block mb-3 tracking-[0.2em] leading-none">How to Use</span>
                <div className="space-y-3">
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                    Open the **Create Vault** modal. Notice the new wide layout where every setting has its own horizontal space. The **Vault Name** is now a primary focus, and complex settings like **Scan Capacity** are neatly grouped.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-primary-600 uppercase tracking-widest">
                     <ShieldCheck className="w-3 h-3" /> Best on Desktop & Tablet
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Update 1.2 */}
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group select-none">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-gray-900 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors group-hover:bg-primary-600 group-hover:text-white">
            <Shield className="w-5 h-5" />
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <time className="font-black text-primary-600 dark:text-primary-400 text-xs uppercase tracking-widest">Update 1.2</time>
              <span className="text-[10px] font-bold text-gray-400 uppercase">April 2026</span>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">Access Intelligence</h3>
            
            <div className="space-y-6">
              <div>
                 <span className="text-[10px] font-black text-gray-400 uppercase block mb-3 tracking-[0.2em] leading-none">Security Enhancements</span>
                 <ul className="space-y-2.5">
                   {[
                     'New "Blocked Path" page with custom owner contact prompts',
                     'Standardized messaging for deleted or flagged vault content',
                     'Enhanced transparency for reporting and community compliance'
                   ].map((item, i) => (
                     <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                       <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                       {item}
                     </li>
                   ))}
                 </ul>
              </div>

              <div className="bg-primary-500/5 dark:bg-primary-500/10 p-5 rounded-2xl border border-primary-500/20">
                <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase block mb-3 tracking-[0.2em] leading-none">How to Use</span>
                <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300 font-medium">
                  If a user tries to access a vault that has been deleted by you or blocked by our system, they will see a clear, branded status page directing them to contact the vault owner for further information.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Update 1.1 */}
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group select-none">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-gray-900 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors group-hover:bg-primary-600 group-hover:text-white">
            <Lock className="w-5 h-5" />
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <time className="font-black text-primary-600 dark:text-primary-400 text-xs uppercase tracking-widest">Update 1.1</time>
              <span className="text-[10px] font-bold text-gray-400 uppercase">April 2026</span>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">Stability Shield</h3>
            
            <div className="space-y-6">
              <div>
                 <span className="text-[10px] font-black text-gray-400 uppercase block mb-3 tracking-[0.2em] leading-none">Stability Core</span>
                 <ul className="space-y-2.5">
                   {[
                     'Real-time automated auditing for interface integrity',
                     'Elimination of unterminated expression errors in primary views',
                     'Optimized rendering for multi-asset vault streaming'
                   ].map((item, i) => (
                     <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                       <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                       {item}
                     </li>
                   ))}
                 </ul>
              </div>

              <div className="bg-primary-500/5 dark:bg-primary-500/10 p-5 rounded-2xl border border-primary-500/20">
                <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase block mb-3 tracking-[0.2em] leading-none">How to Use</span>
                <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300 font-medium">
                  Experience a faster and more stable platform. This background update ensures that your dashboard remains active and responsive even when managing hundreds of encrypted files simultaneously.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </InfoLayout>
);

export const Blogs: React.FC = () => (
  <div className="min-h-[80vh] flex items-center justify-center px-4">
    <div className="text-center space-y-8 animate-fade-in-up">
      <div className="relative inline-block">
        <div className="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full animate-pulse" />
        <div className="relative bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-2xl">
          <Rocket className="w-16 h-16 text-primary-600 animate-bounce" />
        </div>
      </div>
      
      <div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter">
          The QR Vault <br/><span className="text-primary-600">Blog</span>
        </h1>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full text-xs font-black uppercase tracking-widest border border-amber-100 dark:border-amber-900/30">
          <Construction className="w-3.5 h-3.5" /> Coming Very Soon
        </div>
      </div>

      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
        We're crafting high-quality articles on security, file sharing protocols, and digital workflows. Stay tuned for the first edition!
      </p>

      <div className="pt-4">
        <a href="/" className="inline-block bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-gray-200 dark:shadow-none">
          Back to Home
        </a>
      </div>
    </div>
  </div>
);

export const API: React.FC = () => (
  <div className="min-h-[80vh] flex items-center justify-center px-4">
    <div className="text-center space-y-8 animate-fade-in-up">
      <div className="relative inline-block">
        <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse" />
        <div className="relative bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-2xl">
          <Zap className="w-16 h-16 text-indigo-500" />
        </div>
      </div>
      
      <div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter">
          Developer <br/><span className="text-indigo-600">API Portal</span>
        </h1>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full text-xs font-black uppercase tracking-widest border border-primary-100 dark:border-primary-900/30">
          <Terminal className="w-3.5 h-3.5" /> Under Construction
        </div>
      </div>

      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
        We're building a powerful REST API to help you programmatically create vaults, manage assets, and generate QR codes at scale.
      </p>

      <div className="pt-10 grid grid-cols-2 gap-4 max-w-sm mx-auto text-left">
        <div className="bg-gray-100 dark:bg-white/5 p-4 rounded-2xl border border-gray-200 dark:border-white/5">
           <div className="text-[10px] font-black text-gray-400 uppercase mb-2">Endpoint</div>
           <div className="text-xs font-mono text-gray-900 dark:text-gray-300">/api/v1/vault</div>
        </div>
        <div className="bg-gray-100 dark:bg-white/5 p-4 rounded-2xl border border-gray-200 dark:border-white/5">
           <div className="text-[10px] font-black text-gray-400 uppercase mb-2">Auth</div>
           <div className="text-xs font-mono text-gray-900 dark:text-gray-300">Bearer Token</div>
        </div>
      </div>

      <div className="pt-8">
        <a href="/" className="inline-block bg-primary-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary-200">
          Get Early Access
        </a>
      </div>
    </div>
  </div>
);
