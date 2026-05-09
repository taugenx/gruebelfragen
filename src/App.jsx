import { useState, useCallback } from "react";

const starterFragen = [
  "Sind Buttermesser eigentlich Streichinstrumente?",
  "Wenn eine Stille laut ist, ist sie dann noch eine Stille?",
  "Ist ein Regenschirm eigentlich ein tragbares Dach?",
  "Warum heißt es Untergeschoss, wenn es unter dem Geschoss liegt?",
  "Wenn man einschläft, ist man dann kurz bewusstlos oder nur sehr entspannt?",
  "Ist eine leere Tüte eigentlich eine Tüte voller Luft?",
  "Warum sagt man 'Ich gehe schlafen' – man geht doch meistens liegen?",
  "Ist ein Fußgänger, der steht, noch ein Fußgänger?",
  "Wenn Wasser nass macht, ist Wasser selbst nass?",
  "Ist ein Kugelschreiber nur ein Stift mit Selbstvertrauen?",
  "Kann man etwas vermissen, das man noch nie hatte?",
  "Ist ein Schweigen auf eine Frage nicht auch eine Antwort?",
  "Wenn man von zu Hause wegläuft, wo läuft man dann hin?",
  "Warum heißen sie Fingernägel, wenn man sie nicht einschlägt?",
  "Ist ein Spiegel das einzige Objekt, das immer die Wahrheit sagt?",
  "Wenn man sich beeilt zu entspannen – entspannt man sich dann wirklich?",
  "Warum heißt es Handschuh, wenn man ihn mit Fingern trägt?",
  "Ist eine To-do-Liste, die man nie abarbeitet, eine Wunschliste?",
  "Ist ein Gähnen ansteckend, wenn man es liest?",
  "Ist ein Parkplatz ohne Autos einfach ein Platz?",
  "Ist Stille die lauteste Antwort auf eine dumme Frage?",
  "Wenn man morgen wartet – kommt es dann heute?",
];

const themes = [
  { bg: "#FF6B6B", accent: "#FFE66D", text: "#1a1a2e", face: "😲", pattern: "circles" },
  { bg: "#4ECDC4", accent: "#FF6B6B", text: "#1a1a2e", face: "🤔", pattern: "zigzag" },
  { bg: "#FFE66D", accent: "#FF6B6B", text: "#1a1a2e", face: "🧐", pattern: "dots" },
  { bg: "#A8E6CF", accent: "#FF8B94", text: "#1a1a2e", face: "😵", pattern: "stripes" },
  { bg: "#C3A6FF", accent: "#FFE66D", text: "#1a1a2e", face: "🤯", pattern: "circles" },
  { bg: "#FF8B94", accent: "#C3A6FF", text: "#1a1a2e", face: "😏", pattern: "zigzag" },
  { bg: "#FFC75F", accent: "#4ECDC4", text: "#1a1a2e", face: "🙃", pattern: "dots" },
];

const STORAGE_KEY = "gruebelfragen_archive";
function loadArchive() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
function saveArchive(arr) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch {} }

// ── Canvas helpers ────────────────────────────────────────────────
function drawPatternCanvas(ctx, type, color, W, H) {
  ctx.save(); ctx.globalAlpha = 0.13; ctx.strokeStyle = color; ctx.fillStyle = color;
  if (type === "dots") {
    for (let x = 15; x < W; x += 30) for (let y = 15; y < H; y += 30) { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill(); }
  } else if (type === "circles") {
    ctx.lineWidth = 4;
    for (let x = 20; x < W; x += 40) for (let y = 20; y < H; y += 40) { ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI*2); ctx.stroke(); }
  } else if (type === "stripes") {
    ctx.lineWidth = 9;
    for (let i = -H; i < W+H; i += 22) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i+H,H); ctx.stroke(); }
  } else if (type === "zigzag") {
    ctx.lineWidth = 4;
    for (let y = 10; y < H; y += 22) { ctx.beginPath(); for (let x = 0; x < W; x += 40) { ctx.moveTo(x,y+10); ctx.lineTo(x+20,y-10); ctx.lineTo(x+40,y+10); } ctx.stroke(); }
  }
  ctx.restore();
}

function rrPath(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r); ctx.lineTo(x+r,y+h);
  ctx.arcTo(x,y+h,x,y+h-r,r); ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
}

function wrapText(ctx, text, cx, cy, maxW, lineH) {
  const words = text.split(" "); let line = ""; const lines = [];
  for (const w of words) { const t = line ? line+" "+w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line=w; } else line=t; }
  if (line) lines.push(line);
  const startY = cy - ((lines.length-1)*lineH)/2;
  lines.forEach((l,i) => ctx.fillText(l, cx, startY+i*lineH));
}

// Standalone function — no hook, no closure issues
async function buildCardImage(text, themeIdx, dateStr) {
  const W=800, H=800;
  const canvas = document.createElement("canvas");
  canvas.width=W; canvas.height=H;
  const ctx = canvas.getContext("2d");
  const t = themes[themeIdx % themes.length];

  // Shadow
  ctx.fillStyle = t.text; rrPath(ctx,14,14,W-14,H-14,40); ctx.fill();
  // BG
  ctx.fillStyle = t.bg; rrPath(ctx,0,0,W-14,H-14,40); ctx.fill();
  // Pattern + blobs (clipped)
  ctx.save(); rrPath(ctx,0,0,W-14,H-14,40); ctx.clip();
  drawPatternCanvas(ctx,t.pattern,t.text,W,H);
  ctx.globalAlpha=0.45; ctx.fillStyle=t.accent;
  ctx.beginPath(); ctx.arc(W-14,H-14,110,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(0,0,70,0,Math.PI*2); ctx.fill();
  ctx.restore();
  // Border
  ctx.strokeStyle=t.text; ctx.lineWidth=8; rrPath(ctx,4,4,W-22,H-22,38); ctx.stroke();
  // Label pill
  ctx.font="bold 26px sans-serif";
  const label="GRÜBELFRAGE DES TAGES";
  const lw=ctx.measureText(label).width+52;
  ctx.fillStyle=t.text; rrPath(ctx,(W-14)/2-lw/2,50,lw,50,25); ctx.fill();
  ctx.fillStyle=t.bg; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(label,(W-14)/2,76);
  // Emoji
  ctx.font="150px serif"; ctx.fillStyle=t.text;
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(t.face,(W-14)/2,270);
  // Question
  ctx.fillStyle=t.text;
  const fs=text.length>65?44:text.length>45?50:56;
  ctx.font=`bold ${fs}px sans-serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
  wrapText(ctx,text,(W-14)/2,510,W-100,fs*1.4);
  // Date
  ctx.font="bold 24px sans-serif"; ctx.fillStyle=t.text; ctx.globalAlpha=0.5;
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(dateStr,(W-14)/2,H-58);

  return canvas;
}

async function saveCard(text, themeIdx, dateStr, showToast) {
  try {
    const canvas = await buildCardImage(text, themeIdx, dateStr);
    const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gruebelfrage.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("📸 Gespeichert! Jetzt in WhatsApp Status einfügen.");
  } catch(e) {
    showToast("Fehler: " + e.message);
  }
}

// ── SVG pattern for preview card ─────────────────────────────────
function PatternSVG({ type, color }) {
  return (
    <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.13,pointerEvents:"none"}}>
      {type==="dots"&&<><defs><pattern id="p" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="4" fill={color}/></pattern></defs><rect width="100%" height="100%" fill="url(#p)"/></>}
      {type==="circles"&&<><defs><pattern id="p" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="14" fill="none" stroke={color} strokeWidth="3"/></pattern></defs><rect width="100%" height="100%" fill="url(#p)"/></>}
      {type==="stripes"&&<><defs><pattern id="p" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="20" fill={color}/></pattern></defs><rect width="100%" height="100%" fill="url(#p)"/></>}
      {type==="zigzag"&&<><defs><pattern id="p" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse"><polyline points="0,20 20,0 40,20" fill="none" stroke={color} strokeWidth="3"/></pattern></defs><rect width="100%" height="100%" fill="url(#p)"/></>}
    </svg>
  );
}

// ── Mini card for archive grid ────────────────────────────────────
function MiniCard({ item, dateStr, onShare, onRemove }) {
  const t = themes[item.themeIdx % themes.length];
  return (
    <div style={{position:"relative",borderRadius:"16px",background:t.bg,border:`3px solid ${t.text}`,boxShadow:`4px 4px 0 ${t.text}`,overflow:"hidden",padding:"14px 12px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",minHeight:"140px"}}>
      <PatternSVG type={t.pattern} color={t.text}/>
      <div style={{fontSize:"28px",zIndex:1}}>{t.face}</div>
      <div style={{fontFamily:"'Fredoka One',cursive",fontSize:"12px",color:t.text,textAlign:"center",lineHeight:1.35,zIndex:1,flexGrow:1}}>{item.text}</div>
      <div style={{display:"flex",gap:"6px",zIndex:1,marginTop:"4px"}}>
        <button onClick={()=>onShare(item)} style={{fontFamily:"'Fredoka One',cursive",fontSize:"11px",background:t.text,color:t.bg,border:"none",borderRadius:"20px",padding:"4px 10px",cursor:"pointer"}}>📤</button>
        <button onClick={()=>onRemove(item.id)} style={{fontFamily:"'Fredoka One',cursive",fontSize:"11px",background:"rgba(0,0,0,0.15)",color:t.text,border:"none",borderRadius:"20px",padding:"4px 10px",cursor:"pointer"}}>✕</button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(),0,0)) / 86400000);
  const dateStr = today.toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"});

  const [fragen, setFragen] = useState(starterFragen);
  const [current, setCurrent] = useState(dayOfYear % starterFragen.length);
  const [archive, setArchive] = useState(loadArchive);
  const [view, setView] = useState("main");
  const [sharing, setSharing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState("");

  const theme = themes[current % themes.length];
  const isArchived = archive.some(a => a.text === fragen[current]);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  const go = (dir) => {
    setConfirmDelete(false);
    setCurrent(c => { const n=c+dir; if(n<0) return fragen.length-1; if(n>=fragen.length) return 0; return n; });
    setBounce(true); setTimeout(()=>setBounce(false),350);
  };

  const handleArchive = () => {
    const text = fragen[current];
    if (archive.find(a=>a.text===text)) { showToast("Schon im Archiv! ⭐"); return; }
    const entry = { id:Date.now(), text, themeIdx:current%themes.length, archivedAt:dateStr };
    const next = [entry, ...archive];
    setArchive(next); saveArchive(next); showToast("⭐ Archiviert!");
  };

  const removeFromArchive = (id) => {
    const next = archive.filter(a=>a.id!==id);
    setArchive(next); saveArchive(next); showToast("Aus Archiv entfernt");
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(()=>setConfirmDelete(false),3000); return; }
    if (fragen.length<=1) { showToast("Mindestens eine Frage muss bleiben!"); setConfirmDelete(false); return; }
    setFragen(prev=>{ const n=[...prev]; n.splice(current,1); return n; });
    setCurrent(c=>Math.min(c,fragen.length-2));
    setConfirmDelete(false); showToast("🗑️ Frage gelöscht");
  };

  const generateNew = async () => {
    setGenerating(true);
    try {
      const existing = fragen.join(" | ");
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ existing }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 120)}`);
      }
      const data = await res.json();
      const raw = data.content?.find(b => b.type === "text")?.text || "[]";
      const newFragen = JSON.parse(raw.replace(/```json|```/g, "").trim());
      if (Array.isArray(newFragen) && newFragen.length > 0) {
        const insertAt = fragen.length;
        setFragen(prev => [...prev, ...newFragen]);
        setCurrent(insertAt);
        showToast(`✨ ${newFragen.length} neue Fragen!`);
      } else {
        showToast("❌ Keine Fragen erhalten");
      }
    } catch (e) {
      showToast("❌ Fehler: " + (e.message || "Generierung fehlgeschlagen"));
    }
    setGenerating(false);
  };

  const handleShare = async () => {
    setSharing(true);
    await saveCard(fragen[current], current % themes.length, dateStr, showToast);
    setSharing(false);
  };

  const handleArchiveShare = async (item) => {
    await saveCard(item.text, item.themeIdx, dateStr, showToast);
  };

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700&display=swap');
    * { box-sizing:border-box; }
    .card{cursor:pointer;user-select:none;transition:transform 0.15s ease;}
    .card:active{transform:scale(0.97);}
    .card.bounce{animation:pop 0.35s ease;}
    @keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.04)}100%{transform:scale(1)}}
    .btn{transition:transform 0.12s ease;cursor:pointer;border:none;}
    .btn:hover{transform:translateY(-2px) scale(1.03);}
    .btn:active{transform:scale(0.95);}
    .icobtn{transition:all 0.2s ease;cursor:pointer;border:none;}
    .icobtn:active{transform:scale(0.88);}
    .toast{position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#fff;color:#1a1a2e;padding:10px 22px;border-radius:30px;font-family:'Nunito',sans-serif;font-weight:700;font-size:14px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:99;white-space:nowrap;}
  `;

  // ── Archive view ────────────────────────────────────────────────
  if (view==="archive") return (
    <div style={{minHeight:"100vh",background:"#1a1a2e",display:"flex",flexDirection:"column",padding:"24px 16px",gap:"16px"}}>
      <style>{CSS}</style>
      {toast&&<div className="toast">{toast}</div>}
      <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
        <button className="btn" onClick={()=>setView("main")} style={{fontFamily:"'Fredoka One',cursive",fontSize:"15px",background:"rgba(255,255,255,0.1)",color:"#fff",border:"2px solid rgba(255,255,255,0.2)",borderRadius:"50px",padding:"8px 18px"}}>← Zurück</button>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:"22px",color:"#fff"}}>⭐ Archiv <span style={{fontSize:"14px",opacity:0.5}}>({archive.length})</span></div>
      </div>
      {archive.length===0
        ? <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"12px"}}>
            <div style={{fontSize:"60px"}}>📭</div>
            <div style={{fontFamily:"'Fredoka One',cursive",color:"rgba(255,255,255,0.4)",fontSize:"18px",textAlign:"center"}}>Noch nichts archiviert.<br/>Tippe auf ☆ um Karten zu speichern.</div>
          </div>
        : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:"12px"}}>
            {archive.map(item=><MiniCard key={item.id} item={item} dateStr={dateStr} onShare={handleArchiveShare} onRemove={removeFromArchive}/>)}
          </div>
      }
    </div>
  );

  // ── Main view ───────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:"#1a1a2e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px",gap:"16px"}}>
      <style>{CSS}</style>
      {toast&&<div className="toast">{toast}</div>}

      {/* Archive button top right */}
      <div style={{position:"fixed",top:"16px",right:"16px",zIndex:20}}>
        <button className="btn" onClick={()=>setView("archive")} style={{fontFamily:"'Fredoka One',cursive",fontSize:"13px",background:"rgba(255,255,255,0.12)",color:"#fff",border:"2px solid rgba(255,255,255,0.2)",borderRadius:"50px",padding:"7px 14px"}}>
          ⭐ Archiv{archive.length>0?` (${archive.length})`:""}
        </button>
      </div>

      {/* Card */}
      <div className={`card${bounce?" bounce":""}`} onClick={()=>{if(!confirmDelete)go(1);}}
        style={{width:"min(340px,92vw)",minHeight:"390px",borderRadius:"28px",background:theme.bg,border:`5px solid ${theme.text}`,boxShadow:`8px 8px 0px ${theme.text}`,position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",padding:"26px 22px 20px"}}>
        <PatternSVG type={theme.pattern} color={theme.text}/>
        <div style={{position:"absolute",bottom:"-28px",right:"-28px",width:"110px",height:"110px",borderRadius:"50%",background:theme.accent,opacity:0.45,border:`4px solid ${theme.text}`}}/>
        <div style={{position:"absolute",top:"-18px",left:"-18px",width:"72px",height:"72px",borderRadius:"50%",background:theme.accent,opacity:0.4,border:`3px solid ${theme.text}`}}/>

        {/* ✕ delete */}
        <button className="icobtn" onClick={handleDeleteClick}
          style={{position:"absolute",top:"12px",right:"12px",width:confirmDelete?"auto":"32px",height:"32px",borderRadius:"20px",background:confirmDelete?"#FF3B30":"rgba(0,0,0,0.18)",color:"#fff",fontFamily:"'Fredoka One',cursive",fontSize:confirmDelete?"13px":"16px",padding:confirmDelete?"0 12px":"0",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10,boxShadow:confirmDelete?"0 2px 8px rgba(255,59,48,0.5)":"none"}}>
          {confirmDelete?"Löschen?":"✕"}
        </button>

        {/* ☆ archive */}
        <button className="icobtn" onClick={e=>{e.stopPropagation();handleArchive();}}
          style={{position:"absolute",top:"12px",left:"12px",width:"32px",height:"32px",borderRadius:"50%",background:isArchived?"rgba(255,200,0,0.5)":"rgba(0,0,0,0.18)",color:isArchived?"#FFD700":"#fff",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10}}>
          {isArchived?"⭐":"☆"}
        </button>

        <div style={{background:theme.text,color:theme.bg,fontFamily:"'Fredoka One',cursive",fontSize:"11px",letterSpacing:"1.5px",padding:"5px 16px",borderRadius:"20px",zIndex:1,textTransform:"uppercase"}}>Grübelfrage des Tages</div>
        <div style={{fontSize:"66px",zIndex:1,lineHeight:1}}>{theme.face}</div>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:fragen[current].length>60?"19px":"23px",color:theme.text,textAlign:"center",lineHeight:1.4,zIndex:1,padding:"0 4px"}}>{fragen[current]}</div>
        <div style={{fontFamily:"'Nunito',sans-serif",fontSize:"11px",fontWeight:"700",color:theme.text,opacity:0.5,zIndex:1}}>{dateStr}</div>
      </div>

      <div style={{color:"rgba(255,255,255,0.3)",fontSize:"12px",fontFamily:"'Nunito',sans-serif"}}>{current+1} / {fragen.length}</div>

      {/* Nav */}
      <div style={{display:"flex",gap:"10px"}}>
        <button className="btn" onClick={()=>go(-1)} style={{fontFamily:"'Fredoka One',cursive",fontSize:"16px",background:"rgba(255,255,255,0.1)",color:"#fff",border:"3px solid rgba(255,255,255,0.2)",borderRadius:"50px",padding:"11px 22px"}}>← Zurück</button>
        <button className="btn" onClick={()=>go(1)} style={{fontFamily:"'Fredoka One',cursive",fontSize:"16px",background:theme.bg,color:theme.text,border:`3px solid #1a1a2e`,boxShadow:"4px 4px 0px #1a1a2e",borderRadius:"50px",padding:"11px 22px"}}>Weiter →</button>
      </div>

      {/* Actions */}
      <div style={{display:"flex",gap:"10px",flexWrap:"wrap",justifyContent:"center"}}>
        <button className="btn" onClick={generateNew} disabled={generating} style={{fontFamily:"'Fredoka One',cursive",fontSize:"15px",background:generating?"#333":"#7C3AED",color:"#fff",border:"3px solid #1a1a2e",boxShadow:"4px 4px 0px #1a1a2e",borderRadius:"50px",padding:"11px 22px",opacity:generating?0.6:1}}>
          {generating?"⏳ Generiert...":"✨ Neue Fragen"}
        </button>
        <button className="btn" onClick={handleShare} disabled={sharing} style={{fontFamily:"'Fredoka One',cursive",fontSize:"15px",background:sharing?"#333":"#25D366",color:"#fff",border:"3px solid #1a1a2e",boxShadow:"4px 4px 0px #1a1a2e",borderRadius:"50px",padding:"11px 22px",opacity:sharing?0.6:1}}>
          {sharing?"⏳ Lädt...":"📸 Bild speichern"}
        </button>
      </div>

      <div style={{color:"rgba(255,255,255,0.2)",fontSize:"11px",fontFamily:"'Nunito',sans-serif"}}>Karte antippen = nächste Frage</div>
    </div>
  );
}
