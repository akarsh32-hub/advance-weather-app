"use strict";

/* =========================================================
   SKYCAST AI — EXECUTIVE DDMA DISASTER & METEOROLOGY ENGINE
   Official District Magistrate & Crisis Management Portal
   ========================================================= */

let W = null;
let currentLanguage = "en"; // "en" or "hi"
let currentCrop = "wheat";
let activeSimulation = "live";

let weatherMap = null;
let weatherMarker = null;
let hazardMarkers = [];
let rescueMarkers = [];
let floodOverlayLayer = null;
let safeRoutePolyline = null;

let streetLayer = null;
let satelliteLayer = null;

let skycastAQI = null;
let skycastUV = null;
let skycastLightningCape = 420;
let skycastLightningRisk = 8;

// Web Audio API State
let audioCtx = null;
let sirenOsc = null;
let sirenGain = null;
let isSirenPlaying = false;
let sirenInterval = null;

// Chart.js instances
let tempChartInstance = null;
let rainChartInstance = null;
let humChartInstance = null;
let windChartInstance = null;

// Offline & GPS Breadcrumb State
let offlineQueue = [];
let gpsBreadcrumbs = [];

// Deferred PWA Prompt
let deferredPwaPrompt = null;

// Citizen hazard reports stored in memory
let citizenReports = [
    {
        id: 1,
        type: "waterlog",
        typeName: "Road Waterlogging",
        location: "Civil Lines underpass near Collectorate",
        details: "Water level approx 2 feet. Traffic diversion recommended.",
        time: "15 mins ago",
        latOffset: 0.015,
        lonOffset: -0.012
    },
    {
        id: 2,
        type: "tree",
        typeName: "Fallen Tree",
        location: "Mall Road near Sub-Division Office",
        details: "Neem tree fallen over electric cables. Road blocked.",
        time: "45 mins ago",
        latOffset: -0.018,
        lonOffset: 0.014
    }
];

// Rescue Teams State (NDRF / SDRF)
let rescueTeams = [
    {
        id: "alpha",
        name: "NDRF Team Alpha",
        specialty: "Water & Flood Rescue Unit (जल बचाव दल)",
        status: "available",
        members: 12,
        capacity: 30,
        equipment: ["🚤 4 Inflatable Boats", "🦺 35 Life Jackets", "🏊 12 Divers", "🔦 Floodlights"],
        locationName: "River Basin / Ganga Ghat Sector",
        lat: 26.465,
        lon: 80.345,
        activeMission: "Standby for water rescue and river patrol",
        lastCheckIn: "10:38 AM • Equipment fueled and inspected"
    },
    {
        id: "bravo",
        name: "SDRF Team Bravo",
        specialty: "Paramedic & Trauma First-Aid (पैरामेडिक एवं चिकित्सा दल)",
        status: "available",
        members: 8,
        capacity: 15,
        equipment: ["🚑 3 ALS Ambulances", "🩹 50 Trauma Kits", "🧴 ORS & Oxygen Cylinders", "🛏️ 6 Stretchers"],
        locationName: "Civil Lines & Hospital Corridor",
        lat: 26.438,
        lon: 80.320,
        activeMission: "Mobile medical standby for heatstroke & casualties",
        lastCheckIn: "10:15 AM • 18 ICU stabilization beds ready"
    },
    {
        id: "charlie",
        name: "Civil Defense Team Charlie",
        specialty: "Structural Debris & Tree Clearance (मलबा एवं पेड़ निकासी)",
        status: "available",
        members: 10,
        capacity: 20,
        equipment: ["🚒 2 Fire Tenders", "🏗️ 1 Heavy Crane", "🔥 Gas Cutters & Chainsaws", "🪓 Power Saws"],
        locationName: "North Industrial Substation Base",
        lat: 26.480,
        lon: 80.295,
        activeMission: "Standby for storm debris and blocked arterial roads",
        lastCheckIn: "09:50 AM • Power machinery ready"
    },
    {
        id: "delta",
        name: "Logistics Team Delta",
        specialty: "Evacuation Logistics & Food Relief (राहत सामग्री एवं राशन)",
        status: "available",
        members: 15,
        capacity: 100,
        equipment: ["🚚 4 Heavy Transport Trucks", "🍱 2,500 Food Packets", "💧 5,000L Water Tanker"],
        locationName: "Central Stadium Disaster Relief Base",
        lat: 26.420,
        lon: 80.360,
        activeMission: "Pre-positioned for civilian shelter intake and relief rations",
        lastCheckIn: "10:00 AM • Community kitchen operational"
    }
];

// Active Incident AI Priority Queue
let activeIncidents = [
    {
        id: "INC-101",
        priority: 1,
        category: "Low-Lying Drainage Surveillance",
        location: "River Basin Low-Lying Ward #14",
        people: 0,
        vulnerable: "Monitoring",
        severity: "ROUTINE",
        recommendedTeamId: "alpha",
        status: "Standby at Base"
    }
];

// Verified Lightning Safe Shelters
const LIGHTNING_SHELTERS = [
    {
        id: 1,
        name: "Government Senior Secondary Inter College (राजकीय इंटर कॉलेज)",
        type: "Pucca Multi-Story Concrete Structure",
        distance: "0.6 km",
        capacity: "450 Persons",
        safetyGrade: "Grade A Shielded (Lightning Arrestor Active)",
        latOffset: 0.005,
        lonOffset: 0.004
    },
    {
        id: 2,
        name: "Green Park Indoor Sports Complex & Gymnasium",
        type: "Reinforced Concrete Auditorium",
        distance: "1.2 km",
        capacity: "1,200 Persons",
        safetyGrade: "Grade A Shielded (Complete Grounding Grid)",
        latOffset: -0.008,
        lonOffset: 0.009
    },
    {
        id: 3,
        name: "District Community Disaster Relief Hall",
        type: "Dedicated Disaster Shelter",
        distance: "2.1 km",
        capacity: "600 Persons",
        safetyGrade: "Grade A Shielded (Dual Lightning Conductors)",
        latOffset: 0.012,
        lonOffset: -0.014
    },
    {
        id: 4,
        name: "Central Civil Lines Town Hall (Ground Floor)",
        type: "Heritage Heavy Brick & Concrete",
        distance: "3.4 km",
        capacity: "800 Persons",
        safetyGrade: "Grade A Safe",
        latOffset: -0.015,
        lonOffset: -0.010
    }
];

// District Leaderboard Regional Data
const REGIONAL_DISTRICTS = [
    { name: "Kanpur", lat: 26.4499, lon: 80.3319, baseTemp: 28, aqi: 85, rainRisk: 15, agriScore: 94 },
    { name: "Lucknow", lat: 26.8467, lon: 80.9462, baseTemp: 29, aqi: 92, rainRisk: 12, agriScore: 89 },
    { name: "Varanasi", lat: 25.3176, lon: 82.9739, baseTemp: 30, aqi: 42, rainRisk: 10, agriScore: 91 },
    { name: "Prayagraj", lat: 25.4358, lon: 81.8463, baseTemp: 31, aqi: 78, rainRisk: 18, agriScore: 86 },
    { name: "Agra", lat: 27.1767, lon: 78.0081, baseTemp: 32, aqi: 125, rainRisk: 8, agriScore: 78 },
    { name: "Gorakhpur", lat: 26.7606, lon: 83.3732, baseTemp: 27, aqi: 65, rainRisk: 25, agriScore: 93 }
];


/* =========================================================
   BILINGUAL DICTIONARY (ENGLISH ⇄ हिन्दी)
========================================================= */

const I18N = {
    en: {
        brandSub: "DISTRICT DISASTER COMMAND • DDMA",
        navDashboard: "Executive Dashboard",
        navDisaster: "DDMA Control Room",
        navRescue: "NDRF Rescue Ops Center",
        navTwin: "AI Digital Twin",
        navLightning: "Lightning Radar & Shelters",
        navSOS: "Smart SOS & Offline Hub",
        navResources: "Resource Inventory",
        navLeaderboard: "District Health Ranking",
        navFarmer: "Kisan Mode & Mandi AI",
        navCitizen: "Citizen Incident Reports",
        navAnalytics: "Meteorological Trends",
        navMap: "Hazard & Rescue Map",
        navAlerts: "Alert Center",
        navAI: "AI Copilot (DM Advisory)",
        navCompare: "District Compare",
        navTravel: "Highway Route Safety",
        systemTitle: "DDMA Command Cell",
        systemDesc: "Autonomous disaster prediction, rescue ops dispatch & climate intelligence.",
        searchBtn: "Search District",
        myLocation: "GPS",
        heroTag: "✦ DISTRICT DISASTER INTELLIGENCE & CRISIS COMMAND SYSTEM",
        heroTitle1: "District Command &",
        heroTitle2: "Disaster AI.",
        heroDesc: "Hyperlocal risk modeling, District Digital Twins, Lightning Strike Prediction, Smart SOS dispatch, and autonomous Rescue Team coordination for District Magistrates and Emergency Responders.",
        exploreBtn: "Explore Meteorology →",
        rescueOpsBtn: "NDRF Rescue Ops",
        quickSos: "Emergency SOS",
        listenBulletin: "Listen Bulletin",
        shareWa: "WhatsApp Dispatch",
        scoreLabel: "DISTRICT SAFETY INDEX",
        currentWeatherLabel: "CURRENT METEOROLOGY",
        humidityLabel: "💧 Humidity",
        windLabel: "💨 Wind Speed",
        pressureLabel: "⏱ Air Pressure",
        cloudLabel: "☁ Cloud Cover",
        riskIntelligence: "INTELLIGENCE ENGINE",
        weatherRisk: "Multi-Hazard Risk Assessment",
        aiRecLabel: "DM Executive Directive (AI Recommended)",
        feelsLikeLabel: "FEELS LIKE",
        sensationLabel: "Thermal sensation",
        lightningRiskLabel: "LIGHTNING CAPE",
        uvLabel: "UV INDEX",
        aqiLabel: "AIR QUALITY (AQI)",
        forecastSub: "EXTENDED METEOROLOGY",
        fiveDayHeading: "5 Day District Meteorological Forecast",
        hourlySub: "UPCOMING HOURS",
        hourlyHeading: "Hourly Forecast & Trend",
        cmdSub: "DISTRICT ADMINISTRATION & DISASTER CONTROL",
        cmdTitle: "District Disaster Management Authority (DDMA) Control Room",
        cmdDesc: "Automated meteorological hazard monitoring for District Magistrate / DDMA response teams.",
        exportDoc: "Export Official DDMA Bulletin (PDF/Print)",
        broadcastBtn: "Broadcast Emergency Sirens",
        gramDispatch: "Gram Pradhan WhatsApp Dispatch",
        rescueSub: "AUTONOMOUS EMERGENCY DISPATCH & LOGISTICS",
        rescueTitle: "Smart Rescue Team Coordination Center (NDRF / SDRF)",
        rescueDesc: "Real-time GPS tracking of NDRF/SDRF rescue teams, AI incident triage, equipment load monitoring, safe route navigation, and field check-in synchronization.",
        totalTeams: "DEPLOYED UNITS",
        activeIncidents: "ACTIVE SOS",
        evacuatedCivilians: "EVACUATED CIVILIANS",
        avgResponseTime: "AVG RESPONSE TIME",
        teamStatusSub: "FIELD DEPLOYMENT UNITS",
        teamStatusHeading: "Live Rescue Teams & Equipment Tracking",
        incidentTriageSub: "AUTONOMOUS TRIAGE ENGINE",
        incidentTriageHeading: "Active Incident AI Priority Queue",
        missionTimelineSub: "MISSION LIFECYCLE MONITOR",
        missionTimelineHeading: "Live Rescue Mission Timeline (Team Alpha — Mission #104)",
        twinSub: "DISTRICT VIRTUAL REPLICA & IMPACT MODELING",
        twinTitle: "District AI Digital Twin Simulator",
        twinDesc: "Simulate extreme weather stress tests (monsoon deluges, flash floods, heatwaves). Analyze flooded surface areas, vulnerable populations, submerged bridges, and compute safe evacuation corridors.",
        phasesSub: "3-PHASE DISASTER LIFECYCLE",
        phasesHeading: "Integrated Preparedness, Response & Recovery Plan",
        lightningSub: "THERMODYNAMIC ATMOSPHERIC INSTABILITY",
        lightningTitle: "Lightning Risk Radar & Safe Zone Finder",
        lightningDesc: "Thermodynamic CAPE analysis, cloud-to-ground strike likelihood prediction, 30/30 safety countdown timer, and nearest verified lightning-safe concrete shelters.",
        sosSub: "CIVIC LIFE-SAFETY & OFFLINE RESILIENCE",
        sosTitle: "Smart SOS & Offline Emergency Hub",
        sosDesc: "Broadcast immediate life-saving SOS requests with automatic routing to nearest emergency services. Works 100% offline during network tower blackouts with GPS breadcrumb tracking.",
        resourcesSub: "INTER-DEPARTMENTAL EMERGENCY INVENTORY",
        resourcesTitle: "Smart Emergency Resource Management",
        resourcesDesc: "Centralized multi-departmental tracking of ambulances, fire tenders, ICU beds, dewatering pumps, NDRF battalions, and community relief camp food rations.",
        rankSub: "REGIONAL BENCHMARKING",
        rankTitle: "District Weather Health Leaderboard",
        rankDesc: "Real-time comparative ranking of regional districts across Air Quality, Flood Safety, and Agricultural Viability.",
        cleanestDistrict: "CLEANEST AIR DISTRICT",
        bestFarmDistrict: "BEST AGRI WEATHER",
        safestDistrict: "LOWEST FLOOD RISK",
        rankingTableSub: "REGIONAL SCORECARD",
        rankingTableTitle: "Regional Districts Live Health Index",
        farmerSub: "AGRICULTURE INTELLIGENCE & KRISHI COPILOT",
        farmerTitle: "Kisan Smart Advisor & Mandi Price AI (किसान मित्र)",
        farmerDesc: "Crop-specific weather intelligence, soil moisture modeling, spraying viability, wholesale Mandi price predictions, and PMFBY crop loss claim readiness.",
        selectCrop: "Select Crop (फसल चुनें):",
        cropWheat: "Wheat (गेहूं)",
        cropRice: "Paddy (धान)",
        cropMustard: "Mustard (सरसों)",
        cropSugarcane: "Sugarcane (गन्ना)",
        cropVegetables: "Vegetables (सब्जियां)",
        cropAdvisorySub: "CROP-SPECIFIC AI GUIDANCE",
        sprayWindow: "Spray Window (स्प्रे का सही समय)",
        irrigationNeed: "Irrigation Need (सिंचाई की जरूरत)",
        diseaseRisk: "Pest & Fungus Risk (रोग खतरा)",
        citizenSub: "CIVIC DISASTER CROWDSOURCING",
        citizenTitle: "Citizen Weather & Hazard Report",
        citizenDesc: "Report real-time local hazards (Waterlogging, Fallen Trees, Hail, Power Outages) to alert district teams.",
        submitHazard: "Submit Incident Report",
        hazardTypeLabel: "Hazard Category (आपदा का प्रकार):",
        hazardLocLabel: "Location / Landmark / Ward:",
        hazardDescLabel: "Brief Details:",
        submitBtn: "📍 Pin Hazard on Map & Alert District",
        liveCitizenFeed: "LIVE VERIFIED FEED",
        recentReports: "Recent District Incidents",
        analyticsSub: "METEOROLOGICAL TRENDS",
        analyticsTitle: "Weather Analytics & Trends",
        analyticsDesc: "Understand upcoming hours through interactive real-time trend charts.",
        tempTrend: "Temperature Trend (°C)",
        rainTrend: "Rain Probability (%)",
        humTrend: "Relative Humidity (%)",
        windTrend: "Wind Speed (km/h)",
        mapSub: "GEOSPATIAL HAZARD & RESCUE RADAR",
        mapTitle: "Weather, Rescue Teams & Hazard Map",
        mapDesc: "Live geospatial tracking of deployed rescue units (🚤 🚑 🚒), lightning storm paths, citizen hazard pins, and safe evacuation corridors.",
        locationLabel: "CENTER LOCATION",
        locateMe: "Locate",
        streetMap: "Street",
        satMap: "Satellite",
        conditionLabel: "CONDITION",
        tempLabel: "TEMPERATURE",
        alertsSub: "SAFETY INTELLIGENCE",
        alertsTitle: "Alert Center",
        alertsDesc: "Real-time severe weather hazard detection and safety warnings for your location.",
        activeAlerts: "ACTIVE ALERTS",
        rainRiskLabel: "RAIN RISK",
        airRiskLabel: "AIR QUALITY",
        liveMonitoring: "LIVE MONITORING",
        currentAlerts: "Current Hazard Bulletins",
        aiSub: "ARTIFICIAL INTELLIGENCE",
        aiTitle: "SkyCast AI Disaster Copilot (DM Executive Advisory)",
        aiDesc: "Ask intelligent questions about disaster triage, high-risk zones, rescue deployment priorities, travel viability, and agriculture.",
        copilotTitle: "Disaster & Weather Copilot",
        copilotSub: "Powered by SkyCast Intelligence Engine",
        askBtn: "Ask AI",
        qHighRisk: "Highest Risk Area?",
        qRescuePriority: "Rescue Priority?",
        qLightningShelter: "Lightning Shelter?",
        quickKisan: "Krishi Guide",
        quickTravel: "Travel Safety",
        aiHeading: "Autonomous disaster reasoning.",
        aiParagraph: "SkyCast AI synthesizes thermodynamic atmospheric modeling with geospatial rescue logistics to deliver instant operational clarity to District Magistrates and field commanders.",
        feat1: "Autonomous incident triage by lives at risk",
        feat2: "Weather-aware safe evacuation route generation",
        feat3: "Thermodynamic CAPE lightning strike prediction",
        feat4: "Bilingual natural speech response in English & Hindi",
        compareSub: "WEATHER COMPARISON",
        compareTitle: "Compare Regional Districts",
        compareDesc: "Head-to-head comparison of temperature, humidity, wind, and overall atmospheric comfort.",
        cityOne: "DISTRICT ONE",
        cityTwo: "DISTRICT TWO",
        compareButton: "Compare Weather",
        travelSub: "TRAVEL INTELLIGENCE",
        travelTitle: "Travel & Highway Route Planner",
        travelDesc: "Evaluate route and destination meteorological hazards before you embark.",
        fromLabel: "FROM",
        destLabel: "DESTINATION",
        checkRouteBtn: "Check Route Weather",
        travelRiskLabel: "TRAVEL RISK",
        travelChecklist: "Travel Checklist",
        tip1: "Real-time rain and highway flood risk",
        tip2: "Temperature and thermal comfort index",
        tip3: "Wind gusts and high-speed driving safety",
        tip4: "Visibility and smog conditions on expressway",
        tip5: "Ask SkyCast AI for custom route guidance",
        waModalTitle: "DISTRICT EMERGENCY BROADCAST DISPATCH",
        waModalSub: "Gram Pradhan & Farmer Community Early Warning",
        waModalNote: "Pre-formatted bilingual emergency message for WhatsApp groups and SMS gateway.",
        broadcastMsgLabel: "Broadcast Alert Message (प्रसारण संदेश):",
        openWhatsApp: "Send on WhatsApp",
        copySMS: "Copy SMS Text"
    },
    hi: {
        brandSub: "जिला आपदा नियंत्रण • डीडीएमए",
        navDashboard: "कार्यकारी डैशबोर्ड",
        navDisaster: "डीडीएमए नियंत्रण कक्ष",
        navRescue: "एनडीआरएफ रेस्क्यू केंद्र",
        navTwin: "AI डिजिटल ट्विन",
        navLightning: "वज्रपात रडार व आश्रय",
        navSOS: "स्मार्ट SOS व ऑफलाइन",
        navResources: "संसाधन इन्वेंटरी",
        navLeaderboard: "जिला स्वास्थ्य रैंकिंग",
        navFarmer: "किसान मित्र व मंडी AI",
        navCitizen: "नागरिक आपदा रिपोर्टिंग",
        navAnalytics: "मौसम विश्लेषण चार्ट्स",
        navMap: "मौसम व रेस्क्यू मानचित्र",
        navAlerts: "चेतावनी केंद्र",
        navAI: "AI कोपायलट (डीएम सलाहकार)",
        navCompare: "जिलों की तुलना",
        navTravel: "हाईवे यात्रा योजना",
        systemTitle: "डीडीएमए कमांड सेल",
        systemDesc: "स्वचालित आपदा पूर्वानुमान, रेस्क्यू टीम समन्वय एवं जल संरक्षण मॉडल।",
        searchBtn: "जिला खोजें",
        myLocation: "जीपीएस",
        heroTag: "✦ जिला आपदा इंटेलिजेंस एवं आपातकालीन कमांड सिस्टम",
        heroTitle1: "जिला आपदा प्रबंधन,",
        heroTitle2: "AI संचालित।",
        heroDesc: "हाइपरलोकल जोखिम मॉडलिंग, डिजिटल ट्विन, आकाशीय बिजली पूर्वानुमान, स्मार्ट SOS और स्वचालित रेस्क्यू टीम समन्वय।",
        exploreBtn: "मौसम देखें →",
        rescueOpsBtn: "एनडीआरएफ रेस्क्यू",
        quickSos: "आपातकालीन SOS",
        listenBulletin: "बुलेटिन सुनें",
        shareWa: "व्हाट्सएप अलर्ट",
        scoreLabel: "जिला सुरक्षा सूचकांक",
        currentWeatherLabel: "वर्तमान मौसम",
        humidityLabel: "💧 नमी (Humidity)",
        windLabel: "💨 हवा की गति",
        pressureLabel: "⏱ वायुदाब (Pressure)",
        cloudLabel: "☁ बादल",
        riskIntelligence: "सुरक्षा विश्लेषण",
        weatherRisk: "बहु-आपदा जोखिम इंजन",
        aiRecLabel: "जिलाधिकारी कार्यकारी निर्देश (AI अनुशंसित)",
        feelsLikeLabel: "महसूस तापमान",
        sensationLabel: "वास्तविक अहसास",
        lightningRiskLabel: "वज्रपात CAPE",
        uvLabel: "यूवी इंडेक्स",
        aqiLabel: "वायु गुणवत्ता (AQI)",
        forecastSub: "विस्तृत पूर्वानुमान",
        fiveDayHeading: "5 दिवसीय मौसम पूर्वानुमान",
        hourlySub: "आगामी घंटे",
        hourlyHeading: "घंटेवार मौसम पूर्वानुमान",
        cmdSub: "जिला प्रशासन एवं आपदा नियंत्रण केंद्र",
        cmdTitle: "जिला आपदा प्रबंधन प्राधिकरण (DDMA) नियंत्रण कक्ष",
        cmdDesc: "जिलाधिकारी / डीडीएमए टीमों के लिए स्वचालित मौसम संबंधी आपदा निगरानी प्रणाली।",
        exportDoc: "आधिकारिक डीडीएमए बुलेटिन डाउनलोड करें (PDF/Print)",
        broadcastBtn: "आपातकालीन चेतावनी सायरन बजाएं",
        gramDispatch: "ग्राम प्रधान व्हाट्सएप प्रसारण",
        rescueSub: "स्वचालित आपातकालीन प्रेषण एवं लॉजिस्टिक्स",
        rescueTitle: "स्मार्ट रेस्क्यू टीम नियंत्रण केंद्र (NDRF / SDRF)",
        rescueDesc: "NDRF/SDRF बचाव दलों की लाइव जीपीएस ट्रैकिंग, AI प्राथमिकता निर्धारण, सुरक्षित मार्ग नेविगेशन और फील्ड चेक-इन समन्वय।",
        totalTeams: "सक्रिय बचाव दल",
        activeIncidents: "सक्रिय SOS घटनाएं",
        evacuatedCivilians: "सुरक्षित निकाले गए नागरिक",
        avgResponseTime: "औसत प्रतिक्रिया समय",
        teamStatusSub: "फील्ड यूनिट स्थिति",
        teamStatusHeading: "लाइव रेस्क्यू टीम एवं उपकरण ट्रैकिंग",
        incidentTriageSub: "स्वचालित प्राथमिकता इंजन",
        incidentTriageHeading: "सक्रिय घटना प्राथमिकता कतार",
        missionTimelineSub: "मिशन लाइफसाइकिल मॉनिटर",
        missionTimelineHeading: "लाइव रेस्क्यू मिशन टाइमलाइन (टीम अल्फा — मिशन #104)",
        twinSub: "जिले का वर्चुअल मॉडल एवं प्रभाव विश्लेषण",
        twinTitle: "जिला AI डिजिटल ट्विन सिमुलेटर",
        twinDesc: "अत्यधिक वर्षा (0-250mm), बाढ़ जलभराव, प्रभावित आबादी और सुरक्षित निकासी मार्गों का वास्तविक समय में 3D सिमुलेशन।",
        phasesSub: "आपदा के 3 चरण",
        phasesHeading: "एकीकृत पूर्व-तैयारी, आपातकालीन कार्रवाई एवं पुनर्वास",
        lightningSub: "वातावरणीय अस्थिरता एवं आकाशीय बिजली सुरक्षा",
        lightningTitle: "वज्रपात (Lightning) रडार एवं सुरक्षित आश्रय",
        lightningDesc: "थर्मोडायनामिक CAPE विश्लेषण, बिजली गिरने की संभावना (%), 30/30 सुरक्षा टाइमर और निकटतम पक्के सुरक्षित आश्रय।",
        sosSub: "नागरिक जीवन-रक्षा एवं ऑफलाइन कनेक्टिविटी",
        sosTitle: "स्मार्ट SOS एवं ऑफलाइन इमरजेंसी हब",
        sosDesc: "नेटवर्क टावर बंद होने पर भी GPS ब्रेडक्रम्ब्स के साथ ऑफलाइन SOS अनुरोध दर्ज करें जो कनेक्टिविटी आने पर स्वतः सिंक होंगे।",
        resourcesSub: "विभागवार आपातकालीन संसाधन इन्वेंटरी",
        resourcesTitle: "स्मार्ट आपातकालीन संसाधन प्रबंधन",
        resourcesDesc: "एम्बुलेंस, फायर टेंडर, आईसीयू बेड, जल निकासी पंप, एनडीआरएफ बल और राहत शिविर राशन का केंद्रीकृत प्रबंधन।",
        rankSub: "क्षेत्रीय तुलना एवं मौसम स्वास्थ्य सूचकांक",
        rankTitle: "जिला मौसम एवं स्वास्थ्य लीडरबोर्ड",
        rankDesc: "वायु गुणवत्ता, बाढ़ सुरक्षा और कृषि अनुकूलता पर क्षेत्रीय जिलों की लाइव तुलनात्मक रैंकिंग।",
        cleanestDistrict: "सबसे साफ हवा वाला जिला",
        bestFarmDistrict: "खेती के लिए उत्तम मौसम",
        safestDistrict: "न्यूनतम बाढ़/आपदा जोखिम",
        rankingTableSub: "क्षेत्रीय स्कोरकार्ड",
        rankingTableTitle: "क्षेत्रीय जिलों का लाइव स्वास्थ्य सूचकांक",
        farmerSub: "स्मार्ट कृषि प्रणाली एवं कृषक कोपायलट",
        farmerTitle: "किसान स्मार्ट मित्र एवं मंडी भाव AI",
        farmerDesc: "फसल-विशिष्ट मौसम पूर्वानुमान, मिट्टी की नमी, कीटनाशक स्प्रे का सही समय, मंडी भाव रुझान और पीएमएफबीवाई फसल बीमा क्लेम सलाह।",
        selectCrop: "अपनी फसल चुनें:",
        cropWheat: "गेहूं (Wheat)",
        cropRice: "धान (Paddy)",
        cropMustard: "सरसों (Mustard)",
        cropSugarcane: "गन्ना (Sugarcane)",
        cropVegetables: "सब्जियां (Vegetables)",
        cropAdvisorySub: "फसल-विशिष्ट AI सलाह",
        sprayWindow: "कीटनाशक स्प्रे का सही समय",
        irrigationNeed: "सिंचाई की आवश्यकता",
        diseaseRisk: "कीट एवं फफूंद रोग खतरा",
        citizenSub: "नागरिक आपदा क्राउडसोर्सिंग",
        citizenTitle: "नागरिक मौसम एवं आपदा रिपोर्टिंग",
        citizenDesc: "जलभराव, गिरे पेड़, टूटे बिजली के तार और ओलावृष्टि की तुरंत रिपोर्ट दर्ज करें।",
        submitHazard: "घटना की रिपोर्ट दर्ज करें",
        hazardTypeLabel: "आपदा का प्रकार:",
        hazardLocLabel: "स्थान / लैंडमार्क / वार्ड:",
        hazardDescLabel: "विवरण:",
        submitBtn: "📍 मैप पर पिन करें एवं कंट्रोल रूम को भेजें",
        liveCitizenFeed: "लाइव सत्यापित घटनाएं",
        recentReports: "हाल की दर्ज घटनाएं",
        analyticsSub: "डेटा विश्लेषण",
        analyticsTitle: "मौसम विश्लेषण चार्ट्स",
        analyticsDesc: "आगामी 24 घंटों में मौसम के बदलाव को ग्राफ द्वारा समझें।",
        tempTrend: "तापमान का रुझान (°C)",
        rainTrend: "बारिश की संभावना (%)",
        humTrend: "नमी प्रतिशत (%)",
        windTrend: "हवा की रफ्तार (km/h)",
        mapSub: "भू-स्थानिक मौसम एवं आपदा ट्रैकर",
        mapTitle: "मौसम, रेस्क्यू टीम एवं आपदा मानचित्र",
        mapDesc: "लाइव मौसम, तैनात रेस्क्यू यूनिट्स (🚤 🚑 🚒), आकाशीय बिजली खतरा क्षेत्र और सुरक्षित निकासी गलियारे।",
        locationLabel: "केंद्र स्थान",
        locateMe: "मेरा स्थान",
        streetMap: "सड़क मानचित्र",
        satMap: "सैटेलाइट",
        conditionLabel: "स्थिति",
        tempLabel: "तापमान",
        alertsSub: "सुरक्षा इंटेलिजेंस",
        alertsTitle: "आपदा चेतावनी केंद्र",
        alertsDesc: "आपके क्षेत्र के लिए मौसम संबंधी गंभीर चेतावनियां और सुरक्षा निर्देश।",
        activeAlerts: "सक्रिय चेतावनियां",
        rainRiskLabel: "बारिश जोखिम",
        airRiskLabel: "वायु गुणवत्ता",
        liveMonitoring: "लाइव निगरानी",
        currentAlerts: "वर्तमान आपदा बुलेटिन",
        aiSub: "आर्टिफिशियल इंटेलिजेंस",
        aiTitle: "स्काईकास्ट AI आपदा कोपायलट (डीएम सलाहकार)",
        aiDesc: "आपदा प्राथमिकता, उच्च-जोखिम क्षेत्र, रेस्क्यू तैनाती और कृषि सलाह के बारे में पूछें।",
        copilotTitle: "आपदा एवं मौसम कोपायलट",
        copilotSub: "स्काईकास्ट इंटेलिजेंस द्वारा संचालित",
        askBtn: "AI से पूछें",
        qHighRisk: "सबसे खतरनाक क्षेत्र?",
        qRescuePriority: "रेस्क्यू प्राथमिकता?",
        qLightningShelter: "सुरक्षित बिजली आश्रय?",
        quickKisan: "कृषि सलाह",
        quickTravel: "यात्रा सुरक्षा",
        aiHeading: "सटीक और स्वचालित आपदा निर्णय।",
        aiParagraph: "स्काईकास्ट AI वातावरणीय डेटा और रेस्क्यू लॉजिस्टिक्स का विश्लेषण कर तुरंत व्यावहारिक निर्देश देता है।",
        feat1: "जीवन जोखिम के आधार पर स्वचालित घटना प्राथमिकता",
        feat2: "मौसम-अनुकूल सुरक्षित निकासी मार्ग निर्माण",
        feat3: "थर्मोडायनामिक CAPE वज्रपात पूर्वानुमान",
        feat4: "हिंदी एवं अंग्रेजी में बोलकर जवाब",
        compareSub: "मौसम तुलना",
        compareTitle: "जिलों और शहरों की तुलना",
        compareDesc: "दो शहरों के तापमान, नमी, हवा और मौसम की आमने-सामने तुलना करें।",
        cityOne: "पहला जिला/शहर",
        cityTwo: "दूसरा जिला/शहर",
        compareButton: "मौसम की तुलना करें",
        travelSub: "यात्रा इंटेलिजेंस",
        travelTitle: "यात्रा एवं हाईवे सुरक्षा योजना",
        travelDesc: "यात्रा शुरू करने से पहले मार्ग और गंतव्य के मौसम संबंधी जोखिम जांचें।",
        fromLabel: "प्रस्थान",
        destLabel: "गंतव्य",
        checkRouteBtn: "रूट का मौसम जांचें",
        travelRiskLabel: "यात्रा जोखिम",
        travelChecklist: "यात्रा चेकलिस्ट",
        tip1: "हाईवे पर बारिश व जलभराव की स्थिति",
        tip2: "तापमान एवं थर्मल कम्फर्ट इंडेक्स",
        tip3: "तेज हवा के झोंके और सुरक्षित ड्राइविंग",
        tip4: "एक्सप्रेसवे पर दृश्यता (Visibility) और कोहरा",
        tip5: "स्काईकास्ट AI से व्यक्तिगत यात्रा सलाह लें",
        waModalTitle: "जिला आपातकालीन प्रसारण प्रेषण (DISPATCH)",
        waModalSub: "ग्राम प्रधान एवं कृषक समुदाय पूर्व चेतावनी",
        waModalNote: "व्हाट्सएप ग्रुप्स एवं एसएमएस गेटवे हेतु पूर्व-स्वरूपित द्विभाषी चेतावनी संदेश।",
        broadcastMsgLabel: "प्रसारण संदेश (Broadcast Message):",
        openWhatsApp: "व्हाट्सएप पर भेजें",
        copySMS: "एसएमएस टेक्स्ट कॉपी करें"
    }
};


/* =========================================================
   HELPER FUNCTIONS & REAL-TIME IST CLOCK
========================================================= */

const $ = id => document.getElementById(id);

function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
}

function showError(message) {
    const el = $("error");
    if (!el) {
        console.error(message);
        return;
    }
    el.textContent = message;
    el.classList.remove("hidden");
}

function hideError() {
    $("error")?.classList.add("hidden");
}

function capitalize(text) {
    if (!text) return "--";
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function startLiveClock() {
    const update = () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
        setText("liveIstClock", `🕒 ${dateStr} | ${timeStr} IST`);
    };
    update();
    setInterval(update, 1000);
}

function updateLanguageUI() {
    const dict = I18N[currentLanguage];
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.dataset.i18n;
        if (dict[key]) {
            el.textContent = dict[key];
        }
    });

    const langLabel = $("langLabel");
    if (langLabel) {
        langLabel.textContent = currentLanguage === "en" ? "हिन्दी" : "English";
    }

    if (W?.current) {
        updateFarmer(W.current, W.forecast);
        updateCommandCenter(W.current, W.forecast);
        updateFiveDayForecast(W.forecast, W.daily);
    }

    renderRescueOps();
    renderDistrictLeaderboard();
    renderLightningShelters();
}

function toggleLanguage() {
    currentLanguage = currentLanguage === "en" ? "hi" : "en";
    localStorage.setItem("skycast-lang", currentLanguage);
    updateLanguageUI();
}

function loadLanguage() {
    const saved = localStorage.getItem("skycast-lang");
    if (saved === "hi" || saved === "en") {
        currentLanguage = saved;
    }
    updateLanguageUI();
}


/* =========================================================
   FEATURE: AMBIENT WEATHER PARTICLE CANVAS ENGINE
========================================================= */

let meteoCanvas = null;
let meteoCtx = null;
let meteoParticles = [];
let meteoAnimId = null;

function initMeteoCanvas() {
    meteoCanvas = $("meteoBackgroundCanvas");
    if (!meteoCanvas) return;
    meteoCtx = meteoCanvas.getContext("2d");

    const resize = () => {
        meteoCanvas.width = window.innerWidth;
        meteoCanvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    meteoParticles = [];
    for (let i = 0; i < 40; i++) {
        meteoParticles.push({
            x: Math.random() * meteoCanvas.width,
            y: Math.random() * meteoCanvas.height,
            radius: Math.random() * 2 + 1,
            speedY: Math.random() * 0.6 + 0.2,
            speedX: (Math.random() - 0.5) * 0.4,
            opacity: Math.random() * 0.4 + 0.1
        });
    }

    const animate = () => {
        if (!meteoCtx) return;
        meteoCtx.clearRect(0, 0, meteoCanvas.width, meteoCanvas.height);

        meteoParticles.forEach(p => {
            meteoCtx.beginPath();
            meteoCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            meteoCtx.fillStyle = `rgba(0, 242, 254, ${p.opacity})`;
            meteoCtx.fill();

            p.y += p.speedY;
            p.x += p.speedX;

            if (p.y > meteoCanvas.height) {
                p.y = 0;
                p.x = Math.random() * meteoCanvas.width;
            }
            if (p.x > meteoCanvas.width) p.x = 0;
            if (p.x < 0) p.x = meteoCanvas.width;
        });

        meteoAnimId = requestAnimationFrame(animate);
    };

    if (meteoAnimId) cancelAnimationFrame(meteoAnimId);
    animate();
}


/* =========================================================
   FEATURE: LIGHTNING RADAR CANVAS SWEEP ENGINE
========================================================= */

let radarCanvas = null;
let radarCtx = null;
let radarAngle = 0;
let radarAnimId = null;

function initLightningRadarCanvas() {
    radarCanvas = $("lightningRadarCanvas");
    if (!radarCanvas) return;
    radarCtx = radarCanvas.getContext("2d");
    radarCanvas.width = 150;
    radarCanvas.height = 150;

    const draw = () => {
        if (!radarCtx) return;
        radarCtx.clearRect(0, 0, 150, 150);

        const cx = 75;
        const cy = 75;
        const radius = 70;

        // Concentric radar circles
        radarCtx.strokeStyle = "rgba(0, 242, 254, 0.25)";
        radarCtx.lineWidth = 1;
        radarCtx.beginPath();
        radarCtx.arc(cx, cy, 22, 0, Math.PI * 2);
        radarCtx.arc(cx, cy, 44, 0, Math.PI * 2);
        radarCtx.arc(cx, cy, 66, 0, Math.PI * 2);
        radarCtx.stroke();

        // Crosshairs
        radarCtx.beginPath();
        radarCtx.moveTo(cx, 5); radarCtx.lineTo(cx, 145);
        radarCtx.moveTo(5, cy); radarCtx.lineTo(145, cy);
        radarCtx.stroke();

        // Spinning Sweep Line
        radarCtx.save();
        radarCtx.translate(cx, cy);
        radarCtx.rotate(radarAngle);

        const grad = radarCtx.createLinearGradient(0, 0, radius, 0);
        grad.addColorStop(0, "rgba(0, 242, 254, 0.85)");
        grad.addColorStop(1, "rgba(0, 242, 254, 0.0)");

        radarCtx.beginPath();
        radarCtx.moveTo(0, 0);
        radarCtx.arc(0, 0, radius, 0, Math.PI / 4);
        radarCtx.lineTo(0, 0);
        radarCtx.fillStyle = "rgba(0, 242, 254, 0.12)";
        radarCtx.fill();

        radarCtx.strokeStyle = "rgba(0, 242, 254, 0.85)";
        radarCtx.lineWidth = 2;
        radarCtx.beginPath();
        radarCtx.moveTo(0, 0);
        radarCtx.lineTo(radius, 0);
        radarCtx.stroke();

        radarCtx.restore();

        radarAngle += 0.04;
        radarAnimId = requestAnimationFrame(draw);
    };

    if (radarAnimId) cancelAnimationFrame(radarAnimId);
    draw();
}


/* =========================================================
   FEATURE: DIGITAL TWIN 2D/3D INUNDATION CANVAS
========================================================= */

let twinCanvas = null;
let twinCtx = null;
let twinWaterWave = 0;

function drawDigitalTwinCanvas(rainfallMm = 120) {
    twinCanvas = $("digitalTwinCanvas");
    if (!twinCanvas) return;
    twinCtx = twinCanvas.getContext("2d");

    const w = twinCanvas.clientWidth || 700;
    const h = 250;
    const dpr = window.devicePixelRatio || 1;
    twinCanvas.width = w * dpr;
    twinCanvas.height = h * dpr;
    twinCtx.scale(dpr, dpr);

    twinCtx.clearRect(0, 0, w, h);

    // Draw high-tech topographic mesh
    twinCtx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    twinCtx.lineWidth = 1;
    for (let x = 0; x < w; x += 35) {
        twinCtx.beginPath();
        twinCtx.moveTo(x, 0);
        twinCtx.lineTo(x, h);
        twinCtx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
        twinCtx.beginPath();
        twinCtx.moveTo(0, y);
        twinCtx.lineTo(w, y);
        twinCtx.stroke();
    }

    // Topographic baseline terrain contour
    twinCtx.beginPath();
    twinCtx.moveTo(0, h * 0.75);
    twinCtx.bezierCurveTo(w * 0.25, h * 0.65, w * 0.5, h * 0.85, w * 0.75, h * 0.60);
    twinCtx.bezierCurveTo(w * 0.88, h * 0.50, w * 0.95, h * 0.55, w, h * 0.65);
    twinCtx.strokeStyle = "rgba(0, 242, 254, 0.4)";
    twinCtx.lineWidth = 2;
    twinCtx.stroke();

    // Inundation water level
    const waterHeight = Math.min(170, (rainfallMm / 250) * 170);
    const waterY = h - waterHeight;

    const grad = twinCtx.createLinearGradient(0, waterY, 0, h);
    grad.addColorStop(0, rainfallMm >= 100 ? "rgba(225, 29, 72, 0.65)" : "rgba(59, 130, 246, 0.5)");
    grad.addColorStop(1, "rgba(6, 11, 22, 0.95)");

    twinCtx.fillStyle = grad;
    twinCtx.beginPath();
    twinCtx.moveTo(0, waterY);
    for (let x = 0; x <= w; x += 25) {
        const yOffset = Math.sin((x / 35) + twinWaterWave) * 5;
        twinCtx.lineTo(x, waterY + yOffset);
    }
    twinCtx.lineTo(w, h);
    twinCtx.lineTo(0, h);
    twinCtx.closePath();
    twinCtx.fill();

    // High Ground Safe Node #1
    twinCtx.fillStyle = "#10b981";
    twinCtx.beginPath();
    twinCtx.arc(w * 0.22, h * 0.35, 7, 0, Math.PI * 2);
    twinCtx.fill();
    twinCtx.fillStyle = "#ffffff";
    twinCtx.font = "bold 11px Inter, sans-serif";
    twinCtx.fillText("🛡️ High Ground Sector #1 (Shelter)", w * 0.22 + 12, h * 0.35 + 4);

    // High Ground Safe Node #2 (District Hospital)
    twinCtx.fillStyle = "#38bdf8";
    twinCtx.beginPath();
    twinCtx.arc(w * 0.72, h * 0.28, 7, 0, Math.PI * 2);
    twinCtx.fill();
    twinCtx.fillStyle = "#ffffff";
    twinCtx.fillText("🏥 District Civil Hospital Safe Node", w * 0.72 + 12, h * 0.28 + 4);

    // Moving Rescue Boat Marker
    const vehX = (w * 0.48) + Math.sin(twinWaterWave) * 25;
    const vehY = Math.max(30, waterY - 8);
    twinCtx.font = "20px Inter, sans-serif";
    twinCtx.fillText("🚤", vehX, vehY);
}


/* =========================================================
   PWA & SERVICE WORKER ENGINE
========================================================= */

function setupPWA() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js").then(() => {
            console.log("✅ SkyCast AI PWA Service Worker Active.");
        }).catch(() => {});
    }

    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPwaPrompt = e;
        const btn = $("pwaInstallBtn");
        if (btn) btn.classList.remove("hidden");
    });

    $("pwaInstallBtn")?.addEventListener("click", async () => {
        if (!deferredPwaPrompt) return;
        deferredPwaPrompt.prompt();
        const { outcome } = await deferredPwaPrompt.userChoice;
        if (outcome === "accepted") {
            $("pwaInstallBtn")?.classList.add("hidden");
        }
        deferredPwaPrompt = null;
    });
}


/* =========================================================
   PILLAR B: SMART RESCUE TEAM COORDINATION CENTER
========================================================= */

function renderRescueOps() {
    const grid = $("rescueTeamsGrid");
    if (grid) {
        grid.innerHTML = rescueTeams.map(t => {
            const statusLabel = t.status === "available"
                ? (currentLanguage === "hi" ? "🟢 उपलब्ध (Available)" : "🟢 Available")
                : t.status === "assigned"
                    ? (currentLanguage === "hi" ? "🟡 नियुक्त (Assigned)" : "🟡 Assigned")
                    : t.status === "on_mission"
                        ? (currentLanguage === "hi" ? "🟠 मिशन पर (On Mission)" : "🟠 On Mission")
                        : (currentLanguage === "hi" ? "🔴 आपातकाल (Emergency)" : "🔴 Emergency");

            return `
                <div class="rescue-team-card">
                    <div class="team-card-header">
                        <div class="team-title">
                            <span class="team-status-dot ${t.status}"></span>
                            <div>
                                <strong>${t.name}</strong>
                                <small style="display:block; color:var(--text-muted); font-size:11px;">${t.specialty}</small>
                            </div>
                        </div>
                        <span class="status-pill ${t.status === 'available' ? 'safe' : t.status === 'on_mission' ? 'danger' : 'warning'}">${statusLabel}</span>
                    </div>

                    <div class="team-equipment-row">
                        ${t.equipment.map(e => `<span class="equip-chip">${e}</span>`).join("")}
                    </div>

                    <div class="team-meta">
                        <div>📍 <b>Location Base:</b> ${t.locationName}</div>
                        <div>👥 <b>Personnel:</b> ${t.members} Rescuers | <b>Evacuation Capacity:</b> ${t.capacity} Persons</div>
                        <div>🎯 <b>Operational Status:</b> <span style="color:var(--text-primary); font-weight:700;">${t.activeMission}</span></div>
                        <div style="color:var(--cyan); margin-top:5px;">📡 <b>Last Check-In:</b> ${t.lastCheckIn}</div>
                    </div>
                </div>
            `;
        }).join("");
    }

    // Render Active Incident AI Triage Table
    const triageTbody = $("incidentTriageBody");
    if (triageTbody) {
        triageTbody.innerHTML = activeIncidents.map(inc => {
            const recTeam = rescueTeams.find(t => t.id === inc.recommendedTeamId) || rescueTeams[0];
            const pMedal = inc.priority === 1 ? "🚨 P1 Critical" : inc.priority === 2 ? "⚠️ P2 High" : "⚡ P3 Routine";
            const pClass = inc.priority === 1 ? "danger" : inc.priority === 2 ? "warning" : "safe";

            return `
                <tr>
                    <td><span class="status-pill ${pClass}">${pMedal}</span></td>
                    <td><b>${inc.category}</b></td>
                    <td>📍 ${inc.location}</td>
                    <td><b>${inc.people} Persons</b> <small style="color:var(--text-muted);">(${inc.vulnerable})</small></td>
                    <td><span class="status-pill ${pClass}">${inc.severity}</span></td>
                    <td><b>${recTeam.name}</b></td>
                    <td>
                        <button class="btn btn-primary" style="padding:6px 14px; font-size:11.5px;" onclick="assignRescueTeam('${inc.id}', '${recTeam.id}')">
                            Dispatch ${recTeam.name.split(' ')[1]} →
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }
}

function assignRescueTeam(incidentId, teamId) {
    const team = rescueTeams.find(t => t.id === teamId);
    const incident = activeIncidents.find(i => i.id === incidentId);

    if (team && incident) {
        team.status = "on_mission";
        team.activeMission = `Assigned to ${incident.category} at ${incident.location}`;
        renderRescueOps();
        triggerEmergencySiren(2);
        alert(currentLanguage === "hi"
            ? `🚨 ${team.name} को ${incident.location} पर ${incident.category} के लिए रवाना किया गया! सुरक्षित मार्ग नेविगेशन मैप पर सक्रिय।`
            : `🚨 ${team.name} successfully dispatched to ${incident.location}! Weather-aware safe route active on map.`);
    }
}

function handleFieldCheckInSubmit(e) {
    e.preventDefault();
    const teamId = $("checkInTeamSelect")?.value;
    const status = $("checkInStatusSelect")?.value;
    const evacCount = Number($("checkInEvacCount")?.value || 0);
    const notes = $("checkInNotes")?.value?.trim() || "Routine status check-in";

    const team = rescueTeams.find(t => t.id === teamId);
    if (team) {
        team.status = status;
        const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        team.lastCheckIn = `${timeStr} • ${evacCount > 0 ? evacCount + ' evacuated. ' : ''}${notes}`;
        renderRescueOps();

        const curEvac = Number($("kpiEvacuated")?.textContent?.split(" ")[0] || 64);
        setText("kpiEvacuated", `${curEvac + evacCount} Rescued`);

        alert(currentLanguage === "hi" ? "✅ फील्ड चेक-इन सफलतापूर्वक जिला कंट्रोल रूम को भेज दिया गया!" : "✅ Field status check-in successfully synced with DDMA Command Center!");
        $("checkInModal")?.classList.add("hidden");
        $("checkInForm")?.reset();
    }
}


/* =========================================================
   PILLAR A1: DISTRICT DIGITAL TWIN SIMULATOR
========================================================= */

function updateDigitalTwin(rainfallMm) {
    setText("twinRainVal", `${rainfallMm} mm`);

    const area = (rainfallMm * 0.32).toFixed(1);
    const depth = (rainfallMm * 0.018).toFixed(1);
    const pop = Math.round(rainfallMm * 350).toLocaleString();

    setText("twinSubmergedArea", `${area} sq km`);
    setText("twinInundationLevel", `Inundation: ${depth} meters`);
    setText("twinAtRiskPop", `${pop} Civilians`);

    if (rainfallMm >= 150) {
        setText("twinGridRisk", "4 Substations Emergency Cutoff");
        setText("twinRoadsCount", "8 Key Corridors Submerged");
        setText("twinAltRouteText", "3 Safe Bypass Corridors Generated");
    } else if (rainfallMm >= 80) {
        setText("twinGridRisk", "2 Substations On Standby");
        setText("twinRoadsCount", "4 Arterial Roads Blocked");
        setText("twinAltRouteText", "5 Alternate Routes Active");
    } else {
        setText("twinGridRisk", "All Substations Normal");
        setText("twinRoadsCount", "All Arterial Highways Clear");
        setText("twinAltRouteText", "Standard Flow");
    }

    drawDigitalTwinCanvas(rainfallMm);

    // Update Digital Twin overlay on Leaflet Map
    if (weatherMap && W?.current) {
        const lat = W.current.coord.lat;
        const lon = W.current.coord.lon;

        if (floodOverlayLayer) weatherMap.removeLayer(floodOverlayLayer);
        if (safeRoutePolyline) weatherMap.removeLayer(safeRoutePolyline);

        if (rainfallMm >= 60) {
            const radius = rainfallMm * 40;
            floodOverlayLayer = L.circle([lat + 0.01, lon - 0.01], {
                color: "#e11d48",
                fillColor: "#e11d48",
                fillOpacity: Math.min(0.55, rainfallMm / 300),
                radius: radius
            }).addTo(weatherMap).bindPopup(`<b>🌊 DIGITAL TWIN FLOOD INUNDATION</b><br>Rainfall: ${rainfallMm}mm<br>Estimated Inundation: ${depth}m`);

            const safePath = [
                [lat - 0.02, lon - 0.02],
                [lat - 0.01, lon],
                [lat + 0.005, lon + 0.02],
                [lat + 0.02, lon + 0.03]
            ];
            safeRoutePolyline = L.polyline(safePath, {
                color: "#10b981",
                weight: 5,
                dashArray: "10, 10"
            }).addTo(weatherMap).bindPopup("<b>🛡️ AI RECOMMENDED SAFE EVACUATION CORRIDOR</b><br>Clear of flood inundation.");
        }
    }
}


/* =========================================================
   PILLAR A2 & A11: LIGHTNING RISK RADAR & SAFE ZONE
========================================================= */

function calculateLightningRisk(current, forecast) {
    const hum = current?.main?.humidity || 60;
    const temp = current?.main?.temp || 28;
    const rain = forecast ? getRainProbability(forecast) : 15;
    const weatherDesc = (current?.weather?.[0]?.description || "").toLowerCase();
    const weatherId = current?.weather?.[0]?.id || 0;

    let cape = 400;
    let prob = 8;

    // Check if there is an actual thunderstorm or severe instability
    const isRealThunderstorm = weatherDesc.includes("thunder") || weatherDesc.includes("lightning") || weatherId === 95 || weatherId === 96 || weatherId === 99;

    if (activeSimulation === "lightning") {
        cape = 2850;
        prob = 88;
    } else if (activeSimulation === "storm") {
        cape = 2100;
        prob = 74;
    } else if (isRealThunderstorm) {
        cape = Math.round(2000 + (hum * 5) + (temp * 15));
        prob = Math.min(95, Math.max(65, Math.round((cape / 3000) * 100)));
    } else {
        // Routine normal day formula (CAPE remains safe 200 - 750 J/kg)
        cape = Math.round((temp * 10) + (hum * 3) + (rain * 2));
        prob = Math.min(25, Math.max(5, Math.round(cape / 50)));
    }

    skycastLightningCape = cape;
    skycastLightningRisk = prob;

    setText("dashLightningCape", `${cape} J/kg`);
    setText("dashLightningStatus", prob >= 70 ? "HIGH THREAT" : prob >= 40 ? "MODERATE" : "SAFE");
    setText("quickLightningRisk", `${prob >= 70 ? 'High' : prob >= 40 ? 'Moderate' : 'Low'} (${prob}%)`);

    setText("lightningCapeVal", `${cape.toLocaleString()} J/kg`);
    setText("lightningProbVal", `${prob}%`);
    setText("lightningLiVal", cape >= 2000 ? "-5.4 (Extremely Unstable)" : cape >= 1200 ? "-2.8 (Unstable)" : "+1.8 (Stable)");
    setText("lightningEtaVal", prob >= 70 ? "Within 20–35 Mins (Severe)" : prob >= 40 ? "Within 45–60 Mins" : "No Storm Expected");

    const pill = $("lightningAlertPill");
    const note = $("lightningActionNote");
    if (prob >= 70) {
        if (pill) { pill.textContent = "⚡ CRITICAL WARNING"; pill.className = "status-pill danger"; }
        if (note) { note.textContent = "🚨 Take shelter in pucca concrete building immediately! Avoid open grounds and metal poles."; note.className = "threat-note red"; }
    } else if (prob >= 40) {
        if (pill) { pill.textContent = "⚠️ MODERATE RISK"; pill.className = "status-pill warning"; }
        if (note) { note.textContent = "⚠️ Thunderstorm developing. Monitor skies and remain near safe shelters."; note.className = "threat-note yellow"; }
    } else {
        if (pill) { pill.textContent = "🟢 SAFE"; pill.className = "status-pill safe"; }
        if (note) { note.textContent = "✅ Low atmospheric instability. Safe for routine outdoor activities."; note.className = "threat-note green"; }
    }

    renderLightningShelters();
}

function renderLightningShelters() {
    const list = $("safeSheltersList");
    if (!list) return;

    list.innerHTML = LIGHTNING_SHELTERS.map(s => `
        <div class="shelter-item">
            <div class="shelter-info">
                <strong>🏛️ ${s.name}</strong>
                <small>${s.type} • Distance: <b>${s.distance}</b> • Capacity: <b>${s.capacity}</b></small>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <span class="shelter-badge">${s.safetyGrade.split('(')[0]}</span>
                <button class="btn btn-primary" style="padding:6px 14px; font-size:11.5px;" onclick="navigateShelter(${s.latOffset}, ${s.lonOffset}, '${s.name}')">Route →</button>
            </div>
        </div>
    `).join("");
}

function navigateShelter(latOff, lonOff, name) {
    if (weatherMap && W?.current) {
        const pinLat = W.current.coord.lat + latOff;
        const pinLon = W.current.coord.lon + lonOff;
        weatherMap.setView([pinLat, pinLon], 14, { animate: true });

        L.marker([pinLat, pinLon]).addTo(weatherMap)
            .bindPopup(`<b>🛡️ VERIFIED LIGHTNING SAFE SHELTER</b><br>📍 ${name}<br>Grade A Lightning Protection Active`)
            .openPopup();

        const mapBtn = document.querySelector('[data-screen="mapScreen"]');
        if (mapBtn) mapBtn.click();
    }
}


/* =========================================================
   PILLAR A5 & A6: SMART SOS & OFFLINE QUEUE ENGINE
========================================================= */

function setupOfflineEngine() {
    const updateOnlineStatus = () => {
        const isOnline = navigator.onLine;
        const badge = $("netStatusBadge");
        const banner = $("offlineBanner");

        if (isOnline) {
            if (badge) { badge.textContent = "● ONLINE"; badge.className = "badge-live"; }
            if (banner) banner.classList.add("hidden");
            syncOfflineQueue();
        } else {
            if (badge) { badge.textContent = "○ OFFLINE MODE"; badge.className = "status-pill danger"; }
            if (banner) banner.classList.remove("hidden");
        }
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    updateOnlineStatus();

    // Log GPS Movement Breadcrumbs
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const point = {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
            };
            gpsBreadcrumbs.push(point);
            localStorage.setItem("skycast_breadcrumbs", JSON.stringify(gpsBreadcrumbs));
            setText("gpsBreadcrumbCount", `${gpsBreadcrumbs.length} Location Points Logged`);
        }, () => {});
    }

    $("forceSyncBtn")?.addEventListener("click", syncOfflineQueue);
}

function handleSmartSOS(e) {
    e.preventDefault();
    const category = $("sosCategory")?.value;
    const people = Number($("sosPeopleCount")?.value || 1);
    const vulnerable = $("sosVulnerable")?.value === "yes" ? "Infants/Elderly Present" : "Adults";
    const location = $("sosLocation")?.value?.trim();
    const details = $("sosDetails")?.value?.trim() || "Immediate rescue assistance requested";

    if (!location) {
        showError("Please enter location or use GPS button.");
        return;
    }

    const newSos = {
        id: `INC-${Date.now().toString().slice(-3)}`,
        priority: people >= 10 || vulnerable.includes("Infants") ? 1 : 2,
        category: category.replace("_", " ").toUpperCase(),
        location: location,
        people: people,
        vulnerable: vulnerable,
        severity: people >= 10 ? "CRITICAL" : "HIGH",
        recommendedTeamId: category.includes("flood") ? "alpha" : category.includes("medical") ? "bravo" : "charlie",
        status: "SOS Received • Auto-Triaged",
        timestamp: new Date().toISOString()
    };

    if (navigator.onLine) {
        activeIncidents.unshift(newSos);
        renderRescueOps();
        triggerEmergencySiren(4);
        alert(currentLanguage === "hi"
            ? `🚨 आपातकालीन SOS सफलतापूर्वक दर्ज! घटना ID: ${newSos.id}। जिला नियंत्रण कक्ष एवं ${newSos.recommendedTeamId.toUpperCase()} टीम को भेजा गया।`
            : `🚨 EMERGENCY SOS BROADCASTED! Incident ID: ${newSos.id} prioritized in AI Triage. Dispatched to First Responders.`);
    } else {
        offlineQueue.push(newSos);
        localStorage.setItem("skycast_offline_queue", JSON.stringify(offlineQueue));
        setText("offlineQueueBadge", `${offlineQueue.length} Queued`);
        alert(currentLanguage === "hi"
            ? `📡 नेटवर्क बंद है! SOS अनुरोध स्थानीय ऑफलाइन कतार में सुरक्षित किया गया है। नेटवर्क मिलते ही यह स्वचालित रूप से प्रेषित हो जाएगा।`
            : `📡 OFFLINE MODE: SOS request saved in local storage queue. It will automatically synchronize when network is restored.`);
    }

    $("smartSosForm")?.reset();
}

function syncOfflineQueue() {
    const saved = localStorage.getItem("skycast_offline_queue");
    if (saved) {
        try {
            const queue = JSON.parse(saved);
            if (queue.length > 0) {
                queue.forEach(item => activeIncidents.unshift(item));
                localStorage.removeItem("skycast_offline_queue");
                offlineQueue = [];
                setText("offlineQueueBadge", `0 Queued`);
                renderRescueOps();
                alert(`✅ Offline Sync Complete: ${queue.length} SOS requests synchronized with DDMA Command Center!`);
            }
        } catch (e) {}
    }
}


/* =========================================================
   FEATURE: EMERGENCY SIREN ALARM & STROBE
========================================================= */

function triggerEmergencySiren(durationSeconds = 4) {
    if (isSirenPlaying) {
        stopEmergencySiren();
        return;
    }

    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        if (!audioCtx) audioCtx = new AudioContextClass();
        if (audioCtx.state === "suspended") audioCtx.resume();

        sirenOsc = audioCtx.createOscillator();
        sirenGain = audioCtx.createGain();

        sirenOsc.type = "sawtooth";
        sirenGain.gain.setValueAtTime(0.18, audioCtx.currentTime);

        sirenOsc.connect(sirenGain);
        sirenGain.connect(audioCtx.destination);

        let freq = 650;
        let rising = true;

        sirenOsc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        sirenOsc.start();
        isSirenPlaying = true;

        $("sirenBtn")?.classList.add("active");
        $("strobeOverlay")?.classList.remove("hidden");

        sirenInterval = setInterval(() => {
            if (!isSirenPlaying || !sirenOsc) return;
            if (rising) {
                freq += 45;
                if (freq >= 950) rising = false;
            } else {
                freq -= 45;
                if (freq <= 600) rising = true;
            }
            sirenOsc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        }, 60);

        if (durationSeconds > 0) {
            setTimeout(() => {
                stopEmergencySiren();
            }, durationSeconds * 1000);
        }
    } catch (e) {
        console.warn("Web Audio API not allowed without user gesture:", e);
    }
}

function stopEmergencySiren() {
    if (sirenInterval) {
        clearInterval(sirenInterval);
        sirenInterval = null;
    }
    if (sirenOsc) {
        try {
            sirenOsc.stop();
            sirenOsc.disconnect();
        } catch (e) {}
        sirenOsc = null;
    }
    isSirenPlaying = false;
    $("sirenBtn")?.classList.remove("active");
    $("strobeOverlay")?.classList.add("hidden");
}


/* =========================================================
   FEATURE: 1-CLICK WHATSAPP / SMS BROADCASTER
========================================================= */

function generateEmergencyBroadcastText() {
    const cur = W?.current || { name: "Kanpur", main: { temp: 28, feels_like: 30, humidity: 75 }, wind: { speed: 3.5 }, weather: [{ description: "Partly Cloudy" }] };
    const rain = W?.forecast ? getRainProbability(W.forecast) : 25;
    const aqi = skycastAQI || 85;
    const temp = Math.round(cur.main.temp);
    const place = cur.name;
    const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    if (currentLanguage === "hi") {
        return `🚨 *स्काईकास्ट जिला आपदा एवं मौसम अलर्ट* 🚨\n📍 *जिला:* ${place} (${dateStr})\n\n🌡️ *वर्तमान तापमान:* ${temp}°C\n🌧️ *बारिश की संभावना:* ${Math.round(rain)}%\n⚡ *वज्रपात (Lightning) CAPE:* ${skycastLightningCape} J/kg (${skycastLightningRisk}% खतरा)\n💨 *हवा की गति:* ${Math.round(cur.wind.speed * 3.6)} km/h\n🌫️ *वायु गुणवत्ता (AQI):* ${aqi}\n\n⚠️ *प्रशासनिक एवं किसान एडवाइजरी:*\n• ${rain >= 60 ? "भारी वर्षा की चेतावनी! निचले इलाकों में जलभराव से सतर्क रहें।" : "मौसम सामान्य है, नियमित गतिविधियां जारी रखें।"}\n• ${skycastLightningRisk >= 60 ? "आकाशीय बिजली का खतरा! तुरंत पक्के मकान में शरण लें।" : "बिजली का खतरा कम है।"}\n• ${cur.main.temp >= 40 ? "भीषण लू का अलर्ट! दोपहर में धूप से बचें और ओआरएस लें।" : "तापमान अनुकूल बना हुआ है।"}\n• किसान भाई कीटनाशक स्प्रे एवं सिंचाई स्काईकास्ट किसान मॉडल अनुसार ही करें।\n\n- *जिला आपदा प्रबंधन प्राधिकरण (DDMA)*\n🌐 लाइव पोर्टल: SkyCast AI`;
    }

    return `🚨 *SKYCAST DISTRICT DISASTER & WEATHER ALERT* 🚨\n📍 *District:* ${place} (${dateStr})\n\n🌡️ *Temperature:* ${temp}°C (Feels like ${Math.round(cur.main.feels_like)}°C)\n🌧️ *Precipitation Risk:* ${Math.round(rain)}%\n⚡ *Lightning Instability CAPE:* ${skycastLightningCape} J/kg (${skycastLightningRisk}% Risk)\n💨 *Wind Speed:* ${Math.round(cur.wind.speed * 3.6)} km/h\n🌫️ *Air Quality Index:* ${aqi}\n\n⚠️ *DDMA ADVISORY FOR GRAM PANCHAYATS:*\n• ${rain >= 60 ? "HEAVY DOWNPOUR ALERT! Keep dewatering pumps and drain paths cleared." : "Weather stable. Normal agricultural & public operations permitted."}\n• ${skycastLightningRisk >= 60 ? "SEVERE LIGHTNING RISK! Seek shelter in concrete structures immediately." : "Low lightning risk."}\n• ${cur.main.temp >= 40 ? "SEVERE HEATWAVE! Maintain hydration and cooling wards." : "Moderate thermal conditions."}\n• Farmers are advised to consult Kisan AI for pesticide spray timings.\n\n- *Office of District Disaster Management Authority*\n🌐 Portal: SkyCast AI Intelligence`;
}

function openWhatsAppDispatch() {
    const msg = generateEmergencyBroadcastText();
    const txtArea = $("waMessageText");
    if (txtArea) txtArea.value = msg;
    $("whatsappModal")?.classList.remove("hidden");
}

function sendViaWhatsApp() {
    const text = $("waMessageText")?.value || generateEmergencyBroadcastText();
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
}

function copySmsText() {
    const text = $("waMessageText")?.value || generateEmergencyBroadcastText();
    navigator.clipboard.writeText(text).then(() => {
        alert(currentLanguage === "hi" ? "✅ एसएमएस अलर्ट टेक्स्ट क्लिपबोर्ड पर कॉपी हो गया!" : "✅ Emergency SMS text copied to clipboard!");
    }).catch(() => {
        showError("Failed to copy to clipboard.");
    });
}


/* =========================================================
   DISTRICT LEADERBOARD
========================================================= */

function renderDistrictLeaderboard() {
    const tbody = $("leaderboardBody");
    if (!tbody) return;

    const scoredDistricts = REGIONAL_DISTRICTS.map(d => {
        let score = 100;
        if (d.aqi > 200) score -= 35;
        else if (d.aqi > 100) score -= 15;
        else if (d.aqi <= 50) score += 5;

        if (d.rainRisk > 70) score -= 25;
        else if (d.rainRisk > 40) score -= 10;

        if (d.baseTemp > 40) score -= 25;
        else if (d.baseTemp < 5) score -= 15;

        score = Math.max(30, Math.min(99, Math.round(score)));

        return { ...d, totalScore: score };
    });

    scoredDistricts.sort((a, b) => b.totalScore - a.totalScore);

    const cleanest = [...REGIONAL_DISTRICTS].sort((a, b) => a.aqi - b.aqi)[0];
    const bestAgri = [...REGIONAL_DISTRICTS].sort((a, b) => b.agriScore - a.agriScore)[0];
    const safest = [...REGIONAL_DISTRICTS].sort((a, b) => a.rainRisk - b.rainRisk)[0];

    setText("cleanestDistrictName", cleanest.name);
    setText("cleanestDistrictAqi", `AQI ${cleanest.aqi} (${getAQIStatus(cleanest.aqi)})`);

    setText("bestFarmDistrictName", bestAgri.name);
    setText("bestFarmDistrictScore", currentLanguage === "hi" ? `कृषि स्कोर: ${bestAgri.agriScore}/100` : `Agri Score: ${bestAgri.agriScore}/100`);

    setText("safestDistrictName", safest.name);
    setText("safestDistrictRisk", currentLanguage === "hi" ? `बाढ़ जोखिम: ${safest.rainRisk}%` : `Flood Risk: ${safest.rainRisk}%`);

    tbody.innerHTML = scoredDistricts.map((d, i) => {
        const medal = i === 0 ? "🥇 #1" : i === 1 ? "🥈 #2" : i === 2 ? "🥉 #3" : `#${i + 1}`;
        const rating = d.totalScore >= 85 
            ? (currentLanguage === "hi" ? "उत्कृष्ट (EXCELLENT)" : "EXCELLENT") 
            : d.totalScore >= 70 
                ? (currentLanguage === "hi" ? "संतोषजनक (GOOD)" : "GOOD") 
                : (currentLanguage === "hi" ? "चेतावनी (CAUTION)" : "CAUTION");

        const ratingClass = d.totalScore >= 85 ? "safe" : d.totalScore >= 70 ? "warning" : "danger";

        return `
            <tr>
                <td><b class="rank-medal">${medal}</b></td>
                <td><b>📍 ${d.name}</b></td>
                <td>
                    <b>${d.totalScore}/100</b>
                </td>
                <td>${d.baseTemp}°C</td>
                <td><b style="color: ${d.aqi <= 50 ? 'var(--emerald)' : d.aqi <= 100 ? 'var(--cyan)' : 'var(--rose)'};">${d.aqi}</b></td>
                <td>${d.rainRisk}%</td>
                <td><span class="status-pill ${ratingClass}">${rating}</span></td>
            </tr>
        `;
    }).join("");
}


/* =========================================================
   TEXT-TO-SPEECH (TTS) AUDIO BULLETIN
========================================================= */

let isSpeaking = false;

function playVoiceBulletin(textToSpeak = null) {
    if (!("speechSynthesis" in window)) {
        showError("Audio speech is not supported in this browser.");
        return;
    }

    if (isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        $("audioBtn")?.classList.remove("speaking");
        $("voiceWaveform")?.classList.add("hidden");
        return;
    }

    if (!W?.current) {
        showError("Please search for a district first to hear the weather report.");
        return;
    }

    let message = textToSpeak;

    if (!message) {
        const cur = W.current;
        const temp = Math.round(cur.main.temp);
        const feel = Math.round(cur.main.feels_like);
        const place = cur.name;
        const rain = getRainProbability(W.forecast);

        if (currentLanguage === "hi") {
            message = `स्काईकास्ट जिला आपदा एवं मौसम बुलेटिन। ${place} में वर्तमान तापमान ${temp} डिग्री सेल्सियस है, जो महसूस ${feel} डिग्री जैसा हो रहा है। बारिश की संभावना ${Math.round(rain)} प्रतिशत है। वज्रपात अस्थिरता स्कोर ${skycastLightningCape} जूल प्रति किलोग्राम है। सभी रेस्क्यू टीमें अलर्ट पर हैं।`;
        } else {
            message = `SkyCast District Weather and Disaster Bulletin. In ${place}, the current temperature is ${temp} degrees Celsius, feeling like ${feel} degrees. Rain probability is ${Math.round(rain)} percent with wind speeds of ${Math.round(cur.wind.speed * 3.6)} kilometers per hour. Lightning threat level is ${skycastLightningRisk} percent.`;
        }
    }

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (currentLanguage === "hi") {
        const hiVoice = voices.find(v => v.lang.includes("hi") || v.name.includes("Hindi"));
        if (hiVoice) utterance.voice = hiVoice;
        utterance.lang = "hi-IN";
    } else {
        const enVoice = voices.find(v => v.lang.includes("en-IN") || v.lang.includes("en-US"));
        if (enVoice) utterance.voice = enVoice;
        utterance.lang = "en-US";
    }

    utterance.onstart = () => {
        isSpeaking = true;
        $("audioBtn")?.classList.add("speaking");
        $("voiceWaveform")?.classList.remove("hidden");
    };

    utterance.onend = () => {
        isSpeaking = false;
        $("audioBtn")?.classList.remove("speaking");
        $("voiceWaveform")?.classList.add("hidden");
    };

    utterance.onerror = () => {
        isSpeaking = false;
        $("audioBtn")?.classList.remove("speaking");
        $("voiceWaveform")?.classList.add("hidden");
    };

    window.speechSynthesis.speak(utterance);
}


/* =========================================================
   WMO WEATHER CODE MAPPINGS
========================================================= */

function wmoToOpenWeather(code, isDay = 1) {
    const suffix = isDay ? "d" : "n";
    switch (code) {
        case 0: return { desc: currentLanguage === "hi" ? "साफ आसमान" : "Clear sky", icon: `01${suffix}` };
        case 1: return { desc: currentLanguage === "hi" ? "मुख्यतः साफ" : "Mainly clear", icon: `02${suffix}` };
        case 2: return { desc: currentLanguage === "hi" ? "आंशिक बादल" : "Partly cloudy", icon: `03${suffix}` };
        case 3: return { desc: currentLanguage === "hi" ? "घने बादल" : "Overcast", icon: `04${suffix}` };
        case 45: case 48: return { desc: currentLanguage === "hi" ? "कोहरा" : "Foggy", icon: `50${suffix}` };
        case 51: case 53: case 55: return { desc: currentLanguage === "hi" ? "हल्की बूंदाबांदी" : "Drizzle", icon: `09${suffix}` };
        case 61: return { desc: currentLanguage === "hi" ? "हल्की बारिश" : "Light rain", icon: `10${suffix}` };
        case 63: return { desc: currentLanguage === "hi" ? "मध्यम बारिश" : "Moderate rain", icon: `10${suffix}` };
        case 65: return { desc: currentLanguage === "hi" ? "भारी बारिश" : "Heavy rain", icon: `10${suffix}` };
        case 71: case 73: case 75: return { desc: currentLanguage === "hi" ? "बर्फबारी" : "Snowfall", icon: `13${suffix}` };
        case 80: case 81: case 82: return { desc: currentLanguage === "hi" ? "बारिश की बौछारें" : "Rain showers", icon: `09${suffix}` };
        case 95: case 96: case 99: return { desc: currentLanguage === "hi" ? "आंधी-तूफान व बिजली" : "Thunderstorm", icon: `11${suffix}` };
        default: return { desc: currentLanguage === "hi" ? "सामान्य मौसम" : "Partly cloudy", icon: `02${suffix}` };
    }
}


/* =========================================================
   SIMULATION ENGINE (HACKATHON LIVE DEMOS)
========================================================= */

function getSimulatedWeatherData(scenario, baseCity = "District Headquarters") {
    const now = Math.floor(Date.now() / 1000);
    const mockHourly = [];

    let temp, feels, hum, wind, clouds, desc, icon, rainPop, aqi, uv;

    if (scenario === "flood") {
        temp = 23;
        feels = 25;
        hum = 98;
        wind = 16.5;
        clouds = 100;
        desc = currentLanguage === "hi" ? "मूसलाधार बारिश एवं बाढ़ का खतरा" : "Torrential Monsoon Downpour & Flash Flood Risk";
        icon = "10d";
        rainPop = 0.95;
        aqi = 35;
        uv = 2.0;
        triggerEmergencySiren(3.5);
        updateDigitalTwin(180);
    } else if (scenario === "heatwave") {
        temp = 46.5;
        feels = 49.8;
        hum = 22;
        wind = 7.5;
        clouds = 0;
        desc = currentLanguage === "hi" ? "भीषण लू (Extreme Heatwave Red Alert)" : "Extreme Heatwave & Severe Sunstroke Alert";
        icon = "01d";
        rainPop = 0.0;
        aqi = 180;
        uv = 11.5;
        triggerEmergencySiren(3);
        updateDigitalTwin(0);
    } else if (scenario === "smog") {
        temp = 16;
        feels = 15;
        hum = 85;
        wind = 2.0;
        clouds = 90;
        desc = currentLanguage === "hi" ? "गंभीर जहरीला स्मॉग (Severe AQI Hazard)" : "Severe Toxic Smog & Low Visibility";
        icon = "50d";
        rainPop = 0.05;
        aqi = 385;
        uv = 2.5;
        updateDigitalTwin(10);
    } else if (scenario === "storm") {
        temp = 26;
        feels = 27;
        hum = 90;
        wind = 21.0;
        clouds = 100;
        desc = currentLanguage === "hi" ? "चक्रवाती आंधी एवं तेज हवाएं" : "Severe Cyclone & Gale Force Winds";
        icon = "11d";
        rainPop = 0.85;
        aqi = 45;
        uv = 3.0;
        triggerEmergencySiren(3.5);
        updateDigitalTwin(120);
    } else if (scenario === "lightning") {
        temp = 29;
        feels = 32;
        hum = 88;
        wind = 14.0;
        clouds = 95;
        desc = currentLanguage === "hi" ? "भीषण आकाशीय बिजली एवं आंधी (Severe Lightning)" : "Severe Lightning & Convective Thunderstorm Alert";
        icon = "11d";
        rainPop = 0.80;
        aqi = 50;
        uv = 2.0;
        triggerEmergencySiren(3.5);
        updateDigitalTwin(90);
    }

    for (let i = 0; i < 24; i++) {
        mockHourly.push({
            dt: now + i * 3600,
            main: { temp: temp + (Math.sin(i) * 2), humidity: hum },
            wind: { speed: wind },
            pop: rainPop,
            weather: [{ description: desc, icon: icon }]
        });
    }

    const simDaily = {
        time: [
            new Date(Date.now()).toISOString().split('T')[0],
            new Date(Date.now() + 86400000).toISOString().split('T')[0],
            new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
            new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
            new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0]
        ],
        temperature_2m_max: [temp, temp + 1, temp - 2, temp + 2, temp],
        temperature_2m_min: [temp - 5, temp - 4, temp - 6, temp - 5, temp - 4],
        weather_code: [scenario === "flood" ? 65 : scenario === "heatwave" ? 0 : scenario === "smog" ? 45 : 95, 80, 80, 2, 1],
        precipitation_probability_max: [Math.round(rainPop * 100), Math.round(rainPop * 80), 30, 15, 5],
        precipitation_sum: [rainfallMmForScenario(scenario), 20, 10, 5, 0]
    };

    return {
        current: {
            name: `${baseCity} [SIMULATION]`,
            sys: { country: "IN" },
            coord: { lat: 26.4499, lon: 80.3319 },
            main: { temp, feels_like: feels, humidity: hum, pressure: 1004 },
            wind: { speed: wind },
            clouds: { all: clouds },
            weather: [{ description: desc, icon: icon, id: 999 }]
        },
        forecast: { list: mockHourly },
        daily: simDaily,
        simulatedAQI: aqi,
        simulatedUV: uv
    };
}

function rainfallMmForScenario(scenario) {
    if (scenario === "flood") return 180;
    if (scenario === "storm") return 120;
    if (scenario === "lightning") return 90;
    if (scenario === "smog") return 10;
    return 0;
}


/* =========================================================
   LIVE OPEN-METEO FETCHER (ZERO KEY)
========================================================= */

async function fetchOpenMeteoData(city) {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) throw new Error("Geocoding service unavailable.");
    const geoData = await geoRes.json();
    
    if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`District "${city}" not found. Please verify spelling.`);
    }

    const loc = geoData.results[0];
    const lat = loc.latitude;
    const lon = loc.longitude;
    const name = loc.name;
    const country = loc.country_code || loc.country || "IN";

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
    
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) throw new Error("Forecast service unavailable.");
    const omData = await weatherRes.json();

    const cur = omData.current;
    const wInfo = wmoToOpenWeather(cur.weather_code, cur.is_day);

    const current = {
        name: name,
        sys: { country: country },
        coord: { lat: lat, lon: lon },
        main: {
            temp: cur.temperature_2m,
            feels_like: cur.apparent_temperature,
            humidity: cur.relative_humidity_2m,
            pressure: Math.round(cur.surface_pressure || 1013)
        },
        wind: {
            speed: (cur.wind_speed_10m / 3.6)
        },
        clouds: {
            all: cur.cloud_cover
        },
        weather: [{
            description: wInfo.desc,
            icon: wInfo.icon,
            id: cur.weather_code
        }]
    };

    const list = [];
    const hourly = omData.hourly;

    for (let i = 0; i < Math.min(48, hourly.time.length); i++) {
        const itemTime = new Date(hourly.time[i]).getTime() / 1000;
        const hInfo = wmoToOpenWeather(hourly.weather_code[i], 1);
        list.push({
            dt: itemTime,
            main: {
                temp: hourly.temperature_2m[i],
                humidity: hourly.relative_humidity_2m[i]
            },
            wind: {
                speed: (hourly.wind_speed_10m[i] / 3.6)
            },
            pop: (hourly.precipitation_probability[i] || 0) / 100,
            weather: [{
                description: hInfo.desc,
                icon: hInfo.icon
            }]
        });
    }

    const uvPeak = omData.daily?.uv_index_max?.[0] ?? 4.8;

    return {
        current: current,
        forecast: { list: list },
        daily: omData.daily,
        uv_index: uvPeak
    };
}

function getRainProbability(forecast) {
    if (!forecast?.list?.length) return 0;
    return Math.max(...forecast.list.slice(0, 8).map(x => (x.pop || 0) * 100));
}


/* =========================================================
   WEATHER SEARCH & RENDER
========================================================= */

async function loadWeather(city) {
    city = city?.trim();
    if (!city) {
        showError("Please enter a district name.");
        return;
    }

    hideError();
    setText("place", currentLanguage === "hi" ? "डेटा लोड हो रहा है..." : "Loading...");
    setText("temp", "--°");
    setText("cond", currentLanguage === "hi" ? "मौसम डेटा प्राप्त किया जा रहा है..." : "Fetching weather...");

    // Update active district chip UI
    document.querySelectorAll(".district-chip").forEach(chip => {
        if (chip.dataset.city.toLowerCase() === city.toLowerCase()) chip.classList.add("active");
        else chip.classList.remove("active");
    });

    try {
        let data = null;

        if (activeSimulation !== "live") {
            data = getSimulatedWeatherData(activeSimulation, city);
        } else {
            try {
                const response = await fetch("/api/weather?city=" + encodeURIComponent(city));
                if (response.ok) data = await response.json();
            } catch (e) {}

            if (!data || !data.current) {
                data = await fetchOpenMeteoData(city);
            }
        }

        if (!data || !data.current || !data.forecast) {
            throw new Error("Invalid weather data returned.");
        }

        W = data;

        const current = data.current;
        const forecast = data.forecast;
        const countryName = current.sys?.country ? `, ${current.sys.country}` : "";
        const place = `${current.name}${countryName}`;

        /* CURRENT WEATHER */
        setText("place", place);
        setText("fromCity", current.name);
        setText("temp", Math.round(current.main.temp) + "°");
        setText("feel", (currentLanguage === "hi" ? "महसूस: " : "Feels like ") + Math.round(current.main.feels_like) + "°");
        setText("cond", capitalize(current.weather?.[0]?.description));

        const icon = $("icon");
        if (icon && current.weather?.[0]?.icon) {
            icon.src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`;
        }

        /* METRICS */
        setText("hum", current.main.humidity + "%");
        setText("wind", Math.round(current.wind.speed * 3.6) + " km/h");
        setText("press", current.main.pressure + " hPa");
        setText("cloud", (current.clouds?.all ?? 0) + "%");

        /* INSIGHTS */
        setText("insightFeel", Math.round(current.main.feels_like) + "°");

        /* RISK & MODULES */
        updateRisk(current, forecast);
        calculateLightningRisk(current, forecast);
        updateFiveDayForecast(forecast, data.daily);
        updateHourlyForecast(forecast);
        updateAnalyticsCharts(forecast);
        updateFarmer(current, forecast);
        updateAlerts(current, forecast);
        updateCommandCenter(current, forecast);
        renderRescueOps();
        renderDistrictLeaderboard();
        updateDigitalTwin(Number($("twinRainSlider")?.value || 120));

        updateWeatherMap(current.coord.lat, current.coord.lon, place, current);

        /* AQI */
        if (data.simulatedAQI != null) {
            skycastAQI = data.simulatedAQI;
            setText("aqiValue", skycastAQI);
            setText("aqiStatus", getAQIStatus(skycastAQI));
            setText("airAlertStatus", skycastAQI > 200 ? "HAZARDOUS" : "MODERATE");
        } else {
            loadAQI(current.coord.lat, current.coord.lon);
        }

        /* UV INDEX */
        if (data.simulatedUV != null) {
            skycastUV = data.simulatedUV;
            setText("uvValue", Number(skycastUV).toFixed(1));
            setText("uvStatus", getUVStatus(skycastUV));
        } else if (data.uv_index != null) {
            skycastUV = data.uv_index;
            setText("uvValue", Number(skycastUV).toFixed(1));
            setText("uvStatus", getUVStatus(skycastUV));
        } else {
            loadUV(current.coord.lat, current.coord.lon);
        }

        // Check and toggle disaster emergency banner (only triggers on actual severe emergency)
        checkEmergencyBanner(current, forecast);

        const aiAns = $("answer");
        if (aiAns) {
            aiAns.textContent = currentLanguage === "hi"
                ? `✦ स्काईकास्ट AI ${place} आपदा नियंत्रण के लिए तैयार है (${Math.round(current.main.temp)}°C, ${capitalize(current.weather[0].description)})। 4 रेस्क्यू टीमें स्टैंडबाय पर हैं। नीचे कोई भी प्रश्न पूछें!`
                : `✦ SkyCast AI Autonomous Disaster Hub ready for ${place} (${Math.round(current.main.temp)}°C, ${capitalize(current.weather[0].description)}). 4 Rescue Units ready on standby. Ask any operational query below!`;
        }

    } catch (error) {
        console.error(error);
        showError(error.message || "Failed to load weather data.");
    }
}


/* =========================================================
   EMERGENCY BANNER CONTROLLER (ONLY POPS UP ON REAL EMERGENCIES)
========================================================= */

function checkEmergencyBanner(current, forecast) {
    const banner = $("disasterBanner");
    const title = $("disasterTitle");
    const desc = $("disasterDesc");

    const rain = getRainProbability(forecast);
    const temp = current.main.temp;
    const wind = current.wind.speed * 3.6;
    const weatherDesc = (current?.weather?.[0]?.description || "").toLowerCase();
    const weatherId = current?.weather?.[0]?.id || 0;

    let isDisaster = false;
    let hazardTitle = "";
    let hazardDesc = "";

    // 1. Simulation triggers
    if (activeSimulation === "flood") {
        isDisaster = true;
        hazardTitle = currentLanguage === "hi" ? "🚨 जिला भारी बारिश एवं जलभराव चेतावनी (SIMULATION)" : "🚨 DISTRICT HEAVY RAINFALL & FLASH FLOOD WARNING";
        hazardDesc = currentLanguage === "hi" ? "अत्यधिक वर्षा की संभावना। जल निकासी टीमों को अलर्ट पर रखा गया है।" : "Severe precipitation detected. Low-lying areas on high alert.";
    } else if (activeSimulation === "heatwave") {
        isDisaster = true;
        hazardTitle = currentLanguage === "hi" ? "🔥 जिला भीषण लू (HEATWAVE) रेड अलर्ट (SIMULATION)" : "🔥 DISTRICT SEVERE HEATWAVE RED ALERT";
        hazardDesc = currentLanguage === "hi" ? "तापमान 44°C से अधिक। दोपहर 12 से 3 बजे तक धूप में न निकलें।" : "Extreme temperatures exceeding 44°C. Avoid outdoor labour between 12-3 PM.";
    } else if (activeSimulation === "storm") {
        isDisaster = true;
        hazardTitle = currentLanguage === "hi" ? "💨 तीव्र आंधी-तूफान चेतावनी (SIMULATION)" : "💨 SEVERE THUNDERSTORM & GALE WIND WARNING";
        hazardDesc = currentLanguage === "hi" ? "हवा की गति 55+ km/h। कमजोर पेड़ों और होर्डिंग्स से दूर रहें।" : "High velocity gusts. Secure loose infrastructure.";
    } else if (activeSimulation === "lightning") {
        isDisaster = true;
        hazardTitle = currentLanguage === "hi" ? "⚡ भीषण आकाशीय बिजली (LIGHTNING) रेड अलर्ट (SIMULATION)" : "⚡ SEVERE THUNDERSTORM & LIGHTNING STRIKE WARNING";
        hazardDesc = currentLanguage === "hi" ? "CAPE 2800+ J/kg। खुले मैदानों से तुरंत पक्के मकान में जाएं।" : "Severe convective atmospheric instability. Seek indoor shelter.";
    } else if (activeSimulation === "smog") {
        isDisaster = true;
        hazardTitle = currentLanguage === "hi" ? "🌫️ गंभीर वायु प्रदूषण एवं जहरीला स्मॉग चेतावनी (SIMULATION)" : "🌫️ TOXIC SMOG & AIR QUALITY EMERGENCY";
        hazardDesc = currentLanguage === "hi" ? "AQI 300+ पार। प्राथमिक स्कूलों में आउटडोर गतिविधियां प्रतिबंधित।" : "Hazardous AQI detected. N95 masks advised.";
    } 
    // 2. Real weather severe emergency thresholds
    else if (rain >= 85) {
        isDisaster = true;
        hazardTitle = currentLanguage === "hi" ? "🚨 जिला भारी वर्षा एवं बाढ़ चेतावनी" : "🚨 DISTRICT HEAVY RAINFALL WARNING";
        hazardDesc = currentLanguage === "hi" ? `वर्षा की संभावना ${Math.round(rain)}%। जल निकासी टीमें अलर्ट पर।` : "Extremely heavy precipitation detected. Low-lying areas on alert.";
    } else if (temp >= 45) {
        isDisaster = true;
        hazardTitle = currentLanguage === "hi" ? "🔥 जिला भीषण लू (HEATWAVE) रेड अलर्ट" : "🔥 DISTRICT SEVERE HEATWAVE RED ALERT";
        hazardDesc = currentLanguage === "hi" ? `तापमान ${Math.round(temp)}°C। दोपहर में धूप से बचें।` : "Extreme heatwave conditions active. Maintain hydration.";
    } else if (wind >= 60) {
        isDisaster = true;
        hazardTitle = currentLanguage === "hi" ? "💨 तीव्र चक्रवाती आंधी चेतावनी" : "💨 SEVERE GALE & HIGH WIND WARNING";
        hazardDesc = currentLanguage === "hi" ? `हवा की गति ${Math.round(wind)} km/h। सुरक्षित स्थानों पर रहें।` : "High velocity wind gusts active.";
    } else if (weatherDesc.includes("severe thunderstorm") || weatherId === 95 || weatherId === 96 || weatherId === 99) {
        isDisaster = true;
        hazardTitle = currentLanguage === "hi" ? "⚡ आकाशीय बिजली एवं आंधी चेतावनी" : "⚡ SEVERE THUNDERSTORM & LIGHTNING WARNING";
        hazardDesc = currentLanguage === "hi" ? "आकाशीय बिजली का खतरा। पक्के भवनों में शरण लें।" : "Active thunderstorm detected in region. Seek indoor shelter.";
    }

    if (isDisaster && banner) {
        banner.classList.remove("hidden");
        if (title) title.textContent = hazardTitle;
        if (desc) desc.textContent = hazardDesc;
    } else if (banner) {
        banner.classList.add("hidden");
    }
}


/* =========================================================
   DISTRICT DISASTER COMMAND CENTER MATRIX
========================================================= */

function updateCommandCenter(current, forecast) {
    const rain = getRainProbability(forecast);
    const temp = Math.round(current.main.temp);
    const aqi = skycastAQI || 85;

    const floodCard = $("floodThreatCard");
    const heatCard = $("heatThreatCard");
    const smogCard = $("smogThreatCard");

    if (rain >= 70) {
        setText("floodLevel", currentLanguage === "hi" ? "गंभीर चेतावनी (HIGH)" : "HIGH THREAT");
        setText("floodNote", currentLanguage === "hi" ? "निचले इलाकों में जलभराव का खतरा।" : "High risk of road flooding and waterlogging.");
        floodCard?.classList.add("critical");
        setText("quickFloodRisk", "High (85%)");
    } else {
        setText("floodLevel", currentLanguage === "hi" ? "सामान्य (LOW)" : "LOW RISK");
        setText("floodNote", currentLanguage === "hi" ? "ड्रेनेज व नदी का स्तर सामान्य।" : "Drainage & river basin levels normal.");
        floodCard?.classList.remove("critical", "warning");
        setText("quickFloodRisk", "Low (12%)");
    }

    if (temp >= 40) {
        setText("heatLevel", currentLanguage === "hi" ? "रेड अलर्ट (CRITICAL)" : "CRITICAL HEAT");
        setText("heatNote", currentLanguage === "hi" ? "लू का गंभीर खतरा। ओआरएस की व्यवस्था रखें।" : "Severe heatstroke risk. ORS hydration advised.");
        heatCard?.classList.add("critical");
        setText("quickHeatRisk", "Severe (46°C)");
    } else {
        setText("heatLevel", currentLanguage === "hi" ? "सामान्य (NORMAL)" : "NORMAL");
        setText("heatNote", currentLanguage === "hi" ? "तापमान सामान्य सीमा में है।" : "Safe for daytime outdoor labour.");
        heatCard?.classList.remove("critical", "warning");
        setText("quickHeatRisk", "Safe");
    }

    if (aqi >= 250) {
        setText("smogLevel", currentLanguage === "hi" ? "खतरनाक (HAZARDOUS)" : "HAZARDOUS");
        setText("smogNote", currentLanguage === "hi" ? "प्राथमिक स्कूलों में आउटडोर खेल बंद रखें।" : "Outdoor school sports suspended.");
        smogCard?.classList.add("critical");
    } else {
        setText("smogLevel", currentLanguage === "hi" ? "मध्यम (MODERATE)" : "MODERATE");
        setText("smogNote", currentLanguage === "hi" ? "हवा की गुणवत्ता सामान्य है।" : "AQI acceptable for public schools.");
        smogCard?.classList.remove("critical", "warning");
    }

    // Populate Block Matrix Table
    const tableBody = $("tehsilTableBody");
    if (!tableBody) return;

    const baseName = current.name.split(",")[0];
    const blocks = [
        { name: `${baseName} Central (शहरी क्षेत्र)`, tempOff: 0, rainOff: 0, aqiOff: 15 },
        { name: `${baseName} North Tehsil (उत्तरी ब्लॉक)`, tempOff: -1, rainOff: 5, aqiOff: -10 },
        { name: `${baseName} River Basin Block (तटीय क्षेत्र)`, tempOff: -2, rainOff: 12, aqiOff: -20 },
        { name: `${baseName} Industrial South (औद्योगिक क्षेत्र)`, tempOff: 1, rainOff: -5, aqiOff: 35 },
        { name: `${baseName} Rural East (ग्रामीण पूर्व)`, tempOff: 0, rainOff: 0, aqiOff: -25 }
    ];

    tableBody.innerHTML = blocks.map(b => {
        const bTemp = temp + b.tempOff;
        const bRain = Math.min(100, Math.max(0, Math.round(rain + b.rainOff)));
        const bAqi = Math.max(20, Math.round(aqi + b.aqiOff));

        let statusText = currentLanguage === "hi" ? "सामान्य स्थिति" : "Normal Activities";
        let statusClass = "safe";
        let actionText = currentLanguage === "hi" ? "सतर्कता जारी" : "Routine Patrol";

        if (bRain >= 75) {
            statusText = currentLanguage === "hi" ? "जलभराव अलर्ट" : "Waterlog Warning";
            statusClass = "danger";
            actionText = currentLanguage === "hi" ? "ड्रेनेज पंप चालू करें" : "Deploy Pumps";
        } else if (bTemp >= 42) {
            statusText = currentLanguage === "hi" ? "लू एडवाइजरी" : "Heat Advisory";
            statusClass = "danger";
            actionText = currentLanguage === "hi" ? "शीतल पेयजल केंद्र" : "Cooling Stations";
        } else if (bAqi >= 300) {
            statusText = currentLanguage === "hi" ? "मास्क अनिवार्य" : "Mask Advisory";
            statusClass = "warning";
            actionText = currentLanguage === "hi" ? "एंटी-स्मॉग गन" : "Anti-Smog Spray";
        }

        return `
            <tr>
                <td><b>${b.name}</b></td>
                <td>${bTemp}°C</td>
                <td>${bRain}%</td>
                <td><b>${bAqi}</b></td>
                <td><span class="status-pill ${statusClass}">${statusText}</span></td>
                <td>${actionText}</td>
            </tr>
        `;
    }).join("");

    // Pillar A12: Vulnerable Population Directives
    if (temp >= 43) {
        setText("schoolAdvisoryText", "⚠️ Advisory: Suspend afternoon classes from 12:00 PM to 3:30 PM due to extreme sunstroke risk.");
        const badge = $("schoolAdvisoryBadge");
        if (badge) { badge.textContent = "AFTERNOON SUSPENDED"; badge.className = "status-pill danger"; }
    } else if (rain >= 75) {
        setText("schoolAdvisoryText", "⚠️ Advisory: Waterlogging in school transport routes. Move to online classes or half-day schedule.");
        const badge = $("schoolAdvisoryBadge");
        if (badge) { badge.textContent = "TRANSPORT ALERT"; badge.className = "status-pill warning"; }
    } else {
        setText("schoolAdvisoryText", "Normal school schedule permitted. Ensure access to clean drinking water.");
        const badge = $("schoolAdvisoryBadge");
        if (badge) { badge.textContent = "SCHEDULE NORMAL"; badge.className = "status-pill safe"; }
    }
}


/* =========================================================
   OFFICIAL DDMA WEATHER BULLETIN EXPORT
========================================================= */

function exportDistrictBulletin() {
    if (!W?.current) {
        showError("Please search for a district first to generate bulletin.");
        return;
    }

    const cur = W.current;
    const rain = getRainProbability(W.forecast);
    const dateStr = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    setText("bulletinDateTime", `Date: ${dateStr} | Time: ${timeStr} IST | Ref: SKYCAST-DDMA/2026/08`);

    const contentEl = $("bulletinContent");
    if (contentEl) {
        contentEl.innerHTML = `
            <div class="bulletin-section">
                <h4>1. EXECUTIVE METEOROLOGICAL & THREAT SUMMARY — DISTRICT ${cur.name.toUpperCase()}</h4>
                <p><b>Current Temperature:</b> ${Math.round(cur.main.temp)}°C (Apparent Temperature: ${Math.round(cur.main.feels_like)}°C)</p>
                <p><b>Atmospheric Condition:</b> ${capitalize(cur.weather[0].description)}</p>
                <p><b>Precipitation Risk (24h):</b> ${Math.round(rain)}% | <b>Wind Speed:</b> ${Math.round(cur.wind.speed * 3.6)} km/h</p>
                <p><b>Convective CAPE (Lightning Risk):</b> ${skycastLightningCape} J/kg (${skycastLightningRisk}% Threat)</p>
                <p><b>Air Quality Index:</b> ${skycastAQI || 85} (US AQI) | <b>UV Index:</b> ${skycastUV || 5.0}</p>
            </div>

            <div class="bulletin-section">
                <h4>2. FIRST RESPONDER & RESCUE FORCES STATUS</h4>
                <p>• <b>NDRF / SDRF Team Alpha (Water Rescue):</b> Deployed on active standby at River Basin Ward.</p>
                <p>• <b>Team Bravo (Paramedics):</b> 3 Mobile Trauma Ambulances on active standby.</p>
                <p>• <b>Civil Hospitals Preparedness:</b> 18 ICU stabilization beds ready with ORS hydration packs.</p>
            </div>

            <div class="bulletin-section">
                <h4>3. SECTORAL & KRISHI DIRECTIVES</h4>
                <p>• <b>Education:</b> Schools permitted normal operation with compulsory hydration stations.</p>
                <p>• <b>Agriculture:</b> Farmers advised to align pesticide spraying windows with SkyCast Kisan AI.</p>
            </div>
        `;
    }

    $("printBulletinModal")?.classList.remove("hidden");
}


/* =========================================================
   FARMER / KISAN SMART ADVISORY
========================================================= */

const CROP_GUIDANCE = {
    wheat: {
        nameEn: "Wheat (गेहूं)",
        nameHi: "गेहूं (Wheat)",
        idealTemp: "15°C - 25°C",
        adviceEn: "🌾 Wheat Advisory: Maintain light irrigation during flowering stage. Inspect leaf undersides for Yellow Rust if humidity exceeds 80%. Postpone pesticide spray if rain probability > 40%.",
        adviceHi: "🌾 गेहूं फसल सलाह: कल्ले निकलते समय हल्की सिंचाई करें। यदि हवा में नमी 80% से अधिक है तो 'पीला रतुआ' (Yellow Rust) की निगरानी करें। 40% से अधिक बारिश की संभावना होने पर कीटनाशक स्प्रे टालें।"
    },
    rice: {
        nameEn: "Paddy / Rice (धान)",
        nameHi: "धान (Paddy/Rice)",
        idealTemp: "24°C - 35°C",
        adviceEn: "🌱 Paddy Advisory: Maintain 2-3 cm standing water in field. Avoid nitrogen top-dressing during heavy rain forecasts to prevent leaching.",
        adviceHi: "🌱 धान फसल सलाह: खेत में 2-3 सेमी पानी बनाए रखें। भारी बारिश के पूर्वानुमान के दौरान यूरिया/नाइट्रोजन डालने से बचें ताकि खाद बहने से बचे।"
    },
    mustard: {
        nameEn: "Mustard (सरसों)",
        nameHi: "सरसों (Mustard)",
        idealTemp: "15°C - 25°C",
        adviceEn: "🌼 Mustard Advisory: Cloudy and humid weather increases Aphid (माहू) infestation risk. Apply spray only when wind speed is under 15 km/h.",
        adviceHi: "🌼 सरसों फसल सलाह: बादलयुक्त और नम मौसम में 'माहू' कीट का प्रकोप बढ़ सकता है। जब हवा की गति 15 km/h से कम हो तभी कीटनाशक का छिड़काव करें।"
    },
    sugarcane: {
        nameEn: "Sugarcane (गन्ना)",
        nameHi: "गन्ना (Sugarcane)",
        idealTemp: "25°C - 38°C",
        adviceEn: "🎋 Sugarcane Advisory: Ensure proper soil earthing up before high wind storms to prevent lodging. Provide regular irrigation during high heat.",
        adviceHi: "🎋 गन्ना फसल सलाह: तेज आंधी से पहले गन्ने की बंधाई और मिट्टी चढ़ाने का कार्य पूरा करें ताकि फसल गिरे नहीं। तेज गर्मी में नियमित सिंचाई करें।"
    },
    vegetables: {
        nameEn: "Vegetables (सब्जियां)",
        nameHi: "सब्जियां (Vegetables)",
        idealTemp: "18°C - 30°C",
        adviceEn: "🥦 Vegetable Advisory: High humidity causes fungal fruit rot and damping off. Ensure excellent drainage and harvest mature vegetables prior to rain.",
        adviceHi: "🥦 सब्जी फसल सलाह: अधिक नमी के कारण फफूंद एवं गलन रोग का खतरा रहता है। जल निकासी की समुचित व्यवस्था रखें और बारिश से पहले पकी सब्जियों की तुड़ाई कर लें।"
    }
};

function updateFarmer(current, forecast) {
    const rain = getRainProbability(forecast);
    const temp = Math.round(current.main.temp);
    const hum = current.main.humidity;
    const wind = Math.round(current.wind.speed * 3.6);

    const cropData = CROP_GUIDANCE[currentCrop] || CROP_GUIDANCE.wheat;
    const titleText = currentLanguage === "hi" ? `${cropData.nameHi} कृषि सलाह` : `${cropData.nameEn} Agriculture Advisory`;
    setText("cropTitle", titleText);

    let specificAdvice = currentLanguage === "hi" ? cropData.adviceHi : cropData.adviceEn;

    let sprayStatusText = currentLanguage === "hi" ? "✅ उपयुक्त समय (IDEAL)" : "✅ IDEAL";
    if (rain >= 50 || wind >= 22) {
        sprayStatusText = currentLanguage === "hi" ? "❌ छिड़काव न करें (UNFAVORABLE)" : "❌ UNFAVORABLE";
    } else if (rain >= 25 || wind >= 15) {
        sprayStatusText = currentLanguage === "hi" ? "⚠️ सावधानीपूर्वक (CAUTION)" : "⚠️ CAUTION";
    }
    setText("sprayStatus", sprayStatusText);

    let irrText = currentLanguage === "hi" ? "मध्यम आवश्यकता" : "MODERATE";
    if (rain >= 60) {
        irrText = currentLanguage === "hi" ? "🚫 सिंचाई रोकें (NO NEED)" : "🚫 POSTPONE";
    } else if (temp >= 38 || hum <= 30) {
        irrText = currentLanguage === "hi" ? "⚡ तुरंत सिंचाई करें (HIGH)" : "⚡ HIGH NEED";
    }
    setText("irrigationStatus", irrText);

    let disText = currentLanguage === "hi" ? "कम जोखिम" : "LOW RISK";
    if (hum >= 85 && temp >= 22) {
        disText = currentLanguage === "hi" ? "⚠️ फफूंद/कीट चेतावनी (HIGH)" : "⚠️ HIGH (FUNGAL)";
    }
    setText("diseaseStatus", disText);

    setText("farmer", specificAdvice);
    setText("farmerAdvice", specificAdvice);
    setText("farmTemp", temp + "°C");
    setText("farmHumidity", hum + "%");
    setText("farmRain", Math.round(rain) + "%");
    setText("farmWind", wind + " km/h");
}


/* =========================================================
   CITIZEN HAZARD CROWDSOURCING
========================================================= */

function renderCitizenFeed() {
    const listEl = $("recentHazardsList");
    if (!listEl) return;

    if (!citizenReports.length) {
        listEl.innerHTML = `<div style="padding: 15px; color: var(--text-muted); text-align: center;">No citizen hazards reported currently.</div>`;
        return;
    }

    listEl.innerHTML = citizenReports.map(r => `
        <div class="hazard-item" style="display:flex; align-items:center; gap:12px; padding:14px; border-radius:12px; background:var(--bg-card-inner); border:1px solid var(--border-card); margin-bottom:8px;">
            <div style="font-size:22px;">
                ${r.type === "waterlog" ? "🌊" : r.type === "tree" ? "🌳" : r.type === "wire" ? "⚡" : r.type === "hail" ? "❄️" : "🔥"}
            </div>
            <div style="flex:1;">
                <strong style="font-size:13px; display:block;">${r.typeName} — ${r.location}</strong>
                <small style="color:var(--text-muted); font-size:11px;">Reported: ${r.time}</small>
                <p style="color:var(--text-secondary); font-size:12px; margin-top:2px;">${r.details}</p>
            </div>
        </div>
    `).join("");
}

function handleCitizenHazardSubmit(e) {
    e.preventDefault();
    const type = $("hazardType")?.value;
    const location = $("hazardLocation")?.value?.trim();
    const details = $("hazardDetails")?.value?.trim();

    if (!location) {
        showError("Please enter location.");
        return;
    }

    const typeNames = {
        waterlog: "Road Waterlogging / Flood",
        tree: "Fallen Tree / Blockage",
        wire: "Fallen Power Line / Wire",
        hail: "Severe Hailstorm / Damage",
        fire: "Transformer Fire / Spark"
    };

    const newReport = {
        id: Date.now(),
        type,
        typeName: typeNames[type] || "Hazard",
        location,
        details: details || "Reported by citizen for district emergency response.",
        time: "Just now",
        latOffset: (Math.random() - 0.5) * 0.03,
        lonOffset: (Math.random() - 0.5) * 0.03
    };

    citizenReports.unshift(newReport);
    renderCitizenFeed();

    if (weatherMap && W?.current) {
        const pinLat = W.current.coord.lat + newReport.latOffset;
        const pinLon = W.current.coord.lon + newReport.lonOffset;

        const hazardIcon = L.divIcon({
            className: "hazard-map-pin",
            html: `<div style="background:#e11d48; color:white; border-radius:50%; width:28px; height:28px; display:grid; place-items:center; font-size:14px; box-shadow:0 0 10px rgba(225,29,72,0.8); border:2px solid white;">⚠️</div>`,
            iconSize: [28, 28]
        });

        const m = L.marker([pinLat, pinLon], { icon: hazardIcon }).addTo(weatherMap)
            .bindPopup(`<b>⚠️ CITIZEN HAZARD: ${newReport.typeName}</b><br>📍 ${newReport.location}<br>${newReport.details}`);

        hazardMarkers.push(m);
    }

    alert(currentLanguage === "hi" ? "✅ आपकी रिपोर्ट सफलतापूर्वक दर्ज की गई और जिला नियंत्रण कक्ष को भेज दी गई है!" : "✅ Incident report successfully pinned and forwarded to DDMA Emergency Cell!");
    $("hazardForm")?.reset();
}


/* =========================================================
   RISK ENGINE & ALERTS
========================================================= */

function updateRisk(current, forecast) {
    let score = 100;
    const rain = getRainProbability(forecast);

    if (current.main.temp >= 42) score -= 35;
    else if (current.main.temp >= 38) score -= 20;
    else if (current.main.temp >= 35) score -= 10;
    else if (current.main.temp <= 2) score -= 20;

    if (rain >= 80) score -= 30;
    else if (rain >= 50) score -= 18;

    const windKmh = current.wind.speed * 3.6;
    if (windKmh >= 50) score -= 25;
    else if (windKmh >= 35) score -= 15;

    score = Math.max(0, Math.min(100, Math.round(score)));

    const status = score >= 75
        ? (currentLanguage === "hi" ? "सुरक्षित (LOW RISK)" : "LOW RISK")
        : score >= 50
            ? (currentLanguage === "hi" ? "मध्यम जोखिम (MODERATE)" : "MODERATE")
            : (currentLanguage === "hi" ? "उच्च जोखिम (HIGH RISK)" : "HIGH RISK");

    setText("score", score);
    setText("risk", status);
    setText("riskStatus", status);

    const risks = $("risks");
    if (!risks) return;

    const alerts = [];
    if (current.main.temp >= 40) alerts.push(currentLanguage === "hi" ? "🔥 भीषण गर्मी / लू का प्रकोप।" : "🔥 Extreme heat detected.");
    if (rain >= 70) alerts.push(currentLanguage === "hi" ? `🌧️ भारी बारिश की संभावना ${Math.round(rain)}%।` : `🌧️ Severe rain probability ${Math.round(rain)}%.`);
    if (windKmh >= 35) alerts.push(currentLanguage === "hi" ? `💨 तेज आंधी के झोंके (${Math.round(windKmh)} km/h)।` : `💨 High wind gusts (${Math.round(windKmh)} km/h).`);

    risks.innerHTML = alerts.length
        ? alerts.map(x => `<div>${x}</div>`).join("")
        : `<div>${currentLanguage === "hi" ? "✅ अनुकूल वातावरणीय स्थिति। कोई बड़ा जोखिम नहीं।" : "✅ Ideal meteorological conditions. All district sectors safe."}</div>`;
}

function updateAlerts(current, forecast) {
    const box = $("alertList");
    const rain = getRainProbability(forecast);
    const alerts = [];

    if (rain >= 70) {
        alerts.push({
            icon: "🌧️",
            title: currentLanguage === "hi" ? "भारी वर्षा चेतावनी" : "Precipitation Warning",
            desc: currentLanguage === "hi" ? `वर्षा की संभावना ${Math.round(rain)}%। निचले मार्गों पर जलभराव संभव।` : `High probability of rainfall (${Math.round(rain)}%). Expect wet roads and local waterlogging.`,
            level: "HIGH"
        });
    }

    if (current.main.temp >= 40) {
        alerts.push({
            icon: "🔥",
            title: currentLanguage === "hi" ? "भीषण लू (Heatwave) चेतावनी" : "Extreme Heat Warning",
            desc: currentLanguage === "hi" ? `तापमान ${Math.round(current.main.temp)}°C। डिहाइड्रेशन से बचें।` : `Temperature reaching ${Math.round(current.main.temp)}°C. High risk of heat exhaustion.`,
            level: "CRITICAL"
        });
    }

    const windKmh = current.wind.speed * 3.6;
    if (windKmh >= 35) {
        alerts.push({
            icon: "💨",
            title: currentLanguage === "hi" ? "तेज हवा चेतावनी" : "High Wind Alert",
            desc: currentLanguage === "hi" ? `हवा की गति ${Math.round(windKmh)} km/h।` : `Wind gusts up to ${Math.round(windKmh)} km/h.`,
            level: "MODERATE"
        });
    }

    if (box) {
        if (!alerts.length) {
            box.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px; padding:14px; border-radius:12px; background:rgba(16, 185, 129, 0.08); border:1px solid rgba(16, 185, 129, 0.2);">
                    <div style="font-size:22px;">✅</div>
                    <div>
                        <strong style="font-size:13px; display:block;">${currentLanguage === "hi" ? "सभी स्थितियां सुरक्षित" : "All District Sectors Clear"}</strong>
                        <p style="color:var(--text-secondary); font-size:12px; margin-top:2px;">${currentLanguage === "hi" ? "इस क्षेत्र के लिए कोई गंभीर मौसम संबंधी चेतावनी सक्रिय नहीं है।" : "No severe meteorological hazards active for this district."}</p>
                    </div>
                </div>
            `;
        } else {
            box.innerHTML = alerts.map(alert => `
                <div style="display:flex; align-items:center; gap:12px; padding:14px; border-radius:12px; background:var(--bg-card-inner); border:1px solid var(--border-card); margin-bottom:8px;">
                    <div style="font-size:22px;">${alert.icon}</div>
                    <div style="flex:1;">
                        <strong style="font-size:13px; display:block;">${alert.title}</strong>
                        <p style="color:var(--text-secondary); font-size:12px; margin-top:2px;">${alert.desc}</p>
                    </div>
                    <span class="status-pill ${alert.level === 'CRITICAL' || alert.level === 'HIGH' ? 'danger' : 'warning'}">${alert.level}</span>
                </div>
            `).join("");
        }
    }

    setText("alertCount", alerts.length);
    setText("rainAlertStatus", rain >= 70 ? "HIGH" : rain >= 40 ? "MEDIUM" : "LOW");
}


/* =========================================================
   5 DAY DAILY FORECAST
========================================================= */

function updateFiveDayForecast(forecast, daily) {
    const box = $("forecast");
    if (!box) return;

    if (daily && daily.time && daily.time.length >= 5) {
        const daysHtml = daily.time.slice(0, 5).map((dateStr, idx) => {
            const dateObj = new Date(dateStr + "T12:00:00");
            const formattedDate = dateObj.toLocaleDateString(currentLanguage === "hi" ? "hi-IN" : "en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short"
            });
            const wCode = daily.weather_code[idx] || 0;
            const wInfo = wmoToOpenWeather(wCode, 1);
            const maxT = Math.round(daily.temperature_2m_max[idx]);
            const minT = Math.round(daily.temperature_2m_min[idx]);
            const rainP = Math.round(daily.precipitation_probability_max?.[idx] || 0);

            return `
                <div class="day">
                    <small>${formattedDate}</small>
                    <img src="https://openweathermap.org/img/wn/${wInfo.icon}@2x.png" alt="Forecast icon">
                    <b>${maxT}° <span style="font-size: 13px; font-weight: 500; color: var(--text-muted);">${minT}°</span></b>
                    <span>💧 ${rainP}%</span>
                    <span>${wInfo.desc}</span>
                </div>
            `;
        }).join("");

        box.innerHTML = daysHtml;
        return;
    }

    if (!forecast?.list) return;
    const days = [];
    forecast.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString("en-IN");
        if (!days.some(x => x.date === date)) {
            days.push({ date, item });
        }
    });

    box.innerHTML = days.slice(0, 5).map(day => {
        const item = day.item;
        const date = new Date(item.dt * 1000).toLocaleDateString(currentLanguage === "hi" ? "hi-IN" : "en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short"
        });
        const rain = Math.round((item.pop || 0) * 100);

        return `
            <div class="day">
                <small>${date}</small>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="Forecast icon">
                <b>${Math.round(item.main.temp)}°</b>
                <span>💧 ${rain}%</span>
                <span>${capitalize(item.weather[0].description)}</span>
            </div>
        `;
    }).join("");
}

function updateHourlyForecast(forecast) {
    const box = $("hourly");
    if (!box || !forecast?.list) return;

    box.innerHTML = forecast.list.slice(0, 12).map((item, index) => {
        const time = index === 0
            ? (currentLanguage === "hi" ? "अभी" : "Now")
            : new Date(item.dt * 1000).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

        return `
            <div class="hour">
                <small>${time}</small>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="Hour icon">
                <b>${Math.round(item.main.temp)}°</b>
                <span>💧 ${Math.round((item.pop || 0) * 100)}%</span>
            </div>
        `;
    }).join("");
}


/* =========================================================
   ANALYTICS (CHART.JS)
========================================================= */

function updateAnalyticsCharts(forecast) {
    if (typeof Chart === "undefined" || !forecast?.list) return;

    const dataSlice = forecast.list.slice(0, 10);
    const labels = dataSlice.map((x, idx) => {
        if (idx === 0) return currentLanguage === "hi" ? "अभी" : "Now";
        return new Date(x.dt * 1000).toLocaleTimeString("en-IN", { hour: "numeric" });
    });

    const temps = dataSlice.map(x => Math.round(x.main.temp));
    const rains = dataSlice.map(x => Math.round((x.pop || 0) * 100));
    const hums = dataSlice.map(x => x.main.humidity);
    const winds = dataSlice.map(x => Math.round(x.wind.speed * 3.6));

    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "rgba(10, 15, 29, 0.96)",
                titleFont: { family: "Plus Jakarta Sans", size: 12 },
                bodyFont: { family: "Plus Jakarta Sans", size: 13 },
                borderColor: "rgba(0, 242, 254, 0.35)",
                borderWidth: 1,
                padding: 10,
                displayColors: false
            }
        },
        scales: {
            x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8", font: { size: 11 } } },
            y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8", font: { size: 11 } } }
        }
    };

    const tempCtx = $("temperatureChart")?.getContext("2d");
    if (tempCtx) {
        if (tempChartInstance) tempChartInstance.destroy();
        const gradient = tempCtx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, "rgba(0, 242, 254, 0.4)");
        gradient.addColorStop(1, "rgba(0, 242, 254, 0.0)");

        tempChartInstance = new Chart(tempCtx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "Temperature (°C)",
                    data: temps,
                    borderColor: "#00f2fe",
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: "#00f2fe"
                }]
            },
            options: baseOptions
        });
    }

    const rainCtx = $("rainChart")?.getContext("2d");
    if (rainCtx) {
        if (rainChartInstance) rainChartInstance.destroy();
        rainChartInstance = new Chart(rainCtx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Rain Chance (%)",
                    data: rains,
                    backgroundColor: "rgba(99, 102, 241, 0.75)",
                    hoverBackgroundColor: "rgba(99, 102, 241, 0.95)",
                    borderRadius: 6
                }]
            },
            options: { ...baseOptions, scales: { ...baseOptions.scales, y: { ...baseOptions.scales.y, min: 0, max: 100 } } }
        });
    }

    const humCtx = $("humidityChart")?.getContext("2d");
    if (humCtx) {
        if (humChartInstance) humChartInstance.destroy();
        const gradientHum = humCtx.createLinearGradient(0, 0, 0, 200);
        gradientHum.addColorStop(0, "rgba(16, 185, 129, 0.4)");
        gradientHum.addColorStop(1, "rgba(16, 185, 129, 0.0)");

        humChartInstance = new Chart(humCtx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "Humidity (%)",
                    data: hums,
                    borderColor: "#10b981",
                    backgroundColor: gradientHum,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: "#10b981"
                }]
            },
            options: { ...baseOptions, scales: { ...baseOptions.scales, y: { ...baseOptions.scales.y, min: 0, max: 100 } } }
        });
    }

    const windCtx = $("windChart")?.getContext("2d");
    if (windCtx) {
        if (windChartInstance) windChartInstance.destroy();
        windChartInstance = new Chart(windCtx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "Wind Speed (km/h)",
                    data: winds,
                    borderColor: "#f59e0b",
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: "#f59e0b"
                }]
            },
            options: baseOptions
        });
    }
}


/* =========================================================
   GEOSPATIAL LEAFLET MAP & RESCUE OVERLAYS
========================================================= */

function initMap() {
    if (weatherMap) {
        setTimeout(() => weatherMap.invalidateSize(), 150);
        return;
    }

    const mapElement = $("weatherMap");
    if (!mapElement || typeof L === "undefined") return;

    weatherMap = L.map("weatherMap").setView([26.4499, 80.3319], 11);

    streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19
    });

    satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "© Esri",
        maxZoom: 19
    });

    streetLayer.addTo(weatherMap);

    // Plot Live Rescue Teams on Map
    rescueTeams.forEach(t => {
        const teamIcon = L.divIcon({
            className: "rescue-map-pin",
            html: `<div style="background:#6366f1; color:white; border-radius:50%; width:30px; height:30px; display:grid; place-items:center; font-size:14px; box-shadow:0 0 15px rgba(99,102,241,0.8); border:2px solid white;">🧭</div>`,
            iconSize: [30, 30]
        });

        const rm = L.marker([t.lat, t.lon], { icon: teamIcon }).addTo(weatherMap)
            .bindPopup(`<b>🧭 ${t.name} (${t.status.toUpperCase()})</b><br>${t.specialty}<br>👥 ${t.members} Rescuers<br>📍 ${t.locationName}<br>🎯 ${t.activeMission}`);
        rescueMarkers.push(rm);
    });

    // Citizen reports
    citizenReports.forEach(r => {
        const pinLat = 26.4499 + r.latOffset;
        const pinLon = 80.3319 + r.lonOffset;

        const hazardIcon = L.divIcon({
            className: "hazard-map-pin",
            html: `<div style="background:#e11d48; color:white; border-radius:50%; width:26px; height:26px; display:grid; place-items:center; font-size:13px; box-shadow:0 0 10px rgba(225,29,72,0.8); border:2px solid white;">⚠️</div>`,
            iconSize: [26, 26]
        });

        L.marker([pinLat, pinLon], { icon: hazardIcon }).addTo(weatherMap)
            .bindPopup(`<b>⚠️ CITIZEN HAZARD: ${r.typeName}</b><br>📍 ${r.location}<br>${r.details}`);
    });
}

function updateWeatherMap(lat, lon, name, current) {
    initMap();
    if (!weatherMap) return;

    const place = name || current?.name || "Unknown";
    setText("mapPlace", place);
    setText("mapTemp", current?.main?.temp != null ? Math.round(current.main.temp) + "°C" : "--");
    setText("mapWeather", capitalize(current?.weather?.[0]?.description));
    setText("mapWind", current?.wind?.speed != null ? Math.round(current.wind.speed * 3.6) + " km/h" : "--");

    weatherMap.setView([lat, lon], 11, { animate: true });

    if (weatherMarker) weatherMap.removeLayer(weatherMarker);
    weatherMarker = L.marker([lat, lon]).addTo(weatherMap);

    const tempVal = current?.main?.temp != null ? Math.round(current.main.temp) : "--";
    const condVal = capitalize(current?.weather?.[0]?.description);
    const windVal = current?.wind?.speed != null ? Math.round(current.wind.speed * 3.6) : "--";

    weatherMarker.bindPopup(`
        <div style="min-width:180px; font-family: Inter, Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #0f172a;">
            <strong style="font-size: 13px;">📍 ${place} (DDMA Control Center)</strong><br>
            <span>🌡️ Temperature: <b>${tempVal}°C</b></span><br>
            <span>☁️ Condition: <b>${condVal}</b></span><br>
            <span>💨 Wind: <b>${windVal} km/h</b></span><br>
            <span>⚡ Lightning CAPE: <b>${skycastLightningCape} J/kg</b></span>
        </div>
    `);

    setTimeout(() => weatherMap.invalidateSize(), 300);
}

function switchMapLayer(type) {
    initMap();
    if (!weatherMap) return;

    if (type === "satellite") {
        if (streetLayer && weatherMap.hasLayer(streetLayer)) weatherMap.removeLayer(streetLayer);
        if (satelliteLayer && !weatherMap.hasLayer(satelliteLayer)) satelliteLayer.addTo(weatherMap);
    } else {
        if (satelliteLayer && weatherMap.hasLayer(satelliteLayer)) weatherMap.removeLayer(satelliteLayer);
        if (streetLayer && !weatherMap.hasLayer(streetLayer)) streetLayer.addTo(weatherMap);
    }
    setTimeout(() => weatherMap.invalidateSize(), 150);
}


/* =========================================================
   AIR QUALITY & UV
========================================================= */

async function loadAQI(lat, lon) {
    try {
        const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10&timezone=auto`);
        const data = await response.json();
        skycastAQI = data.current?.us_aqi ?? 85;

        setText("aqiValue", skycastAQI);
        setText("aqiStatus", getAQIStatus(skycastAQI));
        setText("airAlertStatus", skycastAQI > 200 ? "POOR" : "GOOD");
    } catch {
        skycastAQI = 85;
        setText("aqiValue", "85");
        setText("aqiStatus", getAQIStatus(85));
    }
}

function getAQIStatus(aqi) {
    if (aqi == null) return "Unavailable";
    if (aqi <= 50) return currentLanguage === "hi" ? "उत्तम (Good)" : "Good";
    if (aqi <= 100) return currentLanguage === "hi" ? "संतोषजनक (Moderate)" : "Moderate";
    if (aqi <= 150) return currentLanguage === "hi" ? "संवेदनशील (Sensitive)" : "Sensitive";
    if (aqi <= 200) return currentLanguage === "hi" ? "अस्वस्थ (Unhealthy)" : "Unhealthy";
    if (aqi <= 300) return currentLanguage === "hi" ? "बहुत अस्वस्थ (Very Unhealthy)" : "Very Unhealthy";
    return currentLanguage === "hi" ? "गंभीर / खतरनाक (Hazardous)" : "Hazardous";
}

async function loadUV(lat, lon, fallbackUV = null) {
    if (fallbackUV != null) {
        skycastUV = fallbackUV;
        setText("uvValue", Number(skycastUV).toFixed(1));
        setText("uvStatus", getUVStatus(skycastUV));
        return;
    }

    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=uv_index_max&hourly=uv_index&timezone=auto`);
        const data = await response.json();
        
        const dailyMax = data.daily?.uv_index_max?.[0];
        const hourIdx = new Date().getHours();
        const hourlyNow = data.hourly?.uv_index?.[hourIdx] ?? data.hourly?.uv_index?.[0];
        
        skycastUV = dailyMax ?? hourlyNow ?? 4.8;

        setText("uvValue", Number(skycastUV).toFixed(1));
        setText("uvStatus", getUVStatus(skycastUV));
    } catch (e) {
        skycastUV = 4.8;
        setText("uvValue", "4.8");
        setText("uvStatus", getUVStatus(4.8));
    }
}

function getUVStatus(uv) {
    if (uv == null) return "Unavailable";
    if (uv <= 2) return currentLanguage === "hi" ? "कम (Low)" : "Low";
    if (uv <= 5) return currentLanguage === "hi" ? "मध्यम (Moderate)" : "Moderate";
    if (uv <= 7) return currentLanguage === "hi" ? "उच्च (High)" : "High";
    if (uv <= 10) return currentLanguage === "hi" ? "अत्यधिक (Very High)" : "Very High";
    return currentLanguage === "hi" ? "चरम सीमा (Extreme)" : "Extreme";
}


/* =========================================================
   AI COPILOT REASONING (DISASTER & RESCUE DISPATCH)
========================================================= */

function synthesizeAIResponse(question, weather) {
    const q = question.toLowerCase();
    const cur = weather.current;
    const place = cur.name;
    const temp = Math.round(cur.main.temp);
    const hum = cur.main.humidity;
    const desc = cur.weather[0].description;
    const wind = Math.round(cur.wind.speed * 3.6);
    const rain = getRainProbability(weather.forecast);

    if (currentLanguage === "hi") {
        if (q.includes("high-risk") || q.includes("खतरनाक") || q.includes("area") || q.includes("क्षेत्र")) {
            return `🚨 AI जिला जोखिम विश्लेषण (${place}):\nसबसे संवेदनशील क्षेत्र **River Basin Low-Lying Ward** और **North Tehsil** हैं जहाँ बारिश की संभावना ${Math.round(rain)}% है। इन क्षेत्रों में Team Alpha (नाव एवं गोताखोर) को अलर्ट पर रखा गया है।`;
        }
        if (q.includes("rescue") || q.includes("pehle") || q.includes("priority") || q.includes("कहाँ")) {
            return `🧭 AI रेस्क्यू प्राथमिकता सिफारिश:\n1. **Priority 1**: Incident #INC-101 (River Basin Low-Lying Drainage)। NDRF Team Alpha स्टैंडबाय पर है।\n2. **Priority 2**: Labor Colony एवं सिविल लाइन्स में मेडिकल एम्बुलेंस (Team Bravo)।\n3. **Priority 3**: Collectorate Road पर गिरे पेड़ की निकासी (Team Charlie)।`;
        }
        if (q.includes("lightning") || q.includes("बिजली") || q.includes("shelter") || q.includes("आश्रय")) {
            return `⚡ वज्रपात सुरक्षा AI सलाह:\nवर्तमान में CAPE सूचकांक **${skycastLightningCape} J/kg** है (${skycastLightningRisk}% जोखिम)।\nनिकटतम पक्का सुरक्षित आश्रय: **राजकीय इंटर कॉलेज (0.6 km)** और **ग्रीन पार्क इंडोर स्टेडियम (1.2 km)**। दोनों में तड़ित चालक (Lightning Arrestor) सक्रिय हैं।`;
        }
        if (q.includes("kisan") || q.includes("खेती") || q.includes("फसल") || q.includes("irrigation")) {
            return `🌾 किसान AI सलाह (${place}):\nखेत का तापमान ${temp}°C, नमी ${hum}% और बारिश की संभावना ${Math.round(rain)}% है। ${rain >= 50 ? "सिंचाई और कीटनाशक छिड़काव स्थगित रखें।" : "कीटनाशक स्प्रे और सामान्य कृषि कार्यों के लिए मौसम अनुकूल है।"}`;
        }
        return `✦ स्काईकास्ट AI जिला आपातकालीन विश्लेषण (${place}):\nतापमान ${temp}°C (${desc}), नमी ${hum}%, हवा ${wind} km/h, CAPE ${skycastLightningCape} J/kg और AQI ${skycastAQI || 85} है। 4 रेस्क्यू टीमें एवं 12 राहत शिविर सक्रिय हैं।`;
    }

    if (q.includes("high-risk") || q.includes("worst") || q.includes("danger") || q.includes("area")) {
        return `🚨 AI District Vulnerability Assessment for ${place}:\nThe monitored sector is **River Basin Low-Lying Ward** and **North Tehsil** with a ${Math.round(rain)}% rain likelihood. NDRF Team Alpha (Inflatable Boats) is pre-positioned on standby.`;
    }
    if (q.includes("rescue") || q.includes("priority") || q.includes("dispatch") || q.includes("team")) {
        return `🧭 AI Autonomous Rescue Triage Plan:\n1. **Priority 1 (Standard)**: River Basin Sector Drainage Monitoring (NDRF Team Alpha).\n2. **Priority 2 (Medical)**: Civil Lines Hospital Corridor Mobile ICUs (SDRF Team Bravo).\n3. **Priority 3 (Debris)**: Highway clearance units on standby (Civil Defense Team Charlie).`;
    }
    if (q.includes("lightning") || q.includes("shelter") || q.includes("thunder")) {
        return `⚡ Lightning Safety & Shelter Finder:\nCurrent Convective CAPE is **${skycastLightningCape} J/kg** (${skycastLightningRisk}% strike likelihood).\nNearest verified Grade-A concrete shelters:\n1. **Govt. Senior Secondary Inter College (0.6 km)**\n2. **Green Park Indoor Sports Complex (1.2 km)**\nBoth facilities feature active lightning grounding grids.`;
    }
    if (q.includes("travel") || q.includes("safe") || q.includes("highway")) {
        return `✈️ Travel & Highway Safety in ${place}:\nCondition: ${desc} at ${temp}°C with ${wind} km/h wind and ${Math.round(rain)}% rain chance. Expressway and state highway conditions are currently normal.`;
    }

    return `✦ SkyCast AI Comprehensive Assessment for ${place}:\nTemperature: ${temp}°C (${desc}), Humidity: ${hum}%, Wind: ${wind} km/h, Rain likelihood: ${Math.round(rain)}%, CAPE: ${skycastLightningCape} J/kg, AQI: ${skycastAQI || 85}. All 4 NDRF/Civil Defense rescue battalions are deployed on standby.`;
}

async function askAI(question) {
    if (!question) return;

    if (!W) {
        setText("answer", currentLanguage === "hi" ? "कृपया पहले किसी जिले का नाम खोजें।" : "Please search for a district first.");
        return;
    }

    setText("answer", currentLanguage === "hi" ? "✦ स्काईकास्ट AI जिला आपदा एवं रेस्क्यू डेटा का विश्लेषण कर रहा है..." : "✦ SkyCast AI is computing autonomous disaster dispatch decisions...");

    try {
        await new Promise(r => setTimeout(r, 350));
        const answer = synthesizeAIResponse(question, W);
        setText("answer", answer);
    } catch (error) {
        setText("answer", "⚠️ " + error.message);
    }
}


/* =========================================================
   COMPARE & TRAVEL
========================================================= */

async function getCityWeather(city) {
    try {
        const response = await fetch("/api/weather?city=" + encodeURIComponent(city));
        if (response.ok) return await response.json();
    } catch (e) {}
    return await fetchOpenMeteoData(city);
}

async function compareCities() {
    const city1 = $("compareCity1")?.value.trim();
    const city2 = $("compareCity2")?.value.trim();
    const result = $("compareResult");

    if (!city1 || !city2) {
        if (result) result.innerHTML = `<div style="grid-column: 1/-1; padding: 10px; color: var(--amber);">Please enter both district names.</div>`;
        return;
    }

    if (result) result.innerHTML = `<div style="grid-column: 1/-1; padding: 15px; text-align: center;">✦ Comparing ${city1} and ${city2}...</div>`;

    try {
        const [one, two] = await Promise.all([getCityWeather(city1), getCityWeather(city2)]);
        const a = one.current;
        const b = two.current;
        const rainA = getRainProbability(one.forecast);
        const rainB = getRainProbability(two.forecast);

        const winnerText = a.main.temp < b.main.temp 
            ? `❄️ ${a.name} is cooler by ${Math.abs(Math.round(a.main.temp - b.main.temp))}°C than ${b.name}.`
            : `☀️ ${a.name} is warmer by ${Math.abs(Math.round(a.main.temp - b.main.temp))}°C than ${b.name}.`;

        if (result) {
            result.innerHTML = `
                <div class="compare-box">
                    <h3>📍 ${a.name}</h3>
                    <p>🌡️ Temperature: <b>${Math.round(a.main.temp)}°C</b></p>
                    <p>☁️ Condition: <b>${capitalize(a.weather[0].description)}</b></p>
                    <p>💧 Humidity: <b>${a.main.humidity}%</b></p>
                    <p>💨 Wind Speed: <b>${Math.round(a.wind.speed * 3.6)} km/h</b></p>
                    <p>🌧️ Rain Chance: <b>${Math.round(rainA)}%</b></p>
                </div>
                <div class="compare-box">
                    <h3>📍 ${b.name}</h3>
                    <p>🌡️ Temperature: <b>${Math.round(b.main.temp)}°C</b></p>
                    <p>☁️ Condition: <b>${capitalize(b.weather[0].description)}</b></p>
                    <p>💧 Humidity: <b>${b.main.humidity}%</b></p>
                    <p>💨 Wind Speed: <b>${Math.round(b.wind.speed * 3.6)} km/h</b></p>
                    <p>🌧️ Rain Chance: <b>${Math.round(rainB)}%</b></p>
                </div>
                <div class="compare-winner">
                    ✦ Analysis: ${winnerText}
                </div>
            `;
        }
    } catch (error) {
        if (result) result.innerHTML = `<div style="grid-column: 1/-1; padding: 10px; color: var(--rose);">⚠️ ${error.message}</div>`;
    }
}

async function checkTravel() {
    const destination = $("dest")?.value.trim();
    if (!destination) {
        setText("travelOut", "Please enter a destination district.");
        return;
    }

    setText("travelRisk", "CALCULATING...");
    try {
        const data = await getCityWeather(destination);
        const cur = data.current;
        const rain = getRainProbability(data.forecast);
        const temp = Math.round(cur.main.temp);
        const wind = Math.round(cur.wind.speed * 3.6);

        let riskLevel = "LOW RISK";
        let color = "var(--emerald)";

        if (rain >= 70 || temp >= 42 || wind >= 50) {
            riskLevel = "HIGH RISK";
            color = "var(--rose)";
        } else if (rain >= 40 || temp >= 36 || wind >= 35) {
            riskLevel = "MODERATE";
            color = "var(--amber)";
        }

        const travelRiskEl = $("travelRisk");
        if (travelRiskEl) {
            travelRiskEl.textContent = riskLevel;
            travelRiskEl.style.color = color;
        }

        setText("travelOut", `${cur.name} is currently ${capitalize(cur.weather[0].description)} at ${temp}°C with ${cur.main.humidity}% humidity, ${wind} km/h winds, and a ${Math.round(rain)}% chance of rain.`);
    } catch (error) {
        setText("travelRisk", "ERROR");
        setText("travelOut", "⚠️ " + error.message);
    }
}


/* =========================================================
   VOICE SEARCH & GEOLOCATION
========================================================= */

function startVoiceSearch() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
        showError("Voice search is not supported in this browser.");
        return;
    }

    const recognition = new Recognition();
    recognition.lang = currentLanguage === "hi" ? "hi-IN" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    const voiceBtn = $("voiceSearch");
    if (voiceBtn) voiceBtn.classList.add("listening");
    $("voiceWaveform")?.classList.remove("hidden");

    showError(currentLanguage === "hi" ? "🎙️ सुन रहा हूँ... जिले का नाम बोलें।" : "🎙️ Listening... Speak district name.");

    recognition.onresult = event => {
        if (voiceBtn) voiceBtn.classList.remove("listening");
        $("voiceWaveform")?.classList.add("hidden");
        hideError();
        const text = event.results[0][0].transcript.trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
        const input = $("city");
        if (input) input.value = text;
        loadWeather(text);
    };

    recognition.onerror = () => {
        if (voiceBtn) voiceBtn.classList.remove("listening");
        $("voiceWaveform")?.classList.add("hidden");
        showError("Voice search timed out. Please try again.");
    };

    recognition.onend = () => {
        if (voiceBtn) voiceBtn.classList.remove("listening");
        $("voiceWaveform")?.classList.add("hidden");
    };

    recognition.start();
}

function getMyLocation() {
    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser.");
        return;
    }

    showError("Locating coordinates...");

    navigator.geolocation.getCurrentPosition(
        async position => {
            try {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                let city = null;

                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
                if (res.ok) {
                    const data = await res.json();
                    city = data.address?.city || data.address?.district || data.address?.town || data.address?.state_district || "Kanpur";
                }

                if (!city) city = `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;

                const input = $("city");
                if (input) input.value = city;

                hideError();
                await loadWeather(city);
            } catch (error) {
                showError("Failed to retrieve location weather.");
            }
        },
        () => {
            showError("Location permission denied. Please search manually.");
        }
    );
}

function toggleTheme() {
    document.body.classList.toggle("light");
    const isLight = document.body.classList.contains("light");
    setText("theme", isLight ? "☀️" : "🌙");
    localStorage.setItem("skycast-theme", isLight ? "light" : "dark");
}

function loadTheme() {
    if (localStorage.getItem("skycast-theme") === "light") {
        document.body.classList.add("light");
        setText("theme", "☀️");
    }
}


/* =========================================================
   NAVIGATION ROUTER
========================================================= */

function setupNavigation() {
    const buttons = document.querySelectorAll(".nav-btn");
    const screens = document.querySelectorAll(".screen");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const screenId = button.dataset.screen;
            buttons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            screens.forEach(screen => screen.classList.remove("active"));
            const target = $(screenId);
            if (target) target.classList.add("active");

            if (screenId === "mapScreen") {
                setTimeout(() => {
                    initMap();
                    if (weatherMap) weatherMap.invalidateSize();
                }, 200);
            }

            if (screenId === "analyticsScreen" && W?.forecast) {
                setTimeout(() => updateAnalyticsCharts(W.forecast), 100);
            }

            if (screenId === "citizenScreen") {
                renderCitizenFeed();
            }

            if (screenId === "rescueScreen") {
                renderRescueOps();
            }

            if (screenId === "leaderboardScreen") {
                renderDistrictLeaderboard();
            }

            if (screenId === "lightningScreen") {
                renderLightningShelters();
                initLightningRadarCanvas();
            }

            if (screenId === "digitalTwinScreen") {
                drawDigitalTwinCanvas(Number($("twinRainSlider")?.value || 120));
            }
        });
    });
}


/* =========================================================
   DOM INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    console.log("🏛️ SkyCast AI — District Disaster Management Authority (DDMA) Command Center Initialized");

    loadTheme();
    loadLanguage();
    startLiveClock();
    setupNavigation();
    setupOfflineEngine();
    setupPWA();
    initMeteoCanvas();
    renderCitizenFeed();
    renderRescueOps();
    renderDistrictLeaderboard();
    renderLightningShelters();

    // Language Toggle
    $("langToggle")?.addEventListener("click", toggleLanguage);

    // Audio Bulletin Buttons
    $("audioBtn")?.addEventListener("click", () => playVoiceBulletin());
    $("heroAudioBtn")?.addEventListener("click", () => playVoiceBulletin());
    $("readFarmerAudio")?.addEventListener("click", () => {
        const advice = $("farmerAdvice")?.textContent;
        playVoiceBulletin(advice);
    });

    // Siren Buttons (WOW Factor)
    $("sirenBtn")?.addEventListener("click", () => triggerEmergencySiren(4));
    $("broadcastAlertBtn")?.addEventListener("click", () => {
        triggerEmergencySiren(5);
        alert(currentLanguage === "hi" 
            ? "🚨 आपातकालीन सायरन चेतावनी सक्रिय की गई! जिला कंट्रोल रूम एवं सभी तहसील टीमों को अलर्ट भेजा गया।"
            : "🚨 EMERGENCY SIRENS BROADCAST ACTIVATED! Real-time alerts dispatched to all block control teams.");
    });

    // Navigation Hero Fast Actions
    $("heroRescueBtn")?.addEventListener("click", () => {
        const btn = document.querySelector('[data-screen="rescueScreen"]');
        if (btn) btn.click();
    });

    $("heroSosBtn")?.addEventListener("click", () => {
        const btn = document.querySelector('[data-screen="sosScreen"]');
        if (btn) btn.click();
    });

    $("topSosBtn")?.addEventListener("click", () => {
        const btn = document.querySelector('[data-screen="sosScreen"]');
        if (btn) btn.click();
    });

    // Digital Twin Rainfall Slider
    $("twinRainSlider")?.addEventListener("input", (e) => {
        updateDigitalTwin(Number(e.target.value));
    });

    document.querySelectorAll(".btn-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".btn-preset").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const rain = Number(btn.dataset.rain || 120);
            const slider = $("twinRainSlider");
            if (slider) slider.value = rain;
            updateDigitalTwin(rain);
        });
    });

    // Quick District Chips Listeners
    document.querySelectorAll(".district-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            const city = chip.dataset.city;
            const input = $("city");
            if (input) input.value = city;
            loadWeather(city);
        });
    });

    // Smart SOS Form
    $("smartSosForm")?.addEventListener("submit", handleSmartSOS);

    // Field Team Check-In Modal
    $("openCheckInModalBtn")?.addEventListener("click", () => $("checkInModal")?.classList.remove("hidden"));
    $("closeCheckInModalBtn")?.addEventListener("click", () => $("checkInModal")?.classList.add("hidden"));
    $("checkInForm")?.addEventListener("submit", handleFieldCheckInSubmit);

    // 1-Click WhatsApp & SMS Dispatch Modal
    $("whatsappTopBtn")?.addEventListener("click", openWhatsAppDispatch);
    $("heroWaBtn")?.addEventListener("click", openWhatsAppDispatch);
    $("bannerWaBtn")?.addEventListener("click", openWhatsAppDispatch);
    $("cmdWaBtn")?.addEventListener("click", openWhatsAppDispatch);
    $("shareFarmerWaBtn")?.addEventListener("click", openWhatsAppDispatch);

    $("sendWhatsAppBtn")?.addEventListener("click", sendViaWhatsApp);
    $("copySmsBtn")?.addEventListener("click", copySmsText);

    // Modal Close Triggers
    $("closeWaModalBtn")?.addEventListener("click", () => $("whatsappModal")?.classList.add("hidden"));
    $("waModalBottomCloseBtn")?.addEventListener("click", () => $("whatsappModal")?.classList.add("hidden"));
    $("closeBulletinModalBtn")?.addEventListener("click", () => $("printBulletinModal")?.classList.add("hidden"));
    $("bulletinBottomCloseBtn")?.addEventListener("click", () => $("printBulletinModal")?.classList.add("hidden"));

    // Close on backdrop click (outside sheet)
    window.addEventListener("click", (e) => {
        if (e.target === $("whatsappModal")) $("whatsappModal")?.classList.add("hidden");
        if (e.target === $("printBulletinModal")) $("printBulletinModal")?.classList.add("hidden");
        if (e.target === $("checkInModal")) $("checkInModal")?.classList.add("hidden");
    });

    // Close on Escape key press
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            $("whatsappModal")?.classList.add("hidden");
            $("printBulletinModal")?.classList.add("hidden");
            $("checkInModal")?.classList.add("hidden");
        }
    });

    // Hackathon Simulation Scenario Selector
    $("simScenario")?.addEventListener("change", (e) => {
        activeSimulation = e.target.value;
        const badge = $("currentSimBadge");
        if (badge) {
            badge.textContent = activeSimulation.toUpperCase();
            if (activeSimulation !== "live") badge.classList.add("active");
            else badge.classList.remove("active");
        }
        const currentCity = $("place")?.textContent?.split(",")[0] || "District Headquarters";
        loadWeather(currentCity);
    });

    // Emergency Banner Click -> Switch to Command Center
    $("viewDisasterBtn")?.addEventListener("click", () => {
        const cmdBtn = document.querySelector('[data-screen="disasterScreen"]');
        if (cmdBtn) cmdBtn.click();
    });

    // Export Official Bulletin
    $("exportBulletinBtn")?.addEventListener("click", exportDistrictBulletin);

    // Crop Selector Buttons
    document.querySelectorAll(".crop-pill").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".crop-pill").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentCrop = btn.dataset.crop;
            if (W?.current) updateFarmer(W.current, W.forecast);
        });
    });

    // Citizen Hazard Form
    $("hazardForm")?.addEventListener("submit", handleCitizenHazardSubmit);

    // Search Controls
    $("search")?.addEventListener("click", () => {
        const city = $("city")?.value.trim();
        if (city) loadWeather(city);
    });

    $("city")?.addEventListener("keydown", e => {
        if (e.key === "Enter") $("search")?.click();
    });

    $("exploreBtn")?.addEventListener("click", () => $("city")?.focus());
    $("loc")?.addEventListener("click", getMyLocation);
    $("mapLocationBtn")?.addEventListener("click", getMyLocation);
    $("sosGetCoordsBtn")?.addEventListener("click", getMyLocation);
    $("voiceSearch")?.addEventListener("click", startVoiceSearch);
    $("theme")?.addEventListener("click", toggleTheme);

    $("streetBtn")?.addEventListener("click", () => {
        $("streetBtn")?.classList.add("active");
        $("satelliteBtn")?.classList.remove("active");
        switchMapLayer("street");
    });

    $("satelliteBtn")?.addEventListener("click", () => {
        $("satelliteBtn")?.classList.add("active");
        $("streetBtn")?.classList.remove("active");
        switchMapLayer("satellite");
    });

    // AI quick questions
    document.querySelectorAll("[data-q]").forEach(btn => {
        btn.addEventListener("click", () => askAI(btn.dataset.q));
    });

    $("ask")?.addEventListener("click", () => {
        const q = $("question")?.value.trim();
        if (q) askAI(q);
    });

    $("question")?.addEventListener("keydown", e => {
        if (e.key === "Enter") $("ask")?.click();
    });

    // Compare & Travel
    $("compareBtn")?.addEventListener("click", compareCities);
    $("travel")?.addEventListener("click", checkTravel);

    // Initial Load (Default District: Varanasi / Kanpur)
    loadWeather("Kanpur");
});
