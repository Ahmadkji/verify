'use client';

import { useState } from 'react';
import { Mail, Phone, Shield, Zap, Globe, CheckCircle, Target, BarChart3, AlertTriangle, Check } from 'lucide-react';
import Testimonials from '@/components/testimonials';

// Full Abstract API response interfaces
interface EmailDeliverability {
  status: 'deliverable' | 'undeliverable' | 'risky' | 'unknown';
  status_detail: string;
  is_format_valid: boolean;
  is_smtp_valid: boolean;
  is_mx_valid: boolean;
  mx_records: string[] | null;
}

interface EmailQuality {
  score: string;
  is_free_email: boolean;
  is_username_suspicious: boolean;
  is_disposable: boolean;
  is_catchall: boolean;
  is_subaddress: boolean;
  is_role: boolean;
  is_dmarc_enforced: boolean;
  is_spf_strict: boolean;
  minimum_age: number | null;
}

interface EmailSender {
  first_name: string | null;
  last_name: string | null;
  email_provider_name: string | null;
  organization_name: string | null;
  organization_type: string | null;
}

interface EmailDomain {
  domain: string;
  domain_age: number;
  is_live_site: boolean;
  registrar: string | null;
  registrar_url: string | null;
  date_registered: string;
  date_last_renewed: string;
  date_expires: string;
  is_risky_tld: boolean;
}

interface EmailRisk {
  address_risk_status: 'low' | 'medium' | 'high';
  domain_risk_status: 'low' | 'medium' | 'high';
}

interface EmailBreaches {
  total_breaches: number;
  date_first_breached: string | null;
  date_last_breached: string | null;
  breached_domains: Array<{
    domain: string;
    date_breached: string;
  }>;
}

interface FullEmailValidation {
  email_address: string;
  email_deliverability: EmailDeliverability;
  email_quality: EmailQuality;
  email_sender: EmailSender;
  email_domain: EmailDomain;
  email_risk: EmailRisk;
  email_breaches: EmailBreaches;
}

interface PhoneValidation {
  phone: string;
  valid: boolean;
  format: {
    international: string;
    local: string;
  };
  country: {
    code: string;
    name: string;
    prefix: string;
  };
  location: string;
  type: 'Landline' | 'Mobile' | 'Satellite' | 'Premium' | 'Paging' | 'Special' | 'Toll_Free' | 'Unknown';
  carrier: string;
}

interface APIResponse {
  success: boolean;
  message: string;
  requestId: string;
  verificationCode: string;
  validation?: FullEmailValidation | PhoneValidation;
  reputation?: FullEmailValidation | null;
  qualityScore?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  responseTime?: number;
  timestamp: string;
  error?: string;
}

export default function Home() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [emailResult, setEmailResult] = useState<APIResponse | null>(null);
  const [phoneResult, setPhoneResult] = useState<APIResponse | null>(null);

  const handleEmailValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailResult(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch('/api/verify/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          includeReputation: true // Get comprehensive validation data
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check if the response is ok before trying to parse JSON
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error occurred' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setEmailResult(data);
    } catch (error) {
      console.error('Email validation error:', error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network connection error. Please check your internet connection and try again.';
        } else if (error.message.includes('NetworkError')) {
          errorMessage = 'Network error occurred. Please try again.';
        } else if (error.message.includes('HTTP error! status: 503')) {
          errorMessage = 'Service temporarily unavailable. Please try again later.';
        } else if (error.message.includes('HTTP error! status: 429')) {
          errorMessage = 'Too many requests. Please wait before trying again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setEmailResult({
        success: false,
        message: 'Validation failed',
        requestId: '',
        verificationCode: '',
        timestamp: new Date().toISOString(),
        error: errorMessage
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePhoneValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneLoading(true);
    setPhoneResult(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch('/api/verify/phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check if the response is ok before trying to parse JSON
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error occurred' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPhoneResult(data);
    } catch (error) {
      console.error('Phone validation error:', error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network connection error. Please check your internet connection and try again.';
        } else if (error.message.includes('NetworkError')) {
          errorMessage = 'Network error occurred. Please try again.';
        } else if (error.message.includes('HTTP error! status: 503')) {
          errorMessage = 'Service temporarily unavailable. Please try again later.';
        } else if (error.message.includes('HTTP error! status: 429')) {
          errorMessage = 'Too many requests. Please wait before trying again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setPhoneResult({
        success: false,
        message: 'Validation failed',
        requestId: '',
        verificationCode: '',
        timestamp: new Date().toISOString(),
        error: errorMessage
      });
    } finally {
      setPhoneLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // Data formatting helper functions
  const formatBoolean = (value: boolean) => value ? '✓' : '✗';
  const formatNullable = (value: string | null) => value || 'Not available';
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
  const formatArray = (array: string[] | null) => array ? array.join(', ') : 'None';

  // Email validation display component
  const EmailValidationDisplay = ({ data }: { data: FullEmailValidation }) => (
    <div className="space-y-6 text-sm">
      {/* Email Address */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-gray-900 mb-2">Email Address</h4>
        <div className="font-mono bg-gray-50 p-2 rounded">{data.email_address}</div>
      </div>

      {/* Email Deliverability */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-gray-900 mb-3">Email Deliverability</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${
              data.email_deliverability.status === 'deliverable' ? 'text-green-600' :
              data.email_deliverability.status === 'undeliverable' ? 'text-red-600' :
              data.email_deliverability.status === 'risky' ? 'text-yellow-600' : 'text-gray-600'
            }`}>
              {data.email_deliverability.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status Detail:</span>
            <span className="font-medium">{data.email_deliverability.status_detail}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Format Valid:</span>
            <span>{formatBoolean(data.email_deliverability.is_format_valid)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">SMTP Valid:</span>
            <span>{formatBoolean(data.email_deliverability.is_smtp_valid)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">MX Valid:</span>
            <span>{formatBoolean(data.email_deliverability.is_mx_valid)}</span>
          </div>
          <div className="md:col-span-2">
            <div className="text-gray-600 mb-1">MX Records:</div>
            <div className="font-mono text-xs bg-gray-50 p-2 rounded break-all">
              {formatArray(data.email_deliverability.mx_records)}
            </div>
          </div>
        </div>
      </div>

      {/* Email Quality */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-gray-900 mb-3">Email Quality</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Score:</span>
            <span className="font-medium">{data.email_quality.score}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Free Email:</span>
            <span>{formatBoolean(data.email_quality.is_free_email)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Username Suspicious:</span>
            <span>{formatBoolean(data.email_quality.is_username_suspicious)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Disposable:</span>
            <span>{formatBoolean(data.email_quality.is_disposable)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Catchall:</span>
            <span>{formatBoolean(data.email_quality.is_catchall)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Subaddress:</span>
            <span>{formatBoolean(data.email_quality.is_subaddress)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Role Account:</span>
            <span>{formatBoolean(data.email_quality.is_role)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">DMARC Enforced:</span>
            <span>{formatBoolean(data.email_quality.is_dmarc_enforced)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">SPF Strict:</span>
            <span>{formatBoolean(data.email_quality.is_spf_strict)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Minimum Age:</span>
            <span>{data.email_quality.minimum_age || 'Not available'} days</span>
          </div>
        </div>
      </div>

      {/* Email Sender */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-gray-900 mb-3">Email Sender</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex justify-between">
            <span className="text-gray-600">First Name:</span>
            <span>{formatNullable(data.email_sender.first_name)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Last Name:</span>
            <span>{formatNullable(data.email_sender.last_name)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Provider Name:</span>
            <span>{formatNullable(data.email_sender.email_provider_name)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Organization:</span>
            <span>{formatNullable(data.email_sender.organization_name)}</span>
          </div>
          <div className="md:col-span-2 flex justify-between">
            <span className="text-gray-600">Organization Type:</span>
            <span>{formatNullable(data.email_sender.organization_type)}</span>
          </div>
        </div>
      </div>

      {/* Email Domain */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-gray-900 mb-3">Email Domain</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Domain:</span>
            <span className="font-medium">{data.email_domain.domain}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Domain Age:</span>
            <span>{data.email_domain.domain_age.toLocaleString()} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Live Site:</span>
            <span>{formatBoolean(data.email_domain.is_live_site)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Risky TLD:</span>
            <span>{formatBoolean(data.email_domain.is_risky_tld)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Registrar:</span>
            <span>{formatNullable(data.email_domain.registrar)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Registrar URL:</span>
            <span className="text-blue-600 break-all">
              {data.email_domain.registrar_url ? (
                <a href={data.email_domain.registrar_url} target="_blank" rel="noopener noreferrer">
                  {data.email_domain.registrar_url}
                </a>
              ) : 'Not available'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date Registered:</span>
            <span>{formatDate(data.email_domain.date_registered)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date Last Renewed:</span>
            <span>{formatDate(data.email_domain.date_last_renewed)}</span>
          </div>
          <div className="md:col-span-2 flex justify-between">
            <span className="text-gray-600">Date Expires:</span>
            <span>{formatDate(data.email_domain.date_expires)}</span>
          </div>
        </div>
      </div>

      {/* Email Risk */}
      <div className="border-b pb-4">
        <h4 className="font-semibold text-gray-900 mb-3">Email Risk</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Address Risk Status:</span>
            <span className={`font-medium ${
              data.email_risk.address_risk_status === 'low' ? 'text-green-600' :
              data.email_risk.address_risk_status === 'medium' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {data.email_risk.address_risk_status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Domain Risk Status:</span>
            <span className={`font-medium ${
              data.email_risk.domain_risk_status === 'low' ? 'text-green-600' :
              data.email_risk.domain_risk_status === 'medium' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {data.email_risk.domain_risk_status}
            </span>
          </div>
        </div>
      </div>

      {/* Email Breaches */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Email Breaches</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Breaches:</span>
            <span className={`font-medium ${
              data.email_breaches.total_breaches > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {data.email_breaches.total_breaches}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date First Breached:</span>
            <span>{data.email_breaches.date_first_breached ? formatDate(data.email_breaches.date_first_breached) : 'None'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date Last Breached:</span>
            <span>{data.email_breaches.date_last_breached ? formatDate(data.email_breaches.date_last_breached) : 'None'}</span>
          </div>
          <div className="md:col-span-2">
            <div className="text-gray-600 mb-1">Breached Domains ({data.email_breaches.breached_domains.length}):</div>
            {data.email_breaches.breached_domains.length > 0 ? (
              <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded">
                {data.email_breaches.breached_domains.map((breach, index) => (
                  <div key={index} className="flex justify-between text-xs py-1 border-b border-gray-200 last:border-0">
                    <span className="font-medium">{breach.domain}</span>
                    <span className="text-gray-500">{formatDate(breach.date_breached)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 italic">No breaches found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const features = [
    {
      icon: Target,
      title: 'Email Validation',
      description: 'Comprehensive email validation with deliverability scoring, auto-correction, and detailed analysis.'
    },
    {
      icon: Phone,
      title: 'Phone Validation',
      description: 'Accurate phone number validation with carrier detection, line type identification, and location data.'
    },
    {
      icon: Shield,
      title: 'Fraud Prevention',
      description: 'Detect disposable emails, role-based accounts, and high-risk phone numbers to prevent fraud.'
    },
    {
      icon: BarChart3,
      title: 'Quality Scoring',
      description: 'Advanced algorithms provide quality scores from 0.01 to 0.99 for lead qualification.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Sub-second response times with 99.9% uptime guarantee for real-time validation.'
    },
    {
      icon: Globe,
      title: 'Global Coverage',
      description: 'Validate emails and phone numbers worldwide with multi-region infrastructure.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section 
        id="hero" 
        className="relative overflow-hidden pt-24 pb-20"
        aria-labelledby="hero-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 
              id="hero-heading" 
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Validate Emails & Phones
              <span className="text-blue-600 block"> Instantly</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Modern email and phone validation API for developers. 
              Check if emails and phone numbers are valid, deliverable, and reduce fraud.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button 
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 text-lg min-w-[200px]"
                aria-label="Get started with VerifyAPI for free"
              >
                Get Started Free
              </button>
              <button 
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-offset-2 text-lg min-w-[200px]"
                aria-label="View API documentation"
              >
                View Documentation
              </button>
            </div>
            
            {/* Trust Signals */}
            <div className="mt-16 flex flex-col items-center">
              <p className="text-sm text-gray-500 mb-6">POWERED BY ABSTRACT API</p>
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                <div className="text-2xl font-bold text-gray-700">Enterprise Grade</div>
                <div className="text-2xl font-bold text-gray-700">99.9% Uptime</div>
                <div className="text-2xl font-bold text-gray-700">Global Coverage</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features" 
        className="py-24 bg-white"
        aria-labelledby="features-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 
              id="features-heading" 
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            >
              Everything You Need for User Verification
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Powerful features designed to keep your platform secure and user-friendly
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <article 
                key={index} 
                className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2"
                tabIndex={0}
                role="article"
                aria-labelledby={`feature-${index}-title`}
              >
                <feature.icon className="w-12 h-12 text-blue-600 mb-4" aria-hidden="true" />
                <h3 
                  id={`feature-${index}-title`} 
                  className="text-xl font-semibold text-gray-900 mb-3"
                >
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section 
        id="demo" 
        className="py-24 bg-gray-50"
        aria-labelledby="demo-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 
              id="demo-heading" 
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            >
              Try It Yourself
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Experience our validation API in action with real Abstract API integration
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Email Validation Demo */}
            <div className="bg-white p-8 rounded-xl shadow-sm border">
              <div className="flex items-center mb-6">
                <Mail className="w-8 h-8 text-blue-600 mr-3" />
                <h3 className="text-2xl font-semibold text-gray-900">Email Validation</h3>
              </div>
              
              <form onSubmit={handleEmailValidation} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={emailLoading || !email}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {emailLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Validating...
                    </>
                  ) : (
                    'Validate Email'
                  )}
                </button>
                
                {emailResult && (
                  <div className={`p-4 rounded-lg ${emailResult.error ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                    {emailResult.error ? (
                      <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        {emailResult.error}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Summary Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-3 border-b">
                          <div className="text-center">
                            <div className="text-xs text-gray-600 mb-1">Status</div>
                            <div className={`font-medium ${
                              (() => {
                                if (emailResult.validation && 'email_deliverability' in emailResult.validation) {
                                  const status = (emailResult.validation as FullEmailValidation).email_deliverability.status;
                                  switch (status) {
                                    case 'deliverable': return 'text-green-600';
                                    case 'undeliverable': return 'text-red-600';
                                    case 'risky': return 'text-yellow-600';
                                    default: return 'text-gray-600';
                                  }
                                }
                                return 'text-gray-600';
                              })()
                            }`}>
                              {emailResult.validation && 'email_deliverability' in emailResult.validation ?
                                (emailResult.validation as FullEmailValidation).email_deliverability.status :
                                'Unknown'
                              }
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-600 mb-1">Quality Score</div>
                            {emailResult.qualityScore !== undefined && (
                              <span className={`px-2 py-1 rounded text-sm ${getQualityColor(emailResult.qualityScore)}`}>
                                {(emailResult.qualityScore * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-600 mb-1">Risk Level</div>
                            {emailResult.riskLevel && (
                              <span className={`px-2 py-1 rounded text-sm ${getRiskColor(emailResult.riskLevel)}`}>
                                {emailResult.riskLevel.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {emailResult.responseTime && (
                          <div className="flex justify-center text-sm text-gray-600">
                            <span>Response Time: {emailResult.responseTime}ms</span>
                          </div>
                        )}
                        
                        {/* Detailed Results */}
                        {emailResult.validation && 'email_deliverability' in emailResult.validation && (
                          <div className="mt-4">
                            <EmailValidationDisplay data={emailResult.validation as FullEmailValidation} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Phone Validation Demo */}
            <div className="bg-white p-8 rounded-xl shadow-sm border">
              <div className="flex items-center mb-6">
                <Phone className="w-8 h-8 text-blue-600 mr-3" />
                <h3 className="text-2xl font-semibold text-gray-900">Phone Validation</h3>
              </div>
              
              <form onSubmit={handlePhoneValidation} className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={phoneLoading || !phone}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {phoneLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Validating...
                    </>
                  ) : (
                    'Validate Phone'
                  )}
                </button>
                
                {phoneResult && (
                  <div className={`p-4 rounded-lg ${phoneResult.error ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                    {phoneResult.error ? (
                      <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        {phoneResult.error}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {phoneResult.validation && 'valid' in phoneResult.validation && (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Valid:</span>
                            <span className={`flex items-center ${(phoneResult.validation as PhoneValidation).valid ? 'text-green-600' : 'text-red-600'}`}>
                              {(phoneResult.validation as PhoneValidation).valid ? (
                                <><Check className="w-4 h-4 mr-1" /> Yes</>
                              ) : (
                                <><AlertTriangle className="w-4 h-4 mr-1" /> No</>
                              )}
                            </span>
                          </div>
                        )}
                        
                        {phoneResult.validation && 'format' in phoneResult.validation && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span>International:</span>
                              <span className="font-mono">{(phoneResult.validation as PhoneValidation).format.international}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Local:</span>
                              <span className="font-mono">{(phoneResult.validation as PhoneValidation).format.local}</span>
                            </div>
                          </>
                        )}
                        
                        {phoneResult.validation && 'country' in phoneResult.validation && (
                          <div className="flex items-center justify-between text-sm">
                            <span>Country:</span>
                            <span>{(phoneResult.validation as PhoneValidation).country.name} ({(phoneResult.validation as PhoneValidation).country.code})</span>
                          </div>
                        )}
                        
                        {phoneResult.validation && 'carrier' in phoneResult.validation && (
                          <div className="flex items-center justify-between text-sm">
                            <span>Carrier:</span>
                            <span>{(phoneResult.validation as PhoneValidation).carrier}</span>
                          </div>
                        )}
                        
                        {phoneResult.validation && 'type' in phoneResult.validation && (
                          <div className="flex items-center justify-between text-sm">
                            <span>Type:</span>
                            <span className="capitalize">{(phoneResult.validation as PhoneValidation).type.replace('_', ' ')}</span>
                          </div>
                        )}
                        
                        {phoneResult.qualityScore !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Quality Score:</span>
                            <span className={`px-2 py-1 rounded text-sm ${getQualityColor(phoneResult.qualityScore)}`}>
                              {(phoneResult.qualityScore * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                        
                        {phoneResult.riskLevel && (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Risk Level:</span>
                            <span className={`px-2 py-1 rounded text-sm ${getRiskColor(phoneResult.riskLevel)}`}>
                              {phoneResult.riskLevel.toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        {phoneResult.responseTime && (
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Response Time:</span>
                            <span>{phoneResult.responseTime}ms</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* API Info Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Powered by Abstract API</h2>
          <p className="text-xl mb-8 text-blue-100">
            Our verification service uses Abstract API industry-leading validation endpoints 
            to provide accurate, real-time email and phone verification data.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-blue-700 p-6 rounded-lg">
              <Mail className="w-8 h-8 mb-3" />
              <h3 className="font-semibold mb-2">Email Validation</h3>
              <p className="text-sm text-blue-100">Check format, deliverability, MX records, SMTP response, and more.</p>
            </div>
            <div className="bg-blue-700 p-6 rounded-lg">
              <Shield className="w-8 h-8 mb-3" />
              <h3 className="font-semibold mb-2">Email Reputation</h3>
              <p className="text-sm text-blue-100">Comprehensive reputation analysis with breach detection and risk assessment.</p>
            </div>
            <div className="bg-blue-700 p-6 rounded-lg">
              <Phone className="w-8 h-8 mb-3" />
              <h3 className="font-semibold mb-2">Phone Validation</h3>
              <p className="text-sm text-blue-100">Validate phone numbers worldwide with carrier and location data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section 
        id="pricing" 
        className="py-24 bg-white"
        aria-labelledby="pricing-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 
              id="pricing-heading" 
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            >
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Pay only for what you use. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-50 p-8 rounded-xl border">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Starter</h3>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                Free
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  100 verifications/month
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  Email & SMS support
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  Basic analytics
                </li>
              </ul>
              <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                Get Started
              </button>
            </div>

            <div className="bg-blue-600 text-white p-8 rounded-xl border-2 border-blue-600 transform scale-105">
              <div className="bg-yellow-400 text-blue-900 text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-semibold mb-4">Pro</h3>
              <div className="text-4xl font-bold mb-6">
                $0.01<span className="text-lg font-normal">/verification</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-white mr-2" />
                  Unlimited verifications
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-white mr-2" />
                  Priority support
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-white mr-2" />
                  Advanced analytics
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-white mr-2" />
                  Custom branding
                </li>
              </ul>
              <button className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                Start Free Trial
              </button>
            </div>

            <div className="bg-gray-50 p-8 rounded-xl border">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Enterprise</h3>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                Custom
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  Everything in Pro
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  SLA guarantee
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  Dedicated support
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  Custom integrations
                </li>
              </ul>
              <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
      <section 
        className="py-24 bg-blue-600"
        aria-labelledby="cta-heading"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 
            id="cta-heading" 
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Ready to Get Started?
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of developers who trust our verification API
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 text-lg min-w-[200px]"
              aria-label="Create your free VerifyAPI account"
            >
              Create Free Account
            </button>
            <button 
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 text-lg min-w-[200px]"
              aria-label="Schedule a product demonstration"
            >
              Schedule a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="bg-gray-900 text-white py-16"
        role="contentinfo"
        aria-label="Site footer"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">VerifyAPI</h3>
              <p className="text-gray-400 leading-relaxed">
                Modern email and phone verification for developers.
              </p>
              {/* Security badges */}
              <div className="mt-4 flex space-x-2">
                <div className="bg-green-600 text-white text-xs px-2 py-1 rounded">SSL Secure</div>
                <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded">GDPR Compliant</div>
              </div>
            </div>
            
            <nav aria-labelledby="footer-product">
              <h4 id="footer-product" className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded">Email Verification</a></li>
                <li><a href="#features" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded">Phone Verification</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded">Pricing</a></li>
                <li><a href="/docs" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded">Documentation</a></li>
              </ul>
            </nav>
            
            <nav aria-labelledby="footer-company">
              <h4 id="footer-company" className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/about" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded">About</a></li>
                <li><a href="/blog" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded">Blog</a></li>
                <li><a href="/careers" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded">Careers</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded">Contact</a></li>
              </ul>
            </nav>
            
            <nav aria-labelledby="footer-legal">
              <h4 id="footer-legal" className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/privacy" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded">Terms of Service</a></li>
                <li><a href="/gdpr" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded">GDPR</a></li>
                <li><a href="/security" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded">Security</a></li>
              </ul>
            </nav>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 VerifyAPI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
