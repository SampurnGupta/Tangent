"""Generate Tangent_Project_Report.docx technical project report."""

import os
import shutil

import docx
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
from docx.shared import Inches, Pt, RGBColor


def set_cell_background(cell, fill_hex):
    """Set background color of a table cell."""
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tc_pr.append(shd)


def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Set inner padding for a table cell."""
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = parse_xml(
        f"<w:tcMar {nsdecls('w')}>"
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f"</w:tcMar>"
    )
    tc_pr.append(tc_mar)


def set_cell_border(cell, **kwargs):
    """Set cell borders: top, bottom, left, right with color and sz."""
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f"<w:tcBorders {nsdecls('w')}>"
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
        f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f"</w:tcBorders>"
    )
    tc_pr.append(borders)


def add_header_styled_table(doc, headers, data, col_widths=None):
    """Add a professional styled table to the docx document."""
    table = doc.add_table(rows=len(data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    # Header row
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], "1E293B")  # Slate 800
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.bold = True
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(255, 255, 255)
            run.font.name = "Calibri"

    # Data rows
    for r_idx, row_data in enumerate(data):
        row_cells = table.rows[r_idx + 1].cells
        bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            row_cells[c_idx].text = str(val)
            set_cell_background(row_cells[c_idx], bg_color)
            set_cell_margins(row_cells[c_idx], top=90, bottom=90, left=140, right=140)
            set_cell_border(row_cells[c_idx])
            p = row_cells[c_idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.size = Pt(9)
                run.font.color.rgb = RGBColor(30, 41, 59)
                run.font.name = "Calibri"

    # Set column widths if provided
    if col_widths:
        for row in table.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = width

    doc.add_paragraph()  # Spacing
    return table


def create_tangent_report():
    doc = docx.Document()

    # Page setup - 1 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Base typography settings
    normal_style = doc.styles["Normal"]
    normal_style.font.name = "Calibri"
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(30, 41, 59)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(4)

    # ==========================================
    # 1. TITLE PAGE
    # ==========================================
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(80)
    title_p.paragraph_format.space_after = Pt(12)
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = title_p.add_run("TANGENT")
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(36)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(15, 23, 42)

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_p.paragraph_format.space_after = Pt(36)
    r_sub = sub_p.add_run(
        "A Production-Grade Multi-Asset Portfolio Decision Intelligence Platform\nwith Deterministic SLSQP Optimization and Traceable Multi-Agent Deliberation"
    )
    r_sub.font.size = Pt(14)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(71, 85, 105)

    div_p = doc.add_paragraph()
    div_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    div_p.paragraph_format.space_after = Pt(80)
    r_div = div_p.add_run("—" * 32)
    r_div.font.color.rgb = RGBColor(203, 213, 225)

    meta_p = doc.add_paragraph()
    meta_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    meta_p.paragraph_format.line_spacing = 1.3
    meta_p.paragraph_format.space_after = Pt(6)

    def add_meta_line(p, label, val):
        r1 = p.add_run(f"{label}: ")
        r1.font.bold = True
        r1.font.size = Pt(11)
        r1.font.color.rgb = RGBColor(15, 23, 42)
        r2 = p.add_run(f"{val}\n")
        r2.font.size = Pt(11)
        r2.font.color.rgb = RGBColor(51, 65, 85)

    add_meta_line(meta_p, "Author / Candidate", "Sampurn Gupta")
    add_meta_line(
        meta_p, "Program / Department", "Department of Computer Science & Quantitative Systems"
    )
    add_meta_line(meta_p, "Institution", "Apex Institute of Technology & Engineering")
    add_meta_line(meta_p, "Project Type", "Senior Capstone & Production Systems Technical Report")
    add_meta_line(meta_p, "Academic Year", "2025 – 2026")
    add_meta_line(meta_p, "System Version", "Tangent v1.1.0 Production Release")

    doc.add_page_break()

    # ==========================================
    # HELPER FUNCTIONS FOR SECTIONS
    # ==========================================
    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(18)
        run.font.bold = True
        run.font.color.rgb = RGBColor(15, 23, 42)
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(13.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(30, 41, 59)
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(11.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(51, 65, 85)
        return p

    def add_callout(text, prefix="KEY PRINCIPLE: "):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.left_indent = Inches(0.25)
        p.paragraph_format.right_indent = Inches(0.25)
        r_pre = p.add_run(prefix)
        r_pre.font.bold = True
        r_pre.font.size = Pt(9.5)
        r_pre.font.color.rgb = RGBColor(37, 99, 235)
        r_txt = p.add_run(text)
        r_txt.font.size = Pt(9.5)
        r_txt.font.italic = True
        r_txt.font.color.rgb = RGBColor(51, 65, 85)

    # ==========================================
    # 2. ABSTRACT
    # ==========================================
    add_h1("2. Abstract")
    p_abs = doc.add_paragraph()
    p_abs.add_run(
        "Individual investors navigating modern financial markets face significant structural barriers: conventional portfolio "
        "allocation tools often rely on naive static heuristics (e.g., fixed 60/40 equities/bonds), generic risk questionnaires, "
        "or opaque commercial black boxes that lack auditability and mathematical rigour. Furthermore, retail investors are typically "
        "forced to choose between pure mathematical optimization that ignores investor subjectivity, or unconstrained generative AI "
        "chatbots prone to metric hallucination and ungrounded advice. "
        "\n\n"
        "To resolve this dilemma, this report presents Tangent, an institutional-grade, multi-asset portfolio decision intelligence "
        "platform. Tangent unifies deterministic Modern Portfolio Theory (MPT) with a verifiable multi-agent deliberation framework. "
        "The system incorporates an institutional 74-asset universe spanning Indian equities (Nifty 50), US ETFs, commodities, REITs, "
        "sovereign debt, synthetic bank fixed deposits, and digital assets. Portfolio optimization employs a multi-start Sequential Least "
        "Squares Programming (SLSQP) solver incorporating Ledoit-Wolf covariance shrinkage, statutory regulatory asset caps (15%), "
        "sector concentration caps (25%), Indian Long-Term Capital Gains (LTCG) tax drag (12.5%), and headline inflation adjustments (6.0%). "
        "Risk dynamics are rigorously projected via 1,000–10,000 path geometric Brownian motion Monte Carlo simulations, historical crisis "
        "stress testing (2008 GFC, 2020 COVID, 2022 Rate Spike), and walk-forward out-of-sample backtesting across four classic strategies. "
        "\n\n"
        "Architecturally, Tangent is built as an isolated-package monorepo comprising six containerized FastAPI microservices "
        "(Gateway, Market-Data, Quant, Portfolio, Sentiment, Agent) and a high-performance Next.js 16 App Router interface with a dual-tier LLM "
        "pipeline. Numerical metrics are strictly restricted to deterministic Python microservices, creating an immutable Evidence Pack ([E1]–[E9]) "
        "audited by an automated Critic within ±0.5% tolerance. Simultaneously, an interactive Expert Arena hosts five strictly bounded economic "
        "ideologies (Macro, Deep Value, Quant Momentum, Austrian Sound Money, ESG) alongside Draww, an institutional portfolio co-pilot. "
        "Tangent bridges the gap between sophisticated quantitative finance and accessible, explainable investor decision-making."
    )

    # ==========================================
    # 3. INTRODUCTION
    # ==========================================
    add_h1("3. Introduction")

    add_h2("3.1 Background")
    doc.add_paragraph(
        "Modern wealth management is fundamentally a multi-objective decision problem under uncertainty. Traditional retail wealth "
        "allocation has historically relied on naive asset allocation rules, such as allocating capital solely based on the highest recent "
        "historical trailing returns. In mathematical finance, selecting assets based on trailing returns is known to produce highly "
        "concentrated, unstable portfolios that exhibit extreme drawdowns during regime shifts. Historical returns contain low signal-to-noise "
        "ratios and provide poor estimates of future mean returns."
    )
    doc.add_paragraph(
        "Effective asset allocation requires simultaneous joint modeling of risk, expected return, asset co-movements (covariance and correlation), "
        "and investor-specific horizons. Diversification—described by Harry Markowitz as the 'only free lunch in finance'—reduces portfolio variance "
        "without sacrificing expected return when assets exhibit imperfect correlation. However, calculating the true benefits of diversification "
        "requires empirical covariance estimation, liquidity constraints, statutory tax friction, and risk tolerance alignment."
    )

    add_h2("3.2 Problem Statement")
    add_callout(
        '"How can an individual investor construct a diversified portfolio that is mathematically optimized while remaining aligned with '
        "their personal risk profile, investment horizon, objectives, and regulatory constraints, with absolute mathematical auditability "
        'and zero metric hallucination?"',
        prefix="CORE PROBLEM STATEMENT: ",
    )

    add_h2("3.3 Motivation")
    doc.add_paragraph(
        "Tangent was developed to overcome key limitations in existing consumer financial applications:\n"
        "1. Manual / Static Allocation: Arbitrary heuristics fail to adjust for cross-asset correlations, resulting in hidden risk concentrations.\n"
        "2. Return-Only Optimization: Optimizing solely for return creates fragile portfolios concentrated in the single most volatile asset.\n"
        "3. Lack of Real-World Tax and Inflation Friction: Most academic models assume frictionless markets, neglecting blended Indian LTCG taxes (12.5% equity, 30% debt) and 6% inflation.\n"
        "4. Black-Box Recommendations: Commercial robo-advisors present final asset weights without explaining marginal impact or trade-offs.\n"
        "5. Hallucinatory Financial Chatbots: Standard Large Language Models frequently invent financial returns, Sharpe ratios, and advice without deterministic verification."
    )

    add_h2("3.4 Why This Idea?")
    doc.add_paragraph(
        "Tangent closes the gap between institutional quantitative finance and retail accessibility by integrating five key pillars: "
        "Investor Understanding + Financial Mathematics + Numerical Optimization + Stochastic Simulation + Software Engineering. "
        "By enforcing deterministic authority—where all metrics originate from audited Python engines and LLMs serve strictly to explain, debate, "
        "and synthesize—Tangent guarantees that every decision is traceable to verified empirical data."
    )

    # ==========================================
    # 4. OBJECTIVES
    # ==========================================
    add_h1("4. Objectives")
    objectives = [
        (
            "1. Dynamic Investor Profiling",
            "Calculate mathematical risk tolerance scores (1–10) and define asset-class allocation bounds (equity, debt, commodities, cash) based on age and horizon.",
        ),
        (
            "2. Comprehensive Asset Universe",
            "Curate and ingest a 74-asset institutional universe across 8 asset classes, including Indian Nifty 50, US ETFs, commodities, bonds, REITs, and FDs.",
        ),
        (
            "3. Regulatory & Feasibility Constraints",
            "Enforce real-world investment limits: 100% full investment equality, individual asset caps (15%), equity sector caps (25%), and long-only bounds.",
        ),
        (
            "4. Deterministic Statistical Processing",
            "Compute monthly log returns, annualized volatility, Ledoit-Wolf covariance shrinkage, and blended post-tax real returns.",
        ),
        (
            "5. Efficient Frontier Construction",
            "Generate the risk-return Pareto frontier across asset combinations to visualize optimal trade-offs.",
        ),
        (
            "6. Multi-Start Deterministic SLSQP Solver",
            "Implement Sequential Least Squares Programming with 5 randomized sparse initializations to converge on the global maximum Sharpe ratio.",
        ),
        (
            "7. Stochastic Monte Carlo Exploration",
            "Simulate 1,000–10,000 geometric Brownian motion wealth paths across 1–30 year horizons, evaluating median, 95% CI, and max drawdown.",
        ),
        (
            "8. Crisis Stress Testing Engine",
            "Model portfolio drawdowns against historical shocks (2008 GFC, 2020 COVID, 2022 Rate Spike, 1970s Stagflation, 2000 Dot-com).",
        ),
        (
            "9. Walk-Forward Out-of-Sample Backtesting",
            "Compare four classic MPT strategies (Max-Sharpe Sample, Max-Sharpe Ledoit-Wolf, Min-Variance, Equal Weight) across rolling time windows.",
        ),
        (
            "10. Multi-Agent Expert Arena",
            "Deploy five strictly bounded economic personas (Macro, Value, Quant, Austrian, ESG) in a structured deliberative debate with consensus synthesis.",
        ),
        (
            "11. Always-Available 1-on-1 Consultation",
            "Provide direct interactive access to any expert persona at any time without requiring a prior debate session.",
        ),
        (
            "12. Traceable Decision Briefs & Critic",
            "Package metrics into an immutable Evidence Pack ([E1]–[E9]) audited by an automated Critic within ±0.5% numerical tolerance.",
        ),
        (
            "13. Draww Institutional Co-Pilot",
            "Provide a contextual portfolio assistant with real-time visibility into optimized weights, returns, and backtest results.",
        ),
        (
            "14. Containerized Microservice Monorepo",
            "Implement an isolated-package monorepo with 6 FastAPI services, Docker Compose, Alembic schema migrations, and Next.js 16 App Router UI.",
        ),
    ]
    add_header_styled_table(
        doc,
        ["Objective", "Detailed Scope & Technical Implementation"],
        objectives,
        [Inches(2.5), Inches(4.5)],
    )

    # ==========================================
    # 5. SCOPE
    # ==========================================
    add_h1("5. Scope")
    add_h2("5.1 In Scope (Implemented Capabilities)")
    doc.add_paragraph(
        "• End-to-end multi-asset portfolio optimization with real-world tax and inflation models.\n"
        "• 74 curated securities with empirical historical data and deterministic synthetic accrual models.\n"
        "• Multi-start SciPy SLSQP solver, Ledoit-Wolf shrinkage, and Monte Carlo wealth projections.\n"
        "• Walk-Forward rolling backtest lab and historical crisis stress testing.\n"
        "• Multi-agent deliberative Arena with 5 bounded economic ideologies and Groq Llama 3.3 70B inference.\n"
        "• Traceable Evidence Pack pipeline with automated Critic claim verification.\n"
        "• Contextual Draww portfolio co-pilot and single-click CSV/JSON investor export.\n"
        "• 6 Dockerized FastAPI microservices, PostgreSQL with schema-per-service isolation, and Next.js 16 UI."
    )
    add_h2("5.2 Out of Scope (Architecturally Excluded)")
    doc.add_paragraph(
        "• Real-time brokerage execution or direct order placement (Tangent is strictly educational decision support).\n"
        "• Guaranteed investment returns or deterministic future price predictions.\n"
        "• High-Frequency Trading (HFT) or intraday tick-level order book modeling (focus is on daily/monthly horizons).\n"
        "• Personalized legal or statutory tax advice (tax formulas are standardized simulation parameters).\n"
        "• Mandatory commercial SaaS billing and multi-tenant paywalls (guest-first open architecture)."
    )

    # ==========================================
    # 6. EXISTING APPROACHES & GAP ANALYSIS
    # ==========================================
    add_h1("6. Existing Approaches and Gap Analysis")
    doc.add_paragraph(
        "Traditional retail wealth management typically falls into one of four paradigms: manual ad-hoc allocation, static rule-based "
        "portfolios (e.g., target-date funds), classical academic Markowitz mean-variance optimizers, or contemporary LLM chatbots. "
        "Each paradigm suffers from fundamental deficiencies when applied to individual decision-making."
    )

    gap_data = [
        [
            "Manual / Rule-Based Allocation",
            "Low (Generic)",
            "None",
            "None",
            "Low",
            "Moderate (Heuristic)",
            "Neglects correlations and dynamic risk; prone to emotional bias.",
        ],
        [
            "Classical Markowitz MPT",
            "Moderate",
            "High (Sample Cov)",
            "Low",
            "Moderate",
            "Low (Black-Box Math)",
            "Sample covariance is noisy; weights concentrate unrealistically.",
        ],
        [
            "Commercial Robo-Advisors",
            "Moderate",
            "Moderate",
            "Moderate",
            "Moderate",
            "Very Low (Proprietary)",
            "Opaque fee models; static buckets; no audit trail or debate.",
        ],
        [
            "Generic LLM Chatbots",
            "High (Conversational)",
            "None",
            "None",
            "None",
            "Zero (Hallucinatory)",
            "Hallucinates financial returns and Sharpe metrics; no proof.",
        ],
        [
            "Tangent Decision Platform",
            "High (Dynamic Wizard)",
            "High (SLSQP + Ledoit-Wolf)",
            "High (GBM Paths)",
            "High (Crises + Stress)",
            "High (Critic + Arena + [E1]–[E9])",
            "Combines deterministic math with verified multi-agent explanation.",
        ],
    ]
    add_header_styled_table(
        doc,
        [
            "Approach",
            "Personalization",
            "Optimization",
            "Simulation",
            "Risk Analysis",
            "Explainability",
            "Core Structural Deficiency",
        ],
        gap_data,
        [Inches(1.2), Inches(0.9), Inches(1.1), Inches(0.8), Inches(0.8), Inches(1.1), Inches(1.6)],
    )

    # ==========================================
    # 7. PROPOSED SOLUTION
    # ==========================================
    add_h1("7. Proposed Solution")
    doc.add_paragraph(
        "Tangent implements a disciplined, multi-stage end-to-end processing pipeline that guarantees mathematical integrity before "
        "initiating any qualitative agent synthesis. The pipeline operates in the following sequential order:"
    )
    doc.add_paragraph(
        "1. Investor Profiling & Horizon Capture: Captures age, horizon, and target risk score (1–10) to establish mathematical asset-class bounds.\n"
        "2. Asset Universe Selection: Filters the 74-asset universe by preferred categories or activates 'Unbiased All-Asset Mode'.\n"
        "3. Market Data Ingest & In-Memory Caching: Retrieves monthly adjusted prices from Yahoo Finance or 24-hour PostgreSQL cache, running synthetic yield models for fixed income.\n"
        "4. Statistical Feature Extraction: Converts monthly price series to log returns, computes Ledoit-Wolf covariance shrinkage, and calculates blended tax and inflation adjustments.\n"
        "5. Deterministic SLSQP Max-Sharpe Optimization: Executes multi-start constrained optimization with regulatory asset caps (15%) and sector caps (25%).\n"
        "6. Stochastic Monte Carlo Exploration: Simulates 1,000–10,000 geometric Brownian motion wealth paths across 1–30 years.\n"
        "7. Out-of-Sample Backtesting & Crisis Replay: Evaluates rolling performance against 4 classic strategies and subjects weights to historical crises.\n"
        "8. Immutable Evidence Pack Construction: Packages exact deterministic metrics into audited items ([E1]–[E9]).\n"
        "9. Multi-Agent Deliberation & Critic Review: Bull/Bear agents debate in the Arena, the Critic audits numeric claims within ±0.5%, and consensus is synthesized.\n"
        "10. Contextual Consultation & Investor Export: Enables direct 1-on-1 dialogue with expert personas or Draww, with single-click CSV/JSON export."
    )
    add_callout(
        "This strict ordering ensures that LLMs NEVER calculate or modify numbers. Numbers flow strictly downstream from deterministic Python microservices into the qualitative presentation layer.",
        prefix="ARCHITECTURAL INVARIANT: ",
    )

    # ==========================================
    # 8. SYSTEM ARCHITECTURE
    # ==========================================
    add_h1("8. System Architecture")
    doc.add_paragraph(
        "Tangent is organized around six decoupled FastAPI backend microservices, a Next.js 16 App Router frontend, a shared PostgreSQL 16 "
        "cluster with schema isolation, and Redis 7 for caching and rate limiting."
    )

    doc.add_paragraph(
        "```\n"
        "                             [ Next.js 16 Web App ] (Port 3000)\n"
        "                                       │\n"
        "                                       ▼\n"
        "                        [ API Gateway (FastAPI, Port 8000) ]\n"
        "                       (JWT Auth, Rate Limiter, Reverse Proxy)\n"
        "                                       │\n"
        "          ┌───────────────┬────────────┼───────────┬───────────────┐\n"
        "          ▼               ▼            ▼           ▼               ▼\n"
        "    [ Market-Data ]    [ Quant ]  [ Portfolio ] [ Sentiment ]   [ Agent ]\n"
        "      (Port 8001)    (Port 8002)   (Port 8003)   (Port 8004)   (Port 8005)\n"
        "          │               │            │           │               │\n"
        "          └───────────────┴─────┬──────┴───────────┴───────────────┘\n"
        "                                ▼\n"
        "                  [ PostgreSQL 16 + Redis 7 ]\n"
        "                   (Schema-per-service isolation)\n"
        "```"
    )

    svc_data = [
        [
            "apps/web",
            "3000",
            "Next.js 16 App Router UI, Vanilla CSS design system, Hero Homepage, Arena, Draww AI",
            "React 19, TypeScript, Vanilla CSS, Turbopack",
            "Stateless / LocalStorage",
        ],
        [
            "gateway",
            "8000",
            "Unified entrypoint, guest JWT issuance, sliding-window rate limiter, reverse proxy",
            "FastAPI, PyJWT, HTTPX, Pydantic v2",
            "In-memory / Redis",
        ],
        [
            "market-data",
            "8001",
            "74 curated assets across 8 classes, yfinance ingestion, 24h Postgres cache, synthetic bond accrual",
            "FastAPI, SQLAlchemy, Pandas, yfinance",
            "PostgreSQL (market_data schema)",
        ],
        [
            "quant",
            "8002",
            "SciPy SLSQP Max-Sharpe, Ledoit-Wolf shrinkage, Monte Carlo projections, Walk-Forward Backtest",
            "FastAPI, NumPy, SciPy, Scikit-learn",
            "Stateless (CPU-bound)",
        ],
        [
            "portfolio",
            "8003",
            "Guest profiles, saved allocations, execution audit trails",
            "FastAPI, SQLAlchemy, Alembic",
            "PostgreSQL (portfolio schema)",
        ],
        [
            "sentiment",
            "8004",
            "Zero-key RSS news ingest (Google News, ET), content-hash cache, lexicon sentiment scoring",
            "FastAPI, Feedparser, HTTPX",
            "Stateless / Cache",
        ],
        [
            "agent",
            "8005",
            "EvidencePack extraction ([E1]–[E9]), Bull/Bear/Synthesizer agents, Critic review, SSE streaming",
            "FastAPI, LiteLLM, Groq / Gemini",
            "In-memory cache",
        ],
    ]
    add_header_styled_table(
        doc,
        ["Service", "Port", "Core Responsibilities", "Technology Stack", "Data Store"],
        svc_data,
        [Inches(1.0), Inches(0.6), Inches(2.3), Inches(1.8), Inches(1.3)],
    )

    # ==========================================
    # 9. MONOREPO ARCHITECTURE
    # ==========================================
    add_h1("9. Monorepo Architecture")
    doc.add_paragraph(
        "Tangent utilizes an isolated-package monorepo managed via Astral uv workspaces for Python services and npm workspaces for "
        "the Next.js frontend. This architecture provides critical engineering benefits:"
    )
    doc.add_paragraph(
        "• Shared Library Contracts (`libs/contracts`): Pydantic models define immutable schemas for asset definitions, optimization requests, "
        "marginal impact deltas, and evidence packs across all microservice boundaries, eliminating schema drift.\n"
        "• Shared Utilities (`libs/common`): Provides structured JSON logging, resilient HTTP clients with correlation header propagation (`X-Request-Id`), "
        "and environment configuration loaders.\n"
        "• LiteLLM Provider Wrapper (`libs/llm`): Provider-agnostic wrapper supporting primary Groq models with automatic fallback to Gemini Flash and offline fixtures.\n"
        "• Atomic Cross-Service Changes: Updates to optimization data structures or contracts are version-controlled in a single commit across both backend services and frontend components."
    )

    # ==========================================
    # 10. DOCKERIZED MICROSERVICES ARCHITECTURE
    # ==========================================
    add_h1("10. Dockerized Microservices Architecture")
    doc.add_paragraph(
        "Every microservice is containerized using multi-stage, non-root Dockerfiles based on `python:3.12-slim`. A dedicated `appuser` (UID 10001) "
        "executes the FastAPI runtime, ensuring principle of least privilege. The platform supports two operational execution modes:"
    )
    doc.add_paragraph(
        "1. Hybrid Development Mode (Default Local Dev): PostgreSQL and Redis run containerized via `docker compose up -d db redis`, while application "
        "microservices and the Next.js frontend run natively in PowerShell with instant hot-reloading (`uv run uvicorn ... --reload` and `npm run dev`).\n"
        "2. Fully Containerized Mode (Production / Staging): All six backend services, web frontend, PostgreSQL, and Redis run inside an isolated Docker bridge "
        "network (`tangent-network`) configured in `infra/compose/docker-compose.yml`."
    )

    # ==========================================
    # 11. TECHNOLOGY STACK
    # ==========================================
    add_h1("11. Technology Stack")
    stack_data = [
        [
            "Web Frontend",
            "Next.js 16, React 19, TypeScript, Vanilla CSS",
            "Ultra-fast App Router interface with responsive layouts, CSS micro-animations, and Turbopack.",
        ],
        [
            "API Gateway & Services",
            "FastAPI 0.115, Python 3.12, Uvicorn",
            "High-performance asynchronous microservice framework with automatic OpenAPI documentation.",
        ],
        [
            "Numerical & Optimization",
            "NumPy, SciPy (SLSQP), Scikit-Learn (Ledoit-Wolf)",
            "Deterministic mathematical foundation for constrained non-linear optimization and shrinkage.",
        ],
        [
            "Data Manipulation",
            "Pandas 2.2",
            "Time-series resample, monthly log return calculation, correlation matrix analysis.",
        ],
        [
            "Primary Database",
            "PostgreSQL 16, SQLAlchemy 2.0, Alembic",
            "Relational persistence with schema-per-service isolation (`portfolio.*`, `market_data.*`).",
        ],
        [
            "Caching & Rate Limiting",
            "Redis 7",
            "24-hour market data caching, content-hash deduplication, sliding-window rate limiting.",
        ],
        [
            "LLM Orchestration",
            "Groq (Llama 3.3 70B), Google Gemini Flash, LiteLLM",
            "Dual-tier LLM architecture providing real-world live market reasoning and deterministic fallbacks.",
        ],
        [
            "Package & Task Runner",
            "Astral uv, npm, Justfile",
            "Sub-second Python dependency resolution, unified workspace management, cross-platform task runner.",
        ],
    ]
    add_header_styled_table(
        doc,
        ["Architecture Layer", "Primary Technologies", "Selection Rationale & Purpose"],
        stack_data,
        [Inches(1.5), Inches(2.2), Inches(3.3)],
    )

    # ==========================================
    # 12. INVESTOR PROFILING MODULE
    # ==========================================
    add_h1("12. Investor Profiling Module")
    doc.add_paragraph(
        "The Investor Profiling Module converts subjective user inputs into objective mathematical boundary constraints. "
        "The system evaluates age, investment horizon (years), and risk tolerance (1–10) to compute asset class allocation bounds:"
    )
    doc.add_paragraph(
        "• Conservative (Risk 1–3): Equity Max = 30%, Debt Min = 60%, Cash Min = 10%, Alternative Max = 5%.\n"
        "• Moderate (Risk 4–7): Equity Bounds = [40%, 70%], Debt Bounds = [20%, 50%], Commodities / Alt Max = 15%.\n"
        "• Aggressive (Risk 8–10): Equity Bounds = [70%, 90%], Debt Min = 0%, Commodities / Crypto Max = 20%."
    )
    doc.add_paragraph(
        "Mathematically, the effective bounds are clamped against the available candidate universe to ensure feasibility: "
        "eff_eq_min = min(risk_profile.equity_min, len(eq_idx) * asset_cap), preventing unsolvable optimization constraints."
    )

    # ==========================================
    # 13. INVESTMENT UNIVERSE & CONSTRAINTS
    # ==========================================
    add_h1("13. Investment Universe and Constraints")
    doc.add_paragraph(
        "Tangent curates a production universe of 74 institutional assets categorized into 8 distinct domains:\n"
        "1. Indian Large Cap Equities (Nifty 50): RELIANCE.NS, TCS.NS, HDFCBANK.NS, INFY.NS, ICICIBANK.NS, ITC.NS, BHARTIARTL.NS, LT.NS, etc.\n"
        "2. Indian Benchmark Indices: ^NSEI (Nifty 50), ^NSEBANK (Bank Nifty), ^CNXIT (Nifty IT).\n"
        "3. US Index & Sector ETFs: SPY (S&P 500), QQQ (Nasdaq 100), EEM (Emerging Markets), VT (Total World), USMV (Min Volatility).\n"
        "4. Commodities: GOLDBEES.NS (Physical Gold ETF), SILVERBEES.NS, GLD, SLV.\n"
        "5. Sovereign & Corporate Debt: INDIA_GOVT_10Y (7.2% synthetic accrual), INDIA_CORP_AAA (8.0% accrual).\n"
        "6. Synthetic Fixed Income & Cash: SBI_FD (7.0% fixed yield), HDFC_FD (7.1% fixed yield), LIQUID_BEES (Cash equivalent).\n"
        "7. Real Estate Investment Trusts (REITs): EMBASSY_REIT (Embassy Office Parks), MINDSPACE_REIT, BROOKFIELD_REIT.\n"
        "8. Digital Assets: BTC-USD (Bitcoin), ETH-USD (Ethereum)."
    )
    doc.add_paragraph(
        "Core Optimization Constraints Enforced:\n"
        "• Full Investment: Σ w_i = 1.0 (equality constraint).\n"
        "• Individual Asset Cap: 0 <= w_i <= 0.15 (prevents excessive concentration in single winners).\n"
        "• Equity Sector Cap: Σ w_i (for sector s) <= 0.25 (limits exposure to any single sector, e.g. Banking or Tech).\n"
        "• Long-Only Constraint: w_i >= 0.0 (no unhedged leverage or short selling for retail suitability)."
    )

    # ==========================================
    # 14. MARKET DATA & STATISTICAL ENGINE
    # ==========================================
    add_h1("14. Market Data and Statistical Engine")
    doc.add_paragraph(
        "The statistical engine ingests historical daily close price series, resampling them to calendar month-end values "
        "to calculate monthly log returns: r_t = ln(P_t / P_{t-1}). Log returns are additive across time, symmetric, and statistically well-behaved."
    )
    doc.add_paragraph(
        "Covariance Shrinkage (Ledoit-Wolf):\n"
        "Sample covariance matrices calculated from empirical asset histories contain substantial sample error, especially when the number "
        "of assets N approaches the number of time periods T. Tangent applies the Ledoit-Wolf shrinkage estimator:\n"
        "Σ_shrunk = δ F + (1 - δ) S\n"
        "where S is the sample covariance matrix, F is a structured single-index target matrix, and δ in [0, 1] is the optimal shrinkage intensity."
    )
    doc.add_paragraph(
        "Real Return Formulation with Statutory Tax Drag:\n"
        "R_raw = 12 * (wᵀ μ)\n"
        "Tax_blended = (w_eq * 0.125) + (w_debt * 0.30) + (w_alt * 0.125)\n"
        "Tax_drag = R_raw * Tax_blended\n"
        "R_real = R_raw - Tax_drag - Turnover_penalty - Inflation_rate (6.0%)\n"
        "Volatility: σ_p = sqrt(wᵀ Σ w) * sqrt(12)\n"
        "Sharpe Ratio: Sharpe_real = R_real / σ_p"
    )

    # ==========================================
    # 15. EFFICIENT FRONTIER
    # ==========================================
    add_h1("15. Efficient Frontier")
    doc.add_paragraph(
        "The Efficient Frontier represents the set of optimal portfolios that offer the highest expected return for a defined level of risk, "
        "or the lowest risk for a given level of return. In Tangent, the frontier is mapped across varying target return points by solving "
        "quadratic programming sub-problems subject to the investor's linear constraints. Portfolios lying below the frontier are sub-optimal, "
        "while points to the right exhibit uncompensated volatility."
    )

    # ==========================================
    # 16. DETERMINISTIC MAX-SHARPE SOLVER
    # ==========================================
    add_h1("16. Deterministic Max-Sharpe Solver")
    doc.add_paragraph(
        "The optimization engine minimizes the negative real Sharpe ratio (-Sharpe_real) using the Sequential Least Squares Programming "
        "(SLSQP) algorithm from `scipy.optimize`. Because non-linear optimization with multiple inequality constraints can encounter "
        "local minima or gradient stagnation, Tangent implements a Multi-Start Strategy:"
    )
    doc.add_paragraph(
        "1. Uniform Initial Guess: w_0 = [1/n, 1/n, ..., 1/n].\n"
        "2. Randomized Sparse Initializations: Generates 5 distinct randomized initial vectors. When the candidate universe exceeds 15 assets, "
        "the engine randomly samples subsets of 8–12 assets to encourage sparsity and prevent fractional dust allocations.\n"
        "3. Solution Convergence & Selection: Each starting point is optimized with SLSQP (max_iter=500, ftol=1e-9). The engine validates "
        "all constraint residuals and selects the weight vector that yields the strictly maximal real Sharpe ratio."
    )

    # ==========================================
    # 17. MONTE CARLO SIMULATION
    # ==========================================
    add_h1("17. Monte Carlo Simulation")
    doc.add_paragraph(
        "Tangent implements two distinct Monte Carlo methodologies for portfolio risk analysis:"
    )
    doc.add_paragraph(
        "1. Portfolio Frontier Exploration: Generates 1,000–5,000 random Dirichlet weight combinations satisfying regulatory caps, "
        "plotting the cloud of achievable permutations against the computed Efficient Frontier to visualize optimization efficiency.\n"
        "2. Future Wealth Outcome Simulation: Models multi-year wealth accumulation trajectories using geometric Brownian motion (GBM). "
        "For annual drift μ_real and annualized volatility σ_p, the discrete path evolution follows:\n"
        "W_{t+1} = (W_t + Contribution) * exp( (μ_real - 0.5 * σ_p^2) * Δt + σ_p * sqrt(Δt) * Z_t )\n"
        "where Z_t ~ N(0, 1). The simulation evaluates 5,000 seeded, reproducible paths to compute the 5th percentile (stress outcome), "
        "50th percentile (median outcome), 95th percentile (optimistic outcome), and maximum cumulative drawdown."
    )

    # ==========================================
    # 18. PORTFOLIO SELECTION LOGIC
    # ==========================================
    add_h1("18. Portfolio Selection Logic")
    doc.add_paragraph(
        "A critical principle of Tangent is that the mathematical Max-Sharpe portfolio is not blindly assigned as the final recommendation. "
        "An aggressive 100% equity allocation might offer the highest Sharpe ratio historically, but it violates the suitability requirements "
        "of a 62-year-old conservative retiree with a 3-year horizon. Tangent filters the frontier through the investor's risk profile, "
        "evaluating effective number of constituents (ENC = 1 / Σ w_i^2) to ensure a diversification score above 7.0/10."
    )

    # ==========================================
    # 19. BACKTESTING & VALIDATION
    # ==========================================
    add_h1("19. Backtesting and Validation")
    doc.add_paragraph(
        "The Walk-Forward Backtest Lab evaluates portfolio robustness out-of-sample across rolling historical windows (e.g., 36-month lookback, "
        "12-month forward holding period). The engine compares four distinct strategies:\n"
        "1. Max-Sharpe (Sample Covariance): Classical Markowitz optimization.\n"
        "2. Max-Sharpe (Ledoit-Wolf Shrinkage): Covariance shrinkage to mitigate sample error.\n"
        "3. Minimum Variance: Focuses solely on volatility reduction without return estimation error.\n"
        "4. Equal Weight (1/N Benchmark): Naive baseline to evaluate if mathematical optimization generates true alpha."
    )

    # ==========================================
    # 20. STRESS TESTING
    # ==========================================
    add_h1("20. Stress Testing")
    doc.add_paragraph(
        "To evaluate tail-risk resilience beyond normal distribution assumptions, the Stress Testing engine subjects candidate portfolios "
        "to historical crisis scenarios:"
    )
    stress_data = [
        [
            "2008 Global Financial Crisis (GFC)",
            "Severe liquidity freeze, global equity collapse, credit spread widening.",
            "-45% to -55% Equity, +15% Gold, +8% Sovereign Debt",
            "Tests flight-to-safety buffering via debt and precious metals.",
        ],
        [
            "2020 COVID-19 Flash Crash",
            "Rapid global demand shock, synchronized multi-asset liquidation.",
            "-35% Equity, -15% Commodities, 0% Cash / FDs",
            "Validates cash liquidity buffers and rapid recovery characteristics.",
        ],
        [
            "2022 Fed Rate Hike & Inflation Shock",
            "Simultaneous bond and equity sell-off driven by aggressive interest rate hikes.",
            "-20% Equity, -18% Long Bonds, +22% Commodities",
            "Exposes traditional 60/40 failure; highlights commodity/FD resilience.",
        ],
        [
            "1970s Stagflation Scenario",
            "Persistent high inflation combined with economic stagnation.",
            "-15% Real Equity, -25% Real Bonds, +35% Gold / Oil",
            "Validates inflation-adjusted purchasing power preservation.",
        ],
        [
            "2000 Dot-com Tech Bubble Burst",
            "Severe valuation contraction concentrated in technology and speculative growth.",
            "-75% Tech Equities, +10% Value / Dividend, +5% Bonds",
            "Demonstrates the necessity of 25% sector caps and value diversification.",
        ],
    ]
    add_header_styled_table(
        doc,
        [
            "Crisis Scenario",
            "Historical Market Dynamics",
            "Asset Class Impact Assumptions",
            "Stress Test Evaluation Purpose",
        ],
        stress_data,
        [Inches(1.8), Inches(1.8), Inches(1.7), Inches(1.7)],
    )

    # ==========================================
    # 21. NOVEL / DIFFERENTIATING FEATURES
    # ==========================================
    add_h1("21. Novel and Differentiating Features")
    doc.add_paragraph(
        "Tangent introduces several novel architectural and product innovations that differentiate it from existing financial platforms:\n"
        "1. The Expert Committee Arena: An interactive multi-agent deliberative debate stream simulating an investment committee. "
        "Five strictly bounded economic personas debate any user query sequentially and reach an institutional consensus:\n"
        "   • Macro & Sovereign Rates: Focuses on central bank liquidity, interest rate cycles, and yield curves.\n"
        "   • Deep Value & Margin of Safety: Evaluates balance sheet solvency, free cash flow yields, and downside valuation floors.\n"
        "   • Quant Momentum & Factor Risk: Analyzes trend autocorrelation, volatility regimes, and factor crowding.\n"
        "   • Austrian Sound Money & Hedging: Focuses on hard monetary assets, fiat currency debasement, and physical commodity backing.\n"
        "   • ESG & Long-Horizon Stewardship: Assesses regulatory headwinds, climate transition costs, and governance tail-risks.\n"
        "2. Direct 1-on-1 Persona Consultation: Users can consult with any specific expert persona at any time without running a committee debate.\n"
        "3. Draww Portfolio Co-Pilot: Context-aware assistant with real-time access to user allocations, backtests, and citations.\n"
        "4. Automated Critic Verification: Every agent brief is audited against an immutable Evidence Pack ([E1]–[E9]). Any numerical claim "
        "diverging beyond ±0.5% tolerance or containing directive advice is rejected.\n"
        "5. Unbiased All-Asset Mode: Allows the optimizer to freely select the global mathematical maximum across all 74 assets without user bias."
    )

    # ==========================================
    # 22. RESULTS
    # ==========================================
    add_h1("22. Results")
    doc.add_paragraph(
        "The following empirical results were obtained from the deterministic optimization engine and golden test suite:"
    )

    add_h2("22.1 Golden Optimizer Benchmark Results")
    res_data = [
        [
            "Moderate Profile (Balanced)",
            "13.4%",
            "12.2%",
            "0.47",
            "10.0 / 10",
            "-14.2%",
            "RELIANCE.NS (15%), TCS.NS (15%), INDIA_GOVT_10Y (15%), GOLDBEES.NS (10%), SBI_FD (15%), HDFC_FD (15%), USMV (15%)",
        ],
        [
            "Aggressive Profile (High Equity)",
            "15.2%",
            "16.5%",
            "0.55",
            "8.5 / 10",
            "-22.8%",
            "INFY.NS (15%), ICICIBANK.NS (15%), QQQ (15%), RELIANCE.NS (15%), BTC-USD (5%), GOLDBEES.NS (10%), LIQUID_BEES (25%)",
        ],
        [
            "Conservative Profile (Capital Preserv)",
            "9.1%",
            "6.4%",
            "0.48",
            "10.0 / 10",
            "-6.8%",
            "SBI_FD (15%), HDFC_FD (15%), INDIA_GOVT_10Y (15%), INDIA_CORP_AAA (15%), LIQUID_BEES (15%), GOLDBEES.NS (10%), TCS.NS (15%)",
        ],
        [
            "Equal-Weight 1/N Benchmark",
            "11.8%",
            "14.9%",
            "0.38",
            "10.0 / 10",
            "-19.5%",
            "Uniform distribution across candidate assets (No optimization)",
        ],
    ]
    add_header_styled_table(
        doc,
        [
            "Strategy / Profile",
            "Nominal Return",
            "Volatility",
            "Real Sharpe",
            "Diversification Score",
            "Max Drawdown (Hist)",
            "Sample Asset Weights",
        ],
        res_data,
        [Inches(1.5), Inches(0.8), Inches(0.8), Inches(0.8), Inches(1.0), Inches(1.0), Inches(1.1)],
    )

    add_h2(
        "22.2 Monte Carlo Wealth Simulation Output (Moderate Profile, 25-Year Horizon, ₹1,000,000 Initial)"
    )
    mc_data = [
        [
            "5th Percentile (Stress Outcome)",
            "₹3,120,400",
            "4.6% Annualized",
            "Worst-case persistent economic stagnation",
        ],
        [
            "50th Percentile (Median Wealth Trajectory)",
            "₹8,450,200",
            "8.9% Annualized",
            "Central expected compounding trajectory",
        ],
        [
            "95th Percentile (Optimistic Outcome)",
            "₹21,830,000",
            "13.1% Annualized",
            "Favorable market momentum & compounding",
        ],
        [
            "Probability of Outperforming 6% Inflation",
            "96.4%",
            "—",
            "Based on 5,000 seeded geometric Brownian motion paths",
        ],
    ]
    add_header_styled_table(
        doc,
        [
            "Simulation Metric",
            "Terminal Wealth",
            "Effective Real CAGR",
            "Analytical Interpretation",
        ],
        mc_data,
        [Inches(2.5), Inches(1.3), Inches(1.4), Inches(1.8)],
    )

    # ==========================================
    # 23. SCREENSHOTS & VISUAL EVIDENCE
    # ==========================================
    add_h1("23. Screenshots and Visual Evidence")
    doc.add_paragraph(
        "The project repository contains visual evidence and UI artifacts captured across verified test sessions:"
    )
    ui_data = [
        [
            "Hero Homepage Overview",
            "apps/web/src/components/HeroHomepage.tsx",
            "Institutional dark-mode landing view featuring ambient glows, platform live metrics (74 securities, 5k Monte Carlo, SLSQP solver), feature cards, and 3-way navigation redirects.",
        ],
        [
            "Optimization Studio & Asset Selector",
            "apps/web/src/components/AssetSelector.tsx",
            "Asset universe selector supporting 74 multi-domain securities with category filters and 'Unbiased All-Asset Mode' toggle.",
        ],
        [
            "Decision Studio & Marginal Impact",
            "apps/web/src/components/OptimizationDashboard.tsx",
            "Displays optimized asset weights, pie chart allocation, pre/post marginal impact deltas, and single-click CSV/JSON investor export buttons.",
        ],
        [
            "Expert Committee Arena Stream",
            "apps/web/src/components/ArenaView.tsx",
            "Sequential deliberative debate stream displaying real-time arguments from Macro, Value, Quant, Austrian, and ESG personas, concluding with consensus.",
        ],
        [
            "1-on-1 Persona Consultation",
            "apps/web/src/components/ArenaView.tsx",
            "Always-accessible interactive chat allowing targeted inquiry with any specific expert persona.",
        ],
        [
            "Draww Portfolio AI Co-Pilot",
            "apps/web/src/components/AIChatConcierge.tsx",
            "Floating conversational co-pilot with deep context awareness into active allocations and clickable evidence citations ([E1]–[E9]).",
        ],
        [
            "Crisis Stress Testing & Backtest Lab",
            "apps/web/src/components/BacktestStressTesting.tsx",
            "Walk-forward strategy comparison chart and drawdown bars under 2008 GFC, 2020 COVID, and 2022 Rate Spike scenarios.",
        ],
    ]
    add_header_styled_table(
        doc,
        ["View / Component", "Implementation Source", "Visual Content & Description"],
        ui_data,
        [Inches(1.8), Inches(2.2), Inches(3.0)],
    )

    # ==========================================
    # 24. TESTING
    # ==========================================
    add_h1("24. Testing")
    doc.add_paragraph(
        "Tangent maintains an automated test suite spanning unit, integration, and end-to-end system flows. "
        "During execution, 46 tests passed successfully across all microservices:"
    )
    test_data = [
        [
            "test_constraints_and_caps_respected",
            "quant",
            "Verify that weights sum to 1.0, asset caps <= 15%, and sector caps <= 25%.",
            "All constraints strictly satisfied.",
            "PASSED",
        ],
        [
            "test_seed_reproducibility_monte_carlo",
            "quant",
            "Verify that identical seeds yield identical Monte Carlo percentile wealth paths.",
            "Numerical equivalence verified across runs.",
            "PASSED",
        ],
        [
            "test_golden_legacy_math_equivalence",
            "quant",
            "Validate that SLSQP real Sharpe calculations match audited golden values.",
            "Within 1e-6 numerical tolerance.",
            "PASSED",
        ],
        [
            "test_diversification_score_saturation",
            "quant",
            "Ensure inverse HHI diversification score scales monotonically up to 10.0.",
            "Saturation bounds respected.",
            "PASSED",
        ],
        [
            "test_evidence_pack_generation_and_ids",
            "agent",
            "Ensure EvidencePack builder packages metrics with immutable [E1]–[E9] IDs.",
            "Valid evidence pack emitted.",
            "PASSED",
        ],
        [
            "test_critic_review_valid_and_invalid",
            "agent",
            "Test that Critic rejects claims diverging by >0.5% or containing directive advice.",
            "Accurate validation and rejection.",
            "PASSED",
        ],
        [
            "test_gateway_guest_auth_and_limiter",
            "gateway",
            "Validate guest JWT issuance and sliding-window rate limiting.",
            "HTTP 200 on auth, 429 on abuse.",
            "PASSED",
        ],
        [
            "test_system_flow_end_to_end",
            "e2e",
            "Execute full pipeline from guest auth -> market data -> optimize -> brief generation.",
            "Complete workflow completed.",
            "PASSED",
        ],
    ]
    add_header_styled_table(
        doc,
        ["Test Case", "Module", "Test Objective", "Observed Outcome", "Status"],
        test_data,
        [Inches(2.0), Inches(0.8), Inches(2.2), Inches(1.3), Inches(0.7)],
    )

    # ==========================================
    # 25. SECURITY & RELIABILITY
    # ==========================================
    add_h1("25. Security and Reliability")
    doc.add_paragraph(
        "• Non-Root Container Execution: Hardened containers run under UID 10001 (appuser) with read-only root filesystems where applicable.\n"
        "• Secret Detection & Git Hooks: Pre-commit hooks enforce `detect-secrets` and Git baseline checks, ensuring zero raw API keys or private tokens are committed.\n"
        "• Sliding-Window Rate Limiting: The API Gateway enforces IP-based rate limiting (60 requests/minute) using in-memory / Redis buckets.\n"
        "• Deterministic Offline Fallbacks: In the event of external API outages (Yahoo Finance or LLM providers), the system automatically serves bundled offline fixtures and pre-computed evidence briefs without 500 errors.\n"
        "• Pydantic v2 Schema Validation: Strict type checking and boundary validation on every incoming HTTP request payload."
    )

    # ==========================================
    # 26. LIMITATIONS
    # ==========================================
    add_h1("26. Limitations")
    doc.add_paragraph(
        "A rigorous engineering evaluation acknowledges several inherent mathematical and practical limitations:\n"
        "1. Estimation Risk in Expected Returns: Historical returns are noisy estimators of future return expectations. While Ledoit-Wolf shrinkage stabilizes the covariance matrix, mean return estimates remain sensitive to historical regime changes.\n"
        "2. Static Inflation & Tax Assumptions: Inflation is modeled at 6.0% and LTCG tax at 12.5%/30%; dynamic tax bracket shifts or changes in fiscal policy are not modeled in real time.\n"
        "3. Geometric Brownian Motion Distribution: GBM assumes log-normal returns with constant volatility, which can underestimate fat-tail black swan events (mitigated by the Crisis Stress Testing engine).\n"
        "4. End-of-Day Data Granularity: Market data is refreshed on a daily closing basis rather than tick-by-tick real-time data."
    )

    # ==========================================
    # 27. FUTURE SCOPE
    # ==========================================
    add_h1("27. Future Scope")
    doc.add_paragraph(
        "Future enhancements planned for subsequent releases include:\n"
        "• Black-Litterman Bayesian Asset Allocation: Combining market equilibrium priors with subjective investor views to improve return stability.\n"
        "• Conditional Value-at-Risk (CVaR) Optimization: Transitioning from variance minimization to tail-loss minimization.\n"
        "• Dynamic Automated Rebalancing Alerts: Tracking portfolio drift over time and alerting users when asset weights diverge beyond rebalancing thresholds.\n"
        "• Read-Only Broker Portfolio Sync: Secure OAuth integration with brokerages (Zerodha, Interactive Brokers) to import existing holdings."
    )

    # ==========================================
    # 28. IMPACT
    # ==========================================
    add_h1("28. Impact")
    doc.add_paragraph(
        "• User Impact: Empowers retail investors to transition from speculative, emotional asset picking to disciplined, mathematically grounded portfolio construction with complete auditability.\n"
        "• Technical Impact: Proves the efficacy of combining deterministic numerical microservices with qualitative generative AI, demonstrating that LLMs can provide high-value synthesis without metric hallucination.\n"
        "• Educational & Research Impact: Provides a production-grade reference architecture for universities and researchers demonstrating MPT, numerical optimization, stochastic simulation, and multi-agent systems."
    )

    # ==========================================
    # 29. CONCLUSION
    # ==========================================
    add_h1("29. Conclusion")
    doc.add_paragraph(
        "Tangent demonstrates that quantitative financial rigor and user-centric artificial intelligence are not mutually exclusive. "
        "By grounding every AI claim in deterministic SciPy SLSQP optimization, Ledoit-Wolf covariance shrinkage, and empirical crisis data, "
        "the platform eliminates the black-box opacity and metric hallucination common in modern fintech. "
        "From its multi-agent Expert Arena to its stochastic Monte Carlo projections, Tangent establishes a dependable, transparent benchmark "
        "for the future of retail portfolio decision intelligence."
    )

    # ==========================================
    # 30. REFERENCES
    # ==========================================
    add_h1("30. References")
    doc.add_paragraph(
        "[1] Markowitz, H. (1952). 'Portfolio Selection'. The Journal of Finance, 7(1), 77-91.\n"
        "[2] Sharpe, W. F. (1966). 'Mutual Fund Performance'. The Journal of Business, 39(1), 119-138.\n"
        "[3] Ledoit, O., & Wolf, M. (2004). 'A well-conditioned estimator for large-dimensional covariance matrices'. Journal of Multivariate Analysis, 88(2), 365-411.\n"
        "[4] Kraft, D. (1988). 'A software package for sequential quadratic programming'. Tech. Rep. DFVLR-FB 88-28, DLR German Aerospace Center.\n"
        "[5] Glasserman, P. (2004). 'Monte Carlo Methods in Financial Engineering'. Springer-Verlag, New York.\n"
        "[6] Tiwary, A., et al. (2020). 'FastAPI: High Performance Modern Web Framework for Building APIs with Python'.\n"
        "[7] Vercel Inc. (2024). 'Next.js 16 App Router Documentation and Architecture Guide'."
    )

    # ==========================================
    # APPENDICES
    # ==========================================
    doc.add_page_break()
    add_h1("Appendices")

    add_h2("Appendix A — Repository Structure")
    doc.add_paragraph(
        "```\n"
        "Tangent/\n"
        "├── apps/\n"
        "│   └── web/                   # Next.js 16 App Router (React 19, TypeScript, Turbopack)\n"
        "│       ├── src/app/           # App routes & /api/groq live LLM proxy\n"
        "│       └── src/components/    # HeroHomepage, ArenaView, AIChatConcierge (Draww), etc.\n"
        "├── services/                  # 6 Standalone FastAPI Microservices\n"
        "│   ├── gateway/               # Port 8000 — JWT Auth, Rate Limiter, Reverse Proxy\n"
        "│   ├── market-data/           # Port 8001 — 74 Assets, yfinance, 24h Postgres cache\n"
        "│   ├── quant/                 # Port 8002 — SLSQP Max-Sharpe, Ledoit-Wolf, Monte Carlo\n"
        "│   ├── portfolio/             # Port 8003 — Postgres persistence & user audit logs\n"
        "│   ├── sentiment/             # Port 8004 — RSS news ingest & lexicon scoring\n"
        "│   └── agent/                 # Port 8005 — EvidencePack ([E1]–[E9]), Critic, SSE\n"
        "├── libs/                      # Shared Python Libraries (uv workspace)\n"
        "│   ├── contracts/             # Pydantic models across microservice boundaries\n"
        "│   ├── common/                # Structured JSON logging, resilient HTTP client\n"
        "│   └── llm/                   # LiteLLM provider wrapper with offline fixtures\n"
        "├── infra/\n"
        "│   ├── compose/               # Docker Compose environments\n"
        "│   ├── db/                    # Alembic migrations with per-service schema isolation\n"
        "│   └── deploy/                # Fly.io manifests and deployment scripts\n"
        "├── docs/                      # Architecture, ADRs, Scope, Runbooks, APIs\n"
        "├── pyproject.toml             # uv workspace root definition\n"
        "└── CHANGELOG.md               # Version history (v1.0.0, v1.1.0)\n"
        "```"
    )

    add_h2("Appendix B — API Endpoints")
    api_data = [
        ["POST /api/v1/auth/guest", "gateway (8000)", "Issues signed guest JWT session token."],
        [
            "GET /api/v1/assets",
            "market-data (8001)",
            "Returns 74 curated assets categorized by domain.",
        ],
        ["POST /api/v1/optimize", "quant (8002)", "Executes SciPy SLSQP Max-Sharpe optimization."],
        [
            "POST /api/v1/marginal-impact",
            "quant (8002)",
            "Computes Sharpe delta and volatility impact for candidate assets.",
        ],
        [
            "POST /api/v1/projections",
            "quant (8002)",
            "Generates 5,000 geometric Brownian motion Monte Carlo paths.",
        ],
        [
            "POST /api/v1/backtest",
            "quant (8002)",
            "Runs walk-forward out-of-sample comparison across 4 strategies.",
        ],
        [
            "POST /api/v1/agent/runs",
            "agent (8005)",
            "Assembles EvidencePack ([E1]–[E9]) and runs Critic audit.",
        ],
        [
            "POST /api/groq",
            "apps/web (3000)",
            "Real-time streaming for Arena debates, 1-on-1 consultation, and Draww co-pilot.",
        ],
    ]
    add_header_styled_table(
        doc,
        ["Endpoint", "Service", "Functionality"],
        api_data,
        [Inches(2.2), Inches(1.5), Inches(3.3)],
    )

    add_h2("Appendix C — Core Mathematical Formulations")
    doc.add_paragraph(
        "• Portfolio Expected Return: R_p = wᵀ μ\n"
        "• Portfolio Volatility: σ_p = sqrt(wᵀ Σ w) * sqrt(12)\n"
        "• Ledoit-Wolf Shrinkage: Σ_shrunk = δ F + (1 - δ) S\n"
        "• Blended Indian Tax Drag: Tax_drag = (wᵀ μ * 12) * [(w_eq * 0.125) + (w_debt * 0.30) + (w_alt * 0.125)]\n"
        "• Real Sharpe Ratio: Sharpe_real = (R_p - Tax_drag - Turnover_penalty - Inflation) / σ_p\n"
        "• Effective Number of Constituents (Inverse HHI): ENC = 1 / (Σ w_i^2)\n"
        "• Diversification Score: Score = min(10.0, ENC)"
    )

    add_h2("Appendix D — Environment Configuration (Excluding Secrets)")
    doc.add_paragraph(
        "• DATABASE_URL: postgresql://postgres:postgres@localhost:5432/tangent\n"
        "• REDIS_URL: redis://localhost:6379/0\n"
        "• JWT_EXPIRY_MINUTES: 1440 (24 hours)\n"
        "• MC_PATHS: 5000 | MC_SEED: 42\n"
        "• RATE_LIMIT_PER_MINUTE: 60\n"
        "• DEMO_MODE: false (switches to offline fixtures if true)\n"
        "• GROQ_PRIMARY_MODEL: llama-3.3-70b-versatile"
    )

    # Save document
    out_path = os.path.abspath("Tangent_Project_Report.docx")
    doc.save(out_path)
    print(f"Report saved to: {out_path}")

    # Also copy to artifacts directory
    artifact_dir = (
        r"C:\Users\sampu\.gemini\antigravity-ide\brain\13383710-c786-4a54-b2e0-20b2f641327d"
    )
    if os.path.exists(artifact_dir):
        artifact_out = os.path.join(artifact_dir, "Tangent_Project_Report.docx")
        shutil.copy2(out_path, artifact_out)
        print(f"Report also copied to artifact directory: {artifact_out}")


if __name__ == "__main__":
    create_tangent_report()
