import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Play, Shield, Clock, Globe } from 'lucide-react';
import heroImage from '@/assets/meditalk-hero.jpg';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-healing overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse-medical" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl animate-pulse-medical" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <Shield className="w-4 h-4 mr-2" />
                AI-Powered Medical Support
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Your Intelligent
                <span className="block bg-gradient-hero bg-clip-text text-transparent">
                  Healthcare Assistant
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl">
                Get instant medical guidance through AI-powered symptom assessment, image analysis, 
                and multilingual support. MEDITALK bridges the gap between you and quality healthcare.
              </p>
            </div>

            {/* Features highlights */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2 text-sm">
                <MessageCircle className="w-5 h-5 text-primary" />
                <span>AI Chatbot</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-5 h-5 text-secondary" />
                <span>24/7 Available</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Globe className="w-5 h-5 text-primary" />
                <span>Multilingual</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" className="group" onClick={() => window.location.href = '/dashboard'}>
                <MessageCircle className="w-5 h-5 mr-2 group-hover:animate-pulse-medical" />
                Start Medical Chat
              </Button>
              
              <Button variant="outline" size="xl" className="group">
                <Play className="w-5 h-5 mr-2 group-hover:text-primary" />
                Watch Demo
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="pt-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-4">Trusted by healthcare professionals</p>
              <div className="flex items-center space-x-6 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-success rounded-full" />
                  <span>HIPAA Compliant</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>FDA Guidelines</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-secondary rounded-full" />
                  <span>Secure & Private</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative animate-fade-in">
            <div className="relative rounded-2xl overflow-hidden shadow-medical">
              <img
                src={heroImage}
                alt="MEDITALK AI Medical Assistant Interface"
                className="w-full h-auto transform hover:scale-105 transition-medical"
              />
              
              {/* Floating elements */}
              <div className="absolute top-4 right-4 bg-success text-white px-3 py-1 rounded-full text-xs font-medium animate-pulse-medical">
                Online
              </div>
              
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse-medical" />
                  <span className="text-sm font-medium">AI Assistant Active</span>
                </div>
              </div>
            </div>

            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-hero opacity-20 rounded-2xl blur-3xl -z-10 transform scale-110" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;