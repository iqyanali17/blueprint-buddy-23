import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Camera, 
  Bell, 
  Globe, 
  Brain, 
  Shield,
  Clock,
  Heart,
  Smartphone
} from 'lucide-react';
import chatbotIcon from '@/assets/chatbot-icon.jpg';
import imageAnalysisIcon from '@/assets/image-analysis-icon.jpg';
import reminderIcon from '@/assets/reminder-icon.jpg';

const Features = () => {
  const mainFeatures = [
    {
      icon: MessageCircle,
      title: "AI-Powered Chatbot",
      description: "Intelligent symptom assessment through natural language processing and machine learning",
      image: chatbotIcon,
      benefits: ["Real-time responses", "Symptom analysis", "Emotional understanding", "24/7 availability"]
    },
    {
      icon: Camera,
      title: "Medical Image Analysis",
      description: "Upload images of visible symptoms for AI-powered visual diagnosis and recommendations",
      image: imageAnalysisIcon,
      benefits: ["Skin condition analysis", "Wound assessment", "Visual symptom tracking", "ML-powered insights"]
    },
    {
      icon: Bell,
      title: "Smart Reminders",
      description: "Personalized medication reminders and health check-up notifications",
      image: reminderIcon,
      benefits: ["Medication alerts", "Check-up reminders", "Health tips", "Custom scheduling"]
    }
  ];

  const additionalFeatures = [
    {
      icon: Globe,
      title: "Multilingual Support",
      description: "Communicate in multiple languages for better accessibility"
    },
    {
      icon: Brain,
      title: "Sentiment Analysis",
      description: "Understands emotional context for personalized responses"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "HIPAA-compliant data protection and privacy measures"
    },
    {
      icon: Clock,
      title: "Instant Response",
      description: "Get immediate medical guidance when you need it most"
    },
    {
      icon: Heart,
      title: "Preliminary Triage",
      description: "Smart assessment to determine urgency of medical needs"
    },
    {
      icon: Smartphone,
      title: "Cross-Platform",
      description: "Available on mobile, web, and desktop platforms"
    }
  ];

  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <Brain className="w-4 h-4 mr-2" />
            Advanced AI Features
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Comprehensive Healthcare
            <span className="block text-primary">Intelligence</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            MEDITALK combines cutting-edge AI technology with medical expertise to provide 
            accessible, reliable, and instant healthcare support for everyone.
          </p>
        </div>

        {/* Main Features */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {mainFeatures.map((feature, index) => (
            <Card key={index} className="group hover:shadow-medical transition-medical border-0 bg-gradient-healing">
              <CardHeader className="pb-4">
                <div className="relative mb-4">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-lg p-2">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                
                <CardTitle className="text-xl group-hover:text-primary transition-medical">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
                
                <div className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full group-hover:border-primary group-hover:text-primary">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {additionalFeatures.map((feature, index) => (
            <Card key={index} className="group hover:shadow-medical transition-medical">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-medical">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold group-hover:text-primary transition-medical">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-hero rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Experience Intelligent Healthcare?
            </h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Join thousands of users who trust MEDITALK for their preliminary medical guidance and health management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" onClick={() => window.location.href = '/dashboard'}>
                <MessageCircle className="w-5 h-5 mr-2" />
                Start Free Chat
              </Button>
              <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Book Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;