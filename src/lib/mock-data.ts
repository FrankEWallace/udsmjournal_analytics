export const journals = [
  { id: 1, name: "Tanzania Journal of Science", abbr: "TJS", papers: 342, downloads: 28450, internalCitations: 1205, externalCitations: 890, growth: 12.5 },
  { id: 2, name: "Tanzania Journal of Engineering & Technology", abbr: "TJET", papers: 278, downloads: 22100, internalCitations: 980, externalCitations: 720, growth: 8.3 },
  { id: 3, name: "Business Management Review", abbr: "BMR", papers: 195, downloads: 15800, internalCitations: 650, externalCitations: 480, growth: 15.2 },
  { id: 4, name: "Journal of Humanities & Social Sciences", abbr: "JHSS", papers: 310, downloads: 19200, internalCitations: 870, externalCitations: 610, growth: 6.7 },
  { id: 5, name: "Tanzania Journal of Sociology", abbr: "TJSoc", papers: 156, downloads: 9800, internalCitations: 420, externalCitations: 310, growth: 9.1 },
  { id: 6, name: "Zamani: Journal of African Historical Studies", abbr: "ZAMANI", papers: 128, downloads: 8400, internalCitations: 380, externalCitations: 290, growth: 11.4 },
  { id: 7, name: "Tanzanian Economic Review", abbr: "TER", papers: 165, downloads: 12300, internalCitations: 520, externalCitations: 410, growth: 7.8 },
  { id: 8, name: "Eastern Africa Law Review", abbr: "EALR", papers: 142, downloads: 10500, internalCitations: 445, externalCitations: 350, growth: 5.2 },
  { id: 9, name: "Tanzania Journal of Health Research", abbr: "TJHR", papers: 289, downloads: 24600, internalCitations: 1100, externalCitations: 850, growth: 18.3 },
  { id: 10, name: "Journal of Linguistics & Language in Education", abbr: "JLLE", papers: 98, downloads: 6200, internalCitations: 280, externalCitations: 190, growth: 4.5 },
  { id: 11, name: "Tanzania Veterinary Journal", abbr: "TVJ", papers: 175, downloads: 11200, internalCitations: 490, externalCitations: 380, growth: 10.2 },
  { id: 12, name: "Journal of Geography & Regional Planning", abbr: "JGRP", papers: 110, downloads: 7800, internalCitations: 340, externalCitations: 260, growth: 13.1 },
];

export const topArticles = [
  { id: 1, title: "Impact of Climate Change on Coastal Ecosystems in Tanzania", journal: "TJS", citations: 87, downloads: 2340, year: 2023 },
  { id: 2, title: "Machine Learning Applications in Agricultural Yield Prediction", journal: "TJET", citations: 72, downloads: 1890, year: 2023 },
  { id: 3, title: "Entrepreneurship Education and Youth Employment in East Africa", journal: "BMR", citations: 65, downloads: 1650, year: 2022 },
  { id: 4, title: "Swahili Language Policy Implementation in Higher Education", journal: "JHSS", citations: 58, downloads: 1420, year: 2023 },
  { id: 5, title: "Antimicrobial Resistance Patterns in Urban Health Facilities", journal: "TJHR", citations: 54, downloads: 1380, year: 2024 },
];

export const countryData = [
  { country: "Tanzania", code: "TZ", downloads: 45200, lat: -6.37, lng: 34.89 },
  { country: "Kenya", code: "KE", downloads: 12800, lat: -0.02, lng: 37.91 },
  { country: "United States", code: "US", downloads: 9400, lat: 37.09, lng: -95.71 },
  { country: "United Kingdom", code: "GB", downloads: 7200, lat: 55.38, lng: -3.44 },
  { country: "South Africa", code: "ZA", downloads: 6100, lat: -30.56, lng: 22.94 },
  { country: "Nigeria", code: "NG", downloads: 5800, lat: 9.08, lng: 8.68 },
  { country: "India", code: "IN", downloads: 4500, lat: 20.59, lng: 78.96 },
  { country: "Germany", code: "DE", downloads: 3200, lat: 51.17, lng: 10.45 },
  { country: "Uganda", code: "UG", downloads: 3100, lat: 1.37, lng: 32.29 },
  { country: "Ethiopia", code: "ET", downloads: 2800, lat: 9.15, lng: 40.49 },
  { country: "Canada", code: "CA", downloads: 2400, lat: 56.13, lng: -106.35 },
  { country: "Australia", code: "AU", downloads: 1900, lat: -25.27, lng: 133.78 },
];

export const citationTimeline = [
  { month: "Jan", internal: 120, external: 85 },
  { month: "Feb", internal: 135, external: 92 },
  { month: "Mar", internal: 148, external: 105 },
  { month: "Apr", internal: 142, external: 98 },
  { month: "May", internal: 165, external: 118 },
  { month: "Jun", internal: 178, external: 125 },
  { month: "Jul", internal: 190, external: 140 },
  { month: "Aug", internal: 205, external: 152 },
  { month: "Sep", internal: 195, external: 145 },
  { month: "Oct", internal: 218, external: 168 },
  { month: "Nov", internal: 230, external: 175 },
  { month: "Dec", internal: 245, external: 188 },
];

export const getAggregatedStats = () => {
  const totalPapers = journals.reduce((s, j) => s + j.papers, 0);
  const totalDownloads = journals.reduce((s, j) => s + j.downloads, 0);
  const totalInternal = journals.reduce((s, j) => s + j.internalCitations, 0);
  const totalExternal = journals.reduce((s, j) => s + j.externalCitations, 0);
  return {
    totalJournals: 25,
    totalPapers,
    totalDownloads,
    totalCitations: totalInternal + totalExternal,
    totalInternal,
    totalExternal,
    avgGrowth: +(journals.reduce((s, j) => s + j.growth, 0) / journals.length).toFixed(1),
  };
};
