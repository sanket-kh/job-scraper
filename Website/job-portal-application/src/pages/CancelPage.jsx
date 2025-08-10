import { useState, useEffect } from 'react';
import { AlertCircle, Calendar, CreditCard, X } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CancelPage = () => {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [canceling, setCanceling] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch subscription details on component mount
    useEffect(() => {
        fetchSubscriptionDetails();
    }, []);

    const fetchSubscriptionDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:4242/get-subscription', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Add authorization header if you have user authentication
                    // 'Authorization': `Bearer ${userToken}`
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch subscription details');
            }

            const data = await response.json();
            setSubscription(data.subscription);
        } catch (error) {
            console.error('Error fetching subscription:', error);
            setError('Unable to load subscription details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!subscription) return;

        setCanceling(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('http://localhost:4242/cancel-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add authorization header if you have user authentication
                    // 'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({
                    subscriptionId: subscription.id
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to cancel subscription');
            }

            const result = await response.json();
            setSuccess('Your subscription has been successfully canceled.');
            
            // Refresh subscription details to show updated status
            await fetchSubscriptionDetails();
        } catch (error) {
            console.error('Error canceling subscription:', error);
            setError('Unable to cancel subscription. Please try again or contact support.');
        } finally {
            setCanceling(false);
        }
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getPlanName = (priceId) => {
        // Match with your pricing component's price IDs
        const planNames = {
            'price_1RUk4NRhpkcrJTx4bAsW0ubU': 'Standard Monthly',
            // Add other price IDs as needed
        };
        return planNames[priceId] || 'Premium Plan';
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-gray-50 py-12 px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading subscription details...</p>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Manage Subscription
                        </h1>
                        <p className="text-xl text-gray-600">
                            View and manage your current subscription
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                            <div className="flex items-center">
                                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                                <p className="text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="ml-3 text-green-700">{success}</p>
                            </div>
                        </div>
                    )}

                    {/* Subscription Details Card */}
                    {subscription ? (
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-8 py-6">
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Current Subscription
                                </h2>
                                <p className="text-teal-100">
                                    {getPlanName(subscription.items.data[0]?.price.id)}
                                </p>
                            </div>

                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {/* Status */}
                                    <div className="flex items-start space-x-3">
                                        <div className={`p-2 rounded-lg ${
                                            subscription.status === 'active' 
                                                ? 'bg-green-100' 
                                                : subscription.status === 'canceled'
                                                ? 'bg-red-100'
                                                : 'bg-yellow-100'
                                        }`}>
                                            <CreditCard className={`h-5 w-5 ${
                                                subscription.status === 'active' 
                                                    ? 'text-green-600' 
                                                    : subscription.status === 'canceled'
                                                    ? 'text-red-600'
                                                    : 'text-yellow-600'
                                            }`} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Status</h3>
                                            <p className={`text-sm capitalize ${
                                                subscription.status === 'active' 
                                                    ? 'text-green-600' 
                                                    : subscription.status === 'canceled'
                                                    ? 'text-red-600'
                                                    : 'text-yellow-600'
                                            }`}>
                                                {subscription.status}
                                                {subscription.cancel_at_period_end && ' (Canceling)'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Current Period End */}
                                    <div className="flex items-start space-x-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Calendar className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {subscription.cancel_at_period_end || subscription.status === 'canceled' 
                                                    ? 'Expires On' 
                                                    : 'Next Billing Date'
                                                }
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {formatDate(subscription.current_period_end)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="flex items-start space-x-3">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <CreditCard className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Amount</h3>
                                            <p className="text-sm text-gray-600">
                                                £{(subscription.items.data[0]?.price.unit_amount / 100).toFixed(2)} / 
                                                {subscription.items.data[0]?.price.recurring.interval}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Created Date */}
                                    <div className="flex items-start space-x-3">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <Calendar className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Started On</h3>
                                            <p className="text-sm text-gray-600">
                                                {formatDate(subscription.created)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="border-t pt-6">
                                    {subscription.status === 'active' && !subscription.cancel_at_period_end ? (
                                        <div className="space-y-4">
                                            <button
                                                onClick={handleCancelSubscription}
                                                disabled={canceling}
                                                className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                            >
                                                {canceling ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Canceling...
                                                    </>
                                                ) : (
                                                    <>
                                                        <X className="h-5 w-5 mr-2" />
                                                        Cancel Subscription
                                                    </>
                                                )}
                                            </button>
                                            <p className="text-sm text-gray-500">
                                                Your subscription will remain active until {formatDate(subscription.current_period_end)}
                                            </p>
                                        </div>
                                    ) : subscription.cancel_at_period_end ? (
                                        <div className="text-center">
                                            <p className="text-gray-600 mb-4">
                                                Your subscription is scheduled to cancel on {formatDate(subscription.current_period_end)}
                                            </p>
                                            <button
                                                onClick={() => window.location.href = '/pricing'}
                                                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
                                            >
                                                Reactivate Subscription
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <p className="text-gray-600 mb-4">
                                                Your subscription has ended. Resubscribe to continue enjoying premium features.
                                            </p>
                                            <button
                                                onClick={() => window.location.href = '/pricing'}
                                                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
                                            >
                                                View Plans
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                No Active Subscription
                            </h3>
                            <p className="text-gray-600 mb-6">
                                You don't have an active subscription. Choose a plan to get started.
                            </p>
                            <button
                                onClick={() => window.location.href = '/pricing'}
                                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
                            >
                                View Plans
                            </button>
                        </div>
                    )}

                    {/* Help Section */}
                    <div className="mt-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 text-center">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                            Need Help?
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Have questions about your subscription or need assistance? We're here to help.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button className="bg-white text-gray-900 font-semibold py-3 px-8 rounded-xl border-2 border-gray-300 hover:border-teal-500 transition-colors">
                                Contact Support
                            </button>
                            <button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors">
                                View FAQ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default CancelPage;