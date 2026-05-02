import React, { useState } from 'react';
import { useStore } from '../store.js';

export default function HostMode() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    partyName: '',
    genre: '',
    description: '',
  });

  const setShowHostMode = useStore((state) => state.setShowHostMode);
  const setNotification = useStore((state) => state.setNotification);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handlePublish();
    }
  };

  const handlePublish = () => {
    setNotification('🎉 Pop-up published! Waiting for 3 pulses to go live...', 'success');
    setShowHostMode(false);
    setStep(1);
  };

  const genres = [
    '🎵 Hip-Hop',
    '🎸 House',
    '🎹 Amapiano',
    '🔊 Techno',
    '🎤 Reggae',
    '🎧 Afrobeats',
    '💿 EDM',
    '🎼 Chill',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
      <div className="glassmorphism rounded-2xl w-[90%] max-w-md p-6 relative shadow-2xl border border-neon-pink/30">
        <button
          onClick={() => {
            setShowHostMode(false);
            setStep(1);
          }}
          className="absolute top-4 right-4 text-dark-400 hover:text-dark-50 transition-colors text-xl"
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-neon-pink mb-1">Host Mode</h2>
        <p className="text-xs text-dark-500 mb-6">Step {step}/3 - Create a pop-up party</p>

        {/* Step Indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${
                s <= step ? 'bg-gradient-to-r from-neon-pink to-neon-red' : 'bg-dark-700'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Drop the Pin */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-neon-cyan">Step 1: Drop the Pin</h3>
            <p className="text-sm text-dark-400">Tap on the map to mark your party location</p>

            <div className="bg-dark-900/50 border-2 border-dashed border-neon-cyan/40 rounded-xl p-8 flex flex-col items-center justify-center h-32">
              <span className="text-3xl mb-2">📍</span>
              <p className="text-xs text-dark-500 text-center">Nairobi, Kenya</p>
              <p className="text-xs text-dark-600 mt-1">(Westlands)</p>
            </div>

            <p className="text-xs text-dark-500 text-center italic">
              Location will be set from your current map position
            </p>
          </div>
        )}

        {/* Step 2: Party Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-neon-cyan">Step 2: Party Details</h3>

            <div>
              <label className="text-xs text-dark-400 font-semibold mb-2 block">Party Name</label>
              <input
                type="text"
                placeholder="e.g., Midnight Raves, Underground Beats"
                value={formData.partyName}
                onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                className="w-full bg-dark-900/40 border border-neon-cyan/30 rounded-lg px-4 py-2 text-dark-50 placeholder-dark-500 focus:outline-none focus:border-neon-cyan/60 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-dark-400 font-semibold mb-2 block">Vibe/Genre</label>
              <div className="grid grid-cols-2 gap-2">
                {genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setFormData({ ...formData, genre })}
                    className={`text-xs p-2 rounded-lg border transition-all ${
                      formData.genre === genre
                        ? 'bg-neon-pink/20 border-neon-pink/60 text-neon-pink'
                        : 'bg-dark-900/40 border-dark-700 text-dark-400 hover:border-neon-pink/40'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Description & Verify */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-neon-cyan">Step 3: Confirm & Publish</h3>

            <div>
              <label className="text-xs text-dark-400 font-semibold mb-2 block">Description</label>
              <textarea
                placeholder="What's the vibe? Any dress code or entry requirements?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-dark-900/40 border border-neon-cyan/30 rounded-lg px-4 py-2 text-dark-50 placeholder-dark-500 focus:outline-none focus:border-neon-cyan/60 transition-colors text-sm resize-none h-20"
              />
            </div>

            {/* Spam Prevention Warning */}
            <div className="bg-neon-pink/10 border border-neon-pink/40 rounded-lg p-3">
              <p className="text-xs text-neon-pink flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>
                  <strong>Verification Required:</strong> Your pin will only go public once 3 other devices pulse here. This prevents spam.
                </span>
              </p>
            </div>

            {/* Summary */}
            <div className="bg-dark-900/50 border border-dark-700 rounded-lg p-3 space-y-1">
              <p className="text-xs text-dark-400">
                <strong>Party:</strong> <span className="text-dark-200">{formData.partyName || 'Unnamed'}</span>
              </p>
              <p className="text-xs text-dark-400">
                <strong>Genre:</strong> <span className="text-dark-200">{formData.genre || 'Not selected'}</span>
              </p>
              <p className="text-xs text-dark-400">
                <strong>Location:</strong> <span className="text-dark-200">Westlands, Nairobi</span>
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : setShowHostMode(false))}
            className="flex-1 px-4 py-2 border border-dark-600 rounded-lg text-dark-300 hover:border-dark-500 hover:text-dark-100 transition-colors text-sm font-semibold"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={handleNext}
            disabled={
              (step === 2 && (!formData.partyName || !formData.genre)) ||
              (step === 3 && !formData.description)
            }
            className="flex-1 px-4 py-2 bg-gradient-to-br from-neon-pink to-neon-red text-white rounded-lg hover:shadow-lg hover:shadow-neon-pink/50 transition-all duration-200 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 3 ? '🚀 Publish' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
