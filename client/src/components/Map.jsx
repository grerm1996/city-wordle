import React, { useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";

const SimpleMap = (props) => {
  const mapRef = useRef(null);

  useEffect(() => {
    // Ensure that mapRef and map instance are available before calling invalidateSize
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  }, [props.gameOver]); // Run the effect whenever the coordinates change

  return (
    <MapContainer
      center={[props.lat, props.lng]}
      zoom={6}
      ref={mapRef}
      style={{ height: "40vh", width: "60vw" }}
      scrollWheelZoom={false}
      key={props.mapkey}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[props.lat, props.lng]}></Marker>
    </MapContainer>
  );
};

export default SimpleMap;
