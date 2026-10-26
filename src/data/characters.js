/**
 * Characters and Personalized Go-Karts Manifest for Krazy Kart Racing.
 * Each character has distinct personalized visual kart parts, materials,
 * driver accessories, exhaust plumes, and racing stats.
 */

export const CHARACTERS = [
  {
    id: 'blaze',
    name: 'Blaze Steele',
    title: 'The Red Comet',
    kartName: 'Apex Striker GT',
    avatar: '🏎️',
    themeColor: '#ff2832',
    accentColor: '#ffd043',
    stats: {
      speed: 92,
      accel: 74,
      handling: 80,
      drift: 86,
    },
    bio: 'Circuit champion who pushes high-downforce aerodynamics and blistering straightaway speeds.',
    visuals: {
      primaryColor: 0xff1e27,    // Fire Red
      secondaryColor: 0xf7f9fc,  // Pearl White
      accentColor: 0x111317,     // Carbon
      rimColor: 0xffbb33,        // Gold Speed-Spoke
      suitColor: 0xebf0f8,       // White Racing Suit
      suitAccent: 0xff1e27,
      helmetColor: 0xffffff,     // Gloss White Helmet
      visorColor: 0x1e6bff,      // Iridium Blue Visor
      visorEmissive: 0x1e6bff,
      spoilerType: 'carbon_formula',
      helmetStyle: 'classic_f1',
      exhaustStyle: 'dual_chrome',
      underglow: false,
      flameCore: [0.32, 0.76, 1.35],   // Hot butane blue core
      flameMid: [1.45, 0.68, 0.12],    // Golden amber
      flameTail: [1.25, 0.22, 0.02],   // Fiery crimson
      sparkColor: [1.0, 0.52, 0.08],
    },
  },
  {
    id: 'luna',
    name: 'Luna Spark',
    title: 'Cyber Prodigy',
    kartName: 'Volt Valkyrie ZX',
    avatar: '⚡',
    themeColor: '#00e5ff',
    accentColor: '#b000ff',
    stats: {
      speed: 84,
      accel: 95,
      handling: 90,
      drift: 78,
    },
    bio: 'Tech wunderkind with an overclocked electric ion-drive kart that launches out of corners instantly.',
    visuals: {
      primaryColor: 0x00f0ff,    // Electric Cyan
      secondaryColor: 0x9c27b0,  // Deep Ultraviolet
      accentColor: 0x0a101f,     // Deep Midnight
      rimColor: 0x00e5ff,        // Neon Cyan Rims
      suitColor: 0x181c2e,       // Dark Cyber Suit
      suitAccent: 0x00f0ff,
      helmetColor: 0x161a28,     // Matte Obsidian
      visorColor: 0x00ffff,      // Neon Cyan Hologram Visor
      visorEmissive: 0x00ffff,
      spoilerType: 'cyber_wings',
      helmetStyle: 'cyber_ears', // Cat-ear aero antennas
      exhaustStyle: 'cyber_ion',
      underglow: true,
      underglowColor: 0x00f5ff,
      flameCore: [0.2, 0.95, 1.6],     // Electric cyan plasma
      flameMid: [0.75, 0.15, 1.35],    // Holographic violet
      flameTail: [0.1, 0.65, 1.2],     // Deep cobalt
      sparkColor: [0.0, 0.9, 1.0],
    },
  },
  {
    id: 'rex',
    name: 'Rex Crusher',
    title: 'Heavy Bruiser',
    kartName: 'Mega Crusher 4x4',
    avatar: '🦖',
    themeColor: '#22c55e',
    accentColor: '#eab308',
    stats: {
      speed: 76,
      accel: 70,
      handling: 85,
      drift: 98,
    },
    bio: 'Offroad monster machine with heavy steel roll cage, rugged tires, and unyielding momentum.',
    visuals: {
      primaryColor: 0x22c55e,    // Toxic Acid Green
      secondaryColor: 0x1c1e22,  // Armor Charcoal
      accentColor: 0xfacc15,     // Hazard Yellow
      rimColor: 0x3f3f46,        // Heavy Gunmetal
      suitColor: 0x27272a,       // Kevlar Gray Suit
      suitAccent: 0x22c55e,
      helmetColor: 0x18181b,     // Matte Brutal Black
      visorColor: 0x4ade80,      // Toxic Green Visor
      visorEmissive: 0x22c55e,
      spoilerType: 'spiked_cage',
      helmetStyle: 'motocross_peak',
      hasRollCage: true,
      hasBullBar: true,
      exhaustStyle: 'smokestack',
      underglow: false,
      flameCore: [0.35, 1.45, 0.25],   // Toxic emerald fire
      flameMid: [1.35, 0.85, 0.08],    // Fiery amber
      flameTail: [0.85, 0.15, 0.02],   // Diesel blast
      sparkColor: [0.4, 1.0, 0.2],
    },
  },
  {
    id: 'pixie',
    name: 'Pixie Belle',
    title: 'Cosmic Pop',
    kartName: 'Stardust Comet 9',
    avatar: '⭐',
    themeColor: '#ff2d87',
    accentColor: '#ffd700',
    stats: {
      speed: 86,
      accel: 90,
      handling: 92,
      drift: 82,
    },
    bio: 'Supersonic idol with a jet-pod kart that leaves radiant stardust glitter and snaps through chicanes.',
    visuals: {
      primaryColor: 0xff2d87,    // Candy Bubblegum Pink
      secondaryColor: 0xd8b4fe,  // Lavender Pastel
      accentColor: 0xffffff,     // Starlight White
      rimColor: 0xffd700,        // Mirror Rose Gold
      suitColor: 0xfdf2f8,       // Pearl Pink Suit
      suitAccent: 0xff2d87,
      helmetColor: 0xfff0f7,     // Glossy Sugar White
      visorColor: 0xff66cc,      // Iridescent Rose Visor
      visorEmissive: 0xff3399,
      spoilerType: 'star_wing',
      helmetStyle: 'star_crest',
      exhaustStyle: 'star_trumpet',
      underglow: true,
      underglowColor: 0xff2d87,
      flameCore: [1.5, 0.5, 1.2],      // Hot magenta core
      flameMid: [1.4, 0.2, 0.8],       // Candy pink
      flameTail: [0.9, 0.4, 1.3],      // Stardust lavender
      sparkColor: [1.0, 0.4, 0.85],
    },
  },
  {
    id: 'shadow',
    name: 'Shadow Kage',
    title: 'Midnight Shinobi',
    kartName: 'Phantom Spectre GT',
    avatar: '🥷',
    themeColor: '#e11d48',
    accentColor: '#8b5cf6',
    stats: {
      speed: 94,
      accel: 82,
      handling: 75,
      drift: 95,
    },
    bio: 'Nocturnal ninja prototype with extreme drift angles and razor-sharp katana-wing aerodynamics.',
    visuals: {
      primaryColor: 0x0d0e12,    // Ultra-Matte Obsidian
      secondaryColor: 0xdc2626,  // Blood Crimson
      accentColor: 0x6b21a8,     // Void Purple
      rimColor: 0x18181b,        // Stealth Black
      suitColor: 0x090a0d,       // Stealth Carbon Suit
      suitAccent: 0xdc2626,
      helmetColor: 0x0d0e12,     // Matte Stealth Helmet
      visorColor: 0xef4444,      // Crimson Demonic Slit
      visorEmissive: 0xff0020,
      spoilerType: 'katana_blades',
      helmetStyle: 'shinobi_slit',
      exhaustStyle: 'stealth_triangle',
      underglow: true,
      underglowColor: 0xdc2626,
      flameCore: [0.95, 0.05, 0.35],   // Crimson plasma core
      flameMid: [0.65, 0.02, 0.95],    // Dark void purple
      flameTail: [0.35, 0.0, 0.12],    // Midnight ash
      sparkColor: [1.0, 0.1, 0.2],
    },
  },
];

export function getCharacterById(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}
