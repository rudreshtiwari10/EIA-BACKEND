const islands = [
  {
    name: "Havelock Island",
    nativeName: "Swaraj Dweep",
    location: {
      group: "Andaman",
      coordinates: { lat: 11.9944, lng: 93.0061 },
      area: "113 sq km"
    },
    status: {
      isInhabited: true,
      isProtectedArea: false,
      permitRequired: "None"
    },
    description: {
      summary: "Havelock Island is one of the most famous islands in the Andaman archipelago known for beaches and coral reefs.",
      history: "Named after British General Henry Havelock and renamed Swaraj Dweep in 2018.",
      floraAndFauna: [
        "Coral reefs",
        "Sea turtles",
        "Mangrove forests",
        "Tropical fish",
        "Dense rainforest vegetation"
      ]
    },
    culinaryHighlights: [
      {
        dishName: "Grilled Lobster",
        description: "Fresh lobster grilled with butter and spices"
      }
    ],
    bestTimeToVisit: {
      startMonth: "October",
      endMonth: "May",
      peakSeason: "December to February"
    },
    vibeTags: ["Beach","Scuba","Adventure","Snorkeling"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=800",
        caption: "Radhanagar Beach"
      }
    ],
    externalLinks: {
      wikiUrl: "https://en.wikipedia.org/wiki/Havelock_Island",
      govtPortal: "https://andaman.gov.in"
    }
  },

  {
    name: "Neil Island",
    nativeName: "Shaheed Dweep",
    location: {
      group: "Andaman",
      coordinates: { lat: 11.8312, lng: 93.0476 },
      area: "18.9 sq km"
    },
    status: {
      isInhabited: true,
      isProtectedArea: false,
      permitRequired: "None"
    },
    description: {
      summary: "A peaceful island known for coral reefs and natural rock bridges.",
      history: "Renamed Shaheed Dweep in 2018.",
      floraAndFauna: [
        "Coral reefs",
        "Sea anemones",
        "Palm groves",
        "Reef fish",
        "Tropical birds"
      ]
    },
    culinaryHighlights: [
      {
        dishName: "Coconut Prawn Curry",
        description: "Fresh prawns cooked in coconut gravy"
      }
    ],
    bestTimeToVisit: {
      startMonth: "October",
      endMonth: "May",
      peakSeason: "November to March"
    },
    vibeTags: ["Quiet","Snorkeling","Beach"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800",
        caption: "Natural rock bridge"
      }
    ],
    externalLinks: {
      wikiUrl: "https://en.wikipedia.org/wiki/Neil_Island",
      govtPortal: "https://andaman.gov.in"
    }
  },

  {
    name: "Agatti Island",
    nativeName: "Agatti",
    location: {
      group: "Lakshadweep",
      coordinates: { lat: 10.8519, lng: 72.192 },
      area: "7.6 sq km"
    },
    status: {
      isInhabited: true,
      isProtectedArea: false,
      permitRequired: "Special Permission"
    },
    description: {
      summary: "Gateway island to Lakshadweep with stunning lagoons.",
      history: "Historically connected with Arab trade routes.",
      floraAndFauna: [
        "Coral reefs",
        "Lagoon fish",
        "Sea turtles",
        "Coconut plantations",
        "Seabirds"
      ]
    },
    culinaryHighlights: [
      {
        dishName: "Tuna Curry",
        description: "Lakshadweep style tuna cooked with coconut"
      }
    ],
    bestTimeToVisit: {
      startMonth: "October",
      endMonth: "March",
      peakSeason: "December to February"
    },
    vibeTags: ["Scuba","Snorkeling","Beach"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?q=80&w=800",
        caption: "Agatti lagoon"
      }
    ],
    externalLinks: {
      wikiUrl: "https://en.wikipedia.org/wiki/Agatti_Island",
      govtPortal: "https://lakshadweep.gov.in"
    }
  },

  {
    name: "Diu Island",
    nativeName: "Diu",
    location: {
      group: "Offshore Mainland",
      coordinates: { lat: 20.7144, lng: 70.9873 },
      area: "40 sq km"
    },
    status: {
      isInhabited: true,
      isProtectedArea: false,
      permitRequired: "None"
    },
    description: {
      summary: "Island off Gujarat famous for beaches and Portuguese architecture.",
      history: "Under Portuguese rule from 1535 to 1961.",
      floraAndFauna: [
        "Coastal palms",
        "Migratory birds",
        "Marine fish",
        "Rocky shore ecosystems",
        "Coastal shrubs"
      ]
    },
    culinaryHighlights: [
      {
        dishName: "Fish Recheiado",
        description: "Spicy stuffed fish with Portuguese influence"
      }
    ],
    bestTimeToVisit: {
      startMonth: "October",
      endMonth: "March",
      peakSeason: "December to February"
    },
    vibeTags: ["Historical","Beach","Architecture"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?q=80&w=800",
        caption: "Diu Fort"
      }
    ],
    externalLinks: {
      wikiUrl: "https://en.wikipedia.org/wiki/Diu,_India",
      govtPortal: "https://daman.nic.in"
    }
  },

  {
    name: "Majuli Island",
    nativeName: "Majuli",
    location: {
      group: "River Island",
      coordinates: { lat: 26.9508, lng: 94.1753 },
      area: "352 sq km"
    },
    status: {
      isInhabited: true,
      isProtectedArea: false,
      permitRequired: "None"
    },
    description: {
      summary: "Largest river island in the world located in the Brahmaputra River.",
      history: "Cultural center of Assamese Vaishnavite traditions.",
      floraAndFauna: [
        "Wetland ecosystems",
        "Migratory birds",
        "River dolphins",
        "Bamboo groves",
        "Rice fields"
      ]
    },
    culinaryHighlights: [
      {
        dishName: "Masor Tenga",
        description: "Traditional Assamese sour fish curry"
      }
    ],
    bestTimeToVisit: {
      startMonth: "October",
      endMonth: "March",
      peakSeason: "November to February"
    },
    vibeTags: ["Cultural","Bird Watching","Photography"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=800",
        caption: "Majuli landscape"
      }
    ],
    externalLinks: {
      wikiUrl: "https://en.wikipedia.org/wiki/Majuli",
      govtPortal: "https://majuli.assam.gov.in"
    }
  },

  { name:"Ross Island", nativeName:"Netaji Subhas Chandra Bose Dweep", location:{ group:"Andaman", coordinates:{ lat:11.6755, lng:92.7626 }, area:"0.6 sq km"}, status:{ isInhabited:false, isProtectedArea:true, permitRequired:"None"}, description:{ summary:"Historic administrative island of the British in Andaman.", history:"Abandoned after 1941 earthquake.", floraAndFauna:["Peacocks","Spotted deer","Tropical trees","Coral reefs","Seabirds"]}, culinaryHighlights:[{dishName:"Grilled Fish",description:"Simple grilled reef fish"}], bestTimeToVisit:{startMonth:"October",endMonth:"May",peakSeason:"December to February"}, vibeTags:["Historical","Nature"], images:[{url:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800",caption:"Historic ruins"}], externalLinks:{wikiUrl:"https://en.wikipedia.org/wiki/Ross_Island",govtPortal:"https://andaman.gov.in"} },

  { name:"Baratang Island", nativeName:"Baratang", location:{ group:"Andaman", coordinates:{ lat:12.1176, lng:92.7427 }, area:"238 sq km"}, status:{ isInhabited:true, isProtectedArea:true, permitRequired:"Special Permission"}, description:{ summary:"Island famous for limestone caves and mangrove creeks.", history:"Known for mud volcanoes and tribal reserves.", floraAndFauna:["Mangroves","Crocodiles","Tropical birds","Mud volcanoes","Dense forests"]}, culinaryHighlights:[{dishName:"Fish Curry",description:"Local Andaman style fish curry"}], bestTimeToVisit:{startMonth:"November",endMonth:"April",peakSeason:"December to February"}, vibeTags:["Adventure","Caves"], images:[{url:"https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800",caption:"Mangrove waterways"}], externalLinks:{wikiUrl:"https://en.wikipedia.org/wiki/Baratang_Island",govtPortal:"https://andaman.gov.in"} },

  { name:"Little Andaman", nativeName:"Little Andaman", location:{ group:"Andaman", coordinates:{ lat:10.757, lng:92.515 }, area:"707 sq km"}, status:{ isInhabited:true, isProtectedArea:false, permitRequired:"Special Permission"}, description:{ summary:"Island known for waterfalls and surfing beaches.", history:"Traditional home of the Onge tribe.", floraAndFauna:["Rainforests","Sea turtles","Waterfalls","Mangroves","Birdlife"]}, culinaryHighlights:[{dishName:"Coconut Fish Curry",description:"Island style fish curry"}], bestTimeToVisit:{startMonth:"October",endMonth:"April",peakSeason:"December to February"}, vibeTags:["Surfing","Adventure"], images:[{url:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800",caption:"Pristine beach"}], externalLinks:{wikiUrl:"https://en.wikipedia.org/wiki/Little_Andaman",govtPortal:"https://andaman.gov.in"} },

  { name:"Minicoy Island", nativeName:"Maliku", location:{ group:"Lakshadweep", coordinates:{ lat:8.2955, lng:73.0483 }, area:"4.8 sq km"}, status:{ isInhabited:true, isProtectedArea:false, permitRequired:"Special Permission"}, description:{ summary:"Southernmost Lakshadweep island known for lighthouse.", history:"Strong cultural links with Maldives.", floraAndFauna:["Coral reefs","Lagoon fish","Sea turtles","Coconut palms","Seabirds"]}, culinaryHighlights:[{dishName:"Tuna Mas",description:"Traditional tuna preparation"}], bestTimeToVisit:{startMonth:"October",endMonth:"March",peakSeason:"December to February"}, vibeTags:["Scuba","Beach"], images:[{url:"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800",caption:"Minicoy lagoon"}], externalLinks:{wikiUrl:"https://en.wikipedia.org/wiki/Minicoy",govtPortal:"https://lakshadweep.gov.in"} },

  { name:"Kavaratti Island", nativeName:"Kavaratti", location:{ group:"Lakshadweep", coordinates:{ lat:10.5667, lng:72.6417 }, area:"3.9 sq km"}, status:{ isInhabited:true, isProtectedArea:false, permitRequired:"Special Permission"}, description:{ summary:"Capital island of Lakshadweep known for lagoons.", history:"Administrative center of Lakshadweep.", floraAndFauna:["Coral reefs","Sea turtles","Reef fish","Palm trees","Lagoon ecosystems"]}, culinaryHighlights:[{dishName:"Spicy Tuna Curry",description:"Popular Lakshadweep dish"}], bestTimeToVisit:{startMonth:"October",endMonth:"March",peakSeason:"December to February"}, vibeTags:["Snorkeling","Beach"], images:[{url:"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800",caption:"Lagoon waters"}], externalLinks:{wikiUrl:"https://en.wikipedia.org/wiki/Kavaratti",govtPortal:"https://lakshadweep.gov.in"} },

  { name:"Bangaram Island", nativeName:"Bangaram", location:{ group:"Lakshadweep", coordinates:{ lat:10.9401, lng:72.2871 }, area:"1.2 sq km"}, status:{ isInhabited:false, isProtectedArea:false, permitRequired:"Special Permission"}, description:{ summary:"Luxury resort island famous for coral lagoons.", history:"Popular eco tourism destination.", floraAndFauna:["Coral reefs","Turtles","Lagoon fish","Palm trees","Seabirds"]}, culinaryHighlights:[{dishName:"Seafood Grill",description:"Fresh seafood grilled near beach"}], bestTimeToVisit:{startMonth:"October",endMonth:"March",peakSeason:"December to February"}, vibeTags:["Luxury","Beach","Scuba"], images:[{url:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800",caption:"Bangaram beach"}], externalLinks:{wikiUrl:"https://en.wikipedia.org/wiki/Bangaram_Atoll",govtPortal:"https://lakshadweep.gov.in"} },

  { name:"Kadmat Island", nativeName:"Kadmat", location:{ group:"Lakshadweep", coordinates:{ lat:11.224, lng:72.776 }, area:"3.2 sq km"}, status:{ isInhabited:true, isProtectedArea:false, permitRequired:"Special Permission"}, description:{ summary:"Island with long sandy beaches and coral reefs.", history:"Fishing and coconut farming community.", floraAndFauna:["Coral reefs","Sea turtles","Lagoon fish","Palm trees","Seabirds"]}, culinaryHighlights:[{dishName:"Coconut Fish Fry",description:"Fresh fish fried with coconut spices"}], bestTimeToVisit:{startMonth:"October",endMonth:"March",peakSeason:"December to February"}, vibeTags:["Snorkeling","Beach"], images:[{url:"https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800",caption:"Kadmat lagoon"}], externalLinks:{wikiUrl:"https://en.wikipedia.org/wiki/Kadmat_Island",govtPortal:"https://lakshadweep.gov.in"} },

  { name:"Elephanta Island", nativeName:"Gharapuri", location:{ group:"Arabian Sea", coordinates:{ lat:18.9633, lng:72.9315 }, area:"10 sq km"}, status:{ isInhabited:true, isProtectedArea:true, permitRequired:"None"}, description:{ summary:"Island near Mumbai known for UNESCO cave temples.", history:"Caves date back to 5th century dedicated to Shiva.", floraAndFauna:["Tropical trees","Monkeys","Birds","Rocky hills","Shrubs"]}, culinaryHighlights:[{dishName:"Street Seafood",description:"Simple fried seafood sold near ferry jetty"}], bestTimeToVisit:{startMonth:"November",endMonth:"March",peakSeason:"January to February"}, vibeTags:["Historical","Architecture"], images:[{url:"https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800",caption:"Elephanta caves"}], externalLinks:{wikiUrl:"https://en.wikipedia.org/wiki/Elephanta_Island",govtPortal:"https://maharashtratourism.gov.in"} },

  { name:"St Mary's Island", nativeName:"St Mary's", location:{ group:"Arabian Sea", coordinates:{ lat:13.379, lng:74.673 }, area:"0.5 sq km"}, status:{ isInhabited:false, isProtectedArea:true, permitRequired:"None"}, description:{ summary:"Island known for unique basalt rock formations.", history:"Linked to Vasco da Gama landing.", floraAndFauna:["Coastal shrubs","Seabirds","Rock formations","Marine life","Shellfish"]}, culinaryHighlights:[{dishName:"Seafood Fry",description:"Typical coastal Karnataka seafood"}], bestTimeToVisit:{startMonth:"October",endMonth:"February",peakSeason:"December"}, vibeTags:["Geology","Photography"], images:[{url:"https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=800",caption:"Basalt columns"}], externalLinks:{wikiUrl:"https://en.wikipedia.org/wiki/St._Mary's_Islands",govtPortal:"https://karnatakatourism.org"} }

];

// ---- Bulk additions (compact helper) ----
const IMG = {
  beach: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=800",
  tropical: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800",
  lagoon: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800",
  palm: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800",
  water: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800",
  arch: "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800",
  rocks: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=800",
  jungle: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800",
  river: "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?q=80&w=800",
  fort: "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=800",
  village: "https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=800",
};

// [name, nativeName, group, lat, lng, area, summary, vibeTags, imgKey, permit]
const more = [
  // ---------- ANDAMAN (~25) ----------
  ["North Sentinel Island","North Sentinel","Andaman",11.5667,92.2333,"60 sq km","Home to the isolated Sentinelese tribe; entry strictly prohibited.",["Tribal","Restricted"],"jungle","Special Permission"],
  ["South Andaman Island","South Andaman","Andaman",11.7401,92.6586,"1348 sq km","Largest of the Andaman group and home to capital Port Blair.",["Beach","City","History"],"beach","None"],
  ["North Andaman Island","North Andaman","Andaman",13.2000,93.0000,"1458 sq km","Northernmost of the major Andaman islands with dense rainforests and Diglipur town.",["Adventure","Trekking","Nature"],"jungle","RAP"],
  ["Middle Andaman Island","Middle Andaman","Andaman",12.5000,92.9000,"1536 sq km","Forest covered island connected by the Andaman Trunk Road; home to Mayabunder.",["Nature","Wildlife"],"jungle","RAP"],
  ["Rutland Island","Rutland","Andaman",11.4400,92.6500,"137 sq km","Forest covered island south of South Andaman with secluded beaches.",["Beach","Nature"],"palm","RAP"],
  ["Long Island","Long Island","Andaman",12.3667,92.9333,"18 sq km","Quiet island known for Lalaji Bay beach and laid-back vibe.",["Beach","Quiet"],"palm","None"],
  ["Smith Island","Smith","Andaman",13.3167,93.0000,"6 sq km","Connected to Ross Island by a sandbar; pristine white beaches.",["Beach","Snorkeling"],"beach","RAP"],
  ["Ross and Smith Islands","Ross & Smith","Andaman",13.3167,93.0000,"7 sq km","Twin islands joined by a natural sand bridge in North Andaman.",["Beach","Photography"],"beach","RAP"],
  ["Interview Island","Interview","Andaman",12.9333,92.7167,"133 sq km","Wildlife sanctuary known for feral elephants.",["Wildlife","Nature"],"jungle","Special Permission"],
  ["Viper Island","Viper","Andaman",11.6900,92.7100,"0.4 sq km","Historic site of British era gallows near Port Blair.",["Historical"],"arch","None"],
  ["Cinque Island","Cinque","Andaman",11.2700,92.7300,"9.5 sq km","Marine national park with twin islands joined by a sandbar.",["Scuba","Snorkeling","Beach"],"lagoon","Special Permission"],
  ["North Sentinel of Sisters","Sisters Islands","Andaman",11.5333,92.6333,"0.5 sq km","Two small islands within Mahatma Gandhi Marine National Park.",["Snorkeling","Marine"],"lagoon","Special Permission"],
  ["Brothers Islands","Brothers","Andaman",11.0833,92.7167,"0.5 sq km","Pair of small islands inside Mahatma Gandhi Marine National Park.",["Snorkeling","Marine"],"lagoon","Special Permission"],
  ["Snake Island","Snake","Andaman",11.6500,92.7400,"0.2 sq km","Small uninhabited island near Port Blair offering snorkeling.",["Snorkeling"],"water","None"],
  ["Jolly Buoy Island","Jolly Buoy","Andaman",11.5167,92.6000,"0.3 sq km","Coral viewing island in Wandoor marine park; eco-restricted.",["Snorkeling","Eco"],"lagoon","Special Permission"],
  ["Red Skin Island","Red Skin","Andaman",11.5333,92.6167,"0.4 sq km","Alternates with Jolly Buoy as the open coral viewing island.",["Snorkeling","Eco"],"lagoon","Special Permission"],
  ["Henry Lawrence Island","Henry Lawrence","Andaman",12.0667,93.0833,"54 sq km","Part of Ritchie's Archipelago with secluded coves.",["Beach","Quiet"],"palm","RAP"],
  ["Outram Island","Outram","Andaman",12.2167,93.0833,"7 sq km","Uninhabited island in Ritchie's Archipelago with virgin beaches.",["Beach","Nature"],"beach","RAP"],
  ["Stewart Island","Stewart","Andaman",13.2500,93.0500,"7 sq km","Forested island in North Andaman near Mayabunder.",["Nature"],"jungle","RAP"],
  ["Wilson Island","Wilson","Andaman",11.9667,93.0333,"1 sq km","Tiny coral fringed island near Havelock.",["Snorkeling","Beach"],"lagoon","None"],
  ["Landfall Island","Landfall","Andaman",13.6500,93.0167,"30 sq km","Northernmost island of the Andamans; restricted military area.",["Restricted"],"jungle","Special Permission"],
  ["Narcondam Island","Narcondam","Andaman",13.4333,94.2667,"6.8 sq km","Volcanic island and home of the endemic Narcondam hornbill.",["Wildlife","Volcano"],"jungle","Special Permission"],
  ["Barren Island","Barren","Andaman",12.2773,93.8581,"8.3 sq km","Only confirmed active volcano in South Asia.",["Volcano","Adventure"],"rocks","Special Permission"],
  ["Tarmugli Island","Tarmugli","Andaman",11.5500,92.5667,"3 sq km","Small forested island in Mahatma Gandhi Marine National Park.",["Snorkeling","Beach"],"lagoon","Special Permission"],
  ["Strait Island","Strait","Andaman",12.5333,92.7667,"6 sq km","Reserved for the Great Andamanese tribe.",["Tribal","Restricted"],"jungle","Special Permission"],

  // ---------- NICOBAR (~12) ----------
  ["Car Nicobar","Car Nicobar","Nicobar",9.1500,92.7833,"127 sq km","Headquarters of the Nicobar district known for tribal culture and beaches.",["Beach","Culture"],"palm","Special Permission"],
  ["Great Nicobar","Great Nicobar","Nicobar",6.9667,93.8500,"1045 sq km","Largest Nicobar island with India's southernmost point Indira Point.",["Wildlife","Forest"],"jungle","Special Permission"],
  ["Little Nicobar","Little Nicobar","Nicobar",7.3500,93.7333,"159 sq km","Tropical island home to the Shompen tribe.",["Tribal","Forest"],"jungle","Special Permission"],
  ["Camorta","Camorta","Nicobar",8.1500,93.5333,"188 sq km","Central Nicobar island and naval base.",["Beach","Nature"],"beach","Special Permission"],
  ["Katchal","Katchal","Nicobar",7.9667,93.3833,"174 sq km","Small Nicobar island known for rubber plantations.",["Nature"],"jungle","Special Permission"],
  ["Nancowry","Nancowry","Nicobar",8.0333,93.5333,"67 sq km","Forms a natural harbour with neighbouring Camorta.",["Beach","Harbour"],"beach","Special Permission"],
  ["Teressa","Teressa","Nicobar",8.2667,93.1500,"101 sq km","Nicobar island with grasslands and tribal villages.",["Culture","Nature"],"village","Special Permission"],
  ["Trinket","Trinket","Nicobar",8.0833,93.5500,"86 sq km","Largely abandoned after the 2004 tsunami.",["History"],"village","Special Permission"],
  ["Chowra","Chowra","Nicobar",8.4833,93.0833,"8 sq km","Small densely populated Nicobar island.",["Culture"],"village","Special Permission"],
  ["Bompoka","Bompoka","Nicobar",8.4167,93.2167,"11 sq km","Small uninhabited Nicobar island.",["Nature"],"jungle","Special Permission"],
  ["Tilanchong","Tilanchong","Nicobar",8.4833,93.6333,"17 sq km","Wildlife sanctuary in the Nicobar group.",["Wildlife"],"jungle","Special Permission"],
  ["Kondul","Kondul","Nicobar",7.2167,93.7167,"4.6 sq km","Tiny Nicobar island near Great Nicobar.",["Beach"],"palm","Special Permission"],

  // ---------- LAKSHADWEEP (~11) ----------
  ["Bitra Island","Bitra","Lakshadweep",11.6000,72.1833,"0.1 sq km","Smallest inhabited island of Lakshadweep; bird sanctuary.",["Wildlife","Bird Watching"],"lagoon","Special Permission"],
  ["Chetlat Island","Chetlat","Lakshadweep",11.7000,72.7000,"1.1 sq km","Northern Lakshadweep island known for coir industry.",["Culture","Beach"],"palm","Special Permission"],
  ["Kiltan Island","Kiltan","Lakshadweep",11.4833,73.0000,"1.6 sq km","Coral island used as a stopover on shipping routes.",["Beach","Quiet"],"lagoon","Special Permission"],
  ["Andrott Island","Andrott","Lakshadweep",10.8167,73.6667,"4.9 sq km","Largest island of Lakshadweep by area; runs east to west.",["Culture","Beach"],"palm","Special Permission"],
  ["Kalpeni Island","Kalpeni","Lakshadweep",10.0833,73.6500,"2.8 sq km","Lakshadweep island with three satellite islets and reef lagoon.",["Snorkeling","Beach"],"lagoon","Special Permission"],
  ["Amini Island","Amini","Lakshadweep",11.1167,72.7333,"2.6 sq km","Densely populated island known for shell craft.",["Culture","Beach"],"palm","Special Permission"],
  ["Suheli Par","Suheli","Lakshadweep",10.0833,72.2833,"1 sq km","Uninhabited atoll famous for its lagoon and turtle nesting.",["Nature","Snorkeling"],"lagoon","Special Permission"],
  ["Cheriyam Island","Cheriyam","Lakshadweep",10.1833,73.6333,"0.5 sq km","Small islet near Kalpeni atoll.",["Beach","Quiet"],"lagoon","Special Permission"],
  ["Tinnakara Island","Tinnakara","Lakshadweep",11.0167,72.2333,"0.4 sq km","Uninhabited island in Bangaram atoll famous for snorkeling.",["Snorkeling","Beach"],"lagoon","Special Permission"],
  ["Parali Island","Parali","Lakshadweep",10.9333,72.2333,"0.5 sq km","Uninhabited islet within Bangaram atoll.",["Beach","Nature"],"lagoon","Special Permission"],
  ["Pitti Island","Pitti","Lakshadweep",11.0667,72.6333,"0.01 sq km","Uninhabited coral islet that is an important seabird sanctuary.",["Wildlife","Bird Watching"],"lagoon","Special Permission"],

  // ---------- ARABIAN SEA / WEST COAST (~20) ----------
  ["Vypin Island","Vypin","Arabian Sea",9.9919,76.2317,"27 sq km","Dense backwater island that forms part of Greater Kochi.",["City","Beach"],"water","None"],
  ["Willingdon Island","Willingdon","Arabian Sea",9.9456,76.2754,"5 sq km","Largest artificial island in India; home to Kochi port and naval base.",["City","Port"],"arch","None"],
  ["Bolgatty Island","Bolgatty","Arabian Sea",9.9886,76.2664,"0.5 sq km","Small island in Vembanad lake known for the Bolgatty Palace.",["Heritage","Luxury"],"arch","None"],
  ["Vallarpadam Island","Vallarpadam","Arabian Sea",10.0167,76.2667,"3.5 sq km","Backwater island in Kochi famous for the Vallarpadam church.",["Religion","Port"],"arch","None"],
  ["Bet Dwarka","Bet Dwarka","Arabian Sea",22.4500,69.1167,"13 sq km","Pilgrimage island off the Gujarat coast linked to Lord Krishna.",["Religion","Beach"],"arch","None"],
  ["Pirotan Island","Pirotan","Arabian Sea",22.5667,69.9667,"3 sq km","Coral island in the Marine National Park, Gulf of Kutch.",["Marine","Wildlife"],"lagoon","Special Permission"],
  ["Aliabet Island","Aliabet","Arabian Sea",21.7000,72.4500,"100 sq km","River island at the mouth of the Narmada in Gujarat.",["Nature"],"river","None"],
  ["Murud-Janjira","Janjira","Arabian Sea",18.3000,72.9667,"0.1 sq km","Famous sea fort island off the Maharashtra coast that was never conquered.",["Historical","Fort"],"fort","None"],
  ["Khanderi Island","Khanderi","Arabian Sea",18.7000,72.8333,"0.4 sq km","Maratha fort island near Mumbai built by Shivaji.",["Historical","Fort"],"fort","None"],
  ["Underi Island","Underi","Arabian Sea",18.7167,72.8667,"0.3 sq km","Sister fortress to Khanderi off the Maharashtra coast.",["Historical","Fort"],"fort","None"],
  ["Sindhudurg Fort Island","Sindhudurg","Arabian Sea",16.0376,73.4612,"0.2 sq km","Sea fort built by Shivaji on a small rocky island.",["Historical","Fort"],"fort","None"],
  ["Vijaydurg Fort Island","Vijaydurg","Arabian Sea",16.5500,73.3333,"0.07 sq km","Coastal fort considered one of the strongest of the Maratha navy.",["Historical","Fort"],"fort","None"],
  ["Anjadip Island","Anjadip","Arabian Sea",14.7667,74.1000,"1.5 sq km","Small Goan-administered island off the Karnataka coast.",["Historical","Beach"],"beach","Special Permission"],
  ["Netrani Island","Pigeon Island","Arabian Sea",14.0167,74.3333,"0.3 sq km","Heart shaped island famous for scuba diving.",["Scuba","Marine"],"lagoon","None"],
  ["Kurumgad Island","Kurumgad","Arabian Sea",14.8167,74.1167,"0.1 sq km","Tortoise shaped island off Karwar with a hill temple.",["Religion","Beach"],"palm","None"],
  ["Devbagh Island","Devbagh","Arabian Sea",14.8167,74.1167,"0.5 sq km","Resort island at the mouth of the Kali river in Karwar.",["Beach","Luxury"],"palm","None"],
  ["Grande Island","Ilha Grande","Arabian Sea",15.3667,73.7333,"3 sq km","Goan island popular for snorkeling and watersports trips.",["Snorkeling","Watersports"],"beach","None"],
  ["Chorao Island","Chorao","Arabian Sea",15.5167,73.8833,"5 sq km","Largest of Goa's Mandovi river islands; home to a bird sanctuary.",["Bird Watching","Nature"],"river","None"],
  ["Divar Island","Divar","Arabian Sea",15.5167,73.9167,"7 sq km","Quiet Goan river island known for old churches and feni.",["Heritage","Quiet"],"village","None"],
  ["Vanxim Island","Vanxim","Arabian Sea",15.4833,73.9000,"1.5 sq km","Tiny Mandovi delta island in Goa.",["Quiet","Nature"],"river","None"],

  // ---------- OFFSHORE MAINLAND / EAST COAST (~10) ----------
  ["Sriharikota Island","Sriharikota","Offshore Mainland",13.7333,80.2333,"175 sq km","Barrier island that hosts ISRO's Satish Dhawan Space Centre.",["Science","Restricted"],"rocks","Special Permission"],
  ["Pulicat Island","Pulicat","Offshore Mainland",13.4167,80.3167,"5 sq km","Small island in Pulicat lagoon known for flamingos.",["Bird Watching","Nature"],"water","None"],
  ["Hope Island","Hope","Offshore Mainland",16.9833,82.3833,"16 sq km","Tadpole shaped island that protects Kakinada Bay.",["Beach","Nature"],"beach","None"],
  ["Pamban Island","Rameswaram","Offshore Mainland",9.2876,79.3129,"67 sq km","Holy island connected to mainland by Pamban bridge; home of Rameswaram temple.",["Religion","Beach","Heritage"],"arch","None"],
  ["Krusadai Island","Krusadai","Offshore Mainland",9.2333,79.2167,"0.65 sq km","Small island in Gulf of Mannar marine biosphere reserve.",["Marine","Wildlife"],"lagoon","Special Permission"],
  ["Hare Island","Hare","Offshore Mainland",9.2167,79.2167,"1.3 sq km","Coral island in Gulf of Mannar known for marine life.",["Marine","Snorkeling"],"lagoon","Special Permission"],
  ["Manoli Island","Manoli","Offshore Mainland",9.2667,79.2167,"0.4 sq km","Uninhabited Gulf of Mannar island with mangroves.",["Nature","Marine"],"lagoon","Special Permission"],
  ["Vaan Island","Vaan","Offshore Mainland",8.8333,78.2000,"0.16 sq km","Sinking coral island near Tuticorin.",["Marine","Conservation"],"lagoon","Special Permission"],
  ["Quibble Island","Quibble","Offshore Mainland",13.0500,80.2667,"0.5 sq km","Small river island in Chennai's Adyar estuary.",["Urban","Nature"],"river","None"],
  ["Wheeler Island","Abdul Kalam Island","Offshore Mainland",20.7700,87.0700,"0.4 sq km","Defence test range island off the Odisha coast.",["Restricted","Science"],"rocks","Special Permission"],

  // ---------- RIVER ISLANDS / DELTAS (~12) ----------
  ["Umananda Island","Peacock Island","River Island",26.1958,91.7456,"0.2 sq km","Smallest inhabited river island in the world; in the Brahmaputra at Guwahati.",["Religion","Nature"],"river","None"],
  ["Sagar Island","Sagar","River Island",21.6500,88.0500,"224 sq km","Pilgrimage island at the mouth of the Hooghly; site of Gangasagar Mela.",["Religion","Beach"],"river","None"],
  ["Ghoramara Island","Ghoramara","River Island",21.9167,88.1500,"5 sq km","Sundarbans island rapidly disappearing due to sea level rise.",["Climate","Village"],"river","None"],
  ["Bali Island","Bali","River Island",22.1167,88.7333,"50 sq km","Sundarbans tourist island bordering tiger reserve.",["Wildlife","Mangroves"],"jungle","Special Permission"],
  ["Gosaba Island","Gosaba","River Island",22.1667,88.8000,"35 sq km","Largest inhabited Sundarbans island and gateway to tiger reserve.",["Wildlife","Village"],"jungle","Special Permission"],
  ["Lothian Island","Lothian","River Island",21.7000,88.5167,"38 sq km","Sundarbans wildlife sanctuary island.",["Wildlife","Mangroves"],"jungle","Special Permission"],
  ["Henrys Island","Henry","River Island",21.6167,88.2667,"4 sq km","Quiet West Bengal coastal island near Bakkhali.",["Beach","Quiet"],"beach","None"],
  ["Jambu Dwip","Jambu","River Island",21.5667,88.1833,"6 sq km","Uninhabited island in the Sundarbans near Sagar.",["Nature","Mangroves"],"jungle","Special Permission"],
  ["Nayachar Island","Nayachar","River Island",22.0500,88.1500,"63 sq km","Recently formed Hooghly estuary island.",["Nature","Village"],"river","None"],
  ["Munroe Island","Mundrothuruthu","River Island",8.9667,76.6167,"13 sq km","Cluster of eight backwater islets at the confluence of Kallada river and Ashtamudi lake.",["Backwaters","Village"],"river","None"],
  ["Pathiramanal Island","Pathiramanal","River Island",9.6500,76.4000,"0.06 sq km","Small island on Vembanad lake known as a bird sanctuary.",["Bird Watching","Backwaters"],"river","None"],
  ["Nalabana Island","Nalabana","River Island",19.7333,85.4833,"15.5 sq km","Bird sanctuary island in the middle of Chilika lake.",["Bird Watching","Wildlife"],"water","None"],

  // ---------- MISC / OTHER (~5) ----------
  ["Kalijai Island","Kalijai","Other",19.6333,85.3333,"0.05 sq km","Rocky islet in Chilika lake with the Kalijai temple.",["Religion","Lake"],"rocks","None"],
  ["Honeymoon Island","Honeymoon","Other",19.7833,85.4333,"0.1 sq km","Small island in Chilika lake popular with day trippers.",["Beach","Quiet"],"water","None"],
  ["Breakfast Island","Breakfast","Other",19.7833,85.4500,"0.1 sq km","Tiny picnic island in Chilika lake near Satapada.",["Beach","Quiet"],"water","None"],
  ["Khadir Bet","Khadir","Other",23.8167,70.1833,"0.5 sq km","Island within the Great Rann of Kutch; site of Dholavira ruins.",["History","Heritage"],"rocks","None"],
  ["Bhainsala Island","Bhainsala","Other",22.5000,70.0000,"2 sq km","Small island in the Gulf of Kutch.",["Nature"],"rocks","None"],
];

const wikiSlug = (n) => n.replace(/[^A-Za-z0-9 ]/g,"").trim().replace(/\s+/g,"_");

more.forEach(([name, native, group, lat, lng, area, summary, vibes, imgKey, permit]) => {
  islands.push({
    name,
    nativeName: native || name,
    location: { group, coordinates: { lat, lng }, area: area || "" },
    status: {
      isInhabited: !/Restricted|Uninhabited|Wildlife/i.test(vibes.join(" ")) && permit !== "Special Permission" || /Village|Culture|City/i.test(vibes.join(" ")),
      isProtectedArea: /Wildlife|Marine|Restricted|Conservation|Bird Watching/i.test(vibes.join(" ")),
      permitRequired: permit || "None",
    },
    description: {
      summary,
      history: "",
      floraAndFauna: ["Coastal vegetation","Marine life","Tropical birds","Local flora","Native wildlife"],
    },
    culinaryHighlights: [{ dishName: "Local Seafood", description: "Regional seafood specialty of the area" }],
    bestTimeToVisit: { startMonth: "October", endMonth: "March", peakSeason: "December to February" },
    vibeTags: vibes,
    images: [{ url: IMG[imgKey] || IMG.beach, caption: name }],
    externalLinks: {
      wikiUrl: `https://en.wikipedia.org/wiki/${wikiSlug(name)}`,
      govtPortal: "",
    },
  });
});

module.exports = islands;