import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import twilio from 'twilio';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app: Express = express();
const port = process.env.PORT;
const accountSid = process.env.ACCOUNTID;
const authToken = process.env.AUTHTOKEN;

const geminiAPIKey = process.env.GEMINIAPIKEY as string;
const genAI = new GoogleGenerativeAI(geminiAPIKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


async function getAirQuality(lat: number, lon: number) {
  const apiKey = process.env.OPENWEATHERMAPAPI;
  const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  const response = await axios.get(url);
  // console.log(`OpenWeather API data: ${JSON.stringify(response.data, null, 2)}`);
  // [1] OpenWeather API data: {
  //   [1]   "coord": {
  //   [1]     "lon": xxx,
  //   [1]     "lat": xxx
  //   [1]   },
  //   [1]   "list": [
  //   [1]     {
  //   [1]       "main": {
  //   [1]         "aqi": 1
  //   [1]       },
  //   [1]       "components": {
  //   [1]         "co": xxx,
  //   [1]         "no": xxx,
  //   [1]         "no2": xxx,
  //   [1]         "o3": xxx,
  //   [1]         "so2": 1.46,
  //   [1]         "pm2_5": 2.52,
  //   [1]         "pm10": 5.8,
  //   [1]         "nh3": 0.35
  //   [1]       },
  //   [1]       "dt": xxxxxxxx
  //   [1]     }
  //   [1]   ]
  //   [1] }
    
  const airQualityIndex = response.data.list[0].main.aqi;
  return airQualityIndex;
}

const MessagingResponse = twilio.twiml.MessagingResponse;

const predictHazard = async (airQualityIndex: number) => {
  const prompt = `The air quality index is ${airQualityIndex}. The AQI scale is from 1 to 5, where 1 is good and 5 is very poor. Predict the potential hazard level and provide safety advice.`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
  return text;
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});


app.post('/incoming', async (req, res) => {
  const message = req.body;
  // console.log(`message: ${JSON.stringify(message, null, 2)}`); // Use JSON.stringify to print the object
  // Example of message if sending location from whatsapp:
  // [1] message: {
  // [1]   "Latitude": "xxx",  //Blurred the location
  // [1]   "Longitude": "xxx", //Blurred the location
  // [1]   "SmsMessageSid": "xxx",
  // [1]   "NumMedia": "0",
  // [1]   "ProfileName": "xxx",
  // [1]   "MessageType": "location",
  // [1]   "SmsSid": "xxx",
  // [1]   "WaId": "xxx",
  // [1]   "SmsStatus": "received",
  // [1]   "Body": "",
  // [1]   "To": "whatsapp:+xxx",
  // [1]   "NumSegments": "1",
  // [1]   "ReferralNumMedia": "0",
  // [1]   "MessageSid": "xxx",
  // [1]   "AccountSid": "xxx",
  // [1]   "From": "whatsapp:+xxx",
  // [1]   "ApiVersion": "2010-04-01"
  // [1] }

  const {From, Body} = message;
  // console.log(Latitude, Longitude);
  // const airQualityIndex = await getAirQuality(Latitude, Longitude);
  // console.log("airQuality", airQualityIndex);

  // const alert = await predictHazard(airQualityIndex);

  const twiml = new MessagingResponse();
  twiml.message(From + "said: " + Body + ". This is for AS blue testing.");

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
