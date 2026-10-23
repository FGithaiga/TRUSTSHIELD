# TrustShield 254: Setup and Run Guide

Follow the steps in order. Each step tells you which folder to be in and what to type.

When you finish, the website runs at **http://127.0.0.1:5173**, using the real ML models.

You will use **two terminal windows**:

- **Terminal 1** runs the **backend**: the Django API and the ML models.
- **Terminal 2** runs the **frontend**: the React website.

---

## Step 0: Install the tools (once per computer)

You need **Git**, **Python 3.12 or newer** and **Node.js 22**.

Pick your system and run the commands.

**Windows 10/11** (PowerShell):

```powershell
winget install Git.Git Python.Python.3.12 OpenJS.NodeJS.LTS
```

Then **close and reopen PowerShell**. Allow virtual-environment scripts to run (once only):

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**macOS** (with [Homebrew](https://brew.sh)):

```bash
brew install git python@3.12 node@22
brew link --overwrite node@22
```

**Ubuntu 24.04 / Linux Mint 22:**

```bash
sudo apt update
sudo apt install -y git python3.12 python3.12-venv
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22
```

**Ubuntu 22.04 or older**, whose built-in Python is too old:

```bash
sudo apt update
sudo apt install -y git software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.12 python3.12-venv
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22
```

**Fedora:**

```bash
sudo dnf install -y git python3.12 nodejs22
```

**Arch / Manjaro:**

```bash
sudo pacman -S --needed git python nodejs npm
```

Check that everything is installed:

```bash
git --version
node --version         # must be v22.x (or v20.19+)
python3.12 --version   # Windows: py -3.12 --version
```

---

## Step 1: Download the project

```bash
git clone https://github.com/FGithaiga/TRUSTSHIELD.git
cd TRUSTSHIELD
```

The trained ML models (`AI-ML/models/*.pkl`) download with the project. Nothing else to fetch.

---

## Step 2: Set up and start the backend (Terminal 1)

Run these commands **one after another**, starting from the `TRUSTSHIELD` folder.

**Linux / macOS:**

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python -c "import secrets,pathlib; pathlib.Path('.env').write_text(pathlib.Path('.env.example').read_text().replace('DJANGO_SECRET_KEY=change-me', 'DJANGO_SECRET_KEY=' + secrets.token_urlsafe(50)))"
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 127.0.0.1:8254
```

**Windows (PowerShell):**

```powershell
cd backend
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -c "import secrets,pathlib; pathlib.Path('.env').write_text(pathlib.Path('.env.example').read_text().replace('DJANGO_SECRET_KEY=change-me', 'DJANGO_SECRET_KEY=' + secrets.token_urlsafe(50)))"
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 127.0.0.1:8254
```

What each command does:

| Command | What it does |
|---|---|
| `python3.12 -m venv .venv` / `py -3.12 -m venv .venv` | Creates a private Python environment for the project |
| `source .venv/bin/activate` / `.venv\Scripts\Activate.ps1` | Turns that environment on. Your prompt now starts with `(.venv)` |
| `pip install -r requirements.txt` | Installs Django, the API tools and the ML libraries, at the exact versions the models need. Takes 1 to 3 minutes |
| `python -c "..."` | Creates `backend/.env` from `.env.example`, with a new random secret key |
| `python manage.py migrate` | Creates the database (`backend/db.sqlite3`) |
| `python manage.py seed_demo` | Adds the demo account, sample history and community reports |
| `python manage.py runserver 127.0.0.1:8254` | Starts the API on port 8254 |

**You are ready when Terminal 1 shows** (the ML line appears a few seconds after the first):

```
Starting development server at http://127.0.0.1:8254/
INFO apps.scans.ml: ML models loaded in 6.5s
```

Leave this terminal open. The backend must keep running.

---

## Step 3: Set up and start the frontend (Terminal 2)

Open a **new terminal window**, go to the `TRUSTSHIELD` folder, and run:

**Linux / macOS / Windows (same commands):**

```bash
cd frontend
npm ci
npm run dev
```

| Command | What it does |
|---|---|
| `npm ci` | Installs the website's packages at the exact versions in `package-lock.json`. Takes 1 to 2 minutes |
| `npm run dev` | Starts the website on port 5173 and connects it to the backend on port 8254 |

> If you installed Node with nvm, run `nvm use 22` first, in the same terminal.

**You are ready when Terminal 2 shows:**

```
VITE v8.x  ready in ... ms
➜  Local:   http://127.0.0.1:5173/
```

Leave this terminal open too.

---

## Step 4: Use the website

Open **http://127.0.0.1:5173** in your browser.

### Sign in

1. Click **Sign in**, top right.
2. Click the blue **Demo mode** box. It fills in `demo@trustshield254.ke` / `Demo@2540`.
3. Click **Sign in**. You land on the **Dashboard**.
4. The top bar should say **Analysis service online**. That means the ML models are working.

You can also click **Sign up** to create your own account.

### Things to try

| Page (left menu) | What to do | What you will see |
|---|---|---|
| **M-PESA Checker** | Click the **Fake reversal** sample, then **Check message** | High-risk result: flagged phrases, the ML model's verdict, the M-PESA message anatomy check, next steps |
| **Link Checker** | Click **Brand look-alike**, then **Check link** | High-risk link, plus a **Seen before in the community** card |
| **Offer Checker** | Click **Job with fee**, then **Check offer** | Advance-fee job warning, with the fake-job model's result |
| **Before You Pay** | Pick a payment type and tick the checklist | A *Stop* or *Checklist complete* verdict |
| **Incident Assistant** | Walk through the 3 steps | A reference number, urgent steps and official contacts |
| **Scam Sense Trainer** | Click **Start a round** | Five practice messages, scored |
| **History** | Click any row | The full saved result |
| **Threat Feed** | Click **Report a scam** | Your report waits for review |
| **Settings** | Choose **Light / Dark / System** | The whole site changes theme |

Handy shortcuts:

- **Ctrl+K** (or **/**): search and jump to any page.
- **Sun/moon button** (top bar): switch between light and dark.
- **Phones:** use the tab bar at the bottom of the screen.

### Admin panel (optional)

To manage users, approve community reports and edit reporting contacts:

1. In Terminal 1, stop the server with **Ctrl+C**.
2. Run `python manage.py createsuperuser` and follow the prompts.
3. Start the server again with `python manage.py runserver 127.0.0.1:8254`.
4. Open **http://127.0.0.1:8254/admin** and sign in with that account.

---

## Step 5: Stop the system

- Click into **Terminal 2** (frontend) and press **Ctrl+C**.
- Click into **Terminal 1** (backend) and press **Ctrl+C**.
- Optional: in Terminal 1, type `deactivate` to leave the Python environment.

Your data stays in `backend/db.sqlite3` for next time.

---

## Starting again later

You do not repeat the installation. You only need two terminals.

**Terminal 1 (backend)**, from the `TRUSTSHIELD` folder:

```bash
cd backend
source .venv/bin/activate            # Windows: .venv\Scripts\Activate.ps1
python manage.py runserver 127.0.0.1:8254
```

**Terminal 2 (frontend)**, from the `TRUSTSHIELD` folder:

```bash
cd frontend
npm run dev
```

Then open http://127.0.0.1:5173.

### After pulling new code (`git pull`)

Update dependencies and the database before starting.

**Terminal 1**, with the environment active:

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
```

**Terminal 2:**

```bash
cd frontend
npm ci
```

---

## Useful extra commands

Run the backend commands in `backend/` with the environment active, and the frontend commands in `frontend/`.

| What | Command |
|---|---|
| Run the backend tests (also checks the ML models load) | `python -m pytest` |
| Reset the demo data | `python manage.py seed_demo --reset` |
| Export user feedback for the ML team | `python manage.py export_feedback` |
| Build the website for production | `npm run build` |
| Run the website without the backend (mock data) | Linux/macOS: `VITE_USE_MOCK=true npm run dev`<br>Windows: `$env:VITE_USE_MOCK="true"; npm run dev` |

In development, password-reset emails are **printed in Terminal 1** instead of being sent.

---

## If something goes wrong

| Problem | Fix |
|---|---|
| `No matching distribution found for numpy==2.5.4` (or scipy) | Your environment uses Python older than 3.12. Delete `backend/.venv` and run Step 2 again with `python3.12` / `py -3.12` |
| `python3.12: command not found` | Install Python 3.12 (Step 0). On macOS run `brew link python@3.12` |
| Windows: `Activate.ps1 cannot be loaded` | Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`, then activate again |
| Windows: `python` opens the Microsoft Store | Use `py -3.12` instead, or turn off the Python "App execution aliases" in Windows Settings |
| `npm run dev` fails mentioning the Node version or `crypto.hash` | Node is too old. Run `nvm use 22`, or install Node 22 |
| Website says **Service unavailable** / **Cannot reach the TrustShield service** | Terminal 1 is not running. Start the backend (Step 2, last command) |
| Top bar says **Rule checks only** | The models did not load. In Terminal 1 run `pip install -r requirements.txt` again, then restart the server |
| `Error: That port is already in use` (backend) | Another program uses port 8254. Run the backend on another port, for example `python manage.py runserver 127.0.0.1:8300`. Then create `frontend/.env.local` containing `VITE_API_PROXY_TARGET=http://127.0.0.1:8300` and restart `npm run dev` |
| Demo login does not work, or the **Seen before** card never appears | Run `python manage.py seed_demo` again (add `--reset` to start the demo data over) |
| **Too many requests** message | Sign-in is limited to 10 tries per minute. Wait a minute |

---

More detail:

- **API endpoints, the ML integration and deployment:** [`backend/README.md`](backend/README.md)
- **Frontend structure:** [`frontend/README.md`](frontend/README.md)
- **The ML models:** [`README.md`](README.md)

The `AI-ML/` folder belongs to the ML team. The backend uses it as it is and never changes it.
