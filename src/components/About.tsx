import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Award, 
  Globe, 
  Heart,
  Shield,
  Brain,
  Stethoscope,
  Target,
  CheckCircle,
  Star,
  TrendingUp,
  MessageCircle
} from 'lucide-react';

const About = () => {
  const stats = [
    {
      icon: Users,
      number: "50K+",
      label: "Active Users",
      description: "Trust MEDITALK daily"
    },
    {
      icon: MessageCircle,
      number: "500K+",
      label: "Consultations",
      description: "Successful AI interactions"
    },
    {
      icon: Globe,
      number: "25+",
      label: "Languages",
      description: "Multilingual support"
    },
    {
      icon: Award,
      number: "99.9%",
      label: "Accuracy Rate",
      description: "In symptom assessment"
    }
  ];

  const values = [
    {
      icon: Heart,
      title: "Patient-Centered Care",
      description: "Every feature is designed with patient needs and safety as our top priority"
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "HIPAA-compliant infrastructure ensures your medical data remains completely secure"
    },
    {
      icon: Brain,
      title: "AI Innovation",
      description: "Cutting-edge machine learning provides accurate, reliable medical guidance"
    },
    {
      icon: Globe,
      title: "Global Accessibility",
      description: "Breaking down language and geographic barriers to quality healthcare"
    }
  ];

  const team = [
    {
      name: "Dr. Sarah Johnson",
      role: "Chief Medical Officer",
      expertise: "Emergency Medicine & AI Ethics",
      description: "15+ years in emergency medicine, leading our medical AI safety protocols"
    },
    {
      name: "Alex Chen",
      role: "Lead AI Engineer", 
      expertise: "Machine Learning & NLP",
      description: "Former Google AI researcher specializing in medical language processing"
    },
    {
      name: "Dr. Maria Rodriguez",
      role: "Clinical Director",
      expertise: "Family Medicine & Telemedicine",
      description: "Board-certified physician with expertise in remote patient care"
    },
    {
      name: "David Kim",
      role: "Head of Security",
      expertise: "Healthcare Cybersecurity",
      description: "CISSP certified with 10+ years securing medical data systems"
    }
  ];

  const achievements = [
    "HIPAA Compliant Infrastructure",
    "FDA Guidelines Adherence", 
    "ISO 27001 Security Certification",
    "Medical AI Ethics Board Approved",
    "Peer-Reviewed Research Published",
    "Healthcare Innovation Award 2024"
  ];

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            <Stethoscope className="w-4 h-4 mr-2" />
            About MEDITALK
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Revolutionizing Healthcare
            <span className="block text-primary">Through AI Innovation</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            MEDITALK combines advanced artificial intelligence with medical expertise to make 
            quality healthcare guidance accessible to everyone, everywhere, at any time.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="mb-20">
          <Card className="border-0 bg-gradient-healing shadow-medical">
            <CardContent className="p-8">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Badge variant="secondary" className="mb-4">Our Mission</Badge>
                    <h3 className="text-2xl font-bold">
                      Democratizing Access to Quality Healthcare Guidance
                    </h3>
                    <p className="text-muted-foreground text-lg">
                      We believe everyone deserves immediate access to reliable medical guidance. 
                      Our AI-powered platform bridges the gap between patients and healthcare, 
                      providing intelligent support when and where it's needed most.
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Our Goal</h4>
                      <p className="text-sm text-muted-foreground">
                        Reduce healthcare inequity through accessible AI technology
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 text-center shadow-sm">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <stat.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-2xl font-bold text-primary">{stat.number}</div>
                      <div className="font-medium text-sm">{stat.label}</div>
                      <div className="text-xs text-muted-foreground">{stat.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Core Values */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4">Our Core Values</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do at MEDITALK
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {values.map((value, index) => (
              <Card key={index} className="group hover:shadow-medical transition-medical">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-medical">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  
                  <h4 className="text-lg font-semibold mb-2 group-hover:text-primary transition-medical">
                    {value.title}
                  </h4>
                  
                  <p className="text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4">Meet Our Expert Team</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Medical professionals and AI experts working together to advance healthcare technology
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {team.map((member, index) => (
              <Card key={index} className="group hover:shadow-medical transition-medical">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h4 className="font-semibold group-hover:text-primary transition-medical">
                      {member.name}
                    </h4>
                    <p className="text-sm text-primary font-medium">{member.role}</p>
                    <Badge variant="secondary" className="text-xs">{member.expertise}</Badge>
                    <p className="text-xs text-muted-foreground">
                      {member.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Achievements & Certifications */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4">Certifications & Achievements</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Recognition and compliance standards that ensure the highest quality and safety
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-3 bg-muted/30 rounded-lg p-4">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                <span className="font-medium">{achievement}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Future Vision */}
        <div className="text-center">
          <Card className="border-0 bg-gradient-hero text-white">
            <CardContent className="p-8">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold">
                  Shaping the Future of Healthcare
                </h3>
                
                <p className="text-white/90 text-lg">
                  We're continuously advancing our AI capabilities, expanding our medical expertise, 
                  and building partnerships to create a world where quality healthcare guidance 
                  is available to everyone, regardless of location or circumstances.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button variant="secondary" size="lg" onClick={() => window.location.href = '/dashboard'}>
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Experience MEDITALK
                  </Button>
                  <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    Join Our Mission
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default About;