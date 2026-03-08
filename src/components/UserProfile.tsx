import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

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
  X,
  Camera,
  Globe,
  Activity,
  FileText,
  CheckCircle2,
  Clock,
  Edit3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  avatar_url?: string;
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
    preferred_language: 'en',
    avatar_url: undefined,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
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
          preferred_language: existingProfile.preferred_language || 'en',
          avatar_url: existingProfile.avatar_url || (user.user_metadata as any)?.avatar_url || undefined,
        });
      } else {
        setProfile(prev => ({
          ...prev,
          email: user.email || '',
          avatar_url: (user.user_metadata as any)?.avatar_url || undefined,
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate profile completeness
  const getProfileCompleteness = () => {
    const fields = [
      profile.full_name,
      profile.email,
      profile.phone_number,
      profile.date_of_birth,
      profile.emergency_contact,
      profile.medical_conditions.length > 0,
      profile.allergies.length > 0,
      profile.medications.length > 0,
      profile.avatar_url,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const saveProfile = async () => {
    if (!user) return;
    try {
      setSaving(true);
      const dobValue = profile.date_of_birth && profile.date_of_birth.trim() !== '' ? profile.date_of_birth : null;
      const profileData = {
        id: user.id,
        email: profile.email || user.email || '',
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        date_of_birth: dobValue,
        emergency_contact: profile.emergency_contact,
        medical_conditions: profile.medical_conditions,
        allergies: profile.allergies,
        medications: profile.medications,
        preferred_language: profile.preferred_language,
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString()
      };

      const updateRes = await supabase.from('profiles').update(profileData).eq('id', user.id);
      if (updateRes.error) {
        const insertRes = await supabase.from('profiles').insert({ ...profileData, created_at: new Date().toISOString() });
        if (insertRes.error) throw insertRes.error;
      } else if ((updateRes.data as any)?.length === 0) {
        const insertRes = await supabase.from('profiles').insert({ ...profileData, created_at: new Date().toISOString() });
        if (insertRes.error) throw insertRes.error;
      }

      const metadata: Record<string, any> = {};
      if (profile.avatar_url) metadata.avatar_url = profile.avatar_url;
      if (profile.full_name) metadata.full_name = profile.full_name;
      if (Object.keys(metadata).length > 0) {
        const { error: metaErr } = await supabase.auth.updateUser({ data: metadata });
        if (metaErr) console.warn('Failed to update auth metadata:', metaErr.message);
      }

      await loadProfile();
      toast({ title: "Profile Updated", description: "Your medical profile has been saved successfully." });
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error Saving Profile",
        description: error?.message || String(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const onAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
  };

  const uploadAvatar = async () => {
    if (!user || !avatarFile) return;
    try {
      setUploadingAvatar(true);
      const ext = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile, {
        cacheControl: '3600',
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));

      const { error: metaErr } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (metaErr) console.warn('Failed to update avatar_url metadata:', metaErr.message);

      const emailForAvatar = profile.email || user.email || '';
      const upd = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, email: emailForAvatar, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (upd.error || (upd.data as any)?.length === 0) {
        await supabase.from('profiles').insert({ id: user.id, avatar_url: publicUrl, email: emailForAvatar, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      }

      toast({ title: 'Avatar updated', description: 'Your profile picture has been updated.' });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({ title: 'Avatar upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
      setAvatarFile(null);
    }
  };

  const addItem = (type: 'condition' | 'allergy' | 'medication') => {
    const map = {
      condition: { value: newCondition, key: 'medical_conditions' as const, setter: setNewCondition },
      allergy: { value: newAllergy, key: 'allergies' as const, setter: setNewAllergy },
      medication: { value: newMedication, key: 'medications' as const, setter: setNewMedication },
    };
    const { value, key, setter } = map[type];
    if (value.trim() && !profile[key].includes(value.trim())) {
      setProfile(prev => ({ ...prev, [key]: [...prev[key], value.trim()] }));
      setter('');
    }
  };

  const removeItem = (type: 'medical_conditions' | 'allergies' | 'medications', item: string) => {
    setProfile(prev => ({ ...prev, [type]: prev[type].filter(i => i !== item) }));
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
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-48 rounded-xl bg-muted" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 rounded-xl bg-muted" />
            <div className="h-32 rounded-xl bg-muted" />
            <div className="h-32 rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  const completeness = getProfileCompleteness();

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="h-32 sm:h-40 relative" style={{ background: 'var(--gradient-hero)' }}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE1YzYuNjI3IDAgMTIgNS4zNzMgMTIgMTJzLTUuMzczIDEyLTEyIDEyLTEyLTUuMzczLTEyLTEyIDUuMzczLTEyIDEyLTEyem0wIDRhOCA4IDAgMTAwIDE2IDggOCAwIDAwMC0xNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        </div>
        <CardContent className="relative px-4 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-12">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="h-28 w-28 sm:h-24 sm:w-24 border-4 border-background shadow-xl">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name || profile.email} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {(profile.full_name || profile.email || 'U')
                    .split(' ')
                    .map((n) => n.charAt(0))
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="h-6 w-6 text-background" />
                <input type="file" accept="image/*" onChange={onAvatarFileChange} className="sr-only" />
              </label>
            </div>

            {/* Name & Meta */}
            <div className="flex-1 text-center sm:text-left space-y-1 pt-2 sm:pt-0">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                {profile.full_name || 'Complete Your Profile'}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {profile.email || user.email}
              </p>
              {profile.phone_number && (
                <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {profile.phone_number}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {avatarFile && (
                <Button onClick={uploadAvatar} disabled={uploadingAvatar} size="sm" variant="outline">
                  {uploadingAvatar ? 'Uploading...' : 'Save Photo'}
                </Button>
              )}
              <Button onClick={saveProfile} disabled={saving} size="sm">
                {saving ? (
                  <><div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary-foreground mr-1.5" /> Saving...</>
                ) : (
                  <><Save className="h-3.5 w-3.5 mr-1.5" /> Save Profile</>
                )}
              </Button>
            </div>
          </div>

          {/* Profile Completeness */}
          <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-primary" />
                Profile Completeness
              </span>
              <span className={`text-sm font-bold ${completeness === 100 ? 'text-success' : completeness >= 60 ? 'text-primary' : 'text-warning'}`}>
                {completeness}%
              </span>
            </div>
            <Progress value={completeness} className="h-2" />
            {completeness < 100 && (
              <p className="text-xs text-muted-foreground mt-2">
                Complete your profile for better medical assistance and personalized recommendations.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Heart, label: 'Conditions', count: profile.medical_conditions.length, color: 'text-destructive', bg: 'bg-destructive/10' },
          { icon: AlertTriangle, label: 'Allergies', count: profile.allergies.length, color: 'text-warning', bg: 'bg-warning/10' },
          { icon: Pill, label: 'Medications', count: profile.medications.length, color: 'text-primary', bg: 'bg-primary/10' },
          { icon: Shield, label: 'Security', count: null, color: 'text-success', bg: 'bg-success/10', text: 'Protected' },
        ].map((stat) => (
          <Card key={stat.label} className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{stat.count !== null ? stat.count : stat.text}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="personal" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Personal</span> Info
          </TabsTrigger>
          <TabsTrigger value="medical" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Heart className="h-4 w-4" />
            Medical
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Edit3 className="h-5 w-5 text-primary" />
                Personal Details
              </CardTitle>
              <CardDescription>Update your contact and personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="flex items-center gap-1.5 text-sm">
                    <User className="h-3.5 w-3.5 text-muted-foreground" /> Full Name
                  </Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="flex items-center gap-1.5 text-sm">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
                  </Label>
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
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="flex items-center gap-1.5 text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone_number}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dob" className="flex items-center gap-1.5 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Date of Birth
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    value={profile.date_of_birth}
                    onChange={(e) => setProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="emergency" className="flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Emergency Contact
                </Label>
                <Input
                  id="emergency"
                  value={profile.emergency_contact}
                  onChange={(e) => setProfile(prev => ({ ...prev, emergency_contact: e.target.value }))}
                  placeholder="Name and phone number of emergency contact"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="language" className="flex items-center gap-1.5 text-sm">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Preferred Language
                </Label>
                <Select value={profile.preferred_language} onValueChange={(value) => setProfile(prev => ({ ...prev, preferred_language: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                    <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                    <SelectItem value="fr">🇫🇷 French</SelectItem>
                    <SelectItem value="de">🇩🇪 German</SelectItem>
                    <SelectItem value="zh">🇨🇳 Chinese</SelectItem>
                    <SelectItem value="ja">🇯🇵 Japanese</SelectItem>
                    <SelectItem value="hi">🇮🇳 Hindi</SelectItem>
                    <SelectItem value="ar">🇸🇦 Arabic</SelectItem>
                    <SelectItem value="pt">🇧🇷 Portuguese</SelectItem>
                    <SelectItem value="ko">🇰🇷 Korean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Tab */}
        <TabsContent value="medical">
          <div className="space-y-4">
            {/* Medical Conditions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-destructive" />
                  Medical Conditions
                </CardTitle>
                <CardDescription>Known medical conditions and diagnoses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Diabetes, Hypertension..."
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('condition')}
                    className="flex-1"
                  />
                  <Button onClick={() => addItem('condition')} variant="outline" size="icon" className="shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {profile.medical_conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.medical_conditions.map((condition) => (
                      <Badge key={condition} variant="secondary" className="py-1.5 px-3 flex items-center gap-1.5 text-sm">
                        <Heart className="h-3 w-3 text-destructive" />
                        {condition}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive ml-1" onClick={() => removeItem('medical_conditions', condition)} />
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic py-2">No medical conditions recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Allergies */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Allergies
                </CardTitle>
                <CardDescription>Known allergies and sensitivities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Penicillin, Peanuts..."
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('allergy')}
                    className="flex-1"
                  />
                  <Button onClick={() => addItem('allergy')} variant="outline" size="icon" className="shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {profile.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.allergies.map((allergy) => (
                      <Badge key={allergy} variant="destructive" className="py-1.5 px-3 flex items-center gap-1.5 text-sm">
                        <AlertTriangle className="h-3 w-3" />
                        {allergy}
                        <X className="h-3 w-3 cursor-pointer hover:opacity-70 ml-1" onClick={() => removeItem('allergies', allergy)} />
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic py-2">No allergies recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Current Medications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Pill className="h-5 w-5 text-primary" />
                  Current Medications
                </CardTitle>
                <CardDescription>Medications you are currently taking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Metformin 500mg..."
                    value={newMedication}
                    onChange={(e) => setNewMedication(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('medication')}
                    className="flex-1"
                  />
                  <Button onClick={() => addItem('medication')} variant="outline" size="icon" className="shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {profile.medications.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.medications.map((medication) => (
                      <Badge key={medication} variant="outline" className="py-1.5 px-3 flex items-center gap-1.5 text-sm border-primary/30 bg-primary/5">
                        <Pill className="h-3 w-3 text-primary" />
                        {medication}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive ml-1" onClick={() => removeItem('medications', medication)} />
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic py-2">No medications recorded</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-success" />
                Privacy & Security
              </CardTitle>
              <CardDescription>How we protect your medical information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { icon: Shield, title: 'End-to-End Encryption', desc: 'All medical data is encrypted at rest and in transit using industry-standard AES-256 encryption.', color: 'text-success' },
                { icon: CheckCircle2, title: 'HIPAA Compliant', desc: 'We follow Health Insurance Portability and Accountability Act guidelines to protect your health information.', color: 'text-primary' },
                { icon: Clock, title: 'Access Logging', desc: 'Every access to your medical records is logged and auditable for your safety.', color: 'text-warning' },
                { icon: FileText, title: 'Data Ownership', desc: 'You own your data. Export or delete your medical information at any time.', color: 'text-muted-foreground' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border hover:bg-muted/60 transition-colors">
                  <div className="p-2 rounded-lg bg-background shadow-sm">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="flex items-center justify-between p-4 rounded-xl bg-success/5 border border-success/20">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
                  <span className="text-sm font-medium text-foreground">Account Status</span>
                </div>
                <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Secure & Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Save Button (mobile) */}
      <div className="sm:hidden fixed bottom-4 left-4 right-4 z-50">
        <Button onClick={saveProfile} disabled={saving} className="w-full shadow-lg" size="lg">
          {saving ? (
            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" /> Saving...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Save Profile</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
