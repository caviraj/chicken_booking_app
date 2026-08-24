import React, { useEffect, useRef, useState } from 'react'
import { Navigation, Loader2, MapPin, Search } from 'lucide-react'
import { TIRUPPUR_ERODE_LOCAL_PLACES } from '../data/localPlaces'

declare const L: any

interface LeafletMapPickerProps {
  onLocationSelect: (address: string, lat: number, lng: number) => void
  initialLat?: number
  initialLng?: number
}

interface SearchSuggestion {
  name: string
  lat: number
  lng: number
  city?: string
  state?: string
  isLocal?: boolean
}

export const LeafletMapPicker: React.FC<LeafletMapPickerProps> = ({
  onLocationSelect,
  initialLat = 11.0342, // Kulathupalayam default
  initialLng = 77.5853  // Tiruppur District default
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [searching, setSearching] = useState<boolean>(false)
  const [showDropdown, setShowDropdown] = useState<boolean>(false)

  const [locating, setLocating] = useState<boolean>(false)
  const [gpsError, setGpsError] = useState<string | null>(null)

  // Reverse geocode lat/lng to address string
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'Accept-Language': 'en'
          }
        }
      )
      if (res.ok) {
        const data = await res.json()
        if (data && data.display_name) {
          setSearchQuery(data.display_name)
          onLocationSelect(data.display_name, lat, lng)
          return
        }
      }
      const fallback = `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      setSearchQuery(fallback)
      onLocationSelect(fallback, lat, lng)
    } catch (err) {
      const fallback = `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      setSearchQuery(fallback)
      onLocationSelect(fallback, lat, lng)
    }
  }

  // Handle Search Input Change (Photon OSM Free Autocomplete API + Local Tiruppur/Erode Places Index)
  const handleSearchChange = async (query: string) => {
    setSearchQuery(query)
    const q = query.trim().toLowerCase()
    if (q.length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    setSearching(true)

    // 1. Search Local Index first (Kulathupalayam, Vallipuram, Muthur, Kangeyam, etc.)
    const localMatches: SearchSuggestion[] = TIRUPPUR_ERODE_LOCAL_PLACES.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.district && p.district.toLowerCase().includes(q))
    ).map((p) => ({
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      city: p.district,
      isLocal: true
    }))

    try {
      // 2. Fetch Photon OSM API with Location Bias towards Kulathupalayam (lat: 11.0342, lon: 77.5853)
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=11.0342&lon=77.5853&limit=5`
      )
      let apiMatches: SearchSuggestion[] = []
      if (res.ok) {
        const data = await res.json()
        if (data && data.features) {
          apiMatches = data.features.map((f: any) => {
            const props = f.properties || {}
            const coords = f.geometry?.coordinates || [0, 0]
            const nameArr = [props.name, props.street, props.district, props.city, props.state].filter(Boolean)
            return {
              name: nameArr.join(', '),
              lat: coords[1],
              lng: coords[0],
              city: props.city,
              state: props.state,
              isLocal: false
            }
          })
        }
      }

      // Combine local pre-indexed places + API matches (deduplicated)
      const combined = [...localMatches, ...apiMatches]
      setSuggestions(combined)
      setShowDropdown(true)
    } catch (err) {
      if (localMatches.length > 0) {
        setSuggestions(localMatches)
        setShowDropdown(true)
      }
    } finally {
      setSearching(false)
    }
  }

  // Select Search Suggestion
  const handleSelectSuggestion = (s: SearchSuggestion) => {
    setSearchQuery(s.name)
    setShowDropdown(false)
    setSuggestions([])

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([s.lat, s.lng], 16, { animate: true, duration: 1.2 })
      markerRef.current.setLatLng([s.lat, s.lng])
      onLocationSelect(s.name, s.lat, s.lng)
    }
  }

  // Handle GPS "Locate Me"
  const handleLocateMe = () => {
    setGpsError(null)
    if (!navigator.geolocation) {
      setGpsError('GPS Geolocation is not supported by your browser.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLocating(false)

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 16, { animate: true, duration: 1.2 })
          markerRef.current.setLatLng([latitude, longitude])
          reverseGeocode(latitude, longitude)
        }
      },
      (error) => {
        setLocating(false)
        let msg = 'Unable to retrieve your current location.'
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please allow location access in browser.'
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location position unavailable. Please try again.'
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location search timed out.'
        }
        setGpsError(msg)
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    )
  }

  useEffect(() => {
    if (!mapContainerRef.current) return
    if (typeof L === 'undefined') {
      console.warn('Leaflet (L) is not loaded yet')
      return
    }

    // Initialize Leaflet map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 15)
      mapInstanceRef.current = map

      // 1. Google Maps Standard Tiles (contains ALL Google landmarks, businesses, shops, and street POIs)
      const googleRoadmap = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps'
      })

      // 2. Google Maps Hybrid Satellite Tiles (with landmark labels)
      const googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps'
      })

      // 3. CartoDB HD Tiles
      const cartoVoyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; CARTO'
      })

      // Add default Google Maps tile layer
      googleRoadmap.addTo(map)

      // Layer control switcher for standard/satellite/carto
      const baseMaps = {
        'Google Maps (All Landmarks)': googleRoadmap,
        'Google Satellite': googleHybrid,
        'Carto HD Streets': cartoVoyager
      }
      L.control.layers(baseMaps).addTo(map)

      // --- Shop Marker: Kolanthapalayam Origin Point (11.0342, 77.5853) ---
      const shopPos = [11.0342, 77.5853]
      const shopIcon = L.divIcon({
        className: 'custom-shop-marker',
        html: `<div style="background-color:#065f46;color:white;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(6,95,70,0.5);border:2.5px solid white;font-size:20px;">🏪</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 38]
      })
      L.marker(shopPos, { icon: shopIcon })
        .addTo(map)
        .bindPopup("<b>Kolanthapalayam FreshMeat Shop</b><br/>Origin Point (0 km)")

      // --- Zone 1 Circle Polygon: 0-2 km (₹30 Delivery) ---
      L.circle(shopPos, {
        radius: 2000,
        color: '#059669',
        fillColor: '#10b981',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '6, 6'
      }).addTo(map).bindTooltip("Zone 1: 0-2 km (₹30 Delivery)", { permanent: false, direction: 'top' })

      // --- Zone 2 Circle Polygon: 2-4 km (₹60 Delivery) ---
      L.circle(shopPos, {
        radius: 4000,
        color: '#d97706',
        fillColor: '#f59e0b',
        fillOpacity: 0.08,
        weight: 2,
        dashArray: '6, 6'
      }).addTo(map).bindTooltip("Zone 2: 2-4 km (₹60 Delivery)", { permanent: false, direction: 'right' })

      // --- Zone 3 Circle Polygon: 4-5 km (₹80 Delivery) & 5km MAX Boundary ---
      L.circle(shopPos, {
        radius: 5000,
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: 0.04,
        weight: 2.5,
        dashArray: '8, 8'
      }).addTo(map).bindTooltip("🚫 5 km Delivery Limit Boundary", { permanent: true, direction: 'bottom' })

      // Customer Pin Marker
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="background-color:#991b1b;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(153,27,27,0.5);border:2.5px solid white;font-size:20px;">📍</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      })

      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: customIcon
      }).addTo(map)
      markerRef.current = marker

      // Handle marker drag end
      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        reverseGeocode(pos.lat, pos.lng)
      })

      // Handle map click
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        reverseGeocode(lat, lng)
      })
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div className="w-full space-y-3">
      {/* Live Autocomplete Search Bar & Locate Me GPS Button */}
      <div className="flex flex-col sm:flex-row gap-2 relative z-20">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder="Type street, landmark, or shop name to search..."
            className="w-full pro-input pl-9 pr-8 text-xs font-medium"
          />
          {searching && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-800 absolute right-3 top-3" />
          )}

          {/* Autocomplete Predictive Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 max-h-60 overflow-y-auto">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full text-left px-3.5 py-2 hover:bg-red-50/70 text-xs text-slate-700 flex items-start gap-2 border-b border-slate-100 last:border-0 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-800 shrink-0 mt-0.5" />
                  <span className="truncate font-medium">{s.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="py-2 px-3.5 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {locating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          <span>{locating ? 'Locating...' : 'Locate Me (GPS)'}</span>
        </button>
      </div>

      {gpsError && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-[11px] font-medium">
          {gpsError}
        </div>
      )}

      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full h-64 rounded-2xl border-2 border-slate-200 shadow-inner z-10 overflow-hidden relative"
        style={{ minHeight: '270px' }}
      ></div>

      <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
        <span>📍 Google Maps layer active with all landmarks & shop POIs. Tap map or drag marker.</span>
      </p>
    </div>
  )
}
