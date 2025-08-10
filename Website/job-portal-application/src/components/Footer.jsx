import { Search, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Search className="text-[#002060]" size={20} />
              </div>
              <div>
                <div className="text-lg font-bold text-white">International</div>
                <div className="text-white/80 font-semibold">Careers Network</div>
              </div>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              Bridging global talent with UK opportunities, one sponsored role at a time.
            </p>
            <div className="flex gap-4">
              <a href="https://www.linkedin.com/company/international-careers-network/about/" className="w-8 h-8 bg-[#001540] rounded-full flex items-center justify-center hover:bg-white hover:text-[#002060] transition-colors">
                <Linkedin size={16} />
              </a>
              <a href="https://www.instagram.com/internationalcareersnetwork/" className="w-8 h-8 bg-[#001540] rounded-full flex items-center justify-center hover:bg-white hover:text-[#002060] transition-colors">
                <Instagram size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/jobs" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Browse Jobs
                </a>
              </li>
              <li>
                <a href="https://calendly.com/hardil/30min?month=2025-06" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Career Advice
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="/faq" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  FAQ
                </a>
              </li>
              <li>
                <a href="/pricing" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-teal-400" />
                <a href="mailto:hello@internationalcareersnetwork.com" className="text-gray-300 hover:text-teal-400 transition-colors text-sm">
                  hello@internationalcareersnetwork.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} International Careers Network. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}