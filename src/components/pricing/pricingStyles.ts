import css from "styled-jsx/css";

/** The pricing page CSS, shared by /pricing and the Away on 30A page 2 cards. Moved verbatim 9/29/26. */
export const pricingStyles = css.global`
        /* ── Reset / base ─────────────────────────────── */
        .legal-strip {
          max-width: 900px;
          margin: 56px auto 0;
          padding: 0 24px;
          text-align: center;
        }

        .pricing-page {
          font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
          background: #f2faf9;
          color: var(--ch-ink);
          min-height: 100vh;
          padding-bottom: 80px;
        }

        /* ── Header ─────────────────────────────────────── */
        .pricing-header {
          text-align: center;
          padding: 120px 24px 56px;
          animation: fadeDown 0.7s ease both;
          background: linear-gradient(180deg, #e8f0fe 0%, #f2faf9 100%);
          border-bottom: 1px solid #cfeae7;
        }
        .header-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .trust-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(37, 99, 235, 0.08);
          border: 1px solid rgba(37, 99, 235, 0.25);
          border-radius: 100px;
          padding: 7px 18px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--ch-teal);
          margin-bottom: 20px;
        }
        .trust-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--ch-teal);
          flex-shrink: 0;
          opacity: 0.7;
        }
        .header-h1 {
          font-size: clamp(28px, 5vw, 46px);
          font-weight: 900;
          letter-spacing: -0.03em;
          color: var(--ch-ink);
          margin: 0 0 12px;
        }
        .header-accent { color: var(--ch-teal); }
        .header-sub {
          font-size: 15px;
          color: var(--ch-muted);
          line-height: 1.7;
          max-width: 440px;
          margin: 0 auto;
        }

        /* ── Plans ──────────────────────────────────────── */
        .plans-section {
          padding: 0 20px;
          max-width: 1160px;
          margin: 0 auto;
        }
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 900px) {
          /* Cheapest first on phones (9/28/26): leading with $600 scared people off. */
          .plans-grid { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; gap: 14px; }
        }

        /* ── Mobile: short cards, features fold away ────── */
        /* Doubled class names on purpose: the base .cta / .card rules sit later in
           this block and would otherwise win. */
        .cta.cta-mobile, .features-toggle { display: none; }
        @media (max-width: 900px) {
          .plans-grid .card { padding: 24px 20px 20px; }
          .plans-grid .card:hover { transform: none; }
          .cta.cta-mobile { display: block; margin-top: 16px; }
          .cta.cta-desktop { display: none; }
          .features-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            width: 100%;
            margin-top: 10px;
            padding: 10px;
            background: none;
            border: none;
            font: inherit;
            font-size: 13.5px;
            font-weight: 600;
            color: var(--ch-teal);
            cursor: pointer;
          }
          .features-caret { display: inline-block; transition: transform 0.2s ease; font-size: 18px; line-height: 1; }
          .features-caret-open { transform: rotate(90deg); }
          .features-wrap { display: none; }
          .features-wrap.features-open { display: block; }
          .gold-pulse { display: none; }

          /* Header: get to the prices fast. */
          .pricing-header { padding: 96px 20px 28px; }
          .header-logo { display: none; }
          .trust-badge { font-size: 10.5px; padding: 6px 14px; margin-bottom: 14px; }
          .header-sub { font-size: 14px; }
          .header-sub br { display: none; }
        }

        /* ── Term toggle ────────────────────────────────── */
        .term-toggle {
          display: flex;
          justify-content: center;
          gap: 4px;
          background: #ffffff;
          border: 1px solid #cfeae7;
          border-radius: 100px;
          padding: 4px;
          width: fit-content;
          margin: 0 auto 10px;
          animation: fadeUp 0.7s ease both;
        }
        .term-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: none;
          background: transparent;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--ch-muted);
          padding: 9px 18px;
          border-radius: 100px;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .term-btn:hover { color: var(--ch-ink); }
        .term-btn-active {
          background: var(--ch-teal);
          color: #ffffff;
        }
        .term-btn-active:hover { color: #ffffff; }
        .term-save {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 100px;
          background: #ddf3f0;
          color: var(--ch-teal);
          border: 1px solid var(--ch-teal-bright);
        }
        .term-save-active {
          background: rgba(255, 255, 255, 0.16);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.35);
        }
        .term-note {
          text-align: center;
          font-size: 12px;
          color: var(--ch-soft);
          margin: 0 auto 34px;
          padding: 0 16px;
        }
        @media (max-width: 480px) {
          .term-btn { padding: 8px 12px; font-size: 12px; }
          .term-save { display: none; }
        }

        /* ── Discounted price ───────────────────────────── */
        .price-was {
          font-size: 17px;
          font-weight: 700;
          color: var(--ch-soft);
          text-decoration: line-through;
          margin-left: 8px;
          margin-bottom: 8px;
        }
        .save-pill {
          display: inline-block;
          margin-left: 8px;
          padding: 2px 8px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          vertical-align: middle;
        }
        .save-pill-bronze,
        .save-pill-silver { background: #ddf3f0; color: var(--ch-teal); border: 1px solid var(--ch-teal-bright); }
        .save-pill-gold { background: #f0faf8; color: var(--ch-teal-deep); border: 1px solid var(--ch-teal-bright); }

        /* ── Card ───────────────────────────────────────── */
        .card {
          background: #ffffff;
          border-radius: 20px;
          padding: 36px 28px 40px;
          position: relative;
          overflow: hidden;
          border: 1px solid #cfeae7;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          animation: fadeUp 0.7s ease both;
        }
        .card:nth-child(1) { animation-delay: 0.15s; }
        .card:nth-child(2) { animation-delay: 0.28s; }
        .card:nth-child(3) { animation-delay: 0.42s; }
        .card:hover { transform: translateY(-6px); }

        /* top accent edge */
        .card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
        }
        /* shimmer sweep */
        .card::after {
          content: "";
          position: absolute;
          top: 0; left: -120%;
          width: 60%; height: 100%;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%);
          transition: left 0.55s ease;
          pointer-events: none;
        }
        .card:hover::after { left: 160%; }

        /* Sky / Essential */
        .card-bronze { border-color: #bae0fd; }
        .card-bronze::before { background: linear-gradient(90deg, transparent, var(--ch-teal-bright), transparent); }
        .card-bronze:hover { box-shadow: 0 20px 60px rgba(56,189,248,0.18), 0 0 0 1px var(--ch-teal-bright); }

        /* Ocean / Home Watch */
        .card-silver { border-color: #b9e5e0; }
        .card-silver::before { background: linear-gradient(90deg, transparent, var(--ch-teal), transparent); }
        .card-silver:hover { box-shadow: 0 20px 60px rgba(59,130,246,0.16), 0 0 0 1px var(--ch-teal-bright); }

        /* Navy / Coastal Elite */
        .card-gold { background: linear-gradient(160deg, #f0faf8 0%, #ffffff 100%); border-color: var(--ch-teal-bright); }
        .card-gold::before { background: linear-gradient(90deg, transparent, var(--ch-teal), transparent); }
        .card-gold:hover { box-shadow: 0 24px 80px rgba(29,78,216,0.18), 0 0 0 1px var(--ch-teal-bright); }

        /* Elite pulse glow */
        .gold-pulse {
          position: absolute;
          top: -40%; left: 50%;
          transform: translateX(-50%);
          width: 200px; height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%);
          animation: pulse 3s ease-in-out infinite;
          pointer-events: none;
        }

        /* Most Complete tag */
        .hot-tag {
          position: absolute;
          top: -1px; right: 28px;
          background: linear-gradient(135deg, var(--ch-teal), var(--ch-teal));
          color: #fff;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 5px 14px 4px;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 4px 12px rgba(29,78,216,0.35);
        }

        /* ── Badge ──────────────────────────────────────── */
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 13px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 18px;
          position: relative;
          overflow: hidden;
        }
        .badge::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%);
          animation: shimmerBadge 2.5s ease-in-out infinite;
        }
        .badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0;
        }
        .badge-bronze { background: #ddf3f0; border: 1px solid var(--ch-teal-bright); color: var(--ch-teal); }
        .badge-silver { background: #d7efec; border: 1px solid var(--ch-teal-bright); color: var(--ch-teal); }
        .badge-gold   { background: #f0faf8; border: 1px solid var(--ch-teal-bright); color: var(--ch-teal-deep); }

        /* ── Plan text ──────────────────────────────────── */
        .plan-name { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: var(--ch-ink); margin-bottom: 5px; }
        .plan-sub  { font-size: 13px; color: var(--ch-muted); margin-bottom: 26px; line-height: 1.55; }

        /* ── Price ──────────────────────────────────────── */
        .price-row { display: flex; align-items: flex-end; gap: 4px; margin-bottom: 4px; }
        .price-sym { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
        .price-num { font-size: 56px; font-weight: 900; letter-spacing: -0.05em; line-height: 1; }
        .price-period { font-size: 13px; color: var(--ch-soft); margin-bottom: 8px; }
        .price-note { font-size: 11.5px; color: var(--ch-soft); margin-bottom: 30px; min-height: 18px; }
        .price-note-gold strong { color: var(--ch-teal); }

        .card-bronze .price-num,.card-bronze .price-sym { background: linear-gradient(135deg,var(--ch-teal-bright),var(--ch-teal)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .card-silver .price-num,.card-silver .price-sym { background: linear-gradient(135deg,var(--ch-teal),var(--ch-teal)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .card-gold   .price-num,.card-gold   .price-sym { background: linear-gradient(135deg,var(--ch-teal),var(--ch-teal-deep)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

        /* ── Divider ────────────────────────────────────── */
        .divider { height: 1px; margin-bottom: 22px; }
        .divider-bronze { background: linear-gradient(90deg,transparent,var(--ch-teal-bright),transparent); }
        .divider-silver { background: linear-gradient(90deg,transparent,var(--ch-teal-bright),transparent); }
        .divider-gold   { background: linear-gradient(90deg,transparent,var(--ch-teal-bright),transparent); }

        /* ── Section label ──────────────────────────────── */
        .section-lbl { font-size: 9.5px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 12px; }
        .card-bronze .section-lbl { color: var(--ch-teal); }
        .card-silver .section-lbl { color: var(--ch-teal); }
        .card-gold   .section-lbl { color: var(--ch-teal-deep); }

        /* ── Features ───────────────────────────────────── */
        .features { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 11px; margin-bottom: 22px; }
        .fi { display: flex; align-items: flex-start; gap: 11px; font-size: 13.5px; color: var(--ch-muted); line-height: 1.5; }
        .fi strong { color: var(--ch-ink); font-weight: 600; }

        .fi-check {
          flex-shrink: 0;
          width: 18px; height: 18px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin-top: 1px;
        }
        .fi-check svg { width: 9px; height: 9px; }

        .fi-check-bronze { background: rgba(14,165,233,0.1);  border: 1px solid var(--ch-teal-bright); color: var(--ch-teal); }
        .fi-check-silver { background: rgba(59,130,246,0.1);  border: 1px solid var(--ch-teal-bright); color: var(--ch-teal); }
        .fi-check-gold   { background: rgba(29,78,216,0.1);   border: 1px solid var(--ch-teal-bright); color: var(--ch-teal); }

        /* ── Tag chips ──────────────────────────────────── */
        .tag {
          display: inline-block;
          padding: 2px 7px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          margin-left: 6px;
          vertical-align: middle;
        }
        .tag-bronze { background: #ddf3f0; color: var(--ch-teal); border: 1px solid var(--ch-teal-bright); }
        .tag-silver { background: #d7efec; color: var(--ch-teal); border: 1px solid var(--ch-teal-bright); }
        .tag-gold   { background: #f0faf8; color: var(--ch-teal-deep); border: 1px solid var(--ch-teal-bright); }

        /* ── CTA ────────────────────────────────────────── */
        .cta {
          display: block;
          width: 100%;
          padding: 14px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.03em;
          text-align: center;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
          margin-top: 28px;
          font-family: inherit;
        }
        .cta-bronze { background: #ddf3f0; border: 1px solid var(--ch-teal-bright); color: var(--ch-teal); }
        .cta-bronze:hover { background: #bae6fd; border-color: var(--ch-teal-bright); box-shadow: 0 4px 16px rgba(14,165,233,0.2); }
        .cta-silver { background: #d7efec; border: 1px solid var(--ch-teal-bright); color: var(--ch-teal); }
        .cta-silver:hover { background: #b9e5e0; border-color: var(--ch-teal-bright); box-shadow: 0 4px 16px rgba(59,130,246,0.2); }
        .cta-gold   { background: linear-gradient(135deg,var(--ch-teal),var(--ch-teal)); color: #fff; border: none; }
        .cta-gold:hover { background: linear-gradient(135deg,var(--ch-teal-deep),var(--ch-teal)); transform: translateY(-2px); box-shadow: 0 10px 32px rgba(29,78,216,0.35); }

        /* ── Add-ons ─────────────────────────────────────── */
        .addons-section { max-width: 1160px; margin: 64px auto 0; padding: 0 20px; }
        .addons-lbl { font-size: 10px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ch-soft); text-align: center; margin-bottom: 18px; }
        .addons-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
        @media (max-width: 700px) { .addons-grid { grid-template-columns: repeat(2,1fr); } }
        .addon { background: #ffffff; border: 1px solid #cfeae7; border-radius: 12px; padding: 18px 20px; transition: border-color 0.2s, box-shadow 0.2s; }
        .addon:hover { border-color: var(--ch-teal-bright); box-shadow: 0 4px 20px rgba(59,130,246,0.1); }
        .addon-name  { font-size: 13px; font-weight: 700; color: var(--ch-ink); margin-bottom: 4px; }
        .addon-desc  { font-size: 12px; color: var(--ch-muted); line-height: 1.5; }
        .addon-price { font-size: 15px; font-weight: 800; margin-top: 10px; color: var(--ch-teal); }

        /* ── Not sure which plan (undecided lead capture) ── */
        .notsure-section { max-width: 1160px; margin: 56px auto 0; padding: 0 20px; }
        .notsure-card {
          background: var(--ch-ink);
          border-radius: 16px;
          padding: 44px 32px;
          text-align: center;
        }
        .notsure-lbl {
          font-size: 10px; font-weight: 800; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--ch-teal-bright); margin-bottom: 14px;
        }
        .notsure-h2 {
          font-size: 27px; line-height: 1.2; font-weight: 700; letter-spacing: -0.02em;
          color: #ffffff; max-width: 620px; margin: 0 auto 16px;
        }
        .notsure-body {
          font-size: 14px; line-height: 1.65; color: rgba(255,255,255,0.66);
          max-width: 580px; margin: 0 auto 26px;
        }
        .notsure-btn {
          appearance: none; border: 0; cursor: pointer;
          background: var(--ch-teal-bright); color: var(--ch-ink);
          font-size: 12px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;
          padding: 16px 36px; border-radius: 999px;
          transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
        }
        .notsure-btn:hover { transform: translateY(-1px); filter: brightness(1.06); box-shadow: 0 8px 26px rgba(0,0,0,0.28); }
        .notsure-proof {
          margin-top: 20px; font-size: 11.5px; letter-spacing: 0.02em;
          color: rgba(255,255,255,0.48);
        }
        @media (max-width: 700px) {
          .notsure-card { padding: 34px 22px; }
          .notsure-h2 { font-size: 22px; }
          .notsure-btn { width: 100%; }
        }

        /* ── FAQ ─────────────────────────────────────────── */
        .faq-section { max-width: 780px; margin: 64px auto 0; padding: 0 20px; }
        .faq-lbl {
          font-size: 10px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--ch-soft); text-align: center; margin-bottom: 24px;
        }
        .faq-list { display: flex; flex-direction: column; gap: 22px; }
        .faq-item { border-bottom: 1px solid #d7efec; padding-bottom: 22px; }
        .faq-item:last-child { border-bottom: 0; }
        .faq-q { font-size: 15px; font-weight: 700; color: var(--ch-ink); margin-bottom: 8px; line-height: 1.35; }
        .faq-a { font-size: 14px; line-height: 1.7; color: var(--ch-muted); }

        /* ── Related Services ────────────────────────────── */
        .related-section { max-width: 1160px; margin: 56px auto 0; padding: 0 20px; border-top: 1px solid #d7efec; padding-top: 40px; }
        .related-lbl { font-size: 10px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ch-soft); margin-bottom: 16px; }
        .related-links { display: flex; flex-wrap: wrap; gap: 10px; }
        .related-link { border: 1px solid #b9e5e0; padding: 8px 16px; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ch-teal); text-decoration: none; border-radius: 4px; transition: border-color 0.2s, background 0.2s, color 0.2s; }
        .related-link:hover { border-color: var(--ch-teal); background: #f0faf8; color: var(--ch-teal); }

        /* ── Footer note ─────────────────────────────────── */
        .footer-note { text-align: center; font-size: 12px; color: var(--ch-soft); margin-top: 56px; line-height: 1.8; padding: 0 16px; }
        .footer-note a { color: var(--ch-teal); text-decoration: none; }
        .footer-note a:hover { color: var(--ch-teal); text-decoration: underline; }

        /* ── Modal ───────────────────────────────────────── */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(10,10,10,0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease both;
        }
        .modal-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 40px 36px;
          max-width: 500px;
          width: 100%;
          position: relative;
          border: 1px solid #cfeae7;
          animation: slideUp 0.3s cubic-bezier(0.18,0.82,0.16,1) both;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-card-bronze { border-color: var(--ch-teal-bright); box-shadow: 0 0 60px rgba(14,165,233,0.12); }
        .modal-card-silver { border-color: var(--ch-teal-bright); box-shadow: 0 0 60px rgba(59,130,246,0.12); }
        .modal-card-gold   { border-color: var(--ch-teal-bright); box-shadow: 0 0 80px rgba(29,78,216,0.15); }

        .modal-close {
          position: absolute;
          top: 16px; right: 16px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--ch-soft);
          padding: 6px;
          display: flex;
          transition: color 0.15s;
        }
        .modal-close svg { width: 14px; height: 14px; }
        .modal-close:hover { color: var(--ch-muted); }

        .modal-plan-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .modal-plan-badge-bronze { background: #ddf3f0; border: 1px solid var(--ch-teal-bright); color: var(--ch-teal); }
        .modal-plan-badge-silver { background: #d7efec; border: 1px solid var(--ch-teal-bright); color: var(--ch-teal); }
        .modal-plan-badge-gold   { background: #f0faf8; border: 1px solid var(--ch-teal-bright); color: var(--ch-teal-deep); }

        .modal-title { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: var(--ch-ink); margin: 0 0 6px; }
        .modal-sub   { font-size: 13px; color: var(--ch-muted); margin: 0 0 28px; line-height: 1.5; }

        /* ── Form ───────────────────────────────────────── */
        .modal-form { display: flex; flex-direction: column; gap: 18px; }
        .form-row { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 11.5px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ch-muted); }
        .req { color: #dc2626; margin-left: 2px; }
        .opt { color: var(--ch-soft); font-weight: 400; text-transform: none; letter-spacing: 0; }

        .form-input {
          background: #f8fafc;
          border: 1px solid var(--ch-hairline);
          border-radius: 8px;
          padding: 11px 14px;
          font-size: 14px;
          color: var(--ch-ink);
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
        }
        .form-input::placeholder { color: var(--ch-hairline-2); }
        .form-textarea { resize: vertical; min-height: 80px; }

        .form-input-bronze:focus { border-color: var(--ch-teal-bright); box-shadow: 0 0 0 2px rgba(14,165,233,0.12); }
        .form-input-silver:focus { border-color: var(--ch-teal); box-shadow: 0 0 0 2px rgba(59,130,246,0.12); }
        .form-input-gold:focus   { border-color: var(--ch-teal); box-shadow: 0 0 0 2px rgba(29,78,216,0.12); }

        .form-error { font-size: 13px; color: #dc2626; padding: 10px 14px; background: rgba(220,38,38,0.06); border: 1px solid rgba(220,38,38,0.2); border-radius: 8px; }

        .modal-submit {
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.03em;
          cursor: pointer;
          border: none;
          font-family: inherit;
          transition: all 0.2s ease;
          margin-top: 4px;
        }
        .modal-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .modal-submit-bronze { background: var(--ch-teal); color: #fff; }
        .modal-submit-bronze:hover:not(:disabled) { background: var(--ch-teal); box-shadow: 0 4px 16px rgba(14,165,233,0.3); }
        .modal-submit-silver { background: var(--ch-teal); color: #fff; }
        .modal-submit-silver:hover:not(:disabled) { background: var(--ch-teal); box-shadow: 0 4px 16px rgba(59,130,246,0.3); }
        .modal-submit-gold   { background: linear-gradient(135deg,var(--ch-teal),var(--ch-teal)); color: #fff; }
        .modal-submit-gold:hover:not(:disabled) { background: linear-gradient(135deg,var(--ch-teal-deep),var(--ch-teal)); box-shadow: 0 6px 24px rgba(29,78,216,0.3); }

        /* ── Success ────────────────────────────────────── */
        .modal-success { text-align: center; padding: 20px 0; }
        .success-icon {
          width: 56px; height: 56px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 900;
          margin-bottom: 20px;
        }
        .success-icon-bronze { background: #ddf3f0; color: var(--ch-teal); border: 1px solid var(--ch-teal-bright); }
        .success-icon-silver { background: #d7efec; color: var(--ch-teal); border: 1px solid var(--ch-teal-bright); }
        .success-icon-gold   { background: #f0faf8; color: var(--ch-teal-deep); border: 1px solid var(--ch-teal-bright); }
        .modal-success h3 { font-size: 22px; font-weight: 800; color: var(--ch-ink); margin: 0 0 10px; }
        .modal-success p  { font-size: 14px; color: var(--ch-muted); line-height: 1.6; margin: 0 0 28px; }
        .modal-success strong { color: var(--ch-teal); }

        /* ── Animations ─────────────────────────────────── */
        @keyframes fadeDown  { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp    { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp   { from { opacity:0; transform:translateY(32px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes pulse     { 0%,100% { opacity:0.6; transform:translateX(-50%) scale(1); } 50% { opacity:1; transform:translateX(-50%) scale(1.15); } }
        @keyframes shimmerBadge { 0% { transform:translateX(-100%); } 100% { transform:translateX(200%); } }

        /* ── Compare Table ───────────────────────────────────── */
        .compare-section {
          max-width: 1160px;
          margin: 56px auto 0;
          padding: 0 20px;
          overflow-x: auto;
        }
        .compare-lbl {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ch-soft);
          text-align: center;
          margin-bottom: 20px;
        }
        .compare-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          background: #ffffff;
          border: 1px solid #d7efec;
          border-radius: 16px;
          overflow: hidden;
        }
        .compare-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 600px;
        }
        .compare-caption {
          font-size: 0;
          position: absolute;
          overflow: hidden;
          clip: rect(0 0 0 0);
          height: 1px;
          width: 1px;
          margin: -1px;
          padding: 0;
          border: 0;
        }
        .compare-th {
          padding: 14px 16px;
          text-align: center;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border-bottom: 1px solid #d7efec;
          vertical-align: bottom;
          line-height: 1.4;
          background: #f2faf9;
        }
        .compare-th-feature {
          text-align: left;
          color: var(--ch-muted);
          width: 44%;
        }
        .compare-th-tier {
          width: 18%;
          color: var(--ch-soft);
        }
        .compare-th-bronze { color: var(--ch-teal); }
        .compare-th-silver { color: var(--ch-teal); }
        .compare-th-gold   { color: var(--ch-teal-deep); }

        .compare-price {
          display: block;
          font-size: 15px;
          font-weight: 900;
          letter-spacing: -0.03em;
          margin-top: 4px;
          text-transform: none;
        }

        .compare-td {
          padding: 11px 16px;
          border-bottom: 1px solid #f2faf9;
          vertical-align: middle;
        }
        .compare-td-feature {
          color: var(--ch-muted);
          text-align: left;
          font-size: 12.5px;
        }
        .compare-td-feature.compare-td-price-row {
          color: var(--ch-ink);
          font-weight: 700;
        }
        .compare-row-alt td {
          background: #f7fcfb;
        }
        .compare-td-check,
        .compare-td-label,
        .compare-td-none,
        .compare-td-price {
          text-align: center;
          font-weight: 700;
        }
        .compare-td-none { color: var(--ch-hairline-2); font-size: 15px; }

        .compare-td-check.compare-td-bronze { color: var(--ch-teal); }
        .compare-td-check.compare-td-silver { color: var(--ch-teal); }
        .compare-td-check.compare-td-gold   { color: var(--ch-teal); }

        .compare-td-label.compare-td-bronze { color: var(--ch-teal); font-size: 11.5px; }
        .compare-td-label.compare-td-silver { color: var(--ch-teal); font-size: 11.5px; }
        .compare-td-label.compare-td-gold   { color: var(--ch-teal-deep); font-size: 11.5px; }

        .compare-td-price {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: -0.03em;
        }
        .compare-td-price.compare-td-bronze { color: var(--ch-teal); }
        .compare-td-price.compare-td-silver { color: var(--ch-teal); }
        .compare-td-price.compare-td-gold   { color: var(--ch-teal); }
`;
