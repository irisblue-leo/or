// Extract OpenRouter model pricing data
// Run: node scripts/fetch-openrouter-models.js

const https = require('https');

const POPULAR_PROVIDERS = ['openai', 'anthropic', 'google', 'meta-llama', 'deepseek', 'qwen', 'mistralai'];

function fetchModels() {
  return new Promise((resolve, reject) => {
    https.get('https://openrouter.ai/api/v1/models', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
      res.on('error', reject);
    });
  });
}

async function main() {
  const result = await fetchModels();
  const models = result.data || [];
  
  console.log(`Total models on OpenRouter: ${models.length}\n`);
  
  // Filter popular models with text output
  const filtered = models.filter(m => {
    const provider = m.id.split('/')[0];
    return POPULAR_PROVIDERS.includes(provider) && 
           m.architecture?.output_modalities?.includes('text') &&
           m.pricing?.prompt && m.pricing?.completion;
  });

  // Sort by provider then name
  filtered.sort((a, b) => a.id.localeCompare(b.id));

  // Format pricing (OpenRouter uses per-token, we need per-1M-tokens)
  const formatted = filtered.map(m => ({
    id: m.id,
    name: m.name,
    context: m.context_length,
    modality: m.architecture?.modality || 'text->text',
    input_per_1m: (parseFloat(m.pricing.prompt) * 1000000).toFixed(4),
    output_per_1m: (parseFloat(m.pricing.completion) * 1000000).toFixed(4),
  }));

  // Print table
  console.log('Model ID'.padEnd(45) + 'Input $/1M'.padEnd(14) + 'Output $/1M'.padEnd(14) + 'Context');
  console.log('-'.repeat(90));
  
  for (const m of formatted) {
    console.log(
      m.id.padEnd(45) + 
      ('$' + m.input_per_1m).padEnd(14) + 
      ('$' + m.output_per_1m).padEnd(14) + 
      (m.context >= 1000000 ? (m.context/1000000).toFixed(1) + 'M' : (m.context/1000).toFixed(0) + 'K')
    );
  }

  // Save full data as JSON
  const fs = require('fs');
  fs.writeFileSync('openrouter-models.json', JSON.stringify(formatted, null, 2));
  console.log(`\nSaved ${formatted.length} models to openrouter-models.json`);
}

main().catch(console.error);
