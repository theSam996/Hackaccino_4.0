/* ═══════════════════════════════════════════════════════
   NUCLEAR FACILITY ALPHA — ANOMALY DETECTION ENGINE v2.0
   Real-time Telemetry Simulation & Attack Sequence
   Enhanced: Threat thermometer, per-sensor divergence,
   staged events, header threat confidence, SSE badge
   ═══════════════════════════════════════════════════════ */

(() => {
  'use strict';

  // ── CONFIGURATION ──
  const CONFIG = {
    TICK_INTERVAL: 150,          // ms between data ticks
    CHART_MAX_POINTS: 80,        // visible data points on chart
    ANOMALY_THRESHOLD: 0.65,     // lockdown trigger
    ANOMALY_BASE: 0.04,          // normal score
    ANOMALY_CLIMB_RATE: 0.008,   // per tick during attack
    ATTACK_RAMP_TICKS: 40,       // ticks to full spike
    SENSORS: [
      { id: 'pumpRPM',     name: 'PUMP RPM',           icon: '⚙',  unit: 'RPM',  base: 1450,  max: 3200,  spike: 2900  },
      { id: 'reactorTemp', name: 'REACTOR TEMP',        icon: '🌡', unit: '°C',   base: 320,   max: 800,   spike: 720   },
      { id: 'coolantPres', name: 'COOLANT PRESSURE',    icon: '💧', unit: 'PSI',  base: 2200,  max: 4500,  spike: 4100  },
      { id: 'turbineLoad', name: 'TURBINE LOAD',        icon: '⚡', unit: 'MW',   base: 850,   max: 1600,  spike: 1480  },
      { id: 'coreVib',     name: 'CORE VIBRATION',      icon: '📳', unit: 'mm/s', base: 0.8,   max: 5.0,   spike: 4.2   },
      { id: 'valvePos',    name: 'VALVE POSITION',      icon: '🔧', unit: '%',    base: 45,    max: 100,   spike: 92    },
    ],
  };

  // ── STATE ──
  const STATE = {
    mode: 'normal',             // 'normal' | 'attack' | 'lockdown'
    tick: 0,
    attackTick: 0,
    anomalyScore: CONFIG.ANOMALY_BASE,
    physicalData: [],
    itData: [],
    sensorValues: {},
    itSpoofedValues: {},        // IT spoofed values per sensor
    eventCount: 0,
    intervalId: null,
    pendingEvents: [],          // staged event queue
  };

  // Initialize sensor values
  CONFIG.SENSORS.forEach(s => {
    STATE.sensorValues[s.id] = s.base;
    STATE.itSpoofedValues[s.id] = s.base;
  });

  // ── DOM REFS ──
  const DOM = {
    liveTimestamp:       document.getElementById('liveTimestamp'),
    statusBadge:        document.getElementById('statusBadge'),
    mainHeader:         document.getElementById('mainHeader'),
    sensorGrid:         document.getElementById('sensorGrid'),
    eventLog:           document.getElementById('eventLog'),
    eventCount:         document.getElementById('eventCount'),
    lockdownModal:      document.getElementById('lockdownModal'),
    lockdownScore:      document.getElementById('lockdownScore'),
    injectBtn:          document.getElementById('injectBtn'),
    physicalChartPanel: document.getElementById('physicalChartPanel'),
    itChartPanel:       document.getElementById('itChartPanel'),
    physicalLiveBadge:  document.getElementById('physicalLiveBadge'),
    // Comparison
    compPhysical:       document.getElementById('compPhysical'),
    compIT:             document.getElementById('compIT'),
    compPhysicalStatus: document.getElementById('compPhysicalStatus'),
    compITStatus:       document.getElementById('compITStatus'),
    compPhysicalBar:    document.getElementById('compPhysicalBar'),
    compITBar:          document.getElementById('compITBar'),
    compPhysicalValue:  document.getElementById('compPhysicalValue'),
    compITValue:        document.getElementById('compITValue'),
    divBarFill:         document.getElementById('divBarFill'),
    divValue:           document.getElementById('divValue'),
    // Threat thermometer
    thermoFill:         document.getElementById('thermoFill'),
    thermoValue:        document.getElementById('thermoValue'),
    // Header threat confidence
    headerThreat:       document.getElementById('headerThreat'),
    headerThreatScore:  document.getElementById('headerThreatScore'),
    headerAnomalyArc:   document.getElementById('headerAnomalyArc'),
    headerRingSVG:      document.getElementById('headerRingSVG'),
    headerAiStatus:     document.getElementById('headerAiStatus'),
    // Divergence grid
    divergenceGrid:     document.getElementById('divergenceGrid'),
    // Schematic elements
    schReactor:         document.getElementById('schReactor'),
    schReactorGlow:     document.getElementById('schReactorGlow'),
    schCoolant:         document.getElementById('schCoolant'),
    schTurbine:         document.getElementById('schTurbine'),
    schControl:         document.getElementById('schControl'),
    schPumpA:           document.getElementById('schPumpA'),
    schPumpB:           document.getElementById('schPumpB'),
    schValve:           document.getElementById('schValve'),
    schIT:              document.getElementById('schIT'),
    schPipe1:           document.getElementById('schPipe1'),
    schPipe2:           document.getElementById('schPipe2'),
    schPipe3:           document.getElementById('schPipe3'),
    schPipe4:           document.getElementById('schPipe4'),
    schPipe5:           document.getElementById('schPipe5'),
    schPipe6:           document.getElementById('schPipe6'),
    schPipe7:           document.getElementById('schPipe7'),
    schPipePA:          document.getElementById('schPipePA'),
    schPipePB:          document.getElementById('schPipePB'),
    schDotReactor:      document.getElementById('schDotReactor'),
    schDotCoolant:      document.getElementById('schDotCoolant'),
    schDotTurbine:      document.getElementById('schDotTurbine'),
  };

  // ── UTILITY ──
  function noise(amplitude = 1) {
    return (Math.random() - 0.5) * 2 * amplitude;
  }

  function formatTime() {
    const d = new Date();
    return d.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
  }

  function shortTime() {
    const d = new Date();
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function formatSensorValue(value, base) {
    return value < 10 ? value.toFixed(2) : value.toFixed(0);
  }

  // ── BUILD SENSOR CARDS ──
  function buildSensorCards() {
    DOM.sensorGrid.innerHTML = CONFIG.SENSORS.map(s => `
      <div class="sensor-card" id="card-${s.id}">
        <span class="sensor-icon">${s.icon}</span>
        <span class="sensor-name">${s.name}</span>
        <span class="sensor-value" id="val-${s.id}">${s.base.toFixed(s.base < 10 ? 1 : 0)}</span>
        <span class="sensor-unit">${s.unit}</span>
        <div class="sensor-bar">
          <div class="sensor-bar-fill" id="bar-${s.id}" style="width: ${(s.base / s.max * 100).toFixed(0)}%"></div>
        </div>
      </div>
    `).join('');
  }

  // ── BUILD DIVERGENCE GRID (IT vs Physical per-sensor) ──
  function buildDivergenceGrid() {
    DOM.divergenceGrid.innerHTML = CONFIG.SENSORS.map(s => `
      <div class="divergence-chip" id="divchip-${s.id}">
        <div class="div-chip-header">
          <div class="div-chip-name">${s.icon} ${s.name}</div>
        </div>
        <div class="div-chip-body">
          <div class="div-chip-row">
            <span class="div-chip-source">IT DASHBOARD</span>
            <span class="div-chip-val it-val" id="divit-${s.id}">${formatSensorValue(s.base, s.base)}</span>
          </div>
          <div class="div-chip-row">
            <span class="div-chip-source">PHYSICAL OT</span>
            <span class="div-chip-val phy-val" id="divphy-${s.id}">${formatSensorValue(s.base, s.base)}</span>
          </div>
        </div>
        <div class="div-chip-footer">
          <div class="div-chip-status match" id="divstatus-${s.id}">✓ MATCH</div>
        </div>
      </div>
    `).join('');
  }

  // ── CHART SETUP ──
  function createChart(canvasId, label, color, borderColor) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array(CONFIG.CHART_MAX_POINTS).fill(''),
        datasets: [{
          label: label,
          data: Array(CONFIG.CHART_MAX_POINTS).fill(50),
          borderColor: borderColor,
          borderWidth: 2,
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 100 },
        interaction: { enabled: false },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          x: { display: false },
          y: {
            min: 0,
            max: 120,
            grid: {
              color: 'rgba(0, 255, 136, 0.04)',
              drawBorder: false,
            },
            ticks: {
              color: 'rgba(122, 143, 166, 0.5)',
              font: { family: "'JetBrains Mono'", size: 9 },
              stepSize: 30,
            },
          },
        },
      },
    });
  }

  let physicalChart, itChart;

  function initCharts() {
    physicalChart = createChart(
      'physicalChart',
      'Physical Telemetry',
      'rgba(0, 255, 136, 0.12)',
      '#00ff88'
    );
    itChart = createChart(
      'itChart',
      'IT Network Feed',
      'rgba(0, 212, 255, 0.12)',
      '#00d4ff'
    );
  }

  // ── LOG EVENT (immediate) ──
  function logEvent(msg, type = 'info') {
    STATE.eventCount++;
    DOM.eventCount.textContent = `${STATE.eventCount} EVENTS`;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `
      <span class="log-time">${shortTime()}</span>
      <span class="log-msg">${msg}</span>
      <span class="log-type ${type}">${type.toUpperCase()}</span>
    `;
    DOM.eventLog.insertBefore(entry, DOM.eventLog.firstChild);

    // Keep max 50 entries
    while (DOM.eventLog.children.length > 50) {
      DOM.eventLog.removeChild(DOM.eventLog.lastChild);
    }
  }

  // ── STAGED EVENT (delayed) ──
  function stageEvent(msg, type, delayMs) {
    const timeoutId = setTimeout(() => {
      logEvent(msg, type);
    }, delayMs);
    STATE.pendingEvents.push(timeoutId);
  }

  function clearStagedEvents() {
    STATE.pendingEvents.forEach(id => clearTimeout(id));
    STATE.pendingEvents = [];
  }

  // ── UPDATE TIMESTAMP ──
  function updateTimestamp() {
    DOM.liveTimestamp.textContent = formatTime();
  }

  // ── SENSOR UPDATE ──
  function updateSensors() {
    CONFIG.SENSORS.forEach(sensor => {
      const card = document.getElementById(`card-${sensor.id}`);
      const valEl = document.getElementById(`val-${sensor.id}`);
      const barEl = document.getElementById(`bar-${sensor.id}`);

      let value;
      if (STATE.mode === 'attack') {
        const progress = Math.min(STATE.attackTick / CONFIG.ATTACK_RAMP_TICKS, 1);
        const eased = progress * progress;
        const target = sensor.base + (sensor.spike - sensor.base) * eased;
        value = target + noise(sensor.base * 0.02);
      } else {
        value = sensor.base + noise(sensor.base * 0.01);
      }

      STATE.sensorValues[sensor.id] = value;
      // IT spoofed values always stay near baseline
      STATE.itSpoofedValues[sensor.id] = sensor.base + noise(sensor.base * 0.005);

      const display = formatSensorValue(value, sensor.base);
      valEl.textContent = display;

      const pct = Math.min((value / sensor.max) * 100, 100);
      barEl.style.width = `${pct}%`;

      // Status classes
      const ratio = value / sensor.max;
      card.classList.remove('warning', 'critical');
      if (ratio > 0.8) card.classList.add('critical');
      else if (ratio > 0.6) card.classList.add('warning');
    });
  }

  // ── DIVERGENCE GRID UPDATE ──
  function updateDivergenceGrid() {
    CONFIG.SENSORS.forEach(sensor => {
      const itValEl = document.getElementById(`divit-${sensor.id}`);
      const phyValEl = document.getElementById(`divphy-${sensor.id}`);
      const statusEl = document.getElementById(`divstatus-${sensor.id}`);
      const chipEl = document.getElementById(`divchip-${sensor.id}`);

      const phyVal = STATE.sensorValues[sensor.id];
      const itVal = STATE.itSpoofedValues[sensor.id];

      itValEl.textContent = formatSensorValue(itVal, sensor.base);
      phyValEl.textContent = formatSensorValue(phyVal, sensor.base);

      // Check divergence
      const divergenceRatio = Math.abs(phyVal - itVal) / sensor.base;

      if (STATE.mode === 'attack' && divergenceRatio > 0.15) {
        // Dramatic divergence
        phyValEl.classList.add('critical');
        statusEl.className = 'div-chip-status mismatch';
        statusEl.textContent = '✗ DIVERGED';
        chipEl.classList.add('diverged');
      } else {
        phyValEl.classList.remove('critical');
        statusEl.className = 'div-chip-status match';
        statusEl.textContent = '✓ MATCH';
        chipEl.classList.remove('diverged');
      }
    });
  }

  // ── CHART TICK ──
  function tickCharts() {
    let physicalVal, itVal;

    if (STATE.mode === 'normal') {
      const baseVal = 45 + noise(6);
      physicalVal = baseVal;
      itVal = baseVal + noise(1);
    } else if (STATE.mode === 'attack') {
      const progress = Math.min(STATE.attackTick / CONFIG.ATTACK_RAMP_TICKS, 1);
      const eased = progress * progress;
      physicalVal = 45 + eased * 55 + noise(3);
      itVal = 45 + noise(3); // IT stays spoofed/flat
    } else {
      physicalVal = 45 + noise(6);
      itVal = physicalVal + noise(1);
    }

    physicalVal = Math.max(0, Math.min(120, physicalVal));
    itVal = Math.max(0, Math.min(120, itVal));

    // Push data
    physicalChart.data.datasets[0].data.push(physicalVal);
    physicalChart.data.datasets[0].data.shift();
    physicalChart.data.labels.push('');
    physicalChart.data.labels.shift();

    itChart.data.datasets[0].data.push(itVal);
    itChart.data.datasets[0].data.shift();
    itChart.data.labels.push('');
    itChart.data.labels.shift();

    // Change chart color during attack
    if (STATE.mode === 'attack') {
      const progress = Math.min(STATE.attackTick / CONFIG.ATTACK_RAMP_TICKS, 1);
      if (progress > 0.5) {
        physicalChart.data.datasets[0].borderColor = '#ff2244';
        const ctx = document.getElementById('physicalChart').getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 240);
        gradient.addColorStop(0, 'rgba(255, 34, 68, 0.2)');
        gradient.addColorStop(1, 'transparent');
        physicalChart.data.datasets[0].backgroundColor = gradient;
      }
    }

    physicalChart.update('none');
    itChart.update('none');
  }

  // ── ANOMALY SCORE ──
  function updateAnomalyScore() {
    if (STATE.mode === 'attack') {
      STATE.anomalyScore = Math.min(
        STATE.anomalyScore + CONFIG.ANOMALY_CLIMB_RATE + noise(0.002),
        0.98
      );
    }

    const score = STATE.anomalyScore;
    const scoreText = score.toFixed(2);

    // ── Header Threat Confidence (primary display) ──
    DOM.headerThreatScore.textContent = scoreText;

    // Arc animation (314 = full circumference for r=50)
    const arcOffset = 314 - (score * 314);
    DOM.headerAnomalyArc.style.strokeDashoffset = arcOffset;

    // Color transitions
    DOM.headerThreatScore.classList.remove('warning', 'critical');
    DOM.headerRingSVG.classList.remove('critical');
    DOM.headerThreat.classList.remove('elevated', 'critical');

    if (score > 0.55) {
      DOM.headerThreatScore.classList.add('critical');
      DOM.headerAnomalyArc.style.stroke = '#ff2244';
      DOM.headerRingSVG.classList.add('critical');
      DOM.headerAiStatus.textContent = 'THREAT DETECTED';
      DOM.headerAiStatus.classList.add('critical');
      DOM.headerThreat.classList.add('critical');
    } else if (score > 0.3) {
      DOM.headerThreatScore.classList.add('warning');
      DOM.headerAnomalyArc.style.stroke = '#ffb020';
      DOM.headerAiStatus.textContent = 'ANALYZING';
      DOM.headerAiStatus.classList.remove('critical');
      DOM.headerThreat.classList.add('elevated');
    } else {
      DOM.headerAnomalyArc.style.stroke = '#00ff88';
      DOM.headerAiStatus.textContent = 'MONITORING';
      DOM.headerAiStatus.classList.remove('critical');
    }

    // ── Threat Thermometer ──
    updateThermometer(score);

    // LOCKDOWN CHECK
    if (score >= CONFIG.ANOMALY_THRESHOLD && STATE.mode === 'attack') {
      triggerLockdown();
    }
  }

  // ── THERMOMETER ──
  function updateThermometer(score) {
    const pct = Math.min(score / CONFIG.ANOMALY_THRESHOLD * 100, 100);
    DOM.thermoFill.style.width = `${pct}%`;
    DOM.thermoValue.textContent = `${Math.round(pct)}%`;

    DOM.thermoFill.classList.remove('warning', 'critical');
    DOM.thermoValue.classList.remove('warning', 'critical');

    if (pct > 75) {
      DOM.thermoFill.classList.add('critical');
      DOM.thermoValue.classList.add('critical');
    } else if (pct > 40) {
      DOM.thermoFill.classList.add('warning');
      DOM.thermoValue.classList.add('warning');
    }
  }

  // ── COMPARISON PANEL ──
  function updateComparison() {
    if (STATE.mode === 'attack') {
      const progress = Math.min(STATE.attackTick / CONFIG.ATTACK_RAMP_TICKS, 1);
      const phyPct = 30 + progress * 65;
      const itPct = 30 + noise(2);
      const divergence = Math.round(progress * 100);

      DOM.compPhysicalBar.style.width = `${phyPct}%`;
      DOM.compITBar.style.width = `${Math.max(28, itPct)}%`;

      if (progress > 0.4) {
        DOM.compPhysicalStatus.textContent = 'ANOMALOUS';
        DOM.compPhysicalStatus.classList.add('critical');
        DOM.compPhysicalBar.classList.add('critical');
        DOM.compPhysical.classList.add('alert-state');
        DOM.compPhysicalValue.textContent = 'Sensors Elevated';
      }

      DOM.compITStatus.textContent = 'NOMINAL';
      DOM.compITValue.textContent = 'Spoofed Normal';

      DOM.divBarFill.style.width = `${divergence}%`;
      DOM.divValue.textContent = `${divergence}%`;

      if (divergence > 60) {
        DOM.divBarFill.classList.add('critical');
        DOM.divBarFill.classList.remove('warning');
        DOM.divValue.classList.add('critical');
      } else if (divergence > 30) {
        DOM.divBarFill.classList.add('warning');
        DOM.divBarFill.classList.remove('critical');
        DOM.divValue.classList.remove('critical');
      }
    } else {
      DOM.compPhysicalBar.style.width = '30%';
      DOM.compITBar.style.width = '30%';
      DOM.compPhysicalStatus.textContent = 'NOMINAL';
      DOM.compPhysicalStatus.classList.remove('critical');
      DOM.compPhysicalBar.classList.remove('critical');
      DOM.compPhysical.classList.remove('alert-state');
      DOM.compPhysicalValue.textContent = 'Baseline';
      DOM.compITStatus.textContent = 'NOMINAL';
      DOM.compITValue.textContent = 'Baseline';
      DOM.divBarFill.style.width = '0%';
      DOM.divValue.textContent = '0%';
      DOM.divBarFill.classList.remove('warning', 'critical');
      DOM.divValue.classList.remove('critical');
    }
  }

  // ── SCHEMATIC UPDATE (enhanced with Pump A/B) ──
  function updateSchematic() {
    const elements = [DOM.schReactor, DOM.schCoolant, DOM.schTurbine, DOM.schControl, DOM.schPumpA, DOM.schPumpB, DOM.schValve];
    const pipes = [DOM.schPipe1, DOM.schPipe2, DOM.schPipe3, DOM.schPipe5, DOM.schPipe6, DOM.schPipe7, DOM.schPipePA, DOM.schPipePB];
    const dots = [DOM.schDotReactor, DOM.schDotCoolant, DOM.schDotTurbine];

    if (STATE.mode === 'attack') {
      const progress = Math.min(STATE.attackTick / CONFIG.ATTACK_RAMP_TICKS, 1);

      // Staged schematic alerts — components go red progressively
      if (progress > 0.15) {
        DOM.schPumpA.classList.add('alert');
        DOM.schPumpB.classList.add('alert');
        DOM.schPipePA.classList.add('alert');
        DOM.schPipePB.classList.add('alert');
      }
      if (progress > 0.25) {
        DOM.schReactor.classList.add('alert');
        DOM.schReactorGlow.classList.add('alert');
        DOM.schDotReactor.classList.add('alert');
        DOM.schPipe1.classList.add('alert');
      }
      if (progress > 0.4) {
        DOM.schCoolant.classList.add('alert');
        DOM.schDotCoolant.classList.add('alert');
        DOM.schPipe2.classList.add('alert');
        DOM.schPipe3.classList.add('alert');
        DOM.schControl.classList.add('alert');
      }
      if (progress > 0.6) {
        DOM.schTurbine.classList.add('alert');
        DOM.schDotTurbine.classList.add('alert');
        DOM.schPipe5.classList.add('alert');
        DOM.schPipe6.classList.add('alert');
        DOM.schPipe7.classList.add('alert');
        DOM.schValve.classList.add('alert');
      }

      // IT block always stays normal/cyan
      DOM.schIT.classList.remove('alert');
      DOM.schPipe4.classList.remove('alert');
    } else {
      elements.forEach(el => el && el.classList.remove('alert'));
      pipes.forEach(el => el && el.classList.remove('alert'));
      dots.forEach(el => el && el.classList.remove('alert'));
      DOM.schReactorGlow && DOM.schReactorGlow.classList.remove('alert');
    }
  }

  // ── HEADER STATUS ──
  function updateHeader() {
    if (STATE.mode === 'attack') {
      DOM.mainHeader.classList.add('attack-mode');
      DOM.statusBadge.classList.add('critical');
      DOM.statusBadge.querySelector('.badge-text').textContent = 'THREAT DETECTED';
    } else {
      DOM.mainHeader.classList.remove('attack-mode');
      DOM.statusBadge.classList.remove('critical');
      DOM.statusBadge.querySelector('.badge-text').textContent = 'OPERATIONAL';
    }
  }

  // ── PANEL ALERTS ──
  function updatePanelAlerts() {
    if (STATE.mode === 'attack') {
      const progress = Math.min(STATE.attackTick / CONFIG.ATTACK_RAMP_TICKS, 1);
      if (progress > 0.5) {
        DOM.physicalChartPanel.classList.add('alert');
        DOM.physicalLiveBadge.textContent = '⚠ ANOMALY';
        DOM.physicalLiveBadge.style.color = '#ff2244';
        DOM.physicalLiveBadge.style.borderColor = '#ff2244';
        DOM.physicalLiveBadge.style.background = 'rgba(255,34,68,0.1)';
      }
    } else {
      DOM.physicalChartPanel.classList.remove('alert');
      DOM.physicalLiveBadge.textContent = '● LIVE';
      DOM.physicalLiveBadge.style.color = '';
      DOM.physicalLiveBadge.style.borderColor = '';
      DOM.physicalLiveBadge.style.background = '';
    }
  }

  // ── STAGED ATTACK EVENTS (progressive, not all at once) ──
  function scheduleAttackEvents() {
    clearStagedEvents();

    const events = [
      { delay: 200,   msg: '☢ Malicious payload injected into HMI interface',                           type: 'critical' },
      { delay: 1200,  msg: 'IT dashboard feed compromised — values being spoofed to NOMINAL',           type: 'critical' },
      { delay: 2400,  msg: 'Pump RPM deviation detected — +12% above baseline',                         type: 'warning'  },
      { delay: 3200,  msg: 'Physical sensor polling rate increased to 10Hz',                             type: 'warning'  },
      { delay: 4000,  msg: 'Reactor temperature rising — coolant system under stress',                   type: 'warning'  },
      { delay: 4800,  msg: 'IT network feed remains spoofed — reporting all systems NOMINAL',            type: 'critical' },
      { delay: 5500,  msg: 'Isolation Forest model confidence climbing — analyzing signal divergence',   type: 'warning'  },
      { delay: 6200,  msg: 'Core vibration exceeding safety envelope — structural stress warning',       type: 'critical' },
      { delay: 7000,  msg: 'Turbine load surge detected — generator stress alert',                      type: 'critical' },
      { delay: 7800,  msg: 'Valve position anomaly — automated safety response triggered',              type: 'critical' },
      { delay: 8500,  msg: 'CRITICAL: Physical-IT signal divergence exceeds 80% — threshold imminent',  type: 'critical' },
    ];

    events.forEach(evt => {
      stageEvent(evt.msg, evt.type, evt.delay);
    });
  }

  // ── LOCKDOWN TRIGGER ──
  function triggerLockdown() {
    STATE.mode = 'lockdown';
    DOM.lockdownScore.textContent = STATE.anomalyScore.toFixed(2);
    DOM.lockdownModal.classList.add('active');
    logEvent('🔒 FACILITY LOCKDOWN INITIATED — Automated SCRAM sequence engaged', 'critical');

    // Stop the interval
    if (STATE.intervalId) {
      clearInterval(STATE.intervalId);
      STATE.intervalId = null;
    }
  }

  // ── INJECT ATTACK ──
  function injectAttack() {
    if (STATE.mode !== 'normal') return;
    STATE.mode = 'attack';
    STATE.attackTick = 0;
    STATE.anomalyScore = CONFIG.ANOMALY_BASE;

    DOM.injectBtn.disabled = true;
    logEvent('⚠ ATTACK SIMULATION INITIATED — Monitoring for cyber-physical divergence', 'critical');
    updateHeader();

    // Schedule staged events
    scheduleAttackEvents();
  }

  // ── RESET ──
  function resetSystem() {
    // Stop existing interval
    if (STATE.intervalId) {
      clearInterval(STATE.intervalId);
      STATE.intervalId = null;
    }

    // Clear staged events
    clearStagedEvents();

    STATE.mode = 'normal';
    STATE.tick = 0;
    STATE.attackTick = 0;
    STATE.anomalyScore = CONFIG.ANOMALY_BASE;
    STATE.eventCount = 0;

    // Reset sensor values
    CONFIG.SENSORS.forEach(s => {
      STATE.sensorValues[s.id] = s.base;
      STATE.itSpoofedValues[s.id] = s.base;
    });

    // Reset UI
    DOM.lockdownModal.classList.remove('active');
    DOM.injectBtn.disabled = false;
    DOM.eventLog.innerHTML = '';
    DOM.eventCount.textContent = '0 EVENTS';

    // Reset charts
    physicalChart.data.datasets[0].data = Array(CONFIG.CHART_MAX_POINTS).fill(50);
    physicalChart.data.datasets[0].borderColor = '#00ff88';
    const ctx = document.getElementById('physicalChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(0, 255, 136, 0.12)');
    gradient.addColorStop(1, 'transparent');
    physicalChart.data.datasets[0].backgroundColor = gradient;
    physicalChart.update('none');

    itChart.data.datasets[0].data = Array(CONFIG.CHART_MAX_POINTS).fill(50);
    itChart.update('none');

    // Reset header threat
    DOM.headerAnomalyArc.style.stroke = '#00ff88';
    DOM.headerAnomalyArc.style.strokeDashoffset = 314;
    DOM.headerThreatScore.textContent = '0.04';
    DOM.headerThreatScore.classList.remove('warning', 'critical');
    DOM.headerRingSVG.classList.remove('critical');
    DOM.headerThreat.classList.remove('elevated', 'critical');
    DOM.headerAiStatus.textContent = 'MONITORING';
    DOM.headerAiStatus.classList.remove('critical');

    // Reset thermometer
    DOM.thermoFill.style.width = '0%';
    DOM.thermoFill.classList.remove('warning', 'critical');
    DOM.thermoValue.textContent = '0%';
    DOM.thermoValue.classList.remove('warning', 'critical');

    updateHeader();
    updateComparison();
    updateSchematic();
    updatePanelAlerts();
    updateSensors();
    updateDivergenceGrid();

    logEvent('System reset — All telemetry restored to baseline', 'info');

    // Restart
    startEngine();
  }

  // ── MAIN TICK ──
  function mainTick() {
    STATE.tick++;

    if (STATE.mode === 'attack') {
      STATE.attackTick++;
    }

    updateTimestamp();
    updateSensors();
    updateDivergenceGrid();
    tickCharts();
    updateAnomalyScore();
    updateComparison();
    updateSchematic();
    updatePanelAlerts();
  }

  // ── START ENGINE ──
  function startEngine() {
    if (STATE.intervalId) clearInterval(STATE.intervalId);
    STATE.intervalId = setInterval(mainTick, CONFIG.TICK_INTERVAL);
  }

  // ── INITIALIZATION ──
  function init() {
    buildSensorCards();
    buildDivergenceGrid();
    initCharts();
    updateTimestamp();
    logEvent('System initialized — Cyber-physical monitoring active', 'info');
    logEvent('Isolation Forest model loaded — Anomaly detection online', 'info');
    logEvent('SSE telemetry stream established — Encrypted channel open', 'info');
    startEngine();
  }

  // ── PUBLIC API ──
  window.dashApp = {
    injectAttack,
    reset: resetSystem,
  };

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
