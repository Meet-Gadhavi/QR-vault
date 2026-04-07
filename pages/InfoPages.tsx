import React from 'react';
import { Mail, Clock, Shield, Lock, Globe, Zap, Users, HelpCircle, Send, User, MessageSquare, AlertCircle } from 'lucide-react';
import { mockService } from '../services/mockService';
import { useNotification } from '../contexts/NotificationContext';

const InfoLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="max-w-4xl mx-auto px-4 py-16">
    <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">{title}</h1>
    <div className="text-gray-600 space-y-8">
      {children}
    </div>
  </div>
);

export const About: React.FC = () => (
  <InfoLayout title="About Us">
    <div className="space-y-6">
      <p className="text-lg">QR Vault is a cloud-based platform designed to simplify file sharing using QR technology.</p>
      <p>Our platform allows users to upload files such as images, PDFs, ZIP files, and links, then instantly generate QR codes that can be scanned from any device for quick access and downloading.</p>
      
      <div className="bg-primary-50 p-8 rounded-2xl border border-primary-100">
        <h2 className="text-xl font-bold text-primary-900 mb-4">The idea behind QR Vault is simple:</h2>
        <p className="text-primary-800 text-lg italic">"Make sharing files fast, secure, and accessible anywhere."</p>
      </div>

      <p>We aim to provide an easy-to-use solution for individuals, students, creators, and businesses who need a reliable way to store and share digital content.</p>
      <p>Our mission is to build a secure and efficient file-sharing ecosystem powered by QR technology and modern cloud infrastructure.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Fast</h3>
          <p className="text-sm">Instant QR generation and high-speed downloads.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Secure</h3>
          <p className="text-sm">Enterprise-grade encryption for all your files.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
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
    <div className="min-h-screen bg-gray-50/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Side: Contact Info */}
          <div className="space-y-12">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">
                Let's <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">Start a Conversation</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Have questions about our enterprise features, storage limits, or custom solutions? 
                Our team is here to help you secure your digital vault.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Email Us</h3>
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
          <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-2xl shadow-gray-200/50 border border-gray-100 relative">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Send Us a Message</h2>
            
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
                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-xl px-4 py-3 outline-none transition-all"
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

            <div className="mt-8 flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
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
        <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Storage</h3>
          <p>Files are stored using modern cloud infrastructure powered by Supabase, ensuring high availability and durability.</p>
        </div>

        <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Encrypted Connections</h3>
          <p>All data transfers between your device and our servers occur over secure encrypted (HTTPS) connections.</p>
        </div>

        <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-6">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Secure QR Links</h3>
          <p>QR codes generate unique, obfuscated links that allow users to preview and download files safely without exposing internal paths.</p>
        </div>

        <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
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
