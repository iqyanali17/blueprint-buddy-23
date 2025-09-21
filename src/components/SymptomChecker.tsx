import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface SymptomCheckerProps {
  onComplete: (assessment: string) => void;
}

const SymptomChecker: React.FC<SymptomCheckerProps> = ({ onComplete }) => {
  const [symptoms, setSymptoms] = useState('');
  const [step, setStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const commonSymptoms = [
    'Fever', 'Headache', 'Cough', 'Fatigue', 'Nausea', 'Dizziness',
    'Shortness of breath', 'Chest pain', 'Abdominal pain', 'Joint pain'
  ];

  const emergencySymptoms = [
    'Severe chest pain', 'Difficulty breathing', 'Loss of consciousness',
    'Severe bleeding', 'High fever (over 103°F)', 'Severe allergic reaction'
  ];

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const generateAssessment = () => {
    const hasEmergency = selectedSymptoms.some(s => 
      emergencySymptoms.some(es => s.toLowerCase().includes(es.toLowerCase()))
    );

    let assessment = '';
    
    if (hasEmergency) {
      assessment = `⚠️ URGENT: Based on your symptoms (${selectedSymptoms.join(', ')}), you should seek immediate medical attention. Please contact emergency services or visit the nearest emergency room.`;
    } else if (selectedSymptoms.length > 3) {
      assessment = `Based on your symptoms (${selectedSymptoms.join(', ')}), I recommend consulting with a healthcare provider within 24-48 hours for proper evaluation and treatment.`;
    } else if (selectedSymptoms.length > 0) {
      assessment = `Your symptoms (${selectedSymptoms.join(', ')}) appear to be mild. Monitor your condition and consider consulting a healthcare provider if symptoms worsen or persist for more than a few days.`;
    } else {
      assessment = 'Please select the symptoms you are experiencing for a proper assessment.';
    }

    if (symptoms.trim()) {
      assessment += `\n\nAdditional details: ${symptoms}`;
    }

    assessment += '\n\n⚠️ This is not a medical diagnosis. Always consult with qualified healthcare professionals for proper medical advice.';
    
    onComplete(assessment);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          Symptom Checker
        </CardTitle>
        <CardDescription>
          Help us understand your symptoms for better guidance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-3">Select your symptoms:</h3>
              <div className="grid grid-cols-2 gap-2">
                {commonSymptoms.map(symptom => (
                  <Badge
                    key={symptom}
                    variant={selectedSymptoms.includes(symptom) ? "default" : "outline"}
                    className="cursor-pointer justify-center p-2"
                    onClick={() => toggleSymptom(symptom)}
                  >
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <h4 className="font-medium text-destructive flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4" />
                Emergency Symptoms
              </h4>
              <p className="text-sm text-destructive/80 mb-2">
                If you're experiencing any of these, seek immediate medical attention:
              </p>
              <div className="grid grid-cols-1 gap-1">
                {emergencySymptoms.map(symptom => (
                  <Badge
                    key={symptom}
                    variant="destructive"
                    className="cursor-pointer justify-center"
                    onClick={() => toggleSymptom(symptom)}
                  >
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>

            <Button 
              onClick={() => setStep(2)} 
              className="w-full"
              disabled={selectedSymptoms.length === 0}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Additional Details (Optional)</h3>
              <Textarea
                placeholder="Describe when symptoms started, severity, what makes them better/worse, etc."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Button onClick={generateAssessment} className="w-full">
                Get Assessment
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setStep(1)} 
                className="w-full"
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SymptomChecker;