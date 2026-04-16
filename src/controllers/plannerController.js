const Island = require('../models/Island');
const Trip = require('../models/Trip');
const IslandFeatureCache = require('../models/IslandFeatureCache');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');
const {
  buildRouteOptions,
  resolveOrigin,
  haversineDistance,
  CITIES,
  ANDAMAN_FERRIES,
} = require('../utils/pricingEngine');

let genAIInstances = null;
function getGenAIInstances() {
  if (!genAIInstances) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    
    // Support either comma-separated list or fallback to single key fallback
    const keysString = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
    if (!keysString) throw new Error('No Gemini API keys found in environment.');
    
    const keys = keysString.split(',').map(k => k.trim()).filter(Boolean);
    genAIInstances = keys.map(key => new GoogleGenerativeAI(key));
  }
  return genAIInstances;
}
// Helper: parse AI JSON response
function parseAIJson(text, fallback = {}) {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    // Try to find JSON within the text
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch (e2) {}
    return fallback;
  }
}

// ─── Gemini fallback chain ─────────────────────────────────────
// Cycles through every (key × model) combo so a single exhausted/down
// bucket never takes the whole system down.
const MODELS = [
  'gemini-2.0-flash-lite',  // Highest free capacity
  'gemini-2.0-flash',       // Primary stable model
  // NUKED all preview/experimental models — they consistently return 404 model_missing 
  // on free-tier keys and add ~8 seconds of dead network wait time to the matrix.
];

const CALL_TIMEOUT_MS = 10_000; // 10s per-attempt ceiling — faster matrix cycling

function classifyError(err) {
  const msg = (err?.message || '').toLowerCase();
  if (msg.includes('api_key_invalid') || msg.includes('permission_denied') || msg.includes(' 403')) return 'fatal_key';
  if (msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('too many')) return 'rate_limit';
  if (msg.includes('404') || msg.includes('not found') || msg.includes('model not')) return 'model_missing';
  if (msg.includes('timeout') || msg.includes('aborted') || msg.includes('econnreset') || msg.includes('network') || msg.includes('fetch failed')) return 'transient';
  if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('unavailable')) return 'server';
  return 'unknown';
}

async function callOnce(ai, modelName, prompt) {
  const model = ai.getGenerativeModel({ model: modelName });
  const gen = model.generateContent(prompt);
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error('timeout after ' + CALL_TIMEOUT_MS + 'ms')), CALL_TIMEOUT_MS)
  );
  const result = await Promise.race([gen, timeout]);
  return result.response.text();
}

async function callAI(prompt) {
  const instances = getGenAIInstances();
  const deadKeys = new Set();  // keys marked fatal_key — skip for this call

  // Pass 2 only makes sense for transient errors (network hiccup, server blip).
  // rate_limit won't clear in 2s, and model_missing is permanent — so if Pass 1
  // has zero transient errors, we skip Pass 2 entirely and fall through to the
  // caller's catch block immediately (which serves the fallback response).
  for (let pass = 1; pass <= 2; pass++) {
    let hadTransientError = false; // track if retry is worth attempting

    for (let keyIdx = 0; keyIdx < instances.length; keyIdx++) {
      if (deadKeys.has(keyIdx)) continue;
      const ai = instances[keyIdx];
      const label = `[Pass ${pass}][Key ${keyIdx + 1}/${instances.length}]`;

      for (const modelName of MODELS) {
        try {
          const text = await callOnce(ai, modelName, prompt);
          if (text) {
            if (pass > 1 || keyIdx > 0) console.log(`${label} ${modelName} ✅ recovered`);
            return text;
          }
        } catch (err) {
          const kind = classifyError(err);
          console.log(`${label} ${modelName} ❌ ${kind}: ${(err.message || '').substring(0, 140)}`);

          if (kind === 'fatal_key') {
            deadKeys.add(keyIdx);
            break; // skip remaining models for this key
          }
          if (kind === 'rate_limit' || kind === 'model_missing') {
            continue; // next model — same key, rate limits don't recover in 2s
          }
          if (kind === 'transient' || kind === 'server' || kind === 'unknown') {
            hadTransientError = true; // pass 2 is worth attempting
            await new Promise(r => setTimeout(r, 300));
            continue;
          }
        }
      }
    }

    // Only do Pass 2 if there were transient errors that might have cleared
    if (pass === 1) {
      if (!hadTransientError) {
        console.log('Pass 1: all failures are rate_limit/model_missing — skipping Pass 2, serving fallback immediately.');
        break; // jump straight to caller's catch
      }
      console.log('Pass 1 exhausted with transient errors, waiting 2s and retrying...');
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  throw new Error('All API keys and models exhausted after 2 full passes');
}

// Helper: resolve multiple islands from IDs
async function resolveIslands(islandIds) {
  if (!islandIds || !Array.isArray(islandIds) || islandIds.length === 0) return [];
  const islands = await Island.find({ _id: { $in: islandIds } });
  return islands;
}

// ─────────────────────────────────────────────────────────────
// POST /api/planner/routes
// Step 2: Fetch transportation routes for multi-island trips
// ─────────────────────────────────────────────────────────────
exports.getRoutes = asyncHandler(async (req, res, next) => {
  const { originCity, originLat, originLng, islandIds, islandId } = req.body;

  // Support both single islandId and array islandIds
  const ids = islandIds || (islandId ? [islandId] : []);
  if (ids.length === 0) {
    return next(new ErrorResponse('At least one island ID is required', 400));
  }

  const islands = await resolveIslands(ids);
  if (islands.length === 0) {
    return next(new ErrorResponse('No islands found', 404));
  }

  // Resolve origin
  let originCoords;
  let resolvedCity = originCity;

  if (originLat && originLng) {
    originCoords = { lat: parseFloat(originLat), lng: parseFloat(originLng) };
    let minDist = Infinity;
    for (const [name, coords] of Object.entries(CITIES)) {
      const dist = haversineDistance(originCoords, coords);
      if (dist < minDist) { minDist = dist; resolvedCity = name; }
    }
  } else if (originCity) {
    const resolved = resolveOrigin(originCity);
    if (!resolved) return next(new ErrorResponse(`Could not find city "${originCity}". Try a major Indian city.`, 400));
    originCoords = resolved.coords;
    resolvedCity = resolved.city;
  } else {
    return next(new ErrorResponse('Origin city or coordinates required', 400));
  }

  // Build routes to the primary island (first one / hub island)
  const primaryIsland = islands[0];
  const routeOptions = buildRouteOptions(originCoords, resolvedCity, primaryIsland);

  // Compute inter-island ferry connections for multi-island trips
  const interIslandRoutes = [];
  if (islands.length > 1) {
    for (let i = 0; i < islands.length - 1; i++) {
      const from = islands[i];
      const to = islands[i + 1];
      const fromName = from.name.replace(' Island', '');
      const toName = to.name.replace(' Island', '');

      // Check if there's a known ferry route
      const ferryKey1 = `${fromName} → ${toName}`;
      const ferryKey2 = `Port Blair → ${toName}`;
      const ferry = ANDAMAN_FERRIES[ferryKey1] || ANDAMAN_FERRIES[ferryKey2];

      interIslandRoutes.push({
        from: from.name,
        to: to.name,
        distance: haversineDistance(from.location.coordinates, to.location.coordinates),
        ferry: ferry || { govt: 500, note: 'Local ferry/boat available' },
        note: ferry ? ferry.duration : 'Check local ferry schedule',
      });
    }
  }

  res.status(200).json({
    success: true,
    data: {
      ...routeOptions,
      islands: islands.map(i => ({ id: i._id, name: i.name, group: i.location?.group })),
      interIslandRoutes,
      isMultiIsland: islands.length > 1,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/planner/accommodations
// Step 3: Rich accommodation search across multiple islands
// ─────────────────────────────────────────────────────────────
exports.getAccommodations = asyncHandler(async (req, res, next) => {
  console.log('[ACCOMMODATION] Request received, resolving islands...');
  const { islandIds, islandId, dates, travelers } = req.body;
  const ids = islandIds || (islandId ? [islandId] : []);

  const islands = await resolveIslands(ids);
  if (islands.length === 0) return next(new ErrorResponse('No islands found', 404));

  const nights = dates ? Math.ceil((new Date(dates.end) - new Date(dates.start)) / (1000 * 60 * 60 * 24)) : 3;
  const totalPax = (travelers?.adults || 1) + (travelers?.children || 0);
  const islandNames = islands.map(i => i.name).join(', ');
  const groups = [...new Set(islands.map(i => i.location?.group))].join(', ');

  console.log(`[ACCOMMODATION] Islands: ${islandNames}, Nights: ${nights}, calling AI...`);

  const prompt = `You are an Indian island accommodation expert. Return accommodations for: ${islandNames} (${groups} region). ${nights} nights. ${travelers?.adults || 1} adults, ${travelers?.children || 0} children.

Return ONLY pure JSON (no markdown, no backticks):
{"accommodations":[{"name":"property name","type":"Beach Resort","category":"Luxury","starRating":4,"pricePerNight":8000,"rating":4.3,"amenities":["WiFi","AC","Pool"],"mealsIncluded":{"breakfast":true,"lunch":false,"dinner":false},"description":"Brief description","location":"Area","island":"Island name","bookingTip":"How to book"}]}

Return exactly 8 real properties ranging from budget (500/night) to luxury (20000/night). Include at least 1 government guesthouse if in Andaman/Lakshadweep.`;

  try {
    const text = await callAI(prompt);
    console.log('[ACCOMMODATION] AI responded successfully');
    let parsed = parseAIJson(text, { accommodations: [] });

    if (parsed.accommodations) {
      parsed.accommodations = parsed.accommodations.map(acc => ({
        ...acc,
        totalCost: acc.pricePerNight * nights,
        nights,
        totalPax,
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        islands: islandNames,
        nights,
        ...parsed,
      },
    });
  } catch (err) {
    console.error('AI Accommodation Error:', err.message);
    res.status(200).json({
      success: true,
      data: {
        islands: islandNames,
        nights,
        accommodations: generateFallbackAccommodations(islands, nights),
        note: 'AI service temporarily unavailable. Showing estimated prices.',
      },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/planner/search-hotel
// Search for a specific hotel by name
// ─────────────────────────────────────────────────────────────
exports.searchHotel = asyncHandler(async (req, res, next) => {
  const { query, islandIds, islandId, dates, travelers } = req.body;

  if (!query || query.trim().length < 2) {
    return next(new ErrorResponse('Search query is required (min 2 characters)', 400));
  }

  const ids = islandIds || (islandId ? [islandId] : []);
  const islands = await resolveIslands(ids);
  const islandNames = islands.map(i => i.name).join(', ') || 'Indian Islands';
  const nights = dates ? Math.ceil((new Date(dates.end) - new Date(dates.start)) / (1000 * 60 * 60 * 24)) : 3;

  const prompt = `You are an Indian island accommodation expert. The user is searching for: "${query}"
They are planning to visit: ${islandNames}
Duration: ${nights} nights

Search your knowledge for this hotel/resort/property. If it exists on or near these islands, return its details.
If it doesn't exist there but exists elsewhere in India, mention that.
If it's a general term (like "cottage" or "villa"), return 3-5 relevant options.

Return a JSON object (no markdown, no code blocks, just pure JSON):
{
  "results": [
    {
      "name": "Full property name",
      "type": "Hotel type",
      "category": "Luxury|Premium|Standard|Budget",
      "starRating": 4,
      "pricePerNight": 8000,
      "rating": 4.3,
      "amenities": ["WiFi", "AC", "Pool"],
      "mealsIncluded": { "breakfast": true, "lunch": false, "dinner": false },
      "description": "Description",
      "location": "Location details",
      "island": "Which island",
      "bookingTip": "How to book"
    }
  ],
  "note": "Any clarification if the hotel wasn't found on these islands"
}`;

  try {
    const text = await callAI(prompt);
    let parsed = parseAIJson(text, { results: [], note: 'Could not find matching properties.' });

    if (parsed.results) {
      parsed.results = parsed.results.map(acc => ({
        ...acc,
        totalCost: acc.pricePerNight * nights,
        nights,
      }));
    }

    res.status(200).json({ success: true, data: parsed });
  } catch (err) {
    console.error('Hotel Search Error:', err.message);
    res.status(200).json({
      success: true,
      data: { results: [], note: 'Search service temporarily unavailable.' },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/planner/activities
// Step 4: Activities + food across multiple islands
// ─────────────────────────────────────────────────────────────
exports.getActivities = asyncHandler(async (req, res, next) => {
  const { islandIds, islandId, dates, mealsNeeded } = req.body;
  const ids = islandIds || (islandId ? [islandId] : []);

  const islands = await resolveIslands(ids);
  if (islands.length === 0) return next(new ErrorResponse('No islands found', 404));

  const nights = dates ? Math.ceil((new Date(dates.end) - new Date(dates.start)) / (1000 * 60 * 60 * 24)) : 3;
  const islandNames = islands.map(i => i.name).join(', ');
  const allVibes = [...new Set(islands.flatMap(i => i.vibeTags || []))].join(', ');

  const prompt = `You are an expert travel activities guide for Indian islands.
For a trip covering: ${islandNames}

Island vibes across all islands: ${allVibes}
Duration of stay: ${nights} days
Meals needed: Breakfast: ${mealsNeeded?.breakfast !== false ? 'Yes' : 'No'}, Lunch: ${mealsNeeded?.lunch !== false ? 'Yes' : 'No'}, Dinner: ${mealsNeeded?.dinner !== false ? 'Yes' : 'No'}

Return a JSON object (no markdown, no code blocks, just pure JSON):
{
  "activities": [
    {
      "name": "Activity name",
      "island": "Which island this activity is on",
      "category": "Water Sports|Nature|Cultural|Adventure|Sightseeing|Wellness|Nightlife",
      "pricePerPerson": 2500,
      "duration": "2-3 hours",
      "description": "Brief description",
      "bestTime": "Morning|Afternoon|Evening|All Day",
      "difficulty": "Easy|Moderate|Hard",
      "mustDo": true
    }
  ],
  "dining": [
    {
      "name": "Real Restaurant/Eatery name",
      "island": "Which island",
      "type": "Restaurant|Cafe|Street Food|Beach Shack|Fine Dining",
      "cuisine": "Seafood|Indian|Continental|Local|Multi-Cuisine",
      "avgMealCost": 400,
      "specialty": "Their famous dish",
      "mealType": "Breakfast|Lunch|Dinner|All",
      "mustTry": true
    }
  ],
  "estimatedDailyFoodCost": {
    "budget": 600,
    "standard": 1200,
    "luxury": 2500
  }
}

Rules:
- List 15-20 activities distributed across ALL selected islands (tag each with its island name)
- Mark 4-5 activities as "mustDo": true (the unmissable ones)
- List 8-12 dining options across the islands (real restaurant names)
- Mark 3-4 restaurants as "mustTry": true
- Include FREE activities (beaches, viewpoints, walks) with price 0
- Include cultural activities: temple visits, local craft workshops, cultural shows
- Prices in INR must be realistic for those specific islands`;

  try {
    const text = await callAI(prompt);
    let parsed = parseAIJson(text, { activities: [], dining: [], estimatedDailyFoodCost: { budget: 600, standard: 1200, luxury: 2500 } });

    res.status(200).json({
      success: true,
      data: {
        islands: islandNames,
        days: nights,
        ...parsed,
      },
    });
  } catch (err) {
    console.error('AI Activities Error:', err.message);
    res.status(200).json({
      success: true,
      data: {
        islands: islandNames,
        days: nights,
        activities: generateFallbackActivities(islands),
        dining: [],
        estimatedDailyFoodCost: { budget: 600, standard: 1200, luxury: 2500 },
        note: 'AI service temporarily unavailable.',
      },
    });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/planner/finalize
// Step 5: Multi-island itinerary + budget compilation
// ─────────────────────────────────────────────────────────────
exports.finalize = asyncHandler(async (req, res, next) => {
  const {
    origin, islandIds, islandId, dates, travelers,
    selectedTransport, selectedAccommodation,
    selectedActivities, foodPlan,
  } = req.body;

  const ids = islandIds || (islandId ? [islandId] : []);
  const islands = await resolveIslands(ids);
  if (islands.length === 0) return next(new ErrorResponse('No islands found', 404));

  const islandNames = islands.map(i => i.name).join(', ');
  const nights = Math.ceil((new Date(dates.end) - new Date(dates.start)) / (1000 * 60 * 60 * 24));
  const totalPax = (travelers?.adults || 1) + (travelers?.children || 0);

  // ─── Calculate Budget ────────────────────────────────
  const transportCost = (selectedTransport?.estimatedCost || 0) * totalPax;
  const accommodationCost = selectedAccommodation?.totalCost || 0;
  const activitiesCost = (selectedActivities || []).reduce((sum, a) => sum + (a.totalCost || a.pricePerPerson * totalPax), 0);
  const foodCost = (foodPlan?.estimatedDailyCost || 800) * nights * totalPax;
  const miscCost = Math.round((transportCost + accommodationCost + activitiesCost + foodCost) * 0.1);
  const totalBudget = transportCost + accommodationCost + activitiesCost + foodCost + miscCost;

  const budget = {
    transport: transportCost,
    accommodation: accommodationCost,
    food: foodCost,
    activities: activitiesCost,
    miscellaneous: miscCost,
    total: totalBudget,
    perPerson: Math.round(totalBudget / totalPax),
  };

  // ─── Build Rich Context for AI ─────────────────────────
  // Gather ALL island data for the prompt
  const islandDetails = islands.map(i => ({
    name: i.name,
    group: i.location?.group,
    vibes: (i.vibeTags || []).join(', '),
    bestTime: i.bestTimeToVisit || '',
    permit: i.status?.permitRequired || 'None',
    culinary: (i.culinaryHighlights || []).map(c => `${c.dishName}: ${c.description}`).join('; '),
  }));

  const activitiesList = (selectedActivities || []).map((a, i) =>
    `${i + 1}. ${a.name} (${a.island || 'unspecified'}) — ${a.duration || 'TBD'}, ₹${a.pricePerPerson}/person, Best: ${a.bestTime || 'any time'}`
  ).join('\n');

  const prompt = `You are an expert travel planner who has personally visited every Indian island. You create VIVID, SPECIFIC, UNIQUE day-by-day itineraries that feel like a personal travel diary, NOT a generic template.

═══ TRAVELER PROFILE ═══
- Starting from: ${origin?.city}
- Group: ${travelers?.adults} adults${travelers?.children ? `, ${travelers.children} children` : ''}
- Travel dates: ${new Date(dates.start).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} to ${new Date(dates.end).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
- Duration: ${nights} nights / ${nights + 1} days
- Transport mode: ${selectedTransport?.tag || 'Not specified'}
- Staying at: ${selectedAccommodation?.name || 'Not specified'} (${selectedAccommodation?.type || ''}, ${selectedAccommodation?.category || ''})
- Hotel meals: Breakfast ${selectedAccommodation?.mealsIncluded?.breakfast ? '✅ Included' : '❌ Not included'}, Lunch ${selectedAccommodation?.mealsIncluded?.lunch ? '✅ Included' : '❌ Not included'}, Dinner ${selectedAccommodation?.mealsIncluded?.dinner ? '✅ Included' : '❌ Not included'}

═══ ISLANDS TO VISIT ═══
${islandDetails.map(d => `🏝️ ${d.name} (${d.group})
   Vibes: ${d.vibes}
   Local cuisine: ${d.culinary || 'Seafood, local dishes'}
   Permit: ${d.permit}`).join('\n\n')}

═══ ACTIVITIES THE TRAVELER SELECTED ═══
${activitiesList || 'No specific activities selected — please suggest the best ones!'}

═══ BUDGET ═══
Transport: ₹${transportCost} | Accommodation: ₹${accommodationCost} | Food: ₹${foodCost} | Activities: ₹${activitiesCost} | Total: ₹${totalBudget} (₹${Math.round(totalBudget / totalPax)}/person)

═══ YOUR TASK ═══
Create a UNIQUE, VIVID day-by-day plan. EVERY day must be DIFFERENT and SPECIFIC.

MANDATORY REQUIREMENTS:
1. ❌ NEVER write generic text like "Explore the island" or "Activities and sightseeing" — always name SPECIFIC places, beaches, trails, viewpoints
2. ✅ Each morning/afternoon/evening must describe a SPECIFIC activity at a SPECIFIC named location
3. ✅ Weave the user's selected activities into the most logical days (based on location within the island and timing)
4. ✅ Name REAL restaurants for every meal (not "Local eatery" — give the actual restaurant name and what to order)
5. ✅ Include the natural flow: check-in time, sunset timing, tide timing for water sports
6. ✅ Add SPECIFIC cultural spots: name every temple, church, mosque, memorial, museum by its actual name
7. ✅ Include HIDDEN GEMS: secret viewpoints, less-visited beaches, local fishing villages, mangrove boardwalks, bioluminescent plankton spots
8. ✅ Day 1 should include travel + first impressions (describe the journey itself vividly)
9. ✅ Last day should have checkout, last-minute shopping/sightseeing, and emotional departure
10. ✅ For multi-island trips, include the ferry transfer experience as part of that day (which ferry, timing, what you see during the ride)
11. ✅ Tips should be hyper-specific ("Book the 6:30 AM Makruzz ferry" not "Book ferry in advance")

Return a JSON object (no markdown, no code blocks, ONLY pure JSON):
{
  "dayPlan": [
    {
      "day": 1,
      "island": "Specific island name",
      "title": "Creative, evocative title for this day",
      "morning": "At least 2-3 detailed sentences about morning. Name specific places, timings, what to see.",
      "afternoon": "At least 2-3 detailed sentences about afternoon. Specific activities, locations.",
      "evening": "At least 2-3 sentences about evening. Sunset spot, dinner spot, nightlife.",
      "meals": {
        "breakfast": "Restaurant Name — order the [specific dish] (₹cost range)",
        "lunch": "Restaurant Name — try the [specific dish], known for [reason]",
        "dinner": "Restaurant Name — the [specific dish] here is legendary, pair with [drink]"
      },
      "tips": "Very specific, actionable tip for this day only",
      "transport": "Ferry/travel details if moving between islands, or null"
    }
  ],
  "islandDistribution": [
    { "island": "Name", "days": 3, "highlights": "The 3-4 best things about this island" }
  ],
  "suggestions": {
    "localCuisine": ["Dish Name — detailed description of what it is, where to try it, cost range"],
    "culturalSites": ["Site Name — its history, significance, visiting hours, entry fee"],
    "hiddenGems": ["Specific hidden spot — exact location, why it's special, how to reach it"],
    "localCustoms": ["Specific custom with context and respectful behavior tips"],
    "packingTips": ["Specific item and why it's needed for this exact trip"],
    "emergencyInfo": {
      "nearestHospital": "Full name and location",
      "policeStation": "Full name and location",
      "coastGuard": "Number"
    }
  },
  "travelWarnings": ["Specific warnings relevant to these islands and these dates"]
}`;

  let aiItinerary = { dayPlan: [], suggestions: {}, travelWarnings: [] };

  try {
    const text = await callAI(prompt);
    
    console.log('AI Itinerary raw length:', text.length);
    
    aiItinerary = parseAIJson(text, aiItinerary);
    
    if (!aiItinerary.dayPlan || aiItinerary.dayPlan.length === 0) {
      console.error('AI returned empty dayPlan. Raw text (first 500 chars):', text.substring(0, 500));
      // Try a second parse attempt — sometimes AI wraps in extra objects
      try {
        const innerMatch = text.match(/\{[\s\S]*"dayPlan"[\s\S]*\}/);
        if (innerMatch) {
          aiItinerary = JSON.parse(innerMatch[0]);
        }
      } catch (e2) {
        console.error('Second parse attempt failed:', e2.message);
        aiItinerary = buildFallbackItinerary(islands, nights, selectedActivities);
      }
    }
  } catch (err) {
    console.error('AI Itinerary Error:', err.message);
    aiItinerary = buildFallbackItinerary(islands, nights, selectedActivities);
  }

  // ─── Save Trip ───────────────────────────────────────
  let userId = null;
  if (req.headers.authorization) {
    try {
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (e) { /* guest */ }
  }

  const trip = await Trip.create({
    user: userId,
    origin,
    island: { id: islands[0]._id, name: islandNames, group: islands[0].location?.group },
    dates,
    travelers,
    selectedTransport,
    selectedAccommodation,
    selectedActivities,
    foodPlan,
    budget,
    aiItinerary,
    status: 'completed',
  });

  res.status(200).json({
    success: true,
    data: {
      tripId: trip._id,
      budget,
      itinerary: aiItinerary,
      islands: islands.map(i => ({
        name: i.name,
        group: i.location?.group,
        image: i.images?.[0]?.url,
      })),
    },
  });
});

// ═══════════════════════════════════════════════════════════════
// FALLBACK GENERATORS
// ═══════════════════════════════════════════════════════════════

function generateFallbackAccommodations(islands, nights) {
  const allIslands = Array.isArray(islands) ? islands : [islands];
  const primaryIsland = allIslands[0];
  const group = primaryIsland.location?.group || 'Other';
  const isRemote = ['Andaman', 'Nicobar', 'Lakshadweep'].includes(group);
  const m = isRemote ? 1.3 : 1.0;
  const n = primaryIsland.name;

  return [
    { name: `${n} Luxury Beach Resort`, type: '5-Star Hotel', category: 'Ultra Luxury', starRating: 5, pricePerNight: Math.round(18000 * m), totalCost: Math.round(18000 * m * nights), rating: 4.7, amenities: ['WiFi', 'AC', 'Pool', 'Spa', 'Restaurant', 'Beach Access', 'Diving'], mealsIncluded: { breakfast: true, lunch: true, dinner: true }, description: 'Premium all-inclusive beachfront resort', island: n },
    { name: `${n} Bay Resort`, type: 'Beach Resort', category: 'Luxury', starRating: 4, pricePerNight: Math.round(10000 * m), totalCost: Math.round(10000 * m * nights), rating: 4.4, amenities: ['WiFi', 'AC', 'Pool', 'Restaurant', 'Beach Access'], mealsIncluded: { breakfast: true, lunch: false, dinner: true }, description: 'Elegant resort with ocean views', island: n },
    { name: `${n} Eco Resort`, type: 'Eco Resort', category: 'Premium', starRating: 4, pricePerNight: Math.round(7000 * m), totalCost: Math.round(7000 * m * nights), rating: 4.3, amenities: ['WiFi', 'AC', 'Restaurant', 'Garden'], mealsIncluded: { breakfast: true, lunch: false, dinner: false }, description: 'Sustainable eco-friendly resort', island: n },
    { name: `${n} Private Villa`, type: 'Villa', category: 'Luxury', pricePerNight: Math.round(12000 * m), totalCost: Math.round(12000 * m * nights), rating: 4.5, amenities: ['WiFi', 'AC', 'Kitchen', 'Private Pool', 'Beach Access'], mealsIncluded: { breakfast: false, lunch: false, dinner: false }, description: 'Private villa for family/group', island: n },
    { name: `${n} Seaside Hotel`, type: '3-Star Hotel', category: 'Standard', starRating: 3, pricePerNight: Math.round(4000 * m), totalCost: Math.round(4000 * m * nights), rating: 3.9, amenities: ['WiFi', 'AC', 'Restaurant'], mealsIncluded: { breakfast: true, lunch: false, dinner: false }, description: 'Comfortable mid-range hotel', island: n },
    { name: `${n} Beach Cottage`, type: 'Cottage', category: 'Standard', pricePerNight: Math.round(3000 * m), totalCost: Math.round(3000 * m * nights), rating: 3.7, amenities: ['WiFi', 'Fan/AC', 'Garden'], mealsIncluded: { breakfast: true, lunch: false, dinner: false }, description: 'Charming beachside cottage', island: n },
    { name: `${n} Homestay`, type: 'Homestay', category: 'Budget', pricePerNight: Math.round(1500 * m), totalCost: Math.round(1500 * m * nights), rating: 4.0, amenities: ['WiFi', 'Fan', 'Home Cooking'], mealsIncluded: { breakfast: true, lunch: false, dinner: false }, description: 'Authentic local homestay experience', island: n },
    { name: `${n} Guesthouse`, type: 'Guesthouse', category: 'Budget', pricePerNight: Math.round(1000 * m), totalCost: Math.round(1000 * m * nights), rating: 3.5, amenities: ['Fan', 'Basic WiFi'], mealsIncluded: { breakfast: false, lunch: false, dinner: false }, description: 'Simple and affordable', island: n },
    { name: `${n} Backpacker Hostel`, type: 'Hostel', category: 'Backpacker', pricePerNight: Math.round(500 * m), totalCost: Math.round(500 * m * nights), rating: 3.6, amenities: ['WiFi', 'Common Area', 'Locker'], mealsIncluded: { breakfast: false, lunch: false, dinner: false }, description: 'Dorm beds and social atmosphere', island: n },
    { name: `APWD Guest House ${n}`, type: 'Government Guesthouse', category: 'Budget', pricePerNight: Math.round(800 * m), totalCost: Math.round(800 * m * nights), rating: 3.2, amenities: ['Fan', 'Basic'], mealsIncluded: { breakfast: false, lunch: false, dinner: false }, description: 'Government rest house — book via A&N/Lakshadweep administration', island: n },
  ];
}

function generateFallbackActivities(islands) {
  const allIslands = Array.isArray(islands) ? islands : [islands];
  const activities = [];

  for (const island of allIslands) {
    const vibes = island.vibeTags || [];
    const n = island.name;

    if (vibes.some(v => ['Scuba', 'Snorkeling', 'Marine'].includes(v))) {
      activities.push({ name: 'Scuba Diving', island: n, category: 'Water Sports', pricePerPerson: 3500, duration: '2-3 hours', description: 'Explore coral reefs', bestTime: 'Morning', difficulty: 'Moderate', mustDo: true });
      activities.push({ name: 'Snorkeling', island: n, category: 'Water Sports', pricePerPerson: 1500, duration: '1-2 hours', description: 'Swim with reef fish', bestTime: 'Morning', difficulty: 'Easy' });
    }
    if (vibes.includes('Beach')) {
      activities.push({ name: 'Beach & Swimming', island: n, category: 'Nature', pricePerPerson: 0, duration: 'Half day', description: 'Pristine beaches', bestTime: 'All Day', difficulty: 'Easy' });
    }
    if (vibes.includes('Historical')) {
      activities.push({ name: 'Heritage Walk', island: n, category: 'Cultural', pricePerPerson: 300, duration: '2-3 hours', description: 'Guided historical tour', bestTime: 'Morning', difficulty: 'Easy' });
    }
    activities.push({ name: 'Sunset Viewing', island: n, category: 'Sightseeing', pricePerPerson: 0, duration: '1 hour', description: 'Stunning island sunset', bestTime: 'Evening', difficulty: 'Easy' });
  }

  return activities;
}

function buildFallbackItinerary(islands, nights, selectedActivities = []) {
  const islandNames = islands.map(i => i.name);
  const daysPerIsland = Math.max(1, Math.floor((nights + 1) / islandNames.length));

  // ─── Build pools of unique content per island from DB data ────
  const islandContent = {};
  for (const island of islands) {
    const n = island.name;
    const group = island.location?.group || '';
    const vibes = island.vibeTags || [];
    const summary = island.description?.summary || '';
    const history = island.description?.history || '';
    const flora = island.description?.floraAndFauna || [];
    const cuisine = (island.culinaryHighlights || []).map(c => c.dishName).filter(Boolean);

    // Generate a big pool of unique morning/afternoon/evening activities based on island data
    const mornings = [];
    const afternoons = [];
    const evenings = [];
    const mealOptions = [];
    const tipPool = [];

    // Morning activities based on vibes
    if (vibes.some(v => ['Scuba', 'Snorkeling', 'Marine'].includes(v))) {
      mornings.push(`Head out early for a morning snorkeling session in the crystal-clear waters around ${n}. The visibility is best before 10 AM, and you might spot parrotfish, clownfish, and sea turtles gliding through the coral gardens.`);
      mornings.push(`Book an early morning scuba diving experience at one of ${n}'s renowned dive sites. Even first-timers can enjoy a guided discover scuba session with certified instructors.`);
    }
    if (vibes.some(v => ['Beach', 'Quiet', 'Romantic'].includes(v))) {
      mornings.push(`Wake up to ${summary ? summary.toLowerCase() : 'the sound of waves'}. Take a barefoot walk along the pristine shoreline of ${n} as the sun rises over the ${group === 'Lakshadweep' ? 'turquoise lagoon' : 'Bay of Bengal'}. The beach is virtually empty at this hour — pure magic.`);
      mornings.push(`Start your morning with a refreshing swim at ${n}'s main beach. The water temperature is perfect in the morning hours. After your swim, ${cuisine.length ? `grab a traditional breakfast featuring ${cuisine[0]}` : 'enjoy breakfast at a beachside cafe'}.`);
    }
    if (vibes.some(v => ['Bird Watching', 'Wildlife', 'Nature'].includes(v))) {
      mornings.push(`Join a guided nature walk through ${n}'s ${flora.length ? flora.slice(0, 2).join(' and ') + ' habitat' : 'tropical forest trails'}. Early morning is when the ${vibes.includes('Bird Watching') ? 'rare bird species are most active — bring your binoculars' : 'wildlife comes alive with the chorus of tropical birds'}.`);
    }
    if (vibes.includes('Historical') || vibes.includes('Heritage')) {
      mornings.push(`Visit the heritage sites of ${n}. ${history || `This island has a rich history dating back centuries, with colonial-era architecture and ancient ruins dotting the landscape.`} The morning light makes for perfect photography.`);
    }
    if (vibes.includes('Trekking') || vibes.includes('Adventure')) {
      mornings.push(`Lace up your trekking shoes for a morning hike through ${n}'s interior trails. The tropical canopy keeps you shaded as you ascend to panoramic viewpoints overlooking the ${group === 'Andaman' ? 'Andaman Sea' : 'coastline'}. Watch for ${flora.length ? flora[0] : 'unique tropical plants'} along the way.`);
    }
    // Generic morning fallback
    mornings.push(`Explore the local village area of ${n}. Walk through the narrow lanes, interact with the friendly locals, visit the ${group === 'Lakshadweep' ? 'mosque and community center' : group === 'Andaman' ? 'local fish market' : 'village temple'}. Pick up fresh tropical fruits for a mid-morning snack.`);

    // Afternoon activities
    if (vibes.some(v => ['Beach', 'Scuba', 'Snorkeling'].includes(v))) {
      afternoons.push(`After lunch, take a glass-bottom boat ride to see the coral reefs without getting wet. The afternoon sun lights up the underwater world beautifully. Later, relax on the beach with a fresh coconut water.`);
      afternoons.push(`Spend the afternoon kayaking through the ${group === 'Andaman' ? 'mangrove-lined creeks' : 'calm lagoon waters'} of ${n}. The gentle paddle takes you through a serene landscape where ${flora.length > 1 ? flora[1] : 'mangrove trees'} arch over the water.`);
    }
    if (vibes.some(v => ['Cultural', 'Heritage', 'Historical'].includes(v))) {
      afternoons.push(`Visit ${n}'s cultural center and learn about the local traditions. ${group === 'Andaman' ? 'The Anthropological Museum and Cellular Jail are must-visits.' : group === 'Lakshadweep' ? 'Learn about the unique matrilineal society and Islamic heritage of these islands.' : `Discover the unique blend of cultures that make ${n} special.`}`);
    }
    afternoons.push(`Take a ${group === 'Lakshadweep' ? 'lagoon cruise' : 'coastal walk'} to explore the less-visited parts of ${n}. ${flora.length ? `Keep an eye out for ${flora.slice(-2).join(' and ')}` : 'The diverse ecosystem here is fascinating'}. Stop at viewpoints for photos of the dramatic coastline.`);
    afternoons.push(`Spend a relaxed afternoon at a local cafe or beach shack on ${n}. ${cuisine.length > 1 ? `Try the ${cuisine[1]} — a local favorite.` : 'Sample the fresh seafood — it was caught just this morning.'} Read a book, play beach games, or simply soak in the island atmosphere.`);

    // Evening activities
    evenings.push(`Head to ${n}'s best sunset point — the sky transforms into shades of orange, pink, and purple as the sun dips below the horizon. ${group === 'Andaman' ? 'Chidiya Tapu and Radar Beach are legendary sunset spots.' : group === 'Lakshadweep' ? 'The sunset over the lagoon creates a mirror effect that\'s absolutely surreal.' : `The ${n} sunset is one of those moments you'll remember forever.`}`);
    evenings.push(`Enjoy a leisurely evening walk along the shore of ${n}. ${vibes.includes('Beach') ? 'Some nights, you might spot bioluminescent plankton glowing in the waves — a magical natural phenomenon.' : 'The cool sea breeze and sound of waves make for a perfect end to the day.'} End with dinner at a beachside restaurant.`);
    evenings.push(`Explore ${n}'s local evening scene. ${group === 'Andaman' ? 'The sound and light show at Cellular Jail is a moving experience that brings history alive.' : group === 'Lakshadweep' ? 'Join the local community for evening prayers and tea — they\'re incredibly welcoming to visitors.' : `The local market comes alive in the evening — great for picking up handcrafted souvenirs and local snacks.`}`);

    // Meal suggestions per island
    const dishes = cuisine.length ? cuisine : ['Fresh grilled fish', 'Coconut curry', 'Seafood platter'];
    mealOptions.push(
      { breakfast: `${group === 'Andaman' ? 'Anju Coco Resto — try their Appam with coconut stew' : group === 'Lakshadweep' ? 'Island canteen — traditional Thalassery biryani breakfast' : `Local cafe on ${n} — fresh idli and sambar with coconut chutney`} (₹150-300)` },
      { breakfast: `Hotel breakfast buffet — South Indian spread with fresh ${group === 'Lakshadweep' ? 'Malabar parotta' : 'dosa varieties'} and tropical fruits (included if your stay covers it)` },
      { lunch: `Beachside shack — order the ${dishes[0]} with rice. Freshly caught and cooked right in front of you (₹300-500)` },
      { lunch: `${group === 'Andaman' ? 'New Lighthouse Restaurant — their fish thali' : group === 'Lakshadweep' ? 'Community eatery — Lakshadweep-style tuna curry with steamed rice' : `${n} Seafood Corner — grilled prawns with butter garlic`} is legendary (₹400-700)` },
      { dinner: `${group === 'Andaman' ? 'Fat Martin Cafe — grilled lobster with garlic butter, paired with fresh lime soda' : group === 'Lakshadweep' ? 'Island Retreat kitchen — ${dishes.length > 1 ? dishes[1] : "Mas Huni"} with night-caught tuna sashimi' : `Local restaurant — ${dishes[0]} under the stars`} (₹500-1000)` },
      { dinner: `Beachfront dinner at ${n} — candlelit table by the waves, fresh ${dishes.length > 2 ? dishes[2] : 'catch of the day'}, coconut-based dessert. The sound of waves is your background music (₹600-1200)` },
    );

    // Tips pool
    tipPool.push(
      `Carry reef-safe sunscreen — regular sunscreen damages the coral reefs that make ${n} special.`,
      `${island.status?.permitRequired !== 'None' ? `You need a ${island.status.permitRequired} permit for ${n}. Apply at least 2 weeks in advance.` : `No special permits needed for ${n}, but carry a valid photo ID at all times.`}`,
      `Best time to visit ${n} is ${island.bestTimeToVisit?.startMonth || 'October'} to ${island.bestTimeToVisit?.endMonth || 'March'}. ${island.bestTimeToVisit?.peakSeason ? `Peak season: ${island.bestTimeToVisit.peakSeason}` : ''}`,
      `Cash is king on islands — ATMs are unreliable. Carry enough INR for ${group === 'Lakshadweep' ? '3-4' : '2-3'} days.`,
      `Start water activities before 10 AM for the clearest visibility. Afternoon currents can make snorkeling challenging.`,
      `Pack a waterproof bag for your phone and camera — sea spray is everywhere and salt water kills electronics.`,
      `Download offline maps of ${n} before you arrive — mobile connectivity is ${group === 'Andaman' || group === 'Lakshadweep' ? 'very patchy' : 'decent but not reliable'}.`,
    );

    islandContent[n] = { mornings, afternoons, evenings, mealOptions, tipPool };
  }

  // ─── Build the day plan ─────────────────────────────────
  const dayPlan = [];
  const usedMornings = {}; const usedAfternoons = {}; const usedEvenings = {};
  islands.forEach(i => { usedMornings[i.name] = 0; usedAfternoons[i.name] = 0; usedEvenings[i.name] = 0; });

  for (let i = 0; i <= nights; i++) {
    const islandIdx = Math.min(Math.floor(i / daysPerIsland), islandNames.length - 1);
    const islandName = islandNames[islandIdx];
    const island = islands[islandIdx];
    const content = islandContent[islandName];

    // Get selected activities for this island, cycle through them
    const islandActivities = selectedActivities.filter(a => !a.island || a.island === islandName);
    const activityIdx = islandActivities.length > 0 ? (i % islandActivities.length) : -1;
    const dayActivity = activityIdx >= 0 ? islandActivities[activityIdx] : null;

    // Is this a transition day?
    const nextIslandIdx = Math.min(Math.floor((i + 1) / daysPerIsland), islandNames.length - 1);
    const isTransitionDay = i > 0 && i < nights && nextIslandIdx !== islandIdx;

    let title, morning, afternoon, evening, tips, transport = null;

    if (i === 0) {
      title = `Arrival at ${islandName} — Your Island Adventure Begins`;
      morning = `Board your transport and begin the journey to ${islandName}. ${island.location?.group === 'Andaman' ? 'As the flight descends into Port Blair, the emerald islands dotting the turquoise sea below give you a taste of the beauty ahead.' : island.location?.group === 'Lakshadweep' ? 'The flight over the Indian Ocean reveals stunning coral atolls — tiny green jewels in an endless blue canvas.' : `The journey to ${islandName} itself is part of the adventure.`}`;
      afternoon = `Arrive at ${islandName} and check into your accommodation. ${island.description?.summary || 'Take in the fresh island air.'} After freshening up, take a short walk around the nearby area. Pick up essentials from the local shop and get oriented with the island layout.`;
      evening = content.evenings[0];
      tips = content.tipPool[0];
    } else if (i === nights) {
      title = `Farewell to ${islandName} — Until We Meet Again`;
      morning = `Wake up early for one last sunrise at ${islandName}. Take a quiet moment at the beach — let the waves wash over your feet as you soak in the final moments. Pack your bags and check out. Visit the local market for last-minute souvenirs — ${island.location?.group === 'Andaman' ? 'shell jewelry, coconut-wood carvings, and Nicobari handicrafts' : island.location?.group === 'Lakshadweep' ? 'coral-inspired jewelry, coir products, and Lakshadweep t-shirts' : 'local handicrafts and island specialties'} make great gifts.`;
      afternoon = `Have a farewell lunch at your favorite spot from the trip. ${(island.culinaryHighlights || []).length ? `One last plate of ${island.culinaryHighlights[0].dishName} — you've earned it!` : 'Savor the island flavors one final time.'} Head to the port/airport with a heart full of memories and a camera roll full of sunsets.`;
      evening = `Travel back home. As ${islandName} disappears behind you, you'll already be planning your return. Some places don't just stay in your photos — they stay in your soul.`;
      tips = 'Pack fragile souvenirs in your cabin bag. Keep departure tickets and ID easily accessible. Arrive at the port/airport 1.5 hours early.';
    } else if (isTransitionDay) {
      const nextIsland = islandNames[nextIslandIdx];
      title = `${islandName} → ${nextIsland} — Island Hopping Day`;
      morning = content.mornings[usedMornings[islandName] % content.mornings.length];
      usedMornings[islandName]++;
      afternoon = `Board the ferry from ${islandName} to ${nextIsland}. ${island.location?.group === 'Andaman' ? 'The 2-3 hour Makruzz or Green Ocean ferry ride is an experience itself — watch dolphins playing in the wake and enjoy the sea breeze from the upper deck.' : `The boat journey offers stunning views of the ${island.location?.group} archipelago.`} Arrive and check into your new accommodation.`;
      evening = `Explore the area around your new stay in ${nextIsland}. Take an evening walk to get your bearings and discover the vibe of this new island. Find a local spot for dinner.`;
      tips = `Book inter-island ferries at least 2-3 days in advance during peak season. Keep motion sickness tablets handy. Waterproof your bags for the boat ride.`;
      transport = `Ferry from ${islandName} to ${nextIsland}`;
    } else {
      // Regular exploration days — use unique pool content + user activities
      const mIdx = usedMornings[islandName] % content.mornings.length;
      const aIdx = usedAfternoons[islandName] % content.afternoons.length;
      const eIdx = usedEvenings[islandName] % content.evenings.length;

      if (dayActivity) {
        title = `Day ${i + 1} — ${dayActivity.name} at ${islandName}`;
        morning = `Start your morning with ${dayActivity.name}${dayActivity.duration ? ` (${dayActivity.duration})` : ''}. ${dayActivity.description || `This is one of the highlights of ${islandName}.`} ${dayActivity.bestTime === 'Morning' ? 'Morning is the ideal time for this activity.' : ''}`;
        afternoon = content.afternoons[aIdx];
        usedAfternoons[islandName]++;
      } else {
        title = `Day ${i + 1} — Discovering ${islandName}'s ${['Hidden Treasures', 'Natural Wonders', 'Secret Spots', 'Local Life', 'Coastal Beauty'][i % 5]}`;
        morning = content.mornings[mIdx];
        afternoon = content.afternoons[aIdx];
        usedMornings[islandName]++;
        usedAfternoons[islandName]++;
      }

      evening = content.evenings[eIdx];
      usedEvenings[islandName]++;

      const tipIdx = Math.min(i, content.tipPool.length - 1);
      tips = content.tipPool[tipIdx % content.tipPool.length];
    }

    // Unique meals per day
    const breakfastOpts = content.mealOptions.filter(m => m.breakfast);
    const lunchOpts = content.mealOptions.filter(m => m.lunch);
    const dinnerOpts = content.mealOptions.filter(m => m.dinner);

    dayPlan.push({
      day: i + 1,
      island: islandName,
      title,
      morning,
      afternoon,
      evening,
      meals: {
        breakfast: i === 0 ? 'Have a hearty breakfast before departure — you\'ll need the energy' : (breakfastOpts[i % breakfastOpts.length]?.breakfast || 'Hotel breakfast or local cafe'),
        lunch: lunchOpts[i % lunchOpts.length]?.lunch || `Local seafood restaurant on ${islandName} — try the fresh catch of the day`,
        dinner: dinnerOpts[i % dinnerOpts.length]?.dinner || `Beachfront dinner on ${islandName} — fresh grilled fish under the stars`,
      },
      tips,
      transport,
    });
  }

  return {
    dayPlan,
    islandDistribution: islandNames.map(name => ({
      island: name,
      days: dayPlan.filter(d => d.island === name).length,
      highlights: islands.find(i => i.name === name)?.vibeTags?.join(', ') || 'Beautiful island experience',
    })),
    suggestions: {
      localCuisine: islands.flatMap(i => (i.culinaryHighlights || []).map(c => `${c.dishName} — ${c.description}`)),
      culturalSites: islands.map(i => i.description?.history ? `${i.name} — ${i.description.history}` : null).filter(Boolean),
      hiddenGems: islands.map(i => `${i.name}'s ${(i.description?.floraAndFauna || []).slice(0, 2).join(' and ')} ecosystem — explore the less-visited interior trails for a chance to see these in their natural habitat`).filter(i => i.length > 30),
      localCustoms: [
        islands[0]?.location?.group === 'Lakshadweep' ? 'Lakshadweep is a predominantly Muslim community. Dress modestly and remove shoes before entering homes.' : null,
        islands[0]?.location?.group === 'Andaman' ? 'The indigenous tribes of North Sentinel and Jarawa are protected by law. Do not attempt contact or photography.' : null,
        'Always ask permission before photographing locals, especially fishermen and their families.',
        'Respect marine life — do not touch, step on, or collect coral, shells, or starfish.',
      ].filter(Boolean),
      packingTips: [
        'Reef-safe sunscreen (SPF 50+) — regular sunscreen is banned at many dive sites',
        'Waterproof phone pouch — essential for boat rides and beach activities',
        'Quick-dry clothing — humidity is 80-90% on most Indian islands',
        'Insect repellent — mosquitoes are active at dawn and dusk',
        `Cash in small denominations — ATMs are ${islands[0]?.location?.group === 'Andaman' || islands[0]?.location?.group === 'Lakshadweep' ? 'very rare' : 'unreliable'} on islands`,
        'A light rain jacket — tropical showers can arrive without warning even in peak season',
      ],
      emergencyInfo: {
        nearestHospital: islands[0]?.location?.group === 'Andaman' ? 'G.B. Pant Hospital, Port Blair' : islands[0]?.location?.group === 'Lakshadweep' ? 'Indira Gandhi Hospital, Agatti/Kavaratti' : `District Hospital near ${islands[0]?.name}`,
        policeStation: islands[0]?.location?.group === 'Andaman' ? 'Aberdeen Police Station, Port Blair — 03192-232100' : `Local police station on ${islands[0]?.name}`,
        coastGuard: 'Indian Coast Guard Emergency: 1554 (toll-free)',
      },
    },
    travelWarnings: [
      ...islands
        .filter(i => i.status?.permitRequired && i.status.permitRequired !== 'None')
        .map(i => `${i.name} requires a ${i.status.permitRequired} permit — apply online at least 2 weeks before travel.`),
      ...islands
        .filter(i => i.status?.isProtectedArea)
        .map(i => `${i.name} is a protected area. Follow all environmental guidelines strictly — littering can result in heavy fines.`),
      islands[0]?.location?.group === 'Andaman' ? 'Monsoon season (May-September) sees heavy rainfall and rough seas. Many ferry services are suspended.' : null,
      islands[0]?.location?.group === 'Lakshadweep' ? 'Entry to Lakshadweep for foreign nationals requires special permission from the Lakshadweep Administration.' : null,
    ].filter(Boolean),
    note: 'AI service was temporarily unavailable. This itinerary has been curated using your selected activities and our island database. For an even richer, AI-personalized experience, try generating again after a few minutes.',
  };
}

// ─────────────────────────────────────────────────────────────
// POST /api/planner/feature
// Fetch authentic contextual AI data for island features (Hotels, Restaurants, etc)
// ─────────────────────────────────────────────────────────────
// Fetch one Pexels landscape image by query, returning a large URL or null
async function pexelsImage(query) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`;
    const res = await fetch(url, { headers: { Authorization: key } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.photos || data.photos.length === 0) return null;
    const p = data.photos[0];
    return p.src.large2x || p.src.large || p.src.original;
  } catch (e) {
    return null;
  }
}

const MAX_FEATURE_ITEMS = 12; // upper cap per island/feature
const DEFAULT_FIRST_BATCH = 4;
const DEFAULT_MORE_BATCH = 2;

exports.getIslandFeatureData = asyncHandler(async (req, res, next) => {
  const { islandName, featureType } = req.body;
  const offset = Math.max(0, parseInt(req.body.offset, 10) || 0);
  const limit = Math.max(1, Math.min(6, parseInt(req.body.limit, 10) || (offset === 0 ? DEFAULT_FIRST_BATCH : DEFAULT_MORE_BATCH)));

  if (!islandName || !featureType) {
    return next(new ErrorResponse('Island name and feature type are required', 400));
  }

  // Load (or create) the cumulative cache doc
  let cache = await IslandFeatureCache.findOne({ islandName, featureType });
  const existing = cache?.features || [];

  // 1) Can we serve this slice fully from cache? → instant
  if (existing.length >= offset + limit) {
    const slice = existing.slice(offset, offset + limit);
    return res.status(200).json({
      success: true,
      data: slice,
      total: existing.length,
      hasMore: existing.length < MAX_FEATURE_ITEMS,
      cached: true,
    });
  }

  // 2) We need `needed` more items from the AI
  const needed = Math.min(limit, MAX_FEATURE_ITEMS - existing.length);
  if (needed <= 0) {
    return res.status(200).json({
      success: true,
      data: existing.slice(offset),
      total: existing.length,
      hasMore: false,
    });
  }

  const typeGuide = {
    Hotels: 'real hotels, resorts, or guesthouses that actually exist on or near this island',
    Restaurants: 'real restaurants, cafes, or eateries with their actual names',
    Cuisines: 'real local dishes, regional specialties, and authentic food items found on this island',
    Temples: 'real temples, churches, mosques, or historically significant religious sites',
    Beaches: 'real named beaches on this island',
    Activities: 'real things to do — water sports, treks, viewpoints, tours — that actually exist here',
  }[featureType] || `real ${featureType.toLowerCase()} on this island`;

  const exclusions = existing.map(f => f.name).filter(Boolean);
  const exclusionBlock = exclusions.length
    ? `\n\nDO NOT repeat or closely resemble any of these already-listed items: ${exclusions.join(', ')}.`
    : '';

  const prompt = `You are an expert on Indian island tourism. List EXACTLY ${needed} ${typeGuide} for "${islandName}".${exclusionBlock}

Rules:
- Use REAL names only. If you are uncertain, use the closest mainland equivalent rather than inventing a name.
- Each description must be 2-3 concrete sentences — mention what makes it distinctive (not generic filler).
- "imageKeyword" must be 2-4 English words that will return a relevant travel photo on a stock-photo site. NO island name, NO generic words like "premium" or "authentic". Examples: "beach resort pool", "indian seafood thali", "hindu temple gopuram", "scuba diving coral", "white sand beach palm trees".

Return ONLY pure JSON (no markdown, no prose), matching exactly:
{
  "features": [
    {
      "name": "string — real name",
      "description": "string — 2-3 sentences",
      "rating": 4.5,
      "priceRange": "string like '₹₹', '₹500/person', or 'Free'",
      "tags": ["Tag1", "Tag2", "Tag3"],
      "imageKeyword": "stock photo search keywords"
    }
  ]
}`;

  let freshFeatures = [];
  try {
    const text = await callAI(prompt);
    const parsed = parseAIJson(text, { features: [] });
    if (Array.isArray(parsed.features)) freshFeatures = parsed.features.slice(0, needed);
  } catch (err) {
    console.error('AI Feature Fetch Error:', err.message);
    if (existing.length > offset) {
      // Cache partially covers the request — return what we have rather than 503
      return res.status(200).json({
        success: true,
        data: existing.slice(offset),
        total: existing.length,
        hasMore: false,
        partial: true,
      });
    }
    return res.status(503).json({
      success: false,
      message: 'Our travel guide is temporarily unavailable. Please try again in a minute.',
    });
  }

  if (freshFeatures.length === 0) {
    if (existing.length > offset) {
      return res.status(200).json({
        success: true,
        data: existing.slice(offset),
        total: existing.length,
        hasMore: false,
        partial: true,
      });
    }
    return res.status(503).json({
      success: false,
      message: 'Could not generate results. Please try again in a minute.',
    });
  }

  // Enrich new items with Pexels images (parallel — small batch so it's fast)
  await Promise.all(freshFeatures.map(async (f) => {
    const query = f.imageKeyword || `${featureType} India`;
    f.image = await pexelsImage(query);
  }));

  // Append to cache
  const updatedFeatures = [...existing, ...freshFeatures];
  try {
    cache = await IslandFeatureCache.findOneAndUpdate(
      { islandName, featureType },
      { islandName, featureType, features: updatedFeatures, fetchedAt: new Date() },
      { upsert: true, new: true }
    );
  } catch (e) {
    console.warn('Feature cache save failed:', e.message);
  }

  // Return only the slice the client asked for
  const slice = updatedFeatures.slice(offset, offset + limit);
  res.status(200).json({
    success: true,
    data: slice,
    total: updatedFeatures.length,
    hasMore: updatedFeatures.length < MAX_FEATURE_ITEMS,
  });
});
