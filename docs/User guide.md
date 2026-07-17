# Red Markets Simulator: User Guide

## Overview

This simulator digitizes the economic rules of **Red Markets**, allowing Market Djs (GMs) and players to track the supply, demand, and equilibrium states of various enclaves without manual bookkeeping.

## Core Concepts

### The Enclave Economy

Every city (Enclave) consists of **10 Sectors**. Each sector represents a category of goods or services essential for survival in the Loss.

| Sector              | Description                          |
|:--------------------|:-------------------------------------|
| **Food & Water**    | Basic sustenance.                    |
| **Shelter**         | Housing and safety.                  |
| **Material**        | Raw resources for crafting/repair.   |
| **Energy**          | Fuel, batteries, electricity.        |
| **Medicine**        | Drugs, stims, medical care.          |
| **Products**        | Manufactured goods (weapons, gear).  |
| **Speculative**     | Luxuries, vices, and abstract value. |
| **Transportation**  | Vehicles and logistics.              |
| **Data**            | Information, maps, software.         |
| **Human Resources** | Labor, skills, personnel.            |

### Supply & Demand

Each sector tracks two primary stats on a scale of 0–100:

* **Supply:** How much of the good is available.
* **Demand:** How much the population wants/needs it.

The relationship between these two numbers determines the **Equilibrium State**.

---

## Equilibrium States

The economy is defined by the gap between Supply and Demand. This state determines the price of goods and the fierceness of the competition.

### 1. Flooded (High Supply)

* **Condition:** High supply and low demand.
* **Effect:** A variety of providers and/or surplus of goods lower demand and prices. Everyone trades and no one prospers. Finer gradations of quality needed to stand out from a crowded market.
* **Competition:** **High**. Rivals are desperate to offload stock.
  * *Undercut Dice:* **-2d10** (Competition rolls 2d10 and subtracts from your profit).
* **Starting CHIPS:** 2.

### 2. Volatile (Balanced)

* **Condition:** Supply and demand are roughly equal.
* **Effect:** The market is unpredictable but active.
* **Competition:** **None**. The market absorbs goods easily.
  * *Undercut Dice:* **0**.
* **Starting CHIPS:** 0.

### 3. Subsidiary (Low Activity)

* **Condition:** Low supply and low demand.
* **Effect:** There isn’t much to choose from and no one cares. Demand is low. Supply shrinks. Returns are marginal. Minimal price difference between consumer and wholesale commodities.
* **Competition:** **Fierce**.
  * *Undercut Dice:* **-3d10**.
* **Starting CHIPS:** 3.

### 4. Scarce (High Demand)

* **Condition:** Shortages and/or a lack of service providers inflate pricing.
* **Effect:** Textbook supply/demand disconnect. Optimal for a sustainable business, but constantly inviting competition.
* **Competition:** **Moderate**.
  * *Undercut Dice:* **-1d10**.
* **Starting CHIPS:** 1.

---

## Actions (Market Manipulation)

Takers can influence the economy during Downtime or Job phases.

### Demand Actions (The "Hype")

* **Market:** Standard networking to find buyers. (+Demand)
* **Speculate:** Spreading rumors to create artificial need. (+Demand)
* **Price Low:** Offering discounts to trigger a buying frenzy. (+Demand)
* **Increase Demand:** Organic growth or macro-events (e.g., epidemic). (+Demand)

### Supply Actions (The "Logistics")

* **Increase Supply:** Bringing a haul into town. (+Supply)
* **Subcontract:** Paying others to import goods. (+Supply)
* **Reduce Supply:** Buying up stock to hoard. (-Supply)
* **Restrict Flow:** Blockading routes or bribing guards. (-Supply)
* **Sabotage:** Destroying rival warehouses or convoys. (-Supply)

### The "Tick" (Time Advancement)

Clicking **"Advance Time"** simulates the passage of one economic cycle (usually a week or a month).

* **Drift:** Sectors naturally drift towards equilibrium (Supply/Demand shift slightly).
* **Noise:** Random fluctuations represent minor trades and events.

---

## 💡 Market Features: Tuning Simulation Intensity

As a Game Master (GM), you can adjust the "intensity" of the simulation by modifying the action coefficients. This allows you to control how much impact player actions have on the market without touching the source code.

### 🛠 How to Tune the Simulation

All simulation weights are stored in a simple text file. By editing this file, you can make the world feel more reactive (high coefficients) or more stable/stubborn (low coefficients).

**File Location:** `public/config/simulation_weights.txt`

#### 📝 File Format
The file uses a simple `KEY=VALUE` format.
- **Keys:** The name of the action (e.g., `SABOTAGE`). This is **case-insensitive**, so `sabotage=4` works just as well as `SABOTAGE=4`.
- **Values:** Whole numbers representing the multiplier.
- **Comments:** You can use the `#` symbol to add notes or disable a line.
- **Whitespace:** Extra spaces around the `=` sign are ignored.

---

### 📋 Baseline Configuration (Default)

If you are unsure where to start, use these default values. These represent a balanced simulation where high-risk actions (like Sabotage) have a higher impact than standard market shifts.

```text
# --- Simulation Action Coefficients ---
# Higher values = More dramatic impact on Supply/Demand

# Supply Actions
INCREASE_SUPPLY=3
SUBCONTRACT=3
REDUCE_SUPPLY=4
RESTRICT_FLOW=4
SABOTAGE=4

# Demand Actions
INCREASE_DEMAND=3
MARKET=3
DECREASE_DEMAND=3
PRICE_LOW=2
SPECULATE=4
```

---

### 🎲 Tuning Strategies

| Goal | Strategy | Example Change |
| :--- | :--- | :--- |
| **"Hardcore" Mode** | Increase coefficients across the board to make every action swing the market wildly. | `SABOTAGE=10` |
| **"Stable" Economy** | Lower coefficients to make the market more resistant to player interference. | `MARKET=1` |
| **"Sabotage Heavy"** | Boost specific keys to make the game feel more violent/unpredictable. | `SABOTAGE=8`, `REDUCE_SUPPLY=8` |

### ⚠️ Important Notes
1. **Reload Required:** Changes to the `.txt` file will only take effect once the web application is **refreshed** in the browser.
2. **Safety Fallback:** If you accidentally delete the file, introduce a typo in a key name, or enter a non-numeric value (e.g., `SABOTAGE=abc`), the simulation will **automatically revert to the default values** to prevent the game from crashing.

---

## Data Management

* **Local Storage:** All data is saved to your browser (IndexedDB). It persists even if you close the tab.
* **Export:** You can download your world as a `.json` file to back it up or share it with another GM. Exported files include a format version number for future compatibility.
* **Import:** Restore a world from a `.json` file.

