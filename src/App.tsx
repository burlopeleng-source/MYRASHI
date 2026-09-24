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
  const [error, setError] = useState<string | null>(null);
  const isPausedRef = useRef(false);
  const speedRef = useRef(1);

  const initColony = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      const width = Math.max(canvas.width || window.innerWidth, 800);
      const height = Math.max(canvas.height || window.innerHeight, 600);
      stateRef.current = createColony(width, height);
      setError(null);
    } catch (e) {
      console.error('Error creating colony:', e);
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setError('Canvas element not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Could not get 2D context');
      return;
    }

    const resizeCanvas = () => {
      const width = window.innerWidth || 800;
      const height = window.innerHeight || 600;
      
      canvas.width = width;
      canvas.height = height;
      
      try {
        stateRef.current = createColony(width, height);
        setError(null);
      } catch (e) {
        console.error('Error recreating colony:', e);
        setError(e instanceof Error ? e.message : 'Unknown error');
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let statsCounter = 0;

    const animate = (time: number) => {
      try {
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
      } catch (e) {
        console.error('Animation error:', e);
        setError(e instanceof Error ? e.message : 'Animation error');
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

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

  if (error) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Ошибка</h1>
          <p style={{ color: '#f87171' }}>{error}</p>
          <button onClick={handleReset} className="btn btn-reset" style={{ marginTop: '20px' }}>
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <canvas ref={canvasRef} className="canvas" />
      
      <div className="panel control-panel">
        <h2 className="panel-title">⚙️ Управление</h2>
        
        <div className="btn-row">
          <button onClick={handlePause} className="btn btn-pause">
            {isPaused ? '▶ Играть' : '⏸ Пауза'}
          </button>
          <button onClick={handleReset} className="btn btn-reset">
            🔄 Сброс
          </button>
        </div>

        <div>
          <label className="speed-label">Скорость: ×{speed}</label>
          <input
            type="range"
            className="speed-slider"
            min="0.5"
            max="3"
            step="0.5"
            value={speed}
            onChange={(e) => handleSpeed(parseFloat(e.target.value))}
          />
        </div>

        <div className="legend">
          <p className="legend-title">Обитатели:</p>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#78350f', border: '1px solid #d97706' }}></span>
            <span>Матка (1)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#1f2937', border: '1px solid #6b7280' }}></span>
            <span>Фуражиры (18)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#451a03', border: '1px solid #b45309' }}></span>
            <span>Няньки (12)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#292524', border: '1px solid #78716c' }}></span>
            <span>Свита матки (6)</span>
          </div>
        </div>
      </div>

      <div className="panel stats-panel">
        <div className="stats-grid">
          <div>
            <div className="stat-value" style={{ color: '#fbbf24' }}>{stats.ants}</div>
            <div className="stat-label">Муравьёв</div>
          </div>
          <div>
            <div className="stat-value" style={{ color: '#4ade80' }}>{stats.food}</div>
            <div className="stat-label">Собрано</div>
          </div>
          <div>
            <div className="stat-value" style={{ color: '#fde047' }}>{stats.storage}</div>
            <div className="stat-label">В хранилище</div>
          </div>
          <div>
            <div className="stat-value" style={{ color: '#fdba74' }}>{stats.pupae}</div>
            <div className="stat-label">Куколок</div>
          </div>
        </div>
      </div>

      <div className="panel title-panel">
        <h1 className="title-text">
          <span className="title-emoji">🐜</span> Муравейник
        </h1>
        <p className="subtitle">Симуляция муравьиной колонии в реальном времени</p>
      </div>
    </div>
  );
}

export default App;
