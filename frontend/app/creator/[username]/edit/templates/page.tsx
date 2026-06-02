'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface STEEZE {
  id: string;
  name: string;
  description: string;
  previewColor: string;
  previewGradient?: string;
}

const STEEZES: STEEZE[] = [
  {
    id: 'icon',
    name: 'ICON STEEZE',
    description: 'Luxury celebrity style with gold and black theme',
    previewColor: 'bg-gradient-to-r from-gold to-gold-dark',
    previewGradient: 'from-gold/20 to-black'
  },
  {
    id: 'rebel',
    name: 'REBEL STEEZE',
    description: 'Street/urban energy with red and black theme',
    previewColor: 'bg-red-600',
    previewGradient: 'from-red-600/20 to-black'
  },
  {
    id: 'diva',
    name: 'DIVA STEEZE',
    description: 'Glamour/feminine style with pink and cream theme',
    previewColor: 'bg-pink-500',
    previewGradient: 'from-pink-500/20 to-black'
  },
  {
    id: 'visionary',
    name: 'VISIONARY STEEZE',
    description: 'Cinematic/creative style with purple and gold theme',
    previewColor: 'bg-purple-600',
    previewGradient: 'from-purple-600/20 to-black'
  },
  {
    id: 'pure',
    name: 'PURE STEEZE',
    description: 'Minimalist clean style with white and black theme',
    previewColor: 'bg-white',
    previewGradient: 'from-white/10 to-black'
  },
  {
    id: 'spectrum',
    name: 'SPECTRUM STEEZE',
    description: 'Dynamic/colorful style with rainbow theme',
    previewColor: 'bg-gradient-to-r from-red-500 via-yellow-500 to-green-500',
    previewGradient: 'from-red-500/20 via-yellow-500/20 to-green-500/20'
  },
  {
    id: 'luminary',
    name: 'LUMINARY STEEZE',
    description: 'Editorial/premium style with navy and gold theme',
    previewColor: 'bg-slate-900',
    previewGradient: 'from-slate-900 to-black'
  }
];

export default function TemplatesPage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;
  
  const [currentSteeze, setCurrentSteeze] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch current user's STEEZE
  useEffect(() => {
    const fetchCurrentSteeze = async () => {
      try {
        const response = await fetch('/api/user/template');
        const data = await response.json();
        setCurrentSteeze(data.templateId || 'icon');
      } catch (error) {
        console.error('Failed to fetch current STEEZE:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentSteeze();
  }, []);

  const handleApplySteeze = async (steezeId: string) => {
    setUpdating(steezeId);
    setMessage(null);
    
    try {
      const response = await fetch('/api/user/template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: steezeId })
      });
      
      if (response.ok) {
        setCurrentSteeze(steezeId);
        setMessage({ type: 'success', text: `${STEEZES.find(s => s.id === steezeId)?.name} applied successfully! Your profile page will now use this STEEZE.` });
        // Refresh the page after 1 second to show the new STEEZE
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to apply STEEZE. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold text-xl">Loading YOURSTEEZE options...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4">YOURSTEEZE</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Choose your signature style. Your STEEZE is your energy. Your VIBES is what fans feel.
          </p>
        </div>

        {/* Current STEEZE indicator */}
        <div className="mb-8 text-center">
          <span className="inline-block px-4 py-2 bg-gold/10 border border-gold/30 rounded-full">
            <span className="text-gold">Current STEEZE:</span>{' '}
            <span className="text-white font-bold">{STEEZES.find(s => s.id === currentSteeze)?.name || 'ICON STEEZE'}</span>
          </span>
        </div>

        {/* Message display */}
        {message && (
          <div className={`mb-8 p-4 rounded-lg text-center ${
            message.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* STEEZE Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STEEZES.map((steeze) => {
            const isCurrent = currentSteeze === steeze.id;
            const isUpdating = updating === steeze.id;
            
            return (
              <div
                key={steeze.id}
                className={`bg-gray-900 rounded-xl overflow-hidden border transition-all duration-300 ${
                  isCurrent 
                    ? 'border-gold shadow-lg shadow-gold/20' 
                    : 'border-gray-800 hover:border-gold/50'
                }`}
              >
                {/* Preview */}
                <div className={`h-32 ${steeze.previewColor} relative overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${steeze.previewGradient}`} />
                  <div className="absolute bottom-3 right-3 text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">
                    YOURSTEEZE
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{steeze.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{steeze.description}</p>
                  
                  {/* Apply Button */}
                  <button
                    onClick={() => handleApplySteeze(steeze.id)}
                    disabled={isCurrent || isUpdating}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                      isCurrent
                        ? 'bg-gold/20 text-gold cursor-default'
                        : isUpdating
                        ? 'bg-gray-700 text-gray-400 cursor-wait'
                        : 'bg-gold hover:bg-gold-dark text-black hover:scale-105'
                    }`}
                  >
                    {isCurrent ? '✓ CURRENT STEEZE' : isUpdating ? 'APPLYING...' : 'APPLY STEEZE'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Your STEEZE determines how your profile page looks to your fans.</p>
          <p className="mt-1">Your VIBES is what they feel. Choose wisely.</p>
        </div>
      </div>
    </div>
  );
}