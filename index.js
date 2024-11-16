const express = require('express');
const axios = require('axios');
const app = express();
const port = 8000;

// Configurable Variables
const username = 'antoine';
const password = '123!'; // Replace with your actual password
const server = 'https://digimidi.fmcloud.fm';
const database = 'DIGIMIDI_DEV';
const layout = 'dcm4chee';
const script = 'dcm4chee_studyURL';

// Middleware to parse JSON
app.use(express.json());

// Function to log details
function logDetails(message, data) {
    console.log(`\n=== ${message} ===`);
    console.log(data);
    console.log('====================\n');
}

// Function to login to FileMaker
async function loginToFileMaker() {
    const loginUrl = `${server}/fmi/data/v1/databases/${database}/sessions`;
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    try {
        const response = await axios.post(loginUrl, {}, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
            }
        });
        logDetails('FileMaker Login Success', response.data.response.token);
        return response.data.response.token;
    } catch (error) {
        logDetails('FileMaker Login Failed', error.response ? error.response.data : error.message);
        throw new Error('Login failed');
    }
}

// Function to create a record in FileMaker
async function createRecord(token, layout, jsonData) {
    const createUrl = `${server}/fmi/data/v1/databases/${database}/layouts/${layout}/records`;
    try {
        logDetails('Creating Record in FileMaker', { Mirth_Json: JSON.stringify(jsonData) });
        const response = await axios.post(createUrl, { fieldData: { Mirth_Json: JSON.stringify(jsonData) } }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        logDetails('Record Creation Success', response.data.response);
        return response.data.response.recordId;
    } catch (error) {
        logDetails('Record Creation Failed', error.response ? error.response.data : error.message);
        throw new Error('Record creation failed');
    }
}

// Function to execute a script using GET request
async function executeScript(token, scriptName, parameter) {
    const scriptUrl = `${server}/fmi/data/v1/databases/${database}/layouts/${layout}/script/${scriptName}`;
    try {
        logDetails('Executing Script with Record ID (GET Method)', { scriptName, parameter });
        const response = await axios.get(scriptUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            params: {
                'script.param': parameter // Pass the recordId as a parameter
            }
        });
        logDetails('Script Execution Success', response.data.response);
        return response.data.response;
    } catch (error) {
        logDetails('Script Execution Failed', error.response ? error.response.data : error.message);
        throw new Error('Script execution failed');
    }
}

// Route to handle POST requests
app.post('/dcm4chee-api', async (req, res) => {
    try {
        logDetails('Incoming Request Data', req.body);

        const token = await loginToFileMaker();
        const data = req.body;

        // Step 1: Create a record in FileMaker
        const recordId = await createRecord(token, layout, data);
        logDetails('Record ID Created', recordId);

        // Step 2: Execute the script with the record ID (GET method)
        const scriptResponse = await executeScript(token, script, recordId);
        logDetails('Script Triggered Successfully', scriptResponse);

        res.send({ message: 'Script triggered successfully', scriptResponse });
    } catch (error) {
        logDetails('Error Processing Request', error.message);
        res.status(500).send('Error processing request');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
