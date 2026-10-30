# 传感器工程实验室

A mobile-friendly, browser-only learning workbench for sensor measurement engineering. The six interactive lessons use generic ideal models and synthetic data. A separate engineering-case collection summarizes source-checked vendor bench reports and a manual/driver-based failure-recovery design, without claiming an in-house hardware reproduction.

## Lessons

1. Source impedance, resistive loading, op-amp bandwidth and output swing
2. ADC acquisition and sample-capacitor settling
3. Reference-voltage error and ideal ratiometric measurement
4. Bias, noise and repeatability
5. Two-point calibration with held-out validation
6. Safe low-voltage measurement and structured diagnosis

The site includes adjustable parameters, documented model boundaries, CSV export for synthetic measurements, keyboard-accessible controls, reduced-motion support, and explicitly user-controlled local learning progress. There is no backend, login, analytics or data upload. Google Fonts is optional; system fonts are the fallback.

## Run

Serve this directory with any static HTTP server, for example:

    python3 -m http.server 8000

Open the server URL. Deploy the root directory as a static site. Routes use URL fragments so GitHub Pages needs no rewrite configuration.

## Test

    node models.test.cjs
    node render.test.cjs
    node engineering-cases.test.cjs

The numerical tests cover ADC settling and repeated-acquisition assumptions, sample statistics, deterministic noise, calibration/validation separation, loading, gain-bandwidth response, ideal ratio cancellation and parameter limits.

## Limits and safety

These are teaching models, not component specifications, hardware simulation tools, production calibration software, or safety certifications. ADC sample-capacitor initial conditions vary by architecture. Op-amp hard clipping is illustrative, not a physical saturation model. Ratiometric cancellation assumes perfect common proportional variation. Real references and calibration sources have uncertainty.

The measurement guidance is limited to verified safely isolated low-voltage DC systems. Never remove protective earth or connect an ordinary oscilloscope ground lead to mains, an unknown high-side node or a switching node. Use appropriately rated differential or isolated equipment when required.

## Sources

Official references and their verification dates are listed in the site’s reference view, including ST AN2834 Rev 10, TI SPRACT6A, TI SBOA356, ADI AN-1464, ADI AN-1142, and Tektronix probe guidance. Equations and numerical examples are independently derived from the stated ideal models.

## Engineering cases (original three verified 2026-10-17; fourth verified 2026-10-18)

- `#cases`: evidence-aware case index
- `#case/ti-tipd120`: TI three-wire RTD reference design, excitation mismatch, calibration and precision-resistor tests
- `#case/adi-cn0359`: ADI conductivity front end, AC excitation, autoranging and temperature compensation
- `#case/st-an4073`: ST STM32F407 laboratory comparison of ART settings, code dispersion and averaging cost
- `#case/st-adc-overrun`: STM32F407 ADC scan overrun, per-result DMA deadlines, conservative recovery generations, partial-frame rejection and completed-buffer ownership; a reasoned design from RM0090 Rev 22, AN4031 Rev 3 and pinned HAL source, not a bench report

Each case carries original/revision dates, official source links, hardware/software conditions, evidence type, explicit non-reproduction status, separately labeled calculations and a proposed bench acceptance checklist. New cases remain pending reading and do not migrate or mark the six original lesson states. The first three are vendor laboratory/reference-design cases; the fourth is a document-based fault-recovery design with no measured performance claim. None is a verified production deployment or a ranking of manufacturers. Vendor software and hardware procedures were not executed.

## Advanced MCU acquisition timing (verified 2026-10-17)

`#timing` adds an advanced, source-checked editorial lesson and interactive timing budget:
- STM32F407 TIM1 → TIM2/3/4 reset synchronization, supported CC2/TRGO/CC4 → ADC1/2/3 routes and nonconflicting DMA streams
- Explicit differences between scan, independent ADCs, simultaneous mode and interleaving
- PWM quiet-window triggering on F28003x, DMA double-buffer ownership and MUX/SAR acquisition settling
- Synthetic timing windows, frame deadline and per-ADC throughput budgets; no hardware simulation or board-test claim
- Current RM0090 Rev22, DS8626 Rev12 and ES0182 Rev19 references, plus official vendor applications and source examples

No vendor firmware was executed, no hardware was connected, and no learning state was changed automatically. The new page uses no persistent storage. Run `node mcu-timing.test.cjs` in addition to the existing tests.

The fourth case distinguishes ADC OVR, DMA TE/DME/FE and application-level buffer overwrite. It includes exact route/clock assumptions, scan/half-buffer arithmetic, a bounded recovery plan, a paper exercise and license limits. Source content is authored directly in `engineering-cases.js`; this repository has no build generator. No MCU or vendor firmware is executed by the site or its tests.

## Delta-sigma multiplexed acquisition case (verified 2026-10-19)

- `#case/ti-ads1256-mux`: ADS1256 digital-filter restart and settled channel-cycling throughput, distinct from the existing SAR acquisition and timer material.
- Sources: TI SBAS288K electrical body (September 2013; the November 2025 packaging addendum is separate) and SBAA535A (March 2024).
- The independent example separates 30 kSPS steady output, 4,374 total settled channel results/s under the specified vendor timing, analog guard, previous-channel result identity, and a four-channel frame deadline.
- A hypothetical RC/source-step budget raises the four-channel frame period from approximately 914.495 μs to 1045.019 μs before final processing, so the stated 1 ms target is not met. This is arithmetic from stated assumptions, not an ADS1256 circuit simulation or measured board result.
- Startup, missed-service invalidation, unperformed bench acceptance, two migration exercises and copyright/license boundaries are included. No MCU timer, DMA route, firmware executable or hardware action is introduced.

Run the focused original synthetic calculation/content regressions as well as all existing suites:

    node ads1256-scan.test.cjs

The focused suite freezes the previous four case objects and checks new timing, channel identity, error-budget and migration examples. Existing six lessons, timing module, styles and manual progress behavior are preserved. The new case remains pending reading; no completion state is inferred.

## ADC and GPIO concurrency case (verified 2026-10-20)

- `#case/st-dma2-gpio-contention`: a complementary STM32F407 design-review case about DMA2 AHB/APB2 concurrency when adding timer-paced GPIO excitation to three independent phase-staggered ADCs.
- Sources: ES0182 Rev 19 §2.2.19 and AN4031 Rev 3 §4.9; route and register checks use the retained complete RM0090 Rev 22 PDF. The official RM0090 remote PDF could not be read on this check; that limitation is disclosed in the case.
- Distinguishes request/stream selection, DMA port direction, direct-mode DMEIF, GPIO edge timing, analog settling and frame identity. Includes an explicitly unverified port-inversion candidate, not production firmware or a reproduced workaround.
- Original exercises independently check conditional timing margins, logical payload accounting, source/destination increments and rejected frame identities. No vendor code, firmware, board procedure or untrusted candidate executable was run.
- All previous five case objects, six lessons, numerical models, timing module, styles and manual progress behavior are preserved. No automatic completion state is added.

Run all prior suites and:

    node dma2-gpio.test.cjs

## Plain-language case introductions (2026-10-20)

All six case cards begin with the problem and the rough method. Detail pages additionally state the evidence boundary and a single takeaway before hardware conditions and register-level discussion. `SensorCaseOverviews` in `engineering-cases.js` is a separate presentation layer: original case evidence, dates, sources, formulas and learning status are retained unchanged. When adding a case, provide all four overview fields and keep untested proposals distinct from measured solutions.

Run `node case-overviews.test.cjs` alongside all existing suites. No build generator or learning-state migration is introduced.

## Cortex-M7 ADC DMA cache case (verified 2026-10-21)

- `#case/st-m7-adc-cache`: STM32H743 memory reachability, cache visibility and whole-cache-line buffer ownership are separate contracts.
- Sources: AN4839 Rev 2, RM0433 Rev 9 (2026-10-02), ST employee guidance, Arm employee explanation and CMSIS API documentation. No vendor code or board procedure was executed.
- Original address and timing exercises cover 32-byte lines, shared half-buffer boundaries and a 2 ms reuse window. They are arithmetic/protocol teaching checks, not hardware simulation or a production driver.
- The first six case objects, their plain-language overviews, lessons, timing workbench, designs and user-controlled local state remain unchanged.
- Run `node adc-cache.test.cjs` with all existing suites.

## Center-aligned trigger case (verified 2026-10-22)

- `#case/st-center-aligned-trigger`: STM32F407 TIM2 Compare Pulse versus OC2REF, ADC edge selection, paired preload commits and first-frame boundaries. RM0090 Rev 22, DS8626 Rev 12 and ES0182 Rev 19 are checked; this is documentation analysis plus an original model, not board reproduction or deployable firmware.
- `node center-aligned.test.cjs` checks CMS-specific compare events, steady-state OCREF transitions, split preload generations and the explicitly hypothetical ADC timing budget. All seven prior cases and manual learning state are preserved.


## Multiplexer order-dependent error case (verified 2026-10-23)

- `#case/adi-mux-order-memory`: compare fixed-channel and alternating-channel histograms, separating mean shift from code dispersion.
- Sources: ADI AN-2573 Rev. A (April 2024; original CN-0292 November 2014), Analog Dialogue 52-04 (April 2018), and AN-1024 Rev. 0 (July 2009).
- The AD7176-2 reference circuit uses a sigma-delta ADC; the independent single-pole recurrence is not its internal model or a firmware configuration. Synthetic order, settling and three-channel scheduling checks are not board reproduction.
- All eight prior cases, their overviews, six original lessons, styles, timing workbench and manual state remain unchanged.
- Run `node mux-memory.test.cjs` together with all existing test suites. No generator is used for this data file.


## Triple ADC frame identity (verified 2026-10-25)

- `#case/stm32f407-triple-simultaneous-identity`: RM0090 Rev 22 and ES0182 Rev 19; distinguish simultaneous conversion from the sequential mode 1 DMA stream, incomplete frames and half-buffer boundaries.
- The documented halfword/32-bit wording discrepancy remains explicit and requires bench verification. No pin mapping, deployable firmware or board reproduction is claimed.
- Run `node triple-adc.test.cjs` with all existing suites. Eleven pending cases preserve prior content and manual learning state.

## SAR reference burst-load case (verified 2026-10-26)

- `#case/adi-sar-reference-burst`: reference charge replenishment during conversion, distinct from input MUX settling and the existing timer-routing lessons.
- Primary evidence: ADI AN-931 Rev. 0 (June 2008), AD7686 at 500 kSPS, 22 µF reference capacitance, 8192-sample bursts; Analog Dialogue 47-06 (June 2013); AD7980 Rev. G (January 2021), Tables 2/3 and pp.18/25.
- Separates the article's approximately 2.5 mA observed peaks (500 Ω measurement setup, not a recommended series resistor) from the AD7980's 330 µA typical average load at 1 MSPS and 5 V.
- Independent hypothetical charge model: q=330 pC, T=1 µs, R=1 Ω, C=10 µF. First-pulse droop is 33 µV but the sixteenth reaches 276.762 µV and the asymptotic peak 346.775 µV. Raising C to 22 µF reduces the single jump but leaves the 330 µV period-average drop unchanged. This is not a chip, buffer-loop or board simulation.
- No vendor code or hardware was run; no reference schematic or firmware is asserted production-ready. The previous eleven cases and overviews are retained byte-for-byte, along with unchanged app, models, timing lesson, styles and manually controlled learning state.
- Run `node reference-burst.test.cjs` and all prior suites. The case-rendering regression includes saved lesson parameters, completed/pending states and motion preference; reading the new route does not complete lessons or migrate storage.

## Mixed-rate ADC burst case (verified 2026-10-27)

- `#case/ti-f280015x-burst-sample-age`: F2800157 / C2000Ware 26.02.00.00.LTS, commit 699b8c6aa190cf7430a36bdcf7f5b1ea2e928063. One ADCA burst contains three sequential slots; A0/A1 repeat and A2/A3/A4 rotate.
- Cross-checks the SysConfig raw field → generated API count → hardware field contract, RR pointer and overflow limits, actual clocks versus comments, acquisition/EOC/result-latch separation, and per-channel sample age.
- SPRUIY4B (May 2024) and SPRSP68D (November 2025) support timing boundaries. No vendor code, hardware, or build toolchain was executed. Numerical examples are original conditional calculations, not latency measurements.
- Twelve previous case objects and all lesson/local-state behavior preserved. Only a pinned official TI repository prefix is added to the source regression allowlist; no broad source relaxation.
- Run `node adc-burst-age.test.cjs` and every existing suite.

## nRF52840 SAADC buffer deadline case

Adds a source-checked TIMER/PPI/SAADC/EasyDMA case and original three-channel frame/buffer budget. Official tutorial is single-channel; the three-channel schedule is explicitly a teaching model, not a hardware reproduction. Existing 13 cases and local progress are unchanged. Run `node saadc-buffer.test.cjs` plus all existing `*.test.cjs`.

## Multi-ADC reconfiguration and synchronization case (verified 2026-10-29)

- `#case/adi-ade-reconfiguration-sync`: ADI AN-2625 with ADEMA124/127 Rev. A and ADE91xx Rev. A. Configuration can pause conversion despite a shared clock; post-configuration alignment, snapshot verification, filter settling and application epoch identity are separate acceptance gates.
- Original conditional SPI arithmetic and failure-path tests are not a hardware reproduction, complete driver, or mains measurement procedure. No candidate software was executed.
- All fourteen existing case objects and overviews, six lessons, styles, timing workbench and manually controlled local progress are retained. No generator is used.
- Run `node ade-sync.test.cjs` and every existing `*.test.cjs`.

## BMI270 FIFO transaction-boundary case (verified 2026-10-30)

- `#case/bosch-bmi270-fifo-transaction`: complete-frame dequeue, partial-frame replay across bus transactions, and readout-time versus sampling-time evidence.
- Uses Bosch BMI270 Rev. 1.6 (March 2026) and the official product page. Standard 2048-byte FIFO only; no MaxFIFO configuration. The wearable-oriented part is not presented as industrial-qualified.
- Original A/B/C examples distinguish a 20-byte transaction followed by a 26-byte transaction from DMA chunks within one continuous burst. Capacity and clock-wrap arithmetic are conditional teaching calculations, not measured throughput or a timestamp implementation.
- No candidate firmware, vendor driver or hardware was executed. All fifteen prior case objects and overviews, six lessons, styling, timing workbench and manual local progress remain unchanged. No generator is used.
- Run `node bmi270-fifo.test.cjs` and every existing `*.test.cjs`.
