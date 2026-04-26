'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, CheckCircle, AlertCircle, ChevronDown, Navigation } from 'lucide-react';

const schema = z.object({
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  location: z.string().min(2, 'Location is required'),
  contact: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const categories = ['Water Leakage', 'Pipe Burst', 'Flooding', 'Gas Leak', 'Pressure Drop', 'Service Interruption', 'Structural Damage', 'Other'];
const predefinedLocations = ['Bengaluru Ward 71', 'Bengaluru Ward 72', 'K-100 Waterway', 'Sector 7 Mainline', 'Zone A', 'Zone B'];
const priorities = ['Low', 'Medium', 'High', 'Critical'] as const;
const priorityColors = { Low: 'text-emerald-400', Medium: 'text-amber-400', High: 'text-orange-400', Critical: 'text-red-400' };

export default function ComplaintsPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState('');

  // New State for GPS
  const [isLocating, setIsLocating] = useState(false);
  const [dynamicGpsLocation, setDynamicGpsLocation] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'Low' },
  });

  // New GPS Function
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();

          const shortAddress = data.address?.suburb || data.address?.neighbourhood || data.address?.city || 'Unknown Area';
          const finalLocation = `${shortAddress} (Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)})`;

          setDynamicGpsLocation(finalLocation);
          setValue('location', finalLocation, { shouldValidate: true });
        } catch (err) {
          const rawLocation = `Lat: ${position.coords.latitude.toFixed(5)}, Lng: ${position.coords.longitude.toFixed(5)}`;
          setDynamicGpsLocation(rawLocation);
          setValue('location', rawLocation, { shouldValidate: true });
        } finally {
          setIsLocating(false);
        }
      },
      (geoError) => {
        setError("Unable to access GPS. Please check your browser permissions.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError('');
    const { data: session } = await supabase.auth.getSession();

    const { data: result, error: err } = await supabase.from('complaints').insert({
      user_id: session.session?.user.id || null,
      category: data.category,
      description: data.description,
      priority: data.priority,
      location: data.location, // Added this so it saves to Supabase!
      status: 'Open',
    }).select('id').single();

    if (err) {
      setError(err.message);
    } else {
      setSubmitted(result?.id || 'submitted');
      reset();
      setDynamicGpsLocation(null);
    }
    setSubmitting(false);
  };

  if (submitted) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-md glass rounded-3xl border border-slate-700/50 p-10">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 mb-6">
          <CheckCircle className="h-9 w-9 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Complaint Submitted!</h2>
        <p className="text-slate-400 text-sm mb-2">Ticket ID: <span className="font-mono text-sky-400 text-xs">{submitted}</span></p>
        <p className="text-slate-500 text-sm mb-8">Our operations team will address your complaint shortly.</p>
        <Button onClick={() => setSubmitted(null)}>Submit Another</Button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
              <MessageSquare className="h-5 w-5 text-sky-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-sky-400">Citizen Portal</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Report an Issue</h1>
          <p className="text-slate-400">Submit infrastructure complaints for immediate operational response.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="glass rounded-3xl border border-slate-700/50 p-8 space-y-6">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Issue Category *</label>
            <div className="relative">
              <select {...register('category')}
                className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800/60 px-4 text-sm text-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500">
                <option value="">Select a category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>
            {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category.message}</p>}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Priority Level *</label>
            <div className="grid grid-cols-4 gap-2">
              {priorities.map(p => (
                <label key={p} className="cursor-pointer">
                  <input type="radio" value={p} {...register('priority')} className="sr-only peer" />
                  <div className={`p-2 text-center text-xs font-semibold rounded-lg border transition-all peer-checked:bg-sky-500/20 peer-checked:border-sky-500/50 border-slate-700 hover:border-slate-500 ${priorityColors[p]}`}>
                    {p}
                  </div>
                </label>
              ))}
            </div>
            {errors.priority && <p className="text-red-400 text-xs mt-1">{errors.priority.message}</p>}
          </div>

          {/* NEW: Location Dropdown + GPS Button */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Location *</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select {...register('location')} className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800/60 px-4 text-sm text-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option value="">Select Predefined Zone</option>
                  {predefinedLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  {dynamicGpsLocation && <option value={dynamicGpsLocation}>📍 {dynamicGpsLocation}</option>}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="h-10 bg-slate-800/60 border-slate-700 hover:bg-slate-700 hover:text-sky-400 shrink-0"
              >
                <Navigation className={`h-4 w-4 mr-2 ${isLocating ? 'animate-pulse text-sky-400' : ''}`} />
                {isLocating ? 'Locating...' : 'Use GPS'}
              </Button>
            </div>
            {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Description *</label>
            <textarea {...register('description')} rows={4} placeholder="Describe the issue in detail..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
            {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
          </div>

          {/* Contact */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Contact (Optional)</label>
            <Input type="tel" placeholder="+91 98765 43210" {...register('contact')} />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Complaint →'}
          </Button>
        </form>
      </div>
    </div>
  );
}
