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
    
    const width = Math.max(canvas.width, window.innerWidth, 800);
    const height = Math.max(canvas.height, window.innerHeight, 600);
    
    try {
      stateRef.current = createColony(width, height);
    } catch (e) {
      console.error('Error creating colony:', e);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const width = window.innerWidth || 800;
      const height = window.innerHeight || 600;
      
      canvas.width = width;
      canvas.height = height;
      
      if (!stateRef.current) {
        initColony();
      } else {
        try {
          stateRef.current = createColony(width, height);
        } catch (e) {
          console.error('Error recreating colony:', e);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context');
      return;
    }

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
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        borderRadius: '12px',
        padding: '16px',
        color: 'white',
        border: '1px solid rgba(146, 64, 14, 0.3)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        minWidth: '200px'
      }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fcd34d', marginBottom: '12px' }}>
          ⚙️ Управление
        </h2>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            onClick={handlePause}
            style={{
              padding: '6px 12px',
              background: '#b45309',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {isPaused ? '▶ Играть' : '⏸ Пауза'}
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '6px 12px',
              background: '#065f46',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            🔄 Сброс
          </button>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#d1d5db', display: 'block', marginBottom: '4px' }}>
            Скорость: ×{speed}
          </label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.5"
            value={speed}
            onChange={(e) => handleSpeed(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ fontSize: '11px', color: '#d1d5db', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ color: '#fde68a', fontWeight: '500', marginBottom: '6px' }}>Обитатели:</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#78350f', border: '1px solid #d97706', display: 'inline-block' }}></span>
            <span>Матка (1)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#1f2937', border: '1px solid #6b7280', display: 'inline-block' }}></span>
            <span>Фуражиры (18)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#451a03', border: '1px solid #b45309', display: 'inline-block' }}></span>
            <span>Няньки (12)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#292524', border: '1px solid #78716c', display: 'inline-block' }}></span>
            <span>Свита матки (6)</span>
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        borderRadius: '12px',
        padding: '16px',
        color: 'white',
        border: '1px solid rgba(146, 64, 14, 0.3)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fbbf24' }}>{stats.ants}</div>
            <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>Муравьёв</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80' }}>{stats.food}</div>
            <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>Собрано</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fde047' }}>{stats.storage}</div>
            <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>В хранилище</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fdba74' }}>{stats.pupae}</div>
            <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>Куколок</div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', top: '16px', left: '16px', color: 'white', pointerEvents: 'none' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fde68a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🐜</span> Муравейник
        </h1>
        <p style={{ fontSize: '12px', color: 'rgba(209, 213, 219, 0.8)', marginTop: '4px', marginLeft: '32px' }}>
          Симуляция муравьиной колонии в реальном времени
        </p>
      </div>
    </div>
  );
}

export default App;
