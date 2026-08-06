import { useState, useMemo } from "react";

const MESES    = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_ES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DIAS     = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const HOY      = new Date();
const ANIO_ACTUAL = HOY.getFullYear();
const CLAVE_DEFAULT = "termocarga2025";

function calcular(v, pF, pC){ const f=v*(1-pF/100); return {f, c:f*(1-pC/100)}; }
function fmt(n){ return "$"+Math.round(n).toLocaleString("es-CO"); }
function quinceTexto(r){ return r.quincena+"ª Q de "+MESES[r.mes]+" "+r.anio; }

let uid=0;
function mkReg(placa,q,mes,anio,v,pF,pC){
  uid++;
  const {f,c}=calcular(v,pF,pC);
  return {id:uid,placa,quincena:q,mes,anio,valorViajes:v,valorFactura:f,valorConsignar:c,pF,pC};
}

const DEMO=[
  mkReg("SNY-322",1,3,2025,5900194,8.2,1.8), mkReg("SNY-322",2,3,2025,6120000,8.2,1.8),
  mkReg("SNY-322",1,4,2025,6300000,8.2,1.8), mkReg("ABC-123",1,3,2025,4800000,8.2,1.8),
  mkReg("ABC-123",2,3,2025,5100000,8.2,1.8), mkReg("XYZ-789",1,2,2025,3900000,8.2,1.8),
  mkReg("TRK-456",1,1,2024,7200000,8.2,1.8), mkReg("TRK-456",2,1,2024,6800000,8.2,1.8),
];

function imprimirPDF(placa, registros){
  const total={v:0,f:0,c:0};
  registros.forEach(r=>{total.v+=r.valorViajes;total.f+=r.valorFactura;total.c+=r.valorConsignar;});
  const filas=registros.map((r,i)=>`
    <tr style="background:${i%2===0?"#fff":"#f9f9f9"}">
      <td>${quinceTexto(r)}</td>
      <td style="text-align:right">${fmt(r.valorViajes)}</td>
      <td style="text-align:right;color:#c85000">${r.pF}%</td>
      <td style="text-align:right;color:#c85000">${fmt(r.valorFactura)}</td>
      <td style="text-align:right;color:#006b2e">${r.pC}%</td>
      <td style="text-align:right;color:#006b2e;font-weight:700">${fmt(r.valorConsignar)}</td>
    </tr>`).join("");
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Historial ${placa}</title>
  <style>body{font-family:Arial,sans-serif;margin:24px;color:#222;font-size:12px}h1{color:#cc0000;font-size:20px;margin:0}.sub{color:#888;font-size:11px;margin-bottom:20px}table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#cc0000;color:#fff;padding:8px 10px;text-align:center;font-size:11px}td{padding:7px 10px;border-bottom:1px solid #eee;font-size:11px}.totals td{font-weight:700;background:#f0f0f0;border-top:2px solid #cc0000}.footer{margin-top:24px;font-size:10px;color:#aaa;text-align:center}.badge{display:inline-block;background:#cc0000;color:#fff;border-radius:6px;padding:2px 10px;font-size:13px;font-weight:700;margin-right:8px}</style>
  </head><body>
  <div style="display:flex;align-items:center;margin-bottom:4px"><span style="font-size:28px;margin-right:10px">🚛</span><div><h1>TERMO CARGA</h1><div class="sub">Historial de Pagos – ${HOY.getDate()} de ${MESES_ES[HOY.getMonth()]} de ${ANIO_ACTUAL}</div></div></div>
  <div style="margin-bottom:16px"><span class="badge">PLACA</span><span style="font-size:18px;font-weight:700">${placa}</span><span style="margin-left:16px;color:#888">${registros.length} liquidación(es)</span></div>
  <table><thead><tr><th>QUINCENA</th><th>VALOR VIAJES</th><th>DESC.%</th><th>VALOR FACTURA</th><th>DESC.%</th><th>VALOR CONSIGNAR</th></tr></thead>
  <tbody>${filas}</tbody>
  <tfoot><tr class="totals"><td>TOTALES</td><td style="text-align:right">${fmt(total.v)}</td><td></td><td style="text-align:right">${fmt(total.f)}</td><td></td><td style="text-align:right;color:#006b2e">${fmt(total.c)}</td></tr></tfoot>
  </table>
  <div class="footer">Termo Carga · Sistema de Gestión de Contratistas · Documento generado automáticamente</div>
  <script>window.onload=()=>window.print()</script></body></html>`;
  const w=window.open("","_blank"); w.document.write(html); w.document.close();
}

function exportarCSV(placa, registros, nombre){
  const bom="\uFEFF";
  const hdr=`sep=,\nTERMO CARGA – HISTORIAL DE PAGOS\nPlaca: ${placa}\nGenerado: ${HOY.getDate()} de ${MESES_ES[HOY.getMonth()]} de ${ANIO_ACTUAL}\n\nQUINCENA,VALOR VIAJES,DESC FACTURA %,VALOR FACTURA,DESC CONSIGNAR %,VALOR A CONSIGNAR\n`;
  const rows=registros.map(r=>`"${quinceTexto(r)}",${Math.round(r.valorViajes)},${r.pF}%,${Math.round(r.valorFactura)},${r.pC}%,${Math.round(r.valorConsignar)}`).join("\n");
  const tot=registros.reduce((a,r)=>a+r.valorConsignar,0);
  const foot=`\nTOTAL,,,,,${Math.round(tot)}`;
  const blob=new Blob([bom+hdr+rows+foot],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download=nombre; a.click();
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════════════════
// PANTALLA DE LOGIN
// ══════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin, claveActual }) {
  const [input,    setInput]    = useState("");
  const [verClave, setVerClave] = useState(false);
  const [error,    setError]    = useState(false);
  const [shake,    setShake]    = useState(false);

  function intentar(){
    if(input === claveActual){
      onLogin();
    } else {
      setError(true);
      setShake(true);
      setInput("");
      setTimeout(()=>setShake(false), 600);
      setTimeout(()=>setError(false), 2500);
    }
  }

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#cc0000 0%,#7a0000 60%,#3a0000 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>

      {/* Logo */}
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{fontSize:56,marginBottom:8}}>🚛</div>
        <div style={{color:"#fff",fontSize:26,fontWeight:800,letterSpacing:1}}>TERMOCARGA </div>
        <div style={{color:"#ffaaaa",fontSize:12,marginTop:4,fontStyle:"italic"}}>Sistema de Gestión de Pagos</div>
      </div>

      {/* Card de login */}
      <div style={{
        background:"#fff",borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:360,
        boxShadow:"0 20px 60px rgba(0,0,0,0.4)",
        transform: shake ? "translateX(0)" : "translateX(0)",
        animation: shake ? "none" : "none"
      }}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:28}}>🔐</div>
          <div style={{fontWeight:800,fontSize:16,color:"#222",marginTop:6}}>Acceso Administrador</div>
          <div style={{fontSize:12,color:"#aaa",marginTop:4}}>Ingrese su clave para continuar</div>
        </div>

        {error && (
          <div style={{background:"#fff0f0",border:"1px solid #ffcccc",borderRadius:8,padding:"10px 14px",marginBottom:14,textAlign:"center",fontSize:12,color:"#cc0000",fontWeight:700}}>
            ❌ Clave incorrecta. Intente de nuevo.
          </div>
        )}

        <div style={{position:"relative",marginBottom:20}}>
          <div style={{fontSize:10,fontWeight:700,color:"#888",marginBottom:6,letterSpacing:.5}}>CLAVE DE ACCESO</div>
          <input
            type={verClave?"text":"password"}
            placeholder="••••••••••••"
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&intentar()}
            autoFocus
            style={{width:"100%",padding:"12px 44px 12px 14px",border:"1.5px solid #ddd",borderRadius:10,fontSize:16,outline:"none",boxSizing:"border-box",letterSpacing:verClave?0:3,fontFamily:"inherit"}}
          />
          <button onClick={()=>setVerClave(!verClave)}
            style={{position:"absolute",right:12,top:30,background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#aaa"}}>
            {verClave?"🙈":"👁️"}
          </button>
        </div>

        <button onClick={intentar}
          style={{width:"100%",padding:"13px",background:"linear-gradient(90deg,#cc0000,#960000)",color:"#fff",border:"none",borderRadius:10,fontWeight:800,fontSize:15,cursor:"pointer"}}>
          Ingresar →
        </button>

        <div style={{textAlign:"center",marginTop:16,fontSize:11,color:"#ccc"}}>
          Termo Carga v2.4 · Acceso seguro
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODAL CAMBIAR CLAVE
// ══════════════════════════════════════════════════════════════════
function CambiarClaveModal({ claveActual, onGuardar, onCerrar }){
  const [actual,   setActual]   = useState("");
  const [nueva,    setNueva]    = useState("");
  const [confirmar,setConfirmar]= useState("");
  const [error,    setError]    = useState("");
  const [ok,       setOk]       = useState(false);

  function guardar(){
    if(actual !== claveActual){ setError("La clave actual es incorrecta."); return; }
    if(nueva.length < 6)      { setError("La nueva clave debe tener mínimo 6 caracteres."); return; }
    if(nueva !== confirmar)   { setError("Las claves nuevas no coinciden."); return; }
    onGuardar(nueva);
    setOk(true);
    setTimeout(onCerrar, 1500);
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
      <div style={{background:"#fff",borderRadius:16,padding:"24px 20px",width:"100%",maxWidth:360}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontWeight:800,fontSize:16,color:"#cc0000"}}>🔑 Cambiar Clave</div>
          <button onClick={onCerrar} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#aaa"}}>✕</button>
        </div>

        {ok ? (
          <div style={{textAlign:"center",padding:20}}>
            <div style={{fontSize:40}}>✅</div>
            <div style={{fontWeight:700,color:"#008c3c",marginTop:8}}>¡Clave actualizada!</div>
          </div>
        ) : (
          <>
            {error && <div style={{background:"#fff0f0",border:"1px solid #ffcccc",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:12,color:"#cc0000"}}>{error}</div>}
            {[
              ["CLAVE ACTUAL", actual, setActual],
              ["NUEVA CLAVE (mín. 6 caracteres)", nueva, setNueva],
              ["CONFIRMAR NUEVA CLAVE", confirmar, setConfirmar],
            ].map(([label, val, setter],i)=>(
              <div key={i} style={{marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,color:"#888",marginBottom:4}}>{label}</div>
                <input type="password" value={val} onChange={e=>setter(e.target.value)}
                  style={{width:"100%",padding:"10px 12px",border:"1.5px solid #ddd",borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box"}}/>
              </div>
            ))}
            <button onClick={guardar}
              style={{width:"100%",padding:12,background:"linear-gradient(90deg,#cc0000,#960000)",color:"#fff",border:"none",borderRadius:10,fontWeight:800,fontSize:14,cursor:"pointer",marginTop:4}}>
              Guardar nueva clave
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function App(){
  const [autenticado,   setAutenticado]   = useState(false);
  const [clave,         setClave]         = useState(CLAVE_DEFAULT);
  const [modalClave,    setModalClave]    = useState(false);
  const [menuAbierto,   setMenuAbierto]   = useState(false);

  const [tab,   setTab]   = useState(0);
  const [datos, setDatos] = useState(DEMO);
  const [modal, setModal] = useState(null);

  const [pctF, setPctF] = useState("8.2");
  const [pctC, setPctC] = useState("1.8");
  const [editPct, setEditPct] = useState(false);

  const [placa,    setPlaca]    = useState("");
  const [quincena, setQuincena] = useState("1");
  const [mes,      setMes]      = useState(HOY.getMonth());
  const [valor,    setValor]    = useState("");
  const [msg,      setMsg]      = useState(null);

  const [filtAnio,  setFiltAnio]  = useState("Todos");
  const [filtMes,   setFiltMes]   = useState("Todos");
  const [filtQ,     setFiltQ]     = useState("Todas");
  const [busqPlaca, setBusqPlaca] = useState("");
  const [vehiculoSel,setVehiculoSel] = useState(null);

  const pF = parseFloat(pctF)||0;
  const pC = parseFloat(pctC)||0;
  const v  = parseFloat(valor.replace(/[^0-9.]/g,""))||0;
  const {f,c} = calcular(v,pF,pC);

  const fechaHoy=`${DIAS[HOY.getDay()]} ${HOY.getDate()} de ${MESES_ES[HOY.getMonth()]} de ${ANIO_ACTUAL}`;
  const aniosUnicos=["Todos",...[...new Set(datos.map(r=>r.anio))].sort()];

  const filtrados=useMemo(()=>datos.filter(r=>{
    if(filtAnio!=="Todos"&&r.anio!==parseInt(filtAnio)) return false;
    if(filtMes!=="Todos"&&r.mes!==parseInt(filtMes)) return false;
    if(filtQ==="1ª Quincena"&&r.quincena!==1) return false;
    if(filtQ==="2ª Quincena"&&r.quincena!==2) return false;
    if(busqPlaca&&!r.placa.includes(busqPlaca.toUpperCase())) return false;
    return true;
  }),[datos,filtAnio,filtMes,filtQ,busqPlaca]);

  const vehiculos=useMemo(()=>{
    const m={};
    datos.forEach(r=>{
      if(!m[r.placa]) m[r.placa]={placa:r.placa,n:0,v:0,f:0,c:0,registros:[]};
      m[r.placa].n++; m[r.placa].v+=r.valorViajes;
      m[r.placa].f+=r.valorFactura; m[r.placa].c+=r.valorConsignar;
      m[r.placa].registros.push(r);
    });
    return Object.values(m);
  },[datos]);

  const histVehiculo=useMemo(()=>{
    if(!vehiculoSel) return [];
    return datos.filter(r=>r.placa===vehiculoSel).sort((a,b)=>b.anio-a.anio||b.mes-a.mes||b.quincena-a.quincena);
  },[datos,vehiculoSel]);

  const totVehiculo=useMemo(()=>
    histVehiculo.reduce((a,r)=>({v:a.v+r.valorViajes,f:a.f+r.valorFactura,c:a.c+r.valorConsignar}),{v:0,f:0,c:0})
  ,[histVehiculo]);

  const totalC=filtrados.reduce((a,r)=>a+r.valorConsignar,0);
  const totalV=filtrados.reduce((a,r)=>a+r.valorViajes,0);
  const totalF=filtrados.reduce((a,r)=>a+r.valorFactura,0);

  function solicitarLiquidacion(){
    if(!placa.trim()){setMsg("Ingrese la placa del vehículo."); return;}
    if(v<=0){setMsg("Ingrese un valor de viajes válido."); return;}
    setMsg(null);
    setModal({placa:placa.toUpperCase(),quincena:parseInt(quincena),mes:parseInt(mes),anio:ANIO_ACTUAL,v,pF,pC,f,c});
  }
  function confirmarLiquidacion(){
    const m=modal;
    setDatos(prev=>[...prev,mkReg(m.placa,m.quincena,m.mes,m.anio,m.v,m.pF,m.pC)]);
    setModal(null); setPlaca(""); setValor(""); setMsg(null); setTab(1);
  }
  function eliminar(id){setDatos(prev=>prev.filter(r=>r.id!==id));}

  function cerrarSesion(){
    setAutenticado(false); setMenuAbierto(false);
    setTab(0); setVehiculoSel(null);
  }

  // ── Estilos base ─────────────────────────────────────────────────
  const INPUT={width:"100%",padding:"10px 12px",border:"1.5px solid #ddd",borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit",background:"#fff",color:"#222"};
  const BTN_ROJO={width:"100%",padding:13,background:"linear-gradient(90deg,#cc0000,#960000)",color:"#fff",border:"none",borderRadius:10,fontWeight:800,fontSize:15,cursor:"pointer",marginBottom:8};
  const BTN_BORDE={width:"100%",padding:10,background:"#fff",color:"#cc0000",border:"1.5px solid #cc0000",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",marginBottom:8};
  const TH={background:"#cc0000",color:"#fff",padding:"9px 6px",textAlign:"center",fontSize:10,fontWeight:700,whiteSpace:"nowrap"};
  function TD(i,color,bold,center){
    return {padding:"9px 6px",fontSize:11,textAlign:center?"center":"right",background:i%2===0?"#fff":"#f9f9f9",color:color||"#333",fontWeight:bold?700:400,borderBottom:"1px solid #ececec"};
  }
  const COLORES_PLACA=["#cc0000","#1e64c8","#008c3c","#7c3aed","#c2600a","#0891b2"];

  // ── LOGIN ─────────────────────────────────────────────────────────
  if(!autenticado){
    return <LoginScreen onLogin={()=>setAutenticado(true)} claveActual={clave}/>;
  }

  return (
    <div style={{fontFamily:"'Segoe UI',sans-serif",background:"#f2f2f2",minHeight:"100vh",display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto"}}>

      {/* MODALES */}
      {modalClave && <CambiarClaveModal claveActual={clave} onGuardar={setClave} onCerrar={()=>setModalClave(false)}/>}

      {/* Menú desplegable */}
      {menuAbierto && (
        <div style={{position:"fixed",inset:0,zIndex:800}} onClick={()=>setMenuAbierto(false)}>
          <div style={{position:"absolute",top:70,right:12,background:"#fff",borderRadius:12,boxShadow:"0 8px 30px rgba(0,0,0,0.15)",overflow:"hidden",minWidth:200}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"14px 16px",borderBottom:"1px solid #f0f0f0"}}>
              <div style={{fontWeight:700,fontSize:12,color:"#333"}}>👤 Administrador</div>
              <div style={{fontSize:11,color:"#aaa",marginTop:2}}>Termo Carga</div>
            </div>
            <button onClick={()=>{setModalClave(true);setMenuAbierto(false);}}
              style={{width:"100%",padding:"12px 16px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#333",borderBottom:"1px solid #f0f0f0"}}>
              🔑  Cambiar clave de acceso
            </button>
            <button onClick={cerrarSesion}
              style={{width:"100%",padding:"12px 16px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#cc0000",fontWeight:700}}>
              🚪  Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{background:"linear-gradient(90deg,#cc0000,#960000)",padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:26}}>🚛</span>
          <div>
            <div style={{color:"#fff",fontSize:16,fontWeight:800}}>TERMO CARGA</div>
            <div style={{color:"#ffcccc",fontSize:9,fontStyle:"italic"}}>Gestión de Pagos · Contratistas</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{color:"#ffdcdc",fontSize:9,textAlign:"right",lineHeight:1.5}}>{fechaHoy}</div>
          <button onClick={()=>setMenuAbierto(!menuAbierto)}
            style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:8,width:34,height:34,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
            ⚙️
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{background:"#fff",borderBottom:"1px solid #e0e0e0",display:"flex",position:"sticky",top:62,zIndex:99}}>
        {["✚ Liquidar","📋 Historial","🚛 Vehículos"].map((t,i)=>(
          <button key={i} onClick={()=>{setTab(i);if(i!==2)setVehiculoSel(null);}} style={{
            flex:1,padding:"12px 4px",fontWeight:700,fontSize:12,cursor:"pointer",border:"none",
            background:tab===i?"#fff":"transparent",
            borderBottom:tab===i?"3px solid #cc0000":"3px solid transparent",
            color:tab===i?"#cc0000":"#888"
          }}>{t}</button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto"}}>

      {/* ══ TAB 0 – LIQUIDAR ══ */}
      {tab===0&&(
        <div style={{padding:16,display:"flex",flexDirection:"column",gap:14}}>

          {/* Porcentajes editables */}
          <div style={{background:"#fff",borderRadius:12,padding:14,border:"1.5px solid #ffcccc"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:700,fontSize:12,color:"#cc0000"}}>⚙️ Porcentajes de descuento</div>
                {!editPct&&<div style={{fontSize:11,color:"#888",marginTop:2}}>Factura: <b style={{color:"#dc6e00"}}>{pctF}%</b> · Consignar: <b style={{color:"#008c3c"}}>{pctC}%</b></div>}
              </div>
              <button onClick={()=>setEditPct(!editPct)} style={{background:editPct?"#cc0000":"#fff",color:editPct?"#fff":"#cc0000",border:"1.5px solid #cc0000",borderRadius:8,fontWeight:700,fontSize:11,padding:"5px 12px",cursor:"pointer"}}>
                {editPct?"✓ Guardar":"✏️ Editar"}
              </button>
            </div>
            {editPct&&(
              <>
                <div style={{display:"flex",gap:10,marginTop:12}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#dc6e00",marginBottom:4}}>FACTURA (%)</div>
                    <input style={{...INPUT,borderColor:"#dc6e00"}} type="number" step="0.1" min="0" max="100" value={pctF} onChange={e=>setPctF(e.target.value)}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#008c3c",marginBottom:4}}>CONSIGNAR (%)</div>
                    <input style={{...INPUT,borderColor:"#008c3c"}} type="number" step="0.1" min="0" max="100" value={pctC} onChange={e=>setPctC(e.target.value)}/>
                  </div>
                </div>
                <div style={{fontSize:10,color:"#aaa",marginTop:8}}>⚠️ Los registros anteriores conservan sus porcentajes originales</div>
              </>
            )}
          </div>

          {/* Formulario */}
          <div style={{background:"#fff",borderRadius:12,padding:16}}>
            <div style={{fontWeight:700,fontSize:13,color:"#cc0000",marginBottom:14}}>Datos del Vehículo</div>
            {msg&&<div style={{background:"#fff3cd",border:"1px solid #ffc107",borderRadius:8,padding:"10px 12px",marginBottom:12,fontSize:12,color:"#856404"}}>{msg}</div>}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:700,color:"#888",marginBottom:5}}>PLACA DEL VEHÍCULO</div>
              <input style={INPUT} placeholder="Ej: SNY-322" value={placa} onChange={e=>setPlaca(e.target.value.toUpperCase())}/>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:14}}>
              <div style={{flex:1}}>
                <div style={{fontSize:10,fontWeight:700,color:"#888",marginBottom:5}}>QUINCENA</div>
                <select style={INPUT} value={quincena} onChange={e=>setQuincena(e.target.value)}>
                  <option value="1">1ª (día 1)</option>
                  <option value="2">2ª (día 15)</option>
                </select>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:10,fontWeight:700,color:"#888",marginBottom:5}}>MES</div>
                <select style={INPUT} value={mes} onChange={e=>setMes(e.target.value)}>
                  {MESES.map((m,i)=><option key={i} value={i}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{background:"#f8f8f8",borderRadius:8,padding:"8px 12px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
              <span>📅</span>
              <span style={{fontSize:12,color:"#888"}}>Año automático:</span>
              <span style={{fontSize:14,fontWeight:700,color:"#333"}}>{ANIO_ACTUAL}</span>
            </div>
            <div style={{borderTop:"1.5px solid #ffcccc",paddingTop:14}}>
              <div style={{fontWeight:700,fontSize:13,color:"#cc0000",marginBottom:12}}>💰 Valores</div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,fontWeight:700,color:"#888",marginBottom:5}}>VALOR TOTAL DE VIAJES ($)</div>
                <input style={{...INPUT,fontSize:17,fontWeight:700,borderColor:"#cc0000"}} placeholder="0" value={valor} onChange={e=>setValor(e.target.value)} inputMode="numeric"/>
              </div>
              <div style={{borderLeft:"4px solid #dc6e00",background:"#fffaf4",padding:"10px 14px",borderRadius:"0 8px 8px 0",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontSize:10,fontWeight:700,color:"#dc6e00"}}>VALOR FACTURA (−{pctF}%)</div><div style={{fontSize:10,color:"#bbb"}}>Descuento sobre valor de viajes</div></div>
                  <div style={{fontSize:19,fontWeight:800,color:"#dc6e00"}}>{v>0?fmt(f):"$ 0"}</div>
                </div>
              </div>
              <div style={{borderLeft:"4px solid #008c3c",background:"#f4fff8",padding:"10px 14px",borderRadius:"0 8px 8px 0",marginBottom:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontSize:10,fontWeight:700,color:"#008c3c"}}>VALOR A CONSIGNAR (−{pctC}%)</div><div style={{fontSize:10,color:"#bbb"}}>Pago neto al contratista</div></div>
                  <div style={{fontSize:19,fontWeight:800,color:"#008c3c"}}>{v>0?fmt(c):"$ 0"}</div>
                </div>
              </div>
              <button style={BTN_ROJO} onClick={solicitarLiquidacion}>💵  Liquidar Quincena</button>
              <button style={BTN_BORDE} onClick={()=>{setPlaca("");setValor("");setMsg(null);}}>↺  Limpiar</button>
            </div>
          </div>

          {/* Últimas liquidaciones */}
          <div style={{background:"#fff",borderRadius:12,overflow:"hidden"}}>
            <div style={{background:"#fff5f5",padding:"10px 14px",borderBottom:"1px solid #ffcccc"}}>
              <span style={{color:"#960000",fontWeight:700,fontSize:12}}>🕐 Últimas liquidaciones</span>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:300}}>
                <thead><tr>{["PLACA","QUINCENA","VIAJES","CONSIGNAR"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {[...datos].reverse().slice(0,6).map((r,i)=>(
                    <tr key={r.id}>
                      <td style={{...TD(i,"#222",true,true),fontSize:12}}>{r.placa}</td>
                      <td style={{...TD(i,"#555",false,true),fontSize:10}}>{quinceTexto(r)}</td>
                      <td style={TD(i,"#555",false,false)}>{fmt(r.valorViajes)}</td>
                      <td style={TD(i,"#008c3c",true,false)}>{fmt(r.valorConsignar)}</td>
                    </tr>
                  ))}
                  {datos.length===0&&<tr><td colSpan={4} style={{textAlign:"center",padding:24,color:"#ccc",fontSize:12}}>Sin registros</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB 1 – HISTORIAL ══ */}
      {tab===1&&(
        <div>
          <div style={{background:"#fff5f5",padding:"12px 14px",borderBottom:"1px solid #ffcccc",display:"flex",flexDirection:"column",gap:8}}>
            <input style={{...INPUT,padding:"8px 12px",fontSize:12}} placeholder="🔍 Buscar por placa..." value={busqPlaca} onChange={e=>setBusqPlaca(e.target.value.toUpperCase())}/>
            <div style={{display:"flex",gap:6}}>
              <select style={{...INPUT,flex:1,fontSize:11,padding:"6px 6px"}} value={filtAnio} onChange={e=>setFiltAnio(e.target.value)}>
                {aniosUnicos.map(a=><option key={a}>{a}</option>)}
              </select>
              <select style={{...INPUT,flex:1,fontSize:11,padding:"6px 6px"}} value={filtMes} onChange={e=>setFiltMes(e.target.value)}>
                <option value="Todos">Todos los meses</option>
                {MESES.map((m,i)=><option key={i} value={i}>{m}</option>)}
              </select>
              <select style={{...INPUT,flex:1,fontSize:11,padding:"6px 6px"}} value={filtQ} onChange={e=>setFiltQ(e.target.value)}>
                {["Todas","1ª Quincena","2ª Quincena"].map(q=><option key={q}>{q}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setFiltAnio("Todos");setFiltMes("Todos");setFiltQ("Todas");setBusqPlaca("");}}
                style={{flex:1,padding:7,background:"#fff",color:"#cc0000",border:"1.5px solid #cc0000",borderRadius:8,fontWeight:700,fontSize:11,cursor:"pointer"}}>✕ Ver Todo</button>
              <button onClick={()=>exportarCSV("TODOS",filtrados,"TermoCarga_Historial.csv")}
                style={{flex:1,padding:7,background:"#1e64c8",color:"#fff",border:"none",borderRadius:8,fontWeight:700,fontSize:11,cursor:"pointer"}}>⬇ Excel</button>
            </div>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:380}}>
              <thead><tr>{["PLACA","QUINCENA","VALOR VIAJES","VALOR FACTURA","VALOR CONSIGNAR",""].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {filtrados.map((r,i)=>(
                  <tr key={r.id}>
                    <td style={{...TD(i,"#222",true,true),fontSize:12}}>{r.placa}</td>
                    <td style={{...TD(i,"#555",false,true),fontSize:10}}>{quinceTexto(r)}</td>
                    <td style={TD(i,"#333",false,false)}>{fmt(r.valorViajes)}</td>
                    <td style={TD(i,"#c85000",false,false)}>{fmt(r.valorFactura)}</td>
                    <td style={TD(i,"#008c3c",true,false)}>{fmt(r.valorConsignar)}</td>
                    <td style={{...TD(i,null,false,true)}}><button onClick={()=>eliminar(r.id)} style={{background:"none",border:"none",color:"#cc0000",cursor:"pointer",fontSize:13}}>🗑</button></td>
                  </tr>
                ))}
                {filtrados.length===0&&<tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"#ccc",fontSize:12}}>Sin registros</td></tr>}
              </tbody>
              {filtrados.length>0&&(
                <tfoot>
                  <tr style={{background:"#fff5f5",borderTop:"2px solid #cc0000"}}>
                    <td colSpan={2} style={{padding:"8px 6px",fontSize:11,fontWeight:700,color:"#cc0000",textAlign:"center"}}>TOTALES</td>
                    <td style={{padding:"8px 6px",fontSize:11,fontWeight:700,color:"#333",textAlign:"right"}}>{fmt(totalV)}</td>
                    <td style={{padding:"8px 6px",fontSize:11,fontWeight:700,color:"#c85000",textAlign:"right"}}>{fmt(totalF)}</td>
                    <td style={{padding:"8px 6px",fontSize:11,fontWeight:700,color:"#008c3c",textAlign:"right"}}>{fmt(totalC)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div style={{background:"#f8f8f8",padding:"10px 14px",borderTop:"1px solid #e8e8e8"}}>
            <span style={{fontWeight:700,fontSize:12,color:"#008c3c"}}>{filtrados.length} registro(s) · Consignar: {fmt(totalC)}</span>
          </div>
        </div>
      )}

      {/* ══ TAB 2 – VEHÍCULOS ══ */}
      {tab===2&&(
        vehiculoSel ? (
          <div>
            <div style={{background:"#fff",padding:"12px 14px",borderBottom:"1px solid #e8e8e8",display:"flex",alignItems:"center",gap:10,position:"sticky",top:102,zIndex:98}}>
              <button onClick={()=>setVehiculoSel(null)} style={{background:"none",border:"none",color:"#cc0000",fontSize:20,cursor:"pointer",padding:0}}>←</button>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:16,color:"#cc0000"}}>{vehiculoSel}</div>
                <div style={{fontSize:11,color:"#888"}}>{histVehiculo.length} liquidación(es)</div>
              </div>
              <button onClick={()=>imprimirPDF(vehiculoSel,histVehiculo)}
                style={{padding:"6px 10px",background:"#cc0000",color:"#fff",border:"none",borderRadius:8,fontWeight:700,fontSize:11,cursor:"pointer",marginRight:4}}>📄 PDF</button>
              <button onClick={()=>exportarCSV(vehiculoSel,histVehiculo,`TermoCarga_${vehiculoSel}.csv`)}
                style={{padding:"6px 10px",background:"#1e64c8",color:"#fff",border:"none",borderRadius:8,fontWeight:700,fontSize:11,cursor:"pointer"}}>⬇ Excel</button>
            </div>
            <div style={{display:"flex",gap:8,padding:"12px 14px",background:"#f8f8f8",borderBottom:"1px solid #e8e8e8"}}>
              {[{l:"Total Viajes",v:totVehiculo.v,c:"#333",bg:"#fff"},{l:"Total Factura",v:totVehiculo.f,c:"#c85000",bg:"#fffaf4"},{l:"Total Consignar",v:totVehiculo.c,c:"#008c3c",bg:"#f4fff8"}].map((k,i)=>(
                <div key={i} style={{flex:1,background:k.bg,borderRadius:8,padding:"8px 10px",textAlign:"center",border:"1px solid #eee"}}>
                  <div style={{fontSize:9,color:"#999",fontWeight:700,marginBottom:2}}>{k.l}</div>
                  <div style={{fontSize:11,fontWeight:800,color:k.c}}>{fmt(k.v)}</div>
                </div>
              ))}
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:340}}>
                <thead><tr>{["QUINCENA","VALOR VIAJES","VALOR FACTURA","VALOR CONSIGNAR"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {histVehiculo.map((r,i)=>(
                    <tr key={r.id}>
                      <td style={{...TD(i,"#555",false,true),fontSize:11}}>{quinceTexto(r)}</td>
                      <td style={TD(i,"#333",false,false)}>{fmt(r.valorViajes)}</td>
                      <td style={TD(i,"#c85000",false,false)}>{fmt(r.valorFactura)}</td>
                      <td style={TD(i,"#008c3c",true,false)}>{fmt(r.valorConsignar)}</td>
                    </tr>
                  ))}
                </tbody>
                {histVehiculo.length>0&&(
                  <tfoot>
                    <tr style={{background:"#fff5f5",borderTop:"2px solid #cc0000"}}>
                      <td style={{padding:"8px 6px",fontSize:11,fontWeight:700,color:"#cc0000",textAlign:"center"}}>TOTALES</td>
                      <td style={{padding:"8px 6px",fontSize:11,fontWeight:700,color:"#333",textAlign:"right"}}>{fmt(totVehiculo.v)}</td>
                      <td style={{padding:"8px 6px",fontSize:11,fontWeight:700,color:"#c85000",textAlign:"right"}}>{fmt(totVehiculo.f)}</td>
                      <td style={{padding:"8px 6px",fontSize:11,fontWeight:700,color:"#008c3c",textAlign:"right"}}>{fmt(totVehiculo.c)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        ) : (
          <div style={{padding:14,display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{fontWeight:800,fontSize:14,color:"#960000"}}>Vehículos registrados</span>
              <span style={{fontSize:11,color:"#888"}}>{vehiculos.length} placa(s)</span>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:4}}>
              <div style={{flex:1,background:"#fff",borderRadius:10,padding:"10px 12px",border:"1.5px solid #ffcccc",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#999",fontWeight:700}}>TOTAL CONSIGNADO</div>
                <div style={{fontSize:14,fontWeight:800,color:"#008c3c",marginTop:2}}>{fmt(datos.reduce((a,r)=>a+r.valorConsignar,0))}</div>
              </div>
              <div style={{flex:1,background:"#fff",borderRadius:10,padding:"10px 12px",border:"1.5px solid #ffcccc",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#999",fontWeight:700}}>TOTAL LIQUIDACIONES</div>
                <div style={{fontSize:14,fontWeight:800,color:"#cc0000",marginTop:2}}>{datos.length}</div>
              </div>
            </div>
            <div style={{fontSize:10,color:"#aaa",textAlign:"center",marginBottom:2}}>Toca una placa para ver su historial y descargar</div>
            {vehiculos.map((veh,idx)=>{
              const color=COLORES_PLACA[idx%COLORES_PLACA.length];
              const pct=datos.length>0?Math.round((veh.n/datos.length)*100):0;
              return(
                <button key={veh.placa} onClick={()=>setVehiculoSel(veh.placa)}
                  style={{background:"#fff",border:`1.5px solid ${color}33`,borderRadius:12,padding:"14px 16px",cursor:"pointer",textAlign:"left",width:"100%"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:44,height:44,borderRadius:10,background:`${color}15`,border:`2px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{fontSize:11,fontWeight:800,color}}>{veh.placa.slice(0,3)}</span>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:15,color:"#222"}}>{veh.placa}</div>
                      <div style={{fontSize:11,color:"#888",marginTop:1}}>{veh.n} liquidación(es)</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:14,fontWeight:800,color:"#008c3c"}}>{fmt(veh.c)}</div>
                      <div style={{fontSize:9,color:"#bbb"}}>total consignado</div>
                    </div>
                    <div style={{color:"#ccc",fontSize:18}}>›</div>
                  </div>
                  <div style={{marginTop:10,height:4,background:"#f0f0f0",borderRadius:4}}>
                    <div style={{height:4,background:color,borderRadius:4,width:`${pct}%`}}/>
                  </div>
                  <div style={{fontSize:9,color:"#bbb",marginTop:3}}>{pct}% del total de liquidaciones</div>
                </button>
              );
            })}
            {vehiculos.length===0&&<div style={{textAlign:"center",padding:32,color:"#ccc",fontSize:13}}>Sin vehículos registrados</div>}
          </div>
        )
      )}
      </div>

      {/* MODAL LIQUIDACIÓN */}
      {modal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:999}}>
          <div style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,padding:"24px 20px 36px"}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:38,marginBottom:6}}>💵</div>
              <div style={{fontWeight:800,fontSize:18,color:"#cc0000"}}>Resumen de Liquidación</div>
              <div style={{fontSize:12,color:"#888",marginTop:2}}>Revise los valores antes de confirmar</div>
            </div>
            <div style={{background:"#f8f8f8",borderRadius:12,padding:16,marginBottom:14}}>
              {[["Placa",modal.placa,true],["Quincena",modal.quincena+"ª Q de "+MESES[modal.mes]+" "+modal.anio,false],["Valor de viajes",fmt(modal.v),false]].map(([l,va,b],i,arr)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<arr.length-1?"1px solid #ececec":"none"}}>
                  <span style={{fontSize:12,color:"#888"}}>{l}</span>
                  <span style={{fontSize:14,fontWeight:b?800:500,color:"#222"}}>{va}</span>
                </div>
              ))}
            </div>
            <div style={{borderLeft:"4px solid #dc6e00",background:"#fffaf4",padding:"12px 14px",borderRadius:"0 10px 10px 0",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:11,fontWeight:700,color:"#dc6e00"}}>VALOR FACTURA</div><div style={{fontSize:10,color:"#bbb"}}>Descuento del {modal.pF}%</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:17,fontWeight:800,color:"#dc6e00"}}>{fmt(modal.f)}</div><div style={{fontSize:10,color:"#bbb"}}>−{fmt(modal.v-modal.f)}</div></div>
              </div>
            </div>
            <div style={{borderLeft:"4px solid #008c3c",background:"#f4fff8",padding:"12px 14px",borderRadius:"0 10px 10px 0",marginBottom:22}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:11,fontWeight:700,color:"#008c3c"}}>VALOR A CONSIGNAR</div><div style={{fontSize:10,color:"#bbb"}}>Descuento adicional del {modal.pC}%</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:22,fontWeight:800,color:"#008c3c"}}>{fmt(modal.c)}</div><div style={{fontSize:10,color:"#bbb"}}>−{fmt(modal.f-modal.c)}</div></div>
              </div>
            </div>
            <button onClick={confirmarLiquidacion} style={{width:"100%",padding:14,background:"linear-gradient(90deg,#cc0000,#960000)",color:"#fff",border:"none",borderRadius:12,fontWeight:800,fontSize:16,cursor:"pointer",marginBottom:10}}>
              ✅  Sí, confirmar liquidación
            </button>
            <button onClick={()=>setModal(null)} style={{width:"100%",padding:12,background:"#fff",color:"#cc0000",border:"1.5px solid #cc0000",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer"}}>
              ← Volver y corregir
            </button>
          </div>
        </div>
      )}

      <div
  style={{
    background: "#960000",
    padding: "10px 0",
    textAlign: "center",
    borderTop: "1px solid #b30000"
  }}
>
  <div
    style={{
      color: "#ffffff",
      fontWeight: "bold",
      fontSize: 13,
      letterSpacing: 1
    }}
  >
    NOVA LAB
  </div>

  <div
    style={{
      color: "#ffcccc",
      fontSize: 11
    }}
  >
    Software Intelligence
  </div>

  <div
    style={{
      color: "#dddddd",
      fontSize: 10,
      marginTop: 4
    }}
  >
    NovaLab v2.4 • Acceso protegido
  </div>

</div>

 </div>

);
}