import React, { useState, useEffect } from 'react';
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
                         <Badge variant="secondary" className="flex items-center gap-1">
                           <Clock className="h-3 w-3" />
                           {med.reminder_times?.[0] || 'Not set'}
                         </Badge>
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