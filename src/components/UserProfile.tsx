import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Heart, 
  AlertTriangle, 
  Pill,
  Shield,
  Save,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface ProfileData {
  full_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  emergency_contact: string;
  medical_conditions: string[];
  allergies: string[];
  medications: string[];
  preferred_language: string;
}

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    emergency_contact: '',
    medical_conditions: [],
    allergies: [],
    medications: [],
    preferred_language: 'en'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        setProfile({
          full_name: existingProfile.full_name || '',
          email: existingProfile.email || user.email || '',
          phone_number: existingProfile.phone_number || '',
          date_of_birth: existingProfile.date_of_birth || '',
          emergency_contact: existingProfile.emergency_contact || '',
          medical_conditions: existingProfile.medical_conditions || [],
          allergies: existingProfile.allergies || [],
          medications: existingProfile.medications || [],
          preferred_language: existingProfile.preferred_language || 'en'
        });
      } else {
        // Initialize with user email
        setProfile(prev => ({
          ...prev,
          email: user.email || ''
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const profileData = {
        id: user.id,
        email: profile.email,
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        date_of_birth: profile.date_of_birth,
        emergency_contact: profile.emergency_contact,
        medical_conditions: profile.medical_conditions,
        allergies: profile.allergies,
        medications: profile.medications,
        preferred_language: profile.preferred_language,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your medical profile has been saved successfully.",
      });

    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error Saving Profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addCondition = () => {
    if (newCondition.trim() && !profile.medical_conditions.includes(newCondition.trim())) {
      setProfile(prev => ({
        ...prev,
        medical_conditions: [...prev.medical_conditions, newCondition.trim()]
      }));
      setNewCondition('');
    }
  };

  const removeCondition = (condition: string) => {
    setProfile(prev => ({
      ...prev,
      medical_conditions: prev.medical_conditions.filter(c => c !== condition)
    }));
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !profile.allergies.includes(newAllergy.trim())) {
      setProfile(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }));
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setProfile(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy)
    }));
  };

  const addMedication = () => {
    if (newMedication.trim() && !profile.medications.includes(newMedication.trim())) {
      setProfile(prev => ({
        ...prev,
        medications: [...prev.medications, newMedication.trim()]
      }));
      setNewMedication('');
    }
  };

  const removeMedication = (medication: string) => {
    setProfile(prev => ({
      ...prev,
      medications: prev.medications.filter(m => m !== medication)
    }));
  };

  if (!user) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please sign in to manage your profile</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">Loading your profile...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Your basic personal and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone_number}
                onChange={(e) => setProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={profile.date_of_birth}
                onChange={(e) => setProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="emergency">Emergency Contact</Label>
            <Input
              id="emergency"
              value={profile.emergency_contact}
              onChange={(e) => setProfile(prev => ({ ...prev, emergency_contact: e.target.value }))}
              placeholder="Name and phone number of emergency contact"
            />
          </div>

          <div>
            <Label htmlFor="language">Preferred Language</Label>
            <Select value={profile.preferred_language} onValueChange={(value) => setProfile(prev => ({ ...prev, preferred_language: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-medical" />
            Medical Information
          </CardTitle>
          <CardDescription>
            Your medical history and current health conditions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Medical Conditions */}
          <div>
            <Label className="text-base font-medium flex items-center gap-2 mb-3">
              <Heart className="h-4 w-4" />
              Medical Conditions
            </Label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a medical condition"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                />
                <Button onClick={addCondition} variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.medical_conditions.map((condition) => (
                  <Badge key={condition} variant="secondary" className="flex items-center gap-1">
                    {condition}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeCondition(condition)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Allergies */}
          <div>
            <Label className="text-base font-medium flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Allergies
            </Label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter an allergy"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                />
                <Button onClick={addAllergy} variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.allergies.map((allergy) => (
                  <Badge key={allergy} variant="destructive" className="flex items-center gap-1">
                    {allergy}
                    <X
                      className="h-3 w-3 cursor-pointer hover:opacity-70"
                      onClick={() => removeAllergy(allergy)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Current Medications */}
          <div>
            <Label className="text-base font-medium flex items-center gap-2 mb-3">
              <Pill className="h-4 w-4 text-healing" />
              Current Medications
            </Label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a medication"
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addMedication()}
                />
                <Button onClick={addMedication} variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.medications.map((medication) => (
                  <Badge key={medication} variant="outline" className="flex items-center gap-1">
                    {medication}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeMedication(medication)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Your medical information is encrypted and secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Your data is protected</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All medical information is encrypted and stored securely. We comply with HIPAA regulations 
                  and never share your personal health information without your explicit consent.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveProfile} 
          disabled={saving}
          className="px-8"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;