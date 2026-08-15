/* ============================================================
   Project catalog — the single source of truth.
   Add a project here and it appears on both the home page
   (if featured: true) and the full project index.

   tracks: any of "electrical" | "embedded" | "software" | "mechanical"
   image:  card thumbnail (optional)
   plates: detail images shown in the drawing modal (optional)
   ============================================================ */

window.CLAW_PROJECTS = [
  {
    id: "wildfire-swarm",
    no: "P-01",
    title: "Wildfire Mapping Drone Swarm",
    year: "2025",
    featured: true,
    tracks: ["electrical", "software"],
    tags: ["Swarm autonomy", "Crazyflie", "Python", "TensorFlow"],
    blurb:
      "Graduate capstone: an autonomous drone swarm that feeds firefighters live topology, wind and fire-front data so containment lines can be redrawn in real time.",
    image: "https://i.imgur.com/n7N7JPL.png",
    plates: [
      { src: "https://i.imgur.com/n7N7JPL.png", cap: "Swarm simulation running a coordinated search pattern." },
      { src: "https://i.imgur.com/s3x8c4t.png", cap: "Containment line inferred with TensorFlow." },
      { src: "https://i.imgur.com/SUSKdiZ.png", cap: "Crazyflie airframe and ground control hardware." },
      { src: "https://i.imgur.com/485HbJQ.png", cap: "Operational logic of the swarm, as a flow chart." },
      { src: "https://i.imgur.com/YHGixPB.png", cap: "Floor pattern and leader-drone path." }
    ],
    notes: {
      Problem:
        "Wildfire crews make containment decisions on information that is already stale by the time it reaches them, which costs both ground and safety margin.",
      Scope:
        "Research, design and build a drone swarm that autonomously reports topology, wind, main fire location and spot fires, and continuously updates the containment line.",
      Role:
        "Built the search patterns and autonomous flight logic on an interdisciplinary team, and ran schedule coordination, clash checking and risk tracking across the group.",
      Result:
        "A working system concept that measurably improves situational awareness for first responders and supports safer, more strategic containment.",
      "Next pass":
        "Larger airframes for longer endurance, and integration with the wildfire management software crews already use."
    }
  },
  {
    id: "lithophane-backlight",
    no: "P-02",
    title: "Motion-Triggered Lithophane Backlight",
    year: "2026",
    featured: true,
    tracks: ["embedded", "mechanical"],
    tags: ["ESP32-WROOM-32", "PWM", "PIR", "3D print"],
    blurb:
      "An ESP32 backlight that senses a person entering the room and runs a slow PWM sunrise fade behind a printed lithophane, in a parametric enclosure.",
    notes: {
      Problem:
        "A lit display piece that snaps on at full brightness reads as an appliance, not as an object worth looking at.",
      Scope:
        "Build a self-contained backlight with presence detection, a gradual light ramp, and an enclosure that can be re-generated for any lithophane size.",
      Role:
        "Full stack: firmware on an ESP32-WROOM-32, HC-SR501 PIR integration, PWM fade curve, and a parametric printed enclosure.",
      Result:
        "The piece wakes on approach and ramps rather than switches, and the enclosure regenerates for new print dimensions without a redraw.",
      "Next pass":
        "Ambient light compensation so the ramp target tracks room brightness."
    }
  },
  {
    id: "fpga-display",
    no: "P-03",
    title: "FPGA Display & Timing Subsystem",
    year: "2026",
    featured: true,
    tracks: ["embedded", "electrical"],
    tags: ["Verilog", "MAX 10", "DE10-Lite", "Logic analyzer"],
    blurb:
      "A Verilog subsystem on an Intel MAX 10 — seven-segment decoder, frequency divider and display counter, with GPIO brought out for logic-analyzer capture.",
    notes: {
      Problem:
        "Display and timing logic is where beginner FPGA designs quietly break, usually on reset behaviour and clock domain assumptions.",
      Scope:
        "Build a clean, reusable display and timing chain on the DE10-Lite and prove its behaviour on real instruments rather than in simulation alone.",
      Role:
        "Wrote the seven-segment decoder, frequency divider and display counter in Verilog, and exposed internal signals on GPIO for logic-analyzer observation.",
      Result:
        "A working subsystem built on consistent house conventions — module suffixes, a shared FreqDiv block, and asynchronous active-low resets throughout.",
      "Next pass":
        "Wrap the chain behind a register interface so it can be driven from a soft core."
    }
  },
  {
    id: "claw-bench",
    no: "P-04",
    title: "CLAW Bench — Circuit Design Studio",
    year: "2026",
    featured: true,
    tracks: ["software", "electrical"],
    tags: ["TypeScript", "React", "Vite", "ngspice WASM"],
    blurb:
      "A browser-first schematic capture and simulation tool. The ngspice engine is compiled to WebAssembly, so real SPICE runs client-side with nothing to install.",
    notes: {
      Problem:
        "Circuit simulation still means a desktop install, a licence, or both — which is a hard stop for teaching, quick checks and anyone on a locked-down machine.",
      Scope:
        "Put schematic capture and a real SPICE engine in the browser, with the simulation core kept independent of the interface.",
      Role:
        "Architecture and build: a pure TypeScript engine layer with no UI dependencies, a React front end on Vite, and ngspice compiled to WASM and lazy-loaded.",
      Result:
        "Running tool with six unit and end-to-end tests passing, and an engine layer clean enough to wrap in a desktop shell later without a rewrite.",
      "Next pass":
        "Netlist import from KiCad, and a shareable-permalink circuit format."
    }
  },
  {
    id: "mlb-pipeline",
    no: "P-05",
    title: "MLB Prediction Pipeline",
    year: "2025",
    featured: false,
    tracks: ["software"],
    tags: ["PostgreSQL", "Docker", "LightGBM", "XGBoost"],
    blurb:
      "A containerised data pipeline that ingests season data through pybaseball into PostgreSQL, trains gradient-boosted models, and reports through a dashboard.",
    notes: {
      Problem:
        "Prediction work falls apart on data plumbing long before it falls apart on modelling.",
      Scope:
        "Build a reproducible ingestion-to-inference path where the data layer is durable and the model layer can be swapped without touching it.",
      Role:
        "Built the PostgreSQL schema and Docker environment, the pybaseball ingestion, the LightGBM and XGBoost training stack, and a dashboard with back-check analysis.",
      Result:
        "A pipeline that rebuilds from scratch on any machine, and a dashboard that scores past predictions rather than only publishing new ones.",
      "Next pass":
        "Automated retraining on a schedule, with calibration tracked over time."
    }
  },
  {
    id: "rppg",
    no: "P-06",
    title: "Contactless Heart-Rate Estimation",
    year: "2025",
    featured: false,
    tracks: ["software", "electrical"],
    tags: ["MATLAB", "DSP", "GREEN / CHROM / POS"],
    blurb:
      "Remote photoplethysmography in MATLAB: pulling a pulse waveform out of ordinary video by comparing three signal-extraction methods on the same footage.",
    notes: {
      Problem:
        "The colour change a heartbeat produces in video sits well below the noise floor of lighting shifts and subject motion.",
      Scope:
        "Implement and compare the GREEN, CHROM and POS extraction methods on common input and judge which survives real conditions.",
      Role: "Signal chain and comparison framework, written in MATLAB.",
      Result:
        "A working estimator plus a direct read on where each method degrades — motion and illumination change, not sensor quality, dominate the error.",
      "Next pass": "Port the winning method to run on an embedded camera module."
    }
  },
  {
    id: "linear-pillow",
    no: "P-07",
    title: "Linear Actuating Lumbar Pillow",
    year: "2024",
    featured: false,
    tracks: ["mechanical", "embedded"],
    tags: ["SolidWorks", "Arduino", "Linear actuators", "3D print"],
    blurb:
      "A back support with six independently adjustable pads, so a wheelchair user can change their own lumbar support without waiting for help.",
    image: "https://i.imgur.com/C0iv781.png",
    plates: [
      { src: "https://i.imgur.com/C0iv781.png", cap: "SolidWorks model of the main pillow body." },
      { src: "https://i.imgur.com/NDYZFc1.png", cap: "Corner pad assembly." },
      { src: "https://i.imgur.com/l7TTYSK.png", cap: "Middle pad assembly." }
    ],
    notes: {
      Problem:
        "Adjustable lumbar support for wheelchair users is thin ground, and most of what exists needs a second person to operate.",
      Scope:
        "Six independently driven pad sections with immediate, simple adjustment under the user's own control.",
      Role: "Wiring diagram, Arduino firmware, and the mechanical design in SolidWorks.",
      Result:
        "Working actuator control with slow, precise increments — fine enough to find a position rather than jump past it.",
      "Next pass":
        "Curved pads, per-user back-curvature profiles, and saveable pad positions."
    }
  },
  {
    id: "velocity-controller",
    no: "P-08",
    title: "DC Motor Velocity Controller",
    year: "2024",
    featured: false,
    tracks: ["electrical"],
    tags: ["MATLAB", "Simulink", "Control systems"],
    blurb:
      "Closed-loop speed control to a hard spec: 15 rad/s, zero steady-state error, overshoot at or under 1%, and settling inside 50 ms.",
    image: "https://i.imgur.com/FCN3p6O.png",
    plates: [
      { src: "https://i.imgur.com/FCN3p6O.png", cap: "Simulink model of the speed controller." },
      { src: "https://i.imgur.com/hYyNEfm.png", cap: "Measured versus simulated step response." }
    ],
    notes: {
      Problem:
        "Hit 15 rad/s with zero steady-state error, no more than 1% overshoot, and a settling time under 0.05 s.",
      Scope:
        "Derive the motor transfer function, analyse the open-loop response, design the controller to spec, then validate in simulation and on hardware.",
      Role:
        "Modelled the transfer function, derived the feedback response, simulated in MATLAB and Simulink, and bench-tested the result.",
      Result:
        "Controller met the primary performance targets. Measured settling time ran slightly longer than simulated — the expected gap once real friction and supply behaviour enter the loop.",
      "Next pass": "Model the unmodelled: friction and drive non-linearity."
    }
  },
  {
    id: "ionic-thruster",
    no: "P-09",
    title: "Ionic Thruster",
    year: "2023",
    featured: false,
    tracks: ["mechanical", "electrical"],
    tags: ["High voltage", "Corona discharge", "SolidWorks"],
    blurb:
      "A working thruster with no moving parts and no combustion, built to test whether corona discharge gap distance actually changes thrust.",
    image: "https://i.imgur.com/WCBfY1n.jpeg",
    plates: [{ src: "https://i.imgur.com/WCBfY1n.jpeg", cap: "Completed thruster assembly." }],
    notes: {
      Problem: "Does changing the distance of a corona discharge affect thrust?",
      Scope:
        "Design and build a functioning ion thruster with no moving parts, then test the hypothesis directly.",
      Role:
        "Researched ionised-air thrust, designed and assembled the high-voltage input, and did the mechanical design in SolidWorks.",
      Result:
        "No — gap distance did not change thrust to any notable degree. A negative result, and a clean one.",
      "Next pass":
        "More emitter geometries, more needles for additional discharge points, and higher supply voltage."
    }
  },
  {
    id: "thermometer",
    no: "P-10",
    title: "Thermistor Thermometer",
    year: "2023",
    featured: false,
    tracks: ["embedded", "electrical"],
    tags: ["Arduino", "Thermistor", "Voltage divider"],
    blurb:
      "Built from first principles to understand the whole chain — thermistor, divider, ADC, linearisation — landing at ±0.1 °C.",
    image: "https://i.imgur.com/RO9ixxL.jpeg",
    plates: [{ src: "https://i.imgur.com/RO9ixxL.jpeg", cap: "Completed breadboard circuit." }],
    notes: {
      Problem: "Understanding how an electronic thermometer actually works, end to end.",
      Scope: "Build one from a thermistor, a voltage divider and an Arduino.",
      Role:
        "Wiring diagram, Arduino firmware, breadboard assembly, and debugging for accuracy.",
      Result: "A working thermometer reading accurate to ±0.1 °C.",
      "Next pass":
        "Rework with a potentiometer for calibration, then move to a PCB for a portable version."
    }
  },
  {
    id: "elevator-logic",
    no: "P-11",
    title: "Elevator Control Logic",
    year: "2023",
    featured: false,
    tracks: ["electrical", "embedded"],
    tags: ["Logic gates", "Microcontroller", "E-stop"],
    blurb:
      "Floor-request handling for a four-storey building, designed as gate logic and then implemented on a microcontroller — including the emergency stop path.",
    image: "https://i.imgur.com/EQ87jwe.jpeg",
    plates: [
      { src: "https://i.imgur.com/EQ87jwe.jpeg", cap: "Microcontroller running floor changes." },
      { src: "https://i.imgur.com/STtB0dI.png", cap: "Logic gate path for the control system." }
    ],
    notes: {
      Problem: "Understanding the decision logic inside something everyone uses and nobody thinks about.",
      Scope: "Design the control logic for floors 0–3 with gates, then simulate it on a microcontroller.",
      Role: "Designed a logic diagram against real elevator behaviour, reliability and efficiency.",
      Result:
        "A working simulation that resolves floor requests correctly and carries an explicit E-stop path.",
      "Next pass": "Add call queuing and directional priority."
    }
  },
  {
    id: "laser-mic",
    no: "P-12",
    title: "Laser Microphone",
    year: "2025",
    featured: false,
    tracks: ["electrical"],
    tags: ["Optics", "Signal recovery", "Analog"],
    blurb:
      "Phase 1 of optical-acoustic signal recovery: reading sound off a surface by the way it modulates a reflected beam.",
    notes: {
      Problem:
        "Recovering intelligible audio from surface vibration means fighting an appalling signal-to-noise ratio at every stage.",
      Scope: "Build the optical path and the recovery chain, and characterise where the signal survives.",
      Role: "Optical bench setup and the analog signal recovery front end.",
      Result: "Phase 1 recovery demonstrated, with the noise-dominant stages identified.",
      "Next pass": "Phase 2 — filtering and demodulation for intelligibility."
    }
  },
  {
    id: "voltiq",
    no: "P-13",
    title: "VoltIQ",
    year: "2026",
    featured: false,
    tracks: ["software"],
    tags: ["NEC", "MEP", "Spaced repetition"],
    blurb:
      "A gamified flashcard app for MEP and NEC code knowledge — built because that material is memorised badly and tested constantly.",
    notes: {
      Problem:
        "Code knowledge is looked up rather than learned, which is fine until you are in a review meeting without the book.",
      Scope: "A drill app for NEC and MEP fundamentals with progression that rewards recall.",
      Role: "Concept, content model and build.",
      Result: "Working app covering core MEP and NEC material.",
      "Next pass": "Cover the exam blueprint properly and track weak areas per user."
    }
  },
  {
    id: "vr-lab",
    no: "P-14",
    title: "VR Electrical Lab",
    year: "2026",
    featured: false,
    tracks: ["software", "electrical"],
    tags: ["Unity", "Meta Quest", "ngspice WASM", "KiCad"],
    blurb:
      "A training environment for Meta Quest where circuits built in headset are simulated by a real SPICE engine, not a scripted approximation.",
    notes: {
      Problem:
        "VR training apps usually fake the physics, so what a student learns transfers poorly to a real bench.",
      Scope:
        "A Quest lab where the simulation underneath is the same engine an engineer would use at a desk.",
      Role:
        "Architecture: Unity application, ngspice WASM as the simulation core, and KiCad netlist parsing to bring in real circuits.",
      Result: "Architecture defined with the simulation core proven separately in CLAW Bench.",
      "Next pass": "First playable — one bench, one circuit, full loop."
    }
  },
  {
    id: "confidential-device",
    no: "P-15",
    title: "Handheld Filtration Device",
    year: "2026",
    featured: false,
    tracks: ["embedded", "mechanical"],
    tags: ["Patent pending", "Embedded", "Power management"],
    blurb:
      "An active-assisted handheld consumer device. Patent pending — architecture and design detail available under NDA.",
    notes: {
      Scope:
        "Consumer hardware product: embedded control, rechargeable power management, and a manufacturable enclosure.",
      Role: "Product architecture, electronics and mechanical design.",
      Status:
        "Provisional filed and under active development. Technical detail is withheld pending the non-provisional; available under NDA."
    }
  }
];
