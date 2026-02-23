# Marketo Calculate Formula - Self-Service Flow Step

A high-performance Node.js backend for Marketo Self-Service Flow Steps (SSFS). This service allows users to perform Excel-like calculations (IF, SUM, AVERAGE, etc.) on lead data during smart campaigns.

Security Note

To secure your service, you can set an environment variable named `API_KEY`. If set, the server will require a matching `x-api-key` header for all `POST` requests.

## 🚀 Deployment Guides

### 1. Deploying to Replit (Fastest)

1. **Create a new Repl** : Select "Import from GitHub" or create a "Node.js" Repl.
2. **Upload Files** : Upload `server.js`, `package.json`, `index.html`, `install.jsonc`, and `serviceDefinition.jsonc`.
3. **Set API Key** : Open the **Secrets** (lock icon) tab in the sidebar. Add a secret with key `API_KEY` and your desired value.
4. **Install Dependencies** : Replit will usually detect `package.json`, but you can run `npm install` in the shell.
5. **Run** : Click the **Run** button.
6. **URL** : Your public URL will be visible in the WebView tab.

### 2. Deploying to Azure (App Service)

1. **Create Resource** : Go to the Azure Portal and create a new  **Web App** .
2. **Runtime Stack** : Select **Node.js 18 LTS** (or higher).
3. **Set API Key** : Go to **Configuration** >  **Application settings** . Add a new setting named `API_KEY` with your secret value.
4. **Deployment** :

* **Local Git** : Push your code via Git.
* **VS Code** : Use the Azure App Service extension to "Deploy to Web App".

1. **Environment Variables** : Ensure `PORT` is set to `8080` if Azure doesn't detect it.
2. **URL** : Found on the "Overview" page.

### 3. Deploying to AWS (App Runner)

1. **Source** : Connect your GitHub repository.
2. **Configuration** :

* **Runtime** : `Nodejs 18`.
* **Build Command** : `npm install`.
* **Start Command** : `node server.js`.
* **Port** : `8080`.

1. **Set API Key** : Under **Configuration** > **Service settings** >  **Environment variables** , add `API_KEY`.
2. **Service Settings** : Ensure the service is public.
3. **URL** : AWS will provide a unique endpoint.

---

## 🛠 Marketo Installation

Once your service is live and you can see the landing page at your root URL, follow these steps:

1. **Go to Marketo Admin** : Navigate to **Admin** >  **Service Providers** .
2. **Add New Service** : Click **Add New Service** and select  **Self-Service Flow Step** .
3. **Enter Details** :

* **Service Name** : Calculate Formula.
* **Install URL** : `https://<your-domain>/install`.

1. **Enter API Key** : If you configured an `API_KEY`, enter it in the **API Key** field (it will be sent as `x-api-key`).
2. **Map Fields** :

* In the service configuration, you will see **Formula Result** (`returnVal`) and **Calculated Formula** (`computedFormula`).
* Map `returnVal` to the lead field where you want to store the result.

## 📝 How to Use in a Smart Campaign

1. **Add Flow Step** : In a Smart Campaign **Flow** tab, search for the **Calculate Formula** step.
2. **Set the Formula** : Use standard Excel syntax. You can use Marketo tokens!
   *Example* : `IF({{lead.Annual Revenue}} > 1000000, "Enterprise", "SMB")`
3. **Set Return Format** : Choose **Numeric Value** for score/integer fields or **Text String** for others.
4. **Set Return Field (Optional)** : If you want the value returned in a specific property of the response object, specify it in the `Return Field` input.

## 🧪 Supported Functions

This service uses `hot-formula-parser`, supporting over 300 functions:

* **Math** : `SUM`, `PRODUCT`, `POWER`, `ROUND`, `ABS`
* **Logic** : `IF`, `AND`, `OR`, `NOT`, `XOR`
* **Text** : `CONCATENATE`, `LEFT`, `RIGHT`, `UPPER`, `LOWER`
* **Stats** : `AVERAGE`, `MIN`, `MAX`, `COUNT`

## 🛡 Security & Reliability

* **API Authentication** : If an `API_KEY` environment variable is set, the service enforces `x-api-key` validation on all sensitive endpoints.
* **Header Sanitization** : The server automatically cleans incoming headers from Marketo to prevent protocol errors.
* **Error Handling** : If a formula fails, the error message is passed back to the Marketo Activity Log instead of crashing the flow.
