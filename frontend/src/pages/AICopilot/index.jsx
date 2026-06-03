import React from 'react';
import { useLocation } from 'react-router-dom';
import AIChat from '../../components/AIChat';
import { Cpu, Terminal, Shield } from 'lucide-react';

const AICopilot = () => {
  const location = useLocation();
  // Read any query state passed by page redirections
  const initialQuery = location.state?.initialQuery || '';

  return (
    <div className="space-y-6 h-full flex flex-col justify-between">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-brand-primary" />
            AI Security Copilot Assistant
          </h1>
          <p className="text-xs text-gray-500 mt-1">Investigate incident logs, translate payload markers, and draft firewall rules with intelligence</p>
        </div>
      </div>

      {/* Main chat widget */}
      <div className="flex-1 max-w-4xl mx-auto w-full">
        <AIChat initialQuery={initialQuery} />
      </div>

      {/* Footer hint */}
      <div className="text-center text-[10px] text-gray-600 font-mono py-2">
        DefenderAI Core LLM Integration is configured to run locally or query Groq API completions securely.
      </div>
    </div>
  );
};

export default AICopilot;
