const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Parser } = require('hot-formula-parser');

const PORT = process.env.PORT || 8080;
// Retrieve the API Key from environment variables
const API_KEY = process.env.API_KEY;

/**
 * Utility to read and parse JSONC (JSON with comments) files
 */
function readJsoncSync(filePath) {
    try {
        const fullPath = path.join(__dirname, filePath);
        if (!fs.existsSync(fullPath)) return null;
        const content = fs.readFileSync(fullPath, 'utf8');
        const sanitized = content
            .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1')
            .trim();
        return JSON.parse(sanitized);
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err);
        return null;
    }
}

/**
 * Validates and sanitizes headers
 */
function sanitizeHeader(value) {
    if (!value) return '';
    return value.toString().replace(/[^\x20-\x7E]/g, '').trim();
}

/**
 * Main calculation logic
 */
function evaluateFormula(formula, format) {
    const parser = new Parser();
    const result = parser.parse(formula);

    if (result.error) {
        return { error: result.error };
    }

    let finalValue = result.result;
    if (format === 'Number' || format === 'float' || format === 'integer') {
        const num = parseFloat(finalValue);
        finalValue = isNaN(num) ? 0 : num;
    } else {
        finalValue = String(finalValue);
    }

    return { result: finalValue };
}

/**
 * Sends the asynchronous callback to Marketo using the updated schema
 */
async function sendCallback(callbackUrl, headers, payload) {
    const url = new URL(callbackUrl);
    const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-callback-token': sanitizeHeader(payload.token || headers['x-callback-token']),
            'x-api-key': sanitizeHeader(headers['x-api-key'])
        }
    };

    const req = https.request(options, (res) => {
        res.on('data', () => {}); // Consume stream
        res.on('end', () => console.log(`Callback sent. Status: ${res.statusCode}`));
    });

    req.on('error', (e) => console.error(`Callback error: ${e.message}`));
    req.write(JSON.stringify(payload));
    req.end();
}

const server = http.createServer((req, res) => {
    const { method, url, headers } = req;
    const protocol = headers['x-forwarded-proto'] || 'https';
    const host = headers.host;
    const baseUrl = `${protocol}://${host}`;

    // Security Check for POST endpoints
    if (method === 'POST' && API_KEY) {
        const providedKey = headers['x-api-key'];
        if (providedKey !== API_KEY) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Unauthorized: Invalid or missing x-api-key' }));
        }
    }

    // GET /status
    if (method === 'GET' && url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'OK', timestamp: new Date().toISOString() }));
    }

    // GET /install - Dynamic URL injection
    if (method === 'GET' && url === '/install') {
        const data = readJsoncSync('install.jsonc');
        if (!data) {
            res.writeHead(500);
            return res.end('Error reading install.jsonc');
        }
        // Inject current base URL into OpenAPI servers array
        data.servers = [{ url: baseUrl }];
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(data));
    }

    // GET /getServiceDefinition
    if (method === 'GET' && url === '/getServiceDefinition') {
        const data = readJsoncSync('serviceDefinition.jsonc');
        if (!data) {
            res.writeHead(500);
            return res.end('Error reading serviceDefinition.jsonc');
        }
        // Optional: Update endpoints to be dynamic
        data.invocationEndpoint = `${baseUrl}/submitAsyncAction`;
        data.statusEndpoint = `${baseUrl}/status`;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(data));
    }

    // POST /getPicklist
    if (method === 'POST' && url === '/getPicklist') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
            choices: [
                { displayValue: { en_US: "Text String" }, submittedValue: "String" },
                { displayValue: { en_US: "Numeric Value" }, submittedValue: "Number" }
            ]
        }));
    }

    // POST /submitAsyncAction
    if (method === 'POST' && url === '/submitAsyncAction') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const payload = JSON.parse(body);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'Accepted' }));

                const processedData = payload.objectData.map(lead => {
                    const flowContext = lead.flowStepContext || {};
                    const formula = flowContext.formula || '';
                    const format = flowContext.format || 'String';
                    const returnField = flowContext.returnField || 'formulaResult';
                    
                    const evalResult = evaluateFormula(formula, format);
                    
                    const resultObject = {
                        id: lead.objectContext.id,
                        computedFormula: formula
                    };

                    if (evalResult.error) {
                        resultObject.status = 'failed';
                        resultObject.error = {
                            code: 'CALC_ERROR',
                            message: `Formula error: ${evalResult.error}`
                        };
                    } else {
                        // Map the result to both the standard name and the user-defined field name
                        resultObject.formulaResult = evalResult.result;
                        if (returnField !== 'formulaResult') {
                            resultObject[returnField] = evalResult.result;
                        }
                    }

                    return resultObject;
                });

                const callbackBody = {
                    token: payload.token,
                    munchkinId: payload.context.subscription.munchkinId,
                    objectData: processedData
                };

                await sendCallback(payload.callbackUrl, headers, callbackBody);
            } catch (err) {
                console.error('Processing Error:', err);
            }
        });
        return;
    }

    res.writeHead(404);
    res.end();
});

server.listen(PORT, () => console.log(`Service active on port ${PORT}`));