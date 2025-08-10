import React, { useState } from 'react';
import { supabase } from "../supabaseClient";
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { CheckCircle, User, GraduationCap, FileText, Clock, AlertCircle, Briefcase, Building } from 'lucide-react';

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        course: '',
        university: '',
        visa_type: '',
        visa_duration_months: '',
        biggest_hurdle: '',
        target_roles: '',
        target_industry: ''
    });

    // Check if user came from pricing page - if not, redirect
    if (!location.state?.fromPricing) {
        return <Navigate to="/pricing" replace />;
    }

    const totalSteps = 7;

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const submitForm = async () => {
        setIsSubmitting(true);

        try {
            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError) {
                throw new Error('Failed to get user information');
            }

            if (!user) {
                throw new Error('User not authenticated');
            }

            // Prepare data for insertion
            const insertData = {
                user_id: user.id,
                course: formData.course,
                university: formData.university,
                visa_type: formData.visa_type === 'N/A' ? null : formData.visa_type,
                visa_duration_months: formData.visa_duration_months === 'N/A' ? null : parseInt(formData.visa_duration_months),
                biggest_hurdle: formData.biggest_hurdle,
                target_roles: formData.target_roles,
                target_industry: formData.target_industry || null,
                subscription_type: 'Premium',
                created_at: new Date().toISOString()
            };

            // Insert data into user_profiles table (adjust table name as needed)
            const { data, error } = await supabase
                .from('user_profiles')
                .insert([insertData]);

            if (error) {
                throw error;
            }

            setIsSubmitted(true);
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Failed to submit form. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isCurrentStepValid = () => {
        switch (currentStep) {
            case 1: return formData.course.trim() !== '';
            case 2: return formData.university.trim() !== '';
            case 3: return formData.visa_type.trim() !== '';
            case 4: return formData.visa_duration_months.trim() !== '';
            case 5: return formData.biggest_hurdle.trim() !== '';
            case 6: return formData.target_roles.trim() !== '';
            case 7: return true; // Industry is optional
            default: return false;
        }
    };

    const renderStep = () => {
        const stepConfig = [
            {
                icon: <GraduationCap className="w-8 h-8" />,
                title: "Your Course",
                placeholder: "e.g., MSc Management",
                field: "course",
                description: "What course did you pursue/are currently studying?"
            },
            {
                icon: <Building className="w-8 h-8" />,
                title: "Your University",
                placeholder: "e.g., Imperial College London",
                field: "university",
                description: "Which university did you graduate from / are currently in?"
            },
            {
                icon: <FileText className="w-8 h-8" />,
                title: "Visa Status",
                placeholder: "e.g., Student, Graduate, Skilled, N/A",
                field: "visa_type",
                description: "Which visa are you on currently? Type N/A if outside UK"
            },
            {
                icon: <Clock className="w-8 h-8" />,
                title: "Visa Duration",
                placeholder: "e.g., 10 or N/A",
                field: "visa_duration_months",
                description: "How long in months do you have on your visa? Type N/A if outside UK",
                type: "text"
            },
            {
                icon: <AlertCircle className="w-8 h-8" />,
                title: "Biggest Challenge",
                placeholder: "e.g., Not getting shortlisted, Not clearing tests",
                field: "biggest_hurdle",
                description: "What is the biggest hurdle for you right now?"
            },
            {
                icon: <Briefcase className="w-8 h-8" />,
                title: "Target Roles",
                placeholder: "e.g., Data Analyst, Management Consulting",
                field: "target_roles",
                description: "Which roles are you looking to get into?"
            },
            {
                icon: <Building className="w-8 h-8" />,
                title: "Target Industry",
                placeholder: "e.g., Healthcare, Retail, Manufacturing (Optional)",
                field: "target_industry",
                description: "Which industry are you targeting? (Optional)"
            }
        ];

        const config = stepConfig[currentStep - 1];

        return (
            <div className="text-center space-y-6">
                <div className="flex justify-center text-blue-600">
                    {config.icon}
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {config.title}
                    </h2>
                    <p className="text-gray-600 text-sm max-w-md mx-auto">
                        {config.description}
                    </p>
                </div>

                <div className="max-w-md mx-auto">
                    <input
                        type={config.type || "text"}
                        value={formData[config.field]}
                        onChange={(e) => handleInputChange(config.field, e.target.value)}
                        placeholder={config.placeholder}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg"
                        autoFocus
                    />
                </div>
            </div>
        );
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="text-green-500 mb-6">
                        <CheckCircle className="w-16 h-16 mx-auto" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Success! 🎉
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Thank you for providing your information. We've successfully saved your profile and will use this to better assist you in your career journey.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-blue-800 text-sm">
                            Your information has been securely stored and will help us provide personalized recommendations.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">
                            Step {currentStep} of {totalSteps}
                        </span>
                        <span className="text-sm text-gray-500">
                            {Math.round((currentStep / totalSteps) * 100)}%
                        </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Step Content */}
                {renderStep()}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 gap-4">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${currentStep === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        Previous
                    </button>

                    {currentStep === totalSteps ? (
                        <button
                            onClick={submitForm}
                            disabled={isSubmitting}
                            className={`px-8 py-2 rounded-lg font-medium transition-all ${isSubmitting
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                                }`}
                        >
                            {isSubmitting ? 'Submitting...' : 'Complete Profile'}
                        </button>
                    ) : (
                        <button
                            onClick={nextStep}
                            disabled={!isCurrentStepValid()}
                            className={`px-8 py-2 rounded-lg font-medium transition-all ${!isCurrentStepValid()
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                                }`}
                        >
                            Next
                        </button>
                    )}
                </div>

                {/* Step Indicators */}
                <div className="flex justify-center mt-6 space-x-2">
                    {Array.from({ length: totalSteps }, (_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all ${i + 1 <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                                }`}
                        />
                    ))}
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
}