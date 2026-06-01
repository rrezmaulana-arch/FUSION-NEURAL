import React, { useEffect, useRef, useState } from 'react';
import { loadPixelOfficeAssets } from '../assets/browserAssetLoader';
import { startGameLoop } from '../engine/gameLoop';
import { OfficeState } from '../engine/officeState';
import { renderFrame } from '../engine/renderer';
import { TILE_SIZE } from '../constants';

// We map agent string IDs to integer IDs for the pixel-agents engine.
const AGENT_ID_MAP: Record<string, number> = {
  // admin (OPS Admin)
  'admin': 0, 'cohere': 0, 'openrouter': 1, 'admin_1': 0, 'admin_2': 1,
  
  // manager (Manager CMD)
  'manager': 2, 'gemini': 2, 'mistral': 3, 'manager_1': 2, 'manager_2': 3,

  // marketing (Creative MKT)
  'marketing': 4, 'huggingface': 4, 'gemini imagen': 5, 'flux.1-schnell': 6, 'mkt_1': 4, 'mkt_2': 5, 'mkt_3': 6,

  // finance (Finance Vault)
  'finance': 7, 'deepseek': 7, 'fin_1': 7,

  // frontliner (Comms & Sales)
  'frontliner': 8, 'groq': 8, 'cerebras': 9, 'fl_1': 8, 'fl_2': 9,

  // core (Data Core)
  'core': 10, 'serper.dev': 10, 'core_1': 10,
};

export default function PixelOfficeCanvas({ activeAgents }: { activeAgents: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const officeStateRef = useRef<OfficeState | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize engine and load assets
  useEffect(() => {
    let cleanupLoop: (() => void) | undefined;
    let isCancelled = false;

    async function init() {
      try {
        await loadPixelOfficeAssets();
        if (isCancelled) return;
        // Add cache-buster to force the browser to load the latest layout JSON
        const res = await fetch('/assets/pixel-office/default-layout-1.json?t=' + Date.now());
        const layout = await res.json();
        
        if (isCancelled) return;

        const state = new OfficeState(layout);
        officeStateRef.current = state;

        // Add 11 agents so all seats are filled appropriately
        Array.from({ length: 11 }).forEach((_, i) => {
          state.addAgent(i, i % 6);
          state.setAgentActive(i, false); // wandering mode by default
        });

        if (canvasRef.current && !isCancelled) {
          cleanupLoop = startGameLoop(canvasRef.current, {
            update: (dt) => {
              state.update(dt);
            },
            render: (ctx) => {
              const canvas = canvasRef.current;
              if (!canvas) return;

              // Handle resize
              const container = containerRef.current;
              if (container) {
                const rect = container.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;
                if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
                  canvas.width = rect.width * dpr;
                  canvas.height = rect.height * dpr;
                  canvas.style.width = rect.width + 'px';
                  canvas.style.height = rect.height + 'px';
                }
              }

              const dpr = window.devicePixelRatio || 1;

              // Calculate zoom to fit the entire grid
              const zoomX = (canvas.width / dpr) / (layout.cols * TILE_SIZE);
              const zoomY = (canvas.height / dpr) / (layout.rows * TILE_SIZE);
              const zoom = Math.min(zoomX, zoomY) * dpr;

              // Center the entire map in the canvas (if canvas aspect ratio differs slightly)
              const mapRenderWidth = layout.cols * TILE_SIZE * zoom;
              const mapRenderHeight = layout.rows * TILE_SIZE * zoom;
              
              const panX = (canvas.width - mapRenderWidth) / 2;
              const panY = (canvas.height - mapRenderHeight) / 2;

              renderFrame(
                ctx,
                canvas.width,
                canvas.height,
                state.tileMap,
                state.furniture,
                state.getCharacters(),
                zoom,
                panX,
                panY,
                undefined,
                undefined,
                layout.tileColors,
                layout.cols,
                layout.rows
              );
            }
          });
        }
        setLoading(false);
      } catch (e) {
        console.error('Failed to init Pixel Office', e);
      }
    }

    init();

    return () => {
      isCancelled = true;
      if (cleanupLoop) cleanupLoop();
    };
  }, []);

  // Sync activeAgents from props to OfficeState
  // Use a stringified dependency to avoid triggering on every render if the array reference changes
  useEffect(() => {
    const state = officeStateRef.current;
    if (!state || loading) return;

    // Convert string array to number array using mapping
    const activeIds = new Set(
      activeAgents.map(a => AGENT_ID_MAP[a] ?? AGENT_ID_MAP[a.toLowerCase()] ?? -1).filter(id => id !== -1)
    );

    // Update active state for all 11 agents
    Array.from({ length: 11 }).forEach((_, i) => {
      state.setAgentActive(i, activeIds.has(i));
    });

  }, [JSON.stringify(activeAgents), loading]);

  return (
    <div ref={containerRef} style={{ width: '100%', aspectRatio: '44 / 26', maxHeight: '550px', background: '#0f172a', position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
      {loading && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontFamily: 'monospace' }}>
          LOADING NEURAL OFFICE...
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
