import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import twilio from 'twilio';
import axios from 'axios';

dotenv.config();

const app: Express = express();
const port = process.env.PORT;
const accountSid = process.env.ACCOUNTID;
const authToken = process.env.AUTHTOKEN;

app.use(express.urlencoded({ extended: true }));

async function getAirQuality(lat: number, lon: number) {
  const apiKey = process.env.OPENWEATHERMAPAPI;
  const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  const response = await axios.get(url);
  console.log(`OpenWeather API data: ${JSON.stringify(response.data, null, 2)}`);
  const airQualityIndex = response.data.list[0].main.aqi;
  return airQualityIndex;
}

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

const MessagingResponse = twilio.twiml.MessagingResponse;

app.post('/incoming', async (req, res) => {
  const message = req.body;
  console.log(`message: ${JSON.stringify(message, null, 2)}`); // Use JSON.stringify to print the object
  // Example of message if sending location from whatsapp:
  // [1] BC_DEBUG message: {
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

  const {Latitude, Longitude, From, Body} = message;
  const airQualityIndex = await getAirQuality(Latitude, Longitude);
  console.log(`Air quality index in your places is ${airQualityIndex}`);
  const twiml = new MessagingResponse();
  twiml.message(`You said: ${message.Body}`);
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
