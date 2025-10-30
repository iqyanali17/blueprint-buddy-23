import React from 'react';
import { MessageCircle, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Logo size={40} showText />
            </div>
            
            <p className="text-background/80 leading-relaxed">
              Your intelligent healthcare assistant providing AI-powered medical guidance, 
              symptom assessment, and health support 24/7.
            </p>
            
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse-medical" />
              <span className="text-sm text-background/80">Always Online</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <nav className="space-y-3">
              {[
                { label: 'Features', href: '#features' },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'About Us', href: '#about' },
                { label: 'Contact', href: '#contact' },
                { label: 'Privacy Policy', href: '#privacy' },
                { label: 'Terms of Service', href: '#terms' }
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block text-background/80 hover:text-white transition-medical text-sm"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Services */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Our Services</h3>
            <div className="space-y-3">
              {[
                'AI Symptom Assessment',
                'Medical Image Analysis',
                'Medication Reminders',
                'Multilingual Support',
                'Emergency Guidance',
                'Health Education'
              ].map((service) => (
                <div key={service} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm text-background/80">{service}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Get in Touch</h3>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-white">Email</p>
                  <p className="text-sm text-background/80">support@meditalk.ai</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-white">Support</p>
                  <p className="text-sm text-background/80">+1 (555) 123-4567</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-white">Location</p>
                  <p className="text-sm text-background/80">Amravati, Maharashtra, India</p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Button variant="medical" className="w-full" onClick={() => window.location.href = '/dashboard'}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Start Chat Now
            </Button>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="py-6 border-t border-background/20">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-sm text-background/80">
              © 2024 MEDITALK. All rights reserved. | Developed by GC10 Team
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-background/80">Follow us:</span>
              {[
                { Icon: Facebook, href: '#', label: 'Facebook' },
                { Icon: Twitter, href: '#', label: 'Twitter' },
                { Icon: Linkedin, href: '#', label: 'LinkedIn' },
                { Icon: Instagram, href: '#', label: 'Instagram' }
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="w-8 h-8 bg-background/10 hover:bg-primary rounded-full flex items-center justify-center transition-medical group"
                  aria-label={label}
                >
                  <Icon className="w-4 h-4 text-background/80 group-hover:text-white" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="py-4 border-t border-background/20">
          <div className="bg-warning/10 rounded-lg p-4">
            <p className="text-xs text-background/70 text-center leading-relaxed">
              <strong>Medical Disclaimer:</strong> MEDITALK is an AI-powered health information tool designed for educational purposes only. 
              It does not replace professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare 
              providers with any questions regarding medical conditions. Never disregard professional medical advice or delay seeking 
              treatment because of information provided by MEDITALK.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;