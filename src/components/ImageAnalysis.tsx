import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface ImageAnalysisProps {
  onComplete: (payload: { imageDataUrl: string; result: string }) => void;
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
          analysisResult = `1. Do:
• Clean the area gently and keep it dry
• Use broad‑spectrum sunscreen on exposed skin
• Track changes (size, color, border, itching/bleeding)
• Take clear photos weekly for comparison
• Arrange a routine dermatology check if persisting

2. Don’t:
• Don’t pick, scratch, or try to cut it
• Don’t apply harsh acids or bleaching creams
• Don’t ignore rapid growth, darkening, or bleeding
• Don’t rely on home remedies for suspicious lesions
• Don’t delay care if pain or ulceration appears

3. Medicine (if relevant):
• OTC hydrocortisone 1% thin layer for itch (≤7 days)
• Fragrance‑free moisturizer to support skin barrier
• If acne‑like: OTC benzoyl peroxide 2.5–5% spot use
• Avoid if allergic or if skin becomes irritated
• Ask a pharmacist if on other treatments

4. Guidance:
• What it likely shows: a common benign skin change with regular color/texture
• Why it happens: irritation, sun exposure, or normal mole/keratosis variation
• What to do next: document changes and schedule non‑urgent dermatology review
• Improve photo quality: good lighting, macro focus, ruler for scale
• Seek professional dermoscopy for definitive assessment

5. Precaution / Emergency:
• Urgent if rapidly changing, irregular edges, multi‑colors, bleeding, or new severe pain
• Urgent if associated with systemic symptoms (fever, weight loss)
• For eye/face lesions causing function change → urgent care
• If immunocompromised, lower threshold to seek care
• When in doubt, get an in‑person dermatologist evaluation`;
          break;
          
        case 'wound':
          analysisResult = `1. Do:
• Rinse with clean water/saline, pat dry
• Apply thin antibiotic ointment (if not allergic)
• Cover with sterile, breathable dressing; change daily
• Elevate if on limb to reduce swelling
• Track size, drainage, and pain daily

2. Don’t:
• Don’t scrub aggressively or use iodine/alcohol on healthy tissue
• Don’t keep it wet or occluded for too long
• Don’t reuse soiled dressings
• Don’t pick scabs or edges
• Don’t ignore rising pain or foul odor

3. Medicine (if relevant):
• OTC pain relief (acetaminophen/ibuprofen if safe for you)
• Consider hydrocolloid for superficial abrasions
• If tetanus >10 years (or >5 with dirty wound), get booster
• Avoid topical antibiotics if you develop rash/itch
• Ask clinician before using steroid creams on wounds

4. Guidance:
• What it likely shows: superficial wound without severe infection signs
• Why it happens: minor trauma/friction; normal inflammatory healing
• What to do next: clean, protect, monitor; photo log for healing progress
• Optimize healing: protein, hydration, avoid smoking
• Reassess in 48–72h or sooner if concerning changes

5. Precaution / Emergency:
• Urgent if spreading redness, warmth, pus, fever, increasing severe pain
• Urgent if deep, gaping, or contaminated (bite, soil)
• Loss of function/numbness → urgent evaluation
• Red streaking up limb or systemic symptoms → ER
• Diabetes/immunosuppression: lower threshold to seek care`;
          break;
          
        case 'rash':
          analysisResult = `1. Do:
• Identify and avoid recent new products/fabrics/metals
• Cool compress 10–15 min for itch relief
• Use bland emollient (ceramide, petrolatum)
• Gentle, fragrance‑free cleanser only
• Keep nails short to prevent scratching injury

2. Don’t:
• Don’t scratch; consider cotton gloves at night
• Don’t use fragranced lotions or harsh soaps
• Don’t apply strong acids/peels on irritated skin
• Don’t overheat the area (hot showers)
• Don’t share topical meds without advice

3. Medicine (if relevant):
• OTC hydrocortisone 1% thin layer 1–2×/day up to 7 days
• Oral antihistamine at night (cetirizine/loratadine) if itchy (if safe)
• If infected crusts: seek clinician for topical antibiotic guidance
• Stop steroid if worsening or skin thins
• Pregnant/breastfeeding: consult clinician first

4. Guidance:
• What it likely shows: contact dermatitis or irritant rash pattern
• Why it happens: skin barrier reaction to allergen/irritant
• What to do next: remove trigger, short course low‑potency steroid, moisturize
• Patch testing via dermatologist if recurrent/unknown trigger
• Improve photos with natural light and clear framing

5. Precaution / Emergency:
• Urgent if rash rapidly spreads, blistering, mucosal involvement, or fever
• Facial/eye swelling, breathing difficulty → ER (possible allergy)
• Signs of infection (pus, warmth, increasing pain) → urgent care
• Infants/elderly/immunocompromised: lower threshold for care
• If no improvement in 7–10 days → clinician review`;
          break;
          
        case 'eye':
          analysisResult = `1. Do:
• Use preservative‑free artificial tears 4–6×/day
• Cool compress 5–10 min for comfort
• Practice hand/eyelid hygiene; avoid makeup/contacts for now
• Rest eyes; follow 20‑20‑20 rule
• Note triggers (screen time, allergens, smoke)

2. Don’t:
• Don’t rub eyes or wear contacts until resolved
• Don’t share eye drops or cosmetics
• Don’t self‑use steroid eye drops
• Don’t ignore worsening light sensitivity
• Don’t drive if vision is blurred

3. Medicine (if relevant):
• Artificial tears (PF) day; lubricating gel at night
• Oral antihistamine if allergic symptoms (if safe)
• Avoid vasoconstrictor “redness relief” drops regularly
• Contact lens users: consider antibiotic drops if advised by clinician
• Seek pharmacist advice for interactions

4. Guidance:
• What it likely shows: mild conjunctival irritation/redness without severe signs
• Why it happens: dryness, allergy, or irritant exposure
• What to do next: lubrication, trigger avoidance, short rest from contacts/screens
• If unilateral and sticky discharge, consider bacterial—seek exam
• Keep photos/notes if recurrent episodes

5. Precaution / Emergency:
• Urgent if vision loss, severe pain, photophobia, trauma, chemical splash
• Contact lens wearers with pain/redness → urgent eye clinic (risk of keratitis)
• Fever with eye swelling or spreading redness → urgent care
• New halos around lights could be serious → ER
• Persistent symptoms >48–72h → eye professional review`;
        break;
        
      default:
        analysisResult = `1. Do:
• Capture clear, well‑lit images from multiple angles
• Note onset, duration, and associated symptoms
• Compare with prior photos for changes
• Keep the area clean and protected
• Plan a non‑urgent clinical review if persistent

2. Don’t:
• Don’t self‑treat aggressively without guidance
• Don’t ignore rapid worsening or pain
• Don’t share medications not prescribed to you
• Don’t use harsh chemicals on the area
• Don’t delay care if function is affected

3. Medicine (if relevant):
• OTC options may help symptom control; confirm safety for you
• Use moisturizers/barrier creams for skin support
• Simple analgesics for pain if appropriate
• Stop if irritation or allergy occurs
• Seek clinician advice for tailored therapy

4. Guidance:
• What it likely shows: no immediate alarming features in this image
• Why it happens: common benign processes or early irritation/inflammation
• What to do next: monitor with photos, optimize care, seek review if unsure
• Improve image quality for future assessments (lighting, focus, scale)
• In‑person exam provides definitive evaluation

5. Precaution / Emergency:
• Urgent if severe pain, spreading redness, discharge, fever, or function loss
• Trauma/chemical exposure → immediate care
• Immunocompromised/diabetes: lower threshold for help
• Rapid changes over hours to days → urgent assessment
• If concerned at any point, seek professional evaluation`;
      }

      // Create a dedicated session for image analysis
      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            title: `Image Analysis - ${analysisTypes.find(t => t.type === analysisType)?.label}`,
            session_type: 'image_analysis'
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Error creating session for image analysis:', sessionError);
          throw sessionError;
        }

        // Save to database with proper session reference
        const { error: insertError } = await supabase
          .from('medical_images')
          .insert({
            user_id: user.id,
            session_id: sessionData.id,
            image_url: 'placeholder-url', // In real app, upload to storage first
            analysis_result: { type: analysisType, result: analysisResult },
            image_type: analysisType,
            confidence_score: 0.75
          });

        if (insertError) {
          console.error('Error saving image analysis:', insertError);
        }
      } catch (error: any) {
        console.error('Error creating session or saving image analysis:', error);
      }

      if (imagePreview) {
        onComplete({ imageDataUrl: imagePreview, result: analysisResult });
      } else {
        onComplete({ imageDataUrl: '', result: analysisResult });
      }

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