import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corpus = JSON.parse(fs.readFileSync(path.join(__dirname, 'chat_corpus.json'), 'utf-8'));
const groundTruthMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'ground_truth_map.json'), 'utf-8'));

function getWords(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function checkZeroOverlap(query, messageText) {
  const qWords = new Set(getWords(query));
  const mWords = new Set(getWords(messageText));
  const overlap = [...qWords].filter(w => mWords.has(w));
  return {
    isZero: overlap.length === 0,
    overlap
  };
}

// Find message by ID
function findMsg(id) {
  const msg = corpus.find(m => m.id === id);
  if (!msg) throw new Error(`Target message not found for ID: ${id}`);
  return msg;
}

// Helper to find message by exact text match
function findMsgByText(substring) {
  const msg = corpus.find(m => m.text.includes(substring));
  if (!msg) throw new Error(`Message containing "${substring}" not found in corpus!`);
  return msg;
}

// Define the 40 benchmark queries
// 8 Hard Zero-Word-Overlap Queries + 32 Warm-up / Multi-modal Queries
const rawQueries = [
  // --- THE 8 HARD ZERO-WORD-OVERLAP QUERIES ---
  {
    id: 'Q_HARD_01',
    query: 'When did we finalize the mountain vacation?',
    targetId: groundTruthMap['manali_decision'],
    category: 'meaning_decision',
    isZeroWordOverlap: true,
    description: 'Decision to finalize the Manali trip. Answer is code-mixed Hinglish confirming dates and booking tickets.'
  },
  {
    id: 'Q_HARD_02',
    query: 'Which residential tenancy deposit was sent?',
    targetId: groundTruthMap['apartment_lease'],
    category: 'meaning_decision',
    isZeroWordOverlap: true,
    description: 'Flat lease token transfer confirmation. Answer uses token/advance terminology.'
  },
  {
    id: 'Q_HARD_03',
    query: 'What item got purchased for Rahul\'s departure?',
    targetId: groundTruthMap['farewell_gift'],
    category: 'meaning_decision',
    isZeroWordOverlap: true,
    description: 'Farewell gift purchase. Answer confirms camera purchase with warranty.'
  },
  {
    id: 'Q_HARD_04',
    query: 'How much did Priya recommend budgeting per person?',
    targetId: groundTruthMap['priya_budget'],
    category: 'person',
    isZeroWordOverlap: true,
    description: 'Priya\'s budget recommendation. Answer gives 12k max cap in Hinglish.'
  },
  {
    id: 'Q_HARD_05',
    query: 'Where was our celebration dinner booked?',
    targetId: groundTruthMap['celebration_dinner'],
    category: 'meaning_decision',
    isZeroWordOverlap: true,
    description: 'Dinner table reservation at Toit.'
  },
  {
    id: 'Q_HARD_06',
    query: 'Who took responsibility for lodging reservation?',
    targetId: groundTruthMap['lodging_booking'],
    category: 'person',
    isZeroWordOverlap: true,
    description: 'Vikram paying homestay advance for the group.'
  },
  {
    id: 'Q_HARD_07',
    query: 'Which automobile transport arrangement got finalized?',
    targetId: groundTruthMap['vehicle_rental'],
    category: 'meaning_decision',
    isZeroWordOverlap: true,
    description: 'Self-drive Zoomcar Scorpio booking.'
  },
  {
    id: 'Q_HARD_08',
    query: 'What time are people meeting at the terminal?',
    targetId: groundTruthMap['terminal_gathering'],
    category: 'meaning_decision',
    isZeroWordOverlap: true,
    description: 'Airport gate 4 gathering time in Hinglish.'
  },

  // --- 32 WARM-UP & MULTI-MODAL QUERIES ---
  // Person Queries (Testing sender attribution and person filtering)
  {
    id: 'Q_PERSON_01',
    query: 'What did Kabir say about the apartment rent?',
    targetId: groundTruthMap['kabir_rent_quote'],
    category: 'person',
    isZeroWordOverlap: false,
    expectedSender: 'Kabir'
  },
  {
    id: 'Q_PERSON_02',
    query: 'What was Neha\'s summary in May?',
    targetId: groundTruthMap['neha_summary_may'],
    category: 'person',
    isZeroWordOverlap: false,
    expectedSender: 'Neha'
  },
  {
    id: 'Q_PERSON_03',
    query: 'Which cafe did Ananya review as 10 on 10?',
    targetId: groundTruthMap['ananya_cafe_review'],
    category: 'person',
    isZeroWordOverlap: false,
    expectedSender: 'Ananya'
  },
  {
    id: 'Q_PERSON_04',
    query: 'What gym workout plan did Amit announce?',
    targetId: groundTruthMap['amit_gym_resolution'],
    category: 'person',
    isZeroWordOverlap: false,
    expectedSender: 'Amit'
  },
  {
    id: 'Q_PERSON_05',
    query: 'What tax deadline reminder did Priya post?',
    targetId: groundTruthMap['priya_tax_deadline'],
    category: 'person',
    isZeroWordOverlap: false,
    expectedSender: 'Priya'
  },
  {
    id: 'Q_PERSON_06',
    query: 'Why was Vikram delayed on the airport road?',
    targetId: groundTruthMap['vikram_car_puncture'],
    category: 'person',
    isZeroWordOverlap: false,
    expectedSender: 'Vikram'
  },
  {
    id: 'Q_PERSON_07',
    query: 'Which biryani did Kabir order for lunch?',
    targetId: groundTruthMap['kabir_biryani_recommendation'],
    category: 'person',
    isZeroWordOverlap: false,
    expectedSender: 'Kabir'
  },
  {
    id: 'Q_PERSON_08',
    query: 'Which board games did Sneha invite everyone for?',
    targetId: groundTruthMap['sneha_board_game'],
    category: 'person',
    isZeroWordOverlap: false,
    expectedSender: 'Sneha'
  },
  {
    id: 'Q_PERSON_09',
    query: 'Which sunrise trek did Rohan suggest booking?',
    targetId: groundTruthMap['rohan_trek_plan'],
    category: 'person',
    isZeroWordOverlap: false,
    expectedSender: 'Rohan'
  },
  {
    id: 'Q_PERSON_10',
    query: 'What did Neha say about the staging deployment?',
    targetId: groundTruthMap['neha_standup_update'],
    category: 'person',
    isZeroWordOverlap: false,
    expectedSender: 'Neha'
  },
  {
    id: 'Q_PERSON_11',
    query: 'Which concert tour did Ananya mention on BookMyShow?',
    targetId: groundTruthMap['ananya_concert_tickets'],
    category: 'person',
    isZeroWordOverlap: false,
    expectedSender: 'Ananya'
  },
  {
    id: 'Q_PERSON_12',
    query: 'What bet did Amit place on the T20 World Cup final?',
    targetId: groundTruthMap['amit_cricket_bet'],
    category: 'person',
    isZeroWordOverlap: false,
    expectedSender: 'Amit'
  },
  {
    id: 'Q_PERSON_13',
    query: 'What bill split amount did Priya request on Splitwise?',
    targetId: groundTruthMap['priya_swiggy_split'],
    category: 'person',
    isZeroWordOverlap: false,
    expectedSender: 'Priya'
  },
  {
    id: 'Q_PERSON_14',
    query: 'Which company job offer did Kabir clear?',
    targetId: groundTruthMap['kabir_interview_cleared'],
    category: 'person',
    isZeroWordOverlap: false,
    expectedSender: 'Kabir'
  },
  {
    id: 'Q_PERSON_15',
    query: 'What traffic waterlogging warning did Vikram give?',
    targetId: groundTruthMap['vikram_traffic_warning'],
    category: 'person',
    isZeroWordOverlap: false,
    expectedSender: 'Vikram'
  },
  {
    id: 'Q_PERSON_16',
    query: 'What playlist did Sneha create for the road trip?',
    targetId: groundTruthMap['sneha_spotify_playlist'],
    category: 'person',
    isZeroWordOverlap: false,
    expectedSender: 'Sneha'
  },

  // Time Queries (Testing temporal boundaries & relative date expressions)
  {
    id: 'Q_TIME_01',
    query: 'What tax reminder was shared in February?',
    targetId: groundTruthMap['priya_tax_deadline'],
    category: 'time',
    isZeroWordOverlap: false,
    timeRange: { start: '2024-02-01', end: '2024-02-29' }
  },
  {
    id: 'Q_TIME_02',
    query: 'What cafe was recommended in March?',
    targetId: groundTruthMap['ananya_cafe_review'],
    category: 'time',
    isZeroWordOverlap: false,
    timeRange: { start: '2024-03-01', end: '2024-03-31' }
  },
  {
    id: 'Q_TIME_03',
    query: 'What flat lease agreement was discussed in April?',
    targetId: groundTruthMap['apartment_lease'],
    category: 'time',
    isZeroWordOverlap: false,
    timeRange: { start: '2024-04-01', end: '2024-04-30' }
  },
  {
    id: 'Q_TIME_04',
    query: 'What games night was planned in May?',
    targetId: groundTruthMap['sneha_board_game'],
    category: 'time',
    isZeroWordOverlap: false,
    timeRange: { start: '2024-05-01', end: '2024-05-31' }
  },
  {
    id: 'Q_TIME_05',
    query: 'What farewell gift was organized in June?',
    targetId: groundTruthMap['farewell_gift'],
    category: 'time',
    isZeroWordOverlap: false,
    timeRange: { start: '2024-06-01', end: '2024-06-30' }
  },
  {
    id: 'Q_TIME_06',
    query: 'What job offer celebration happened in July?',
    targetId: groundTruthMap['kabir_interview_cleared'],
    category: 'time',
    isZeroWordOverlap: false,
    timeRange: { start: '2024-07-01', end: '2024-07-31' }
  },

  // Semantic / Topical Queries
  {
    id: 'Q_SEMANTIC_01',
    query: 'When are we going to Manali for Holi?',
    targetId: groundTruthMap['manali_decision'],
    category: 'meaning_decision',
    isZeroWordOverlap: false
  },
  {
    id: 'Q_SEMANTIC_02',
    query: 'Who paid the homestay advance for the hills trip?',
    targetId: groundTruthMap['lodging_booking'],
    category: 'meaning_decision',
    isZeroWordOverlap: false
  },
  {
    id: 'Q_SEMANTIC_03',
    query: 'Did Vikram book the Scorpio on Zoomcar?',
    targetId: groundTruthMap['vehicle_rental'],
    category: 'meaning_decision',
    isZeroWordOverlap: false
  },
  {
    id: 'Q_SEMANTIC_04',
    query: 'How much token deposit was paid for the 3BHK flat?',
    targetId: groundTruthMap['apartment_lease'],
    category: 'meaning_decision',
    isZeroWordOverlap: false
  },
  {
    id: 'Q_SEMANTIC_05',
    query: 'Which camera was bought for Rahul\'s farewell?',
    targetId: groundTruthMap['farewell_gift'],
    category: 'meaning_decision',
    isZeroWordOverlap: false
  },
  {
    id: 'Q_SEMANTIC_06',
    query: 'Is the table reserved at Toit brewery?',
    targetId: groundTruthMap['celebration_dinner'],
    category: 'meaning_decision',
    isZeroWordOverlap: false
  },
  {
    id: 'Q_SEMANTIC_07',
    query: 'What time is the flight meeting at gate number four?',
    targetId: groundTruthMap['terminal_gathering'],
    category: 'meaning_decision',
    isZeroWordOverlap: false
  },
  {
    id: 'Q_SEMANTIC_08',
    query: 'Which junction had heavy waterlogging in Bangalore?',
    targetId: groundTruthMap['vikram_traffic_warning'],
    category: 'meaning_decision',
    isZeroWordOverlap: false
  },
  {
    id: 'Q_SEMANTIC_09',
    query: 'Who wants to listen to indie Hindi songs on Spotify?',
    targetId: groundTruthMap['sneha_spotify_playlist'],
    category: 'meaning_decision',
    isZeroWordOverlap: false
  },
  {
    id: 'Q_SEMANTIC_10',
    query: 'Did India win the T20 World Cup final bet?',
    targetId: groundTruthMap['amit_cricket_bet'],
    category: 'meaning_decision',
    isZeroWordOverlap: false
  }
];

// Validate all queries and check zero-word overlap for the 8 hard ones
console.log('=== VALIDATING 40 BENCHMARK QUERIES ===');
let hardQueryCount = 0;

const benchmarkQueries = rawQueries.map(q => {
  const targetMsg = findMsg(q.targetId);
  const overlapCheck = checkZeroOverlap(q.query, targetMsg.text);

  if (q.isZeroWordOverlap) {
    hardQueryCount++;
    if (!overlapCheck.isZero) {
      console.error(`FAILED ZERO-WORD CHECK for ${q.id}!`);
      console.error(`Query: "${q.query}"`);
      console.error(`Target: "${targetMsg.text}"`);
      console.error(`Overlapping words:`, overlapCheck.overlap);
      throw new Error(`Zero-word overlap violation in ${q.id}`);
    } else {
      console.log(`PASS [Zero-Word-Overlap] ${q.id}: "${q.query}" -> "${targetMsg.text}"`);
    }
  }

  return {
    ...q,
    targetMessage: {
      id: targetMsg.id,
      sender: targetMsg.sender,
      timestamp: targetMsg.timestamp,
      text: targetMsg.text
    }
  };
});

console.log(`\nValidation complete:`);
console.log(`Total queries: ${benchmarkQueries.length} (Target: 40)`);
console.log(`Hard Zero-Word-Overlap queries: ${hardQueryCount} (Target: >= 8)`);

fs.writeFileSync(
  path.join(__dirname, 'benchmark_queries.json'),
  JSON.stringify(benchmarkQueries, null, 2),
  'utf-8'
);
console.log(`Successfully saved benchmark_queries.json!`);
