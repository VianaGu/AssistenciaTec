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

  const [pattern, setPattern] = useState(() => parse(value));
  const containerRef = useRef(null);
  const isDrawing = useRef(false);
  const lastDot = useRef(null);
  const dotRefs = useRef([]);

  useEffect(() => {
    setPattern(parse(value));
  }, [value]);

  useImperativeHandle(ref, () => ({
    clear: () => setPattern([]),
    getPattern: () => pattern.slice()
  }), [pattern]);

  const startDrawing = (index, e) => {
    e?.preventDefault();
    if (!pattern.includes(index)) {
      setPattern(prev => [...prev, index]);
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
        setPattern(prev => [...prev, i]);
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
      className={className + " PadraoDesbloqueioAvancado"}
      ref={containerRef}
      onMouseMove={moveDrawing}
      onMouseUp={endDrawing}
      onMouseLeave={endDrawing}
      onTouchMove={moveDrawing}
      onTouchEnd={endDrawing}
      onTouchCancel={endDrawing}
    >
      <div className="grid-cols-3">
        {Array.from({ length: 9 }, (_, i) => {
          const order = pattern.indexOf(i) + 1;
          return (
            <div
              key={i}
              ref={el => dotRefs.current[i] = el}
              onMouseDown={(e) => startDrawing(i, e)}
              onTouchStart={(e) => startDrawing(i, e)}
              className={pattern.includes(i) ? "bg-blue-600" : ""}
            >
              {order > 0 && <span>{order}</span>}
            </div>
          );
        })}
      </div>

      {/* Linhas apenas na impressão */}
      <svg className="line-print">
        {pattern.length > 1 && pattern.map((p, idx, arr) => {
          if (idx === 0) return null;
          const fromRef = dotRefs.current[arr[idx - 1]];
          const toRef = dotRefs.current[arr[idx]];
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
    padraoRef.current?.clear();
  }

  function limparPadraoDesbloqueio(e) {
    e?.preventDefault();
    setForm(s => ({ ...s, padraoDesbloqueio: "" }));
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

    const style = `body{font-family: Arial,Helvetica,sans-serif;padding:20px;color:#111}
      h1{font-size:20px;margin-bottom:8px}
      .row{display:flex;gap:12px}
      .col{flex:1}
      .label{font-weight:600}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      td,th{border:1px solid #ccc;padding:6px;text-align:left}
      .checklist{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
      .small{font-size:12px};`;

    const checklistHtml = Object.entries(checklist)
      .map(([k,v]) => `<div style="display:flex;gap:10px;align-items:center"><div style="width:220px">${k}</div><div><strong>${v==='sim'?'SIM':'NÃO'}</strong></div></div>`).join("");

    const html = `
      <html>
        <head><title>Ordem de Serviço - ${form.nome||""}</title><style>${style}</style></head>
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

      <div className="main-container flex-1 overflow-auto p-4">
        <form className="bg-white p-6 border border-gray-200 w-full max-w-6xl mx-auto space-y-4">

          {/* Dados do cliente */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <label className="block font-semibold">Ordem Nº</label>
              <input type="text" className="border p-1 w-full" value={form.ordemNumero} readOnly />
            </div>
            <div className="col-span-3">
              <label className="block font-semibold">Data</label>
              <input type="date" name="data" value={form.data} onChange={handleFormChange} className="border p-1 w-full"/>
            </div>
            <div className="col-span-6">
              <label className="block font-semibold">Nome</label>
              <input type="text" name="nome" value={form.nome} onChange={handleFormChange} className="border p-1 w-full"/>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <label className="block font-semibold">RG/CPF</label>
              <input type="text" name="rgcpf" value={form.rgcpf} onChange={handleFormChange} className="border p-1 w-full"/>
            </div>
            <div className="col-span-4">
              <label className="block font-semibold">Telefone</label>
              <input type="text" name="telefone" value={form.telefone} onChange={handleFormChange} className="border p-1 w-full"/>
            </div>
            <div className="col-span-4 flex items-center gap-2 mt-6">
              <input type="checkbox" name="whatsapp" checked={form.whatsapp} onChange={handleFormChange}/>
              <label>WhatsApp</label>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <label className="block font-semibold">Endereço</label>
              <input type="text" name="endereco" value={form.endereco} onChange={handleFormChange} className="border p-1 w-full"/>
            </div>
            <div className="col-span-4">
              <label className="block font-semibold">IMEI</label>
              <input type="text" name="imei" value={form.imei} onChange={handleFormChange} className="border p-1 w-full"/>
            </div>
            <div className="col-span-4">
              <label className="block font-semibold">Modelo</label>
              <input type="text" name="modelo" value={form.modelo} onChange={handleFormChange} className="border p-1 w-full"/>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4 mt-4">
            <div className="col-span-6">
              <label className="block font-semibold">Senha de desbloqueio</label>
              <input type="text" name="senhaDesbloqueio" value={form.senhaDesbloqueio} onChange={handleFormChange} className="border p-1 w-full"/>
            </div>
          {/* Padrão de desbloqueio */}
          <div className="col-span-12 mt-4">
            <label className="block font-semibold mb-1">Padrão de desbloqueio</label>
            <PadraoDesbloqueioAvancado
              ref={padraoRef}
              className="PadraoDesbloqueioAvancado"
              value={form.padraoDesbloqueio}
              onChange={val => setForm(f => ({ ...f, padraoDesbloqueio: val }))}
            />
            <br />
            <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded mt-2" onClick={limparPadraoDesbloqueio}>Limpar padrão</button>
          </div>

          {/* Senha, observações e problema relatado */}
          
            <div className="col-span-6">
              <label className="block font-semibold">Assinatura do cliente</label>
              <input type="text" name="assinaturaCliente" value={form.assinaturaCliente} onChange={handleFormChange} className="border p-1 w-full"/>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 mt-4">
            <div className="col-span-6">
              <label className="block font-semibold">Observações</label>
              <textarea name="observacoes" value={form.observacoes} onChange={handleFormChange} className="border p-1 w-full"/>
            </div>
            <div className="col-span-6">
              <label className="block font-semibold">Problema relatado</label>
              <textarea name="problemaRelatado" value={form.problemaRelatado} onChange={handleFormChange} className="border p-1 w-full"/>
            </div>
          </div>

          {/* Checklist */}
          <div className="checklist">
            {initialChecklist.map(item => (
              <div key={item} className="checklist-item, flex items-start gap-2">
                <span className="w-48">{item}</span>
                <br />
                <button
                  type="button"
                  onClick={() => toggleChecklist(item, "sim")}
                  className={`px-2 py-1 rounded ${checklist[item]==="sim"?"bg-green-600 text-white":"bg-gray-200"}`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => toggleChecklist(item, "nâo")}
                  className={`px-2 py-1 rounded ${checklist[item]==="nâo"?"bg-red-600 text-white":"bg-gray-200"}`}
                >
                  Não
                </button>
              </div>
            ))}
          </div>  


          {/* Botões finais */}
          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={openPrintable} className="bg-green-600 text-white px-4 py-2 rounded">Imprimir</button>
            <button type="button" onClick={resetForm} className="bg-gray-600 text-white px-4 py-2 rounded">Nova ordem</button>
          </div>
        </form>
      </div>
    </div>
  );
}
