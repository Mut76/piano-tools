const noteNames = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

const chordsBank = [
  ["C", ["C","E","G"], ["E","G","C"], ["G","C","E"]],
  ["C#", ["C#","F","G#"], ["F","G#","C#"], ["G#","C#","F"]],
  ["D", ["D","F#","A"], ["F#","A","D"], ["A","D","F#"]],
  ["D#", ["D#","G","A#"], ["G","A#","D#"], ["A#","D#","G"]],
  ["E", ["E","G#","B"], ["G#","B","E"], ["B","E","G#"]],
  ["F", ["F","A","C"], ["A","C","F"], ["C","F","A"]],
  ["F#", ["F#","A#","C#"], ["A#","C#","F#"], ["C#","F#","A#"]],
  ["G", ["G","B","D"], ["B","D","G"], ["D","G","B"]],
  ["G#", ["G#","C","D#"], ["C","D#","G#"], ["D#","G#","C"]],
  ["A", ["A","C#","E"], ["C#","E","A"], ["E","A","C#"]],
  ["A#", ["A#","D","F"], ["D","F","A#"], ["F","A#","D"]],
  ["B", ["B","D#","F#"], ["D#","F#","B"], ["F#","B","D#"]],
  ["Cm", ["C","D#","G"], ["D#","G","C"], ["G","C","D#"]],
  ["C#m", ["C#","E","G#"], ["E","G#","C#"], ["G#","C#","E"]],
  ["Dm", ["D","F","A"], ["F","A","D"], ["A","D","F"]],
  ["D#m", ["D#","F#","A#"], ["F#","A#","D#"], ["A#","D#","F#"]],
  ["Em", ["E","G","B"], ["G","B","E"], ["B","E","G"]],
  ["Fm", ["F","G#","C"], ["G#","C","F"], ["C","F","G#"]],
  ["F#m", ["F#","A","C#"], ["A","C#","F#"], ["C#","F#","A"]],
  ["Gm", ["G","A#","D"], ["A#","D","G"], ["D","G","A#"]],
  ["G#m", ["G#","B","D#"], ["B","D#","G#"], ["D#","G#","B"]],
  ["Am", ["A","C","E"], ["C","E","A"], ["E","A","C"]],
  ["A#m", ["A#","C#","F"], ["C#","F","A#"], ["F","A#","C#"]],
  ["Bm", ["B","D","F#"], ["D","F#","B"], ["F#","B","D"]]
];

function idxToNote(idx){ return noteNames[(idx-1)%12]; }
function isBlack(idx){
  const m = (idx-1)%12;
  return [1,3,6,8,10].includes(m);
}
function formLabel(name, formIndex){
  if(formIndex===0) return name;
  return name + " rev" + formIndex;
}

const majorSteps = [0,2,4,5,7,9,11];
const minorSteps = [0,2,3,5,7,8,10];
function getScaleNotes(rootIdx, type){
  const steps = type === 'mineur' ? minorSteps : majorSteps;
  return steps.map(s => noteNames[(rootIdx+s)%12]);
}

function scaleIndices(rootIdx, type){
  const steps = type === 'mineur' ? minorSteps : majorSteps;
  const seq = steps.map(s => rootIdx + s + 1);
  seq.push(rootIdx + 12 + 1);
  return seq;
}

// --- Rendu clavier générique : 2 octaves = 24 touches ---
function buildKeyboard(containerEl, onKeyClick){
  containerEl.innerHTML = "";
  const keyEls = {};
  const totalWhite = 14;
  const whiteWidth = 100/totalWhite;
  let whiteCount = 0;

  for(let idx=1; idx<=24; idx++){
    if(!isBlack(idx)){
      const el = document.createElement('div');
      el.className = 'white-key';
      el.style.left = (whiteCount*whiteWidth)+'%';
      el.style.width = whiteWidth+'%';
      el.dataset.idx = idx;
      if(onKeyClick) el.addEventListener('click', ()=>onKeyClick(idx));
      containerEl.appendChild(el);
      keyEls[idx] = el;
      whiteCount++;
    }
  }
  whiteCount = 0;
  for(let idx=1; idx<=24; idx++){
    if(!isBlack(idx)){
      whiteCount++;
    } else {
      const el = document.createElement('div');
      el.className = 'black-key';
      el.style.left = ((whiteCount*whiteWidth) - whiteWidth*0.3)+'%';
      el.style.width = (whiteWidth*0.6)+'%';
      el.dataset.idx = idx;
      if(onKeyClick) el.addEventListener('click', (e)=>{ e.stopPropagation(); onKeyClick(idx); });
      containerEl.appendChild(el);
      keyEls[idx] = el;
    }
  }
  return keyEls;
}

function resetKeyColors(keyEls){
  Object.values(keyEls).forEach(el=>{
    el.classList.remove('selected','correct','reveal','root','wrong');
  });
}

function chordIndices(notes){
  let prevIdx = 0;
  return notes.map(note=>{
    let base = noteNames.indexOf(note)+1;
    let idx = base;
    if(idx <= prevIdx) idx += 12;
    prevIdx = idx;
    return idx;
  });
}

// --- Echantillons piano reels (octaves 3 et 4) ---
const audioCache = {};
function sampleFileForIdx(idx){
  const note = idxToNote(idx);
  const octave = idx<=12 ? 3 : 4;
  return 'sons/octave'+octave+'/note-'+note+octave+'.mp3';
}
function getSampleAudio(idx){
  if(!audioCache[idx]){
    const a = new Audio(sampleFileForIdx(idx));
    a.preload = 'auto';
    audioCache[idx] = a;
  }
  return audioCache[idx];
}
function playNoteIdx(idx, volume){
  const base = getSampleAudio(idx);
  const node = base.cloneNode();
  node.volume = volume===undefined ? 1 : volume;
  node.play().catch(()=>{});
  return node;
}
function playChordNotes(indices){
  indices.forEach(idx=>playNoteIdx(idx));
}

let scaleTimeouts = [];
let scaleNodes = [];
function stopScheduled(){
  scaleTimeouts.forEach(t=>clearTimeout(t));
  scaleNodes.forEach(n=>{ try{ n.pause(); }catch(e){} });
  scaleTimeouts = [];
  scaleNodes = [];
}
function playScaleSound(indices){
  stopScheduled();
  indices.forEach((idx,i)=>{
    const t = setTimeout(()=>{
      const node = playNoteIdx(idx);
      scaleNodes.push(node);
    }, i*140);
    scaleTimeouts.push(t);
  });
}

// --- Sons synthetises (feedback reussite/erreur, pas des notes de piano) ---
let audioCtx = null;
function getCtx(){
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playSuccessSound(){
  const ctx = getCtx();
  const now = ctx.currentTime;
  const freqs = [523.25, 659.25, 783.99, 1046.5];
  freqs.forEach((f,i)=>{
    const t0 = now + i*0.09;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(0.25, t0+0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0+0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0+0.4);
  });
}
function playErrorSound(){
  const ctx = getCtx();
  const now = ctx.currentTime;
  [0, 0.15].forEach(delay=>{
    const t0 = now+delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t0);
    gain.gain.setValueAtTime(0.2, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0+0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0+0.13);
  });
}
