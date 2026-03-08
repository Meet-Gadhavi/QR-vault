import React from 'react';
import { Mail, Clock, Shield, Lock, Globe, Zap, Users, HelpCircle } from 'lucide-react';

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

export const Contact: React.FC = () => (
  <InfoLayout title="Contact Us">
    <div className="space-y-8">
      <p>If you need help or have questions regarding QR Vault services, please contact us.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Email Support</h3>
              <p className="text-primary-600 font-medium">support@qrvault.app</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Support Response Time</h3>
              <p className="text-gray-500">Typically 24–48 hours</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4">For technical issues, please include:</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary-600 rounded-full"></div>
              <span>Account email</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary-600 rounded-full"></div>
              <span>Description of the problem</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary-600 rounded-full"></div>
              <span>Screenshots if possible</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </InfoLayout>
);

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
