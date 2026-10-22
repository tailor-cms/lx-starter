/**
 * LX API Console - Custom Swagger UI Theme
 * A clean, light-themed API documentation experience
 */
export const swaggerCustomCss = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700;800&display=swap');

  :root {
    --surface: #ffffff;
    --surface-light: #f8fafc;
    --surface-lighter: #f1f5f9;
    --surface-border: #e2e8f0;
    --surface-hover: #f1f5f9;
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-muted: #94a3b8;
    --accent-cyan: #0891b2;
    --accent-violet: #7c3aed;
    --accent-emerald: #059669;
    --accent-amber: #d97706;
    --accent-rose: #e11d48;
    --accent-blue: #2563eb;
    --gradient-accent: linear-gradient(
      135deg,
      var(--accent-cyan),
      var(--accent-violet)
    );
    --font-mono: 'JetBrains Mono', monospace;
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 14px;
    --radius-xl: 20px;
    --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: var(--surface) !important;
    font-family: var(--font-sans) !important;
    overflow-x: hidden;
  }

  /* Animations */
  @keyframes heroGlow {
    0% {
      transform: translate(0, 0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translate(30px, -20px) rotate(3deg);
      opacity: 0.8;
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.3);
    }
  }

  @keyframes float {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }
    25% {
      transform: translate(30px, -40px) scale(1.08);
    }
    50% {
      transform: translate(-15px, 25px) scale(0.95);
    }
    75% {
      transform: translate(40px, 15px) scale(1.03);
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(24px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Hero Section */
  .lx-hero {
    position: relative;
    padding: 100px 48px 80px;
    background: linear-gradient(
      180deg,
      var(--surface-light) 0%,
      var(--surface) 100%
    );
    border-bottom: 1px solid var(--surface-border);
    overflow: hidden;
  }

  .lx-hero::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -20%;
    width: 140%;
    height: 200%;
    background:
      radial-gradient(
        ellipse 500px 500px at 20% 30%,
        rgba(8, 145, 178, 0.12) 0%,
        transparent 70%
      ),
      radial-gradient(
        ellipse 400px 400px at 80% 20%,
        rgba(124, 58, 237, 0.1) 0%,
        transparent 70%
      ),
      radial-gradient(
        ellipse 350px 350px at 60% 80%,
        rgba(5, 150, 105, 0.08) 0%,
        transparent 70%
      );
    animation: heroGlow 15s ease-in-out infinite alternate;
    pointer-events: none;
  }

  .lx-hero-content {
    position: relative;
    z-index: 2;
    max-width: 1400px;
    margin: 0 auto;
  }

  .lx-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: rgba(8, 145, 178, 0.08);
    border: 1px solid rgba(8, 145, 178, 0.25);
    border-radius: 100px;
    font-size: 11px;
    font-weight: 600;
    color: var(--accent-cyan);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 28px;
    animation: fadeInDown 0.6s ease backwards;
  }

  .lx-badge-dot {
    width: 8px;
    height: 8px;
    background: var(--accent-emerald);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
    box-shadow: 0 0 12px var(--accent-emerald);
  }

  .lx-title {
    font-size: 64px;
    font-weight: 800;
    letter-spacing: -0.035em;
    line-height: 1.05;
    margin: 0 0 20px;
    background: linear-gradient(135deg, #0f172a 0%, #475569 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: fadeInUp 0.6s ease backwards 0.1s;
  }

  .lx-title span,
  .lx-stat-value .lx-stat-highlight {
    background: var(--gradient-accent);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .lx-subtitle {
    font-size: 18px;
    color: var(--text-secondary);
    margin: 0 0 48px;
    max-width: 550px;
    line-height: 1.7;
    animation: fadeInUp 0.6s ease backwards 0.2s;
  }

  .lx-stats {
    display: flex;
    gap: 56px;
    animation: fadeInUp 0.6s ease backwards 0.3s;
  }

  .lx-stat {
    text-align: left;
    position: relative;
  }

  .lx-stat::after {
    content: '';
    position: absolute;
    right: -28px;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 40px;
    background: linear-gradient(
      180deg,
      transparent,
      var(--surface-border),
      transparent
    );
  }

  .lx-stat:last-child::after {
    display: none;
  }

  .lx-stat-value {
    font-size: 42px;
    font-weight: 700;
    font-family: var(--font-mono);
    color: var(--text-primary);
    margin-bottom: 6px;
    line-height: 1;
  }

  .lx-stat-label {
    font-size: 12px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 500;
  }

  /* Action Buttons */
  .lx-actions {
    display: flex;
    gap: 12px;
    margin-top: 48px;
    animation: fadeInUp 0.6s ease backwards 0.4s;
  }

  .lx-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 24px;
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
    text-decoration: none;
  }

  .lx-action-btn-primary {
    background: var(--gradient-accent);
    color: white;
    border: none;
    box-shadow: 0 4px 20px rgba(8, 145, 178, 0.3);
  }

  .lx-action-btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 30px rgba(8, 145, 178, 0.4);
  }

  .lx-action-btn-secondary {
    background: var(--surface);
    color: var(--text-secondary);
    border: 1px solid var(--surface-border);
  }

  .lx-action-btn-secondary:hover {
    background: var(--surface-light);
    border-color: var(--text-muted);
    color: var(--text-primary);
    transform: translateY(-2px);
  }

  /* Floating Orbs */
  .lx-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    animation: float 20s ease-in-out infinite;
  }

  .lx-orb-1 {
    width: 400px;
    height: 400px;
    background: var(--accent-cyan);
    opacity: 0.12;
    top: -150px;
    right: 5%;
  }

  .lx-orb-2 {
    width: 300px;
    height: 300px;
    background: var(--accent-violet);
    opacity: 0.1;
    bottom: -100px;
    right: 25%;
    animation-delay: -5s;
  }

  .lx-orb-3 {
    width: 250px;
    height: 250px;
    background: var(--accent-emerald);
    opacity: 0.08;
    top: 40%;
    left: 0%;
    animation-delay: -10s;
  }

  .lx-grid-pattern {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.6) 0%,
      transparent 100%
    );
    pointer-events: none;
  }

  /* Hide default swagger elements */
  .swagger-ui .information-container,
  .swagger-ui .info,
  .swagger-ui .topbar,
  .swagger-ui .scheme-container {
    display: none !important;
  }

  /* Main Content */
  .swagger-ui {
    font-family: var(--font-sans) !important;
    background: var(--surface) !important;
  }

  .swagger-ui .wrapper {
    padding: 40px 48px !important;
    max-width: 1400px !important;
    margin: 0 auto !important;
  }

  /* Search Bar */
  .swagger-ui .filter-container {
    margin: 0 0 32px !important;
    position: relative !important;
  }

  .swagger-ui .filter-container input[type='text'] {
    background: var(--surface-light) !important;
    border: 1px solid var(--surface-border) !important;
    border-radius: var(--radius-lg) !important;
    color: var(--text-primary) !important;
    padding: 18px 24px !important;
    font-size: 15px !important;
    width: 100% !important;
    transition: var(--transition) !important;
  }

  .swagger-ui .filter-container input[type='text']:focus {
    border-color: var(--accent-cyan) !important;
    box-shadow: 0 0 0 4px rgba(8, 145, 178, 0.1) !important;
    outline: none !important;
  }

  .swagger-ui .filter-container input[type='text']::placeholder {
    color: var(--text-muted) !important;
  }

  /* Tags */
  .swagger-ui .opblock-tag-section {
    margin-bottom: 12px !important;
    animation: slideIn 0.4s ease backwards;
  }

  .swagger-ui .opblock-tag-section:nth-child(1) { animation-delay: 0.05s; }
  .swagger-ui .opblock-tag-section:nth-child(2) { animation-delay: 0.1s; }
  .swagger-ui .opblock-tag-section:nth-child(3) { animation-delay: 0.15s; }
  .swagger-ui .opblock-tag-section:nth-child(4) { animation-delay: 0.2s; }
  .swagger-ui .opblock-tag-section:nth-child(5) { animation-delay: 0.25s; }
  .swagger-ui .opblock-tag-section:nth-child(6) { animation-delay: 0.3s; }
  .swagger-ui .opblock-tag-section:nth-child(7) { animation-delay: 0.35s; }
  .swagger-ui .opblock-tag-section:nth-child(8) { animation-delay: 0.4s; }

  .swagger-ui .opblock-tag {
    background: var(--surface-light) !important;
    border: 1px solid var(--surface-border) !important;
    border-radius: var(--radius-lg) !important;
    margin: 0 !important;
    padding: 20px 28px !important;
    transition: var(--transition) !important;
    cursor: pointer !important;
    position: relative !important;
    overflow: hidden !important;
  }

  .swagger-ui .opblock-tag::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--gradient-accent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .swagger-ui .opblock-tag:hover {
    border-color: rgba(8, 145, 178, 0.3) !important;
    background: var(--surface-hover) !important;
    transform: translateX(4px) !important;
  }

  .swagger-ui .opblock-tag:hover::before,
  .swagger-ui .opblock-tag[data-is-open='true']::before {
    opacity: 1;
  }

  .swagger-ui .opblock-tag[data-is-open='true'] {
    border-color: var(--accent-cyan) !important;
    background: linear-gradient(
      135deg,
      rgba(8, 145, 178, 0.06) 0%,
      rgba(124, 58, 237, 0.06) 100%
    ) !important;
    box-shadow: 0 8px 32px rgba(8, 145, 178, 0.1) !important;
    transform: translateX(0) !important;
  }

  .swagger-ui .opblock-tag a.nostyle {
    color: var(--text-primary) !important;
    font-size: 17px !important;
    font-weight: 600 !important;
    letter-spacing: -0.01em !important;
    display: flex !important;
    align-items: center !important;
    gap: 14px !important;
    margin-right: 16px !important;
  }

  .swagger-ui .opblock-tag a.nostyle span {
    flex: 1 !important;
  }

  .swagger-ui .opblock-tag small {
    color: var(--text-muted) !important;
    font-size: 12px !important;
    background: var(--surface) !important;
    padding: 6px 14px !important;
    border-radius: var(--radius-xl) !important;
    font-weight: 500 !important;
    border: 1px solid var(--surface-border) !important;
  }

  .swagger-ui .opblock-tag svg {
    fill: var(--text-muted) !important;
    transition: var(--transition) !important;
  }

  .swagger-ui .opblock-tag:hover svg {
    fill: var(--accent-cyan) !important;
  }

  /* Operation Blocks */
  .swagger-ui .opblock {
    background: var(--surface-light) !important;
    border: 1px solid var(--surface-border) !important;
    border-radius: var(--radius-md) !important;
    margin: 16px 0 !important;
    box-shadow: none !important;
    overflow: hidden !important;
    transition: var(--transition) !important;
  }

  .swagger-ui .opblock:hover {
    border-color: var(--text-muted) !important;
    transform: translateX(4px) !important;
  }

  .swagger-ui .opblock.is-open {
    transform: none !important;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25) !important;
  }

  /* Method Colors */
  .swagger-ui .opblock.opblock-get {
    border-left: 3px solid var(--accent-emerald) !important;
  }

  .swagger-ui .opblock.opblock-post {
    border-left: 3px solid var(--accent-blue) !important;
  }

  .swagger-ui .opblock.opblock-put {
    border-left: 3px solid var(--accent-amber) !important;
  }

  .swagger-ui .opblock.opblock-patch {
    border-left: 3px solid var(--accent-violet) !important;
  }

  .swagger-ui .opblock.opblock-delete {
    border-left: 3px solid var(--accent-rose) !important;
  }

  .swagger-ui .opblock.opblock-get.is-open {
    border-color: var(--accent-emerald) !important;
    box-shadow:
      0 0 60px rgba(5, 150, 105, 0.12),
      0 16px 48px rgba(0, 0, 0, 0.25) !important;
  }

  .swagger-ui .opblock.opblock-post.is-open {
    border-color: var(--accent-blue) !important;
    box-shadow:
      0 0 60px rgba(37, 99, 235, 0.12),
      0 16px 48px rgba(0, 0, 0, 0.25) !important;
  }

  .swagger-ui .opblock.opblock-put.is-open {
    border-color: var(--accent-amber) !important;
    box-shadow:
      0 0 60px rgba(217, 119, 6, 0.12),
      0 16px 48px rgba(0, 0, 0, 0.25) !important;
  }

  .swagger-ui .opblock.opblock-patch.is-open {
    border-color: var(--accent-violet) !important;
    box-shadow:
      0 0 60px rgba(124, 58, 237, 0.12),
      0 16px 48px rgba(0, 0, 0, 0.25) !important;
  }

  .swagger-ui .opblock.opblock-delete.is-open {
    border-color: var(--accent-rose) !important;
    box-shadow:
      0 0 60px rgba(225, 29, 72, 0.12),
      0 16px 48px rgba(0, 0, 0, 0.25) !important;
  }

  .swagger-ui .opblock.opblock-get .opblock-summary-method {
    background: rgba(5, 150, 105, 0.12) !important;
    color: var(--accent-emerald) !important;
  }

  .swagger-ui .opblock.opblock-post .opblock-summary-method {
    background: rgba(37, 99, 235, 0.12) !important;
    color: var(--accent-blue) !important;
  }

  .swagger-ui .opblock.opblock-put .opblock-summary-method {
    background: rgba(217, 119, 6, 0.12) !important;
    color: var(--accent-amber) !important;
  }

  .swagger-ui .opblock.opblock-patch .opblock-summary-method {
    background: rgba(124, 58, 237, 0.12) !important;
    color: var(--accent-violet) !important;
  }

  .swagger-ui .opblock.opblock-delete .opblock-summary-method {
    background: rgba(225, 29, 72, 0.12) !important;
    color: var(--accent-rose) !important;
  }

  .swagger-ui .opblock-summary-method {
    font-family: var(--font-mono) !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    padding: 10px 18px !important;
    border-radius: var(--radius-sm) !important;
    min-width: 84px !important;
    text-align: center !important;
    text-transform: uppercase !important;
    letter-spacing: 0.06em !important;
  }

  .swagger-ui .opblock-summary-path {
    font-family: var(--font-mono) !important;
    font-size: 17px !important;
    color: var(--text-primary) !important;
  }

  .swagger-ui .opblock-summary-description {
    font-size: 16px !important;
    color: var(--text-muted) !important;
  }

  /* Operation Body */
  .swagger-ui .opblock-body {
    background: var(--surface) !important;
    border-top: 1px solid var(--surface-border) !important;
  }

  .swagger-ui .opblock-body pre {
    background: var(--surface-lighter) !important;
    border: 1px solid var(--surface-border) !important;
    border-radius: 10px !important;
    color: var(--text-secondary) !important;
    font-family: var(--font-mono) !important;
    font-size: 13px !important;
    padding: 16px !important;
  }

  .swagger-ui .opblock-section-header {
    background: var(--surface-lighter) !important;
    border-bottom: 1px solid var(--surface-border) !important;
    padding: 14px 24px !important;
  }

  .swagger-ui .opblock-section-header h4 {
    color: var(--text-secondary) !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.1em !important;
  }

  /* Parameters */
  .swagger-ui .parameters-col_name {
    color: var(--text-primary) !important;
    font-family: var(--font-mono) !important;
    font-size: 14px !important;
    padding: 16px 20px !important;
    vertical-align: top !important;
    min-width: 180px !important;
  }

  .swagger-ui .parameter__name {
    font-weight: 600 !important;
    font-size: 14px !important;
    color: var(--text-primary) !important;
  }

  .swagger-ui .parameter__name.required span {
    color: var(--accent-rose) !important;
  }

  .swagger-ui .parameter__name.required::after {
    display: none !important;
  }

  .swagger-ui .parameters-col_name .parameter__type {
    color: var(--accent-violet) !important;
    font-family: var(--font-mono) !important;
    font-size: 11px !important;
    background: rgba(124, 58, 237, 0.08) !important;
    padding: 3px 10px !important;
    border-radius: 4px !important;
    display: inline-block !important;
    margin: 8px 8px 0 0 !important;
  }

  .swagger-ui .parameter__in {
    color: var(--text-muted) !important;
    font-family: var(--font-mono) !important;
    font-size: 11px !important;
    font-style: normal !important;
    background: var(--surface-lighter) !important;
    padding: 3px 10px !important;
    border-radius: 4px !important;
    display: inline-block !important;
    margin-top: 8px !important;
  }

  /* Tables */
  .swagger-ui table thead tr th {
    background: var(--surface-lighter) !important;
    color: var(--text-muted) !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.08em !important;
    padding: 14px 20px !important;
    border: none !important;
    border-bottom: 1px solid var(--surface-border) !important;
  }

  .swagger-ui table tbody tr td {
    background: var(--surface-light) !important;
    color: var(--text-secondary) !important;
    padding: 14px 20px !important;
    border: none !important;
    border-bottom: 1px solid var(--surface-border) !important;
    transition: background 0.2s ease !important;
  }

  .swagger-ui table tbody tr:hover td {
    background: var(--surface-hover) !important;
  }

  /* Form Elements */
  .swagger-ui input[type='text'],
  .swagger-ui textarea,
  .swagger-ui select {
    background: var(--surface) !important;
    border: 1px solid var(--surface-border) !important;
    border-radius: var(--radius-sm) !important;
    color: var(--text-primary) !important;
    font-family: var(--font-mono) !important;
    font-size: 13px !important;
    padding: 12px 16px !important;
    transition: all 0.2s ease !important;
  }

  .swagger-ui input[type='text']:focus,
  .swagger-ui textarea:focus,
  .swagger-ui select:focus {
    border-color: var(--accent-cyan) !important;
    box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1) !important;
    outline: none !important;
  }

  /* Buttons */
  .swagger-ui .btn {
    background: var(--surface-lighter) !important;
    border: 1px solid var(--surface-border) !important;
    border-radius: 10px !important;
    color: var(--text-secondary) !important;
    font-weight: 500 !important;
    padding: 12px 20px !important;
    font-size: 13px !important;
    transition: all 0.2s ease !important;
  }

  .swagger-ui .btn:hover {
    border-color: var(--text-muted) !important;
    color: var(--text-primary) !important;
    transform: translateY(-1px) !important;
  }

  .swagger-ui .btn.execute {
    background: var(--gradient-accent) !important;
    border: none !important;
    color: var(--surface) !important;
    font-weight: 600 !important;
    box-shadow: 0 4px 20px rgba(8, 145, 178, 0.3) !important;
  }

  .swagger-ui .btn.execute:hover {
    box-shadow: 0 8px 30px rgba(8, 145, 178, 0.4) !important;
    transform: translateY(-2px) !important;
  }

  .swagger-ui .btn.cancel {
    background: transparent !important;
    border: 1px solid var(--accent-rose) !important;
    color: var(--accent-rose) !important;
  }

  .swagger-ui .btn.cancel:hover {
    background: rgba(225, 29, 72, 0.1) !important;
  }

  /* Models Section */
  .swagger-ui section.models {
    background: var(--surface-light) !important;
    border: 1px solid var(--surface-border) !important;
    border-radius: 16px !important;
    overflow: hidden !important;
    margin-top: 40px !important;
  }

  .swagger-ui section.models h4 {
    background: linear-gradient(
      135deg,
      rgba(8, 145, 178, 0.03) 0%,
      rgba(124, 58, 237, 0.03) 100%
    ) !important;
    border-bottom: 1px solid var(--surface-border) !important;
    color: var(--text-primary) !important;
    padding: 20px 28px !important;
    margin: 0 !important;
    font-size: 16px !important;
    font-weight: 600 !important;
  }

  .swagger-ui section.models .no-margin {
    padding: 16px !important;
  }

  .swagger-ui section.models .model-container {
    background: var(--surface) !important;
    border: 1px solid var(--surface-border) !important;
    border-radius: var(--radius-sm) !important;
    margin-bottom: 8px !important;
    transition: var(--transition) !important;
  }

  .swagger-ui section.models .model-container:hover {
    border-color: rgba(8, 145, 178, 0.3) !important;
    box-shadow: 0 4px 12px rgba(8, 145, 178, 0.06) !important;
  }

  .swagger-ui .model-box {
    background: transparent !important;
    padding: 12px 16px !important;
  }

  /* Schema entry title - consistent size */
  .swagger-ui .model-box > span,
  .swagger-ui .model-box > span > span,
  .swagger-ui .model-box-control,
  .swagger-ui .model-box-control > span {
    font-family: var(--font-mono) !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    color: var(--text-primary) !important;
  }

  .swagger-ui .model {
    color: var(--text-secondary) !important;
    font-family: var(--font-mono) !important;
    font-size: 13px !important;
  }

  /* Expanded schema table */
  .swagger-ui table.model {
    background: var(--surface-lighter) !important;
    border-radius: var(--radius-sm) !important;
    border-collapse: separate !important;
    border-spacing: 0 !important;
    margin: 16px 0 8px !important;
    width: 100% !important;
  }

  .swagger-ui table.model tbody tr {
    transition: background 0.15s ease !important;
  }

  .swagger-ui table.model tbody tr:hover {
    background: rgba(8, 145, 178, 0.04) !important;
  }

  .swagger-ui table.model tbody tr td {
    padding: 12px 16px !important;
    border-bottom: 1px solid var(--surface-border) !important;
    vertical-align: top !important;
  }

  .swagger-ui table.model tbody tr:last-child td {
    border-bottom: none !important;
  }

  .swagger-ui table.model tbody tr td:first-child {
    font-weight: 600 !important;
    color: var(--text-primary) !important;
    white-space: nowrap !important;
    width: 1% !important;
  }

  .swagger-ui .model .prop-type {
    color: var(--accent-violet) !important;
    font-size: 12px !important;
    background: rgba(124, 58, 237, 0.08) !important;
    padding: 2px 8px !important;
    border-radius: 4px !important;
    display: inline-block !important;
  }

  .swagger-ui .model .prop-enum {
    color: var(--accent-emerald) !important;
    font-size: 12px !important;
  }

  .swagger-ui .model-toggle {
    background: var(--surface-light) !important;
    border: 1px solid var(--surface-border) !important;
    border-radius: 4px !important;
    cursor: pointer !important;
    transition: var(--transition) !important;
  }

  .swagger-ui .model-toggle:hover {
    border-color: var(--accent-cyan) !important;
    background: rgba(8, 145, 178, 0.08) !important;
  }

  .swagger-ui .model .property {
    color: var(--accent-cyan) !important;
    font-weight: 600 !important;
  }

  .swagger-ui .model .star {
    color: var(--accent-rose) !important;
    font-weight: bold !important;
  }

  /* Remove focus outlines */
  .swagger-ui .model-box-control:focus,
  .swagger-ui .models-control:focus,
  .swagger-ui .opblock-summary-control:focus {
    outline: none !important;
  }

  .swagger-ui .models-control {
    background: transparent !important;
  }

  /* Modal */
  .swagger-ui .dialog-ux .modal-ux {
    background: var(--surface-light) !important;
    border: 1px solid var(--surface-border) !important;
    border-radius: var(--radius-xl) !important;
    box-shadow:
      0 25px 80px rgba(0, 0, 0, 0.6),
      0 0 120px rgba(8, 145, 178, 0.08) !important;
    overflow: hidden !important;
  }

  .swagger-ui .dialog-ux .modal-ux-header {
    background: linear-gradient(
      135deg,
      rgba(8, 145, 178, 0.05) 0%,
      rgba(124, 58, 237, 0.05) 100%
    ) !important;
    border-bottom: 1px solid var(--surface-border) !important;
    padding: 24px 28px !important;
  }

  .swagger-ui .dialog-ux .modal-ux-header h3 {
    color: var(--text-primary) !important;
    font-size: 20px !important;
    font-weight: 600 !important;
  }

  .swagger-ui .dialog-ux .modal-ux-content {
    background: var(--surface-light) !important;
    padding: 28px !important;
  }

  .swagger-ui .dialog-ux .backdrop-ux {
    background: rgba(0, 0, 0, 0.85) !important;
    backdrop-filter: blur(12px) !important;
  }

  /* Code & Markdown */
  .swagger-ui .highlight-code {
    background: var(--surface-lighter) !important;
    border-radius: 10px !important;
    border: 1px solid var(--surface-border) !important;
  }

  .swagger-ui .highlight-code > .microlight {
    background: transparent !important;
    color: var(--text-secondary) !important;
    font-family: var(--font-mono) !important;
    font-size: 13px !important;
    line-height: 1.6 !important;
  }

  .swagger-ui .markdown p,
  .swagger-ui .markdown li {
    color: var(--text-secondary) !important;
  }

  .swagger-ui .markdown code {
    background: var(--surface-lighter) !important;
    border: 1px solid var(--surface-border) !important;
    border-radius: 6px !important;
    color: var(--accent-cyan) !important;
    font-family: var(--font-mono) !important;
    padding: 3px 8px !important;
  }

  /* Response */
  .swagger-ui .responses-inner {
    padding: 24px !important;
  }

  .swagger-ui .response-col_status {
    font-family: var(--font-mono) !important;
    font-weight: 600 !important;
    color: var(--accent-emerald) !important;
  }

  .swagger-ui .copy-to-clipboard {
    background: var(--surface) !important;
    border: 1px solid var(--surface-border) !important;
    border-radius: var(--radius-sm) !important;
    transition: all 0.2s ease !important;
  }

  .swagger-ui .copy-to-clipboard:hover {
    border-color: var(--accent-cyan) !important;
    box-shadow: 0 0 15px rgba(8, 145, 178, 0.2) !important;
  }

  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 10px !important;
    height: 10px !important;
  }

  ::-webkit-scrollbar-track {
    background: var(--surface) !important;
  }

  ::-webkit-scrollbar-thumb {
    background: var(--surface-border) !important;
    border-radius: 5px !important;
    border: 2px solid var(--surface) !important;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--text-muted) !important;
  }

  /* Loading */
  .swagger-ui .loading-container {
    background: var(--surface) !important;
  }

  .swagger-ui .loading-container .loading::after {
    border-color: var(--accent-cyan) transparent transparent !important;
  }

  /* Sidebar */
  .lx-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 220px;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 24px 16px;
    background: var(--surface-light);
    border-right: 1px solid var(--surface-border);
    overflow-y: auto;
  }

  .lx-sidebar::-webkit-scrollbar {
    width: 4px;
  }

  .lx-sidebar::-webkit-scrollbar-thumb {
    background: var(--surface-border);
    border-radius: 2px;
  }

  .lx-sidebar-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 8px 12px 16px;
    margin-bottom: 8px;
  }

  .lx-sidebar-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    position: relative;
    overflow: hidden;
  }

  .lx-sidebar-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--gradient-accent);
    opacity: 0;
    transition: opacity 0.2s ease;
    border-radius: 0 2px 2px 0;
  }

  .lx-sidebar-item:hover {
    background: var(--surface-hover);
  }

  .lx-sidebar-item:hover::before,
  .lx-sidebar-item.active::before {
    opacity: 1;
  }

  .lx-sidebar-item.active {
    background: linear-gradient(
      135deg,
      rgba(8, 145, 178, 0.08) 0%,
      rgba(124, 58, 237, 0.08) 100%
    );
  }

  .lx-sidebar-item-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lx-sidebar-item:hover .lx-sidebar-item-name,
  .lx-sidebar-item.active .lx-sidebar-item-name {
    color: var(--text-primary);
  }

  @media (max-width: 1200px) {
    .lx-sidebar {
      display: none;
    }
  }

  @media (min-width: 1201px) {
    html {
      margin-left: 220px !important;
    }

    .swagger-ui .wrapper,
    .lx-hero-content {
      max-width: 1200px !important;
      margin: 0 auto !important;
    }
  }

  /* Footer */
  .lx-footer {
    text-align: center;
    padding: 40px 48px;
    border-top: 1px solid var(--surface-border);
    margin-top: 60px;
  }

  .lx-footer p {
    color: var(--text-muted);
    font-size: 13px;
    margin: 0;
  }

  .lx-footer a {
    color: var(--accent-cyan);
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .lx-footer a:hover {
    text-shadow: 0 0 10px rgba(8, 145, 178, 0.5);
  }
`;

export const swaggerCustomJs = `
(function () {
  function wait(fn, ms) {
    ms = ms || 50;
    var check = function () {
      if (!fn()) {
        setTimeout(check, ms);
      }
    };
    check();
  }

  wait(function () {
    var wrapper = document.querySelector('.swagger-ui');
    var tags = document.querySelectorAll('.opblock-tag-section');
    if (!wrapper || !tags.length) return false;
    initUI();
    return true;
  });

  function initUI() {
    createHero();
    createParticles();
    createSidebar();
    createFooter();
    showStats();
    setupScrollSpy();
    fixSyntaxHighlighting();
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        var input = document.querySelector('.swagger-ui .filter-container input');
        if (input) input.focus();
      }
    });
  }

  function fixSyntaxHighlighting() {
    var colors = {
      string: '#059669',
      number: '#c2410c',
      punctuation: '#64748b',
      boolean: '#7c3aed'
    };

    function cleanInlineStyles() {
      var selector = '.swagger-ui pre';
      var els = document.querySelectorAll(selector);
      els.forEach(function(el) {
        el.style.background = '#f1f5f9';
        el.style.color = '#334155';
        var spans = el.querySelectorAll('span');
        spans.forEach(function(span, i) {
          var text = span.textContent || '';
          var next = spans[i + 1];
          var nextText = next ? next.textContent || '' : '';
          var color = '#334155';
          var isQuoted = /^".*"$/.test(text);
          var isKey = isQuoted && /^\\s*:/.test(nextText);
          if (isKey) color = '#0f172a';
          else if (isQuoted) color = colors.string;
          else if (/^-?\\d/.test(text)) color = colors.number;
          else if (/^(true|false|null)$/i.test(text)) color = colors.boolean;
          else if (/^[{}\\[\\]:,]$/.test(text)) color = colors.punctuation;
          span.style.color = color;
        });
      });
    }
    cleanInlineStyles();
    var observer = new MutationObserver(cleanInlineStyles);
    var wrapper = document.querySelector('.swagger-ui');
    if (wrapper) observer.observe(wrapper, { childList: true, subtree: true });
  }

  function createHero() {
    var ui = document.querySelector('.swagger-ui');
    if (!ui || document.querySelector('.lx-hero')) return;

    var hero = document.createElement('div');
    hero.className = 'lx-hero';
    hero.innerHTML =
      '<div class="lx-orb lx-orb-1"></div>' +
      '<div class="lx-orb lx-orb-2"></div>' +
      '<div class="lx-orb lx-orb-3"></div>' +
      '<div class="lx-grid-pattern"></div>' +
      '<div class="lx-hero-content">' +
      '<div class="lx-badge">' +
      '<span class="lx-badge-dot"></span>Live API v1.0' +
      '</div>' +
      '<h1 class="lx-title">LX <span>API Console</span></h1>' +
      '<p class="lx-subtitle">' +
      'Build intelligent, personalized learning experiences with our ' +
      'comprehensive REST API. Explore endpoints, test requests, and ' +
      'integrate seamlessly.' +
      '</p>' +
      '<div class="lx-stats">' +
      '<div class="lx-stat">' +
      '<div class="lx-stat-value">' +
      '<span class="lx-stat-highlight lx-stat-modules">0</span>' +
      '</div>' +
      '<div class="lx-stat-label">Modules</div>' +
      '</div>' +
      '<div class="lx-stat">' +
      '<div class="lx-stat-value lx-stat-highlight">REST</div>' +
      '<div class="lx-stat-label">Architecture</div>' +
      '</div>' +
      '</div>' +
      '<div class="lx-actions">' +
      '<button class="lx-action-btn lx-action-btn-primary" ' +
      'onclick="document.querySelector(' +
      "'" + '.swagger-ui .btn.authorize' + "'" + ')?.click()">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2">' +
      '<rect x="3" y="11" width="18" height="11" rx="2"/>' +
      '<path d="M7 11V7a5 5 0 0110 0v4"/>' +
      '</svg>Authorize</button>' +
      '<button class="lx-action-btn lx-action-btn-secondary" ' +
      'onclick="document.querySelector(' +
      "'" + '.swagger-ui .filter-container input' + "'" + ')?.focus()">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2">' +
      '<circle cx="11" cy="11" r="8"/>' +
      '<path d="M21 21l-4.35-4.35"/>' +
      '</svg>Search Endpoints</button>' +
      '</div>' +
      '</div>';
    ui.parentNode.insertBefore(hero, ui);
  }

  function showStats() {
    var moduleCount = document.querySelectorAll('.opblock-tag-section').length;
    var el = document.querySelector('.lx-stat-modules');
    if (el) el.textContent = moduleCount;
  }

  function createParticles() {
    var hero = document.querySelector('.lx-hero');
    if (!hero || hero.querySelector('.lx-particles')) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'lx-particles';
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    hero.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var particles = [];
    var mouse = { x: null, y: null, r: 150 };
    var colors = ['34,211,238', '167,139,250', '52,211,153'];

    function resize() {
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
      init();
    }

    function init() {
      var count = Math.min(
        Math.floor((canvas.width * canvas.height) / 12000),
        100
      );
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          opacity: Math.random() * 0.5 + 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];

        if (mouse.x !== null) {
          var dx = mouse.x - p.x;
          var dy = mouse.y - p.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < mouse.r) {
            var f = ((mouse.r - d) / mouse.r) * 0.03;
            p.x -= dx * f;
            p.y -= dy * f;
          }
        }

        p.x = (p.x + p.vx + canvas.width) % canvas.width;
        p.y = (p.y + p.vy + canvas.height) % canvas.height;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + p.color + ',' + p.opacity + ')';
        ctx.fill();

        for (var j = i + 1; j < particles.length; j++) {
          var p2 = particles[j];
          var dx2 = p.x - p2.x;
          var dy2 = p.y - p2.y;
          var d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

          if (d2 < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            var g = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
            var alpha = 0.15 * (1 - d2 / 120);
            g.addColorStop(0, 'rgba(' + p.color + ',' + alpha + ')');
            g.addColorStop(1, 'rgba(' + p2.color + ',' + alpha + ')');
            ctx.strokeStyle = g;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    }

    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });

    hero.addEventListener('mouseleave', function () {
      mouse.x = null;
      mouse.y = null;
    });

    window.addEventListener('resize', resize);
    resize();
    draw();
  }

  function createSidebar() {
    if (document.querySelector('.lx-sidebar')) return;
    var tags = document.querySelectorAll('.opblock-tag-section');
    if (!tags.length) return;

    var sidebar = document.createElement('div');
    sidebar.className = 'lx-sidebar';

    var html = '<div class="lx-sidebar-title">Endpoints</div>';
    for (var i = 0; i < tags.length; i++) {
      var nameEl = tags[i].querySelector('.opblock-tag a.nostyle span');
      var name = nameEl ? nameEl.textContent.trim() : 'Unknown';
      html +=
        '<div class="lx-sidebar-item" data-idx="' +
        i +
        '">' +
        '<span class="lx-sidebar-item-name">' +
        name +
        '</span>' +
        '</div>';
    }
    sidebar.innerHTML = html;
    document.body.appendChild(sidebar);

    var items = sidebar.querySelectorAll('.lx-sidebar-item');
    for (var j = 0; j < items.length; j++) {
      (function (item) {
        item.addEventListener('click', function () {
          var idx = parseInt(item.dataset.idx, 10);
          var tag = tags[idx]
            ? tags[idx].querySelector('.opblock-tag')
            : null;
          if (tag) {
            tag.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (tag.getAttribute('data-is-open') !== 'true') {
              tag.click();
            }
          }
        });
      })(items[j]);
    }
  }

  function setupScrollSpy() {
    var tags = document.querySelectorAll('.opblock-tag-section');
    var items = document.querySelectorAll('.lx-sidebar-item');
    if (!tags.length || !items.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var idx = Array.prototype.indexOf.call(tags, e.target);
            for (var i = 0; i < items.length; i++) {
              if (i === idx) {
                items[i].classList.add('active');
              } else {
                items[i].classList.remove('active');
              }
            }
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    for (var i = 0; i < tags.length; i++) {
      observer.observe(tags[i]);
    }
  }

  function createFooter() {
    var wrapper = document.querySelector('.swagger-ui .wrapper');
    if (!wrapper || document.querySelector('.lx-footer')) return;

    var footer = document.createElement('div');
    footer.className = 'lx-footer';
    footer.innerHTML =
      '<p>Built with ' +
      '<span style="color:var(--accent-rose)">\\u2665</span> ' +
      'by the LX Team</p>';
    wrapper.appendChild(footer);
  }
})();
`;
