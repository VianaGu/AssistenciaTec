import React, { useState, useEffect, useRef, useImperativeHandle } from "react";
import './App.css';

const PadraoDesbloqueioAvancado = React.forwardRef(({ value, onChange, className = "" }, ref) => {
  const parse = (val) => {
    if (!val) return [];
    return val.split("-").map(s => {
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    }).filter(x => x !== null);
  };

  const buildLinesFromPattern = (p) => {
    const l = [];
    for (let i = 1; i < p.length; i++) l.push({ from: p[i - 1], to: p[i] });
    return l;
  };

  const [pattern, setPattern] = useState(() => parse(value));
  const [lines, setLines] = useState(() => buildLinesFromPattern(parse(value)));
  const containerRef = useRef(null);
  const isDrawing = useRef(false);
  const lastDot = useRef(null);
  const dotRefs = useRef([]);

  // Sincroniza prop -> estado interno (robusto contra valores vazios)
  useEffect(() => {
    const p = parse(value);
    setPattern(p);
    setLines(buildLinesFromPattern(p));
  }, [value]);

  // expõe método clear para o pai
  useImperativeHandle(ref, () => ({
    clear: () => {
      setPattern([]);
      setLines([]);
    },
    getPattern: () => pattern.slice()
  }), [pattern]);

  const startDrawing = (index, e) => {
    e?.preventDefault();
    if (!pattern.includes(index)) {
      setPattern(prev => [...prev, index]);
      if (lastDot.current != null) {
        setLines(prev => [...prev, { from: lastDot.current, to: index }]);
      }
      lastDot.current = index;
      isDrawing.current = true;
    }
  };

  const moveDrawing = (event) => {
    if (!isDrawing.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
    const y = (event.touches ? event.touches[0].clientY : event.clientY) - rect.top;

    dotRefs.current.forEach((dot, i) => {
      if (!dot) return;
      const dotRect = dot.getBoundingClientRect();
      const dotX = dotRect.left + dotRect.width / 2 - rect.left;
      const dotY = dotRect.top + dotRect.height / 2 - rect.top;
      const distance = Math.hypot(dotX - x, dotY - y);
      if (distance < 20 && !pattern.includes(i)) {
        setPattern(prev => {
          const next = [...prev, i];
          return next;
        });
        setLines(prev => [...prev, { from: lastDot.current, to: i }]);
        lastDot.current = i;
      }
    });
  };

  const endDrawing = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      lastDot.current = null;
      onChange && onChange(pattern.join("-"));
    }
  };

  return (
    <div
      className={className + " relative grid grid-cols-3 gap-2 select-none"}
      ref={containerRef}
      onMouseMove={moveDrawing}
      onMouseUp={endDrawing}
      onMouseLeave={endDrawing}
      onTouchMove={moveDrawing}
      onTouchEnd={endDrawing}
      onTouchCancel={endDrawing}
    >
      {Array.from({ length: 9 }, (_, i) => {
        const order = pattern.indexOf(i) + 1;
        return (
          <div
            key={i}
            ref={el => dotRefs.current[i] = el}
            onMouseDown={(e) => startDrawing(i, e)}
            onTouchStart={(e) => startDrawing(i, e)}
            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer ${
              pattern.includes(i) ? "bg-blue-600 text-white" : "bg-white text-black"
            }`}
          >
            {order > 0 && <span className="text-xs font-bold">{order}</span>}
          </div>
        );
      })}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {lines.map((line, idx) => {
          const fromRef = dotRefs.current[line.from];
          const toRef = dotRefs.current[line.to];
          if (!fromRef || !toRef || !containerRef.current) return null;
          const rect = containerRef.current.getBoundingClientRect();
          const fromRect = fromRef.getBoundingClientRect();
          const toRect = toRef.getBoundingClientRect();
          const x1 = fromRect.left + fromRect.width / 2 - rect.left;
          const y1 = fromRect.top + fromRect.height / 2 - rect.top;
          const x2 = toRect.left + toRect.width / 2 - rect.left;
          const y2 = toRect.top + toRect.height / 2 - rect.top;
          return <line key={idx} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />;
        })}
      </svg>
    </div>
  );
});

export default function AssistenciaTecnicaForm() {
  const initialChecklist = [
    "Tela display", "Touch screen tela", "Teclas", "Sensores de proximidade",
    "Bluetooth", "Wifi", "Ligações", "Alto falante", "Audio auricular",
    "Microfone", "Câmera", "Conector de carga", "Conector de cartão de memória",
    "Conector de fone de ouvido", "Biometria", "Face ID"
  ];

  const [form, setForm] = useState({
    ordemNumero: "", nome: "", rgcpf: "", telefone: "", endereco: "",
    whatsapp: false, imei: "", modelo: "", padraoDesbloqueio: "",
    senhaDesbloqueio: "", observacoes: "", problemaRelatado: "",
    assinaturaCliente: "", data: ""
  });

  const [checklist, setChecklist] = useState(
    initialChecklist.reduce((acc, key) => { acc[key] = "nâo"; return acc; }, {})
  );

  const padraoRef = useRef(null);

  useEffect(() => {
    const lastOrder = parseInt(localStorage.getItem("lastOrderNumber") || "0", 10);
    const newOrder = lastOrder + 1;
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];

    setForm(s => ({ ...s, ordemNumero: String(newOrder), data: formattedDate }));
    localStorage.setItem("lastOrderNumber", String(newOrder));
  }, []);

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(s => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  }

  function toggleChecklist(item, value) {
    setChecklist(s => ({ ...s, [item]: value }));
  }

  function resetForm() {
    const lastOrder = parseInt(localStorage.getItem("lastOrderNumber") || "0", 10);
    const newOrder = lastOrder + 1;
    setForm({
      ordemNumero: String(newOrder), nome: "", rgcpf: "", telefone: "",
      endereco: "", whatsapp: false, imei: "", modelo: "", padraoDesbloqueio: "",
      senhaDesbloqueio: "", observacoes: "", problemaRelatado: "",
      assinaturaCliente: "", data: ""
    });
    localStorage.setItem("lastOrderNumber", String(newOrder));
    setChecklist(initialChecklist.reduce((acc, key) => { acc[key] = "nâo"; return acc; }, {}));
    // limpa também o componente do padrão
    padraoRef.current?.clear();
  }

  function limparPadraoDesbloqueio(e) {
    e?.preventDefault();
    setForm(s => ({ ...s, padraoDesbloqueio: "" }));
    // chama clear diretamente no componente filho (mais confiável)
    padraoRef.current?.clear();
  }

  function openPrintable() {
    const win = window.open("", "_blank");
    if (!win) { alert("Pop-up bloqueado. Permita pop-ups para imprimir."); return; }

    const desenharPadrao = () => {
      if (!form.padraoDesbloqueio) return "Não preenchido";
      const indices = form.padraoDesbloqueio.split("-").map(Number);
      const gridSize = 3;
      const spacing = 30;
      const radius = 10;
      let svgCircles = "", svgLines = "";
      const coords = Array.from({ length: 9 }, (_, i) => {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        return { x: col * spacing + spacing, y: row * spacing + spacing };
      });

      for (let i = 1; i < indices.length; i++) {
        const from = coords[indices[i - 1]];
        const to = coords[indices[i]];
        svgLines += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#2563eb" stroke-width="3" stroke-linecap="round" />`;
      }

      coords.forEach((c, i) => {
        const order = indices.indexOf(i) + 1;
        if (order > 0) {
          svgCircles += `<circle cx="${c.x}" cy="${c.y}" r="${radius}" fill="#2563eb" />
                         <text x="${c.x}" y="${c.y + 4}" font-size="10" text-anchor="middle" fill="white" font-weight="bold">${order}</text>`;
        } else {
          svgCircles += `<circle cx="${c.x}" cy="${c.y}" r="${radius}" fill="white" stroke="#ccc" stroke-width="2"/>`;
        }
      });

      return `<svg width="${spacing*gridSize+spacing}" height="${spacing*gridSize+spacing}">${svgLines}${svgCircles}</svg>`;
    };

    const style = `
      body{font-family: Arial,Helvetica,sans-serif;padding:20px;color:#111}
      h1{font-size:20px;margin-bottom:8px}
      .row{display:flex;gap:12px}
      .col{flex:1}
      .label{font-weight:600}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      td,th{border:1px solid #ccc;padding:6px;text-align:left}
      .checklist{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
      .small{font-size:12px;}
    `;

    const checklistHtml = Object.entries(checklist)
      .map(([k,v]) => `<div style="display:flex;gap:10px;align-items:center"><div style="width:220px">${k}</div><div><strong>${v==='sim'?'SIM':'NÃO'}</strong></div></div>`).join("");

    const html = `
      <html>
        <head><title>Ordem de Serviço - ${form.nome||"sem-nome"}</title><style>${style}</style></head>
        <body>
          <h1>ASSISTÊNCIA TÉCNICA</h1>
          <div class="row">
            <div class="col"><span class="label">Ordem Nº:</span> ${form.ordemNumero}</div>
            <div class="col"><span class="label">Data:</span> ${form.data}</div>
          </div>
          <table>
            <tr><td class="label">Nome</td><td>${form.nome}</td></tr>
            <tr><td class="label">RG/CPF</td><td>${form.rgcpf}</td></tr>
            <tr><td class="label">Telefone</td><td>${form.telefone} ${form.whatsapp?'(WhatsApp)':''}</td></tr>
            <tr><td class="label">Endereço</td><td>${form.endereco}</td></tr>
            <tr><td class="label">IMEI</td><td>${form.imei}</td></tr>
            <tr><td class="label">Modelo</td><td>${form.modelo}</td></tr>
            <tr><td class="label">Senha de desbloqueio</td><td>${form.senhaDesbloqueio}</td></tr>
            <tr><td class="label">Padrão de desbloqueio</td><td>${desenharPadrao()}</td></tr>
          </table>
          <h2>Checklist</h2>
          <div class="checklist">${checklistHtml}</div>
          <h2>Observações</h2><div class="small">${(form.observacoes||"").replace(/\n/g,"<br>")}</div>
          <h2>Problema relatado</h2><div class="small">${(form.problemaRelatado||"").replace(/\n/g,"<br>")}</div>
          <div style="margin-top:24px">Assinatura do cliente: _________________________</div>
        </body>
      </html>
    `;

    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(()=>{win.print();},300);
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gradient-to-r from-blue-800 to-indigo-700 text-white p-4 rounded-t">
        <h1 className="text-2xl font-bold">ASSISTÊNCIA TÉCNICA</h1>
        <p className="text-sm">Ordem de serviço</p>
      </header>

      <div className="main-container">
        <form className="bg-white p-6 border border-gray-200 w-full max-w-6xl">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <label className="block text-sm font-semibold">Ordem Nº</label>
              <input name="ordemNumero" value={form.ordemNumero} readOnly className="w-full border rounded p-2 bg-gray-100" />
            </div>
            <div className="col-span-3">
              <label className="block text-sm font-semibold">Data</label>
              <input type="date" name="data" value={form.data} onChange={handleFormChange} className="w-full border rounded p-2" />
            </div>
            <div className="col-span-6">
              <label className="block text-sm font-semibold">Nome</label>
              <input name="nome" value={form.nome} onChange={handleFormChange} className="w-full border rounded p-2" />
            </div>

            <div className="col-span-4">
              <label className="block text-sm font-semibold">RG/CPF</label>
              <input name="rgcpf" value={form.rgcpf} onChange={handleFormChange} className="w-full border rounded p-2" />
            </div>
            <div className="col-span-4">
              <label className="block text-sm font-semibold">Telefone</label>
              <input name="telefone" value={form.telefone} onChange={handleFormChange} className="w-full border rounded p-2" />
            </div>
            <div className="col-span-4 flex items-end">
              <label className="inline-flex items-center gap-2">
                <span className="text-sm">É WhatsApp?</span>
                <input id="Whatsapp-checkbox" type="checkbox" name="whatsapp" checked={form.whatsapp} onChange={handleFormChange} />
              </label>
            </div>

            <div className="col-span-12">
              <label className="block text-sm font-semibold">Endereço</label>
              <input name="endereco" value={form.endereco} onChange={handleFormChange} className="w-full border rounded p-2" />
            </div>

            <div className="col-span-6">
              <label className="block text-sm font-semibold">IMEI</label>
              <input name="imei" value={form.imei} onChange={handleFormChange} className="w-full border rounded p-2" />
            </div>
            <div className="col-span-6">
              <label className="block text-sm font-semibold">Modelo</label>
              <input name="modelo" value={form.modelo} onChange={handleFormChange} className="w-full border rounded p-2" />
            </div>

            <div className="col-span-6">
              <label className="block text-sm font-semibold">Senha de desbloqueio</label>
              <input name="senhaDesbloqueio" value={form.senhaDesbloqueio} onChange={handleFormChange} className="w-full border rounded p-2" />
            </div>
            <div className="col-span-6">
              <label className="block text-sm font-semibold">Padrão de desbloqueio</label>
              <PadraoDesbloqueioAvancado
                ref={padraoRef}
                className="PadraoDesbloqueioAvancado"
                value={form.padraoDesbloqueio}
                onChange={val => setForm(f => ({ ...f, padraoDesbloqueio: val }))}
              />
              <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded mt-2" onClick={limparPadraoDesbloqueio}>Limpar padrão</button>
            </div>

            <div className="col-span-12">
              <h2 className="font-semibold text-lg mt-2">Checklist</h2>
              <div className="checklist">
                {initialChecklist.map(item => (
                  <div key={item} className="flex items-center gap-3 py-1">
                    <div>{item}</div>
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name={item} checked={checklist[item]==='sim'} onChange={()=>toggleChecklist(item,'sim')} />SIM
                    </label>
                    <label className="inline-flex items-center gap-2 ml-4">
                      <input type="radio" name={item} checked={checklist[item]==='nâo'} onChange={()=>toggleChecklist(item,'nâo')} />NÃO
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-12">
              <label className="block text-sm font-semibold">Observações gerais sobre o equipamento</label>
              <textarea name="observacoes" value={form.observacoes} onChange={handleFormChange} className="w-full border rounded p-2 h-24" />
            </div>

            <div className="col-span-12">
              <label className="block text-sm font-semibold">Problema relatado</label>
              <textarea name="problemaRelatado" value={form.problemaRelatado} onChange={handleFormChange} className="w-full border rounded p-2 h-20" />
            </div>

            <div className="col-span-6">
              <label className="block text-sm font-semibold">Assinatura do cliente</label>
              <input name="assinaturaCliente" value={form.assinaturaCliente} onChange={handleFormChange} className="w-full border rounded p-2" />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={openPrintable} className="bg-green-600 text-white px-4 py-2 rounded">Imprimir</button>
            <button type="button" onClick={resetForm} className="bg-gray-600 text-white px-4 py-2 rounded">Nova ordem</button>
          </div>
        </form>
      </div>
    </div>
  );
}
