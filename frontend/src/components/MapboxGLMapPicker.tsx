import React, { useEffect, useRef, useState } from 'react'
import { Navigation, Loader2, MapPin, Search } from 'lucide-react'
import { TIRUPPUR_ERODE_LOCAL_PLACES } from '../data/localPlaces'

declare const maplibregl: any

interface MapboxGLMapPickerProps {
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

export const MapboxGLMapPicker: React.FC<MapboxGLMapPickerProps> = ({
  onLocationSelect,
  initialLat = 11.063737820050445,
  initialLng = 77.79459634396372
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

  // Handle Search Input Change
  const handleSearchChange = async (query: string) => {
    setSearchQuery(query)
    const q = query.trim().toLowerCase()
    if (q.length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    setSearching(true)

    // 1. Search Local Index first
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
            const nameParts = [props.name, props.street, props.district || props.city || props.county, props.state]
              .filter(Boolean)
              .join(', ')
            return {
              name: nameParts || props.name || 'Location',
              lat: coords[1],
              lng: coords[0],
              city: props.city || props.district,
              state: props.state
            }
          })
        }
      }
      setSuggestions([...localMatches, ...apiMatches])
      setShowDropdown(true)
    } catch (err) {
      setSuggestions(localMatches)
      setShowDropdown(localMatches.length > 0)
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
      mapInstanceRef.current.flyTo({
        center: [s.lng, s.lat],
        zoom: 17,
        essential: true,
        duration: 1200
      })
      markerRef.current.setLngLat([s.lng, s.lat])
      onLocationSelect(s.name, s.lat, s.lng)
    }
  }

  // GPS Locate Me
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
          mapInstanceRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 17,
            essential: true,
            duration: 1200
          })
          markerRef.current.setLngLat([longitude, latitude])
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
    if (typeof maplibregl === 'undefined') {
      console.warn('MapLibre GL JS is not loaded yet')
      return
    }

    if (!mapInstanceRef.current) {
      // Free vector map style: Carto Voyager style
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        center: [initialLng, initialLat],
        zoom: 15
      })
      mapInstanceRef.current = map

      // Navigation controls (Zoom + Compass)
      map.addControl(new maplibregl.NavigationControl(), 'top-right')

      // High Accuracy Geolocate Control
      const geolocateControl = new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showAccuracyCircle: true,
        showUserHeading: true
      })
      map.addControl(geolocateControl, 'top-right')

      geolocateControl.on('geolocate', (e: any) => {
        const lat = e.coords.latitude
        const lng = e.coords.longitude
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat])
        }
        reverseGeocode(lat, lng)
      })

      // Create Custom Draggable Marker
      const el = document.createElement('div')
      el.className = 'custom-map-pin'
      el.innerHTML = '📍'
      el.style.fontSize = '32px'
      el.style.cursor = 'pointer'

      const marker = new maplibregl.Marker({
        element: el,
        draggable: true
      })
        .setLngLat([initialLng, initialLat])
        .addTo(map)

      markerRef.current = marker

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat()
        reverseGeocode(lngLat.lat, lngLat.lng)
      })

      map.on('click', (e: any) => {
        const { lng, lat } = e.lngLat
        marker.setLngLat([lng, lat])
        reverseGeocode(lat, lng)
      })

      // Trigger auto-geolocate on load
      map.on('load', () => {
        setTimeout(() => {
          handleLocateMe()
        }, 500)
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
        <span>📍 Vector Map active with 60fps high precision GPS location tracking. Tap map or drag marker.</span>
      </p>
    </div>
  )
}
