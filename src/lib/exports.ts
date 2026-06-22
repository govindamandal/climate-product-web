import type { Product } from "@/lib/api";

type PassportPayload = {
  schema: string;
  product: Pick<
    Product,
    | "id"
    | "name"
    | "category"
    | "description"
    | "manufacturer"
    | "country"
    | "production_method"
    | "image_url"
  >;
  material_composition: Product["material_composition"];
  certifications: Product["certifications"];
  environmental_metrics: Product["environmental_records"][number] | null;
  sustainability_score: number;
  generated_at: string;
};

export function buildPassportPayload(product: Product): PassportPayload {
  const latest = product.environmental_records[0] ?? null;
  return {
    schema: "digital-product-passport.v1",
    product: {
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description,
      manufacturer: product.manufacturer,
      country: product.country,
      production_method: product.production_method,
      image_url: product.image_url,
    },
    material_composition: product.material_composition,
    certifications: product.certifications,
    environmental_metrics: latest,
    sustainability_score: latest?.sustainability_score ?? 0,
    generated_at: new Date().toISOString(),
  };
}

export function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function openJsonViewer(filename: string, payload: unknown) {
  const json = JSON.stringify(payload, null, 2);
  const html = `
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(filename)}</title>
        <style>
          body {
            background: #f6f8f7;
            color: #132522;
            font-family: Inter, Arial, sans-serif;
            margin: 0;
          }
          header {
            align-items: center;
            background: #ffffff;
            border-bottom: 1px solid #d7dfdc;
            display: flex;
            justify-content: space-between;
            gap: 16px;
            padding: 16px 20px;
            position: sticky;
            top: 0;
          }
          h1 { font-size: 16px; margin: 0; }
          button {
            background: #177a68;
            border: 0;
            border-radius: 6px;
            color: white;
            cursor: pointer;
            font: inherit;
            padding: 9px 12px;
          }
          main { padding: 20px; }
          pre {
            background: #ffffff;
            border: 1px solid #d7dfdc;
            border-radius: 6px;
            line-height: 1.5;
            margin: 0;
            overflow: auto;
            padding: 16px;
            white-space: pre-wrap;
            word-break: break-word;
          }
        </style>
      </head>
      <body>
        <header>
          <h1>${escapeHtml(filename)}</h1>
          <button id="download-json">Download JSON</button>
        </header>
        <main><pre>${escapeHtml(json)}</pre></main>
        <script>
          const payload = ${JSON.stringify(json)};
          document.getElementById("download-json").addEventListener("click", () => {
            const blob = new Blob([payload], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = ${JSON.stringify(filename)};
            document.body.append(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
          });
        </script>
      </body>
    </html>
  `;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

export function openProductPassportPdf(product: Product) {
  const payload = buildPassportPayload(product);
  const latest = payload.environmental_metrics;
  const pdf = createPassportPdf({
    title: product.name,
    description: product.description || "Environmental product record",
    score: payload.sustainability_score,
    metadata: [
      ["Category", product.category],
      ["Manufacturer", product.manufacturer],
      ["Country", product.country],
      ["Production Method", product.production_method],
    ],
    metrics: latest
      ? [
          ["CO2e", `${latest.co2_kg} kg`],
          ["Water", `${latest.water_liters} L`],
          ["Energy", `${latest.energy_kwh} kWh`],
          ["Transport CO2e", `${latest.transportation_kg_co2} kg`],
          ["Recyclability", `${latest.recyclability_score}/100`],
        ]
      : [],
    materialComposition: JSON.stringify(product.material_composition, null, 2),
    certifications: JSON.stringify(product.certifications, null, 2),
  });
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

export function printProductPassport(product: Product) {
  const payload = buildPassportPayload(product);
  const latest = payload.environmental_metrics;
  const printable = window.open("", "_blank", "width=960,height=720");
  if (!printable) return;

  printable.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(product.name)} Digital Product Passport</title>
        <style>
          @page { margin: 18mm; }
          * { box-sizing: border-box; }
          body {
            color: #132522;
            font-family: Inter, Arial, sans-serif;
            margin: 0;
            padding: 24px;
            line-height: 1.45;
          }
          header {
            border-bottom: 2px solid #1b7969;
            display: flex;
            justify-content: space-between;
            gap: 24px;
            padding-bottom: 18px;
          }
          h1 { font-size: 28px; margin: 0 0 6px; }
          h2 { font-size: 16px; margin: 0 0 12px; }
          section { break-inside: avoid; margin-top: 24px; }
          .muted { color: #64736f; font-size: 12px; }
          .score {
            border: 1px solid #1b7969;
            border-radius: 6px;
            min-width: 96px;
            padding: 10px 12px;
            text-align: center;
          }
          .score strong { display: block; font-size: 26px; }
          .product-image {
            border: 1px solid #d7dfdc;
            border-radius: 6px;
            height: 130px;
            object-fit: cover;
            width: 180px;
          }
          .grid { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .field { border: 1px solid #d7dfdc; border-radius: 6px; padding: 10px 12px; }
          .field span { color: #64736f; display: block; font-size: 11px; text-transform: uppercase; }
          .field strong { display: block; font-size: 14px; margin-top: 4px; }
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 1px solid #d7dfdc; padding: 9px; text-align: left; }
          th { background: #eef3f1; font-size: 12px; text-transform: uppercase; }
          pre {
            background: #f4f7f6;
            border: 1px solid #d7dfdc;
            border-radius: 6px;
            overflow-wrap: anywhere;
            padding: 12px;
            white-space: pre-wrap;
          }
          .actions { margin-top: 20px; }
          @media print {
            body { padding: 14mm; }
            .actions { display: none; }
          }
        </style>
      </head>
      <body>
        <header>
          ${
            product.image_url
              ? `<img class="product-image" src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}" />`
              : ""
          }
          <div>
            <p class="muted">Digital Product Passport</p>
            <h1>${escapeHtml(product.name)}</h1>
            <p>${escapeHtml(product.description || "Environmental product record")}</p>
          </div>
          <div class="score">
            <span class="muted">Score</span>
            <strong>${payload.sustainability_score}</strong>
            <span class="muted">/ 100</span>
          </div>
        </header>

        <section>
          <h2>Product Metadata</h2>
          <div class="grid">
            ${field("Category", product.category)}
            ${field("Manufacturer", product.manufacturer)}
            ${field("Country", product.country)}
            ${field("Production Method", product.production_method)}
          </div>
        </section>

        <section>
          <h2>Environmental Metrics</h2>
          ${
            latest
              ? `<table>
                  <tr><th>CO2e</th><th>Water</th><th>Energy</th><th>Transport CO2e</th><th>Recyclability</th></tr>
                  <tr>
                    <td>${latest.co2_kg} kg</td>
                    <td>${latest.water_liters} L</td>
                    <td>${latest.energy_kwh} kWh</td>
                    <td>${latest.transportation_kg_co2} kg</td>
                    <td>${latest.recyclability_score}/100</td>
                  </tr>
                </table>`
              : "<p>No environmental metrics have been recorded.</p>"
          }
        </section>

        <section>
          <h2>Material Composition</h2>
          <pre>${escapeHtml(JSON.stringify(product.material_composition, null, 2))}</pre>
        </section>

        <section>
          <h2>Certifications</h2>
          <pre>${escapeHtml(JSON.stringify(product.certifications, null, 2))}</pre>
        </section>

        <div class="actions">
          <button onclick="window.print()">Print or Save as PDF</button>
        </div>
        <script>
          window.addEventListener("load", () => setTimeout(() => window.print(), 250));
        </script>
      </body>
    </html>
  `);
  printable.document.close();
}

type PassportPdfDocument = {
  title: string;
  description: string;
  score: number;
  metadata: Array<[string, string]>;
  metrics: Array<[string, string]>;
  materialComposition: string;
  certifications: string;
};

function createPassportPdf(document: PassportPdfDocument) {
  const commands: string[] = [];
  const page = { width: 612, height: 792, margin: 54 };
  const green = "0.09 0.48 0.41";
  const text = "0.07 0.15 0.13";
  const muted = "0.39 0.45 0.44";
  const border = "0.84 0.87 0.86";
  const fill = "0.95 0.97 0.96";

  rect(commands, 0, 0, page.width, page.height, "1 1 1", true);
  let y = 724;
  textLine(commands, "Digital Product Passport", page.margin, y, 10, muted);
  y -= 36;
  y = textBlock(commands, document.title, page.margin, y, 22, 28, text, 28, "F2");
  y -= 18;
  y = textBlock(commands, document.description, page.margin, y, 10, 14, muted, 72);
  y -= 16;
  rect(commands, page.margin, y, 504, 2, green, true);

  rect(commands, 464, 676, 94, 70, green, false);
  textLine(commands, "Score", 495, 722, 10, muted);
  textLine(commands, String(document.score), 494, 697, 26, text, "F2");
  textLine(commands, "/ 100", 500, 682, 10, muted);

  y -= 46;
  textLine(commands, "Product Metadata", page.margin, y, 15, text, "F2");
  y -= 18;
  document.metadata.forEach(([label, value], index) => {
    const x = page.margin + (index % 2) * 258;
    const boxY = y - Math.floor(index / 2) * 56;
    card(commands, x, boxY - 38, 238, 42, border, "1 1 1");
    textLine(commands, label.toUpperCase(), x + 12, boxY - 9, 8, muted);
    textBlock(commands, value, x + 12, boxY - 25, 11, 13, text, 31, "F2");
  });

  y -= 120;
  textLine(commands, "Environmental Metrics", page.margin, y, 15, text, "F2");
  y -= 24;
  if (document.metrics.length) {
    const tableX = page.margin;
    const columnWidth = 504 / document.metrics.length;
    rect(commands, tableX, y - 22, 504, 24, fill, true);
    rect(commands, tableX, y - 46, 504, 48, border, false);
    document.metrics.forEach(([label, value], index) => {
      const x = tableX + index * columnWidth;
      if (index > 0) rect(commands, x, y - 46, 0.7, 48, border, true);
      textLine(commands, label.toUpperCase(), x + 7, y - 14, 7, muted);
      textBlock(commands, value, x + 7, y - 35, 10, 12, text, 12, "F2");
    });
  } else {
    textLine(commands, "No environmental metrics have been recorded.", page.margin, y, 11, muted);
  }

  y -= 88;
  y = pdfSection(commands, "Material Composition", document.materialComposition, page.margin, y, 504);
  pdfSection(commands, "Certifications", document.certifications, page.margin, y - 18, 504);

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${commands.join("\n").length} >>\nstream\n${commands.join("\n")}\nendstream`,
  ];
  let body = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(body.length);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return body;
}

function pdfSection(commands: string[], title: string, value: string, x: number, y: number, width: number) {
  textLine(commands, title, x, y, 15, "0.07 0.15 0.13", "F2");
  const lines = wrapPdfLine(value || "[]", 92).slice(0, 10);
  const height = Math.max(54, lines.length * 12 + 24);
  rect(commands, x, y - height - 14, width, height, "0.95 0.97 0.96", true);
  rect(commands, x, y - height - 14, width, height, "0.84 0.87 0.86", false);
  lines.forEach((line, index) => {
    textLine(commands, line, x + 12, y - 34 - index * 12, 9, "0.07 0.15 0.13");
  });
  return y - height - 22;
}

function card(commands: string[], x: number, y: number, width: number, height: number, stroke: string, fillColor: string) {
  rect(commands, x, y, width, height, fillColor, true);
  rect(commands, x, y, width, height, stroke, false);
}

function rect(commands: string[], x: number, y: number, width: number, height: number, color: string, fillShape: boolean) {
  commands.push(`${color} ${fillShape ? "rg" : "RG"}`);
  commands.push(`${formatPdfNumber(x)} ${formatPdfNumber(y)} ${formatPdfNumber(width)} ${formatPdfNumber(height)} re ${fillShape ? "f" : "S"}`);
}

function textBlock(
  commands: string[],
  value: string,
  x: number,
  y: number,
  fontSize: number,
  lineHeight: number,
  color: string,
  maxLength: number,
  font = "F1",
) {
  const lines = wrapPdfLine(value, maxLength);
  lines.forEach((line, index) => {
    textLine(commands, line, x, y - index * lineHeight, fontSize, color, font);
  });
  return y - (lines.length - 1) * lineHeight;
}

function textLine(commands: string[], value: string, x: number, y: number, fontSize: number, color: string, font = "F1") {
  commands.push(`${color} rg`);
  commands.push(`BT /${font} ${fontSize} Tf ${formatPdfNumber(x)} ${formatPdfNumber(y)} Td (${escapePdfText(value)}) Tj ET`);
}

function wrapPdfLine(value: string, maxLength: number) {
  if (!value) return [""];
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function formatPdfNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function field(label: string, value: string) {
  return `<div class="field"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}
