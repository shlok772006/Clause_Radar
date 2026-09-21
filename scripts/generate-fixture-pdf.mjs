// Generates a multi-page PDF from eval/fixtures/test-agreement.txt for testing
import fs from 'node:fs';
import path from 'node:path';

function escapePdfText(str) {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildSimplePdf(pagesText) {
  let output = '%PDF-1.4\n';
  const offsets = [];

  function recordObject(num, content) {
    offsets[num] = Buffer.byteLength(output, 'latin1');
    output += `${num} 0 obj\n${content}\nendobj\n`;
  }

  // 1: Catalog
  recordObject(1, '<< /Type /Catalog /Pages 2 0 R >>');

  // 2: Pages root
  const pageRefs = pagesText.map((_, i) => `${3 + i * 2} 0 R`).join(' ');
  recordObject(2, `<< /Type /Pages /Kids [${pageRefs}] /Count ${pagesText.length} >>`);

  // Font
  const fontObjNum = 3 + pagesText.length * 2;

  // Pages and Content Streams
  pagesText.forEach((lines, i) => {
    const pageObjNum = 3 + i * 2;
    const streamObjNum = pageObjNum + 1;

    recordObject(
      pageObjNum,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> /Contents ${streamObjNum} 0 R >>`
    );

    let stream = 'BT /F1 10 Tf 50 740 Td 13 TL\n';
    for (const line of lines) {
      if (line.trim() === '') {
        stream += 'T*\n';
      } else {
        const escaped = escapePdfText(line);
        stream += `(${escaped}) Tj T*\n`;
      }
    }
    stream += 'ET\n';

    recordObject(streamObjNum, `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}endstream`);
  });

  // Font object
  recordObject(fontObjNum, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  const startXref = Buffer.byteLength(output, 'latin1');
  output += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    output += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  output += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
  return Buffer.from(output, 'latin1');
}

const txtPath = path.resolve('eval/fixtures/test-agreement.txt');
const rawText = fs.readFileSync(txtPath, 'utf-8');
const allLines = rawText.split(/\r?\n/);

// Split into ~45 lines per page across ~3 pages
const pages = [];
const linesPerPage = 40;
for (let i = 0; i < allLines.length; i += linesPerPage) {
  pages.push(allLines.slice(i, i + linesPerPage));
}

const pdfBuffer = buildSimplePdf(pages);
const outPath = path.resolve('eval/fixtures/test-agreement.pdf');
fs.writeFileSync(outPath, pdfBuffer);
console.log(`Generated ${outPath} (${pdfBuffer.length} bytes, ${pages.length} pages)`);
