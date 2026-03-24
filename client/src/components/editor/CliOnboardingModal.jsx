import React from 'react';
import { Terminal, Copy, X, MonitorPlay } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CliOnboardingModal({ isOpen, onClose, projectId }) {
  if (!isOpen) return null;

  const pullCommand = `stackforge-ai-cli pull ${projectId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pullCommand);
    alert('Copied to clipboard!');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white transition rounded-full hover:bg-zinc-800"
          >
            <X size={20} />
          </button>

          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <MonitorPlay className="text-blue-500" size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Run Locally</h2>
                <p className="text-zinc-400">Bridge your browser IDE to your local machine instantly.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-3">1. Open your terminal</h3>
                <p className="text-sm text-zinc-500 mb-4">
                  Navigate to an empty folder where you want this project to live.
                </p>
                <div className="flex bg-black border border-zinc-800 rounded-lg p-1 items-center">
                  <div className="flex-1 font-mono text-sm text-blue-400 p-4 overflow-x-auto whitespace-nowrap">
                    $ {pullCommand}
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="p-3 mx-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition flex items-center gap-2 group"
                  >
                    <Copy size={16} className="text-zinc-400 group-hover:text-white" />
                    <span className="text-sm font-medium">Copy</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-3">2. Automatic Setup</h3>
                <div className="bg-zinc-800/50 rounded-lg p-5 border border-zinc-800/50 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-zinc-300">
                    <Terminal size={16} className="text-green-400" />
                    <span>Downloads full physical file structure</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-zinc-300">
                    <Terminal size={16} className="text-green-400" />
                    <span>Runs <code className="bg-black px-1.5 py-0.5 rounded text-blue-300">npm install</code> and starts Dev server</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-zinc-300">
                    <Terminal size={16} className="text-green-400" />
                    <span>Establishes realtime WebSocket tunnel for Live AI Syncing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
