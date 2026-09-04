// Synthesizes vintage mechanical sounds using Web Audio API

class AudioEngine {
  private ctx: AudioContext | null = null;
  private globalGain: GainNode | null = null;
  private bgmOscillators: any[] = [];
  private isBgmPlaying = false;
  public masterVolume = 0.5;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.globalGain = this.ctx.createGain();
      this.globalGain.connect(this.ctx.destination);
      this.globalGain.gain.value = this.masterVolume;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(v: number) {
    this.masterVolume = v;
    if (this.globalGain) {
      this.globalGain.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.1);
    }
  }

  startJazzLoop() {
    this.init();
    if (!this.ctx || this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    
    // Generative cool jazz lounge loop (vibraphone chords + upright bass pattern + ride cymbal)
    let nextNoteTime = this.ctx.currentTime + 0.1;
    const tempo = 110;
    const beatLen = 60 / tempo;
    
    // 12-bar blues in F
    const bassLines = [
      [43.65, 55.00, 65.41, 73.42], // F1, A1, C2, D2
      [58.27, 73.42, 87.31, 98.00], // Bb1, D2, F2, G2
      [65.41, 82.41, 98.00, 110.00] // C2, E2, G2, A2
    ];

    let beatCount = 0;

    const scheduleNotes = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.globalGain) return;
      
      while (nextNoteTime < this.ctx.currentTime + 0.5) {
        // --- Upright Bass ---
        const bar = Math.floor((beatCount / 4) % 12);
        let chordIdx = 0;
        if (bar >= 4 && bar < 6) chordIdx = 1; // IV
        if (bar >= 8 && bar < 10) chordIdx = 2; // V
        if (bar === 10) chordIdx = 1; // IV
        
        const bassFreq = bassLines[chordIdx][beatCount % 4];
        
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.value = bassFreq;
        
        bassGain.gain.setValueAtTime(0.4, nextNoteTime);
        bassGain.gain.exponentialRampToValueAtTime(0.01, nextNoteTime + beatLen - 0.1);
        
        bassOsc.connect(bassGain);
        bassGain.connect(this.globalGain);
        bassOsc.start(nextNoteTime);
        bassOsc.stop(nextNoteTime + beatLen);

        // --- Ride Cymbal (Swing) ---
        // Basic pattern: ding... ding-a-ding...
        const playCymbal = (time: number, vol: number) => {
          const noise = this.ctx!.createBufferSource();
          const bufferSize = this.ctx!.sampleRate * 0.5;
          const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            // High-passed white noise
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx!.sampleRate * 0.1));
          }
          noise.buffer = buffer;
          
          const filter = this.ctx!.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.value = 5000;
          
          const noiseGain = this.ctx!.createGain();
          noiseGain.gain.setValueAtTime(vol * 0.1, time);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
          
          noise.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(this.globalGain!);
          noise.start(time);
        };

        playCymbal(nextNoteTime, 0.5); // Downbeat
        
        // Swing eighths on beats 2 and 4
        if (beatCount % 2 === 1) {
          playCymbal(nextNoteTime + beatLen * 0.66, 0.3);
        }

        // --- Warm Vibraphone Chords (sparse) ---
        if (beatCount % 8 === 0) {
          const chord = [bassFreq * 4, bassFreq * 5, bassFreq * 6.5];
          chord.forEach(freq => {
            const vOsc = this.ctx!.createOscillator();
            const vGain = this.ctx!.createGain();
            vOsc.type = 'sine';
            vOsc.frequency.value = freq;
            
            vGain.gain.setValueAtTime(0, nextNoteTime);
            vGain.gain.linearRampToValueAtTime(0.1, nextNoteTime + 0.05);
            vGain.gain.exponentialRampToValueAtTime(0.001, nextNoteTime + beatLen * 4);
            
            vOsc.connect(vGain);
            vGain.connect(this.globalGain!);
            vOsc.start(nextNoteTime);
            vOsc.stop(nextNoteTime + beatLen * 4);
          });
        }

        nextNoteTime += beatLen;
        beatCount++;
      }
      if (this.isBgmPlaying) {
        setTimeout(scheduleNotes, 100);
      }
    };
    
    scheduleNotes();
  }

  stopJazzLoop() {
    this.isBgmPlaying = false;
  }

  playCoinInsert() {
    this.init();
    if (!this.ctx || !this.globalGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.globalGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playLeverPull() {
    this.init();
    if (!this.ctx || !this.globalGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(50, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(this.globalGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playReelSpin() {
    this.init();
    if (!this.ctx || !this.globalGain) return;
    
    const gainNode = this.ctx.createGain();
    gainNode.connect(this.globalGain);
    gainNode.gain.value = 0.15;

    let nextTickTime = this.ctx.currentTime;
    let isSpinning = true;

    const scheduleClick = () => {
      if (!isSpinning || !this.ctx || !this.globalGain) return;
      
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, nextTickTime); // deeper click
      osc.frequency.exponentialRampToValueAtTime(50, nextTickTime + 0.05);
      
      const clickGain = this.ctx.createGain();
      clickGain.gain.setValueAtTime(1, nextTickTime);
      clickGain.gain.exponentialRampToValueAtTime(0.01, nextTickTime + 0.03);
      
      osc.connect(clickGain);
      clickGain.connect(gainNode);
      
      osc.start(nextTickTime);
      osc.stop(nextTickTime + 0.03);
      
      nextTickTime += 0.08; // Slightly slower, more mechanical tick
      
      if (isSpinning && nextTickTime < this.ctx.currentTime + 0.2) {
        setTimeout(scheduleClick, 15);
      } else if (isSpinning) {
        setTimeout(scheduleClick, 40);
      }
    };
    
    scheduleClick();

    return {
      stop: () => {
        isSpinning = false;
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + 0.1);
      }
    };
  }

  playReelStop() {
    this.init();
    if (!this.ctx || !this.globalGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.globalGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playWinBell() {
    this.init();
    if (!this.ctx || !this.globalGain) return;
    
    const playChime = (freq: number, delay: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + delay);
      
      gain.gain.setValueAtTime(0, this.ctx!.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.4, this.ctx!.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + delay + 1.5);
      
      osc.connect(gain);
      gain.connect(this.globalGain!);
      
      osc.start(this.ctx!.currentTime + delay);
      osc.stop(this.ctx!.currentTime + delay + 1.5);
    };

    // Very triumphant bell cascade
    for (let i = 0; i < 15; i++) {
      playChime(880 + (i%3)*50, i * 0.08);
      playChime(1108.73 - (i%2)*20, i * 0.08);
    }
  }

  playAchievement() {
    this.init();
    if (!this.ctx || !this.globalGain) return;
    
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C E G C arpeggio
    freqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      const t = this.ctx!.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
      
      osc.connect(gain);
      gain.connect(this.globalGain!);
      
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  playCoinFountain(duration: number = 2) {
    this.init();
    if (!this.ctx || !this.globalGain) return;
    
    // Simulate cascade of many coins dropping over 'duration' seconds
    const coinCount = duration * 15;
    for (let i = 0; i < coinCount; i++) {
      const delay = Math.random() * duration;
      const freq = 1200 + Math.random() * 800; // high pitched clink
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + delay + 0.05);
      
      gain.gain.setValueAtTime(0, this.ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.1);
      
      osc.connect(gain);
      gain.connect(this.globalGain);
      
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.1);
    }
  }

  playLose() {
    this.init();
    if (!this.ctx || !this.globalGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.6);
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);
    
    osc.connect(gain);
    gain.connect(this.globalGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  playChargeUp() {
    this.init();
    if (!this.ctx || !this.globalGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Vintage theremin/sci-fi charge up effect
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 2);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 1);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 2.5);
    
    // Add some vibrato
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 8;
    lfoGain.gain.value = 20;
    
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    
    osc.connect(gain);
    gain.connect(this.globalGain);
    
    lfo.start(this.ctx.currentTime);
    osc.start(this.ctx.currentTime);
    
    lfo.stop(this.ctx.currentTime + 2.5);
    osc.stop(this.ctx.currentTime + 2.5);
  }
}

export const audio = new AudioEngine();
