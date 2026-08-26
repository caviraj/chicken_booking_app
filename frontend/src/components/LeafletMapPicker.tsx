import React, { useEffect, useRef, useState } from 'react'
import { Navigation, Loader2, MapPin } from 'lucide-react'

declare const L: any

interface LeafletMapPickerProps {
  onLocationSelect: (address: string, lat: number, lng: number) => void
  initialLat?: number
  initialLng?: number
}

export const LeafletMapPicker: React.FC<LeafletMapPickerProps> = ({
  onLocationSelect,
  initialLat = 11.063737820050445,
  initialLng = 77.79459634396372
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const accuracyCircleRef = useRef<any>(null)

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
          onLocationSelect(data.display_name, lat, lng)
          return
        }
      }
      const fallback = `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      onLocationSelect(fallback, lat, lng)
    } catch (err) {
      const fallback = `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      onLocationSelect(fallback, lat, lng)
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
        const { latitude, longitude, accuracy } = position.coords
        setLocating(false)

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, { animate: true, duration: 1.2 })
          markerRef.current.setLatLng([latitude, longitude])

          // Draw/update GPS accuracy circle
          if (accuracyCircleRef.current) {
            mapInstanceRef.current.removeLayer(accuracyCircleRef.current)
          }
          if (accuracy && accuracy < 5000 && typeof L !== 'undefined') {
            accuracyCircleRef.current = L.circle([latitude, longitude], {
              radius: accuracy,
              color: '#2563eb',
              fillColor: '#3b82f6',
              fillOpacity: 0.12,
              weight: 1.5
            }).addTo(mapInstanceRef.current)
          }

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

      // 1. OpenStreetMap Standard HD Tiles (100% reliable, crisp colored roads and street labels)
      const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      })

      // 2. Google Maps Standard Tiles (contains ALL Google landmarks, businesses, shops, and street POIs)
      const googleRoadmap = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps'
      })

      // 3. Google Maps Hybrid Satellite Tiles (with landmark labels)
      const googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps'
      })

      // Add default vibrant OpenStreetMap layer
      osmStandard.addTo(map)

      // Layer control switcher for standard/satellite/carto
      const baseMaps = {
        'OpenStreetMap (Vibrant Streets)': osmStandard,
        'Google Maps (Roadmap)': googleRoadmap,
        'Google Satellite': googleHybrid
      }
      L.control.layers(baseMaps).addTo(map)

      // --- Shop Marker: FreshMeat Shop Origin Point (11.063738, 77.794596) ---
      const shopPos = [11.063737820050445, 77.79459634396372]
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
      // Automatically trigger GPS Auto-Locate on map load
      setTimeout(() => {
        handleLocateMe()
      }, 500)
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
      {/* Map Header Action Bar with Locate Me GPS Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <MapPin className="w-4 h-4 text-red-800 shrink-0" />
          <span>Select Delivery Location on Map</span>
        </div>

        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="py-1.5 px-3 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
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

      {/* Interactive Map Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full h-64 rounded-2xl border-2 border-slate-200 shadow-inner z-10 overflow-hidden relative"
        style={{ minHeight: '270px' }}
      ></div>

      <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
        <span>📍 Drag the red pin or tap anywhere on the map to set your exact location.</span>
      </p>
    </div>
  )
}
