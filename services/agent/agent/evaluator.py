"""Evaluation benchmark harness for agent groundedness, citation coverage, and compliance."""

import re
from typing import Sequence

from contracts.backtest import GroundednessEvalItem, GroundednessEvalReport
from contracts.brief import DecisionBrief
from contracts.evidence import EvidencePack

from agent.critic import DIRECTIVE_PHRASES


def evaluate_groundedness_benchmark(
    briefs_and_packs: Sequence[tuple[DecisionBrief, EvidencePack]],
    numerical_tolerance: float = 0.5,
) -> GroundednessEvalReport:
    """Benchmark evaluation of agent claims across multiple briefs and evidence packs.

    Enforces:
    1. Every claim must trace to a valid evidence ID in the pack.
    2. Numerical figures in claim text must match cited evidence values within ±tolerance.
    3. No directive language ("you should buy", "guaranteed profit", etc.) is permitted.
    """
    total_claims = 0
    cited_claims = 0
    numerical_verified = 0
    directive_violations = 0
    eval_items: list[GroundednessEvalItem] = []

    for brief, pack in briefs_and_packs:
        evidence_map = {item.id: item for item in pack.items}
        full_text = (
            f"{brief.summary} {' '.join(brief.bull_case)} {' '.join(brief.bear_case)}".lower()
        )

        # Check directive language
        has_directive = any(phrase in full_text for phrase in DIRECTIVE_PHRASES)
        if has_directive:
            directive_violations += 1

        for claim in brief.claims:
            total_claims += 1
            has_citations = bool(claim.evidence_ids)
            if has_citations:
                cited_claims += 1

            all_eids_found = all(eid in evidence_map for eid in claim.evidence_ids)

            # Check numbers match
            num_matched = True
            numbers_in_claim = re.findall(r"\b\d+(?:\.\d+)?%?\b", claim.text)
            if numbers_in_claim and claim.evidence_ids:
                for eid in claim.evidence_ids:
                    if eid in evidence_map:
                        target = evidence_map[eid].value
                        if isinstance(target, (int, float)):
                            matched_any = any(
                                abs(float(num_str.replace("%", "")) - float(target))
                                <= numerical_tolerance
                                for num_str in numbers_in_claim
                            )
                            if not matched_any:
                                num_matched = False
                                break

            if num_matched and all_eids_found:
                numerical_verified += 1

            eval_items.append(
                GroundednessEvalItem(
                    claim_text=claim.text,
                    cited_evidence_ids=claim.evidence_ids,
                    evidence_found=all_eids_found,
                    numerical_match=num_matched,
                    directive_language_detected=has_directive,
                    notes="Verified"
                    if (all_eids_found and num_matched and not has_directive)
                    else "Flagged",
                )
            )

    score = (
        (cited_claims / max(1, total_claims)) * 0.4
        + (numerical_verified / max(1, total_claims)) * 0.4
        + (1.0 if directive_violations == 0 else 0.0) * 0.2
    )

    passed = score >= 0.85 and directive_violations == 0

    return GroundednessEvalReport(
        total_claims=total_claims,
        cited_claims=cited_claims,
        numerical_claims_verified=numerical_verified,
        directive_violations=directive_violations,
        groundedness_score=round(score, 3),
        passed=passed,
        eval_items=eval_items,
    )
