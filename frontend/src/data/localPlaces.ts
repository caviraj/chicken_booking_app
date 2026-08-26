export interface LocalPlace {
  name: string
  lat: number
  lng: number
  category?: string
  district?: string
}

// Pre-indexed local villages and landmarks around Kulathupalayam (Tiruppur / Erode District, TN)
export const TIRUPPUR_ERODE_LOCAL_PLACES: LocalPlace[] = [
  {
    name: 'FreshMeat Store, Main Shop',
    lat: 11.063737820050445,
    lng: 77.79459634396372,
    category: 'Store / Shop Center',
    district: 'Main Store'
  },
  {
    name: 'Kulanthaipalayam, Tiruppur District',
    lat: 11.0342,
    lng: 77.5853,
    category: 'Village Center',
    district: 'Tiruppur'
  },
  {
    name: 'Vallipuram Village, Tiruppur / Kangeyam',
    lat: 11.0825,
    lng: 77.6154,
    category: 'Village',
    district: 'Tiruppur'
  },
  {
    name: 'Muthur Town & Bus Stand, Tiruppur',
    lat: 11.1052,
    lng: 77.6851,
    category: 'Town / Bus Stand',
    district: 'Tiruppur'
  },
  {
    name: 'Kangeyam Town & Market, Tiruppur',
    lat: 11.0051,
    lng: 77.5624,
    category: 'Town Center',
    district: 'Tiruppur'
  },
  {
    name: 'Chennimalai Bus Stand & Temple Area, Erode',
    lat: 11.1683,
    lng: 77.6122,
    category: 'Town Center',
    district: 'Erode'
  },
  {
    name: 'Kodumudi Town & Railway Station, Erode',
    lat: 11.0804,
    lng: 77.8832,
    category: 'Town Center',
    district: 'Erode'
  },
  {
    name: 'Vellakoil Town, Tiruppur',
    lat: 10.9451,
    lng: 77.7153,
    category: 'Town Center',
    district: 'Tiruppur'
  },
  {
    name: 'Perundurai Town & SIPCOT, Erode',
    lat: 11.2751,
    lng: 77.5834,
    category: 'Town Center',
    district: 'Erode'
  },
  {
    name: 'Uthukuli Town & Railway Station, Tiruppur',
    lat: 11.1623,
    lng: 77.4421,
    category: 'Town Center',
    district: 'Tiruppur'
  },
  {
    name: 'Nathakadaiyur Village, Kangeyam, Tiruppur',
    lat: 11.0642,
    lng: 77.6431,
    category: 'Village',
    district: 'Tiruppur'
  },
  {
    name: 'Pazhayakottai Village, Kangeyam, Tiruppur',
    lat: 11.0412,
    lng: 77.6621,
    category: 'Village',
    district: 'Tiruppur'
  },
  {
    name: 'Olapalayam Village, Tiruppur',
    lat: 11.0253,
    lng: 77.6251,
    category: 'Village',
    district: 'Tiruppur'
  },
  {
    name: 'Kudimangalam Village, Tiruppur',
    lat: 10.8251,
    lng: 77.2153,
    category: 'Village',
    district: 'Tiruppur'
  }
]
