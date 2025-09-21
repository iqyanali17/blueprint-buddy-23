import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Phone, MapPin, Heart, Zap, Thermometer } from 'lucide-react';

interface EmergencyInfo {
  title: string;
  icon: React.ReactNode;
  symptoms: string[];
  actions: string[];
  when: string;
  priority: 'immediate' | 'urgent' | 'soon';
}

const EmergencyGuide: React.FC = () => {
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyInfo | null>(null);

  const emergencies: EmergencyInfo[] = [
    {
      title: 'Heart Attack',
      icon: <Heart className="h-5 w-5" />,
      symptoms: [
        'Chest pain or pressure',
        'Pain radiating to arm, jaw, or back',
        'Shortness of breath',
        'Nausea or vomiting',
        'Cold sweats',
        'Lightheadedness'
      ],
      actions: [
        'Call 911 immediately',
        'Chew and swallow aspirin if not allergic',
        'Stay calm and sit down',
        'Loosen tight clothing',
        'If unconscious, begin CPR'
      ],
      when: 'Immediately - Call 911',
      priority: 'immediate'
    },
    {
      title: 'Stroke',
      icon: <Zap className="h-5 w-5" />,
      symptoms: [
        'Sudden numbness or weakness',
        'Sudden confusion or trouble speaking',
        'Sudden trouble seeing',
        'Sudden severe headache',
        'Sudden trouble walking or dizziness'
      ],
      actions: [
        'Call 911 immediately',
        'Note the time symptoms started',
        'Keep the person calm and still',
        'Do not give food, water, or medication',
        'Monitor breathing and consciousness'
      ],
      when: 'Immediately - Call 911',
      priority: 'immediate'
    },
    {
      title: 'Severe Allergic Reaction',
      icon: <AlertTriangle className="h-5 w-5" />,
      symptoms: [
        'Difficulty breathing or wheezing',
        'Swelling of face, lips, tongue, or throat',
        'Rapid pulse',
        'Dizziness or fainting',
        'Severe whole-body rash',
        'Nausea and vomiting'
      ],
      actions: [
        'Call 911 immediately',
        'Use EpiPen if available',
        'Remove or avoid the allergen',
        'Help the person lie down',
        'Monitor breathing closely'
      ],
      when: 'Immediately - Call 911',
      priority: 'immediate'
    },
    {
      title: 'High Fever',
      icon: <Thermometer className="h-5 w-5" />,
      symptoms: [
        'Temperature over 103°F (39.4°C)',
        'Severe headache',
        'Stiff neck',
        'Confusion or altered mental state',
        'Difficulty breathing',
        'Persistent vomiting'
      ],
      actions: [
        'Seek immediate medical attention',
        'Apply cool compresses',
        'Stay hydrated',
        'Remove excess clothing',
        'Monitor temperature regularly'
      ],
      when: 'Within 1 hour',
      priority: 'urgent'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate': return 'destructive';
      case 'urgent': return 'default';
      case 'soon': return 'secondary';
      default: return 'outline';
    }
  };

  const EmergencyContacts = () => (
    <Card className="border-destructive">
      <CardHeader className="pb-3">
        <CardTitle className="text-destructive flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Emergency Contacts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
          <span className="font-medium">Emergency Services</span>
          <Badge variant="destructive" className="text-lg font-bold">911</Badge>
        </div>
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span>Poison Control</span>
          <Badge variant="outline">1-800-222-1222</Badge>
        </div>
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span>Crisis Text Line</span>
          <Badge variant="outline">Text HOME to 741741</Badge>
        </div>
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span>National Suicide Prevention</span>
          <Badge variant="outline">988</Badge>
        </div>
      </CardContent>
    </Card>
  );

  if (selectedEmergency) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <Button 
            variant="outline" 
            onClick={() => setSelectedEmergency(null)}
            className="w-fit mb-4"
          >
            ← Back to Guide
          </Button>
          <CardTitle className="flex items-center gap-2">
            {selectedEmergency.icon}
            {selectedEmergency.title}
          </CardTitle>
          <Badge 
            variant={getPriorityColor(selectedEmergency.priority) as any}
            className="w-fit"
          >
            {selectedEmergency.when}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-3 text-destructive">⚠️ Symptoms to Watch For:</h3>
            <ul className="space-y-2">
              {selectedEmergency.symptoms.map((symptom, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>{symptom}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-3 text-primary">🚨 Immediate Actions:</h3>
            <ol className="space-y-2">
              {selectedEmergency.actions.map((action, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Badge variant="outline" className="min-w-6 h-6 text-xs">
                    {index + 1}
                  </Badge>
                  <span>{action}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive font-medium">
              ⚠️ This information is for emergency guidance only. Always call 911 for life-threatening situations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Emergency Medical Guide
          </CardTitle>
          <CardDescription>
            Quick reference for medical emergencies - Always call 911 for life-threatening situations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {emergencies.map((emergency, index) => (
              <Card 
                key={index}
                className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-destructive"
                onClick={() => setSelectedEmergency(emergency)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-destructive">{emergency.icon}</div>
                      <div>
                        <h4 className="font-medium">{emergency.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Tap for detailed guidance
                        </p>
                      </div>
                    </div>
                    <Badge variant={getPriorityColor(emergency.priority) as any}>
                      {emergency.priority.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <EmergencyContacts />

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-1" />
            <div>
              <h4 className="font-medium mb-1">Find Nearest Hospital</h4>
              <p className="text-sm text-muted-foreground mb-3">
                In an emergency, call 911. For non-emergency situations, use these resources:
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://maps.google.com/search/hospital+near+me" target="_blank" rel="noopener noreferrer">
                    <MapPin className="h-4 w-4 mr-2" />
                    Google Maps - Hospitals
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://maps.google.com/search/urgent+care+near+me" target="_blank" rel="noopener noreferrer">
                    <MapPin className="h-4 w-4 mr-2" />
                    Google Maps - Urgent Care
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyGuide;