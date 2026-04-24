import logging
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import textstat

from config import (
    TFIDF_MAX_FEATURES,
    TFIDF_STOP_WORDS,
    SCORING_WEIGHTS,
    FEASIBILITY_BASE_SCORE,
    FEASIBILITY_RULES,
    CLARITY_BONUSES,
    GENERIC_KEYWORD_PENALTY,
    GENERIC_KEYWORDS,
    SPECIFIC_TOOLS_KEYWORDS,
    DEFAULT_INNOVATION_SCORE,
    DEFAULT_RELEVANCE_SCORE,
    MODEL_VERSION,
)
from text_preprocessor import preprocess, extract_text_features, combine_submission_text
from corpus_manager import get_corpus
from feedback_generator import generate_feedback

logger = logging.getLogger(__name__)


class IdeaEvaluator:

    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            stop_words=TFIDF_STOP_WORDS,
            max_features=TFIDF_MAX_FEATURES,
        )
        logger.info("IdeaEvaluator initialized.")

    def evaluate(self, submission, theme=None, hackathon_id=None):
        logger.info(f"Evaluating submission: '{submission.get('title', 'Untitled')}'")

        combined_text = combine_submission_text(submission)
        processed_text = preprocess(combined_text)

        if not processed_text:
            logger.warning("Empty text after preprocessing. Returning minimum scores.")
            return self._empty_evaluation(submission)

        past_ideas = get_corpus(
            hackathon_id=hackathon_id,
            exclude_submission_id=submission.get("submission_id"),
            theme=theme,
        )

        innovation = self._score_innovation(processed_text, past_ideas)
        feasibility = self._score_feasibility(submission)
        relevance = self._score_relevance(processed_text, theme)
        clarity = self._score_clarity(combined_text, submission)

        weights = SCORING_WEIGHTS
        overall = (
            innovation * weights["innovation"]
            + feasibility * weights["feasibility"]
            + relevance * weights["relevance"]
            + clarity * weights["clarity"]
        )

        innovation = round(innovation, 2)
        feasibility = round(feasibility, 2)
        relevance = round(relevance, 2)
        clarity = round(clarity, 2)
        overall = round(overall, 2)

        feedback = generate_feedback(
            innovation, feasibility, relevance, clarity, overall
        )

        result = {
            "submission_id": submission.get("submission_id"),
            "innovation_score": innovation,
            "feasibility_score": feasibility,
            "relevance_score": relevance,
            "clarity_score": clarity,
            "overall_score": overall,
            "feedback": feedback,
            "model_version": MODEL_VERSION,
        }

        logger.info(
            f"Evaluation complete: overall={overall}, "
            f"inn={innovation}, feas={feasibility}, "
            f"rel={relevance}, clar={clarity}"
        )
        return result

    def _score_innovation(self, text, past_ideas):
        if not past_ideas:
            logger.debug("No past ideas available. Using default innovation score.")
            score = DEFAULT_INNOVATION_SCORE
        else:
            try:
                corpus = past_ideas + [text]
                tfidf_matrix = self.vectorizer.fit_transform(corpus)
                current_vector = tfidf_matrix[-1:]
                past_vectors = tfidf_matrix[:-1]
                similarities = cosine_similarity(current_vector, past_vectors)[0]
                max_similarity = float(np.max(similarities))
                score = (1 - max_similarity) * 10

                logger.debug(
                    f"Innovation: max_sim={max_similarity:.3f}, "
                    f"raw_score={score:.2f}"
                )
            except Exception as e:
                logger.error(f"TF-IDF innovation scoring failed: {e}")
                score = DEFAULT_INNOVATION_SCORE

        text_lower = text.lower()
        for keyword in GENERIC_KEYWORDS:
            if keyword in text_lower:
                penalty = GENERIC_KEYWORD_PENALTY
                score -= penalty
                logger.debug(f"Generic keyword penalty: '{keyword}' (-{penalty})")
                break

        return max(0.0, min(10.0, score))

    def _score_feasibility(self, submission):
        score = FEASIBILITY_BASE_SCORE
        reasons = []

        tech_stack = submission.get("tech_stack", "")
        if tech_stack and len(tech_stack.strip()) > 0:
            score += FEASIBILITY_RULES["tech_stack_provided"]
            reasons.append("tech_stack present")

        solution = submission.get("solution", "")
        if solution and len(solution) > 100:
            score += FEASIBILITY_RULES["solution_detailed"]
            reasons.append("detailed solution")

        problem = submission.get("problem", "")
        if problem and len(problem) > 50:
            score += FEASIBILITY_RULES["problem_detailed"]
            reasons.append("detailed problem")

        all_text = f"{tech_stack} {solution}".lower()
        if any(tool in all_text for tool in SPECIFIC_TOOLS_KEYWORDS):
            score += FEASIBILITY_RULES["specific_tools_mentioned"]
            reasons.append("specific tools mentioned")

        if (problem and len(problem.strip()) > 0 and
            solution and len(solution.strip()) > 0):
            score += FEASIBILITY_RULES["both_sections_present"]
            reasons.append("both sections present")

        score = max(0.0, min(10.0, score))
        logger.debug(f"Feasibility: score={score:.2f}, reasons={reasons}")
        return score

    def _score_relevance(self, text, theme):
        if not theme or not theme.strip():
            logger.debug("No theme provided. Using default relevance score.")
            return DEFAULT_RELEVANCE_SCORE

        try:
            processed_theme = preprocess(theme)
            if not processed_theme:
                return DEFAULT_RELEVANCE_SCORE

            corpus = [processed_theme, text]
            tfidf_matrix = TfidfVectorizer(
                stop_words=TFIDF_STOP_WORDS,
                max_features=TFIDF_MAX_FEATURES,
            ).fit_transform(corpus)

            sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            score = min(10.0, float(sim) * 12)

            logger.debug(f"Relevance: sim={sim:.3f}, score={score:.2f}")
            return max(0.0, score)

        except Exception as e:
            logger.error(f"Relevance scoring failed: {e}")
            return DEFAULT_RELEVANCE_SCORE

    def _score_clarity(self, raw_text, submission):
        if not raw_text or len(raw_text.strip()) < 10:
            return 1.0

        try:
            reading_ease = textstat.flesch_reading_ease(raw_text)
            base_score = max(0.0, min(10.0, reading_ease / 10))

            bonuses = 0.0

            has_problem = bool(submission.get("problem", "").strip())
            has_solution = bool(submission.get("solution", "").strip())
            if has_problem and has_solution:
                bonuses += CLARITY_BONUSES["has_distinct_sections"]

            features = extract_text_features(raw_text)
            if features["char_count"] > 200:
                bonuses += CLARITY_BONUSES["text_length_over_200"]

            if features["has_bullet_points"] or features["has_numbered_lists"]:
                bonuses += CLARITY_BONUSES["uses_structured_format"]

            score = min(10.0, base_score + bonuses)
            logger.debug(
                f"Clarity: reading_ease={reading_ease:.1f}, "
                f"base={base_score:.2f}, bonuses={bonuses:.1f}, "
                f"final={score:.2f}"
            )
            return max(0.0, score)

        except Exception as e:
            logger.error(f"Clarity scoring failed: {e}")
            return 5.0

    def _empty_evaluation(self, submission):
        feedback = (
            "Your submission appears to be empty or too short to evaluate. "
            "Please provide a detailed title, description, problem statement, "
            "and proposed solution."
        )
        return {
            "submission_id": submission.get("submission_id"),
            "innovation_score": 1.0,
            "feasibility_score": 1.0,
            "relevance_score": 1.0,
            "clarity_score": 1.0,
            "overall_score": 1.0,
            "feedback": feedback,
            "model_version": MODEL_VERSION,
        }
