"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { X, Info } from "lucide-react";

type HelpContextType = {
  isHelpActive: boolean;
  toggleHelp: () => void;
  activePopover: string | null;
  setActivePopover: (id: string | null) => void;
};

const HelpContext = createContext<HelpContextType>({
  isHelpActive: false,
  toggleHelp: () => {},
  activePopover: null,
  setActivePopover: () => {},
});

export function HelpProvider({ children }: { children: ReactNode }) {
  const [isHelpActive, setIsHelpActive] = useState(false);
  const [activePopover, setActivePopover] = useState<string | null>(null);

  return (
    <HelpContext.Provider value={{ isHelpActive, toggleHelp: () => setIsHelpActive(!isHelpActive), activePopover, setActivePopover }}>
      {children}
      {isHelpActive && (
        <div className="fixed bottom-6 right-6 z-[9999] shadow-2xl overflow-hidden glass-panel border border-cyan-500/30 rounded-2xl bg-zinc-950/90 backdrop-blur-md p-4 max-w-sm flex items-start gap-4 animate-in slide-in-from-bottom-5">
          <div className="bg-cyan-500/20 p-2 rounded-full border border-cyan-500/30">
            <Info className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white">Help Mode Active</h4>
            <p className="text-xs text-zinc-400 mt-1">Hover over any dashed outline to discover how this interface works.</p>
          </div>
          <button onClick={() => setIsHelpActive(false)} className="text-zinc-500 hover:text-white">
             <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  return useContext(HelpContext);
}

export function WithHelp({ id, children, text, inline = false }: { id: string, children: ReactNode, text: string, inline?: boolean }) {
  const { isHelpActive, activePopover, setActivePopover } = useHelp();

  if (!isHelpActive) return <>{children}</>;

  const isActive = activePopover === id;
  const Wrapper = inline ? "span" : "div";

  return (
    <Wrapper 
      className="relative ring-2 ring-dashed ring-cyan-500/50 rounded-lg bg-cyan-500/5 hover:ring-cyan-400 hover:bg-cyan-500/10 transition-all z-[9] inline-block"
      onMouseEnter={() => setActivePopover(id)}
      onMouseLeave={() => setActivePopover(null)}
    >
      {children}
      {isActive && (
        <div className="absolute z-[999] top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-zinc-900 border border-zinc-700 shadow-xl rounded-xl animate-in fade-in zoom-in-95 pointer-events-none">
          <div className="text-xs text-white leading-relaxed">{text}</div>
          <div className="absolute -top-[15px] left-1/2 -translate-x-1/2 border-[8px] border-transparent border-b-zinc-700" />
          <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 border-[8px] border-transparent border-b-zinc-900" />
        </div>
      )}
    </Wrapper>
  );
}
