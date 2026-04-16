import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { PlanType } from '../types';
import { mockService } from '../services/mockService';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, Loader2, ShieldCheck, CreditCard, Download, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const Payment: React.FC = () => {
    const { search } = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, userId, userEmail } = useAuth();
    const query = new URLSearchParams(search);
    const plan = query.get('plan') as PlanType;

    const [loading, setLoading] = useState(false);
    const [paymentDone, setPaymentDone] = useState(false);
    const [invoiceData, setInvoiceData] = useState<any>(null);

    const prices: Record<string, number> = {
        [PlanType.STARTER]: 99,
        [PlanType.PRO]: 199,
        [PlanType.FREE]: 0
    };

    useEffect(() => {
        if (!plan || (plan !== PlanType.STARTER && plan !== PlanType.PRO)) {
            navigate('/pricing');
            return;
        }
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [plan, navigate, isAuthenticated]);


    const planName = plan === PlanType.STARTER ? 'Starter' : 'Pro';

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if ((window as any).Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        if (!userId) {
            navigate('/login');
            return;
        }

        setLoading(true);

        try {
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                toast.error('Razorpay SDK failed to load. Please check your internet connection.');
                setLoading(false);
                return;
            }

            // Call backend to create order
            const orderResponse = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/razorpay/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: prices[plan],
                    currency: 'INR',
                }),
            });

            if (!orderResponse.ok) {
                throw new Error('Failed to create order on server');
            }

            const order = await orderResponse.json();

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Use Razorpay Key ID
                amount: order.amount.toString(),
                currency: order.currency,
                name: 'QR Vault',
                description: `${planName} Plan Subscription`,
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/razorpay/verify`, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${(await mockService.getAuthHeader()).Authorization?.split(' ')[1]}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                plan: plan,
                                userId: userId
                            }),
                        });

                        const verifyData = await verifyRes.json();
                        if (verifyData.status === 'success') {
                            setInvoiceData(verifyData.invoice);
                            setPaymentDone(true);
                            toast.success('Payment verified successfully!');
                        } else {
                            toast.error('Payment verification failed.');
                        }
                    } catch (verifyError: any) {
                        console.error('Verify error:', verifyError);
                        toast.error('Payment verification error.');
                    }
                },
                prefill: {
                    email: userEmail || '',
                },
                theme: {
                    color: '#7c3aed',
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                console.error(response.error);
                toast.error(`Payment failed: ${response.error.description}`);
            });
            rzp.open();
        } catch (err: any) {
            console.error('Payment error:', err);
            toast.error(`Something went wrong: ${err.message || 'Please try again.'}`);
        } finally {
            setLoading(false);
        }
    };

    const downloadInvoicePdf = () => {
        if (!invoiceData) return;

        // Create a printable HTML invoice and convert to PDF via print
        const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${invoiceData.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #7c3aed; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: 800; color: #7c3aed; }
          .logo span { color: #333; }
          .badge { background: #7c3aed; color: #fff; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
          .invoice-info { text-align: right; }
          .invoice-info h2 { font-size: 22px; color: #333; margin-bottom: 4px; }
          .invoice-info p { font-size: 13px; color: #888; }
          .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .details .col h4 { font-size: 11px; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 8px; }
          .details .col p { font-size: 14px; color: #333; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f5f3ff; color: #7c3aed; text-align: left; padding: 12px 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 14px 16px; border-bottom: 1px solid #eee; font-size: 14px; }
          .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #7c3aed; border-bottom: none; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
          .paid-stamp { display: inline-block; border: 3px solid #22c55e; color: #22c55e; padding: 4px 20px; border-radius: 8px; font-size: 18px; font-weight: 800; text-transform: uppercase; transform: rotate(-5deg); margin-left: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo"><span>QR</span> Vault</div>
            <p style="font-size: 13px; color: #888; margin-top: 4px;">Secure File Storage & Sharing</p>
          </div>
          <div class="invoice-info">
            <h2>INVOICE</h2>
            <p>${invoiceData.id}</p>
            <p>${invoiceData.date}</p>
          </div>
        </div>

        <div class="details">
          <div class="col">
            <h4>Billed To</h4>
            <p>${invoiceData.email}</p>
          </div>
          <div class="col" style="text-align: right;">
            <h4>Plan Details</h4>
            <p>${invoiceData.plan} Plan - Monthly</p>
            <p>Valid until: ${invoiceData.expiry}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoiceData.plan} Plan — Monthly Subscription</td>
              <td>1</td>
              <td style="text-align: right;">₹${invoiceData.amount}.00</td>
            </tr>
            <tr class="total-row">
              <td colspan="2">Total</td>
              <td style="text-align: right;">₹${invoiceData.amount}.00</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-bottom: 30px;">
          <span class="paid-stamp">✓ PAID</span>
        </div>

        <div class="footer">
          <p>Thank you for your purchase! This is a computer-generated invoice.</p>
          <p style="margin-top: 4px;">QR Vault — Secure File Storage & Sharing</p>
        </div>
      </body>
      </html>
    `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(invoiceHtml);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    };

    if (!plan || (plan !== PlanType.STARTER && plan !== PlanType.PRO)) return null;

    // Thank You Page
    if (paymentDone && invoiceData) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center transition-colors duration-300">
                <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden text-center">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10 text-white" aria-hidden="true" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
                        <p className="text-green-100 mt-2">Thank you for upgrading to {planName}</p>
                    </div>

                    <div className="p-8">
                        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-6 mb-6 text-left space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Invoice</span>
                                <span className="font-medium text-gray-900 dark:text-white">{invoiceData.id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Plan</span>
                                <span className="font-medium text-gray-900 dark:text-white">{invoiceData.plan} Plan</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Amount</span>
                                <span className="font-bold text-gray-900 dark:text-white">₹{invoiceData.amount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Valid Until</span>
                                <span className="font-medium text-gray-900 dark:text-white">{invoiceData.expiry}</span>
                            </div>
                        </div>

                        <button
                            onClick={downloadInvoicePdf}
                            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all hover:scale-[1.02] mb-3"
                        >
                            <Download className="w-5 h-5" />
                            Download Invoice
                        </button>

                        <Link
                            to="/dashboard"
                            className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3.5 rounded-xl transition-all"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Payment Page
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center transition-colors duration-300">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden">

                <div className="bg-primary-600 p-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1 text-primary-200 hover:text-white text-sm font-medium mb-4 transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                        Back
                    </button>
                    <h2 className="text-2xl font-bold text-white">Complete Your Purchase</h2>
                    <p className="text-primary-100 mt-1">Secure Payment</p>
                </div>

                <div className="p-8">
                    <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100 dark:border-white/10">
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white text-lg">{planName} Plan</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Subscription</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white text-2xl">₹{prices[plan]}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">/month</p>
                        </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                        <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span>{plan === PlanType.STARTER ? '10 GB' : '20 GB'} Secure Storage</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span>Priority Support</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span>Cancel Anytime</span>
                        </li>
                    </ul>

                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                        {loading ? 'Processing...' : `Pay ₹${prices[plan]}`}
                    </button>

                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Payments are 100% Secure and Encrypted</span>
                    </div>
                </div>
            </div>
        </div>
    );
};