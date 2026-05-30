import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, XCircle, X, AlertTriangle, Mail } from 'lucide-react';
import { PlanType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { mockService } from '../services/mockService';
import { toast } from 'sonner';
import { CancelSubscriptionModal } from '../components/CancelSubscriptionModal';

const planData = [
  {
    id: PlanType.FREE,
    name: 'Free',
    price: '₹0',
    period: '/forever',
    features: [
      '1 GB Secure Storage',
      'Unlimited QR Scans',
      'Auto-delete after 24 hours',
      'Community Support'
    ],
    highlight: 'Ideal for quick, temporary sharing.',
    cta: 'Start for Free',
    primary: false,
    link: '/login'
  },
  {
    id: PlanType.STARTER,
    name: 'Plus',
    price: '₹99',
    originalPrice: '₹199',
    period: '/month',
    features: [
      '10 GB Secure Storage',
      'Expiration Rules (Auto-expire)',
      'Unlimited QR Vaults',
      'Priority Speed & Performance',
      'Detailed Scan Analytics',
      'Ad-Free Experience'
    ],
    highlight: 'Best for personal projects & small files.',
    cta: 'Upgrade to Plus',
    primary: true,
    tag: 'Most Popular',
    link: `/payment?plan=${PlanType.STARTER}`
  },
  {
    id: PlanType.PRO,
    name: 'Pro',
    price: '₹199',
    originalPrice: '₹299',
    period: '/month',
    features: [
      '20 GB Secure Storage',
      'Permanent Storage (Optional Expiry)',
      'Password Protected Vaults',
      'Fastest Global Delivery',
      'Custom Branding & Logo',
      '24/7 Premium Support'
    ],
    highlight: 'Maximum storage for professionals.',
    cta: 'Go Pro Now',
    primary: false,
    link: `/payment?plan=${PlanType.PRO}`
  }
];

export const Pricing: React.FC = () => {
  const { isAuthenticated, userId, userEmail } = useAuth();
  const [userPlan, setUserPlan] = React.useState<PlanType | null>(null);
  const [planExpiry, setPlanExpiry] = React.useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = React.useState(false);

  React.useEffect(() => {
    const loadUserPlan = async () => {
      if (isAuthenticated && userId) {
        try {
          const user = await mockService.getUser(userId);
          setUserPlan(user.plan);
          setPlanExpiry(user.subscriptionExpiryDate || null);
        } catch (e) {
          console.error('Failed to load user plan', e);
        }
      }
    };
    loadUserPlan();
  }, [isAuthenticated, userId]);

  const formatExpiry = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    if (diff < 0) return 'Expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    if (months > 0) return `${months} month${months > 1 ? 's' : ''}, ${days % 30} day${(days % 30) !== 1 ? 's' : ''} left`;
    return `${days} day${days !== 1 ? 's' : ''} left`;
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const getButtonState = (planId: PlanType) => {
    if (!isAuthenticated || !userPlan) {
      return { disabled: false, isCurrentPlan: false, showExpiry: false, needsCancel: false };
    }

    const currentPlanName = userPlan === PlanType.STARTER ? 'Plus' : userPlan === PlanType.PRO ? 'Pro' : 'Free';
    const hasPaidPlan = userPlan === PlanType.STARTER || userPlan === PlanType.PRO;

    if (planId === userPlan) {
      return { disabled: true, isCurrentPlan: true, showExpiry: planId !== PlanType.FREE, needsCancel: false };
    }

    if (hasPaidPlan && planId !== userPlan) {
      return { disabled: true, isCurrentPlan: false, showExpiry: false, needsCancel: true, currentPlanName };
    }

    return { disabled: false, isCurrentPlan: false, showExpiry: false, needsCancel: false };
  };

  return (
    <>
      <div className="py-24 bg-gray-50 dark:bg-[#0a0a0a] min-h-[calc(100vh-64px)] relative overflow-hidden transition-colors duration-300">
        {/* Decorative Blobs */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary-100/50 dark:bg-primary-900/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary-100/50 dark:bg-primary-900/20 rounded-full blur-3xl opacity-50" />
 
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in-up">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
              Powerful Plans for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-600">Total Control</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              Secure your digital assets with the vault that fits your lifestyle. 
              Upgrade anytime to unlock permanent storage and premium features.
            </p>
          </div>

          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {planData.map((plan, idx) => {
              const state = getButtonState(plan.id);
              const isFree = plan.id === PlanType.FREE;

              return (
                <div 
                  key={plan.name} 
                  className={`group relative rounded-3xl transition-all duration-300 flex flex-col animate-fade-in-up-delay-${idx} ${
                    plan.primary 
                      ? 'bg-white dark:bg-gray-800 border-2 border-primary-500 shadow-2xl shadow-primary-200/50 dark:shadow-primary-900/20 md:scale-105 z-10' 
                      : 'bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:shadow-xl'
                  }`}
                >
                  {plan.tag && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-6 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase shadow-lg z-20">
                      {plan.tag}
                    </div>
                  )}

                  <div className="p-8 sm:p-10">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{plan.highlight}</p>
                      </div>
                      {isFree && (
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg" aria-label="Temporary Storage Info">
                          <XCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                      )}
                    </div>

                    <div className="mb-8">
                      {plan.originalPrice && (
                        <span className="text-sm text-gray-400 dark:text-gray-500 line-through block mb-1">{plan.originalPrice}</span>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">{plan.price}</span>
                        <span className="text-gray-500 dark:text-gray-400 font-medium">{plan.period}</span>
                      </div>
                    </div>

                    <ul className="space-y-4 mb-10">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <div className={`mt-1 flex-shrink-0 p-0.5 rounded-full ${
                            feature.includes('delete') ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary-50 dark:bg-primary-900/30'
                          }`}>
                            {feature.includes('delete') ? (
                              <XCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <Check className="h-3 w-3 text-primary-600 dark:text-primary-400" />
                            )}
                          </div>
                          <span className={`text-sm leading-tight ${
                            feature.includes('delete') ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'text-gray-600 dark:text-gray-300'
                          }`}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto">
                      {state.isCurrentPlan ? (
                        <div className="space-y-3">
                          {planExpiry && (
                            <div className="w-full py-4 px-6 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-2xl text-center">
                              <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400 font-bold text-sm">
                                <Clock className="w-4 h-4" />
                                {formatExpiry(planExpiry)}
                              </div>
                            </div>
                          )}
                          <div className="w-full py-4 bg-green-500 text-white rounded-2xl text-center font-bold shadow-lg shadow-green-200 dark:shadow-green-900/20 cursor-default">
                            Your Active Plan
                          </div>
                          {(plan.id === PlanType.STARTER || plan.id === PlanType.PRO) && (
                            <button
                              onClick={handleCancel}
                              className="w-full py-3 text-red-500 hover:text-red-700 dark:hover:text-red-400 font-bold text-sm transition-all hover:tracking-wide flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                              Cancel Subscription
                            </button>
                          )}
                        </div>
                      ) : state.needsCancel ? (
                        <div className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl text-center text-xs font-bold leading-relaxed px-4">
                          Cancel your {state.currentPlanName} plan before switching
                        </div>
                      ) : (
                        <Link
                          to={plan.link}
                          className={`group/btn relative w-full inline-flex items-center justify-center py-4 px-8 font-bold text-lg transition-all duration-300 rounded-2xl overflow-hidden ${
                            plan.primary
                              ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-xl shadow-primary-200 dark:shadow-primary-900'
                              : 'bg-white dark:bg-gray-800 border-2 border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10'
                          }`}
                        >
                          <span className="relative z-10">{plan.cta}</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Comparison Link */}
          <div className="mt-20 text-center animate-fade-in-up-delay-2">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Need more storage for enterprise? <Link to="/contact" className="text-primary-600 dark:text-primary-400 hover:underline">Contact our sales team</Link>
            </p>
          </div>
        </div>
      </div>

      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        userId={userId || ''}
        userEmail={userEmail || ''}
        onCancelSuccess={() => {
          setUserPlan(PlanType.FREE);
          setPlanExpiry(null);
        }}
      />
    </>
  );
};