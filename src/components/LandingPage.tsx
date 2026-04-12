'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Factory,
  BarChart2,
  GitMerge,
  Layers,
  MapPin,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

const features = [
  {
    icon: Factory,
    title: 'Factory Planning',
    description:
      'Create and manage multiple factories. Add production lines, assign recipes and calculate exactly how many buildings you need.',
  },
  {
    icon: GitMerge,
    title: 'Dependency Tracking',
    description:
      'Automatically analyse missing ingredients and suggest import sources from other factories in your network.',
  },
  {
    icon: BarChart2,
    title: 'Visual Graph',
    description:
      'See the full supply chain as an interactive dependency graph. Spot bottlenecks at a glance.',
  },
  {
    icon: Layers,
    title: 'Flow Editor',
    description:
      'Build your factory network visually with a drag-and-drop flow canvas powered by React Flow.',
  },
  {
    icon: MapPin,
    title: 'Locations',
    description:
      'Group factories by location with custom colours and icons to keep large saves organised.',
  },
  {
    icon: ShieldCheck,
    title: 'Private & Secure',
    description:
      'Your data is yours. Sign in with Google or GitHub — every factory is private to your account.',
  },
];

export function LandingPage() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn(undefined, { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
        <div className="w-20 h-20 rounded-2xl bg-orange-500 flex items-center justify-center mb-8 shadow-lg shadow-orange-500/30">
          <Factory className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight mb-4 max-w-2xl leading-tight">
          Plan your{' '}
          <span className="text-orange-400">Satisfactory</span> factories
          <br />
          like a pro.
        </h1>

        <p className="text-slate-400 text-lg max-w-xl mb-10">
          A free factory planner for the game Satisfactory. Track production
          lines, manage supply chains between factories and visualise
          dependencies — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Button
            onClick={handleSignIn}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 text-base rounded-xl shadow-lg shadow-orange-500/20 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redirecting…
              </>
            ) : (
              'Get started — it\'s free'
            )}
          </Button>
          <span className="text-slate-500 text-sm">
            Sign in with Google or GitHub. No password needed.
          </span>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-center text-2xl font-bold text-slate-300 mb-10">
          Everything you need to run a perfect factory
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 hover:border-orange-500/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-slate-800 py-16 text-center px-6">
        <h2 className="text-3xl font-bold mb-4">Ready to start planning?</h2>
        <p className="text-slate-400 mb-8">
          Create your free account and start building in seconds.
        </p>
        <Button
          onClick={handleSignIn}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-10 py-3 text-base rounded-xl"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in to get started'}
        </Button>
      </section>
    </div>
  );
}
