import React, { useRef } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const SimpleMap = (props) => {
  const mapRef = useRef(null);

  return (
    <MapContainer
      center={[props.lat, props.lng]}
      zoom={6}
      ref={mapRef}
      style={{ height: "40vh", width: "60vw" }}
      scrollWheelZoom={false}
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
