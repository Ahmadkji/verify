'use client';

import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'CTO at TechCorp',
    content: 'VerifyAPI has transformed our user verification process. We\'ve reduced fake accounts by 95% and improved our conversion rates significantly.',
    rating: 5,
    avatar: 'SJ',
  },
  {
    name: 'Michael Chen',
    role: 'Product Manager at StartupX',
    content: 'The API is incredibly fast and reliable. Integration took less than an hour, and the documentation is excellent.',
    rating: 5,
    avatar: 'MC',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Lead Developer at DataFlow',
    content: 'Best email and phone verification service we\'ve used. The accuracy is outstanding and the pricing is very competitive.',
    rating: 5,
    avatar: 'ER',
  },
];

const stats = [
  { label: 'Active Users', value: '50,000+', suffix: '' },
  { label: 'API Calls', value: '1', suffix: 'Billion+' },
  { label: 'Uptime', value: '99.9', suffix: '%' },
  { label: 'Countries', value: '180', suffix: '+' },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-blue-50" aria-labelledby="testimonials-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 
            id="testimonials-heading" 
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            Trusted by Developers Worldwide
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Join thousands of companies that rely on VerifyAPI for their verification needs
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="text-center bg-white p-8 rounded-xl shadow-sm"
            >
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                {stat.value}
                <span className="text-2xl text-gray-600">{stat.suffix}</span>
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <article 
              key={index} 
              className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-shadow"
              role="article"
              aria-labelledby={`testimonial-${index}-name`}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-lg mr-4">
                  {testimonial.avatar}
                </div>
                <div>
                  <h3 
                    id={`testimonial-${index}-name`} 
                    className="font-semibold text-gray-900"
                  >
                    {testimonial.name}
                  </h3>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
              
              <Quote className="w-8 h-8 text-blue-200 mb-4" aria-hidden="true" />
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              
              <div className="flex items-center">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star 
                    key={i} 
                    className="w-5 h-5 text-yellow-400 fill-current" 
                    aria-hidden="true"
                  />
                ))}
              </div>
            </article>
          ))}
        </div>

        {/* Security Trust Section */}
        <div className="mt-20 text-center">
          <div className="bg-white p-8 rounded-xl shadow-sm max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Enterprise-Grade Security
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-2xl">🔒</div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">SSL Encrypted</h4>
                <p className="text-gray-600 text-sm">All data transmitted with 256-bit SSL encryption</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-2xl">🛡️</div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">GDPR Compliant</h4>
                <p className="text-gray-600 text-sm">Fully compliant with EU data protection regulations</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-2xl">🏆</div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">SOC 2 Certified</h4>
                <p className="text-gray-600 text-sm">Regular security audits and compliance checks</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
