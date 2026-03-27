import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, XCircle, X, AlertTriangle } from 'lucide-react';
import { PlanType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { mockService } from '../services/mockService';

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
      'Permanent Storage (No Deletion)',
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
      'Full File Control & Lifecycle',
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
  const { isAuthenticated, userId } = useAuth();
  const [userPlan, setUserPlan] = React.useState<PlanType | null>(null);
  const [planExpiry, setPlanExpiry] = React.useState<string | null>(null);
  const [cancelling, setCancelling] = React.useState(false);
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

  const confirmCancel = async () => {
    if (!userId) return;
    setCancelling(true);
    try {
      await mockService.cancelSubscription(userId);
      setUserPlan(PlanType.FREE);
      setPlanExpiry(null);
      setShowCancelModal(false);
    } catch (e) {
      console.error('Failed to cancel', e);
      alert('Failed to cancel subscription.');
    } finally {
      setCancelling(false);
    }
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
      <div className="py-24 bg-gray-50 min-h-[calc(100vh-64px)] relative overflow-hidden">
        {/* Decorative Blobs */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary-100/50 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary-100/50 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in-up">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Powerful Plans for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">Total Control</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Secure your digital assets with the vault that fits your lifestyle. 
              Upgrade anytime to unlock permanent storage and premium features.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-stretch">
            {planData.map((plan, idx) => {
              const state = getButtonState(plan.id);
              const isFree = plan.id === PlanType.FREE;

              return (
                <div 
                  key={plan.name} 
                  className={`group relative rounded-3xl transition-all duration-300 flex flex-col animate-fade-in-up-delay-${idx} ${
                    plan.primary 
                      ? 'bg-white border-2 border-primary-500 shadow-2xl shadow-primary-200/50 scale-105 z-10' 
                      : 'bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-gray-300 hover:shadow-xl'
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
                        <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-500 mt-1 font-medium">{plan.highlight}</p>
                      </div>
                      {isFree && (
                        <div className="p-2 bg-amber-50 rounded-lg" title="Temporary Storage">
                          <XCircle className="w-5 h-5 text-amber-600" />
                        </div>
                      )}
                    </div>

                    <div className="mb-8">
                      {plan.originalPrice && (
                        <span className="text-sm text-gray-400 line-through block mb-1">{plan.originalPrice}</span>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black text-gray-900 tracking-tight">{plan.price}</span>
                        <span className="text-gray-500 font-medium">{plan.period}</span>
                      </div>
                    </div>

                    <ul className="space-y-4 mb-10">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <div className={`mt-1 flex-shrink-0 p-0.5 rounded-full ${
                            feature.includes('delete') ? 'bg-amber-100' : 'bg-primary-50'
                          }`}>
                            {feature.includes('delete') ? (
                              <XCircle className="h-3 w-3 text-amber-600" />
                            ) : (
                              <Check className="h-3 w-3 text-primary-600" />
                            )}
                          </div>
                          <span className={`text-sm leading-tight ${
                            feature.includes('delete') ? 'text-amber-700 font-semibold' : 'text-gray-600'
                          }`}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto">
                      {state.isCurrentPlan && state.showExpiry && planExpiry ? (
                        <div className="space-y-3">
                          <div className="w-full py-4 px-6 bg-green-50 border border-green-100 rounded-2xl text-center">
                            <div className="flex items-center justify-center gap-2 text-green-700 font-bold text-sm">
                              <Clock className="w-4 h-4" />
                              {formatExpiry(planExpiry)}
                            </div>
                          </div>
                          <button
                            onClick={handleCancel}
                            disabled={cancelling}
                            className="w-full py-3 text-red-500 hover:text-red-700 font-bold text-sm transition-all hover:tracking-wide flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                          </button>
                        </div>
                      ) : state.isCurrentPlan ? (
                        <div className="w-full py-4 bg-green-500 text-white rounded-2xl text-center font-bold shadow-lg shadow-green-200 cursor-default">
                          Your Active Plan
                        </div>
                      ) : state.needsCancel ? (
                        <div className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl text-center text-xs font-bold leading-relaxed px-4">
                          Cancel your {state.currentPlanName} plan before switching
                        </div>
                      ) : (
                        <Link
                          to={plan.link}
                          className={`group/btn relative w-full inline-flex items-center justify-center py-4 px-8 font-bold text-lg transition-all duration-300 rounded-2xl overflow-hidden ${
                            plan.primary
                              ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-xl shadow-primary-200'
                              : 'bg-white border-2 border-primary-500 text-primary-600 hover:bg-primary-50'
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
            <p className="text-gray-500 text-sm font-medium">
              Need more storage for enterprise? <a href="mailto:support@qrvault.com" className="text-primary-600 hover:underline">Contact our sales team</a>
            </p>
          </div>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {
        showCancelModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-red-50 p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Cancel Subscription?</h3>
                <p className="text-sm text-gray-600 mt-2">
                  You will be downgraded to the <strong>Free plan</strong> immediately. You'll lose access to your premium features and your storage limit will be reduced to 1 GB.
                </p>
              </div>
              <div className="p-6 flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={confirmCancel}
                  disabled={cancelling}
                  className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Cancelling...</>
                  ) : (
                    <><XCircle className="w-4 h-4" /> Yes, Cancel</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
};