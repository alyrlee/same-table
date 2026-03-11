const HF_MODEL = 'openai/clip-vit-large-patch14';
const HF_BASE = 'https://api-inference.huggingface.co/models';

function getToken() {
  return process.env.HUGGINGFACE_API_TOKEN || '';
}

function isConfigured() {
  return !!process.env.HUGGINGFACE_API_TOKEN;
}

// Default food labels for zero-shot classification
const CULTURAL_FOOD_LABELS = [
  // Jamaican
  'oxtail stew', 'jerk chicken', 'ackee and saltfish', 'rice and peas',
  'curry goat', 'festival bread', 'bammy', 'callaloo',
  // Puerto Rican
  'pernil', 'mofongo', 'arroz con gandules', 'tostones',
  'pasteles', 'alcapurrias', 'tembleque',
  // Dominican
  'mangu', 'sancocho', 'pollo guisado', 'habichuelas guisadas',
  'chimichurri burger', 'tres leches cake',
  // Central American
  'tamales', 'pupusas', 'gallo pinto', 'baleadas',
  'sopa de res', 'platanos fritos', 'enchiladas',
  // Soul Food
  'fried chicken', 'collard greens', 'mac and cheese', 'cornbread',
  'candied yams', 'black eyed peas', 'banana pudding', 'peach cobbler',
  // West African
  'jollof rice', 'egusi soup', 'suya', 'fufu',
  'peanut stew', 'waakye', 'kelewele',
  // Haitian
  'griot', 'diri ak djon djon', 'pikliz', 'soup joumou',
  'legume', 'poulet creole',
  // General
  'salad', 'soup', 'rice dish', 'stew', 'grilled meat',
  'fried food', 'baked goods', 'fruit', 'vegetables',
];

export async function classifyFoodImage(imageBuffer, candidateLabels) {
  if (!isConfigured()) {
    throw new Error('HuggingFace API token not configured');
  }

  const labels = candidateLabels || CULTURAL_FOOD_LABELS;

  const res = await fetch(`${HF_BASE}/${HF_MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {
        image: imageBuffer.toString('base64'),
        candidate_labels: labels,
      },
    }),
  });

  if (!res.ok) {
    // HuggingFace returns 503 when model is loading
    if (res.status === 503) {
      const body = await res.json();
      throw new Error(`Model is loading. Estimated time: ${body.estimated_time || 20}s. Try again shortly.`);
    }
    throw new Error(`CLIP classification failed: ${res.status}`);
  }

  const results = await res.json();

  // Normalize response — HF returns [{label, score}] sorted by score
  return (Array.isArray(results) ? results : [results]).map((r) => ({
    label: r.label,
    score: Math.round((r.score || 0) * 100) / 100,
  }));
}

export function getDefaultFoodLabels() {
  return [...CULTURAL_FOOD_LABELS];
}

export { isConfigured };
