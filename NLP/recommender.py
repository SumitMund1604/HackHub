import logging
from typing import Dict, List, Optional, Set

from config import (
	DIVERSITY_SCORES,
	MAX_RECOMMENDATIONS,
	PROFICIENCY_WEIGHTS,
	RECOMMENDATION_WEIGHTS,
)
from db import execute_query

logger = logging.getLogger(__name__)


class TeammateRecommender:

	def recommend(
		self,
		user_id: int,
		hackathon_id: Optional[int] = None,
		max_recommendations: Optional[int] = None,
	) -> List[Dict]:
		target_user = self._get_user_profile(user_id)
		if not target_user:
			logger.warning("Recommendation failed: user %s not found.", user_id)
			return []

		target_skills = self._get_skills_by_user_ids([user_id]).get(user_id, {})
		candidates = self._get_candidates(user_id, hackathon_id)
		if not candidates:
			logger.info("No candidate teammates found for user %s.", user_id)
			return []

		candidate_ids = [candidate["user_id"] for candidate in candidates]
		candidate_skills = self._get_skills_by_user_ids(candidate_ids)

		max_points = max([c.get("points") or 0 for c in candidates], default=0)
		ranked: List[Dict] = []

		for candidate in candidates:
			cid = candidate["user_id"]
			cskills = candidate_skills.get(cid, {})

			skill_complement = self._score_skill_complement(target_skills, cskills)
			diversity_bonus = self._score_diversity(target_user, candidate)
			performance_score = self._score_performance(candidate.get("points"), max_points)

			weighted_score = (
				skill_complement * RECOMMENDATION_WEIGHTS["skill_complement"]
				+ diversity_bonus * RECOMMENDATION_WEIGHTS["diversity_bonus"]
				+ performance_score * RECOMMENDATION_WEIGHTS["performance_score"]
			)

			target_skill_names = set(target_skills.keys())
			candidate_skill_names = set(cskills.keys())
			ranked.append(
				{
					"user_id": cid,
					"full_name": candidate.get("full_name"),
					"department": candidate.get("department"),
					"year_of_study": candidate.get("year_of_study"),
					"points": candidate.get("points") or 0,
					"score": round(weighted_score * 10, 2),
					"reasoning": {
						"skill_complement": round(skill_complement, 3),
						"diversity_bonus": round(diversity_bonus, 3),
						"performance_score": round(performance_score, 3),
					},
					"shared_skills": sorted(list(target_skill_names & candidate_skill_names)),
					"complementary_skills": sorted(list(candidate_skill_names - target_skill_names)),
				}
			)

		ranked.sort(key=lambda item: item["score"], reverse=True)

		effective_max = self._normalize_recommendation_limit(max_recommendations)
		result = ranked[:effective_max]
		logger.info("Generated %s recommendations for user %s.", len(result), user_id)
		return result

	def _normalize_recommendation_limit(self, requested: Optional[int]) -> int:
		if requested is None:
			return MAX_RECOMMENDATIONS
		try:
			requested_int = int(requested)
		except (TypeError, ValueError):
			return MAX_RECOMMENDATIONS
		return max(1, min(requested_int, MAX_RECOMMENDATIONS))

	def _get_user_profile(self, user_id: int) -> Optional[Dict]:
		query = """
			SELECT user_id, full_name, department, year_of_study, points
			FROM users
			WHERE user_id = %s AND is_active = TRUE
			LIMIT 1
		"""
		rows = execute_query(query, (user_id,))
		return rows[0] if rows else None

	def _get_candidates(self, user_id: int, hackathon_id: Optional[int]) -> List[Dict]:
		if hackathon_id:
			query = """
				SELECT DISTINCT u.user_id, u.full_name, u.department, u.year_of_study, u.points
				FROM users u
				JOIN team_members tm ON tm.user_id = u.user_id
				JOIN teams t ON t.team_id = tm.team_id
				WHERE t.hackathon_id = %s
				  AND u.user_id != %s
				  AND u.is_active = TRUE
			"""
			rows = execute_query(query, (hackathon_id, user_id))
			if rows:
				return rows

		fallback_query = """
			SELECT user_id, full_name, department, year_of_study, points
			FROM users
			WHERE user_id != %s
			  AND is_active = TRUE
			ORDER BY points DESC NULLS LAST
			LIMIT 100
		"""
		return execute_query(fallback_query, (user_id,))

	def _get_skills_by_user_ids(self, user_ids: List[int]) -> Dict[int, Dict[str, float]]:
		if not user_ids:
			return {}

		query = """
			SELECT us.user_id, s.skill_name, us.proficiency
			FROM user_skills us
			JOIN skills s ON s.skill_id = us.skill_id
			WHERE us.user_id = ANY(%s)
		"""
		rows = execute_query(query, (user_ids,))

		skills_by_user: Dict[int, Dict[str, float]] = {uid: {} for uid in user_ids}
		for row in rows:
			uid = row["user_id"]
			skill_name = self._normalize_skill_name(row.get("skill_name"))
			proficiency = self._normalize_proficiency(row.get("proficiency"))
			if skill_name:
				skills_by_user.setdefault(uid, {})[skill_name] = PROFICIENCY_WEIGHTS[proficiency]

		return skills_by_user

	def _score_skill_complement(
		self,
		target_skills: Dict[str, float],
		candidate_skills: Dict[str, float],
	) -> float:
		target_set = set(target_skills.keys())
		candidate_set = set(candidate_skills.keys())

		if not candidate_set:
			return 0.0

		missing_from_target: Set[str] = candidate_set - target_set
		if missing_from_target:
			coverage = sum(candidate_skills[s] for s in missing_from_target)
			return min(1.0, coverage / max(1, len(missing_from_target)))

		shared = target_set & candidate_set
		if not shared:
			return 0.0

		overlap_strength = sum(candidate_skills[s] for s in shared) / len(shared)
		return min(1.0, overlap_strength * 0.6)

	def _score_diversity(self, target_user: Dict, candidate: Dict) -> float:
		raw = 0.0

		if (
			target_user.get("department")
			and candidate.get("department")
			and target_user.get("department") != candidate.get("department")
		):
			raw += DIVERSITY_SCORES.get("different_department", 0.0)

		if (
			target_user.get("year_of_study") is not None
			and candidate.get("year_of_study") is not None
			and target_user.get("year_of_study") != candidate.get("year_of_study")
		):
			raw += DIVERSITY_SCORES.get("different_year", 0.0)

		max_diversity = sum(DIVERSITY_SCORES.values()) or 1.0
		return min(1.0, raw / max_diversity)

	def _score_performance(self, points: Optional[int], max_points: int) -> float:
		if max_points <= 0:
			return 0.0
		safe_points = max(0, points or 0)
		return min(1.0, safe_points / max_points)

	def _normalize_skill_name(self, skill_name: Optional[str]) -> str:
		if not skill_name:
			return ""
		return str(skill_name).strip().lower()

	def _normalize_proficiency(self, proficiency: Optional[str]) -> str:
		if not proficiency:
			return "intermediate"
		norm = str(proficiency).strip().lower()
		if norm not in PROFICIENCY_WEIGHTS:
			return "intermediate"
		return norm
