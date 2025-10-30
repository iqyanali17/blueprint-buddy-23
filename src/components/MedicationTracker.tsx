import React, { useState, useEffect, useRef } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Pill, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface Medication {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  reminder_times: string[];
  notes?: string;
  is_active: boolean;
}

const MedicationTracker: React.FC = () => {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: 'daily',
    time: '08:00',
    notes: ''
  });
  const [notifiedMap, setNotifiedMap] = useState<Record<string, string>>({});
  const notifiedMapRef = useRef<Record<string, string>>({});
  useEffect(() => { notifiedMapRef.current = notifiedMap; }, [notifiedMap]);
  const [enableSound, setEnableSound] = useState<boolean>(true);

  const playBeep = () => {
    if (!enableSound) return;
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
      o.stop(ctx.currentTime + 1.0);
    } catch (e) {
      // ignore sound errors
    }
  };

  const normalizeTime = (t: string): string => {
    // Accept formats like "8:0", "08:00", or "08:00:00" and normalize to HH:MM
    if (!t) return '';
    const parts = t.split(':');
    const h = parts[0] ? parts[0].padStart(2, '0') : '00';
    const m = parts[1] ? parts[1].padStart(2, '0') : '00';
    return `${h}:${m}`;
  };

  useEffect(() => {
    if (user) {
      loadMedications();
    }
  }, [user]);

  const loadMedications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('medication_reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedications(data || []);
    } catch (error: any) {
      console.error('Error loading medications:', error.message);
    }
  };

  const addMedication = async () => {
    if (!user || !newMed.name || !newMed.dosage) {
      toast({
        title: "Missing information",
        description: "Please fill in medication name and dosage",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('medication_reminders')
        .insert({
          user_id: user.id,
          medication_name: newMed.name,
          dosage: newMed.dosage,
          frequency: newMed.frequency,
          reminder_times: [newMed.time],
          start_date: new Date().toISOString(),
          notes: newMed.notes,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setMedications(prev => [data, ...prev]);
      setNewMed({ name: '', dosage: '', frequency: 'daily', time: '08:00', notes: '' });
      setShowAddForm(false);
      
      toast({
        title: "Medication added",
        description: "Your medication reminder has been saved",
      });
    } catch (error: any) {
      console.error('Error adding medication:', error.message);
      toast({
        title: "Error adding medication",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteMedication = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medication_reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMedications(prev => prev.filter(med => med.id !== id));
      
      toast({
        title: "Medication removed",
        description: "Your medication reminder has been deleted",
      });
    } catch (error: any) {
      console.error('Error deleting medication:', error.message);
      toast({
        title: "Error deleting medication",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getFrequencyDisplay = (frequency: string) => {
    const frequencies: { [key: string]: string } = {
      daily: 'Every day',
      twice_daily: 'Twice a day',
      three_times_daily: 'Three times a day',
      weekly: 'Once a week',
      as_needed: 'As needed'
    };
    return frequencies[frequency] || frequency;
  };

  useEffect(() => {
    if (!user || medications.length === 0) return;

    const runTick = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const current = `${hh}:${mm}`;
      const todayKey = now.toISOString().slice(0, 10);

      medications.forEach((med) => {
        if (!med.is_active || !Array.isArray(med.reminder_times)) return;
        med.reminder_times.forEach((t) => {
          if (normalizeTime(String(t).trim()) === current) {
            const key = `${med.id}-${t}`;
            if (notifiedMapRef.current[key] !== todayKey) {
              toast({
                title: 'Medication Reminder',
                description: `${med.medication_name} — ${med.dosage || ''} at ${t}`.trim(),
              });
              playBeep();

              if (typeof window !== 'undefined' && 'Notification' in window) {
                if (Notification.permission === 'granted') {
                  new Notification('Medication Reminder', {
                    body: `${med.medication_name} — ${med.dosage || ''} at ${t}`.trim(),
                  });
                } else if (Notification.permission === 'default') {
                  Notification.requestPermission().then((perm) => {
                    if (perm === 'granted') {
                      new Notification('Medication Reminder', {
                        body: `${med.medication_name} — ${med.dosage || ''} at ${t}`.trim(),
                      });
                    }
                  });
                }
              }

              setNotifiedMap((prev) => ({ ...prev, [key]: todayKey }));
            }
          }
        });
      });
    };

    // Align first run to the start of the next minute to avoid missing exact times
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    const startTimeout = setTimeout(() => {
      runTick();
      const interval = setInterval(runTick, 60_000);
      (window as any).__medReminderInterval = interval;
    }, Math.max(0, msUntilNextMinute));

    // Also run once immediately in case the app opened exactly at the target minute
    runTick();

    return () => {
      clearTimeout(startTimeout);
      const interval = (window as any).__medReminderInterval as number | undefined;
      if (interval) clearInterval(interval);
    };
  }, [user, medications]);

  // Proactively request notification permission once on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        // Fire and forget; user can still deny
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please sign in to track your medications</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          Medication Tracker
        </CardTitle>
        <CardDescription>
          Keep track of your medications and set reminders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            id="enable-sound"
            type="checkbox"
            checked={enableSound}
            onChange={(e) => setEnableSound(e.target.checked)}
          />
          <Label htmlFor="enable-sound">Enable sound alarm</Label>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Medication
          </Button>
        )}

        {showAddForm && (
          <Card className="border-2 border-dashed">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="med-name">Medication Name</Label>
                  <Input
                    id="med-name"
                    placeholder="e.g., Aspirin"
                    value={newMed.name}
                    onChange={(e) => setNewMed(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="med-dosage">Dosage</Label>
                  <Input
                    id="med-dosage"
                    placeholder="e.g., 500mg"
                    value={newMed.dosage}
                    onChange={(e) => setNewMed(prev => ({ ...prev, dosage: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="med-frequency">Frequency</Label>
                  <Select value={newMed.frequency} onValueChange={(value) => setNewMed(prev => ({ ...prev, frequency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="twice_daily">Twice Daily</SelectItem>
                      <SelectItem value="three_times_daily">Three Times Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="as_needed">As Needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="med-time">Time</Label>
                  <Input
                    id="med-time"
                    type="time"
                    value={newMed.time}
                    onChange={(e) => setNewMed(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="med-notes">Notes (Optional)</Label>
                <Input
                  id="med-notes"
                  placeholder="Additional instructions or notes"
                  value={newMed.notes}
                  onChange={(e) => setNewMed(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={addMedication} className="flex-1">
                  Add Medication
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {medications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No medications added yet</p>
              <p className="text-sm">Add your first medication to get started</p>
            </div>
          ) : (
            medications.map((med) => (
              <Card key={med.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{med.medication_name}</h4>
                      <p className="text-muted-foreground">{med.dosage}</p>
                      <div className="flex items-center gap-4 mt-2">
                        {Array.isArray(med.reminder_times) && med.reminder_times.length > 0 ? (
                          med.reminder_times.map((rt) => (
                            <Badge key={rt} variant="secondary" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {rt}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Not set
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {getFrequencyDisplay(med.frequency)}
                        </Badge>
                      </div>
                      {med.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{med.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMedication(med.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicationTracker;