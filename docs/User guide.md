# Red Markets Simulator: User Guide

## Overview

This simulator digitizes the economic rules of **Red Markets**, allowing Market Djs (GMs) and players to track the supply, demand, and equilibrium states of various enclaves without manual bookkeeping.

## Core Concepts

### The Enclave Economy

Every city (Enclave) consists of **10 Sectors**. Each sector represents a category of goods or services essential for survival in the Loss.

| Sector | Description |
| :--- | :--- |
| **Food & Water** | Basic sustenance. |
| **Shelter** | Housing and safety. |
| **Material** | Raw resources for crafting/repair. |
| **Energy** | Fuel, batteries, electricity. |
| **Medicine** | Drugs, stims, medical care. |
| **Products** | Manufactured goods (weapons, gear). |
| **Speculative** | Luxuries, vices, and abstract value. |
| **Transportation** | Vehicles and logistics. |
| **Data** | Information, maps, software. |
| **Human Resources** | Labor, skills, personnel. |

### Supply & Demand

Each sector tracks two primary stats on a scale of 0–100:

* **Supply:** How much of the good is available.
* **Demand:** How much the population wants/needs it.

The relationship between these two numbers determines the **Equilibrium State**.

---

## Equilibrium States

The economy is defined by the gap between Supply and Demand. This state determines the price of goods and the fierceness of the competition.

### 1. Flooded (Supply >> Demand)

* **Condition:** Supply is significantly higher than Demand (Difference > 20).
* **Effect:** The market is saturated. Prices crash.
* **Competition:** **High**. Rivals are desperate to offload stock.
  * *Undercut Dice:* **-2d10** (Competition rolls 2d10 and subtracts from your profit).
* **Starting CHIPS:** 2 (Standard payout).

### 2. Volatile (Supply ≈ Demand)

* **Condition:** Supply and Demand are roughly equal (within ±20).
* **Effect:** The market is unpredictable but active.
* **Competition:** **None**. The market absorbs goods easily.
  * *Undercut Dice:* **0**.
* **Starting CHIPS:** 0 (Negotiation starts flat).

### 3. Subsidiary (Supply << Demand)

* **Condition:** Demand is significantly higher than Supply (Difference > 20).
* **Effect:** The enclave is desperate for goods. Stability is threatened.
* **Competition:** **Fierce**. The Enclave subsidizes imports, but major players dominate.
  * *Undercut Dice:* **-3d10**.
* **Starting CHIPS:** 3 (High payout due to subsidies).

### 4. Scarce (Supply < Demand but restricted)

* **Condition:** Demand exceeds Supply, but flow is choked (or high-value items).
* **Effect:** Prices soar, but finding buyers is hard.
  * *Note in Sim:* Currently modeled as an extreme deficit state.
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

## Data Management

* **Local Storage:** All data is saved to your browser (IndexedDB). It persists even if you close the tab.
* **Export:** You can download your world as a `.json` file to back it up or share it with another GM.
* **Import:** Restore a world from a `.json` file.
