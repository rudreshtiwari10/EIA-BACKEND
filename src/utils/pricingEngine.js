/**
 * Pricing Engine for Indian Island Travel
 * 
 * Deterministic calculations based on real Indian transport rates.
 * Covers: Flights, Trains (all classes), Ferries, Buses
 * Hub-based routing: All island groups route through specific mainland hubs.
 */

// ─── Major Indian Cities (lat/lng) ───────────────────────────────────────────
const CITIES = {
  'Delhi': { lat: 28.6139, lng: 77.2090 },
  'New Delhi': { lat: 28.6139, lng: 77.2090 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Bengaluru': { lat: 12.9716, lng: 77.5946 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
  'Kochi': { lat: 9.9312, lng: 76.2673 },
  'Cochin': { lat: 9.9312, lng: 76.2673 },
  'Goa': { lat: 15.2993, lng: 74.1240 },
  'Panaji': { lat: 15.4909, lng: 73.8278 },
  'Bhubaneswar': { lat: 20.2961, lng: 85.8245 },
  'Visakhapatnam': { lat: 17.6868, lng: 83.2185 },
  'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
  'Mangalore': { lat: 12.9141, lng: 74.8560 },
  'Coimbatore': { lat: 11.0168, lng: 76.9558 },
  'Nagpur': { lat: 21.1458, lng: 79.0882 },
  'Indore': { lat: 22.7196, lng: 75.8577 },
  'Bhopal': { lat: 23.2599, lng: 77.4126 },
  'Patna': { lat: 25.6093, lng: 85.1376 },
  'Ranchi': { lat: 23.3441, lng: 85.3096 },
  'Guwahati': { lat: 26.1445, lng: 91.7362 },
  'Chandigarh': { lat: 30.7333, lng: 76.7794 },
  'Srinagar': { lat: 34.0837, lng: 74.7973 },
  'Vadodara': { lat: 22.3072, lng: 73.1812 },
  'Surat': { lat: 21.1702, lng: 72.8311 },
  'Madurai': { lat: 9.9252, lng: 78.1198 },
  'Rameswaram': { lat: 9.2876, lng: 79.3129 },
  'Port Blair': { lat: 11.6234, lng: 92.7265 },
  'Karwar': { lat: 14.8005, lng: 74.1240 },
};

// ─── Hub Routing: Island Group → Mainland Hub ────────────────────────────────
const ISLAND_HUBS = {
  'Andaman': {
    hub: 'Port Blair',
    hubCoords: { lat: 11.6234, lng: 92.7265 },
    flightHubs: ['Chennai', 'Kolkata', 'Delhi', 'Bangalore', 'Mumbai', 'Hyderabad'],
    shipAvailable: true,
    shipFrom: 'Chennai',
    shipDuration: '3-4 days',
    shipCost: { deck: 2100, bunk: 3400, cabin2: 6500, cabin4: 5200, deluxe: 9800 },
  },
  'Nicobar': {
    hub: 'Port Blair',
    hubCoords: { lat: 11.6234, lng: 92.7265 },
    flightHubs: ['Chennai', 'Kolkata', 'Delhi', 'Bangalore'],
    shipAvailable: true,
    shipFrom: 'Chennai',
    shipDuration: '3-4 days',
    shipCost: { deck: 2100, bunk: 3400, cabin2: 6500, cabin4: 5200, deluxe: 9800 },
    note: 'Nicobar requires special Restricted Area Permit (RAP). Most islands are off-limits to tourists.',
  },
  'Lakshadweep': {
    hub: 'Kochi',
    hubCoords: { lat: 9.9312, lng: 76.2673 },
    flightHubs: ['Kochi'], // Only Agatti has an airport
    shipAvailable: true,
    shipFrom: 'Kochi',
    shipDuration: '14-18 hours',
    shipCost: { deck: 2500, bunk: 4500, cabin: 6500, firstClass: 9500 },
    note: 'Entry permit from Lakshadweep Administration required. Book via SPORTS (Society for Promotion of Recreational Tourism & Sports).',
  },
  'Arabian Sea': {
    hub: 'nearest',
    hubCoords: null, // varies
    flightHubs: [],
    shipAvailable: false,
    note: 'These are coastal islands accessible by local ferries or boats from nearby cities.',
  },
  'Offshore Mainland': {
    hub: 'nearest',
    hubCoords: null,
    flightHubs: [],
    shipAvailable: false,
    note: 'Accessible by road/rail to the nearest coastal city, then local ferry.',
  },
  'River Island': {
    hub: 'nearest',
    hubCoords: null,
    flightHubs: [],
    shipAvailable: false,
    note: 'Accessible by road/rail to the nearest city, then local boat.',
  },
  'Other': {
    hub: 'nearest',
    hubCoords: null,
    flightHubs: [],
    shipAvailable: false,
    note: 'Accessible from the nearest mainland city.',
  },
};

// ─── Inter-island Ferry Prices (Andaman) ─────────────────────────────────────
const ANDAMAN_FERRIES = {
  'Port Blair → Havelock': { govt: 630, makruzz: 1350, greenOcean: 1200, nautika: 1450, duration: '1.5-2.5 hrs' },
  'Port Blair → Neil': { govt: 500, makruzz: 1150, greenOcean: 1050, nautika: 1250, duration: '1-2 hrs' },
  'Havelock → Neil': { govt: 400, makruzz: 900, greenOcean: 850, nautika: 950, duration: '1 hr' },
  'Port Blair → Baratang': { govt: 350, duration: '2 hrs (via road + ferry)' },
  'Port Blair → Long Island': { govt: 500, duration: '4-5 hrs' },
  'Port Blair → Diglipur': { govt: 700, duration: '8-10 hrs' },
  'Port Blair → Ross Island': { govt: 150, duration: '15 min' },
};

// ─── Transport Rate Cards ────────────────────────────────────────────────────
const RATES = {
  flight: {
    // INR per km (domestic Indian averages)
    economy: { ratePerKm: 5.5, baseFare: 2500, tax: 0.18 },
    premiumEconomy: { ratePerKm: 7.5, baseFare: 3500, tax: 0.18 },
    business: { ratePerKm: 14, baseFare: 6000, tax: 0.18 },
  },
  train: {
    // INR per km (Indian Railways approximate rates)
    sleeper: { ratePerKm: 0.75, baseFare: 120, minFare: 125 },
    ac3: { ratePerKm: 1.8, baseFare: 250, minFare: 400 },
    ac2: { ratePerKm: 2.5, baseFare: 350, minFare: 700 },
    ac1: { ratePerKm: 4.0, baseFare: 500, minFare: 1200 },
    acChair: { ratePerKm: 1.5, baseFare: 150, minFare: 250 },
  },
  bus: {
    ordinary: { ratePerKm: 1.2, baseFare: 50 },
    ac: { ratePerKm: 2.0, baseFare: 100 },
    volvo: { ratePerKm: 2.8, baseFare: 150 },
  },
};

// ─── Haversine Formula ───────────────────────────────────────────────────────
function haversineDistance(coord1, coord2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// ─── Find Nearest City ───────────────────────────────────────────────────────
function findNearestCity(coords) {
  let nearest = null;
  let minDist = Infinity;
  for (const [name, cityCoords] of Object.entries(CITIES)) {
    const dist = haversineDistance(coords, cityCoords);
    if (dist < minDist) {
      minDist = dist;
      nearest = { name, coords: cityCoords, distance: dist };
    }
  }
  return nearest;
}

// ─── Find Nearest Hub for Non-Hub Islands ────────────────────────────────────
function findNearestHubCity(islandCoords) {
  // For Arabian Sea / Offshore Mainland / River Island / Other groups
  // Find the nearest major city
  const majorCities = ['Mumbai', 'Goa', 'Kochi', 'Chennai', 'Kolkata', 'Mangalore',
    'Karwar', 'Visakhapatnam', 'Bhubaneswar', 'Madurai', 'Rameswaram', 'Guwahati',
    'Ahmedabad', 'Surat', 'Vadodara', 'Thiruvananthapuram'];
  
  let nearest = null;
  let minDist = Infinity;
  for (const city of majorCities) {
    if (CITIES[city]) {
      const dist = haversineDistance(islandCoords, CITIES[city]);
      if (dist < minDist) {
        minDist = dist;
        nearest = { name: city, coords: CITIES[city], distance: dist };
      }
    }
  }
  return nearest;
}

// ─── Calculate Flight Price ──────────────────────────────────────────────────
function calcFlightPrice(distanceKm, classType = 'economy') {
  const rate = RATES.flight[classType];
  if (!rate) return null;
  const base = rate.baseFare + (distanceKm * rate.ratePerKm);
  const total = Math.round(base * (1 + rate.tax));
  // Add variation range (+/- 20%)
  return {
    estimated: total,
    low: Math.round(total * 0.8),
    high: Math.round(total * 1.3),
    class: classType,
  };
}

// ─── Calculate Train Price ───────────────────────────────────────────────────
function calcTrainPrice(distanceKm, classType = 'ac3') {
  const rate = RATES.train[classType];
  if (!rate) return null;
  const base = rate.baseFare + (distanceKm * rate.ratePerKm);
  const total = Math.max(Math.round(base), rate.minFare);
  return {
    estimated: total,
    low: Math.round(total * 0.9),
    high: Math.round(total * 1.15),
    class: classType,
  };
}

// ─── Calculate Bus Price ─────────────────────────────────────────────────────
function calcBusPrice(distanceKm, classType = 'ac') {
  const rate = RATES.bus[classType];
  if (!rate) return null;
  const total = Math.round(rate.baseFare + (distanceKm * rate.ratePerKm));
  return {
    estimated: total,
    low: Math.round(total * 0.85),
    high: Math.round(total * 1.2),
    class: classType,
  };
}

// ─── Generate Mock Live Tickets ──────────────────────────────────────────────
function generateMockTickets(tag, low, high) {
  const isFlight = tag.includes('Flight');
  const isTrain = tag.includes('Train');
  const isBus = tag.includes('Bus');
  const hasFerry = tag.includes('Ferry') || tag.includes('Ship');
  
  const options = [];
  
  // Create 6 realistic options to allow for rich filtering
  for (let i = 0; i < 6; i++) {
    // Determine the price for this specific ticket within the range
    // Options spread from below 'low' to above 'high'
    // i=0 is cheapest, i=5 is premium
    let basePrice = low * 0.9 + ((high * 1.3 - low * 0.9) * (i / 5));
    
    // Add a little randomness so it isn't exactly mathematical
    const variation = (Math.random() * 0.15) - 0.075; // +/- 7.5%
    let finalPrice = Math.floor(basePrice * (1 + variation) / 50) * 50; 
    
    // Randomize time
    const hour = 5 + Math.floor(Math.random() * 14); // 5 AM to 7 PM
    const min = (Math.floor(Math.random() * 4) * 15).toString().padStart(2, '0');
    const timeString = `${hour > 12 ? hour - 12 : hour}:${min} ${hour >= 12 ? 'PM' : 'AM'}`;
    
    let provider = '';
    let number = '';
    let classType = '';
    
    if (isFlight) {
      const airlines = ['IndiGo', 'Air India', 'Vistara', 'SpiceJet', 'Akasa Air'];
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      provider = airline + (hasFerry ? ' + Transfer' : '');
      number = `${airline === 'IndiGo' ? '6E' : airline.substring(0, 2).toUpperCase()}-${100 + Math.floor(Math.random() * 800)}`;
      classType = i >= 4 ? 'Flex/Premium' : (i >= 2 ? 'Standard' : 'Economy Saver');
    } else if (isTrain) {
      const trains = ['Rajdhani Express', 'Shatabdi Exp', 'Duronto Express', 'Superfast Exp', 'Mail/Express'];
      provider = trains[Math.floor(Math.random() * trains.length)] + (hasFerry ? ' + Transfer' : '');
      number = `TRN-${11000 + Math.floor(Math.random() * 5000)}`;
      classType = i >= 4 ? '1A Class' : (i >= 2 ? '2A/3A Class' : 'Sleeper Class');
    } else if (isBus) {
      const operators = ['SRS Travels', 'VRL Travels', 'Orange Tours', 'Kallada', 'State Transport'];
      provider = operators[Math.floor(Math.random() * operators.length)];
      number = `BUS-${Math.floor(Math.random() * 900) + 100}`;
      classType = i >= 4 ? 'Volvo AC Sleeper' : (i >= 2 ? 'AC Seater' : 'Non-AC');
    } else {
      provider = 'Local Operator Transfer';
      number = `TKT-${Math.floor(Math.random() * 9000)}`;
      classType = i >= 3 ? 'Private/Express' : 'Standard';
    }

    options.push({
      id: `tick-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
      provider,
      number,
      classType,
      timeString: `Depart approx ${timeString}`,
      price: finalPrice
    });
  }
  
  return options.sort((a, b) => a.price - b.price);
}


// ─── Main: Build Route Options ───────────────────────────────────────────────
function buildRouteOptions(originCoords, originCity, island) {
  const islandGroup = island.location?.group || 'Other';
  const islandCoords = island.location?.coordinates || {};
  const hubInfo = ISLAND_HUBS[islandGroup] || ISLAND_HUBS['Other'];

  let targetHub;
  if (hubInfo.hub === 'nearest') {
    targetHub = findNearestHubCity(islandCoords);
  } else {
    targetHub = {
      name: hubInfo.hub,
      coords: hubInfo.hubCoords,
      distance: haversineDistance(originCoords, hubInfo.hubCoords),
    };
  }

  const distToHub = haversineDistance(originCoords, targetHub.coords);
  const isOriginNearHub = distToHub < 100; // < 100km means already at/near hub

  const routes = [];

  // ─── Option 1: Flight-based (Fastest) ───────────────────────────────
  if (islandGroup === 'Andaman' || islandGroup === 'Nicobar') {
    // Direct flights to Port Blair exist from major cities
    const flightDist = haversineDistance(originCoords, hubInfo.hubCoords);
    const flightLeg = {
      type: 'flight',
      from: originCity,
      to: 'Port Blair',
      distance: flightDist,
      prices: {
        economy: calcFlightPrice(flightDist, 'economy'),
        premiumEconomy: calcFlightPrice(flightDist, 'premiumEconomy'),
        business: calcFlightPrice(flightDist, 'business'),
      },
      duration: `${Math.round(flightDist / 700 * 60)} min`,
    };
    
    // Add inter-island ferry if destination isn't Port Blair itself
    const ferryKey = `Port Blair → ${island.name.replace(' Island', '')}`;
    const ferry = ANDAMAN_FERRIES[ferryKey];
    
    routes.push({
      category: 'Fastest',
      tag: '✈️ Flight + 🚢 Ferry',
      legs: ferry
        ? [flightLeg, { type: 'ferry', from: 'Port Blair', to: island.name, prices: ferry, note: ferry.duration }]
        : [flightLeg],
      totalEstimate: {
        low: flightLeg.prices.economy.low + (ferry ? ferry.govt : 0),
        high: flightLeg.prices.business.high + (ferry ? (ferry.makruzz || ferry.govt) : 0),
      },
      notes: hubInfo.note || null,
    });

    // Ship option from Chennai
    if (hubInfo.shipAvailable) {
      routes.push({
        category: 'Budget',
        tag: '🚂 Train to Chennai + 🚢 Ship',
        legs: [
          {
            type: 'train',
            from: originCity,
            to: hubInfo.shipFrom,
            distance: haversineDistance(originCoords, CITIES[hubInfo.shipFrom]),
            prices: {
              sleeper: calcTrainPrice(haversineDistance(originCoords, CITIES[hubInfo.shipFrom]), 'sleeper'),
              ac3: calcTrainPrice(haversineDistance(originCoords, CITIES[hubInfo.shipFrom]), 'ac3'),
              ac2: calcTrainPrice(haversineDistance(originCoords, CITIES[hubInfo.shipFrom]), 'ac2'),
              ac1: calcTrainPrice(haversineDistance(originCoords, CITIES[hubInfo.shipFrom]), 'ac1'),
            },
            duration: `${Math.round(haversineDistance(originCoords, CITIES[hubInfo.shipFrom]) / 55)}h (approx)`,
          },
          {
            type: 'ship',
            from: hubInfo.shipFrom,
            to: 'Port Blair',
            prices: hubInfo.shipCost,
            duration: hubInfo.shipDuration,
          },
        ],
        totalEstimate: {
          low: calcTrainPrice(haversineDistance(originCoords, CITIES[hubInfo.shipFrom]), 'sleeper').low + hubInfo.shipCost.deck,
          high: calcTrainPrice(haversineDistance(originCoords, CITIES[hubInfo.shipFrom]), 'ac1').high + hubInfo.shipCost.deluxe,
        },
        notes: 'Ship sails 3-4 times/month from Chennai. Book via A&N Administration.',
      });
    }
  } else if (islandGroup === 'Lakshadweep') {
    // Flights only to Agatti from Kochi
    const distToKochi = haversineDistance(originCoords, CITIES['Kochi']);
    
    if (!isOriginNearHub || targetHub.name !== 'Kochi') {
      // Need to first reach Kochi
      routes.push({
        category: 'Fastest',
        tag: '✈️ Flight to Kochi + ✈️ Flight to Agatti',
        legs: [
          {
            type: 'flight',
            from: originCity,
            to: 'Kochi',
            distance: distToKochi,
            prices: {
              economy: calcFlightPrice(distToKochi, 'economy'),
              business: calcFlightPrice(distToKochi, 'business'),
            },
            duration: `${Math.round(distToKochi / 700 * 60)} min`,
          },
          {
            type: 'flight',
            from: 'Kochi',
            to: 'Agatti Island',
            distance: 460,
            prices: {
              economy: calcFlightPrice(460, 'economy'),
            },
            duration: '1h 30min',
            note: 'Only airline: Air India (limited schedule)',
          },
        ],
        totalEstimate: {
          low: calcFlightPrice(distToKochi, 'economy').low + calcFlightPrice(460, 'economy').low,
          high: calcFlightPrice(distToKochi, 'business').high + calcFlightPrice(460, 'economy').high,
        },
        notes: hubInfo.note || null,
      });
    }

    // Ship from Kochi
    if (hubInfo.shipAvailable) {
      const trainToKochi = haversineDistance(originCoords, CITIES['Kochi']);
      routes.push({
        category: 'Standard',
        tag: '🚂 Train to Kochi + 🚢 Ship',
        legs: [
          {
            type: 'train',
            from: originCity,
            to: 'Kochi',
            distance: trainToKochi,
            prices: {
              sleeper: calcTrainPrice(trainToKochi, 'sleeper'),
              ac3: calcTrainPrice(trainToKochi, 'ac3'),
              ac2: calcTrainPrice(trainToKochi, 'ac2'),
              ac1: calcTrainPrice(trainToKochi, 'ac1'),
            },
            duration: `${Math.round(trainToKochi / 55)}h (approx)`,
          },
          {
            type: 'ship',
            from: 'Kochi',
            to: island.name,
            prices: hubInfo.shipCost,
            duration: hubInfo.shipDuration,
          },
        ],
        totalEstimate: {
          low: calcTrainPrice(trainToKochi, 'sleeper').low + hubInfo.shipCost.deck,
          high: calcTrainPrice(trainToKochi, 'ac1').high + (hubInfo.shipCost.firstClass || hubInfo.shipCost.cabin),
        },
        notes: hubInfo.note || null,
      });
    }
  } else {
    // Arabian Sea, Offshore Mainland, River Island, Other
    // These are typically reached by train/flight to nearest city + local ferry/boat
    const distToNearestHub = haversineDistance(originCoords, targetHub.coords);

    if (distToNearestHub > 100) {
      // Flight option
      routes.push({
        category: 'Fastest',
        tag: `✈️ Flight to ${targetHub.name} + 🚗 Local`,
        legs: [
          {
            type: 'flight',
            from: originCity,
            to: targetHub.name,
            distance: distToNearestHub,
            prices: {
              economy: calcFlightPrice(distToNearestHub, 'economy'),
              business: calcFlightPrice(distToNearestHub, 'business'),
            },
            duration: `${Math.round(distToNearestHub / 700 * 60)} min`,
          },
          {
            type: 'local',
            from: targetHub.name,
            to: island.name,
            note: 'Local ferry/boat/taxi from the nearest city',
            prices: { estimated: 200, low: 100, high: 500 },
          },
        ],
        totalEstimate: {
          low: calcFlightPrice(distToNearestHub, 'economy').low + 100,
          high: calcFlightPrice(distToNearestHub, 'business').high + 500,
        },
      });

      // Train option
      routes.push({
        category: 'Standard',
        tag: `🚂 Train to ${targetHub.name} + 🚗 Local`,
        legs: [
          {
            type: 'train',
            from: originCity,
            to: targetHub.name,
            distance: distToNearestHub,
            prices: {
              sleeper: calcTrainPrice(distToNearestHub, 'sleeper'),
              ac3: calcTrainPrice(distToNearestHub, 'ac3'),
              ac2: calcTrainPrice(distToNearestHub, 'ac2'),
              ac1: calcTrainPrice(distToNearestHub, 'ac1'),
            },
            duration: `${Math.round(distToNearestHub / 55)}h (approx)`,
          },
          {
            type: 'local',
            from: targetHub.name,
            to: island.name,
            note: 'Local ferry/boat/taxi',
            prices: { estimated: 200, low: 100, high: 500 },
          },
        ],
        totalEstimate: {
          low: calcTrainPrice(distToNearestHub, 'sleeper').low + 100,
          high: calcTrainPrice(distToNearestHub, 'ac1').high + 500,
        },
      });

      // Bus option for shorter distances
      if (distToNearestHub < 800) {
        routes.push({
          category: 'Budget',
          tag: `🚌 Bus to ${targetHub.name} + 🚗 Local`,
          legs: [
            {
              type: 'bus',
              from: originCity,
              to: targetHub.name,
              distance: distToNearestHub,
              prices: {
                ordinary: calcBusPrice(distToNearestHub, 'ordinary'),
                ac: calcBusPrice(distToNearestHub, 'ac'),
                volvo: calcBusPrice(distToNearestHub, 'volvo'),
              },
              duration: `${Math.round(distToNearestHub / 40)}h (approx)`,
            },
            {
              type: 'local',
              from: targetHub.name,
              to: island.name,
              note: 'Local ferry/boat/taxi',
              prices: { estimated: 200, low: 100, high: 500 },
            },
          ],
          totalEstimate: {
            low: calcBusPrice(distToNearestHub, 'ordinary').low + 100,
            high: calcBusPrice(distToNearestHub, 'volvo').high + 500,
          },
        });
      }
    } else {
      // Already near the hub
      routes.push({
        category: 'Direct',
        tag: '🚗 Local Transport',
        legs: [
          {
            type: 'local',
            from: originCity,
            to: island.name,
            note: 'Local ferry/boat/taxi from nearby city',
            prices: { estimated: 300, low: 100, high: 800 },
          },
        ],
        totalEstimate: { low: 100, high: 800 },
      });
    }
  }

  // Attach mock tickets to each generated route
  routes.forEach(r => {
    r.mockOptions = generateMockTickets(r.tag, r.totalEstimate.low, r.totalEstimate.high);
  });

  return {
    origin: originCity,
    destination: island.name,
    islandGroup,
    hub: targetHub?.name,
    distanceToHub: targetHub ? haversineDistance(originCoords, targetHub.coords) : 0,
    routes,
    permitInfo: island.status?.permitRequired || 'None',
    warnings: hubInfo.note || null,
  };
}

// ─── Resolve Origin Coords ──────────────────────────────────────────────────
function resolveOrigin(originInput) {
  // Try to match to a known city
  const normalized = originInput.trim();
  for (const [name, coords] of Object.entries(CITIES)) {
    if (name.toLowerCase() === normalized.toLowerCase()) {
      return { city: name, coords };
    }
  }
  // Partial match
  for (const [name, coords] of Object.entries(CITIES)) {
    if (name.toLowerCase().includes(normalized.toLowerCase()) ||
        normalized.toLowerCase().includes(name.toLowerCase())) {
      return { city: name, coords };
    }
  }
  return null;
}

module.exports = {
  CITIES,
  ISLAND_HUBS,
  ANDAMAN_FERRIES,
  RATES,
  haversineDistance,
  findNearestCity,
  findNearestHubCity,
  calcFlightPrice,
  calcTrainPrice,
  calcBusPrice,
  buildRouteOptions,
  resolveOrigin,
};
