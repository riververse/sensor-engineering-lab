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
