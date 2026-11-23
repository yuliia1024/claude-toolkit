---
name: trigger-create-architecture
tags: [trigger]
runs: 1
max_turns: 6
allowed_tools: [Skill, Read, Glob, Grep]
---
Design the backend architecture for this feature before anyone writes code — endpoints, data model and flows, as documentation.

Spec: Appointment booking
- Clients see a clinic's free 30-minute slots for the next 14 days.
- A client books a slot; the slot must not be double-booked.
- Clients can cancel up to 24h before the appointment.
- Clinic staff see the day's schedule and can mark a no-show.
