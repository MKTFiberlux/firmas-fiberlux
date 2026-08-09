/**
 * Firmas Core — motor compartido de configuración y dibujo de firmas.
 *
 * Usado por firmas.html (trabajador) y disenador.html (admin) para que
 * ambas apps rendericen EXACTAMENTE igual y nunca vuelvan a divergir.
 *
 * v2: el bloque de contacto dejó de ser 3 campos fijos (celular/web/dirección)
 * con una plantilla "alterna" para cuando no hay celular. Ahora es una lista
 * de FILAS genéricas — cada una con su propio ícono, su propia condición de
 * visibilidad (solo se dibuja si tiene texto) y su propio ajuste de línea.
 * Así "celular" y "teléfono" pueden coexistir, una fila puede saltar a 2
 * líneas, y el admin agrega/quita/reordena filas sin tocar código.
 *
 * Sin módulos ES a propósito: se carga como <script> plano para que las
 * apps sigan siendo 100% estáticas (abribles sin build step).
 */
(function (global) {
  "use strict";

  const BASE_STYLE = {
    pos: [50, 50], size: 30, tracking: 0,
    weight: "700", limit: 20, use_limit: true, leading: 25,
  };

  const CONTACT_ANCHOR_DEFAULT = {
    pos: [400, 50], size: 13, tracking: 0, weight: "400",
    leading: 20,       // distancia entre el inicio de una fila y el de la siguiente
    line_height: 15,   // distancia entre líneas DENTRO de una misma fila (envuelto)
    icon_size: 14, gap_icono_texto: 8,
  };

  // Tipos de fila conocidos: definen el campo de datos y una etiqueta/ícono
  // sugeridos al crearla. "personalizado" no ata la fila a ningún campo fijo.
  const TIPOS_FILA = {
    celular:   { campo: "celular",   etiqueta: "Celular",   formatea_telefono: true },
    telefono:  { campo: "telefono",  etiqueta: "Teléfono",  formatea_telefono: true },
    direccion: { campo: "direccion", etiqueta: "Dirección", formatea_telefono: false },
    web:       { campo: "web",       etiqueta: "Web",       formatea_telefono: false },
    email:     { campo: "email",     etiqueta: "Email",     formatea_telefono: false },
    personalizado: { campo: "",      etiqueta: "Campo nuevo", formatea_telefono: false },
  };

  function nuevaFila(tipo) {
    const t = TIPOS_FILA[tipo] || TIPOS_FILA.personalizado;
    return {
      id: "fila_" + Math.random().toString(36).slice(2, 9),
      modo: "dato",           // "dato" (viene del formulario) | "fijo" (texto igual para todos)
      tipo: tipo || "personalizado",
      campo: t.campo || (tipo === "personalizado" ? "" : t.campo),
      etiqueta: t.etiqueta,
      icono: "",
      default: "",
      texto_fijo: "",
      activo: true,
      envolver: { activo: false, max_ancho_px: 200, max_lineas: 2 },
    };
  }

  const TEMPLATE_EMP = {
    plantilla: "", color_texto: "#111111",
    font_family: "'Poppins', Arial, sans-serif",
    accent_ui: "#6b7280",
    style_nombre:   { pos: [40, 40],  size: 28, tracking: 0, weight: "700", limit: 20, use_limit: true },
    style_apellido: { pos: [40, 75],  size: 28, tracking: 0, weight: "700", limit: 20, use_limit: true },
    style_cargo:    { pos: [40, 112], size: 14, tracking: 0, weight: "500", limit: 30, use_limit: true, leading: 18 },
    contacto: { anchor: JSON.parse(JSON.stringify(CONTACT_ANCHOR_DEFAULT)), filas: [] },
  };
  TEMPLATE_EMP.contacto.anchor.pos = [40, 150];

  const ELEMENT_LABELS = {
    style_nombre: "Nombre",
    style_apellido: "Apellido",
    style_cargo: "Cargo",
  };

  function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function logicaRecorte(p, s, limit, uselimit) {
    let str1 = (p || "").trim(), str2 = (s || "").trim();
    let full = `${str1} ${str2}`.trim();
    if (!uselimit || full.length <= limit) return full;
    if (str2) {
      let init = `${str1} ${str2[0]}.`;
      if (init.length <= limit) return init;
    }
    return str1;
  }

  function formatCelular(cel) {
    if (!cel) return "";
    let n = String(cel).replace(/\D/g, "");
    if (!n) return String(cel).trim(); // no son puros dígitos: se respeta el texto tal cual
    if (n.length === 9) return `${n.substring(0, 3)} ${n.substring(3, 6)} ${n.substring(6)}`;
    if (n.length > 9) return `${n.substring(n.length - 9, n.length - 6)} ${n.substring(n.length - 6, n.length - 3)} ${n.substring(n.length - 3)}`;
    return n;
  }

  function wrapByLimit(text, limit) {
    let ws = text.split(" "), r = [], c = "";
    for (let w of ws) {
      let x = c + (c ? " " : "") + w;
      if (x.length > limit && c !== "") { r.push(c); c = w; } else c = x;
    }
    if (c) r.push(c);
    return r;
  }

  const imagenesCacheadas = {};
  function loadImage(src) {
    return new Promise((resolve) => {
      if (!src) { resolve(null); return; }
      if (imagenesCacheadas[src]) { resolve(imagenesCacheadas[src]); return; }
      let img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => { imagenesCacheadas[src] = img; resolve(img); };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }
  function clearImageCache(src) {
    if (src) delete imagenesCacheadas[src];
    else for (const k in imagenesCacheadas) delete imagenesCacheadas[k];
  }

  /** Mide el ancho real de un texto respetando el tracking, igual que drawTxt. */
  function measureTrackedWidth(ctx, text, size, weight, fontFamily, tracking) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    if (!tracking) return ctx.measureText(text).width;
    if ("letterSpacing" in ctx) {
      ctx.letterSpacing = `${tracking}px`;
      const w = ctx.measureText(text).width;
      ctx.letterSpacing = "0px";
      return w;
    }
    let w = 0;
    for (const ch of text) w += ctx.measureText(ch).width + parseFloat(tracking);
    return w - parseFloat(tracking);
  }

  function drawTrackedText(ctx, t, x, y, size, weight, color, fontFamily, tracking) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    if (!tracking || tracking == 0) { ctx.fillText(t, x, y); return; }
    if ("letterSpacing" in ctx) {
      ctx.letterSpacing = `${tracking}px`;
      ctx.fillText(t, x, y);
      ctx.letterSpacing = "0px";
    } else {
      let currX = x;
      for (const ch of t) { ctx.fillText(ch, currX, y); currX += ctx.measureText(ch).width + parseFloat(tracking); }
    }
  }

  /** Ajuste de línea por ancho en píxeles (para filas de contacto). */
  function wrapPx(ctx, text, maxWidthPx, maxLines, size, weight, fontFamily, tracking) {
    if (!text) return [];
    const words = text.split(" ");
    let lines = [], current = "";
    for (const w of words) {
      const trial = current ? current + " " + w : w;
      const width = measureTrackedWidth(ctx, trial, size, weight, fontFamily, tracking);
      if (width > maxWidthPx && current) { lines.push(current); current = w; }
      else current = trial;
    }
    if (current) lines.push(current);
    if (maxLines && lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      let last = lines[maxLines - 1];
      while (last.length > 1 && measureTrackedWidth(ctx, last + "…", size, weight, fontFamily, tracking) > maxWidthPx) {
        last = last.slice(0, -1);
      }
      lines[maxLines - 1] = last + "…";
    }
    return lines;
  }

  function textoEfectivoFila(fila, datos) {
    if (fila.modo === "fijo") return fila.texto_fijo || "";
    let raw = (datos && datos[fila.campo]) || fila.default || "";
    raw = String(raw).trim();
    if (!raw) return "";
    const meta = TIPOS_FILA[fila.tipo];
    if (meta && meta.formatea_telefono) raw = formatCelular(raw);
    return raw;
  }

  /**
   * Dibuja el bloque de contacto completo (N filas dinámicas con ícono +
   * texto opcionalmente envuelto a varias líneas) y devuelve su caja
   * envolvente (x,y,w,h) para el overlay de arrastre del editor.
   */
  async function drawContactBlock(ctx, cfgEmpresa, datos) {
    const anchor = (cfgEmpresa.contacto && cfgEmpresa.contacto.anchor) || CONTACT_ANCHOR_DEFAULT;
    const filasDef = (cfgEmpresa.contacto && cfgEmpresa.contacto.filas) || [];
    const color = cfgEmpresa.color_texto;
    const fontFamily = cfgEmpresa.font_family || "'Poppins', Arial, sans-serif";

    // Resolver filas visibles + su texto ANTES de dibujar (para poder
    // precargar íconos de forma asíncrona sin bloquear el trazo).
    const activas = filasDef.filter(f => f.activo !== false);
    const resueltas = activas.map(f => ({ fila: f, texto: textoEfectivoFila(f, datos) })).filter(r => r.texto);
    const iconos = {};
    await Promise.all(resueltas.map(async (r) => {
      if (r.fila.icono) iconos[r.fila.id] = await loadImage(r.fila.icono);
    }));

    let cy = anchor.pos[1];
    let maxW = 0;
    const startY = anchor.pos[1];

    for (const { fila, texto } of resueltas) {
      const img = iconos[fila.id];
      const hasIcon = !!img;
      const textX = anchor.pos[0] + (hasIcon ? anchor.icon_size + anchor.gap_icono_texto : 0);
      const lines = (fila.envolver && fila.envolver.activo)
        ? wrapPx(ctx, texto, fila.envolver.max_ancho_px || 200, fila.envolver.max_lineas || 2, anchor.size, anchor.weight, fontFamily, anchor.tracking)
        : [texto];

      if (hasIcon) {
        const iconY = cy + Math.max(0, (anchor.size - anchor.icon_size) / 2);
        ctx.drawImage(img, anchor.pos[0], iconY, anchor.icon_size, anchor.icon_size);
        maxW = Math.max(maxW, anchor.icon_size + anchor.gap_icono_texto);
      }
      let ly = cy;
      for (const line of lines) {
        drawTrackedText(ctx, line, textX, ly, anchor.size, anchor.weight, color, fontFamily, anchor.tracking);
        maxW = Math.max(maxW, (textX - anchor.pos[0]) + measureTrackedWidth(ctx, line, anchor.size, anchor.weight, fontFamily, anchor.tracking));
        ly += anchor.line_height || anchor.leading;
      }
      cy += (lines.length > 0 ? (lines.length - 1) * (anchor.line_height || anchor.leading) : 0) + anchor.leading;
    }

    const h = resueltas.length ? Math.max(anchor.leading, cy - startY - (anchor.leading - anchor.line_height)) : anchor.leading;
    return { x: anchor.pos[0], y: startY, w: Math.max(30, maxW), h: Math.max(anchor.leading, cy - startY), filasVisibles: resueltas.length };
  }

  /**
   * Dibuja la firma completa en el canvas dado y devuelve, además, la
   * geometría (x,y,w,h) de cada elemento tal como quedó renderizado —
   * es la MISMA fuente de verdad que usa el editor de precisión para
   * dibujar las cajas de arrastre encima del canvas.
   */
  async function drawSignature(canvasObj, datos, cfgEmpresa) {
    const ctx = canvasObj.getContext("2d");
    const fontFamily = cfgEmpresa.font_family || "'Poppins', Arial, sans-serif";

    let imgBg = await loadImage(cfgEmpresa.plantilla);
    if (imgBg) {
      canvasObj.width = imgBg.width;
      canvasObj.height = imgBg.height;
      ctx.clearRect(0, 0, canvasObj.width, canvasObj.height);
      ctx.drawImage(imgBg, 0, 0, imgBg.width, imgBg.height);
    } else {
      canvasObj.width = 600; canvasObj.height = 180;
      ctx.fillStyle = "#f4f4f5"; ctx.fillRect(0, 0, canvasObj.width, canvasObj.height);
    }

    const col = cfgEmpresa.color_texto;
    const layout = {};

    const sn = cfgEmpresa.style_nombre || BASE_STYLE;
    const txtNombre = logicaRecorte(datos.nom1, datos.nom2, sn.limit, sn.use_limit);
    drawTrackedText(ctx, txtNombre, sn.pos[0], sn.pos[1], sn.size, sn.weight, col, fontFamily, sn.tracking);
    layout.style_nombre = {
      x: sn.pos[0], y: sn.pos[1],
      w: Math.max(4, measureTrackedWidth(ctx, txtNombre || "Nombre", sn.size, sn.weight, fontFamily, sn.tracking)),
      h: sn.size * 1.25, text: txtNombre,
    };

    const sa = cfgEmpresa.style_apellido || BASE_STYLE;
    const txtApellido = logicaRecorte(datos.pat, datos.mat, sa.limit, sa.use_limit);
    drawTrackedText(ctx, txtApellido, sa.pos[0], sa.pos[1], sa.size, sa.weight, col, fontFamily, sa.tracking);
    layout.style_apellido = {
      x: sa.pos[0], y: sa.pos[1],
      w: Math.max(4, measureTrackedWidth(ctx, txtApellido || "Apellido", sa.size, sa.weight, fontFamily, sa.tracking)),
      h: sa.size * 1.25, text: txtApellido,
    };

    const sc = cfgEmpresa.style_cargo || BASE_STYLE;
    const cTxt = datos.cargo || "";
    const lns = sc.use_limit ? wrapByLimit(cTxt, sc.limit) : [cTxt];
    let cy = sc.pos[1], maxW = 0;
    for (const l of lns) {
      drawTrackedText(ctx, l, sc.pos[0], cy, sc.size, sc.weight, col, fontFamily, sc.tracking);
      maxW = Math.max(maxW, measureTrackedWidth(ctx, l || "Cargo", sc.size, sc.weight, fontFamily, sc.tracking));
      cy += sc.leading || 25;
    }
    layout.style_cargo = {
      x: sc.pos[0], y: sc.pos[1],
      w: Math.max(4, maxW || measureTrackedWidth(ctx, "Cargo", sc.size, sc.weight, fontFamily, sc.tracking)),
      h: Math.max(sc.size * 1.25, (lns.length || 1) * (sc.leading || 25)),
      text: lns.join(" / "),
    };

    layout.contacto = await drawContactBlock(ctx, cfgEmpresa, datos);

    return { layout, canvasW: canvasObj.width, canvasH: canvasObj.height };
  }

  // ── Config: carga / guardado ──────────────────────────────────────
  async function fetchDefaultConfig(jsonUrl) {
    try {
      const r = await fetch(jsonUrl);
      if (r.ok) return await r.json();
    } catch (e) { /* fetch falla bajo file:// — se espera */ }
    return null;
  }

  function buildFallbackConfig() {
    return { "Nueva Empresa": deepClone(TEMPLATE_EMP) };
  }

  function exportConfigFile(config, filename) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const dl = document.createElement("a");
    dl.href = dataStr; dl.download = filename || "config_firmas.json";
    document.body.appendChild(dl); dl.click(); dl.remove();
  }

  /** Todos los "campos de datos" (tipo dato) usados por al menos una fila de
   *  al menos una empresa — útil para generar la plantilla Excel genérica. */
  function camposDeDatosUsados(config) {
    const set = new Set();
    for (const emp in config) {
      const filas = (config[emp].contacto && config[emp].contacto.filas) || [];
      for (const f of filas) if (f.modo === "dato" && f.campo) set.add(f.campo);
    }
    return Array.from(set);
  }

  global.FirmasCore = {
    BASE_STYLE, TEMPLATE_EMP, ELEMENT_LABELS, TIPOS_FILA, CONTACT_ANCHOR_DEFAULT,
    deepClone, nuevaFila,
    logicaRecorte, formatCelular, wrapByLimit, wrapPx, textoEfectivoFila,
    loadImage, clearImageCache,
    measureTrackedWidth, drawTrackedText,
    drawSignature, drawContactBlock,
    fetchDefaultConfig, buildFallbackConfig, exportConfigFile, camposDeDatosUsados,
  };
})(window);
