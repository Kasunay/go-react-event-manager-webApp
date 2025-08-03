// src/components/MapComponent.tsx
import React from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

interface MapComponentProps {
  latitude: number;
  longitude: number;
  locationName: string;
}

const containerStyle = {
  width: '100%',
  height: '400px' // Adjust height as needed
};

const MapComponent: React.FC<MapComponentProps> = ({ latitude, longitude, locationName }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_Maps_API_KEY as string, // Access API key from .env
  });

  const center = React.useMemo(() => ({
    lat: latitude,
    lng: longitude
  }), [latitude, longitude]);

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading Map...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15} // Adjust zoom level as needed
      options={{
        disableDefaultUI: true, // Disable default UI controls if you want custom ones
        zoomControl: true,
      }}
    >
      <Marker position={center} title={locationName} />
    </GoogleMap>
  );
};

export default MapComponent;