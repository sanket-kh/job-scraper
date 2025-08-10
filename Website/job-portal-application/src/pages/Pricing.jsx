import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '../services/supabaseClient';

const NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_51RS415RhpkcrJTx4sl71O6VhwSBjs15ewYJW57opxK6SElZHYIuC6GSTPq3mtN3EVz7guwdsxgD66yd4rsPXlqqW00ieEt0yv2';

const Pricing = () => {
    const [processing, setProcessing] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const plans = {
        free: {
            name: 'Free',
            price: 0,
            period: 'Forever',
            stripePriceId: null,
            popular: false,
            features: [
                'Access to limited sponsorship jobs'
            ]
        },
        monthly: {
            name: 'Standard',
            price: 8.49,
            period: 'month',
            stripePriceId: 'price_1RUk4NRhpkcrJTx4bAsW0ubU',
            popular: true,
            features: [
                'Access to all UK sponsorship jobs',
                'Direct application to companies',
                'Job alerts and notifications',
                'Premium Support 24/7'
            ]
        }
    };

    // Check authentication status
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    setUser(session.user);
                } else {
                    // Redirect to sign in if not authenticated
                    navigate('/signin', {
                        state: {
                            from: '/pricing',
                            message: 'Please sign in to view pricing plans'
                        }
                    });
                    return;
                }
            } catch (error) {
                console.error('Auth check error:', error);
                navigate('/signin');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_OUT' || !session) {
                    navigate('/signin');
                } else if (session?.user) {
                    setUser(session.user);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [navigate]);

    // Function to handle Stripe checkout
    const handleSubscription = async (planKey, priceId) => {
        if (!user) {
            navigate('/signin', {
                state: {
                    from: '/pricing',
                    message: 'Please sign in to continue with subscription'
                }
            });
            return;
        }

        if (!priceId) {
            // Handle free plan - no payment needed
            alert('Free plan selected! You can now access any UK sponsorship jobs.');
            return;
        }

        setProcessing(planKey);
        setErrorMessage('');

        try {
            // Load Stripe.js dynamically
            const stripeModule = await import('@stripe/stripe-js');
            const { loadStripe } = stripeModule;
            const stripe = await loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
            if (!stripe) {
                throw new Error('Stripe.js failed to load. Check your publishable key.');
            }

            // Create checkout session on your backend
            const response = await fetch('http://localhost:4242/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({
                    priceId: priceId,
                    userId: user.id,
                    userEmail: user.email
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const session = await response.json();
            if (!session.url) {
                throw new Error('Stripe session URL is missing. Backend error or invalid priceId.');
            }

            // Redirect to Stripe Checkout
            window.location.href = session.url;
        } catch (error) {
            console.error('Error:', error);
            setErrorMessage('Something went wrong. Please try again later. ' + error.message);
        } finally {
            setProcessing('');
        }
    };

    // Show loading spinner while checking auth
    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    // Only render pricing if user is authenticated
    if (!user) {
        return null; // This shouldn't render due to redirect, but just in case
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 py-12 px-4 font-[Calibri]">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold text-[#002060] mb-4">
                            Choose Your Plan
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Find the perfect plan for your UK job search journey
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Welcome back, {user.email}!
                        </p>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 justify-center max-w-6xl mx-auto">
                        {Object.entries(plans).map(([key, plan]) => (
                            <div
                                key={key}
                                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl flex flex-col h-full ${plan.popular
                                        ? 'border-green-500 transform scale-105'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-teal-600 text-white px-4 py-1 rounded-full text-sm font-semibold uppercase tracking-wide">
                                            Popular
                                        </span>
                                    </div>
                                )}

                                <div className="p-8 flex flex-col h-full">
                                    {/* Plan Name */}
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                        {plan.name}
                                    </h3>

                                    {/* Price */}
                                    <div className="mb-8">
                                        <div className="flex items-baseline">
                                            <span className="text-5xl font-bold text-gray-900">
                                                £{plan.price.toFixed(2)}
                                            </span>
                                            {plan.period !== 'Forever' && (
                                                <span className="text-gray-500 ml-2">
                                                    /{plan.period}
                                                </span>
                                            )}
                                        </div>
                                        {plan.period === 'Forever' && (
                                            <p className="text-gray-500 mt-1">Forever free</p>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-4 mb-8 flex-grow">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start">
                                                <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-700">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA Button */}
                                    <div className="space-y-4 mt-auto">
                                        <button
                                            onClick={() => handleSubscription(key, plan.stripePriceId)}
                                            disabled={processing === key}
                                            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center min-h-[60px] ${plan.popular
                                                    ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl'
                                                    : 'bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-teal-600'
                                                } ${processing === key ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                        >
                                            {processing === key ? (
                                                <span className="flex items-center justify-center">
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Processing...
                                                </span>
                                            ) : plan.price === 0 ? (
                                                'Get Started Free'
                                            ) : (
                                                'Subscribe Now'
                                            )}
                                        </button>

                                        {errorMessage && processing === key && (
                                            <p className="text-center text-red-600 text-sm">{errorMessage}</p>
                                        )}

                                        {plan.price > 0 && (
                                            <p className="text-center text-gray-500 text-sm">
                                                Cancel anytime
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Additional Info */}
                    <div className="text-center mt-16">
                        <p className="text-gray-600 mb-4">
                            All plans include secure payment processing and data protection
                        </p>
                        <div className="flex justify-center items-center space-x-8 text-gray-400">
                            <div className="flex items-center">
                                <CreditCard className="h-5 w-5 mr-2" />
                                <span>Secure Payment</span>
                            </div>
                            <div className="flex items-center">
                                <Check className="h-5 w-5 mr-2" />
                                <span>No Hidden Fees</span>
                            </div>
                            <div className="flex items-center">
                                <Check className="h-5 w-5 mr-2" />
                                <span>Cancel Anytime</span>
                            </div>
                        </div>
                    </div>

                    {/* Testimonial or Final CTA */}
                    <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-8 mt-16 text-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            Ready to Land Your Dream Job in the UK?
                        </h3>
                        <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                            Join thousands of professionals who have successfully found UK sponsorship jobs through our platform
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => handleSubscription('monthly', plans.monthly.stripePriceId)}
                                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
                            >
                                Go Premium
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full bg-gray-900 mt-0">
                <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
                    <Footer />
                </div>
            </div>
        </>
    );
};

export default Pricing;