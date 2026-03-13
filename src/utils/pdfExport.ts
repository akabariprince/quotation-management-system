import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function downloadA4PDF(
  elementId: string,
  title: string,
  appliedFilters?: string[]
): Promise<void> {
  const source = document.getElementById(elementId);
  if (!source) return;

  const W = 780;

  const wrap = document.createElement("div");
  Object.assign(wrap.style, {
    position: "absolute",
    left: "-9999px",
    top: "0",
    width: `${W}px`,
    background: "#fff",
    color: "#000",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "9px",
    lineHeight: "1.3",
    padding: "12px",
    boxSizing: "border-box",
  });

  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const fl =
    appliedFilters?.length
      ? `<div style="font-size:8px;color:#000;margin-top:2px">Filters: ${appliedFilters.join(" | ")}</div>`
      : "";

  wrap.innerHTML = `<div style="text-align:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #000">
    <div style="font-size:12px;font-weight:700;letter-spacing:0.3px">${title.replace(/_/g, " ")}</div>
    <div style="font-size:7px;color:#000;margin-top:1px">${dateStr}</div>${fl}
  </div>`;

  const clone = source.cloneNode(true) as HTMLElement;

  clone.querySelectorAll(".no-pdf").forEach((n) => n.remove());

  // strip all decorations
  clone.querySelectorAll<HTMLElement>("*").forEach((el) => {
    el.style.maxHeight = "none";
    el.style.overflow = "visible";
    el.style.boxShadow = "none";
    el.style.borderRadius = "0";
    el.style.transition = "none";
    el.style.animation = "none";
    el.style.color = "#000";
    el.style.background = "transparent";
  });

  // show hidden columns
  clone.querySelectorAll<HTMLElement>('[class*="hidden"]').forEach((el) => {
    if (/sm:|md:|lg:/.test(el.className)) {
      el.style.display = "table-cell";
    }
  });

  // compact text
  clone.querySelectorAll<HTMLElement>("p, span, td, th, div, h2, h3, h4, label").forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (tag === "h2") {
      el.style.fontSize = "11px";
      el.style.fontWeight = "700";
      el.style.margin = "6px 0 4px";
    } else if (tag === "h3" || tag === "h4") {
      el.style.fontSize = "10px";
      el.style.fontWeight = "600";
      el.style.margin = "4px 0 3px";
    } else {
      el.style.fontSize = "8px";
    }
    el.style.lineHeight = "1.3";
    el.style.color = "#000";
  });

  // tables: black & white, tight, bordered
  clone.querySelectorAll<HTMLElement>("table").forEach((t) => {
    t.style.width = "100%";
    t.style.borderCollapse = "collapse";
    t.style.fontSize = "8px";
    t.style.margin = "0";
  });

  clone.querySelectorAll<HTMLElement>("th").forEach((th) => {
    th.style.background = "#fff";
    th.style.border = "1px solid #000";
    th.style.padding = "4px 5px 5px";
    th.style.fontSize = "7.5px";
    th.style.fontWeight = "700";
    th.style.textAlign = "left";
    th.style.whiteSpace = "nowrap";
    th.style.color = "#000";
    th.style.textTransform = "uppercase";
    th.style.letterSpacing = "0.3px";
  });

  clone.querySelectorAll<HTMLElement>("td").forEach((td) => {
    td.style.border = "1px solid #000";
    td.style.padding = "4px 5px 6px";
    td.style.fontSize = "7.5px";
    td.style.textAlign = "left";
    td.style.verticalAlign = "top";
    td.style.color = "#000";
    td.style.background = "#fff";
  });

  // status badges → plain uppercase text, no color
  const STATUS_WORDS = [
    "draft", "sent", "approved", "expired", "pending",
    "converted", "rejected", "cancelled", "active",
    "completed", "overdue", "closed",
  ];

  clone.querySelectorAll<HTMLElement>("span, td").forEach((el) => {
    const txt = (el.textContent || "").trim().toLowerCase();
    if (STATUS_WORDS.includes(txt)) {
      el.style.textTransform = "uppercase";
      el.style.fontWeight = "700";
      el.style.letterSpacing = "0.5px";
      el.style.fontSize = "7px";
      // remove any badge styling
      el.style.background = "transparent";
      el.style.border = el.tagName === "TD" ? "1px solid #000" : "none";
      el.style.padding = el.tagName === "TD" ? "4px 5px 6px" : "0";
      el.style.borderRadius = "0";
      el.style.color = "#000";
    }
  });

  // cards: plain, no bg
  clone.querySelectorAll<HTMLElement>(".enterprise-card, [class*='bg-card']").forEach((el) => {
    el.style.background = "#fff";
    el.style.border = "1px solid #000";
    el.style.padding = "6px";
    el.style.margin = "4px 0";
  });

  // grids compact
  clone.querySelectorAll<HTMLElement>("[class*='grid']").forEach((el) => {
    el.style.gap = "4px";
  });

  // remove spinners
  clone.querySelectorAll<HTMLElement>(".animate-spin, [class*='Loader']").forEach((el) => {
    el.remove();
  });

  clone.style.width = "100%";
  wrap.appendChild(clone);
  document.body.appendChild(wrap);

  await new Promise((r) => setTimeout(r, 350));

  try {
    const canvas = await html2canvas(wrap, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#fff",
      width: W,
      windowWidth: W,
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const PW = 210;
    const PH = 297;
    const M = 6;
    const CW = PW - M * 2;
    const CH = PH - M * 2 - 4;

    const pxMm = canvas.width / CW;
    const pageHpx = CH * pxMm;

    const breaks = findBreaks(canvas, pageHpx);
    const pages = breaks.length + 1;
    let off = 0;

    for (let i = 0; i < pages; i++) {
      if (i > 0) pdf.addPage();

      const end = i < breaks.length ? breaks[i] : canvas.height;
      const h = end - off;
      if (h <= 0) continue;

      const seg = document.createElement("canvas");
      seg.width = canvas.width;
      seg.height = h;
      seg.getContext("2d")!.drawImage(canvas, 0, off, canvas.width, h, 0, 0, canvas.width, h);

      pdf.addImage(seg.toDataURL("image/png"), "PNG", M, M, CW, h / pxMm, undefined, "FAST");

      pdf.setFontSize(6);
      pdf.setTextColor(0);
      pdf.text(`${i + 1}/${pages}`, PW / 2, PH - 2, { align: "center" });

      off = end;
    }

    pdf.save(`${title}_${new Date().toISOString().slice(0, 10)}.pdf`);
  } finally {
    document.body.removeChild(wrap);
  }
}

function findBreaks(canvas: HTMLCanvasElement, pageH: number): number[] {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const b: number[] = [];
    for (let y = pageH; y < canvas.height; y += pageH) b.push(Math.floor(y));
    return b;
  }

  const w = canvas.width;
  const breaks: number[] = [];
  const scan = Math.floor(pageH * 0.08);
  let target = pageH;

  while (target < canvas.height) {
    const from = Math.max(0, Math.floor(target - scan));
    const to = Math.min(canvas.height - 1, Math.floor(target + scan));
    let bestY = Math.min(Math.floor(target), canvas.height - 1);
    let bestS = Infinity;

    for (let y = from; y <= to; y++) {
      const row = ctx.getImageData(0, y, w, 1).data;
      let s = 0;
      for (let x = 0; x < row.length; x += 16) {
        s += 255 - row[x] + (255 - row[x + 1]) + (255 - row[x + 2]);
      }
      if (s < bestS) {
        bestS = s;
        bestY = y;
      }
    }

    breaks.push(bestY);
    target = bestY + pageH;
  }

  return breaks;
}