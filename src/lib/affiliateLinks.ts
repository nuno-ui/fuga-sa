// Airport codes for popular destinations
export const AIRPORT_CODES: Record<string, string> = {
  // Portugal
  "Lisboa": "LIS",
  "Porto": "OPO",
  "Faro": "FAO",
  "Madeira": "FNC",
  "Açores": "PDL",

  // Spain
  "Barcelona": "BCN",
  "Madrid": "MAD",
  "Sevilha": "SVQ",
  "Málaga": "AGP",
  "Valência": "VLC",
  "Bilbau": "BIO",
  "Palma de Maiorca": "PMI",
  "Ibiza": "IBZ",
  "Tenerife": "TFN",
  "Gran Canaria": "LPA",

  // Italy
  "Roma": "FCO",
  "Milão": "MXP",
  "Veneza": "VCE",
  "Florença": "FLR",
  "Nápoles": "NAP",
  "Bolonha": "BLQ",
  "Turim": "TRN",
  "Palermo": "PMO",
  "Catânia": "CTA",
  "Sardenha": "CAG",

  // France
  "Paris": "CDG",
  "Nice": "NCE",
  "Lyon": "LYS",
  "Marselha": "MRS",
  "Bordéus": "BOD",
  "Toulouse": "TLS",

  // Greece
  "Atenas": "ATH",
  "Santorini": "JTR",
  "Mykonos": "JMK",
  "Creta": "HER",
  "Rodes": "RHO",
  "Corfu": "CFU",

  // Central Europe
  "Berlim": "BER",
  "Munique": "MUC",
  "Frankfurt": "FRA",
  "Viena": "VIE",
  "Zurique": "ZRH",
  "Genebra": "GVA",

  // Northern Europe
  "Amesterdão": "AMS",
  "Bruxelas": "BRU",
  "Londres": "LHR",
  "Dublin": "DUB",
  "Copenhaga": "CPH",
  "Estocolmo": "ARN",
  "Oslo": "OSL",
  "Helsínquia": "HEL",

  // Eastern Europe
  "Praga": "PRG",
  "Budapeste": "BUD",
  "Varsóvia": "WAW",
  "Cracóvia": "KRK",
  "Bucareste": "OTP",

  // Balkans
  "Dubrovnik": "DBV",
  "Split": "SPU",
  "Zagreb": "ZAG",
  "Liubliana": "LJU",
  "Belgrado": "BEG",
  "Tirana": "TIA",

  // Mediterranean
  "Malta": "MLA",
  "Chipre": "LCA",

  // Outside Europe
  "Marraquexe": "RAK",
  "Istambul": "IST",
  "Dubai": "DXB",
};

// English city names for URL encoding
export const CITY_NAMES_EN: Record<string, string> = {
  "Lisboa": "Lisbon",
  "Porto": "Porto",
  "Faro": "Faro",
  "Barcelona": "Barcelona",
  "Madrid": "Madrid",
  "Sevilha": "Seville",
  "Málaga": "Malaga",
  "Valência": "Valencia",
  "Bilbau": "Bilbao",
  "Roma": "Rome",
  "Milão": "Milan",
  "Veneza": "Venice",
  "Florença": "Florence",
  "Nápoles": "Naples",
  "Paris": "Paris",
  "Nice": "Nice",
  "Lyon": "Lyon",
  "Atenas": "Athens",
  "Santorini": "Santorini",
  "Mykonos": "Mykonos",
  "Creta": "Crete",
  "Berlim": "Berlin",
  "Munique": "Munich",
  "Viena": "Vienna",
  "Zurique": "Zurich",
  "Genebra": "Geneva",
  "Amesterdão": "Amsterdam",
  "Bruxelas": "Brussels",
  "Londres": "London",
  "Copenhaga": "Copenhagen",
  "Estocolmo": "Stockholm",
  "Helsínquia": "Helsinki",
  "Praga": "Prague",
  "Budapeste": "Budapest",
  "Varsóvia": "Warsaw",
  "Cracóvia": "Krakow",
  "Bucareste": "Bucharest",
  "Liubliana": "Ljubljana",
  "Belgrado": "Belgrade",
  "Marraquexe": "Marrakech",
  "Istambul": "Istanbul",
};

/**
 * Get Skyscanner flight search URL
 * @param originCode IATA code for origin airport (e.g., "LIS")
 * @param destinationCode IATA code for destination airport (e.g., "BCN")
 * @param startDate Departure date (YYYY-MM-DD)
 * @param endDate Return date (YYYY-MM-DD)
 * @param travelers Number of adult travelers
 */
export function getSkyscannerUrl(
  originCode: string,
  destinationCode: string,
  startDate: string,
  endDate: string,
  travelers: number = 1
): string {
  // Format dates for Skyscanner (YYMMDD)
  const formatDate = (date: string) => {
    const d = new Date(date);
    const yy = d.getFullYear().toString().slice(-2);
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    return `${yy}${mm}${dd}`;
  };

  const dep = formatDate(startDate);
  const ret = formatDate(endDate);

  return `https://www.skyscanner.pt/transport/flights/${originCode.toLowerCase()}/${destinationCode.toLowerCase()}/${dep}/${ret}/?adults=${travelers}&adultsv2=${travelers}&cabinclass=economy&children=0&inboundaltsenabled=false&infants=0&outboundaltsenabled=false&preferdirects=false&ref=home&rtn=1`;
}

/**
 * Get Booking.com hotel search URL
 * @param cityName City name in English
 * @param checkIn Check-in date (YYYY-MM-DD)
 * @param checkOut Check-out date (YYYY-MM-DD)
 * @param guests Number of guests
 * @param rooms Number of rooms
 */
export function getBookingUrl(
  cityName: string,
  checkIn: string,
  checkOut: string,
  guests: number = 2,
  rooms: number = 1
): string {
  const encodedCity = encodeURIComponent(cityName);

  return `https://www.booking.com/searchresults.html?ss=${encodedCity}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${guests}&no_rooms=${rooms}&group_children=0`;
}

/**
 * Get Rentalcars.com car rental search URL
 * @param cityName City name in English
 * @param pickupDate Pickup date (YYYY-MM-DD)
 * @param dropoffDate Dropoff date (YYYY-MM-DD)
 * @param pickupTime Pickup time (HH:MM) - defaults to 10:00
 * @param dropoffTime Dropoff time (HH:MM) - defaults to 10:00
 */
export function getRentalcarsUrl(
  cityName: string,
  pickupDate: string,
  dropoffDate: string,
  pickupTime: string = "10:00",
  dropoffTime: string = "10:00"
): string {
  const pu = new Date(pickupDate);
  const dr = new Date(dropoffDate);

  const puDay = pu.getDate();
  const puMonth = pu.getMonth() + 1;
  const puYear = pu.getFullYear();
  const [puHour, puMin] = pickupTime.split(":");

  const doDay = dr.getDate();
  const doMonth = dr.getMonth() + 1;
  const doYear = dr.getFullYear();
  const [doHour, doMin] = dropoffTime.split(":");

  const encodedCity = encodeURIComponent(cityName);

  return `https://www.rentalcars.com/search-results?location=${encodedCity}&puDay=${puDay}&puMonth=${puMonth}&puYear=${puYear}&puHour=${puHour}&puMinute=${puMin}&doDay=${doDay}&doMonth=${doMonth}&doYear=${doYear}&doHour=${doHour}&doMinute=${doMin}&driversAge=30`;
}

/**
 * Helper to get airport code from destination name
 */
export function getAirportCode(destinationName: string): string | null {
  // Direct match
  if (AIRPORT_CODES[destinationName]) {
    return AIRPORT_CODES[destinationName];
  }

  // Try to find partial match
  const lowerName = destinationName.toLowerCase();
  for (const [city, code] of Object.entries(AIRPORT_CODES)) {
    if (city.toLowerCase().includes(lowerName) || lowerName.includes(city.toLowerCase())) {
      return code;
    }
  }

  return null;
}

/**
 * Helper to get English city name
 */
export function getCityNameEn(destinationName: string): string {
  return CITY_NAMES_EN[destinationName] || destinationName;
}

/**
 * Generate all booking URLs for a destination
 */
export function getBookingUrls(
  destinationName: string,
  originName: string,
  startDate: string,
  endDate: string,
  travelers: number
): {
  flights: string | null;
  hotels: string;
  carRental: string;
} {
  const destCode = getAirportCode(destinationName);
  const originCode = getAirportCode(originName);
  const cityNameEn = getCityNameEn(destinationName);

  return {
    flights: destCode && originCode
      ? getSkyscannerUrl(originCode, destCode, startDate, endDate, travelers)
      : null,
    hotels: getBookingUrl(cityNameEn, startDate, endDate, travelers),
    carRental: getRentalcarsUrl(cityNameEn, startDate, endDate),
  };
}
