# 传感器工程实验室

A mobile-friendly, browser-only learning workbench for sensor measurement engineering. All examples use generic ideal models and synthetic data.

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

The numerical tests cover ADC settling and repeated-acquisition assumptions, sample statistics, deterministic noise, calibration/validation separation, loading, gain-bandwidth response, ideal ratio cancellation and parameter limits.

## Limits and safety

These are teaching models, not component specifications, hardware simulation tools, production calibration software, or safety certifications. ADC sample-capacitor initial conditions vary by architecture. Op-amp hard clipping is illustrative, not a physical saturation model. Ratiometric cancellation assumes perfect common proportional variation. Real references and calibration sources have uncertainty.

The measurement guidance is limited to verified safely isolated low-voltage DC systems. Never remove protective earth or connect an ordinary oscilloscope ground lead to mains, an unknown high-side node or a switching node. Use appropriately rated differential or isolated equipment when required.

## Sources

Official references and their verification dates are listed in the site’s reference view, including ST AN2834 Rev 10, TI SPRACT6A, TI SBOA356, ADI AN-1464, ADI AN-1142, and Tektronix probe guidance. Equations and numerical examples are independently derived from the stated ideal models.
