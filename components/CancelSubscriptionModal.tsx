import React, { useState } from 'react';
import { AlertTriangle, Mail, X, Check } from 'lucide-react';
import { mockService } from '../services/mockService';
import { toast } from 'sonner';
import { PlanType } from '../types';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onCancelSuccess: () => void;
}

export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  onCancelSuccess
}) => {
  const [cancelStep, setCancelStep] = useState<'confirm' | 'verify'>('confirm');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setCancelStep('confirm');
    setVerificationCode('');
    setVerificationError('');
    onClose();
  };

  const requestCancelCode = async () => {
    if (!userId || !userEmail) return;
    setSendingCode(true);
    setVerificationError('');
    try {
      await mockService.sendCancellationCode(userId, userEmail);
      toast.success('Verification code sent to your email.');
      setCancelStep('verify');
    } catch (e: any) {
      console.error('Failed to send verification code:', e);
      toast.error(e.message || 'Failed to send verification code. Please make sure your Google account is connected.');
    } finally {
      setSendingCode(false);
    }
  };

  const confirmCancel = async () => {
    if (!userId || !verificationCode) return;
    setCancelling(true);
    setVerificationError('');
    try {
      await mockService.verifyCancellationCode(userId, verificationCode);
      await mockService.cancelSubscription(userId);
      toast.success('Your subscription has been successfully cancelled.');
      onCancelSuccess();
      handleClose();
    } catch (e: any) {
      console.error('Failed to cancel subscription:', e);
      setVerificationError(e.message || 'Invalid verification code. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300" 
        onClick={handleClose} 
      />

      {/* Modal Card */}
      <div 
        className="relative bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-300 transform scale-100" 
        role="dialog" 
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Cancel Subscription
          </h3>
          <button 
            onClick={handleClose}
            className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cancelStep === 'confirm' ? (
          <>
            {/* Warning Banner */}
            <div className="p-6 bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/20 flex gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">Downgrade Warning</h4>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1 leading-relaxed">
                  Cancelling will immediately downgrade you to the Free plan. Your storage limit will return to 1 GB and you will lose access to premium custom domains and visual QR personalization features.
                </p>
              </div>
            </div>

            {/* Content & Actions */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                To confirm cancellation, we will send a 6-digit verification code to your email <strong>{userEmail}</strong> using your connected Google account.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={requestCancelCode}
                  disabled={sendingCode}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow transition-all duration-200 gap-2 cursor-pointer"
                >
                  {sendingCode ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    <>Get Verification Code</>
                  )}
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 font-medium text-sm rounded-lg shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
                >
                  Keep My Subscription
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Info Banner */}
            <div className="p-6 bg-purple-50 dark:bg-purple-950/20 border-b border-purple-100 dark:border-purple-900/20 flex gap-4">
              <div className="flex-shrink-0">
                <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300">Code Sent</h4>
                <p className="text-xs text-purple-700 dark:text-purple-400 mt-1 leading-relaxed">
                  We've sent a 6-digit code to <strong>{userEmail}</strong> via Gmail. Please check your inbox (and spam folder) and enter it below.
                </p>
              </div>
            </div>

            {/* Input & Verification */}
            <div className="p-6 space-y-5">
              <div>
                <label htmlFor="cancel-verif-code" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Verification Code
                </label>
                <input
                  id="cancel-verif-code"
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationError('');
                    setVerificationCode(e.target.value.replace(/\D/g, ''));
                  }}
                  className={`w-full bg-gray-50 dark:bg-[#1a1a1a] border ${
                    verificationError 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-700 focus:border-purple-600'
                  } rounded-lg px-4 py-3 text-center text-2xl font-bold tracking-widest focus:outline-none transition-all dark:text-white`}
                  placeholder="000000"
                />
                {verificationError && (
                  <p className="text-red-500 text-xs mt-2 font-medium">{verificationError}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCancelStep('confirm');
                    setVerificationCode('');
                    setVerificationError('');
                  }}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 font-medium text-sm rounded-lg shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={confirmCancel}
                  disabled={cancelling || verificationCode.length < 6}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg shadow-sm hover:shadow transition-all duration-200 gap-2 cursor-pointer"
                >
                  {cancelling ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Confirm Cancel'
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-gray-400">
                Didn't receive a code?{' '}
                <button 
                  onClick={requestCancelCode} 
                  className="text-purple-600 dark:text-purple-400 font-bold hover:underline bg-transparent border-0 p-0 cursor-pointer"
                >
                  Resend Email
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
