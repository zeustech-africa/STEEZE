'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitStatus({ type: 'success', message: 'Thank you for your message. We will get back to you soon!' });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setSubmitStatus({ type: 'error', message: 'Failed to send message. Please try again.' });
      }
    } catch (error) {
      setSubmitStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-gold/20 to-black py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gold mb-4">Contact Us</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Get in touch with the STEEZE team. We're here to help you shine.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-gray-900 rounded-xl p-6 border border-gold/20">
              <h2 className="text-2xl font-bold text-white mb-6">Get in Touch</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-gold mt-1" />
                  <div>
                    <h3 className="text-white font-semibold">Email</h3>
                    <p className="text-gray-400">support@steeze.com</p>
                    <p className="text-gray-400">creators@steeze.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-gold mt-1" />
                  <div>
                    <h3 className="text-white font-semibold">Phone</h3>
                    <p className="text-gray-400">+27 (0) 21 123 4567</p>
                    <p className="text-gray-400">Mon-Fri, 9am-5pm SAST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-gold mt-1" />
                  <div>
                    <h3 className="text-white font-semibold">Address</h3>
                    <p className="text-gray-400">ZeusTech</p>
                    <p className="text-gray-400">Cape Town, South Africa</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-gold mt-1" />
                  <div>
                    <h3 className="text-white font-semibold">Response Time</h3>
                    <p className="text-gray-400">Within 24-48 hours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gold/20">
              <h2 className="text-2xl font-bold text-white mb-4">Follow Us</h2>
              <p className="text-gray-400 mb-4">Stay connected on social media</p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-all">
                  <span className="sr-only">Instagram</span>
                  <span>📷</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-all">
                  <span className="sr-only">Twitter</span>
                  <span>🐦</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-all">
                  <span className="sr-only">TikTok</span>
                  <span>🎵</span>
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-xl p-8 border border-gold/20">
              <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
              
              {submitStatus && (
                <div className={`mb-6 p-4 rounded-lg ${
                  submitStatus.type === 'success' 
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                  {submitStatus.message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white mb-2">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gold transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gold transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white mb-2">Subject *</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gold transition-colors"
                  >
                    <option value="">Select a subject</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Creator Support">Creator Support</option>
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Partnership">Partnership Opportunity</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white mb-2">Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gold transition-colors resize-none"
                    placeholder="Your message..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    isSubmitting
                      ? 'bg-gray-700 text-gray-400 cursor-wait'
                      : 'bg-gold hover:bg-gold-dark text-black hover:scale-105'
                  }`}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                  {!isSubmitting && <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}