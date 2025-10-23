import React, { useEffect, useState } from "react";
import logo from "./assets/logo.png";
import { FaInstagram } from "react-icons/fa";
import emailjs from "emailjs-com";

// === TUS URLS CSV PUBLICADAS ===
const CSV_URLS = {
  pagina: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGTUdIBTe-bzS36YDMcNRAn14ItXmx9HTElVEXwFfbLOuKPb05fYOf4fZooYbLi6rnNik3IaJ0cy-9/pub?gid=1300846228&single=true&output=csv",
  cursos: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGTUdIBTe-bzS36YDMcNRAn14ItXmx9HTElVEXwFfbLOuKPb05fYOf4fZooYbLi6rnNik3IaJ0cy-9/pub?gid=861302531&single=true&output=csv",
  eventos: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGTUdIBTe-bzS36YDMcNRAn14ItXmx9HTElVEXwFfbLOuKPb05fYOf4fZooYbLi6rnNik3IaJ0cy-9/pub?gid=522425815&single=true&output=csv",
  rutas: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGTUdIBTe-bzS36YDMcNRAn14ItXmx9HTElVEXwFfbLOuKPb05fYOf4fZooYbLi6rnNik3IaJ0cy-9/pub?gid=1103094227&single=true&output=csv",
  galeria: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGTUdIBTe-bzS36YDMcNRAn14ItXmx9HTElVEXwFfbLOuKPb05fYOf4fZooYbLi6rnNik3IaJ0cy-9/pub?gid=1570385706&single=true&output=csv",
  redes: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGTUdIBTe-bzS36YDMcNRAn14ItXmx9HTElVEXwFfbLOuKPb05fYOf4fZooYbLi6rnNik3IaJ0cy-9/pub?gid=0&single=true&output=csv",
};

// === FUNCIONES CSV ===
function parseCSV(text) {
  const rows = text.replace(/\r/g, "").split("\n").filter((l) => l !== "");
  if (!rows.length) return [];
  const headers = splitCSVLine(rows[0]).map((h) => h.trim());
  return rows.slice(1).map((line) => {
    const cells = splitCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => (obj[h] = (cells[i] ?? "").trim()));
    return obj;
  });
}

function splitCSVLine(line) {
  const out = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === "," && !inQ) { out.push(cur); cur = ""; }
    else { cur += ch; }
  }
  out.push(cur);
  return out;
}

async function fetchCSV(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar: " + url);
  return parseCSV(await res.text());
}

// === COMPONENTE PRINCIPAL ===
export default function App() {
  const [data, setData] = useState({
    pagina: {},
    cursos: [],
    eventos: [],
    rutas: [],
    galeria: [],
    rrss: {},
  });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  // === CARGAR CSV ===
  useEffect(() => {
    (async () => {
      try {
        const [pagina, cursos, eventos, rutas, galeria, redes] = await Promise.all([
          fetchCSV(CSV_URLS.pagina),
          fetchCSV(CSV_URLS.cursos),
          fetchCSV(CSV_URLS.eventos),
          fetchCSV(CSV_URLS.rutas),
          fetchCSV(CSV_URLS.galeria),
          fetchCSV(CSV_URLS.redes),
        ]);
        setData({
          pagina: (pagina.find(p => (p.slug||"").toLowerCase()==="inicio") || pagina[0] || {}),
          cursos, eventos, rutas, galeria,
          rrss: redes[0] || {},
        });
      } catch (err) { console.warn("Error cargando CSV:", err); }
      finally { setLoading(false); }
    })();
  }, []);

  // === FONDO ROTATORIO ===
  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    const imagenes = [
      `${base}1.jpg`, `${base}2.jpg`, `${base}3.jpg`,
      `${base}4.jpg`, `${base}5.jpg`, `${base}6.jpg`, `${base}7.jpg`,
    ];
    const bgA = document.createElement("div");
    const bgB = document.createElement("div");
    bgA.className = "bg-rotator"; bgB.className = "bg-rotator-next";
    document.body.appendChild(bgA); document.body.appendChild(bgB);
    imagenes.forEach(src => { const img = new Image(); img.src = src; });

    let anterior = -1, usingA = true;
    const setActive = (el, active) => el.classList.toggle("is-active", !!active);
    const pickIndex = () => {
      let idx; do { idx = Math.floor(Math.random() * imagenes.length); }
      while (idx === anterior && imagenes.length > 1);
      anterior = idx; return idx;
    };
    const first = pickIndex();
    bgA.style.backgroundImage = `url(${imagenes[first]})`;
    setActive(bgA, true); setActive(bgB, false);

    const cambiar = () => {
      const idx = pickIndex();
      const current = usingA ? bgA : bgB;
      const next = usingA ? bgB : bgA;
      next.style.backgroundImage = `url(${imagenes[idx]})`;
      setActive(next, true); setActive(current, false);
      usingA = !usingA;
    };
    const id = setInterval(cambiar, 7000);
    return () => { clearInterval(id); bgA.remove(); bgB.remove(); };
  }, []);

  const pg = data.pagina;

  // === FUNCIÓN DE ENVÍO DE CORREO ===
  const sendEmail = (e) => {
  e.preventDefault();

  // 1️⃣ Enviar mensaje a ti (Rumocyl)
  emailjs
    .send(
      "service_jsf23cn",      // 👉 tu Service ID
      "template_lhndflr",   // 👉 la plantilla que te envía el mensaje a ti
      {
        from_name: form.name,
        from_email: form.email,
        message: form.message,
      },
      "s_9A_IAHX8Ves3mT4"        // 👉 tu Public Key
    )
    .then(() => {
      // 2️⃣ Si el envío fue exitoso, también enviar mensaje al usuario
      emailjs.send(
        "service_jsf23cn",           // mismo Service ID
        "template_mq2wzqj", // 👉 la plantilla para el usuario
        {
          from_name: form.name,
          from_email: form.email,
          message: form.message,
        },
        "s_9A_IAHX8Ves3mT4"
      );

      // 3️⃣ Mostrar confirmación
      alert("✅ Mensaje enviado con éxito");
      setForm({ name: "", email: "", message: "" });
    })
    .catch((err) => {
      console.error("Error:", err);
      alert("❌ Error al enviar el mensaje");
    });
};


  return (
    <>
      <div className="container">
        <header className="hero" style={{ "--hero-bg": `url(${pg?.heroImagen || ""})` }}>
          <video
            className="hero-video" autoPlay loop muted playsInline preload="auto"
            poster={pg?.heroImagen || "/fallback.jpg"}
          >
            <source src={`${import.meta.env.BASE_URL}cabecera.mp4`} type="video/mp4" />
          </video>
          <div className="hero-overlay">
            <img src={logo} alt="Logo Rumocyl" className="logo" loading="lazy" />
            <h1 className="visually-hidden">{pg?.titulo || "Rumocyl"}</h1>
            <p className="subtitle">{pg?.subtitulo || "Rutas, cursos y buen rollo sobre dos ruedas"}</p>
            <nav className="hero-nav">
              <a href="#cursos" className="btn btn-outline">Cursos</a>
              <a href="#eventos" className="btn btn-outline">Quedadas</a>
              <a href="#rutas" className="btn btn-outline">Rutas</a>
              <a href="#galeria" className="btn btn-outline">Galería</a>
            </nav>
          </div>
        </header>
      </div>

      {/* === SECCIÓN SOBRE === */}
      <section id="about">
        <h2>Sobre Rumocyl</h2>
        <div>
          <p><strong>Rumocyl no es solo una asociación motera… es una forma de vivir la carretera.</strong></p>
          <p>Aquí las rutas no son simples trayectos, son aventuras que huelen a gasolina y libertad. Organizamos cursos para mejorar tu conducción, quedadas para compartir kilómetros y anécdotas, y rutas por los rincones más espectaculares de Castilla y León.</p>
          <p>En Rumocyl la pasión por las motos se mezcla con la amistad, la seguridad y las ganas de descubrir nuevos horizontes. Seas un veterano de mil curvas o estés empezando, aquí siempre tendrás un hueco en la próxima rodada. <strong>Prepárate, que el motor ya está caliente.</strong></p>
        </div>
      </section>

      {/* === SECCIÓN CURSOS === */}
      <section id="cursos">
        <h2>Próximos cursos</h2>
        <div className="grid">
          {data.cursos.map((c) => (
            <article className="card" key={c.id || c.titulo}>
              {c.imagen && <img src={c.imagen} alt={c.titulo} loading="lazy" />}
              <div className="card-body">
                <div className="meta"><span>{safeDate(c.fecha)}</span><span>{c.lugar}</span></div>
                <h3>{c.titulo}</h3>
                <p className="muted">{c.descripcion}</p>
                <div className="row">
                  <span className="pill-outline">{c.nivel}</span>
                  <a className="link" href={`mailto:rumocyl@gmail.com?subject=Inscripción ${encodeURIComponent(c.titulo)}`}>Apuntarme</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* === SECCIÓN EVENTOS === */}
      <section id="eventos">
        <h2>Quedadas y eventos</h2>
        <div className="grid grid-two">
          {data.eventos.map((e) => (
            <article className="card" key={e.id || e.titulo}>
              <div className="card-split">
                {e.imagen && <img src={e.imagen} alt={e.titulo} loading="lazy" />}
                <div className="card-body">
                  <div className="meta">{safeDate(e.fecha)} • {e.lugar}</div>
                  <h3>{e.titulo}</h3>
                  <p className="muted">{e.descripcion}</p>
                  <div className="row">
                    <a className="link" href={`mailto:rumocyl@gmail.com?subject=Inscripción ${encodeURIComponent(e.titulo)}`}>Apuntarme</a>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* === SECCIÓN RUTAS === */}
      <section id="rutas">
        <h2>Rutas destacadas</h2>
        <div className="grid grid-two">
          {data.rutas.map((r) => (
            <article className="card" key={r.id || r.nombre}>
              <div className="card-split">
                {r.imagen && <img src={r.imagen} alt={r.titulo} loading="lazy" />}
                <div className="card-body">
                  <div className="meta">{r.dificultad} • {r.km} km</div>
                  <h3>{r.nombre}</h3>
                  <p className="muted">{r.descripcion}</p>
                  <div className="row">
                    <a className="link" href={`mailto:rumocyl@gmail.com?subject=Inscripción ${encodeURIComponent(r.nombre)}`}>Apuntarme</a>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* === SECCIÓN GALERÍA === */}
      <section id="galeria">
        <h2>Galería</h2>
        <div className="masonry">
          {data.galeria.map((g) => (
            <a key={g.id || g.url} href={g.url} target="_blank" rel="noreferrer" className="masonry-item">
              <img src={g.url} alt={g.alt || "Foto Rumocyl"} loading="lazy" />
            </a>
          ))}
        </div>
      </section>

      {/* === SECCIÓN CONTACTO CON EMAILJS === */}
      <section id="contacto">
        <h2>Contacto</h2>
        <div className="split">
          <form onSubmit={sendEmail} className="card card-contact">
            <div className="card-body form">
              <input
                name="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Tu nombre"
              />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="Tu email"
              />
              <textarea
                name="message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                placeholder="Mensaje"
                rows={5}
              />
              <button type="submit" className="btn-contact">Enviar mensaje</button>
            </div>
          </form>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="footer">
        <div className="footer-content">
          <span>© {new Date().getFullYear()} Rumocyl · Hecho con ❤ y buen asfalto</span>
          <a
            className="footer-icon"
            href={
              data.rrss.instagram?.startsWith("http")
                ? data.rrss.instagram
                : `https://${data.rrss.instagram}`
            }
            target="_blank"
            rel="noreferrer"
            title="Instagram"
          >
            <FaInstagram size={28} />
          </a>
        </div>
      </footer>

      {loading && <div className="loader">Cargando contenido…</div>}
    </>
  );
}

// === UTILIDAD ===
function safeDate(v) {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleDateString();
}
