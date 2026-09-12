import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Seeded PRNG for 100% deterministic reproducibility
class LCG {
  constructor(seed = 123456789) {
    this.m = 2147483647;
    this.a = 16807;
    this.seed = seed % this.m;
  }
  next() {
    this.seed = (this.a * this.seed) % this.m;
    return (this.seed - 1) / (this.m - 1);
  }
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  choice(array) {
    return array[this.nextInt(0, array.length - 1)];
  }
}

const rng = new LCG(42);

// 8 Distinct Participants
export const PARTICIPANTS = [
  'Rohan',   // The trip planner & organizer
  'Priya',   // The budget keeper / accountant
  'Kabir',   // Foodie, heavy Hinglish slang, flat hunter
  'Ananya',  // Aesthetics, dates, photos
  'Vikram',  // Logistics, driver, bookings
  'Sneha',   // Gifts coordinator, money collector
  'Amit',    // Memes, jokes, 1-word reactions, cricket
  'Neha'     // Busy corporate, late night bursts, summaries
];

// Reusable chatter banks
const ONE_WORD_REPLIES = [
  'haan', 'sahi hai', 'lol', 'ok', 'k', 'done', 'nahi', 'accha',
  'pakka?', 'same', 'true', 'waah', 'oof', 'wait', 'arre', 'niceee',
  'bhai bhai', 'haha', 'hmm', 'yep', 'nope', 'cool', 'perfect'
];

const EMOJI_REPLIES = [
  '😂😂', '👍', '🙌', '💯', '🔥', '👀', '💀', '🤦‍♂️', '🥳', '😎', '🙏'
];

const MEDIA_LINES = [
  '<Media omitted: IMG_20240211_WA0012.jpg>',
  '<Media omitted: IMG_20240315_WA0045.jpg>',
  '<Media omitted: VID_20240402_WA0004.mp4>',
  '<Media omitted: PTT-20240509-WA0019.opus>',
  '<Media omitted: document.pdf>',
  '<Media omitted: screenshot_20240621.png>'
];

const FORWARDED_MESSAGES = [
  '<Forwarded: Good morning! Success comes to those who believe in their dreams. Have a blessed day!>',
  '<Forwarded: Urgent blood requirement in Apollo Hospital Bannerghatta Road, please forward>',
  '<Forwarded: 50% off on Swiggy Gourmet using HDFC cards this weekend>',
  '<Forwarded: Warning: new UPI scam circulating where fake lottery SMS is sent, stay alert guys>',
  '<Forwarded: Top 10 places to visit in Himachal during spring season with budget breakdown>'
];

const CASUAL_TOPICS = [
  {
    topic: 'ipl_cricket',
    messages: [
      { sender: 'Amit', text: 'RCB vs CSK aaj shaam ko hai, kiska support hai?' },
      { sender: 'Kabir', text: 'Obviously CSK bhai, Thala for a reason 🔥' },
      { sender: 'Rohan', text: 'RCB jeetegi aaj for sure, Virat form me hai' },
      { sender: 'Amit', text: 'lol har saal yahi bolte ho' },
      { sender: 'Priya', text: 'match dekhna hai toh pizza order kar lete hai' },
      { sender: 'Sneha', text: 'Dominos pe buy 1 get 1 chal raha hai' },
      { sender: 'Vikram', text: 'Cheese burst mangwana strictly' },
      { sender: 'Neha', text: 'main 8 baje tak call me hu, mera portion bacha ke rakhna' }
    ]
  },
  {
    topic: 'work_rant',
    messages: [
      { sender: 'Neha', text: 'Manager ne 6:30 PM pe ad-hoc meeting daal di, kya bakwaas hai' },
      { sender: 'Priya', text: 'Classic corporate Friday behaviour 💀' },
      { sender: 'Ananya', text: 'Decline kar do bol do emergency dental appointment hai' },
      { sender: 'Neha', text: 'Kaash kar sakti... client escalation hai' },
      { sender: 'Kabir', text: 'Chai sutta break lo sab theek ho jayega' },
      { sender: 'Amit', text: 'Resign on Monday, start chai tapri on Tuesday' }
    ]
  },
  {
    topic: 'weekend_food',
    messages: [
      { sender: 'Kabir', text: 'Kal subah Vidyarthi Bhavan ya CTR dosa?' },
      { sender: 'Ananya', text: 'CTR benne dosa any day! Vidyarthi Bhavan me bohot rush hota hai' },
      { sender: 'Rohan', text: '7:30 AM CTR done karo, late gaye toh line me 1 ghanta lagta hai' },
      { sender: 'Vikram', text: 'Main gaadi leke aaunga, pickup point batao' },
      { sender: 'Sneha', text: 'Filter coffee is mandatory' },
      { sender: 'Amit', text: 'So raha hu main, mujhe mat uthana' }
    ]
  },
  {
    topic: 'movie_outing',
    messages: [
      { sender: 'Ananya', text: 'Dune Part 2 IMAX tickets book karni hai weekend pe' },
      { sender: 'Vikram', text: 'PVR Forum Koramangala ya Vega City?' },
      { sender: 'Rohan', text: 'Vega City IMAX screen bohot better hai' },
      { sender: 'Priya', text: 'Ticket 650 ki hai per head, weekend daylight robbery' },
      { sender: 'Kabir', text: 'Paisa vasool visual spectacle hai Priya' },
      { sender: 'Sneha', text: 'Popcorn combo koi mat lena, bahar se nachos khaa ke jayenge' }
    ]
  }
];

// Ground Truth Answers Definitions
// These IDs will be populated during thread generation
export const GROUND_TRUTH_DATA = {};

export function generateCorpus() {
  const messages = [];
  let currentMsgId = 1000;
  
  // 6 months timeline: 2024-02-01 to 2024-07-31
  let currentTimestamp = new Date('2024-02-01T08:30:00Z').getTime();
  const endTimestamp = new Date('2024-07-31T22:00:00Z').getTime();

  function advanceTime(minMinutes = 2, maxMinutes = 45) {
    const minutes = rng.nextInt(minMinutes, maxMinutes);
    currentTimestamp += minutes * 60 * 1000;
    const date = new Date(currentTimestamp);
    // If it's late night (between 1 AM and 7 AM), jump to morning 8:30 AM
    const hours = date.getUTCHours() + 5.5; // IST approx
    if (hours >= 2 && hours < 8) {
      currentTimestamp += (8 - (hours % 24)) * 60 * 60 * 1000;
    }
  }

  function addMessage(sender, text, options = {}) {
    currentMsgId++;
    advanceTime(options.minMin || 2, options.maxMin || 15);
    const msg = {
      id: `msg_${currentMsgId}`,
      sender,
      timestamp: new Date(currentTimestamp).toISOString(),
      text,
      threadId: options.threadId || 'general_chat',
      isForwarded: options.isForwarded || false,
      isMediaOmitted: options.isMediaOmitted || false,
      isDecision: options.isDecision || false,
      replyTo: options.replyTo || null,
      tags: options.tags || []
    };
    messages.push(msg);
    return msg;
  }

  // --- THREAD 1: MANALI TRIP (March 2024) ---
  // Key decision: "bhai ticket book kar lo ab sab confirmed hai date 14 ko" (Zero overlap with "When did we finalize the mountain vacation?")
  function buildThread1() {
    // Jump time to early March
    currentTimestamp = new Date('2024-03-04T10:00:00Z').getTime();
    
    addMessage('Rohan', 'guys Holi long weekend aa raha hai March end me, what are we doing?', { threadId: 'thread_manali_trip' });
    addMessage('Amit', 'Ghar jaa raha hu main', { threadId: 'thread_manali_trip' });
    addMessage('Kabir', 'Abe Amit ruk ja, let us go to Goa beach scenes', { threadId: 'thread_manali_trip' });
    addMessage('Ananya', 'Goa March me bohot humid ho jayega guys. Let us go to the hills, fresh air!', { threadId: 'thread_manali_trip' });
    addMessage('Priya', 'Budget kitna hoga hills ka? Flights are insanely expensive right now', { threadId: 'thread_manali_trip' });
    addMessage('Vikram', 'Delhi tak train ya cheap flight le sakte hai, then tempo traveller ya Volvo to Himachal', { threadId: 'thread_manali_trip' });
    addMessage('Sneha', 'Manali or Dharamshala? Manali me snow mil sakti hai Solang valley me', { threadId: 'thread_manali_trip' });
    addMessage('Neha', 'Mujhe 2 din ki leave leni padegi. Let me check with my lead on Monday', { threadId: 'thread_manali_trip' });

    // Banter and debate over 30 messages
    for (let i = 0; i < 25; i++) {
      const sender = rng.choice(PARTICIPANTS);
      const chatter = [
        'Kasol bhi jaa sakte hai bagal me',
        'Snow suit rent pe lena padega kya?',
        'bhai pahad pe maggi khane ka sapna hai mera',
        'mera laptop bagal me rahega, work from hills karunga',
        'hotel shortlist karo koi pehle',
        'Zostel Manali check kiya?',
        'Old Manali cafes are super aesthetic'
      ];
      addMessage(sender, rng.choice(chatter), { threadId: 'thread_manali_trip' });
      if (rng.next() > 0.6) addMessage(rng.choice(PARTICIPANTS), rng.choice(ONE_WORD_REPLIES), { threadId: 'thread_manali_trip' });
    }

    // Priya's strict budget message (Ground Truth for Person Query & Zero-word pair 4)
    const priyaBudgetMsg = addMessage('Priya', 'max 12k each strictly usse zyada afford nahi hoga', { 
      threadId: 'thread_manali_trip',
      tags: ['budget', 'priya_quote']
    });
    GROUND_TRUTH_DATA['priya_budget'] = priyaBudgetMsg.id;

    addMessage('Kabir', '12k me mast trip nikal jayegi tension mat lo', { threadId: 'thread_manali_trip' });
    addMessage('Vikram', 'Done, main tempo traveller and stay options dekhta hu', { threadId: 'thread_manali_trip' });

    // Lodging reservation by Vikram (Ground Truth for Zero-word pair 6)
    const lodgingMsg = addMessage('Vikram', 'vikram ne homestay advance de diya don\'t worry', {
      threadId: 'thread_manali_trip',
      isDecision: true,
      tags: ['lodging', 'booking']
    });
    GROUND_TRUTH_DATA['lodging_booking'] = lodgingMsg.id;

    // Vehicle rental arrangement (Ground Truth for Zero-word pair 7)
    const vehicleMsg = addMessage('Vikram', 'self drive car booked zoomcar scorpio pick up at airport', {
      threadId: 'thread_manali_trip',
      isDecision: true,
      tags: ['car', 'transport']
    });
    GROUND_TRUTH_DATA['vehicle_rental'] = vehicleMsg.id;

    // Final Trip Decision message (Ground Truth for Zero-word pair 1)
    const manaliFinalMsg = addMessage('Rohan', 'bhai ticket book kar lo ab sab confirmed hai date 14 ko', {
      threadId: 'thread_manali_trip',
      isDecision: true,
      tags: ['manali_decision', 'trip_finalized']
    });
    GROUND_TRUTH_DATA['manali_decision'] = manaliFinalMsg.id;

    // Terminal gathering time (Ground Truth for Zero-word pair 8)
    const terminalGatheringMsg = addMessage('Vikram', 'gate number four pe assemble karenge subah 5 baje', {
      threadId: 'thread_manali_trip',
      tags: ['terminal_gathering', 'flight_time']
    });
    GROUND_TRUTH_DATA['terminal_gathering'] = terminalGatheringMsg.id;

    addMessage('Amit', 'Sorted scenes! Packing chalu kar raha hu', { threadId: 'thread_manali_trip' });
    addMessage('Ananya', 'Finally! Sunglasses and winter jackets nikal lo sab', { threadId: 'thread_manali_trip' });
  }

  // --- THREAD 2: APARTMENT HUNTING & LEASE (April - May 2024) ---
  function buildThread2() {
    currentTimestamp = new Date('2024-04-10T11:00:00Z').getTime();

    addMessage('Kabir', 'Current flat ka lease khatam ho raha hai next month, we need a 3BHK in Indiranagar or HSR', { threadId: 'thread_apartment_lease' });
    addMessage('Rohan', 'Same bhai, landlord is asking for 20% rent hike, unbearable', { threadId: 'thread_apartment_lease' });
    addMessage('Priya', 'HSR sector 2 or sector 3 is quiet, broker commission bacha sakte hai NoBroker se', { threadId: 'thread_apartment_lease' });
    addMessage('Vikram', 'Maine ek broker ka contact nikala hai, he has 2 standalone buildings with power backup', { threadId: 'thread_apartment_lease' });

    // Banter across 30 messages
    for (let i = 0; i < 20; i++) {
      const sender = rng.choice(['Kabir', 'Rohan', 'Priya', 'Vikram', 'Amit', 'Neha']);
      const flatChat = [
        'Broker bol raha hai 55k rent plus 4k maintenance',
        'Security deposit 6 months maang raha hai pagal ho gaya hai kya',
        'Sunlight aati hai balcony me? Plants rakhne hai',
        'Water tanker dependency hai ya Kaveri water connection hai?',
        'Parking space kitna hai for 2 four-wheelers?',
        'Geyser and chimney installed hai ya khud lagwana padega?',
        '<Media omitted: flat_layout_sketch.png>'
      ];
      addMessage(sender, rng.choice(flatChat), { threadId: 'thread_apartment_lease' });
    }

    // Kabir quote about rent
    const kabirRentQuoteMsg = addMessage('Kabir', 'Rent 48k se 1 rupee upar nahi denge broker ko bol diya hai', {
      threadId: 'thread_apartment_lease',
      tags: ['kabir_rent', 'quote']
    });
    GROUND_TRUTH_DATA['kabir_rent_quote'] = kabirRentQuoteMsg.id;

    // The Flat Lease Finalization (Ground Truth for Zero-word pair 2)
    const flatLeaseMsg = addMessage('Kabir', 'owner agreed, token transferred 25k, lease starts from 1st', {
      threadId: 'thread_apartment_lease',
      isDecision: true,
      tags: ['apartment_decision', 'lease_finalized']
    });
    GROUND_TRUTH_DATA['apartment_lease'] = flatLeaseMsg.id;

    addMessage('Rohan', 'Mubarak ho! Housewarming party plan karte hai ab', { threadId: 'thread_apartment_lease' });
    addMessage('Sneha', 'Shift kab karna hai? Packers and movers ka quote le lo', { threadId: 'thread_apartment_lease' });
  }

  // --- THREAD 3: FAREWELL GIFT & PARTY FOR RAHUL (June - July 2024) ---
  function buildThread3() {
    currentTimestamp = new Date('2024-06-08T14:30:00Z').getTime();

    addMessage('Sneha', 'Guys Rahul is leaving for London on July 10th. We have to organize a farewell gift and a proper party', { threadId: 'thread_farewell_gift' });
    addMessage('Ananya', 'Omg yes! He helped all of us so much during the college projects and placements', { threadId: 'thread_farewell_gift' });
    addMessage('Amit', 'Smart watch de dete hai Apple watch series 9', { threadId: 'thread_farewell_gift' });
    addMessage('Kabir', 'Watch uske paas already Garmin ki hai running ke liye', { threadId: 'thread_farewell_gift' });
    addMessage('Priya', 'Sony ZV-E10 mirrorless camera ya Kindle Paperwhite? He loves photography', { threadId: 'thread_farewell_gift' });

    for (let i = 0; i < 20; i++) {
      const sender = rng.choice(['Sneha', 'Priya', 'Ananya', 'Amit', 'Rohan', 'Neha']);
      const giftChat = [
        'Per person contribution kitna banega?',
        'Sneha UPI ID share kar do group pe',
        'Customized card bhi banwayenge sabke handwritten messages ke saath',
        'Cake order karna hai chocolate truffle with London skyline',
        'Bhai emotional moment ho jayega yaar',
        'Dinner kahan rakhna hai?'
      ];
      addMessage(sender, rng.choice(giftChat), { threadId: 'thread_farewell_gift' });
    }

    // Farewell gift purchase decision (Ground Truth for Zero-word pair 3)
    const farewellGiftMsg = addMessage('Sneha', 'sabka contribution aa gaya, placed order Sony camera 2yr warranty done', {
      threadId: 'thread_farewell_gift',
      isDecision: true,
      tags: ['farewell_decision', 'gift_purchased']
    });
    GROUND_TRUTH_DATA['farewell_gift'] = farewellGiftMsg.id;

    // Evening celebration venue booked (Ground Truth for Zero-word pair 5)
    const celebrationDinnerMsg = addMessage('Rohan', 'table reserved under my name at Toit 830pm sharp', {
      threadId: 'thread_farewell_gift',
      isDecision: true,
      tags: ['celebration_venue', 'dinner_booking']
    });
    GROUND_TRUTH_DATA['celebration_dinner'] = celebrationDinnerMsg.id;

    addMessage('Neha', 'Awesome! Main 8:15 tak Indiranagar pahuch jaungi directly office se', { threadId: 'thread_farewell_gift' });
  }

  // --- ADDITIONAL RICH SPECIFIC MESSAGES FOR WARM-UP 32 QUERIES ---
  const specificGroundTruthMessages = [
    { key: 'neha_summary_may', sender: 'Neha', text: 'Summary of today\'s client meeting: production rollout postponed to June second week', month: '2024-05-15T15:00:00Z', tags: ['work', 'summary'] },
    { key: 'ananya_cafe_review', sender: 'Ananya', text: 'Blue Tokai Indiranagar sourdough toast and pour-over coffee was 10 on 10', month: '2024-03-22T17:30:00Z', tags: ['food', 'review'] },
    { key: 'amit_gym_resolution', sender: 'Amit', text: 'Cult fit pass renew kar liya hai, Monday se strictly 6 AM workout session', month: '2024-02-18T20:10:00Z', tags: ['fitness', 'resolution'] },
    { key: 'priya_tax_deadline', sender: 'Priya', text: 'Reminder guys: Old tax regime vs new tax regime declaration portal closes tonight at 11:59 PM', month: '2024-02-28T19:00:00Z', tags: ['tax', 'finance'] },
    { key: 'vikram_car_puncture', sender: 'Vikram', text: 'Airport road flyover pe rear tyre puncture ho gaya, 30 mins delay hoga', month: '2024-04-05T08:20:00Z', tags: ['travel', 'incident'] },
    { key: 'kabir_biryani_recommendation', sender: 'Kabir', text: 'Meghana Foods chicken boneless biryani with extra salan ordered for lunch', month: '2024-04-18T13:15:00Z', tags: ['food', 'biryani'] },
    { key: 'sneha_board_game', sender: 'Sneha', text: 'Catan and Codenames night at my apartment this Saturday 7 PM bring snacks', month: '2024-05-04T18:40:00Z', tags: ['game_night'] },
    { key: 'rohan_trek_plan', sender: 'Rohan', text: 'Skandagiri sunrise trek booking opens at midnight on Karnataka eco tourism website', month: '2024-05-20T21:45:00Z', tags: ['trek', 'sunrise'] },
    { key: 'neha_standup_update', sender: 'Neha', text: 'Deployed the payment webhook bugfix to staging, testing completed smoothly', month: '2024-06-12T16:20:00Z', tags: ['tech', 'deployment'] },
    { key: 'ananya_concert_tickets', sender: 'Ananya', text: 'Coldplay India tour rumors aa rahe hai BookMyShow pe, be ready guys', month: '2024-06-25T12:00:00Z', tags: ['concert', 'music'] },
    { key: 'amit_cricket_bet', sender: 'Amit', text: 'T20 World Cup final India jeetegi, 500 rs bet with Kabir on Rohit Sharma fifty', month: '2024-06-29T18:50:00Z', tags: ['cricket', 't20'] },
    { key: 'priya_swiggy_split', sender: 'Priya', text: 'Splitwise updated with yesterday\'s barbecue nation bill, 1420 per head please clear', month: '2024-07-02T10:15:00Z', tags: ['splitwise', 'money'] },
    { key: 'kabir_interview_cleared', sender: 'Kabir', text: 'Guys cleared the final technical round at Grab, offer letter coming this week!', month: '2024-07-15T16:00:00Z', tags: ['career', 'interview'] },
    { key: 'vikram_traffic_warning', sender: 'Vikram', text: 'Heavy waterlogging near Silk Board junction, avoid Outer Ring Road completely', month: '2024-07-22T19:30:00Z', tags: ['traffic', 'bangalore'] },
    { key: 'sneha_spotify_playlist', sender: 'Sneha', text: 'Created collaborative monsoon road trip playlist on Spotify, add your indie Hindi songs', month: '2024-07-26T21:10:00Z', tags: ['music', 'playlist'] }
  ];

  // Insert Thread 1
  buildThread1();

  // Insert Thread 2
  buildThread2();

  // Insert Thread 3
  buildThread3();

  // Inject specific ground truth messages with accurate timestamps
  specificGroundTruthMessages.forEach(item => {
    currentTimestamp = new Date(item.month).getTime();
    const msg = addMessage(item.sender, item.text, { tags: item.tags });
    GROUND_TRUTH_DATA[item.key] = msg.id;
  });

  // Now, to reach at least 4,200 messages across the full 6 months,
  // we fill in realistic daily banter, casual conversations, reactions,
  // media lines, forwarded news, and check-ins spread across Feb 1 to Jul 31.
  console.log(`Structured core threads built. Current message count: ${messages.length}. Expanding to 4,200+...`);

  // We distribute ~4,000 noise messages uniformly across the 182 days
  const startDay = new Date('2024-02-01T08:00:00Z').getTime();
  const totalDays = 182; // 6 months
  const messagesPerDay = Math.ceil((4250 - messages.length) / totalDays);

  for (let day = 0; day < totalDays; day++) {
    const dayBaseTime = startDay + (day * 24 * 60 * 60 * 1000);
    // 20-30 messages per day
    const numMsgsToday = rng.nextInt(messagesPerDay - 2, messagesPerDay + 5);

    for (let m = 0; m < numMsgsToday; m++) {
      const timeOffset = rng.nextInt(8 * 3600, 23 * 3600) * 1000;
      currentTimestamp = dayBaseTime + timeOffset;

      const sender = rng.choice(PARTICIPANTS);
      const roll = rng.next();

      let text = '';
      let isForwarded = false;
      let isMediaOmitted = false;

      if (roll < 0.22) {
        // One-word or short reply
        text = rng.choice(ONE_WORD_REPLIES);
      } else if (roll < 0.32) {
        // Emoji reaction
        text = rng.choice(EMOJI_REPLIES);
      } else if (roll < 0.38) {
        // Media omitted
        text = rng.choice(MEDIA_LINES);
        isMediaOmitted = true;
      } else if (roll < 0.42) {
        // Forwarded text
        text = rng.choice(FORWARDED_MESSAGES);
        isForwarded = true;
      } else if (roll < 0.70) {
        // Casual chatter pool
        const casualChatter = [
          'kya chal raha hai public?',
          'bhai bohot thak gaya aaj office me',
          'lunch me kya banaya sabne?',
          'kal sham ko badminton court book kare kya?',
          'swiggy instamart se milk and bread manga raha hu, kisi ko kuch chahiye?',
          'bhai ye Bangalore ka weather itna unpredictable kyu hai',
          'meeting cancel ho gayi, finally breathing room',
          'koi accha show suggest karo Netflix pe binge watch ke liye',
          'coffee peene chalte hai 5 min me',
          'salary credit ho gayi finally! party kab hai?',
          'mera parcel security guard ke paas drop karwa diya',
          'laptop restart ho gaya bina save kiye code',
          'bhai zomato gold discount khatam ho gaya mera',
          'gym jane ka man bilkul nahi ho raha aaj',
          'kisi ke paas extra iPhone charging cable hai flat pe?'
        ];
        text = rng.choice(casualChatter);
      } else {
        // Dialogue snippets
        const topicObj = rng.choice(CASUAL_TOPICS);
        const snippet = rng.choice(topicObj.messages);
        text = snippet.text;
      }

      currentMsgId++;
      messages.push({
        id: `msg_${currentMsgId}`,
        sender,
        timestamp: new Date(currentTimestamp).toISOString(),
        text,
        threadId: 'general_daily',
        isForwarded,
        isMediaOmitted,
        isDecision: false,
        replyTo: null,
        tags: []
      });
    }
  }

  // Sort all messages chronologically by timestamp
  messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Re-index clean IDs sequentially so msg_1001 to msg_N are strictly chronological
  const idMap = new Map();
  messages.forEach((m, idx) => {
    const newId = `msg_${1001 + idx}`;
    idMap.set(m.id, newId);
    m.id = newId;
  });

  // Update ground truth mapping with the new sequential IDs
  for (const [key, oldId] of Object.entries(GROUND_TRUTH_DATA)) {
    GROUND_TRUTH_DATA[key] = idMap.get(oldId);
  }

  console.log(`Total messages generated: ${messages.length}`);
  console.log(`Corpus timeline: ${messages[0].timestamp} -> ${messages[messages.length - 1].timestamp}`);
  return { messages, groundTruths: GROUND_TRUTH_DATA };
}

// Write to files if executed directly
const result = generateCorpus();
const dataDir = path.join(__dirname);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(
  path.join(dataDir, 'chat_corpus.json'),
  JSON.stringify(result.messages, null, 2),
  'utf-8'
);

fs.writeFileSync(
  path.join(dataDir, 'ground_truth_map.json'),
  JSON.stringify(result.groundTruths, null, 2),
  'utf-8'
);

console.log(`Saved chat_corpus.json and ground_truth_map.json successfully.`);
