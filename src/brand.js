// Branding lives in one place so the working names can change after feedback.
// Contact details, portraits and repository links stay null until the makers supply approved values.
export const BRAND = Object.freeze({
  brandName: 'ArMoHub',
  productName: 'ArMoHub Defender Migration Assistant',
  shortName: 'Defender Migration Assistant',
  tagline: 'Guided, evidence-based transition of Microsoft Sentinel to the Microsoft Defender portal',
  website: 'https://armohub.ch',
  repositoryUrl: null, // set when the repository is public
  makers: [
    { name: 'Arno', initials: 'A', profileUrl: null, photoDataUrl: null },
    { name: 'Moise', initials: 'M', profileUrl: null, photoDataUrl: null },
  ],
  contactUrl: null, // "Get in touch with the makers" stays a placeholder until an approved link exists
  fileStem: 'armohub-dma',
});

export const APP_VERSION = '0.9.0-rc.1';
