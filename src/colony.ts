// Colony simulation logic

export interface Point {
  x: number;
  y: number;
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'queen' | 'nursery' | 'food' | 'entrance' | 'waste';
  label: string;
}

export interface Tunnel {
  from: Point;
  to: Point;
  width: number;
}

export interface Ant {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  role: 'forager' | 'nurse' | 'attendant' | 'queen';
  carrying: 'food' | 'pupa' | 'none';
  destination: 'food_source' | 'storage' | 'nursery' | 'queen_chamber' | 'wander' | 'none';
  speed: number;
  state: 'moving' | 'working' | 'idle';
  workTimer: number;
  workDuration: number;
  size: number;
  angle: number;
  targetAngle: number;
  legPhase: number;
  wanderTimer: number;
}

export interface FoodSource {
  x: number;
  y: number;
  amount: number;
  maxAmount: number;
  type: 'leaf' | 'sugar' | 'insect';
}

export interface Pupa {
  x: number;
  y: number;
  size: number;
  wiggle: number;
  roomIdx: number;
}

export interface ColonyState {
  rooms: Room[];
  tunnels: Tunnel[];
  ants: Ant[];
  foodSources: FoodSource[];
  pupae: Pupa[];
  width: number;
  height: number;
  surfaceY: number;
  foodCollected: number;
  foodInStorage: number;
  time: number;
}

export function createColony(width: number, height: number): ColonyState {
  const surfaceY = height * 0.2;
  
  const rooms: Room[] = [
    // Queen chamber - deepest and largest
    { x: width * 0.5, y: height * 0.82, width: 150, height: 95, type: 'queen', label: 'Камера матки' },
    // Main nursery
    { x: width * 0.25, y: height * 0.6, width: 120, height: 75, type: 'nursery', label: 'Питомник' },
    // Food storage lower
    { x: width * 0.75, y: height * 0.6, width: 120, height: 75, type: 'food', label: 'Хранилище' },
    // Upper nursery
    { x: width * 0.33, y: height * 0.42, width: 100, height: 65, type: 'nursery', label: 'Ясли' },
    // Upper food storage
    { x: width * 0.67, y: height * 0.42, width: 100, height: 65, type: 'food', label: 'Кладовая' },
    // Entrance chamber
    { x: width * 0.5, y: surfaceY + 50, width: 90, height: 55, type: 'entrance', label: 'Вход' },
    // Waste chamber
    { x: width * 0.15, y: height * 0.75, width: 75, height: 55, type: 'waste', label: 'Свалка' },
    // Secondary entrance
    { x: width * 0.82, y: surfaceY + 45, width: 70, height: 45, type: 'entrance', label: 'Выход' },
  ];

  const tunnels: Tunnel[] = [
    // Main vertical shaft from entrance to queen
    { from: { x: width * 0.5, y: surfaceY + 20 }, to: { x: width * 0.5, y: height * 0.82 }, width: 16 },
    // Entrance to upper left (nursery)
    { from: { x: width * 0.5, y: surfaceY + 50 }, to: { x: width * 0.33, y: height * 0.42 }, width: 14 },
    // Entrance to upper right (food)
    { from: { x: width * 0.5, y: surfaceY + 50 }, to: { x: width * 0.67, y: height * 0.42 }, width: 14 },
    // Upper nursery to lower nursery
    { from: { x: width * 0.33, y: height * 0.42 }, to: { x: width * 0.25, y: height * 0.6 }, width: 13 },
    // Upper food to lower food
    { from: { x: width * 0.67, y: height * 0.42 }, to: { x: width * 0.75, y: height * 0.6 }, width: 13 },
    // Lower nursery to queen
    { from: { x: width * 0.25, y: height * 0.6 }, to: { x: width * 0.5, y: height * 0.82 }, width: 14 },
    // Lower food to queen
    { from: { x: width * 0.75, y: height * 0.6 }, to: { x: width * 0.5, y: height * 0.82 }, width: 14 },
    // Waste chamber connection
    { from: { x: width * 0.25, y: height * 0.6 }, to: { x: width * 0.15, y: height * 0.75 }, width: 10 },
    // Cross tunnel upper
    { from: { x: width * 0.33, y: height * 0.42 }, to: { x: width * 0.67, y: height * 0.42 }, width: 11 },
    // Cross tunnel lower
    { from: { x: width * 0.25, y: height * 0.6 }, to: { x: width * 0.75, y: height * 0.6 }, width: 11 },
    // Secondary exit tunnel
    { from: { x: width * 0.75, y: height * 0.6 }, to: { x: width * 0.82, y: surfaceY + 45 }, width: 12 },
    // Side branch
    { from: { x: width * 0.5, y: height * 0.55 }, to: { x: width * 0.38, y: height * 0.65 }, width: 9 },
    // Another branch
    { from: { x: width * 0.5, y: height * 0.55 }, to: { x: width * 0.62, y: height * 0.65 }, width: 9 },
  ];

  const foodSources: FoodSource[] = [
    { x: width * 0.3, y: surfaceY - 35, amount: 100, maxAmount: 100, type: 'leaf' },
    { x: width * 0.7, y: surfaceY - 30, amount: 80, maxAmount: 80, type: 'sugar' },
    { x: width * 0.88, y: surfaceY - 20, amount: 60, maxAmount: 60, type: 'insect' },
    { x: width * 0.15, y: surfaceY - 25, amount: 70, maxAmount: 70, type: 'leaf' },
  ];

  const pupae: Pupa[] = [];
  // Pupae in main nursery
  for (let i = 0; i < 15; i++) {
    pupae.push({
      x: rooms[1].x + (Math.random() - 0.5) * rooms[1].width * 0.65,
      y: rooms[1].y + (Math.random() - 0.5) * rooms[1].height * 0.45,
      size: 4 + Math.random() * 3,
      wiggle: Math.random() * Math.PI * 2,
      roomIdx: 1,
    });
  }
  // Pupae in upper nursery
  for (let i = 0; i < 10; i++) {
    pupae.push({
      x: rooms[3].x + (Math.random() - 0.5) * rooms[3].width * 0.65,
      y: rooms[3].y + (Math.random() - 0.5) * rooms[3].height * 0.45,
      size: 3 + Math.random() * 2.5,
      wiggle: Math.random() * Math.PI * 2,
      roomIdx: 3,
    });
  }

  const ants: Ant[] = [];
  let id = 0;

  // Queen (1)
  ants.push(createAnt(id++, rooms[0].x, rooms[0].y, 'queen'));

  // Foragers (18)
  for (let i = 0; i < 18; i++) {
    const room = rooms[5];
    ants.push(createAnt(id++, 
      room.x + (Math.random() - 0.5) * 40, 
      room.y + (Math.random() - 0.5) * 25, 
      'forager'));
  }

  // Nurses (12)
  for (let i = 0; i < 12; i++) {
    const nurseryRoom = i < 7 ? rooms[1] : rooms[3];
    ants.push(createAnt(id++, 
      nurseryRoom.x + (Math.random() - 0.5) * 50, 
      nurseryRoom.y + (Math.random() - 0.5) * 35, 
      'nurse'));
  }

  // Queen attendants (6)
  for (let i = 0; i < 6; i++) {
    ants.push(createAnt(id++, 
      rooms[0].x + (Math.random() - 0.5) * 70, 
      rooms[0].y + (Math.random() - 0.5) * 45, 
      'attendant'));
  }

  return {
    rooms,
    tunnels,
    ants,
    foodSources,
    pupae,
    width,
    height,
    surfaceY,
    foodCollected: 0,
    foodInStorage: 50,
    time: 0,
  };
}

function createAnt(id: number, x: number, y: number, role: Ant['role']): Ant {
  return {
    id,
    x,
    y,
    targetX: x,
    targetY: y,
    role,
    carrying: 'none',
    destination: 'none',
    speed: role === 'queen' ? 0.15 : 1.0 + Math.random() * 1.0,
    state: 'idle',
    workTimer: 0,
    workDuration: 0,
    size: role === 'queen' ? 11 : 3.5 + Math.random() * 2,
    angle: Math.random() * Math.PI * 2,
    targetAngle: 0,
    legPhase: Math.random() * Math.PI * 2,
    wanderTimer: Math.random() * 3000,
  };
}

function getRandomPointInRoom(room: Room, shrink: number = 0.6): Point {
  return {
    x: room.x + (Math.random() - 0.5) * room.width * shrink,
    y: room.y + (Math.random() - 0.5) * room.height * shrink,
  };
}

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function lerpAngle(from: number, to: number, t: number): number {
  let diff = to - from;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return from + diff * t;
}

export function updateColony(state: ColonyState, dt: number): void {
  state.time += dt;
  const { ants, rooms, foodSources, pupae } = state;

  // Replenish food sources slowly
  for (const fs of foodSources) {
    if (fs.amount < fs.maxAmount) {
      fs.amount = Math.min(fs.maxAmount, fs.amount + 0.008 * dt);
    }
  }

  // Colony consumes food over time
  if (Math.floor(state.time / 3000) > Math.floor((state.time - dt) / 3000)) {
    state.foodInStorage = Math.max(0, state.foodInStorage - 1);
  }

  // Update pupae
  for (const pupa of pupae) {
    pupa.wiggle += dt * 0.003;
  }

  // Update ants
  for (const ant of ants) {
    ant.legPhase += dt * 0.015 * ant.speed;

    // Queen behavior - stays in queen chamber
    if (ant.role === 'queen') {
      const queenRoom = rooms[0];
      ant.wanderTimer -= dt;
      if (ant.wanderTimer <= 0 || dist(ant, { x: ant.targetX, y: ant.targetY }) < 5) {
        ant.wanderTimer = 4000 + Math.random() * 6000;
        const target = getRandomPointInRoom(queenRoom, 0.25);
        ant.targetX = target.x;
        ant.targetY = target.y;
        ant.state = 'moving';
      }
      if (ant.state === 'moving') {
        moveAnt(ant, dt);
      }
      continue;
    }

    // Working state - ant is performing a task at its location
    if (ant.state === 'working') {
      ant.workTimer -= dt;
      if (ant.workTimer <= 0) {
        ant.state = 'idle';
        ant.wanderTimer = 200 + Math.random() * 500; // Brief pause
      }
      continue;
    }

    // Idle state - brief pause then pick new target
    if (ant.state === 'idle') {
      ant.wanderTimer -= dt;
      if (ant.wanderTimer <= 0) {
        assignTarget(ant, state);
        ant.state = 'moving';
      }
      continue;
    }

    // Moving state - head towards target
    const d = dist(ant, { x: ant.targetX, y: ant.targetY });
    if (d < 10) {
      // Arrived at target - start working
      ant.state = 'working';
      ant.workTimer = 500 + Math.random() * 1500;

      // Process arrival actions based on destination
      if (ant.role === 'forager') {
        if (ant.destination === 'food_source' && ant.carrying === 'none') {
          // Picked up food at source
          ant.carrying = 'food';
          ant.workTimer = 400 + Math.random() * 600;
        } else if (ant.destination === 'storage' && ant.carrying === 'food') {
          // Delivered food to storage
          state.foodCollected += 1;
          state.foodInStorage += 1;
          ant.carrying = 'none';
          ant.workTimer = 300 + Math.random() * 500;
        }
      }
      if (ant.role === 'nurse') {
        if (ant.carrying === 'pupa') {
          ant.carrying = 'none';
        }
      }
      if (ant.role === 'attendant') {
        // Attendants just rest near queen
        ant.workTimer = 800 + Math.random() * 1200;
      }
    } else {
      moveAnt(ant, dt);
    }
  }
}

function assignTarget(ant: Ant, state: ColonyState): void {
  const { rooms, foodSources, pupae } = state;

  if (ant.role === 'forager') {
    if (ant.carrying === 'food') {
      // Deliver food to storage room
      const foodRoom = Math.random() > 0.5 ? rooms[2] : rooms[4];
      const target = getRandomPointInRoom(foodRoom, 0.5);
      ant.targetX = target.x;
      ant.targetY = target.y;
      ant.destination = 'storage';
    } else {
      // Go to surface to collect food
      const availableSources = foodSources.filter(fs => fs.amount > 3);
      if (availableSources.length > 0) {
        const fs = availableSources[Math.floor(Math.random() * availableSources.length)];
        ant.targetX = fs.x + (Math.random() - 0.5) * 25;
        ant.targetY = fs.y;
        ant.destination = 'food_source';
      } else {
        // Wait in entrance chamber
        const entrance = rooms[5];
        const target = getRandomPointInRoom(entrance, 0.6);
        ant.targetX = target.x;
        ant.targetY = target.y;
        ant.destination = 'wander';
      }
    }
  } else if (ant.role === 'nurse') {
    // Move between pupae in nursery rooms
    const nurseryRoomIndices = [1, 3];
    const roomIdx = nurseryRoomIndices[Math.floor(Math.random() * nurseryRoomIndices.length)];
    const nurseryRoom = rooms[roomIdx];
    const nurseryPupae = pupae.filter(p => p.roomIdx === roomIdx);
    
    if (nurseryPupae.length > 0 && Math.random() > 0.25) {
      const pupa = nurseryPupae[Math.floor(Math.random() * nurseryPupae.length)];
      ant.targetX = pupa.x + (Math.random() - 0.5) * 15;
      ant.targetY = pupa.y + (Math.random() - 0.5) * 10;
      ant.carrying = 'pupa';
      ant.destination = 'nursery';
    } else {
      const target = getRandomPointInRoom(nurseryRoom, 0.5);
      ant.targetX = target.x;
      ant.targetY = target.y;
      ant.destination = 'nursery';
    }
  } else if (ant.role === 'attendant') {
    // Stay near queen, occasionally fetch food
    if (Math.random() > 0.75 && state.foodInStorage > 5) {
      const foodRoom = Math.random() > 0.5 ? rooms[2] : rooms[4];
      const target = getRandomPointInRoom(foodRoom, 0.4);
      ant.targetX = target.x;
      ant.targetY = target.y;
      ant.destination = 'storage';
    } else {
      const queenRoom = rooms[0];
      const target = getRandomPointInRoom(queenRoom, 0.45);
      ant.targetX = target.x;
      ant.targetY = target.y;
      ant.destination = 'queen_chamber';
    }
  }
}

function moveAnt(ant: Ant, dt: number): void {
  const dx = ant.targetX - ant.x;
  const dy = ant.targetY - ant.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  
  if (d > 2) {
    const moveAmount = ant.speed * dt * 0.04;
    ant.x += (dx / d) * moveAmount;
    ant.y += (dy / d) * moveAmount;
    ant.targetAngle = Math.atan2(dy, dx);
    ant.angle = lerpAngle(ant.angle, ant.targetAngle, 0.1);
  }
}

// ===== RENDERING =====

export function renderColony(ctx: CanvasRenderingContext2D, state: ColonyState, time: number): void {
  const { width, height, surfaceY, rooms, tunnels, ants, foodSources, pupae } = state;

  ctx.clearRect(0, 0, width, height);

  // Sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, surfaceY);
  skyGrad.addColorStop(0, '#4A90D9');
  skyGrad.addColorStop(0.7, '#87CEEB');
  skyGrad.addColorStop(1, '#B8E6B8');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, surfaceY + 5);

  // Clouds
  drawClouds(ctx, width, time);

  // Sun
  const sunX = width * 0.88;
  const sunY = surfaceY * 0.25;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 50);
  sunGrad.addColorStop(0, '#FFF8DC');
  sunGrad.addColorStop(0.3, '#FFD700');
  sunGrad.addColorStop(0.7, 'rgba(255, 165, 0, 0.3)');
  sunGrad.addColorStop(1, 'rgba(255, 165, 0, 0)');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(sunX - 60, sunY - 60, 120, 120);

  // Ground
  ctx.beginPath();
  ctx.moveTo(0, surfaceY);
  for (let x = 0; x <= width; x += 3) {
    const y = surfaceY + Math.sin(x * 0.015) * 4 + Math.sin(x * 0.04) * 2;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();

  const earthGrad = ctx.createLinearGradient(0, surfaceY, 0, height);
  earthGrad.addColorStop(0, '#7B5E2B');
  earthGrad.addColorStop(0.15, '#6B4E1A');
  earthGrad.addColorStop(0.4, '#5A3E10');
  earthGrad.addColorStop(0.7, '#3D2A08');
  earthGrad.addColorStop(1, '#1F1504');
  ctx.fillStyle = earthGrad;
  ctx.fill();

  // Soil texture dots (seeded for consistency)
  ctx.globalAlpha = 0.12;
  const seed = 42;
  for (let i = 0; i < 200; i++) {
    const pseudoRand = ((i * 9301 + seed * 49297) % 233280) / 233280;
    const pseudoRand2 = ((i * 1301 + seed * 19297) % 233280) / 233280;
    const pseudoRand3 = ((i * 5301 + seed * 29297) % 233280) / 233280;
    const tx = pseudoRand * width;
    const ty = surfaceY + 15 + pseudoRand2 * (height - surfaceY - 20);
    const ts = 1 + pseudoRand3 * 2;
    ctx.beginPath();
    ctx.arc(tx, ty, ts, 0, Math.PI * 2);
    ctx.fillStyle = pseudoRand > 0.5 ? '#8B6914' : '#4A3508';
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Grass blades
  for (let x = 0; x < width; x += 3) {
    const baseY = surfaceY + Math.sin(x * 0.015) * 4 + Math.sin(x * 0.04) * 2;
    const grassH = 10 + Math.sin(x * 0.08) * 5;
    const sway = Math.sin(time * 0.001 + x * 0.05) * 3;
    
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + sway, baseY - grassH * 0.6, x + sway * 1.2, baseY - grassH);
    ctx.strokeStyle = `hsl(${95 + Math.sin(x * 0.1) * 25}, ${55 + Math.random() * 15}%, ${25 + Math.random() * 15}%)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Food sources on surface
  for (const fs of foodSources) {
    drawFoodSource(ctx, fs, time);
  }

  // Ant mounds
  drawMound(ctx, width * 0.5, surfaceY, 55, 30, time);
  drawMound(ctx, width * 0.82, surfaceY + 5, 35, 18, time);

  // Draw tunnels (behind rooms)
  for (const tunnel of tunnels) {
    drawTunnel(ctx, tunnel);
  }

  // Draw rooms
  for (const room of rooms) {
    drawRoom(ctx, room, time);
  }

  // Draw pupae
  for (const pupa of pupae) {
    const wx = Math.sin(pupa.wiggle + time * 0.002) * 1.5;
    const wy = Math.cos(pupa.wiggle * 0.7 + time * 0.001) * 0.5;
    
    ctx.beginPath();
    ctx.ellipse(pupa.x + wx, pupa.y + wy, pupa.size, pupa.size * 0.55, 0.2, 0, Math.PI * 2);
    const pupaGrad = ctx.createRadialGradient(pupa.x + wx, pupa.y + wy, 0, pupa.x + wx, pupa.y + wy, pupa.size);
    pupaGrad.addColorStop(0, '#FFF8E7');
    pupaGrad.addColorStop(0.7, '#E8D5B0');
    pupaGrad.addColorStop(1, '#C4A875');
    ctx.fillStyle = pupaGrad;
    ctx.fill();
    ctx.strokeStyle = '#A08050';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Draw ants
  for (const ant of ants) {
    drawAnt(ctx, ant, time);
  }

  // Draw room labels
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const room of rooms) {
    if (room.type !== 'entrance' && room.type !== 'waste') {
      ctx.fillStyle = 'rgba(255, 220, 150, 0.8)';
      ctx.fillText(room.label, room.x, room.y - room.height * 0.5 - 8);
    }
  }
}

function drawClouds(ctx: CanvasRenderingContext2D, width: number, time: number): void {
  ctx.globalAlpha = 0.6;
  const clouds = [
    { x: (time * 0.01) % (width + 200) - 100, y: 30, s: 1 },
    { x: (time * 0.007 + 300) % (width + 200) - 100, y: 50, s: 0.7 },
    { x: (time * 0.012 + 600) % (width + 200) - 100, y: 20, s: 0.8 },
  ];
  
  for (const cloud of clouds) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cloud.x, cloud.y, 40 * cloud.s, 15 * cloud.s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cloud.x - 20 * cloud.s, cloud.y + 5, 25 * cloud.s, 12 * cloud.s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cloud.x + 25 * cloud.s, cloud.y + 3, 30 * cloud.s, 13 * cloud.s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFoodSource(ctx: CanvasRenderingContext2D, fs: FoodSource, time: number): void {
  const ratio = fs.amount / fs.maxAmount;
  const size = 6 + ratio * 14;
  
  if (fs.type === 'leaf') {
    // Green leaf
    ctx.save();
    ctx.translate(fs.x, fs.y);
    ctx.rotate(Math.sin(time * 0.001) * 0.1);
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.5, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(76, 175, 80, ${0.6 + ratio * 0.4})`;
    ctx.fill();
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Leaf vein
    ctx.beginPath();
    ctx.moveTo(-size * 0.7, 0);
    ctx.lineTo(size * 0.7, 0);
    ctx.strokeStyle = '#1B5E20';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();
  } else if (fs.type === 'sugar') {
    // Sugar crystals (sparkling)
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + time * 0.001;
      const cx = fs.x + Math.cos(angle) * size * 0.3;
      const cy = fs.y + Math.sin(angle) * size * 0.3;
      ctx.beginPath();
      ctx.rect(cx - 2, cy - 2, 4, 4);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + ratio * 0.4 + Math.sin(time * 0.003 + i * 2) * 0.2})`;
      ctx.fill();
    }
  } else {
    // Dead insect
    ctx.beginPath();
    ctx.ellipse(fs.x, fs.y, size * 0.8, size * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100, 60, 30, ${0.5 + ratio * 0.5})`;
    ctx.fill();
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

function drawMound(ctx: CanvasRenderingContext2D, x: number, surfaceY: number, w: number, h: number, _time: number): void {
  ctx.beginPath();
  ctx.moveTo(x - w, surfaceY);
  ctx.quadraticCurveTo(x - w * 0.6, surfaceY - h * 0.8, x, surfaceY - h);
  ctx.quadraticCurveTo(x + w * 0.6, surfaceY - h * 0.8, x + w, surfaceY);
  ctx.closePath();
  
  const moundGrad = ctx.createLinearGradient(x, surfaceY - h, x, surfaceY);
  moundGrad.addColorStop(0, '#8B6B3A');
  moundGrad.addColorStop(0.5, '#6B4E2A');
  moundGrad.addColorStop(1, '#5A3E1A');
  ctx.fillStyle = moundGrad;
  ctx.fill();
  ctx.strokeStyle = '#4A3010';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Entrance hole
  ctx.beginPath();
  ctx.ellipse(x, surfaceY - h * 0.3, w * 0.15, h * 0.2, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1A0F00';
  ctx.fill();
  
  // Small dirt particles on mound (deterministic)
  for (let i = 0; i < 8; i++) {
    const pr = ((i * 7919 + Math.floor(x)) % 100) / 100;
    const pr2 = ((i * 6271 + Math.floor(x * 2)) % 100) / 100;
    const px = x + (pr - 0.5) * w * 1.2;
    const py = surfaceY - pr2 * h * 0.7;
    ctx.beginPath();
    ctx.arc(px, py, 1 + pr * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#9B7B4A';
    ctx.fill();
  }
}

function drawTunnel(ctx: CanvasRenderingContext2D, tunnel: Tunnel): void {
  const { from, to, width: tw } = tunnel;
  
  const midX = (from.x + to.x) / 2 + (from.y - to.y) * 0.1;
  const midY = (from.y + to.y) / 2;
  
  // Outer wall
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo(midX, midY, to.x, to.y);
  ctx.strokeStyle = '#0D0800';
  ctx.lineWidth = tw + 6;
  ctx.lineCap = 'round';
  ctx.stroke();
  
  // Inner tunnel
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo(midX, midY, to.x, to.y);
  ctx.strokeStyle = '#1F1205';
  ctx.lineWidth = tw;
  ctx.stroke();
  
  // Highlight
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo(midX, midY, to.x, to.y);
  ctx.strokeStyle = 'rgba(139, 105, 52, 0.15)';
  ctx.lineWidth = tw - 4;
  ctx.stroke();
}

function drawRoom(ctx: CanvasRenderingContext2D, room: Room, time: number): void {
  const { x, y, width: rw, height: rh, type } = room;
  
  // Room shadow/outline
  ctx.beginPath();
  ctx.ellipse(x, y, rw / 2 + 4, rh / 2 + 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#0D0800';
  ctx.fill();
  
  // Room fill
  ctx.beginPath();
  ctx.ellipse(x, y, rw / 2, rh / 2, 0, 0, Math.PI * 2);
  
  let bgColor = '#1F1205';
  if (type === 'queen') bgColor = '#2A1808';
  else if (type === 'nursery') bgColor = '#251508';
  else if (type === 'food') bgColor = '#221A08';
  else if (type === 'waste') bgColor = '#1A1005';
  
  ctx.fillStyle = bgColor;
  ctx.fill();

  // Room-specific decorations
  if (type === 'queen') {
    // Golden glow
    const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, rw * 0.4);
    glowGrad.addColorStop(0, `rgba(255, 200, 50, ${0.08 + Math.sin(time * 0.002) * 0.04})`);
    glowGrad.addColorStop(1, 'rgba(255, 200, 50, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fill();
  } else if (type === 'food') {
    // Food particles (slowly rotating)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + time * 0.0002;
      const r = rw * 0.22;
      const fx = x + Math.cos(angle) * r;
      const fy = y + Math.sin(angle) * r * 0.55;
      ctx.beginPath();
      ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#4CAF50' : '#8BC34A';
      ctx.globalAlpha = 0.5 + Math.sin(time * 0.001 + i) * 0.15;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

function drawAnt(ctx: CanvasRenderingContext2D, ant: Ant, time: number): void {
  const { x, y, angle, size, role, carrying, legPhase } = ant;
  
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  
  let bodyColor = '#1A1A1A';
  let headColor = '#0D0D0D';
  if (role === 'queen') { bodyColor = '#3D1A00'; headColor = '#2A1000'; }
  else if (role === 'nurse') { bodyColor = '#2A1800'; headColor = '#1A0F00'; }
  else if (role === 'attendant') { bodyColor = '#221500'; headColor = '#150D00'; }
  
  const s = size;
  
  // Legs (6 legs)
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = role === 'queen' ? 1.5 : 0.7;
  
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 3; i++) {
      const phase = legPhase + i * 2.1 + (side > 0 ? Math.PI : 0);
      const legSwing = Math.sin(phase) * 0.4;
      const baseX = (i - 1) * s * 0.35;
      
      const kneeX = baseX + side * s * 0.25;
      const kneeY = side * s * 0.3;
      const footX = kneeX + Math.cos(legSwing) * s * 0.4;
      const footY = side * (s * 0.5 + Math.abs(Math.sin(phase)) * s * 0.3);
      
      ctx.beginPath();
      ctx.moveTo(baseX, side * s * 0.1);
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(footX, footY);
      ctx.stroke();
    }
  }
  
  // Abdomen (gaster)
  ctx.beginPath();
  ctx.ellipse(-s * 0.65, 0, s * 0.5, s * (role === 'queen' ? 0.45 : 0.32), 0, 0, Math.PI * 2);
  const abdGrad = ctx.createRadialGradient(-s * 0.6, -s * 0.1, 0, -s * 0.65, 0, s * 0.5);
  abdGrad.addColorStop(0, bodyColor);
  abdGrad.addColorStop(1, '#000');
  ctx.fillStyle = abdGrad;
  ctx.fill();
  
  // Petiole (waist)
  ctx.beginPath();
  ctx.ellipse(-s * 0.2, 0, s * 0.12, s * 0.1, 0, 0, Math.PI * 2);
  ctx.fillStyle = bodyColor;
  ctx.fill();
  
  // Thorax
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.28, s * 0.22, 0, 0, Math.PI * 2);
  ctx.fillStyle = bodyColor;
  ctx.fill();
  
  // Head
  ctx.beginPath();
  ctx.ellipse(s * 0.45, 0, s * 0.28, s * 0.22, 0, 0, Math.PI * 2);
  ctx.fillStyle = headColor;
  ctx.fill();
  
  // Mandibles
  ctx.beginPath();
  ctx.moveTo(s * 0.65, -s * 0.08);
  ctx.lineTo(s * 0.8, -s * 0.15);
  ctx.moveTo(s * 0.65, s * 0.08);
  ctx.lineTo(s * 0.8, s * 0.15);
  ctx.strokeStyle = headColor;
  ctx.lineWidth = role === 'queen' ? 1.2 : 0.6;
  ctx.stroke();
  
  // Antennae
  const antennaWave = Math.sin(time * 0.004 + ant.id) * 0.15;
  ctx.beginPath();
  ctx.moveTo(s * 0.6, -s * 0.12);
  ctx.quadraticCurveTo(s * 0.9, -s * 0.4 + antennaWave * s, s * 1.1, -s * 0.5);
  ctx.moveTo(s * 0.6, s * 0.12);
  ctx.quadraticCurveTo(s * 0.9, s * 0.4 - antennaWave * s, s * 1.1, s * 0.5);
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = role === 'queen' ? 1 : 0.5;
  ctx.stroke();
  
  // Eyes
  if (role !== 'queen' || s > 8) {
    ctx.beginPath();
    ctx.arc(s * 0.52, -s * 0.1, s * 0.06, 0, Math.PI * 2);
    ctx.arc(s * 0.52, s * 0.1, s * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF';
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  
  // Queen crown indicator
  if (role === 'queen') {
    ctx.fillStyle = '#FFD700';
    ctx.font = `${s * 0.8}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.save();
    ctx.rotate(-angle); // Counter-rotate so crown is upright
    ctx.fillText('♛', 0, -s * 0.8);
    ctx.restore();
  }
  
  // Carrying indicator
  if (carrying === 'food') {
    ctx.beginPath();
    ctx.arc(s * 0.85, -s * 0.35, s * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = '#4CAF50';
    ctx.fill();
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  } else if (carrying === 'pupa') {
    ctx.beginPath();
    ctx.ellipse(s * 0.85, -s * 0.35, s * 0.2, s * 0.12, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#F5E6D3';
    ctx.fill();
    ctx.strokeStyle = '#C4A875';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  
  ctx.restore();
}
