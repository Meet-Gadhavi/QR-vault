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
    features: ['1 GB Secure Storage', 'Unlimited QR Scans', 'Standard Speed', 'Email Support'],
    cta: 'Get Started',
    primary: false,
    link: '/login'
  },
  {
    id: PlanType.STARTER,
    name: 'Plus',
    price: '₹99',
    originalPrice: '₹199',
    period: '/month',
    features: ['10 GB Secure Storage', 'Unlimited QR Vaults', 'Priority Speed', 'Basic Analytics', 'No Ads'],
    cta: 'Choose Plus',
    primary: true,
    tag: 'Limited Time Offer',
    link: `/payment?plan=${PlanType.STARTER}`
  },
  {
    id: PlanType.PRO,
    name: 'Pro',
    price: '₹199',
    originalPrice: '₹299',
    period: '/month',
    features: ['20 GB Secure Storage', 'Advanced File Management', 'Fastest Global CDN', 'Premium 24/7 Support', 'Custom Branding'],
    cta: 'Go Pro',
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

    // If user has a paid plan and is looking at a different plan
    if (hasPaidPlan && planId !== userPlan) {
      return { disabled: true, isCurrentPlan: false, showExpiry: false, needsCancel: true, currentPlanName };
    }

    return { disabled: false, isCurrentPlan: false, showExpiry: false, needsCancel: false };
  };

  return (
    <>
      <div className="py-24 bg-gray-50 min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-gray-600">Choose the plan that fits your storage needs.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {planData.map((plan) => {
              const state = getButtonState(plan.id);

              return (
                <div key={plan.name} className={`relative rounded-2xl shadow-xl border flex flex-col ${state.isCurrentPlan && plan.id !== PlanType.FREE
                  ? 'bg-green-50 border-green-300'
                  : plan.primary && !state.isCurrentPlan
                    ? 'bg-white border-primary-500 scale-105 z-10'
                    : 'bg-white border-gray-100'
                  }`}>
                  {plan.tag && !state.isCurrentPlan && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide uppercase">
                      {plan.tag}
                    </div>
                  )}

                  {state.isCurrentPlan && plan.id !== PlanType.FREE && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide uppercase">
                      Your Plan
                    </div>
                  )}

                  <div className={`p-8 border-b ${state.isCurrentPlan && plan.id !== PlanType.FREE ? 'border-green-200' : 'border-gray-100'}`}>
                    <h3 className="text-lg font-medium text-gray-500 uppercase tracking-wide">{plan.name}</h3>
                    <div className="mt-4 flex flex-col items-center sm:items-start">
                      {plan.originalPrice && (
                        <span className="text-sm text-gray-400 line-through mb-1">{plan.originalPrice}</span>
                      )}
                      <div className="flex items-baseline">
                        <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                        <span className="ml-1 text-xl text-gray-500">{plan.period}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col">
                    <ul className="space-y-4 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start">
                          <Check className={`h-5 w-5 ${state.isCurrentPlan ? 'text-green-500' : 'text-primary-500'} mr-3 flex-shrink-0`} />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {state.isCurrentPlan && state.showExpiry && planExpiry ? (
                      <div className="mt-8 space-y-2">
                        <div className="w-full py-3 px-6 bg-green-100 border border-green-300 rounded-lg text-center">
                          <div className="flex items-center justify-center gap-2 text-green-700 font-semibold text-sm">
                            <Clock className="w-4 h-4" />
                            {formatExpiry(planExpiry)}
                          </div>
                        </div>
                        <button
                          onClick={handleCancel}
                          disabled={cancelling}
                          className="w-full py-2.5 px-6 bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 rounded-lg text-center text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                        </button>
                      </div>
                    ) : state.isCurrentPlan ? (
                      <div className="mt-8 block w-full py-3 px-6 bg-green-100 text-green-700 rounded-lg text-center font-semibold cursor-default">
                        Active Plan
                      </div>
                    ) : state.needsCancel ? (
                      <div className="mt-8 block w-full py-3 px-6 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-center text-sm font-medium">
                        Cancel your {(state as any).currentPlanName} subscription first
                      </div>
                    ) : (
                      <Link
                        to={plan.link}
                        className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-lg text-center font-semibold ${plan.primary
                          ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-200'
                          : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                          } transition-colors`}
                      >
                        {plan.cta}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
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