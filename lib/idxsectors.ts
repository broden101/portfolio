// Shared IDX sector definitions + TradingView helpers.
// Source of truth for sectors on IHSG dashboard + rotation map.
// NOTE: duplicated from app/api/market/route.ts to avoid touching the live route.

export const INDONESIA_SCANNER = "https://scanner.tradingview.com/indonesia/scan";

export const TV_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (compatible; RagaPlaybook/1.0)",
  "Content-Type": "application/json",
};

// Indeks sektor yang tersedia langsung di TradingView Indonesia
export const SECTOR_INDICES: Record<string, string> = {
  IDXFINANCE: "Finance",
  IDXBASIC: "Basic Materials",
  IDXENERGY: "Energy",
  IDXINDUST: "Industrials",
  IDXHEALTH: "Healthcare",
  IDXPROPERT: "Properties & Real Estate",
};

// Basket sektor — dihitung rata-rata perf saham anggota (12 sektor lengkap)
export const SECTOR_BASKETS: Record<string, { name: string; tickers: string[] }> = {
  IDXAGRI: { name: "Agriculture", tickers: [
    "AALI", "TAPG", "LSIP", "SGRO", "PALM", "TBLA", "BWPT", "BISI", "JAWA", "SSMS",
    "ANJT", "PNGO", "TLDN", "UDNG", "MSJA", "STAA", "BRAM", "ALDO", "FPNI", "GZCO",
    "PDPP", "TALF", "ADMG", "IPOL", "GULA", "MOLI", "SMKL", "YPAS", "AMMS", "IGAR",
    "APLI", "MYTX", "AKPI", "PTPS", "ESTI", "INOV", "ACRO", "NPGF", "ERTX", "ANDI",
    "PSDN", "AYLS", "INCI", "OBMD", "SBMA", "CHEM", "OILS", "PICO", "FLMC",
  ]},
  IDXTECHNO: { name: "Technology", tickers: [
    "DCII", "ASII", "GOTO", "MLPT", "WIFI", "CYBR", "MTDL", "MSTI", "ASGR", "IRSX",
    "PTSN", "ATIC", "NFCX", "CHIP", "AXIO", "IKBI", "PGJO", "AREA", "AWAN", "ELIT",
    "VTNY", "TFAS", "JATI", "WGSH", "TRON", "LPLI", "CASH", "TOSK", "UVCR", "EPAC",
    "GPSO", "LPIN", "ZYRX", "DIVA", "MCAS", "RCCC", "RUNS", "DIGI", "INDX",
  ]},
  IDXINFRA: { name: "Infrastructure", tickers: [
    "BREN", "MORA", "TLKM", "DNET", "CDIA", "ISAT", "EXCL", "MTEL", "PGEO", "RAJA",
    "POWR", "INET", "LINK", "KEEN", "DATA", "CENT", "GHON", "HGII", "INPS", "CGAS",
    "LAPD", "MSKY", "JAST", "MPOW",
  ]},
  IDXCYCLIC: { name: "Consumer Cyclicals", tickers: [
    "AMRT", "BELI", "CMRY", "EMTK", "MSIN", "MAPI", "AKRA", "VKTR", "MDIY", "BUVA",
    "FILM", "MAPA", "MGLV", "SCMA", "CITA", "TSPC", "ALII", "BUKA", "MIDI", "BHAT",
    "HRTA", "INPP", "CNMA", "CLAY", "PNLF", "EPMT", "BOGA", "ERAA", "ACES", "FORE",
    "NATO", "TGKA", "SINI", "MNCN", "BPII", "JTPE", "MPMX", "GJTL", "HEXA", "GOLF",
    "LPPF", "IMAS", "OMRE", "JSPT", "DAAZ", "MMIX", "VISI", "PNIN", "MDLA", "MDIA",
    "MINA", "BLTZ", "RALS", "DAYA", "MAPB", "BHIT", "IATA", "DEPO", "PSKT", "BMTR",
    "OASA", "CSAP", "FORU", "SPTO", "SONA", "ERAL", "FUTR", "IPTV", "RAAM", "PMJS",
    "MKTR", "WOOD", "POLI", "MLPL", "HERO", "BLUE", "CARS", "ARTA", "LTLS", "FAST",
    "DMMX", "LUCY", "BUAH", "LIVE", "DOOH", "BOLA", "FOLK", "LFLO", "KING", "RANC",
    "KONI", "ASLC", "KDTN", "SOSS", "PJAA", "RODA", "KSIX", "VERN", "SHID", "ENAK",
    "SOTS", "NETV", "SMGA", "MPPA", "IBOS", "PANR", "IRRA", "PZZA", "LABS", "PEVE",
    "VIVA", "UNSP", "FITT", "UNTD", "BABY", "GRPM", "PMUI", "GDYR", "ESTA", "GLVA",
    "KMDS", "ZATA", "GPRA", "PNSE", "BAYU", "UFOE", "MUTU", "DPUM", "DART", "EAST",
    "SCNP", "HYGN", "TYRE", "TIRA", "BMSR", "PADA", "DYAN", "KOBX", "MICE", "PDES",
    "CRSN", "IOTF", "NAIK", "HAJJ", "HRME", "BAPA", "DEWI", "SMLE", "SDPC", "MEJA",
    "DOSS", "AGAR", "INTA", "MDRN", "PEHA", "PTSP", "MRAT", "TAMA", "ECII", "PTMP",
    "CAKK", "DFAM", "RBMS", "MPIX", "MANG", "KBLV", "SLIS", "LAND", "LMPI", "NTBK",
    "YELO", "BAUT", "KOPI", "INTD", "MARI", "ABBA", "FOOD", "ICON", "MERI", "TMPO",
    "SNLK", "OLIV", "NANO", "KIOS", "AIMS", "PGLI", "OPMS", "KOIN", "HDIT", "LUCK",
    "CSMI", "IDEA", "KICI", "BMBL", "PLAN", "HADE",
  ]},
  IDXNONCYC: { name: "Consumer Non-Cyclicals", tickers: [
    "PANI", "ICBP", "HMSP", "UNVR", "INDF", "MYOR", "GGRM", "FAPA", "ADES", "MLBI",
    "STTP", "ULTJ", "GOOD", "YUPI", "POLU", "CLEO", "SIMP", "DMND", "UNIC", "EURO",
    "VICI", "PSGO", "ROTI", "WIIM", "KEJU", "FISH", "CBUT", "BEEF", "KINO", "DLTA",
    "UCID", "CEKA", "SKLT", "TCID", "CAMP", "COCO", "AISA", "STRK", "SKBM", "BELL",
    "TRIS", "ZONE", "MAXI", "WINE", "CRAB", "SRSN", "GUNA", "SURI", "BEER", "BOBA",
    "ITIC", "ENZO", "NAYZ", "WAPO", "DSFI", "MBTO", "NASI", "ISEA", "BATA", "IKAN",
    "TAYS", "RICY", "PCAR", "SOUL",
  ]},
  IDXTRANS: { name: "Transportation & Logistic", tickers: [
    "TCPI", "GIAA", "JSMR", "ELPI", "RMKE", "CMNP", "TMAS", "GMFI", "BULL", "MBSS",
    "SHIP", "SMDR", "CASS", "BIRD", "HATM", "BESS", "CBRE", "SOCI", "WINS", "PORT",
    "ASSA", "HUMI", "IPCC", "GTSI", "IPCM", "TPMA", "PSSI", "PSAT", "BLOG", "BBRM",
    "BSML", "BLTA", "CMPP", "TAMU", "MITI", "NELY", "HAIS", "RIGS", "BOAT", "GTRA",
    "MPXL", "SAFE", "KLAS", "PURA", "SDMU", "TRUK", "SAPX", "HELI", "PTIS", "PPGL",
    "WEHA", "LAJU", "TAXI", "KARW", "CANI", "JAYA", "LRNA", "TNCA", "KJEN", "ARKA",
  ]},
};

// all sector codes (indices + baskets)
export const ALL_SECTOR_CODES: string[] = [
  ...Object.keys(SECTOR_INDICES),
  ...Object.keys(SECTOR_BASKETS),
];

export function sectorName(code: string): string {
  return SECTOR_INDICES[code] || SECTOR_BASKETS[code]?.name || code;
}