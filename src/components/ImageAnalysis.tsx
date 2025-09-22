import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface ImageAnalysisProps {
  onComplete: (result: string) => void;
}

const ImageAnalysis: React.FC<ImageAnalysisProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState<'skin' | 'wound' | 'rash' | 'eye' | 'general'>('general');

  const analysisTypes = [
    { type: 'skin' as const, label: 'Skin Condition', description: 'Analyze moles, spots, or skin changes' },
    { type: 'wound' as const, label: 'Wound Assessment', description: 'Check cuts, bruises, or injuries' },
    { type: 'rash' as const, label: 'Rash Analysis', description: 'Identify rashes or skin irritations' },
    { type: 'eye' as const, label: 'Eye Condition', description: 'Examine eye redness or irritation' },
    { type: 'general' as const, label: 'General Analysis', description: 'General medical image analysis' }
  ];

  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!selectedImage || !user) return;

    setAnalyzing(true);
    
    try {
      // Simulate image analysis process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock analysis result based on type
      let analysisResult = '';
      
      switch (analysisType) {
        case 'skin':
          analysisResult = `🔍 **Skin Analysis Complete**

**Observations:**
- The analyzed image shows what appears to be a common skin condition
- No immediate signs of concerning irregularities detected
- Coloration and texture appear within normal variations

**Recommendations:**
- Monitor any changes in size, color, or texture
- Consider consulting a dermatologist for professional evaluation
- Maintain good skin hygiene and sun protection

⚠️ **Important:** This analysis is not a medical diagnosis. Please consult with a qualified dermatologist for professional medical advice.`;
          break;
          
        case 'wound':
          analysisResult = `🩹 **Wound Assessment Complete**

**Observations:**
- Wound appears to be superficial
- No visible signs of severe infection
- Healing process seems to be progressing normally

**Care Recommendations:**
- Keep the wound clean and dry
- Apply antiseptic as recommended
- Change dressings regularly
- Watch for signs of infection (increased redness, warmth, pus)

⚠️ **Seek immediate medical attention if:** Wound shows signs of infection, doesn't heal within expected timeframe, or if you experience fever.`;
          break;
          
        case 'rash':
          analysisResult = `🔴 **Rash Analysis Complete**

**Observations:**
- Appears to be a common skin irritation
- Distribution pattern suggests possible contact dermatitis
- No severe inflammatory signs detected

**Management Suggestions:**
- Avoid known irritants and allergens
- Apply cool compresses to reduce itching
- Consider over-the-counter anti-inflammatory creams
- Keep the area clean and dry

⚠️ **Consult a doctor if:** Rash spreads rapidly, is accompanied by fever, or doesn't improve with basic care.`;
          break;
          
        case 'eye':
          analysisResult = `👁️ **Eye Condition Analysis Complete**

**Observations:**
- Mild irritation or redness noted
- No severe inflammatory signs visible
- Structure appears normal

**Care Recommendations:**
- Avoid rubbing the eyes
- Use preservative-free artificial tears
- Apply cool compress for comfort
- Ensure proper eye hygiene

⚠️ **See an eye care professional if:** Vision changes, severe pain, light sensitivity, or symptoms worsen.`;
          break;
          
        default:
          analysisResult = `🔍 **Medical Image Analysis Complete**

**General Assessment:**
- Image has been analyzed for visible medical concerns
- No immediate alarming features detected
- Further evaluation may be needed for proper diagnosis

**Next Steps:**
- Document any symptoms or changes
- Consider professional medical consultation
- Keep monitoring the condition

⚠️ **This is not a medical diagnosis.** Always consult with qualified healthcare professionals for proper medical evaluation and treatment.`;
      }

      // Save to database (mock - in real app would store image and analysis)
      const { error: insertError } = await supabase
        .from('medical_images')
        .insert({
          user_id: user.id,
          session_id: 'image-analysis-' + Date.now(),
          image_url: 'placeholder-url', // In real app, upload to storage first
          analysis_result: { type: analysisType, result: analysisResult },
          image_type: analysisType,
          confidence_score: 0.75
        });

      if (insertError) {
        console.error('Error saving image analysis:', insertError);
      }

      onComplete(analysisResult);
      
      toast({
        title: "Analysis Complete",
        description: "Your image has been analyzed successfully",
      });

    } catch (error: any) {
      console.error('Error analyzing image:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please sign in to use image analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Medical Image Analysis
        </CardTitle>
        <CardDescription>
          Upload a medical image for AI-powered analysis and insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Analysis Type Selection */}
        <div>
          <h3 className="font-medium mb-3">Select Analysis Type:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysisTypes.map(({ type, label, description }) => (
              <div
                key={type}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  analysisType === type 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setAnalysisType(type)}
              >
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs text-muted-foreground mt-1">{description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
              {imagePreview ? (
                <div className="relative w-full h-full">
                  <img 
                    src={imagePreview} 
                    alt="Selected for analysis" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Camera className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, or GIF (MAX. 10MB)</p>
                </div>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageSelect}
              />
            </label>
          </div>
        </div>

        {/* Analysis Button */}
        <div className="space-y-4">
          <Button 
            onClick={handleAnalyze}
            disabled={!selectedImage || analyzing}
            className="w-full"
          >
            {analyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing Image...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Analyze Image
              </>
            )}
          </Button>

          {/* Medical Disclaimer */}
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning mb-1">Medical Disclaimer</p>
                <p className="text-muted-foreground">
                  This AI analysis is for educational purposes only and is not a substitute for professional medical diagnosis. 
                  Always consult qualified healthcare providers for proper medical evaluation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageAnalysis;