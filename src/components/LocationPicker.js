"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Crosshair, X } from "lucide-react";

export default function LocationPicker({ onLocationSelect, initialLocation }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markerRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "raster-tiles": {
            type: "raster",
            tiles: [
              "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [
          {
            id: "simple-tiles",
            type: "raster",
            source: "raster-tiles",
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: initialLocation 
        ? [initialLocation.longitude, initialLocation.latitude]
        : [6.849333873954452, 52.23976429840288],
      zoom: initialLocation ? 16 : 15,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    // Add click handler to map
    map.current.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      setSelectedLocation({ longitude: lng, latitude: lat });
      if (onLocationSelect) {
        onLocationSelect({ longitude: lng, latitude: lat });
      }
    });

    // Add initial marker if location provided
    if (initialLocation) {
      addMarker(initialLocation.longitude, initialLocation.latitude);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const addMarker = (lng, lat) => {
    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Create marker element
    const el = document.createElement("div");
    el.className = "w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg cursor-pointer";
    el.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white text-xs">📍</div>`;

    markerRef.current = new maplibregl.Marker({
      element: el,
      anchor: "center",
    })
      .setLngLat([lng, lat])
      .addTo(map.current);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsGettingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        const location = { longitude, latitude };
        
        setSelectedLocation(location);
        if (onLocationSelect) {
          onLocationSelect(location);
        }

        // Update map center and add marker
        if (map.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 16,
            duration: 1000,
          });
          addMarker(longitude, latitude);
        }

        setIsGettingLocation(false);
      },
      (err) => {
        setError(`Unable to get your location: ${err.message}`);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Update marker when selectedLocation changes
  useEffect(() => {
    if (selectedLocation && map.current) {
      addMarker(selectedLocation.longitude, selectedLocation.latitude);
    }
  }, [selectedLocation]);

  const handleClearLocation = () => {
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    setSelectedLocation(null);
    if (onLocationSelect) {
      onLocationSelect(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Location (Optional)
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Crosshair className={`h-3.5 w-3.5 ${isGettingLocation ? "animate-spin" : ""}`} />
            {isGettingLocation ? "Getting..." : "Use Current"}
          </button>
          {selectedLocation && (
            <button
              type="button"
              onClick={handleClearLocation}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear location"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-2 text-xs text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      <div className="relative">
        <div
          ref={mapContainer}
          className="w-full h-48 sm:h-64 rounded-lg border border-gray-300 overflow-hidden"
          style={{ minHeight: "192px" }}
        />
        {selectedLocation && (
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-gray-700">
            📍 Location selected
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {selectedLocation
          ? `Location: ${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`
          : "Click on the map to mark a location, or use your current location"}
      </p>
    </div>
  );
}
