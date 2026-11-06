// Branding lives in one place. Profile links are the makers' own public LinkedIn pages, supplied by them.
// Contact details beyond those stay null until the makers supply approved values.
export const BRAND = Object.freeze({
  brandName: 'ArMo',
  productName: 'ArMo MS Defender Migration Assistant',
  shortName: 'Defender Migration Assistant',
  tagline: 'Your guided, evidence-based move of Microsoft Sentinel from the Azure portal to the Microsoft Defender portal',
  quote: 'Built to make your migration journey easy.',
  website: 'https://armohub.ch',
  repositoryUrl: null, // set when the repository is public
  // The makers' community, supplied by them.
  community: { name: 'ArMoHub', url: 'https://www.linkedin.com/company/armohub', website: 'https://armohub.ch' },
  makers: [
    { name: 'Arno', initials: 'A', profileUrl: 'https://www.linkedin.com/in/arnoyan', photoDataUrl: null },
    { name: 'Moise', initials: 'M', profileUrl: 'https://www.linkedin.com/in/m-aub/', photoDataUrl: null },
  ],
  contactUrl: null,
  fileStem: 'armo-dma',
  distFile: 'ArMo-MS-Defender-Migration-Assistant.html',
});

export const APP_VERSION = '1.0.0';
