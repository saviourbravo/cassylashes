require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({
  origin: "https://silly-platypus-85d501.netlify.app/"
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const API_KEY = process.env.TEXTBEE_API_KEY;
const DEVICE_ID = process.env.TEXTBEE_DEVICE_ID;
const BUSINESS_PHONE = '+233244057470';

// Debug startup check
console.log('TEXTBEE API KEY:', API_KEY ? 'Loaded ✅' : 'Missing ❌');
console.log('TEXTBEE DEVICE ID:', DEVICE_ID ? 'Loaded ✅' : 'Missing ❌');

app.post('/api/book', async (req, res) => {
  try {
    const { name, phone, date, time, service } = req.body;

    // Validate form fields
    if (!name || !phone || !date || !time || !service) {
      return res.status(400).json({
        success: false,
        message: 'All booking fields are required.',
      });
    }

    // Validate env vars
    if (!API_KEY || !DEVICE_ID) {
      console.error('Missing TextBee credentials in .env');

      return res.status(500).json({
        success: false,
        message: 'Server configuration error.',
      });
    }

    const smsMessage = `New Booking Request
Name: ${name}
Phone: ${phone}
Service: ${service}
Date: ${date}
Time: ${time}`;

    console.log('Sending booking SMS...');
    console.log({
      to: BUSINESS_PHONE,
      message: smsMessage,
    });

    const response = await axios.post(
      `https://api.textbee.dev/api/v1/gateway/devices/${DEVICE_ID}/send-sms`,
      {
        recipients: [BUSINESS_PHONE],
        message: smsMessage,
      },
      {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('TextBee Success:', response.data);

    return res.status(200).json({
      success: true,
      message: 'Booking submitted successfully.',
      sms: response.data,
    });
  } catch (error) {
    console.error('FULL BOOKING ERROR:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to submit booking.',
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>{
  console.log('Server running on port ${PORT}');
})