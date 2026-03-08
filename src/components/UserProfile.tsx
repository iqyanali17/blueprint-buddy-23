import React, { useState, useEffect, useRef } from 'react';
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
  Edit3,
  Loader2,
  ImagePlus
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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  // Local preview for avatar before/during upload
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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
          full_name: (user.user_metadata as any)?.full_name || '',
          avatar_url: (user.user_metadata as any)?.avatar_url || undefined,
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

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
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 5MB.', variant: 'destructive' });
      return;
    }

    // Show instant preview
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload immediately
    try {
      setUploadingAvatar(true);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;

      // Update profile state
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      setAvatarPreview(null); // Clear preview, use real URL now

      // Persist to profiles table
      const emailVal = profile.email || user.email || '';
      const upd = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, email: emailVal, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (upd.error) {
        // Row may not exist yet — insert
        await supabase.from('profiles').insert({
          id: user.id,
          avatar_url: publicUrl,
          email: emailVal,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Update auth metadata so Header picks it up
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });

      toast({ title: 'Photo updated!', description: 'Your profile picture has been saved.' });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      setAvatarPreview(null);
      toast({ title: 'Upload failed', description: error.message || 'Could not upload photo.', variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    try {
      setSaving(true);
      const dobValue = profile.date_of_birth?.trim() || null;
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
        updated_at: new Date().toISOString(),
      };

      const updateRes = await supabase.from('profiles').update(profileData).eq('id', user.id);
      if (updateRes.error) {
        const insertRes = await supabase.from('profiles').insert({ ...profileData, created_at: new Date().toISOString() });
        if (insertRes.error) throw insertRes.error;
      }

      // Sync auth metadata
      const metadata: Record<string, any> = {};
      if (profile.avatar_url) metadata.avatar_url = profile.avatar_url;
      if (profile.full_name) metadata.full_name = profile.full_name;
      if (Object.keys(metadata).length > 0) {
        await supabase.auth.updateUser({ data: metadata });
      }

      await loadProfile();
      toast({ title: '✅ Profile Saved', description: 'Your medical profile has been updated successfully.' });
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({ title: 'Save Failed', description: error?.message || String(error), variant: 'destructive' });
    } finally {
      setSaving(false);
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

  const displayAvatar = avatarPreview || profile.avatar_url;
  const initials = (profile.full_name || profile.email || 'U')
    .split(' ')
    .map((n) => n.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (!user) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Please sign in to manage your profile</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-52 rounded-2xl bg-muted" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-xl bg-muted" />)}
          </div>
          <div className="h-64 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  const completeness = getProfileCompleteness();

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-24 sm:pb-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleAvatarSelect}
        className="sr-only"
        aria-label="Upload profile photo"
      />

      {/* ─── Profile Hero Card ─── */}
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="h-36 sm:h-44 relative" style={{ background: 'var(--gradient-hero)' }}>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 10c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6zm0 2a4 4 0 100 8 4 4 0 000-8z' fill='white' fill-opacity='0.3'/%3E%3C/svg%3E")`,
          }} />
          {/* Meditalk branding overlay */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/20 backdrop-blur-sm rounded-full px-3 py-1.5">
            <Heart className="h-4 w-4 text-primary-foreground" />
            <span className="text-xs font-semibold text-primary-foreground tracking-wide">MEDITALK</span>
          </div>
        </div>

        <CardContent className="relative px-5 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-14">
            {/* Avatar with upload overlay */}
            <div className="relative group shrink-0">
              <Avatar className="h-28 w-28 sm:h-28 sm:w-28 border-4 border-background shadow-2xl ring-2 ring-primary/20">
                <AvatarImage src={displayAvatar} alt={profile.full_name || 'Profile'} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Upload overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/50 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 cursor-pointer"
                aria-label="Change profile photo"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-6 w-6 text-background animate-spin" />
                ) : (
                  <>
                    <Camera className="h-5 w-5 text-background" />
                    <span className="text-[10px] text-background font-medium mt-0.5">Change</span>
                  </>
                )}
              </button>

              {/* Upload status indicator */}
              {uploadingAvatar && (
                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </div>
              )}

              {/* Success indicator when avatar exists */}
              {!uploadingAvatar && profile.avatar_url && (
                <div className="absolute -bottom-1 -right-1 bg-success text-success-foreground rounded-full p-1 shadow-lg">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
              )}
            </div>

            {/* Name & info */}
            <div className="flex-1 text-center sm:text-left space-y-1 pt-2 sm:pt-0 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                {profile.full_name || 'Complete Your Profile'}
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {profile.email || user.email}
                </p>
                {profile.phone_number && (
                  <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {profile.phone_number}
                  </p>
                )}
              </div>
              {/* Quick action: upload photo if none */}
              {!profile.avatar_url && !uploadingAvatar && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium mt-1 transition-colors"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  Add a profile photo
                </button>
              )}
            </div>

            {/* Save button */}
            <div className="hidden sm:flex">
              <Button onClick={saveProfile} disabled={saving} size="default" className="shadow-md">
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-1.5" /> Save Profile</>
                )}
              </Button>
            </div>
          </div>

          {/* Profile Completeness */}
          <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-primary" />
                Profile Completeness
              </span>
              <Badge
                variant={completeness === 100 ? 'default' : 'secondary'}
                className={completeness === 100 ? 'bg-success text-success-foreground' : ''}
              >
                {completeness}%
              </Badge>
            </div>
            <Progress value={completeness} className="h-2.5" />
            {completeness < 100 && (
              <p className="text-xs text-muted-foreground mt-2">
                A complete profile helps us provide better, personalized medical guidance.
              </p>
            )}
            {completeness === 100 && (
              <p className="text-xs text-success mt-2 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Your profile is complete!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Quick Stats ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Heart, label: 'Conditions', count: profile.medical_conditions.length, color: 'text-destructive', bg: 'bg-destructive/10' },
          { icon: AlertTriangle, label: 'Allergies', count: profile.allergies.length, color: 'text-warning', bg: 'bg-warning/10' },
          { icon: Pill, label: 'Medications', count: profile.medications.length, color: 'text-primary', bg: 'bg-primary/10' },
          { icon: Shield, label: 'Security', count: null, color: 'text-success', bg: 'bg-success/10', text: 'Active' },
        ].map((stat) => (
          <Card key={stat.label} className="border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg} shrink-0`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-foreground leading-tight">{stat.count !== null ? stat.count : stat.text}</p>
                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Tabbed Content ─── */}
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

        {/* ── Personal Tab ── */}
        <TabsContent value="personal">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Edit3 className="h-5 w-5 text-primary" />
                Personal Details
              </CardTitle>
              <CardDescription>Keep your contact info up-to-date for emergency situations</CardDescription>
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
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="flex items-center gap-1.5 text-sm">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
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
                  placeholder="Name — Phone number (e.g., Jane Doe — +1 555-999-8888)"
                />
                <p className="text-xs text-muted-foreground">This person will be contacted in medical emergencies.</p>
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
                    <SelectItem value="ur">🇵🇰 Urdu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Medical Tab ── */}
        <TabsContent value="medical">
          <div className="space-y-4">
            {/* Medical Conditions */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-destructive" />
                  Medical Conditions
                </CardTitle>
                <CardDescription>Known diagnoses and chronic conditions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Diabetes, Hypertension, Asthma..."
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
                      <Badge key={condition} variant="secondary" className="py-1.5 px-3 flex items-center gap-1.5 text-sm animate-in fade-in">
                        <Heart className="h-3 w-3 text-destructive shrink-0" />
                        {condition}
                        <button onClick={() => removeItem('medical_conditions', condition)} className="ml-0.5 hover:text-destructive transition-colors" aria-label={`Remove ${condition}`}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border">
                    <Heart className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No conditions recorded yet</p>
                    <p className="text-xs text-muted-foreground/70">Add any medical conditions you've been diagnosed with</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Allergies */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Allergies
                </CardTitle>
                <CardDescription>Drug allergies, food allergies, and sensitivities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Penicillin, Peanuts, Latex..."
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
                      <Badge key={allergy} variant="destructive" className="py-1.5 px-3 flex items-center gap-1.5 text-sm animate-in fade-in">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {allergy}
                        <button onClick={() => removeItem('allergies', allergy)} className="ml-0.5 hover:opacity-70 transition-opacity" aria-label={`Remove ${allergy}`}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border">
                    <AlertTriangle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No allergies recorded</p>
                    <p className="text-xs text-muted-foreground/70">Important: Listing allergies helps prevent adverse reactions</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medications */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Pill className="h-5 w-5 text-primary" />
                  Current Medications
                </CardTitle>
                <CardDescription>Medications you're currently taking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Metformin 500mg, Aspirin 81mg..."
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
                      <Badge key={medication} variant="outline" className="py-1.5 px-3 flex items-center gap-1.5 text-sm border-primary/30 bg-primary/5 animate-in fade-in">
                        <Pill className="h-3 w-3 text-primary shrink-0" />
                        {medication}
                        <button onClick={() => removeItem('medications', medication)} className="ml-0.5 hover:text-destructive transition-colors" aria-label={`Remove ${medication}`}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border">
                    <Pill className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No medications recorded</p>
                    <p className="text-xs text-muted-foreground/70">Add current medications including dosage information</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Security Tab ── */}
        <TabsContent value="security">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-success" />
                Privacy & Security
              </CardTitle>
              <CardDescription>How MediTalk protects your medical information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { icon: Shield, title: 'End-to-End Encryption', desc: 'All medical data is encrypted at rest and in transit using industry-standard AES-256 encryption.', color: 'text-success' },
                { icon: CheckCircle2, title: 'HIPAA Compliant', desc: 'We follow HIPAA guidelines to protect your personal health information.', color: 'text-primary' },
                { icon: Clock, title: 'Access Logging', desc: 'Every access to your medical records is logged and auditable.', color: 'text-warning' },
                { icon: FileText, title: 'Data Ownership', desc: 'You own your data. Export or delete your medical information at any time.', color: 'text-muted-foreground' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border hover:bg-muted/60 transition-colors">
                  <div className="p-2.5 rounded-lg bg-background shadow-sm shrink-0">
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

      {/* ─── Floating Save Button (mobile) ─── */}
      <div className="sm:hidden fixed bottom-4 left-4 right-4 z-50">
        <Button onClick={saveProfile} disabled={saving} className="w-full shadow-xl" size="lg">
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Save Profile</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
