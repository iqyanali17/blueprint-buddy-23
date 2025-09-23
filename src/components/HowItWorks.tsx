import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Camera, 
  Activity, 
  Bell,
  UserCheck,
  Shield,
  Zap,
  Heart,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      step: "01",
      title: "Sign Up & Create Profile",
      description: "Create your secure medical profile with personal health information, medical history, and preferences.",
      icon: UserCheck,
      features: ["Secure registration", "Medical history setup", "Privacy controls", "Emergency contacts"]
    },
    {
      step: "02", 
      title: "Start Medical Consultation",
      description: "Chat with our AI assistant about your symptoms, concerns, or medical questions anytime, anywhere.",
      icon: MessageCircle,
      features: ["Natural language chat", "Symptom assessment", "Medical guidance", "24/7 availability"]
    },
    {
      step: "03",
      title: "Upload Medical Images",
      description: "Get AI-powered analysis of visible symptoms, skin conditions, wounds, or other medical images.",
      icon: Camera,
      features: ["Image analysis", "Visual diagnosis", "Condition tracking", "Progress monitoring"]
    },
    {
      step: "04",
      title: "Track Health & Medications",
      description: "Monitor your health metrics, set medication reminders, and track treatment progress over time.",
      icon: Activity,
      features: ["Medication tracking", "Health metrics", "Progress reports", "Reminder alerts"]
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Instant Access",
      description: "Get immediate medical guidance without waiting for appointments"
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "HIPAA-compliant security ensures your medical data stays private"
    },
    {
      icon: Heart,
      title: "Personalized Care",
      description: "AI learns your medical history for tailored health recommendations"
    },
    {
      icon: Bell,
      title: "Smart Reminders",
      description: "Never miss medications or important health check-ups"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4 mr-2" />
            Simple. Smart. Secure.
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            How MEDITALK
            <span className="block text-primary">Works for You</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get started with intelligent healthcare assistance in four simple steps. 
            Our AI-powered platform makes medical guidance accessible, reliable, and available 24/7.
          </p>
        </div>

        {/* Steps Process */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <Card key={index} className="group hover:shadow-medical transition-medical">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-hero rounded-xl flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-medical">
                        {step.step}
                      </div>
                    </div>
                    
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center space-x-2">
                        <step.icon className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold group-hover:text-primary transition-medical">
                          {step.title}
                        </h3>
                      </div>
                      
                      <p className="text-muted-foreground">
                        {step.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {step.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="w-3 h-3 text-success" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Visual Demo */}
          <div className="relative">
            <div className="bg-gradient-healing rounded-2xl p-8 shadow-medical">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <MessageCircle className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Try MEDITALK Now</h3>
                  <p className="text-muted-foreground mb-6">
                    Experience intelligent healthcare assistance
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">You</p>
                        <p className="text-sm text-muted-foreground">I have a headache and feel tired...</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <Heart className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-primary">MEDITALK AI</p>
                        <p className="text-sm text-muted-foreground">Let me help assess your symptoms...</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button variant="hero" className="w-full group" onClick={() => window.location.href = '/dashboard'}>
                  Start Your Consultation
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-success/20 rounded-full blur-xl animate-pulse-medical" />
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-primary/20 rounded-full blur-xl animate-pulse-medical" />
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold mb-4">Why Choose MEDITALK?</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the future of healthcare assistance with our comprehensive AI-powered platform
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index} className="group hover:shadow-medical transition-medical text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-medical">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                
                <h4 className="text-lg font-semibold mb-2 group-hover:text-primary transition-medical">
                  {benefit.title}
                </h4>
                
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-hero rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Join thousands of users who trust MEDITALK for their medical guidance. 
              Sign up today and experience the future of healthcare assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" onClick={() => window.location.href = '/dashboard'}>
                <MessageCircle className="w-5 h-5 mr-2" />
                Start Free Consultation
              </Button>
              <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Learn More About AI
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;