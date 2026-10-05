"""Critic Agent validation engine for citation and numerical grounding."""

import re
from typing import Literal

from contracts.brief import CriticIssue, CriticReview, DecisionBrief
from contracts.evidence import EvidencePack

DIRECTIVE_PHRASES = [
    "you should buy",
    "you must buy",
    "guaranteed return",
    "guaranteed profit",
    "risk-free return",
    "will definitely surge",
    "you should sell",
    "strong buy recommendation",
]


def review_decision_brief(brief: DecisionBrief, evidence: EvidencePack) -> CriticReview:
    """Validate that all claims in brief cite valid evidence IDs with accurate numbers."""
    issues: list[CriticIssue] = []
    valid_evidence_map = {item.id: item for item in evidence.items}

    # 1. Directive Language Check
    full_text = f"{brief.summary} {' '.join(brief.bull_case)} {' '.join(brief.bear_case)}".lower()
    for phrase in DIRECTIVE_PHRASES:
        if phrase in full_text:
            issues.append(
                CriticIssue(
                    severity="error",
                    issue_type="directive_language",
                    message=f"Disallowed directive investment advice phrase detected: '{phrase}'",
                )
            )

    # 2. Claim-by-Claim Citation & Numerical Validation
    valid_claims_count = 0
    total_claims = len(brief.claims)

    for claim in brief.claims:
        claim_has_issue = False

        if not claim.evidence_ids:
            issues.append(
                CriticIssue(
                    severity="error",
                    claim_text=claim.text,
                    issue_type="missing_citation",
                    message="Claim is asserted without any evidence citation.",
                )
            )
            continue

        for eid in claim.evidence_ids:
            if eid not in valid_evidence_map:
                issues.append(
                    CriticIssue(
                        severity="error",
                        claim_text=claim.text,
                        issue_type="invalid_evidence_id",
                        message=f"Cited evidence ID '{eid}' does not exist in the evidence pack.",
                    )
                )
                claim_has_issue = True
            else:
                # Check for numeric consistency if numbers appear in claim
                evd_item = valid_evidence_map[eid]
                numbers_in_claim = re.findall(r"\b\d+(?:\.\d+)?%?\b", claim.text)
                if numbers_in_claim and isinstance(evd_item.value, (int, float)):
                    # Check if evd_item.value matches at least one number in text (within 0.5% tolerance)
                    target_val = float(evd_item.value)
                    matched = False
                    for num_str in numbers_in_claim:
                        val = float(num_str.replace("%", ""))
                        if abs(val - target_val) <= 0.5:
                            matched = True
                            break
                    if not matched:
                        issues.append(
                            CriticIssue(
                                severity="warning",
                                claim_text=claim.text,
                                issue_type="numeric_mismatch",
                                message=(
                                    f"Number in claim does not match evidence '{eid}' "
                                    f"value of {target_val}{evd_item.unit}"
                                ),
                            )
                        )

        if not claim_has_issue:
            valid_claims_count += 1

    # Compute groundedness score
    score = valid_claims_count / max(1, total_claims)
    has_errors = any(i.severity == "error" for i in issues)

    verdict: Literal["approved", "needs_revision", "rejected"]
    if score >= 0.85 and not has_errors:
        verdict = "approved"
    elif score >= 0.50:
        verdict = "needs_revision"
    else:
        verdict = "rejected"

    return CriticReview(
        verdict=verdict,
        groundedness_score=round(score, 3),
        issues=issues,
        revision_count=0,
    )
