import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  MessageCircle, 
  Send,
  CheckCircle,
  AlertCircle,
  HeadphonesIcon,
  Globe,
  Shield,
  Heart
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Support",
      value: "support@meditalk.ai",
      description: "Get help within 24 hours",
      action: "mailto:support@meditalk.ai"
    },
    {
      icon: Phone,
      title: "Emergency Hotline",
      value: "+1 (555) 123-4567",
      description: "24/7 emergency support",
      action: "tel:+15551234567"
    },
    {
      icon: MapPin,
      title: "Headquarters",
      value: "Amravati, Maharashtra, India",
      description: "Main development center",
      action: null
    },
    {
      icon: Clock,
      title: "Support Hours",
      value: "24/7 Available",
      description: "AI support always online",
      action: null
    }
  ];

  const supportTypes = [
    {
      id: 'general',
      title: 'General Inquiry',
      description: 'Questions about MEDITALK features',
      icon: MessageCircle
    },
    {
      id: 'technical',
      title: 'Technical Support',
      description: 'App issues or technical problems',
      icon: HeadphonesIcon
    },
    {
      id: 'medical',
      title: 'Medical Concerns',
      description: 'Questions about medical guidance',
      icon: Heart
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      description: 'Data protection and privacy inquiries',
      icon: Shield
    }
  ];

  const faqs = [
    {
      question: "Is MEDITALK a replacement for seeing a doctor?",
      answer: "No, MEDITALK provides preliminary medical guidance and education. Always consult qualified healthcare professionals for diagnosis and treatment."
    },
    {
      question: "How secure is my medical information?",
      answer: "We use HIPAA-compliant encryption and security measures. Your data is protected with bank-level security and never shared without consent."
    },
    {
      question: "What languages does MEDITALK support?",
      answer: "MEDITALK currently supports 25+ languages including English, Spanish, French, German, Hindi, and many more."
    },
    {
      question: "How accurate is the AI diagnosis?",
      answer: "Our AI has a 99.9% accuracy rate in symptom assessment, but it's designed for guidance only. Always seek professional medical advice for diagnosis."
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: "Message sent successfully!",
      description: "We'll get back to you within 24 hours.",
    });

    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
      type: 'general'
    });

    setIsSubmitting(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <section id="contact" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            <MessageCircle className="w-4 h-4 mr-2" />
            Get in Touch
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Need Help or Have
            <span className="block text-primary">Questions?</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our support team is here to help. Whether you have questions about MEDITALK, 
            need technical support, or want to provide feedback, we're ready to assist.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Send us a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Support Type Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Type of Inquiry</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {supportTypes.map((type) => (
                        <div
                          key={type.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            formData.type === type.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => handleInputChange('type', type.id)}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <type.icon className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">{type.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="Brief description of your inquiry"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">Message</label>
                    <Textarea
                      id="message"
                      rows={5}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Please provide details about your inquiry..."
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Multiple ways to reach our support team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactInfo.map((info, index) => (
                  <div 
                    key={index} 
                    className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                      info.action ? 'hover:bg-muted/50 cursor-pointer' : ''
                    }`}
                    onClick={() => info.action && window.open(info.action)}
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <info.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{info.title}</h4>
                      <p className="text-sm font-mono">{info.value}</p>
                      <p className="text-xs text-muted-foreground">{info.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-healing border-0">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Medical Emergency?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  For urgent medical situations, please contact emergency services immediately.
                </p>
                <Button variant="destructive" size="sm" className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Emergency: 911
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4">Frequently Asked Questions</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Quick answers to common questions about MEDITALK
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="group hover:shadow-medical transition-medical">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                        {faq.question}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="border-0 bg-gradient-hero text-white">
            <CardContent className="p-8">
              <div className="max-w-2xl mx-auto space-y-6">
                <Globe className="w-12 h-12 mx-auto text-white/80" />
                <h3 className="text-2xl font-bold">
                  Ready to Experience MEDITALK?
                </h3>
                <p className="text-white/90">
                  Don't wait – get instant access to AI-powered medical guidance. 
                  Start your free consultation today.
                </p>
                <Button variant="secondary" size="lg" onClick={() => window.location.href = '/dashboard'}>
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Start Free Consultation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Contact;