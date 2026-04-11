## Product Requirements Document (PRD)
**Project**: Cyber-Physical Anomaly Detection System (Nuclear Safety)
**Team**: Dabloons
**Document Status**: Sprint Ready (Hackathon MVP)
 
## 1. Project Overview
This project is a real-time, mission-critical prototype designed to detect sophisticated cyber-physical attacks (Stuxnet-style) on nuclear infrastructure. The system monitors and cross-references digital IT network logs with raw, physical sensor telemetry to identify malicious discrepancies and trigger immediate facility lockdowns.
## 2. Target Audience
●	Primary: Nuclear Facility Safety Officers, Plant Operations Managers.
●	Secondary: Hackathon Judges (evaluating technical depth, UI/UX clarity, and narrative impact).
## 3. Problem & Solution
●	The Problem: Bad actors can infiltrate industrial IT networks and spoof digital dashboards to show "Normal" operations while physical hardware (e.g., cooling pumps) is being pushed to critical failure.
●	The Solution: An independent, machine-learning-driven mobile command center that bypasses spoofable IT dashboards. It ingests dual data streams and uses an unsupervised anomaly detection model to flag discrepancies between network commands and physical reality.
 
## 4. MVP Core Features
To ensure a complete and polished prototype within the hackathon time limit, the scope is strictly limited to the following core deliverables:
Feature	Description	Priority
Synthetic Data Engine	A script generating continuous, synchronized CSV data for both "Normal" baseline operations and "Attack" scenarios (divergent physical/IT data).	P0 (Critical)
Real-Time Data Stream	A high-performance, uni-directional data pipeline delivering telemetry to the client without heavy bi-directional overhead.	P0 (Critical)
ML Anomaly Detection	A lightweight algorithm trained on baseline data to detect multi-dimensional discrepancies the moment the attack payload is injected.	P0 (Critical)
Mobile Command Dashboard	A high-contrast mobile UI displaying live telemetry charts, ensuring facility managers can monitor operations securely.	P1 (High)
Emergency Override Protocol	A visual alert system that overrides the mobile screen with lockdown warnings and push notifications upon anomaly detection.	P1 (High)
Demo Trigger System	A manual "Inject Payload" button to seamlessly transition the prototype from normal operations to the attack state during the final pitch.	P1 (High)
 
## 5. Technical Architecture
The stack is optimized for speed of development, low latency, and a highly polished presentation.
Component	Technology	Role
Backend API	Python / FastAPI	Serves the data streams and handles the ML inference requests efficiently.
Data Streaming	Server-Sent Events (SSE)	Pushes real-time telemetry from the backend to the mobile client natively.
Machine Learning	scikit-learn (Isolation Forest)	Analyzes data streams for outliers without requiring massive training times.
Frontend/Mobile	Flutter	Powers the responsive, cross-platform mobile dashboard and dynamic UI animations.
Data Generation	NumPy / Pandas	Simulates the hardware sensors and IT network logs for the demo.
 
## 6. User Demo Flow
This is the precise sequence of events for the final hackathon presentation:
1.	Initialization: The Flutter app launches, connecting to the FastAPI SSE stream.
2.	Normal State: The dashboard displays green, synchronized charts. IT network logs and physical sensor data match perfectly.
3.	The Trigger: The presenter presses the "Inject Payload" button, simulating a network breach.
4.	The Divergence: The IT dashboard remains green (spoofed), while physical sensor charts spike into the red zone.
5.	Detection & Lockdown: The Isolation Forest model flags the mismatch instantly.
6.	The Climax: The mobile app screen flashes red, an "Absolute System Override" modal overtakes the UI, and a critical push notification is delivered.
 
Success Metric for the Sprint: A zero-latency transition from the payload injection to the visual mobile alert, demonstrating a flawless integration between the Python backend and the mobile UI.

