import React, { useEffect, useRef, useState } from 'react'
import { Navigation, Loader2, MapPin, Search } from 'lucide-react'

declare const google: any

interface GoogleMapPickerProps {
  onLocationSelect: (address: string, lat: number, lng: number) => void
  initialLat?: number
  initialLng?: number
  apiKey?: string
}

export const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({
  onLocationSelect,
  initialLat = 13.0827,
  initialLng = 80.2707,
  apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const geocoderRef = useRef<any>(null)
  const autocompleteRef = useRef<any>(null)

  const [mapLoaded, setMapLoaded] = useState<boolean>(false)
  const [locating, setLocating] = useState<boolean>(false)
  const [addressInput, setAddressInput] = useState<string>('')
  const [gpsError, setGpsError] = useState<string | null>(null)

  // Reverse geocode lat/lng to address string
  const reverseGeocode = (lat: number, lng: number) => {
    if (geocoderRef.current) {
      geocoderRef.current.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
        if (status === 'OK' && results && results[0]) {
          const formatted = results[0].formatted_address
          setAddressInput(formatted)
          onLocationSelect(formatted, lat, lng)
        } else {
          const fallbackAddr = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
          setAddressInput(fallbackAddr)
          onLocationSelect(fallbackAddr, lat, lng)
        }
      })
    } else {
      const fallbackAddr = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      setAddressInput(fallbackAddr)
      onLocationSelect(fallbackAddr, lat, lng)
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
          mapInstanceRef.current.panTo({ lat: latitude, lng: longitude })
          mapInstanceRef.current.setZoom(16)
          markerRef.current.setPosition({ lat: latitude, lng: longitude })
          reverseGeocode(latitude, longitude)
        }
      },
      (error) => {
        setLocating(false)
        let msg = 'Unable to retrieve your current location.'
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please allow location access.'
        }
        setGpsError(msg)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // Load Google Maps Script dynamically
  useEffect(() => {
    if (!apiKey) return

    const win = window as any
    if (win.google && win.google.maps) {
      initMap()
      return
    }

    const existingScript = document.getElementById('google-maps-script')
    if (!existingScript) {
      const script = document.createElement('script')
      script.id = 'google-maps-script'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => {
        initMap()
      }
      document.head.appendChild(script)
    } else {
      existingScript.addEventListener('load', initMap)
    }
  }, [apiKey])

  const initMap = () => {
    const win = window as any
    if (!mapContainerRef.current || !win.google || !win.google.maps) return

    try {
      const shopPos = { lat: initialLat, lng: initialLng }

      const map = new google.maps.Map(mapContainerRef.current, {
        center: shopPos,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      })
      mapInstanceRef.current = map

      const geocoder = new google.maps.Geocoder()
      geocoderRef.current = geocoder

      const marker = new google.maps.Marker({
        position: shopPos,
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        title: 'Delivery Location Pin'
      })
      markerRef.current = marker

      // Handle marker drag
      marker.addListener('dragend', () => {
        const pos = marker.getPosition()
        const lat = pos.lat()
        const lng = pos.lng()
        reverseGeocode(lat, lng)
      })

      // Handle map click
      map.addListener('click', (e: any) => {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        marker.setPosition({ lat, lng })
        reverseGeocode(lat, lng)
      })

      // Places Autocomplete integration
      if (searchInputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
          types: ['geocode', 'establishment']
        })
        autocompleteRef.current = autocomplete
        autocomplete.bindTo('bounds', map)

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (!place.geometry || !place.geometry.location) {
            return
          }

          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()

          map.panTo({ lat, lng })
          map.setZoom(16)
          marker.setPosition({ lat, lng })

          const formatted = place.formatted_address || place.name || ''
          setAddressInput(formatted)
          onLocationSelect(formatted, lat, lng)
        })
      }

      setMapLoaded(true)
    } catch (err) {
      console.error('Failed to initialize Google Maps:', err)
    }
  }

  if (!apiKey) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-3">
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <MapPin className="w-4 h-4 text-amber-700" />
          <span>Google Maps API Key Needed</span>
        </div>
        <p className="text-[11px] text-amber-800 leading-relaxed">
          Please add your Google Maps API Key to your environment configuration to enable Google Places Autocomplete and Maps accuracy:
        </p>
        <code className="block p-2 bg-amber-100/70 rounded-lg text-[11px] font-mono select-all">
          VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
        </code>
      </div>
    )
  }

  return (
    <div className="w-full space-y-3">
      {/* Autocomplete Search Bar & Locate Me Button */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            ref={searchInputRef}
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="Search location or street with Google Autocomplete..."
            className="w-full pro-input pl-9 text-xs font-medium"
          />
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

      {/* Google Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-64 rounded-2xl border-2 border-slate-200 shadow-inner z-10 overflow-hidden relative bg-slate-100"
        style={{ minHeight: '260px' }}
      >
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 font-bold gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-red-800" />
            <span>Loading Google Maps...</span>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
        <span>📍 Type address above or click/drag Google Maps pin for exact location delivery.</span>
      </p>
    </div>
  )
}
