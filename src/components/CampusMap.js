"use client";

import { useEffect, useRef, useMemo, useCallback } from "react";
import { memo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const CampusMap = memo(function CampusMap({ posts, selectedPostId, onMarkerClick, onMapClick }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const isInitialized = useRef(false);
  const initialBoundsSet = useRef(false);
  const previousPostsCount = useRef(0);

  // Memoize posts with locations to prevent unnecessary recalculations
  const postsWithLocations = useMemo(() => {
    return posts.filter((post) => post.location && post.location.latitude && post.location.longitude);
  }, [posts]);

  // Initialize map only once
  useEffect(() => {
    if (!mapContainer.current || isInitialized.current) return;

    // Wait a bit to ensure container has dimensions (especially on mobile)
    const initTimer = setTimeout(() => {
      if (!mapContainer.current) return;

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
        center: [6.849333873954452, 52.23976429840288],
        zoom: 15,
      });

      // Add navigation controls with better mobile support
      const nav = new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: false,
      });
      map.current.addControl(nav, "top-right");
      
      // Improve touch interactions on mobile
      map.current.getCanvas().style.touchAction = "manipulation";

      // Resize map when it becomes visible (important for mobile)
      map.current.on("load", () => {
        if (map.current) {
          map.current.resize();
        }
      });

      isInitialized.current = true;
    }, 100);

    return () => {
      clearTimeout(initTimer);
      if (map.current) {
        map.current.remove();
        map.current = null;
        isInitialized.current = false;
      }
    };
  }, []); // Only run once on mount

  // Resize map when container becomes visible (for mobile toggle)
  useEffect(() => {
    if (!map.current || !isInitialized.current) return;

    // Use IntersectionObserver to detect when container becomes visible
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && map.current) {
            // Container is visible, resize map and ensure markers are visible
            setTimeout(() => {
              if (map.current && mapContainer.current) {
                const rect = mapContainer.current.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  map.current.resize();
                  
                  // Force marker visibility by re-adding them
                  if (markersRef.current.length > 0) {
                    const bounds = new maplibregl.LngLatBounds();
                    markersRef.current.forEach((marker) => {
                      bounds.extend(marker.getLngLat());
                    });
                    if (!bounds.isEmpty()) {
                      map.current.fitBounds(bounds, {
                        padding: { top: 50, bottom: 50, left: 50, right: 50 },
                        maxZoom: 16,
                        duration: 0, // Instant for mobile
                      });
                    }
                  }
                }
              }
            }, 150);
          }
        });
      },
      { threshold: 0.1 }
    );

    // Use ResizeObserver to detect container size changes
    const resizeObserver = new ResizeObserver(() => {
      if (map.current && mapContainer.current) {
        const rect = mapContainer.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setTimeout(() => {
            if (map.current) {
              map.current.resize();
            }
          }, 50);
        }
      }
    });

    if (mapContainer.current) {
      intersectionObserver.observe(mapContainer.current);
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [postsWithLocations]); // Re-run when posts change

  // Update markers when posts change (but not on every render)
  useEffect(() => {
    if (!map.current || !isInitialized.current) return;

    // Create a map of existing markers by post ID
    const existingMarkers = new Map();
    markersRef.current.forEach((marker, index) => {
      const postId = marker._postId;
      if (postId) {
        existingMarkers.set(postId, { marker, index });
      }
    });

    // Get current post IDs
    const currentPostIds = new Set(postsWithLocations.map((p) => p.id));

    // Remove markers for posts that no longer exist
    const toRemove = [];
    existingMarkers.forEach(({ marker, index }, postId) => {
      if (!currentPostIds.has(postId)) {
        marker.remove();
        toRemove.push(index);
      }
    });
    // Remove from array in reverse order to maintain indices
    toRemove.sort((a, b) => b - a).forEach((index) => {
      markersRef.current.splice(index, 1);
    });

    // Add or update markers for current posts
    postsWithLocations.forEach((post) => {
      const existing = existingMarkers.get(post.id);
      
      if (existing) {
        // Update existing marker if selected state changed
        const marker = existing.marker;
        const el = marker.getElement();
        const isSelected = selectedPostId === post.id;
        
        // Update classes and fixed dimensions
        el.className = `rounded-full border-2 border-white shadow-lg cursor-pointer ${
          isSelected ? "bg-blue-600" : "bg-red-500"
        }`;
        
        // Fixed dimensions to prevent position shifting
        el.style.width = isSelected ? "40px" : "32px";
        el.style.height = isSelected ? "40px" : "32px";
        el.style.minWidth = isSelected ? "40px" : "32px";
        el.style.minHeight = isSelected ? "40px" : "32px";
        el.style.maxWidth = isSelected ? "40px" : "32px";
        el.style.maxHeight = isSelected ? "40px" : "32px";
        el.style.boxSizing = "border-box";
        el.style.borderRadius = "50%";
        el.style.zIndex = "10"; // Lower z-index than post card overlay
        
        // Preserve background image
        if (post.images && post.images.length > 0) {
          el.style.backgroundImage = `url(${post.images[0]})`;
          el.style.backgroundSize = "cover";
          el.style.backgroundPosition = "center";
          el.innerHTML = "";
        } else {
          el.style.backgroundImage = "none";
          el.innerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">${post.title.charAt(0).toUpperCase()}</div>`;
        }
        
        // Ensure marker position is still correct (re-set to be safe)
        marker.setLngLat([post.location.longitude, post.location.latitude]);
      } else {
        // Create new marker
        const el = document.createElement("div");
        const isSelected = selectedPostId === post.id;
        el.className = `rounded-full border-2 border-white shadow-lg cursor-pointer ${
          isSelected ? "bg-blue-600" : "bg-red-500"
        }`;
        
        // Fixed dimensions to prevent position shifting
        el.style.width = isSelected ? "40px" : "32px";
        el.style.height = isSelected ? "40px" : "32px";
        el.style.minWidth = isSelected ? "40px" : "32px";
        el.style.minHeight = isSelected ? "40px" : "32px";
        el.style.maxWidth = isSelected ? "40px" : "32px";
        el.style.maxHeight = isSelected ? "40px" : "32px";
        el.style.boxSizing = "border-box";
        el.style.position = "relative";
        el.style.zIndex = "10"; // Lower z-index than post card overlay
        
        el.style.backgroundImage = post.images && post.images.length > 0
          ? `url(${post.images[0]})`
          : "none";
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
        el.style.borderRadius = "50%";
        
        if (!post.images || post.images.length === 0) {
          el.innerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">${post.title.charAt(0).toUpperCase()}</div>`;
        }

        const marker = new maplibregl.Marker({
          element: el,
          anchor: "center", // Center anchor ensures marker stays at exact lat/lng
        })
          .setLngLat([post.location.longitude, post.location.latitude])
          .addTo(map.current);

        marker._postId = post.id; // Store post ID for tracking

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          if (onMarkerClick) {
            onMarkerClick(post.id);
          }
        });

        markersRef.current.push(marker);
      }
    });

    // Fit bounds to show all markers when posts are first loaded
    const currentPostsCount = markersRef.current.length;
    if (currentPostsCount > 0) {
      const bounds = new maplibregl.LngLatBounds();
      markersRef.current.forEach((marker) => {
        bounds.extend(marker.getLngLat());
      });
      
      // Fit bounds on initial load or when posts count changes from 0 to >0
      if (!initialBoundsSet.current || (previousPostsCount.current === 0 && currentPostsCount > 0)) {
        // Ensure map is resized before fitting bounds (important for mobile)
        if (map.current && mapContainer.current) {
          // Check if container is visible
          const rect = mapContainer.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            map.current.resize();
            
            // Small delay to ensure resize is complete
            setTimeout(() => {
              if (map.current && !bounds.isEmpty()) {
                map.current.fitBounds(bounds, {
                  padding: { top: 50, bottom: 50, left: 50, right: 50 },
                  maxZoom: 16,
                });
              }
            }, 200);
          } else {
            // Container not visible yet, try again later
            setTimeout(() => {
              if (map.current && mapContainer.current) {
                const newRect = mapContainer.current.getBoundingClientRect();
                if (newRect.width > 0 && newRect.height > 0) {
                  map.current.resize();
                  if (!bounds.isEmpty()) {
                    map.current.fitBounds(bounds, {
                      padding: { top: 50, bottom: 50, left: 50, right: 50 },
                      maxZoom: 16,
                    });
                  }
                }
              }
            }, 500);
          }
        }
        initialBoundsSet.current = true;
      }
    }
    
    previousPostsCount.current = currentPostsCount;
  }, [postsWithLocations, selectedPostId, onMarkerClick]);

  // Handle map click (update when callback changes)
  useEffect(() => {
    if (!map.current || !isInitialized.current || !onMapClick) return;

    const handleClick = () => {
      onMapClick();
    };

    map.current.on("click", handleClick);

    return () => {
      if (map.current) {
        map.current.off("click", handleClick);
      }
    };
  }, [onMapClick]);

  // Center map on selected post (only when selection changes)
  useEffect(() => {
    if (!map.current || !selectedPostId || !isInitialized.current) return;

    const selectedPost = postsWithLocations.find((p) => p.id === selectedPostId);
    if (selectedPost?.location) {
      map.current.flyTo({
        center: [selectedPost.location.longitude, selectedPost.location.latitude],
        zoom: 16,
        duration: 1000,
      });
    }
  }, [selectedPostId, postsWithLocations]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full relative"
      style={{ minHeight: "300px", width: "100%", height: "100%" }}
    />
  );
});

CampusMap.displayName = "CampusMap";

export default CampusMap;
