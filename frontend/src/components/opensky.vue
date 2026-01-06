<template>
    <div class="container">
      <h2>실시간 항공 정보 (OpenSky API)</h2>
      <button @click="fetchPlanes">새로고침</button>
      <ul v-if="planes.length > 0">
        <li v-for="(plane, index) in planes" :key="index">
          {{ index + 1 }}. {{ plane.callsign || 'N/A' }} -
          {{ plane.origin_country }} 위치 ({{ plane.latitude }}, {{ plane.longitude }}) 고도 {{ plane.baro_altitude }} m
        </li>
      </ul>
      <p v-else>로딩 중 또는 항공기 없음.</p>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        planes: [],
        timer: null
      };
    },
    methods: {
      async fetchPlanes() {
        try {
          const url = 'https://opensky-network.org/api/states/all?lamin=33&lamax=39.5&lomin=124.5&lomax=131.5'; // 한국 영역
          const res = await axios.get(url);
          const states = res.data.states || [];
          this.planes = states.map(s => ({
            icao24: s[0],
            callsign: s[1],
            origin_country: s[2],
            longitude: s[5],
            latitude: s[6],
            baro_altitude: s[7],
          }));
        } catch (err) {
          console.error("오류 발생:", err);
        }
      }
    },
    mounted() {
      this.fetchPlanes();
      this.timer = setInterval(this.fetchPlanes, 60000); // 10초마다 갱신
    },
    beforeUnmount() {
      clearInterval(this.timer);
    }
  };
  </script>
  
  <style scoped>
  .container {
    padding: 20px;
  }
  </style>
  