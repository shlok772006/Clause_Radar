import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load .env.local if present
const envLocalPath = path.resolve('.env.local');
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  }
}

const apiKey = process.env.GEMINI_API_KEY;
const rubricPath = path.resolve('config/clause-rubric.yaml');
const rubricContent = fs.readFileSync(rubricPath, 'utf-8');
const rubricDoc = YAML.parse(rubricContent);

const outPath = path.resolve('config/rubric-vectors.json');
const vectorsMap = {};

async function buildVectors() {
  if (!apiKey) {
    console.warn('[build-vectors] No GEMINI_API_KEY found, generating synthetic vectors for build');
    // Generate deterministic 768-dim pseudo-vectors
    for (const item of rubricDoc.items) {
      vectorsMap[item.id] = item.queries.map((q, qIdx) => {
        const vec = new Array(768).fill(0);
        for (let i = 0; i < q.length; i++) {
          vec[i % 768] = (vec[i % 768] + q.charCodeAt(i) * (qIdx + 1)) / 1000;
        }
        return vec;
      });
    }
    fs.writeFileSync(outPath, JSON.stringify(vectorsMap, null, 2));
    console.log(`Wrote fallback vectors for ${Object.keys(vectorsMap).length} items to ${outPath}`);
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const embedModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

  console.log(`Generating embeddings for ${rubricDoc.items.length} rubric items...`);

  for (const item of rubricDoc.items) {
    console.log(`Embedding item: ${item.id} (${item.queries.length} queries)`);
    const itemVectors = [];

    for (const query of item.queries) {
      try {
        const res = await embedModel.embedContent(query);
        itemVectors.push(res.embedding.values);
      } catch (err) {
        console.warn(`Failed embedding query for ${item.id}:`, err.message);
        // Fallback random normalized vector
        const mockVec = Array.from({ length: 768 }, () => Math.random() - 0.5);
        itemVectors.push(mockVec);
      }
    }

    vectorsMap[item.id] = itemVectors;
  }

  fs.writeFileSync(outPath, JSON.stringify(vectorsMap, null, 2));
  console.log(`Successfully wrote ${Object.keys(vectorsMap).length} item vectors to ${outPath}`);
}

buildVectors().catch((err) => {
  console.error('build-vectors failed:', err);
  process.exit(1);
});
