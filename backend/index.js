const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('/opensky/api/states/all', async (req, res) => {
    try {
        const response = await axios.get('https://opensky-network.org/api/states/all', {
            params: req.query
        });
        res.json(response.data);
        // console.log("파싱된 정보: " , res);
    } catch (error) {
        console.error('OpenSky API 프록시 실패:', error.message);
        res.status(500).json({ error: 'OpenSky API 요청 실패' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const normalizeFlight = (flight) => {
    const dep = flight?.departure || {};
    const arr = flight?.arrival || {};
    const live = flight?.live || {};

    return {
        flight_iata: flight?.flight?.iata || flight?.flight?.number || flight?.flight?.icao,
        airline: flight?.airline?.name,
        aircraft: flight?.aircraft?.icao || flight?.aircraft?.iata || flight?.aircraft?.registration,
        aircraft_reg: flight?.aircraft?.registration,
        status: flight?.flight_status,
        live: {
            latitude: live?.latitude,
            longitude: live?.longitude,
            altitude: live?.altitude,
            direction: live?.direction,
            speed: live?.speed_horizontal
        },
        departure: {
            airport: dep?.airport,
            city: dep?.city,
            time: dep?.scheduled,
            terminal: dep?.terminal,
            gate: dep?.gate,
            latitude: dep?.latitude,
            longitude: dep?.longitude
        },
        arrival: {
            airport: arr?.airport,
            city: arr?.city,
            time: arr?.scheduled,
            terminal: arr?.terminal,
            gate: arr?.gate,
            latitude: arr?.latitude,
            longitude: arr?.longitude
        }
    };
};

app.get('/api/flight', async (req, res) => {
    const { flight_iata, limit = 100, offset = 0, flight_status } = req.query;
    console.log("flight_iata 요청 받음:", flight_iata);

    if (!flight_iata) {
        console.log("flight list 요청 - limit:", limit, "offset:", offset);
    }

    if (!process.env.AVIATIONSTACK_API_KEY) {
        console.error("AVIATIONSTACK_API_KEY가 설정되지 않았습니다.");
        return res.status(503).json({ error: "서버 API 키가 구성되지 않았습니다." });
    }

    try {
        const params = {
            access_key: process.env.AVIATIONSTACK_API_KEY,
            limit,
            offset
        };

        if (flight_iata) {
            params.flight_iata = flight_iata;
        }

        if (flight_status) {
            params.flight_status = flight_status;
        }

        const response = await axios.get('https://api.aviationstack.com/v1/flights', { params });
        const flights = response.data?.data || [];

        if (flight_iata) {
            const flight = flights[0];
            if (!flight) {
                return res.status(404).json({ error: "Flight not found" });
            }
            return res.json(normalizeFlight(flight));
        }

        const normalizedFlights = flights.map(normalizeFlight);
        res.json(normalizedFlights);

    } catch (err) {
        console.error("API 요청 오류:", err.message);
        res.status(500).json({ error: "API 요청 실패" });
    }
});

app.get('/api/weather', async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: "query 파라미터가 필요합니다." });
    }

    if (!process.env.WEATHER_API_KEY) {
        console.error("WEATHER_API_KEY가 설정되지 않았습니다.");
        return res.status(503).json({ error: "날씨 API 키가 구성되지 않았습니다." });
    }

    try {
        const response = await axios.get('http://api.weatherapi.com/v1/current.json', {
            params: {
                key: process.env.WEATHER_API_KEY,
                q: query,
                aqi: 'no'
            }
        });

        res.json(response.data);
    } catch (err) {
        console.error("날씨 API 요청 오류:", err.message);
        res.status(500).json({ error: "날씨 정보를 가져올 수 없습니다." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running ${PORT}`);
});
