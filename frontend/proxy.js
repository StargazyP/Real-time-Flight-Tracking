// proxy.js
import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(cors());

const username = 'jdajsl0415@naver.com';
const password = 'Blackser7789'; // 👉 향후 .env로 분리 추천

app.get('/opensky', async (req, res) => {
  try {
    const response = await axios.get(
      'http://opensky-network.org/api/states/all?lamin=33&lamax=39.5&lomin=124.5&lomax=131.5',
      { auth: { username, password } }
    );
    res.json(response.data);
  } catch (err) {
    console.error('OpenSky 프록시 오류:', err.message);
    res.status(err.response?.status || 500).send('프록시 오류 발생');
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ OpenSky 프록시 서버 실행: http://localhost:${PORT}/opensky`);
});
