import logging

logger = logging.getLogger(__name__)

INNOVATION_TEMPLATES = {
    "high": [
        "Strong innovation ({score}/10) — your idea stands out as unique in this hackathon's pool.",
        "Excellent originality ({score}/10) — the concept is fresh and distinctive.",
        "Impressive innovation ({score}/10) — this is a creative approach to the problem.",
    ],
    "medium": [
        "Moderate innovation ({score}/10) — consider differentiating your idea further from existing solutions.",
        "Fair originality ({score}/10) — try adding a unique angle or novel feature to stand out.",
        "Decent innovation ({score}/10) — the idea has potential but could be more distinctive.",
    ],
    "low": [
        "Low innovation ({score}/10) — this concept closely resembles existing submissions. Consider a fundamentally different approach.",
        "Limited originality ({score}/10) — the idea feels generic. Try solving a more specific niche problem.",
        "Innovation needs work ({score}/10) — consider what makes your solution different from what already exists.",
    ],
}

FEASIBILITY_TEMPLATES = {
    "high": [
        "Strong feasibility ({score}/10) — well-defined technical approach with clear implementation path.",
        "Highly feasible ({score}/10) — the proposed tech stack and solution are well-thought-out.",
        "Great feasibility ({score}/10) — your technical plan demonstrates a realistic scope.",
    ],
    "medium": [
        "Moderate feasibility ({score}/10) — consider specifying your technical approach more clearly.",
        "Fair feasibility ({score}/10) — add more detail about your implementation strategy and timeline.",
        "Reasonable feasibility ({score}/10) — strengthen by clarifying database design and API architecture.",
    ],
    "low": [
        "Low feasibility ({score}/10) — the proposal lacks technical specifics. Define your tech stack, architecture, and development plan.",
        "Feasibility needs improvement ({score}/10) — specify concrete tools, frameworks, and a realistic timeline.",
        "Weak feasibility ({score}/10) — consider whether the scope is achievable. Break down the solution into specific technical components.",
    ],
}

RELEVANCE_TEMPLATES = {
    "high": [
        "Excellent relevance ({score}/10) — your idea aligns perfectly with the hackathon theme.",
        "Great thematic fit ({score}/10) — the submission strongly matches the hackathon's focus areas.",
        "High relevance ({score}/10) — your solution directly addresses the hackathon's core challenges.",
    ],
    "medium": [
        "Moderate relevance ({score}/10) — try strengthening the connection to the hackathon theme.",
        "Fair relevance ({score}/10) — consider how your solution more directly addresses the theme's goals.",
        "Reasonable relevance ({score}/10) — make the thematic alignment more explicit in your description.",
    ],
    "low": [
        "Low relevance ({score}/10) — the submission doesn't clearly connect to the hackathon theme. Realign your idea.",
        "Weak thematic fit ({score}/10) — revisit the hackathon description and adjust your solution to match.",
        "Relevance needs work ({score}/10) — consider pivoting your idea to better address the stated theme and criteria.",
    ],
}

CLARITY_TEMPLATES = {
    "high": [
        "Clear and well-structured ({score}/10) — your proposal is easy to understand and well-organized.",
        "Excellent clarity ({score}/10) — the writing is concise and the ideas flow logically.",
        "Great presentation ({score}/10) — well-articulated problem statement and solution description.",
    ],
    "medium": [
        "Moderate clarity ({score}/10) — consider using structured sections (problem, solution, tech stack) for better readability.",
        "Fair clarity ({score}/10) — some sections could be more concise and better organized.",
        "Reasonable clarity ({score}/10) — try using bullet points and shorter paragraphs for key information.",
    ],
    "low": [
        "Low clarity ({score}/10) — the proposal is hard to follow. Use clear sections: Problem, Solution, Tech Stack, Timeline.",
        "Clarity needs improvement ({score}/10) — restructure with distinct sections and concise language.",
        "Weak presentation ({score}/10) — the writing is unclear. Focus on one core problem and one clear solution.",
    ],
}

OVERALL_SUMMARY_TEMPLATES = {
    "excellent": "Your idea scored {score}/10 — an excellent submission! {shortlist_status}",
    "good": "Your idea scored {score}/10 — a solid submission with room for improvement. {shortlist_status}",
    "average": "Your idea scored {score}/10 — a decent effort. Consider the suggestions below to strengthen it. {shortlist_status}",
    "below_average": "Your idea scored {score}/10 — significant improvements are needed. Review the feedback carefully. {shortlist_status}",
    "poor": "Your idea scored {score}/10 — the submission needs substantial rework across multiple areas. {shortlist_status}",
}


def _get_bracket(score):
    if score >= 7.0:
        return "high"
    elif score >= 4.0:
        return "medium"
    else:
        return "low"


def _get_overall_bracket(score):
    if score >= 8.5:
        return "excellent"
    elif score >= 7.0:
        return "good"
    elif score >= 5.0:
        return "average"
    elif score >= 3.0:
        return "below_average"
    else:
        return "poor"


def _select_template(templates, bracket, score):
    options = templates.get(bracket, templates["medium"])
    index = int(score * 10) % len(options)
    return options[index].format(score=score)


def generate_feedback(innovation_score, feasibility_score,
                      relevance_score, clarity_score,
                      overall_score, cutoff_score=6.0):
    parts = []

    overall_bracket = _get_overall_bracket(overall_score)
    shortlisted = overall_score >= cutoff_score
    shortlist_status = (
        "Congratulations — you've been shortlisted! 🎉"
        if shortlisted
        else "Unfortunately, this submission didn't meet the shortlisting threshold."
    )
    summary = OVERALL_SUMMARY_TEMPLATES[overall_bracket].format(
        score=overall_score,
        shortlist_status=shortlist_status,
    )
    parts.append(summary)

    inn_feedback = _select_template(
        INNOVATION_TEMPLATES, _get_bracket(innovation_score), innovation_score
    )
    parts.append(inn_feedback)

    feas_feedback = _select_template(
        FEASIBILITY_TEMPLATES, _get_bracket(feasibility_score), feasibility_score
    )
    parts.append(feas_feedback)

    rel_feedback = _select_template(
        RELEVANCE_TEMPLATES, _get_bracket(relevance_score), relevance_score
    )
    parts.append(rel_feedback)

    clar_feedback = _select_template(
        CLARITY_TEMPLATES, _get_bracket(clarity_score), clarity_score
    )
    parts.append(clar_feedback)

    if not shortlisted:
        scores = {
            "innovation": innovation_score,
            "feasibility": feasibility_score,
            "relevance": relevance_score,
            "clarity": clarity_score,
        }
        weakest = min(scores, key=scores.get)
        tip = _get_improvement_tip(weakest)
        parts.append(f"💡 Top priority: {tip}")

    feedback = " ".join(parts)
    logger.debug(f"Generated feedback ({len(feedback)} chars) for overall={overall_score}")
    return feedback


def _get_improvement_tip(criterion):
    tips = {
        "innovation": (
            "Research existing solutions in this space and identify what's missing. "
            "Focus on a unique angle, underserved user group, or novel technical approach."
        ),
        "feasibility": (
            "Define your tech stack explicitly (languages, frameworks, databases). "
            "Include a rough architecture diagram and development timeline."
        ),
        "relevance": (
            "Re-read the hackathon theme description carefully. "
            "Reframe your solution to directly address the stated problem domain and evaluation criteria."
        ),
        "clarity": (
            "Restructure your submission into clear sections: "
            "1) Problem Statement, 2) Proposed Solution, 3) Tech Stack, 4) Impact. "
            "Use bullet points for key features."
        ),
    }
    return tips.get(criterion, "Review your submission holistically and address weak areas.")


def generate_short_feedback(overall_score, cutoff_score=6.0):
    if overall_score >= 8.5:
        return f"Excellent submission! Score: {overall_score}/10 ✅"
    elif overall_score >= cutoff_score:
        return f"Shortlisted! Score: {overall_score}/10 ✅"
    elif overall_score >= 4.0:
        return f"Not shortlisted. Score: {overall_score}/10. Review feedback for improvements."
    else:
        return f"Needs significant improvement. Score: {overall_score}/10."
