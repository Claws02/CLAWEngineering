/* ============================================================
   Project catalog — the single source of truth.
   Add a project here and it appears on both the home page
   (if featured: true) and the full project index.

   tracks: any of "electrical" | "embedded" | "software" | "mechanical"
   image:  card thumbnail (optional)
   plates: detail images shown in the drawing modal (optional)

   Projects without a photograph use a generated schematic plate from
   assets/img/projects/*.svg (see scripts/make-placeholders.py). Replace
   any of them with a real photo when you have one — just change the path.
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
      "Senior design capstone: a Crazyflie drone swarm that flies a leader-follower search around a simulated fire, with a thermal camera and TensorFlow model drawing the containment line.",
    image: "assets/img/projects/wildfire-swarm-test-rig.jpg",
    fit: "cover",
    plates: [
      { src: "assets/img/projects/wildfire-swarm-test-rig.jpg", cap: "Test rig: a Crazyflie over simulated terrain, its 110° field of view on heat packs standing in for a fire." },
      { src: "assets/img/projects/wildfire-swarm-containment.png", cap: "Containment line inferred with TensorFlow." },
      { src: "assets/img/projects/wildfire-swarm-hardware.png", cap: "The Crazyflie airframe and the decks, camera and battery it carries." },
      { src: "assets/img/projects/wildfire-swarm-flowchart.png", cap: "Operational logic of the swarm, as a flow chart." },
      { src: "assets/img/projects/wildfire-swarm-search-path.jpg", cap: "Floor pattern and leader-drone path." }
    ],
    notes: {
      Problem:
        "Wildfire crews make containment decisions on information that is already stale by the time it reaches them, which costs both ground and safety margin.",
      Scope:
        "Research, design and build a drone swarm that autonomously reports topology, wind, main fire location and spot fires, and continuously updates the containment line.",
      Role:
        "Wrote the swarm's Python flight control and ran the hardware diagnosis behind it — logging the Flow Deck showed it reading zero surface quality on a plain floor, which led to the high-contrast flight arena. Took the simulation from ROS1 to ROS2 and Gazebo, as far as stable hover.",
      Result:
        "A coordinated two-drone leader-follower mission. Across six test waypoints in a 1.83 × 1.22 m arena, position error was 7.7% at worst and 3.3% or less everywhere else.",
      "Next pass":
        "Scale past two drones — a single radio overloaded at two, which forced one-axis-at-a-time moves — and finish the Gazebo simulation so swarm logic can be tested before it flies."
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
    image: "assets/img/projects/lithophane-backlight.svg",
    plates: [{ src: "assets/img/projects/lithophane-backlight.svg", cap: "Signal chain: PIR presence detect into an ESP32 PWM ramp behind the lithophane panel." }],
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
    image: "assets/img/projects/fpga-display.svg",
    plates: [{ src: "assets/img/projects/fpga-display.svg", cap: "Seven-segment decode, clock division, and GPIO broken out for logic-analyzer capture." }],
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
    id: "cuda-kmeans",
    no: "P-04",
    title: "GPU-Parallel K-Means in CUDA",
    year: "2026",
    featured: true,
    tracks: ["software"],
    tags: ["CUDA", "GPU computing", "nvcc", "Performance analysis"],
    blurb:
      "K-Means clustering of 3 million 20-feature game records, parallelised across an RTX 3070's 5,120 cores — 7.9 minutes on a single GPU thread down to 1.9 seconds.",
    image: "assets/img/projects/cuda-kmeans-card.png",
    plates: [
      { src: "assets/img/projects/cuda-kmeans-blocks.png", cap: "Block sweep at 256 threads per block: speedup climbs from 204× at 4 blocks and plateaus near 252× by 64, once all 40 SMs are busy." },
      { src: "assets/img/projects/cuda-kmeans-threads.png", cap: "Thread sweep with blocks sized to cover the data: 32 to 1,024 threads per block all land between 248× and 255×." }
    ],
    notes: {
      Problem:
        "K-Means is two O(N × K × D) passes per iteration. On 3,000,000 synthetic MLB game records with 20 features each, 50 iterations took 474 s on a single GPU thread — too slow to iterate on.",
      Scope:
        "Parallelise assignment and centroid accumulation in CUDA, then measure how threads per block and block count drive performance, and find the bottleneck.",
      Role:
        "Sole author: three kernels (nearest-centroid assignment, atomic centroid accumulation, averaging) built on a grid-stride loop, so the identical code runs as the one-thread baseline and the parallel version; CUDA-event timing; both launch-parameter sweeps and the analysis.",
      Result:
        "1,856 ms against 474,221 ms — 255× faster than the same kernel on one GPU thread, with identical results. Threads per block barely mattered (248–255×); block count did, plateauing near 64 blocks. At 37 ms per iteration against a roughly 25 ms floor set by 448 GB/s of memory bandwidth, the kernel is approaching the memory-bandwidth ceiling.",
      "Next pass":
        "Benchmark against an optimised multi-core CPU build, and replace the atomicAdd accumulation — 3 million threads contending for 5 accumulators — with shared-memory and warp-level reductions."
    }
  },
  {
    id: "rppg",
    no: "P-05",
    title: "Contactless Heart-Rate Estimation",
    year: "2026",
    featured: false,
    tracks: ["software", "electrical"],
    tags: ["MATLAB", "DSP", "GREEN / CHROM / POS"],
    blurb:
      "Remote photoplethysmography in MATLAB: pulling a pulse waveform out of ordinary video by comparing three signal-extraction methods on the same footage.",
    image: "assets/img/projects/rppg.svg",
    plates: [{ src: "assets/img/projects/rppg.svg", cap: "Region of interest sampled from ordinary video, and the pulse waveform recovered from it." }],
    notes: {
      Problem:
        "The colour change a heartbeat produces in video sits well below the noise floor of lighting shifts and subject motion.",
      Scope:
        "Implement and compare the GREEN, CHROM and POS extraction methods on common input and judge which survives real conditions.",
      Role: "Signal chain and comparison framework, written in MATLAB.",
      Result:
        "CHROM was most accurate overall: 14.45 BPM mean absolute error across 20 videos of 4 subjects, against 15.43 for POS and 19.10 for GREEN. At rest every method stayed under 10 BPM; at elevated heart rates (128–141 BPM) all three broke down, with error rising to 29–48 BPM.",
      "Next pass": "Port the winning method to run on an embedded camera module."
    }
  },
  {
    id: "linear-pillow",
    no: "P-06",
    title: "Linear Actuating Lumbar Pillow",
    year: "2022",
    featured: false,
    tracks: ["mechanical", "embedded"],
    tags: ["SolidWorks", "Arduino", "Linear actuators", "3D print"],
    blurb:
      "A back support with six independently adjustable pads, so a wheelchair user can change their own lumbar support without waiting for help.",
    image: "assets/img/projects/lumbar-pillow-shell.png",
    plates: [
      { src: "assets/img/projects/lumbar-pillow-shell.png", cap: "SolidWorks model of the main pillow body." },
      { src: "assets/img/projects/lumbar-pillow-corner-pad.png", cap: "Corner pad assembly." },
      { src: "assets/img/projects/lumbar-pillow-middle-pad.png", cap: "Middle pad assembly." }
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
    no: "P-07",
    title: "DC Motor Velocity Controller",
    year: "2024",
    featured: false,
    tracks: ["electrical"],
    tags: ["MATLAB", "Simulink", "Control systems"],
    blurb:
      "Closed-loop speed control to a hard spec: 15 rad/s, zero steady-state error, overshoot under 10%, and settling within 0.6 s.",
    image: "assets/img/projects/velocity-controller-step-response.png",
    plates: [
      { src: "assets/img/projects/velocity-controller-simulink.png", cap: "Simulink model of the speed controller." },
      { src: "assets/img/projects/velocity-controller-step-response.png", cap: "Measured versus simulated step response." }
    ],
    notes: {
      Problem:
        "Hit 15 rad/s with zero steady-state error, under 10% overshoot, and a settling time within 0.6 s.",
      Scope:
        "Derive the motor transfer function, analyse the open-loop response, design the controller to spec, then validate in simulation and on hardware.",
      Role:
        "Modelled the transfer function, derived the feedback response, simulated in MATLAB and Simulink, and bench-tested the result.",
      Result:
        "Identified the motor from a measured step response — 22 rad/s per volt at steady state, with 30% and 70% rise points at 0.068 s and 0.21 s — giving G(s) = 7216 / ((s + 6.56)(s + 50)), which tracked the measured response. On the motor the controller held 15 rad/s with zero steady-state error and met the under-10% overshoot spec; measured settling ran slightly longer than simulated, the expected gap once real friction and supply behaviour enter the loop.",
      "Next pass": "Model the unmodelled: friction and drive non-linearity."
    }
  },
  {
    id: "ionic-thruster",
    no: "P-08",
    title: "Ionic Thruster",
    year: "2023",
    featured: false,
    tracks: ["mechanical", "electrical"],
    tags: ["High voltage", "Corona discharge", "SolidWorks"],
    blurb:
      "A working thruster with no moving parts and no combustion, built to test whether corona discharge gap distance actually changes thrust.",
    image: "assets/img/projects/ionic-thruster.jpg",
    fit: "cover",
    plates: [{ src: "assets/img/projects/ionic-thruster.jpg", cap: "Completed thruster assembly." }],
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
    no: "P-09",
    title: "Thermistor Thermometer",
    year: "2023",
    featured: false,
    tracks: ["embedded", "electrical"],
    tags: ["Arduino", "Thermistor", "Voltage divider"],
    blurb:
      "Built from first principles to understand the whole chain — thermistor, divider, ADC, linearisation — landing at ±0.1 °C.",
    image: "assets/img/projects/thermistor-thermometer.jpg",
    fit: "cover",
    plates: [{ src: "assets/img/projects/thermistor-thermometer.jpg", cap: "Completed breadboard circuit." }],
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
    no: "P-10",
    title: "Elevator Control Logic",
    year: "2023",
    featured: false,
    tracks: ["electrical", "embedded"],
    tags: ["Logic gates", "DE10-Lite FPGA", "E-stop", "Quartus"],
    blurb:
      "Floor-request handling for a four-storey building, designed as gate logic in Quartus and run on a DE10-Lite FPGA — including the emergency stop path.",
    image: "assets/img/projects/elevator-logic-board.jpg",
    fit: "cover",
    plates: [
      { src: "assets/img/projects/elevator-logic-board.jpg", cap: "The DE10-Lite FPGA board running floor changes." },
      { src: "assets/img/projects/elevator-logic-gates.png", cap: "Logic gate path for the control system." }
    ],
    notes: {
      Problem: "Understanding the decision logic inside something everyone uses and nobody thinks about.",
      Scope: "Design the control logic for floors 0–3 with gates, then run it on a DE10-Lite FPGA.",
      Role: "Designed a logic diagram against real elevator behaviour, reliability and efficiency.",
      Result:
        "Synthesised for the DE10-Lite's MAX 10 in 22 logic elements and 7 registers — under 1% of the device — and simulated across all 64 combinations of its six inputs in ModelSim, E-stop included.",
      "Next pass": "Add call queuing and directional priority."
    }
  },
  {
    id: "laser-mic",
    no: "P-11",
    title: "Laser Microphone",
    year: "2025",
    featured: false,
    tracks: ["electrical"],
    tags: ["Optics", "Signal recovery", "Analog"],
    blurb:
      "Phase 1 of optical-acoustic signal recovery: reading sound off a surface by the way it modulates a reflected beam.",
    image: "assets/img/projects/laser-mic.svg",
    plates: [{ src: "assets/img/projects/laser-mic.svg", cap: "The optical path and the recovered trace — signal-to-noise is the whole problem." }],
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
    id: "nec-building-design",
    no: "P-12",
    title: "Commercial Building Electrical Design",
    year: "2026",
    featured: false,
    tracks: ["electrical"],
    tags: ["NEC 2017", "EasyPower", "Load calculation", "Service sizing"],
    blurb:
      "The complete electrical service for a 50,000 sq ft commercial building — load calculation, transformer, service, feeders and panels — designed to NEC 2017 and modelled in EasyPower.",
    image: "assets/img/projects/nec-building-card.png",
    plates: [
      { src: "assets/img/projects/nec-building-one-line.png", cap: "EasyPower one-line: 500 kVA delta-wye transformer, 1,200 A main distribution panel, and the lighting, mechanical and kitchen panels with their loads." },
      { src: "assets/img/projects/nec-building-distribution.png", cap: "Distribution path from the 480 V utility to the three branch panels, with the governing NEC articles." }
    ],
    notes: {
      Problem:
        "Size the full electrical service for a 50,000 sq ft commercial building — 500 receptacles, 300 lighting loads, chillers, air handlers, pumps and a commercial kitchen — to NEC 2017.",
      Scope:
        "Load calculations with demand factors, transformer and service sizing, feeder and panel sizing, and a model of the distribution system in EasyPower, written up for client submission.",
      Role: "Sole author: every calculation, the distribution design and the EasyPower model.",
      Result:
        "340.6 kVA calculated demand, served at 480 V through a 500 kVA delta-wye transformer to 208Y/120 V, a 1,200 A main distribution panel on three parallel sets of 500 kcmil copper, and three branch panels — lighting and mechanical at 600 A, kitchen at 125 A.",
      "Next pass":
        "Run short-circuit and arc-flash studies on the same EasyPower model."
    }
  },
  {
    id: "speech-classifier",
    no: "P-13",
    title: "Spoken Yes / No Classifier",
    year: "2026",
    featured: false,
    tracks: ["software", "electrical"],
    tags: ["MATLAB", "DSP", "FFT", "KNN"],
    blurb:
      "Telling a spoken “yes” from a “no” across 886 recordings — a single hand-tuned frequency threshold against a K-nearest-neighbours classifier on the same blind test set.",
    image: "assets/img/projects/speech-classifier-accuracy.png",
    plates: [
      { src: "assets/img/projects/speech-classifier-accuracy.png", cap: "Blind-test accuracy: KNN on four frequency bands against the best single-band threshold." },
      { src: "assets/img/projects/speech-classifier-features.png", cap: "Training-set feature histograms — only the 8–16 kHz band separates the two words on its own." }
    ],
    notes: {
      Problem:
        "Distinguish “yes” from “no” across 886 recordings of male and female speakers — a dataset varied enough that one hand-picked feature stops being enough.",
      Scope:
        "Extract frequency-band features from each recording's spectrum, then compare a tuned single-feature threshold against a K-nearest-neighbours model on a held-out 25% test set.",
      Role:
        "MATLAB signal chain: FFT power spectra, a four-band energy feature vector (0–1, 1–4, 4–8 and 8–16 kHz), the threshold sweep and the KNN model.",
      Result:
        "The 8–16 kHz band separated the words best on its own, reaching 76.5% at its optimal threshold. KNN on all four bands reached 89.6% on the same blind test set.",
      "Next pass":
        "Replace band energies with MFCCs, and test on speakers held out of training entirely."
    }
  }
];
