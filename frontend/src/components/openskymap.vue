<template>
  <div class="map-wrapper">
    <l-map ref="mapRef" class="map" :zoom="7" :center="[36.5, 127.5]" 
    :zoomAnimation="false"@ready="onMapReady">
      <l-tile-layer :url="tileUrl" :attribution="tileAttribution" />
    </l-map>

    <div
      v-if="selectedFlight && (weatherInfo || weatherLoading || weatherError)"
      class="weather-widget"
    >
      <div class="weather-header">
        <div class="label">Weather</div>
        <div class="location">
          {{ weatherInfo?.location?.name || selectedFlight.arrival?.city || selectedFlight.departure?.city || 'Unknown' }}
        </div>
      </div>

      <div v-if="weatherLoading" class="weather-loading">날씨 정보를 불러오는 중...</div>
      <div v-else-if="weatherError" class="weather-error">{{ weatherError }}</div>

      <div v-else class="weather-body">
        <div class="temp-block">
          <div class="temp">
            {{ Math.round(weatherInfo.current?.temp_c ?? 0) }}<span>°C</span>
          </div>
          <div class="feels-like">
            체감 {{ Math.round(weatherInfo.current?.feelslike_c ?? 0) }}°C
          </div>
        </div>
        <div class="conditions">
          <div class="condition-text">{{ weatherInfo.current?.condition?.text }}</div>
          <div class="metrics">
            <span>습도 {{ weatherInfo.current?.humidity ?? '-' }}%</span>
            <span>풍속 {{ weatherInfo.current?.wind_kph ?? '-' }} km/h</span>
          </div>
          <div class="metrics">
            <span>기압 {{ weatherInfo.current?.pressure_mb ?? '-' }} mb</span>
            <span>가시거리 {{ weatherInfo.current?.vis_km ?? '-' }} km</span>
          </div>
        </div>
      </div>
    </div>

    <transition name="slide">
      <div v-if="selectedFlight" class="flight-card">
        <div class="card-header">
          <div>
            <div class="flight-tag">{{ selectedFlight.flight_iata }}</div>
            <div class="airline-name">{{ selectedFlight.airline || '항공사 정보 없음' }}</div>
          </div>
          <span class="status-badge" :class="statusClass(selectedFlight.status)">
            {{ selectedFlight.status || 'UNKNOWN' }}
          </span>
        </div>

        <div class="aircraft-meta">
          <div>
            <div class="label">Aircraft</div>
            <div class="value">{{ selectedFlight.aircraft || 'N/A' }}</div>
          </div>
          <div>
            <div class="label">Registration</div>
            <div class="value">{{ selectedFlight.aircraft_reg || '-' }}</div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-row">
            <div class="city">
              <span class="tag dep">DEP</span>
              <div>
                <div class="airport">{{ selectedFlight.departure.city || '-' }}</div>
                <div class="meta">{{ selectedFlight.departure.airport || '공항 정보 없음' }}</div>
              </div>
            </div>
            <div class="time-block">
              <div class="label">Scheduled</div>
              <div class="value">{{ selectedFlight.departure.time || '-' }}</div>
            </div>
          </div>

          <div class="detail-row">
            <div class="city">
              <span class="tag arr">ARR</span>
              <div>
                <div class="airport">{{ selectedFlight.arrival.city || '-' }}</div>
                <div class="meta">{{ selectedFlight.arrival.airport || '공항 정보 없음' }}</div>
              </div>
            </div>
            <div class="time-block">
              <div class="label">Scheduled</div>
              <div class="value">{{ selectedFlight.arrival.time || '-' }}</div>
            </div>
          </div>
        </div>

        <div class="live-stats" v-if="selectedFlight.live">
          <div>
            <div class="label">Altitude</div>
            <div class="value">{{ formatAltitude(selectedFlight.live.altitude) }}</div>
          </div>
          <div>
            <div class="label">Speed</div>
            <div class="value">{{ formatSpeed(selectedFlight.live.speed) }}</div>
          </div>
          <div>
            <div class="label">Heading</div>
            <div class="value">{{ formatHeading(selectedFlight.live.direction) }}</div>
          </div>
        </div>

        <div class="location-info" v-if="selectedFlight.live && selectedFlight.live.latitude && selectedFlight.live.longitude">
          <div class="location-header">
            <div class="label">📍 현재 위치</div>
          </div>
          <div class="location-details">
            <div class="location-row">
              <div class="location-label">위도 (Latitude)</div>
              <div class="location-value">{{ selectedFlight.live.latitude.toFixed(6) }}°</div>
            </div>
            <div class="location-row">
              <div class="location-label">경도 (Longitude)</div>
              <div class="location-value">{{ selectedFlight.live.longitude.toFixed(6) }}°</div>
            </div>
            <div class="location-row">
              <div class="location-label">좌표 (복사)</div>
              <button class="copy-btn" @click="copyCoordinates">복사</button>
            </div>
          </div>
        </div>

        <button class="close-btn" @click="clearFlightSelection">닫기</button>
      </div>
    </transition>
  </div>
</template>

<script>
import { LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";
import axios from "axios";
import L from "leaflet";
import "leaflet-rotatedmarker";
import airIconImg from "../assets/airplane.png";

const airplaneIcon = L.icon({
  iconUrl: airIconImg,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

export default {
  components: { LMap, LTileLayer },
  data() {
    return {
      mapInstance: null,
      markerMap: new Map(),
      tileUrl: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      tileAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      timer: null,
      selectedFlight: null,
      flightPath: null,
      depMarker: null,
      arrMarker: null,
      weatherInfo: null,
      weatherLoading: false,
      weatherError: null
    };
  },
  methods: {
    buildTooltip(flight, live) {
      const callsign = flight.flight_iata || "알 수 없음";
      const airline = flight.airline || "알 수 없음";
      const status = flight.status || "정보 없음";
      const altitude = live?.altitude ? `${Math.round(live.altitude)} ft` : "정보 없음";
      const speed = live?.speed ? `${Math.round(live.speed)} kt` : "정보 없음";
      const depCity = flight.departure?.city || "-";
      const arrCity = flight.arrival?.city || "-";

      return `<strong>${callsign}</strong><br/>항공사: ${airline}<br/>상태: ${status}<br/>출발: ${depCity}<br/>도착: ${arrCity}<br/>고도: ${altitude}<br/>속도: ${speed}`;
    },
    statusClass(status) {
      const normalized = (status || "").toLowerCase();
      if (normalized.includes("active") || normalized.includes("en-route")) return "status-active";
      if (normalized.includes("scheduled")) return "status-scheduled";
      if (normalized.includes("landed")) return "status-landed";
      if (normalized.includes("cancelled")) return "status-cancelled";
      return "status-unknown";
    },
    formatAltitude(value) {
      if (value == null) return "-";
      return `${Math.round(value).toLocaleString()} ft`;
    },
    formatSpeed(value) {
      if (value == null) return "-";
      return `${Math.round(value)} kt`;
    },
    formatHeading(value) {
      if (value == null) return "-";
      return `${Math.round(value)}°`;
    },
    copyCoordinates() {
      if (!this.selectedFlight?.live?.latitude || !this.selectedFlight?.live?.longitude) return;
      
      const coords = `${this.selectedFlight.live.latitude.toFixed(6)}, ${this.selectedFlight.live.longitude.toFixed(6)}`;
      
      // 클립보드에 복사
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(coords).then(() => {
          alert(`좌표가 복사되었습니다: ${coords}`);
        }).catch(err => {
          console.error('복사 실패:', err);
          // Fallback: 텍스트 영역 사용
          this.fallbackCopyText(coords);
        });
      } else {
        // Fallback: 텍스트 영역 사용
        this.fallbackCopyText(coords);
      }
    },
    fallbackCopyText(text) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert(`좌표가 복사되었습니다: ${text}`);
      } catch (err) {
        console.error('복사 실패:', err);
        alert(`좌표: ${text}\n(수동으로 복사해주세요)`);
      }
      document.body.removeChild(textArea);
    },
    clearFlightSelection() {
      this.selectedFlight = null;
      if (this.flightPath) {
        this.mapInstance.removeLayer(this.flightPath);
        this.flightPath = null;
      }
      if (this.depMarker) {
        this.mapInstance.removeLayer(this.depMarker);
        this.depMarker = null;
      }
      if (this.arrMarker) {
        this.mapInstance.removeLayer(this.arrMarker);
        this.arrMarker = null;
      }
      this.weatherInfo = null;
      this.weatherError = null;
    },
    onMapReady(map) {
      this.mapInstance = map;
      this.fetchPlanes();
      this.timer = setInterval(this.fetchPlanes, 60000);
    },
    animateMarker(marker, targetLatLng, heading) {
      const frames = 30;
      const start = marker.getLatLng();
      let frame = 0;
      const animate = () => {
        frame++;
        const lat = start.lat + (targetLatLng[0] - start.lat) * (frame / frames);
        const lng = start.lng + (targetLatLng[1] - start.lng) * (frame / frames);
        marker.setLatLng([lat, lng]);
        marker.setRotationAngle(heading);
        if (frame < frames) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    },
    async fetchFlightDetails(flight_iata) {
      if (!flight_iata || this.selectedFlight?.flight_iata === flight_iata) return;
      try {
        const res = await axios.get('/api/flight', { params: { flight_iata } });
        const flight = res.data;
        this.selectedFlight = flight;
        this.fetchWeatherByFlight(flight);

        const depLat = flight.departure?.latitude;
        const depLng = flight.departure?.longitude;
        const arrLat = flight.arrival?.latitude;
        const arrLng = flight.arrival?.longitude;

        if (
          depLat == null ||
          depLng == null ||
          arrLat == null ||
          arrLng == null
        ) {
          console.warn("출발지 또는 도착지 좌표 없음");
          return;
        }

        if (this.flightPath) this.mapInstance.removeLayer(this.flightPath);
        if (this.depMarker) this.mapInstance.removeLayer(this.depMarker);
        if (this.arrMarker) this.mapInstance.removeLayer(this.arrMarker);

        this.flightPath = L.polyline([[depLat, depLng], [arrLat, arrLng]], {
          color: "blue",
          weight: 3,
          dashArray: "6, 6"
        }).addTo(this.mapInstance);

        this.depMarker = L.marker([depLat, depLng], {
          icon: L.divIcon({ className: 'airport-marker', html: '🛫' })
        }).addTo(this.mapInstance);

        this.arrMarker = L.marker([arrLat, arrLng], {
          icon: L.divIcon({ className: 'airport-marker', html: '🛬' })
        }).addTo(this.mapInstance);

        setTimeout(() => {
          this.mapInstance.fitBounds([[depLat, depLng], [arrLat, arrLng]]);
        }, 50);
      } catch (e) {
        console.error("상세 정보 조회 실패:", e);
        alert("조회 할 수 없는 항공기 입니다.");
        this.selectedFlight = null;
      }
    },
    async fetchWeatherByFlight(flight) {
      const city = flight?.arrival?.city || flight?.arrival?.airport || flight?.departure?.city || flight?.departure?.airport;
      if (!city) {
        this.weatherInfo = null;
        this.weatherError = "도시 정보를 찾을 수 없습니다.";
        return;
      }

      this.weatherLoading = true;
      this.weatherError = null;

      try {
        const res = await axios.get('/api/weather', { params: { query: city } });
        this.weatherInfo = res.data;
      } catch (error) {
        console.error("날씨 정보 로드 실패:", error);
        this.weatherError = "날씨 정보를 가져올 수 없습니다.";
        this.weatherInfo = null;
      } finally {
        this.weatherLoading = false;
      }
    },

    async fetchPlanes() {
      try {
        const res = await axios.get("/api/flight", {
          params: {
            limit: 100,
            flight_status: "active"
          }
        });

        const flights = Array.isArray(res.data) ? res.data : [];
        const activeFlightSet = new Set();

        flights.forEach((flight) => {
          const live = flight.live || {};
          if (live.latitude == null || live.longitude == null) return;

          const markerKey = flight.flight_iata || flight.aircraft_reg;
          if (!markerKey) return;

          const latlng = [live.latitude, live.longitude];
          const heading = live.direction || 0;

          activeFlightSet.add(markerKey);

          if (this.markerMap.has(markerKey)) {
            const marker = this.markerMap.get(markerKey);
            this.animateMarker(marker, latlng, heading);
          } else {
            const marker = L.marker(latlng, {
              icon: airplaneIcon,
              rotationAngle: heading,
              rotationOrigin: "center",
              interactive: true
            });

            marker.bindTooltip(this.buildTooltip(flight, live), {
              direction: "top",
              permanent: false,
              sticky: true
            });

            marker.on("click", (e) => {
              // 마커의 위치 정보 저장
              const latlng = marker.getLatLng();
              if (flight.live) {
                flight.live.latitude = latlng.lat;
                flight.live.longitude = latlng.lng;
              } else {
                flight.live = { latitude: latlng.lat, longitude: latlng.lng };
              }
              
              if (flight.flight_iata) {
                this.fetchFlightDetails(flight.flight_iata);
              }
            });

            marker.addTo(this.mapInstance);
            this.markerMap.set(markerKey, marker);
          }
        });

        this.markerMap.forEach((marker, key) => {
          marker.setOpacity(activeFlightSet.has(key) ? 1 : 0.3);
        });

        console.log("항공기 수신 완료:", flights.length);
      } catch (e) {
        console.error("항공기 정보 로드 실패:", e);
      }
    }
  },
  beforeUnmount() {
    clearInterval(this.timer);
    this.markerMap.forEach(marker => marker.remove());
    this.markerMap.clear();
  }
};
</script>

<style scoped>
.map-wrapper {
  position: relative;
  height: 100%;
}
.map {
  height: 100%;
}
.flight-card {
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  background: white;
  border-left: 1px solid #ccc;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  overflow-y: auto;
  z-index: 999;
}
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
.airport-marker {
  font-size: 18px;
  font-weight: bold;
}
.weather-widget {
  position: absolute;
  left: 16px;
  bottom: 16px;
  width: 280px;
  background: rgba(255, 255, 255, 0.9);
  color: #111;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(6px);
  z-index: 1500;
  pointer-events: auto;
}
.weather-header {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 8px;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.8px;
  color: rgba(0, 0, 0, 0.6);
}
.weather-header .location {
  text-transform: none;
  font-size: 13px;
  color: #111;
}
.weather-body {
  display: flex;
  gap: 12px;
  align-items: center;
}
.temp-block {
  text-align: center;
}
.temp {
  font-size: 40px;
  font-weight: 700;
  line-height: 1;
}
.temp span {
  font-size: 16px;
  font-weight: 500;
}
.feels-like {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}
.conditions {
  flex: 1;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.75);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.condition-text {
  font-weight: 600;
}
.metrics {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
}
.weather-loading,
.weather-error {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}
.flight-card {
  position: absolute;
  top: 0;
  right: 0;
  width: 320px;
  height: 100%;
  background: rgba(15, 15, 15, 0.92);
  color: #f0f0f0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: -12px 0 24px rgba(0, 0, 0, 0.45);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.flight-tag {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #ffffff;
}
.airline-name {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
  letter-spacing: 0.3px;
}
.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}
.status-active {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.5);
}
.status-scheduled {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.35);
}
.status-landed {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.25);
}
.status-cancelled {
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.status-unknown {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.aircraft-meta {
  display: flex;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px;
  gap: 12px;
}
.label {
  font-size: 11px;
  letter-spacing: 0.6px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
}
.value {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}
.detail-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
  gap: 8px;
}
.city {
  display: flex;
  gap: 10px;
  align-items: center;
}
.tag {
  font-size: 12px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 999px;
  color: #0f172a;
}
.tag.dep {
  background: rgba(255, 255, 255, 0.9);
}
.tag.arr {
  background: rgba(0, 0, 0, 0.8);
  color: #ffffff;
}
.airport {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}
.meta {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
}
.time-block {
  text-align: right;
}
.live-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.3);
}
.close-btn {
  margin-top: auto;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  color: #ffffff;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}
.location-info {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
  margin-top: 8px;
}
.location-header {
  margin-bottom: 12px;
}
.location-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.location-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.location-row:last-child {
  border-bottom: none;
}
.location-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.location-value {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  font-family: 'Courier New', monospace;
}
.copy-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}
.copy-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}
</style>
