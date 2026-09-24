import { useEffect, useRef, useState, useCallback } from 'react';
import { createColony, updateColony, renderColony, ColonyState } from './colony';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<ColonyState | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [stats, setStats] = useState({ ants: 0, food: 0, storage: 0, pupae: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const isPausedRef = useRef(false);
  const speedRef = useRef(1);

  const initColony = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width;
    const height = canvas.height;
    stateRef.current = createColony(width, height);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (!stateRef.current) {
        initColony();
      } else {
        // Recreate colony on resize for proper positioning
        stateRef.current = createColony(canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let statsCounter = 0;

    const animate = (time: number) => {
      if (!stateRef.current) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const dt = lastTimeRef.current ? Math.min(time - lastTimeRef.current, 50) : 16;
      lastTimeRef.current = time;

      if (!isPausedRef.current) {
        updateColony(stateRef.current, dt * speedRef.current);
      }

      renderColony(ctx, stateRef.current, time);

      // Update stats every ~500ms
      statsCounter += dt;
      if (statsCounter > 500) {
        statsCounter = 0;
        setStats({
          ants: stateRef.current.ants.length,
          food: stateRef.current.foodCollected,
          storage: Math.floor(stateRef.current.foodInStorage),
          pupae: stateRef.current.pupae.length,
        });
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [initColony]);

  const handlePause = () => {
    setIsPaused(prev => {
      isPausedRef.current = !prev;
      return !prev;
    });
  };

  const handleSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    speedRef.current = newSpeed;
  };

  const handleReset = () => {
    initColony();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
      
      {/* Control Panel */}
      <div className="absolute top-4 right-4 bg-black/75 backdrop-blur-sm rounded-xl p-4 text-white space-y-3 border border-amber-900/30 shadow-xl">
        <h2 className="text-sm font-bold text-amber-300 tracking-wide flex items-center gap-2">
          <span>⚙️</span> Управление
        </h2>
        
        <div className="flex gap-2">
          <button
            onClick={handlePause}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 active:bg-amber-800 rounded-lg text-xs font-medium transition-colors shadow-md"
          >
            {isPaused ? '▶ Играть' : '⏸ Пауза'}
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 rounded-lg text-xs font-medium transition-colors shadow-md"
          >
            🔄 Новая колония
          </button>
        </div>

        <div>
          <label className="text-xs text-gray-300 block mb-1">Скорость: ×{speed}</label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.5"
            value={speed}
            onChange={(e) => handleSpeed(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="text-xs text-gray-300 space-y-1.5 pt-2 border-t border-white/10">
          <p className="text-amber-200/80 font-medium text-[11px]">Обитатели:</p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-900 border border-amber-600 inline-block"></span>
            <span>Матка (1)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-800 border border-gray-500 inline-block"></span>
            <span>Фуражиры (18)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-950 border border-amber-700 inline-block"></span>
            <span>Няньки (12)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-stone-800 border border-stone-500 inline-block"></span>
            <span>Свита матки (6)</span>
          </div>
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-sm rounded-xl p-4 text-white border border-amber-900/30 shadow-xl">
        <div className="grid grid-cols-4 gap-5 text-center">
          <div>
            <div className="text-2xl font-bold text-amber-400">{stats.ants}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Муравьёв</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{stats.food}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Собрано</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-300">{stats.storage}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">В хранилище</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-300">{stats.pupae}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Куколок</div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="absolute top-4 left-4 text-white pointer-events-none">
        <h1 className="text-xl font-bold text-amber-200 drop-shadow-lg flex items-center gap-2">
          <span className="text-2xl">🐜</span> Муравейник
        </h1>
        <p className="text-xs text-gray-300/80 mt-1 ml-8">Симуляция муравьиной колонии в реальном времени</p>
      </div>
    </div>
  );
}

export default App;
