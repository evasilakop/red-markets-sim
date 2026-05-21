# Phase 2 summary

## 1. Expanding the `Enclave` Data Model

Enclave stats to add:

* **Morale (Stat):** Add this as a numeric value (2-12) just like Population and Tech.
  * *UI Tip:* Add a visual indicator next to Morale. If it drops below 5, flag it as "Panic/Desperate."
* **Surplus (Resource):** This is crucial. It shouldn't be a flat number; it needs to be a **Usage Die** value (Ud4, Ud6, Ud8, Ud10, Ud12).
  * *Logic:* This represents the Enclave's wealth. When players complete a job *for* the enclave, you might upgrade this die. If they steal from it, you downgrade it.
* **Characteristic (Flavor):** The handbook likely has a table for "Enclave Quirks" or characteristics. Add a string field for this.
* **Trade Status (State):** An Enclave isn't just static; it's either open or closed. Add a status field: `Open`, `Closed`, `Embargoed`, or `Hostile`.

## 2. Implementing "Jobs" as Enclave Events

The "Job" feature should be an **Input Form** that calculates the *impact on the Enclave*.

**The "Job Result" Form:**
When a player completes a job, the Market (you) opens this form for the specific Enclave and selects an outcome:

* **Job Type:**
  * *Supply Run:* Adds resources.
  * *Defense:* Protects resources.
  * *Sabotage:* Removes resources (if done against a rival).
* **Outcome Input:**
  * *Success:* Trigger function `upgradeSurplus(enclaveId)`. (e.g., Ud6 -> Ud8).
  * *Failure:* Trigger function `downgradeSurplus(enclaveId)` or `decreaseMorale(enclaveId)`.
  * *Disaster:* Trigger function `collapseEconomy(enclaveId)` (Surplus drops to Ud4, Morale -2).

We aren't tracking *who* did it or what gun they used, only that "A job was done, and now this Enclave is richer/poorer."

### 3. Refining the "Advance Time" Logic

You mentioned you have an "Advance Time" button. Here is how to make it compliant with the economic rules:

* **The Consumption Check:** When you click "Advance Time" (globally or locally), the app should roll the **Surplus Usage Die** for that Enclave.
  * *Roll 1-2:* The Enclave consumed more than it produced. Downgrade Surplus (e.g., Ud8 -> Ud6).
  * *Roll 3+:* The economy is stable.
* **The Crisis Check:** If Surplus hits **Depleted** (runs out), the app should automatically trigger a `Morale Check`. If that fails, change the Enclave status to **Hostile** or **Collapsed**.

This automates the "dying world" theme. You don't have to decide if a city is starving; the dice (and your code) decide.

Yes, absolutely! We can change the UI to display the **RPG Terms** (Steps/Successes) while keeping the **Math** (Percentages) under the hood.

### 4. Change the Slider Label (replace or add??)

* Instead of showing "Magnitude: 5", show:
    *1: "Success"
    *2: "Crit"
    *3: "Super Crit"
    *4+: "Macro Event"
