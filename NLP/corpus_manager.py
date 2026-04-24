import json
import os
import time
import threading
import logging

from text_preprocessor import combine_submission_text, preprocess
from config import CORPUS_CACHE_TTL_SECONDS

logger = logging.getLogger(__name__)

_cache = {}
_cache_lock = threading.Lock()

SEED_CORPUS_PATH = os.path.join(os.path.dirname(__file__), "seed_corpus.json")


def _is_cache_valid(hackathon_id):
    if hackathon_id not in _cache:
        return False
    entry = _cache[hackathon_id]
    return (time.time() - entry["timestamp"]) < CORPUS_CACHE_TTL_SECONDS


def load_seed_corpus(theme=None):
    try:
        with open(SEED_CORPUS_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)

        submissions = data.get("past_submissions", [])

        if theme:
            theme_lower = theme.lower()
            submissions = [
                s for s in submissions
                if theme_lower in s.get("theme", "").lower()
                or theme_lower in s.get("description", "").lower()
            ]

        corpus = []
        for sub in submissions:
            combined = combine_submission_text(sub)
            processed = preprocess(combined)
            if processed:
                corpus.append(processed)

        logger.info(f"Loaded {len(corpus)} submissions from seed corpus"
                    f"{f' (theme: {theme})' if theme else ''}.")
        return corpus

    except FileNotFoundError:
        logger.warning(f"Seed corpus file not found: {SEED_CORPUS_PATH}")
        return []
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in seed corpus file: {e}")
        return []


def load_corpus_from_db(hackathon_id, exclude_submission_id=None):
    try:
        from db import execute_query

        query = """
            SELECT title, idea_description, proposed_solution, problem_statement, tech_stack
            FROM submissions
            WHERE hackathon_id = %s
        """
        params = [hackathon_id]

        if exclude_submission_id:
            query += " AND submission_id != %s"
            params.append(exclude_submission_id)

        rows = execute_query(query, tuple(params))

        corpus = []
        for row in rows:
            submission = {
                "title": row.get("title", ""),
                "description": row.get("idea_description", ""),
                "problem": row.get("problem_statement", ""),
                "solution": row.get("proposed_solution", ""),
            }
            combined = combine_submission_text(submission)
            processed = preprocess(combined)
            if processed:
                corpus.append(processed)

        logger.info(f"Loaded {len(corpus)} submissions from DB for hackathon {hackathon_id}.")
        return corpus

    except Exception as e:
        logger.warning(f"Failed to load corpus from DB: {e}. Falling back to seed corpus.")
        return []


def get_corpus(hackathon_id=None, exclude_submission_id=None, theme=None):
    cache_key = hackathon_id or "seed"

    with _cache_lock:
        if _is_cache_valid(cache_key):
            logger.debug(f"Returning cached corpus for key: {cache_key}")
            cached_corpus = _cache[cache_key]["data"]
            return cached_corpus

    corpus = []
    if hackathon_id:
        corpus = load_corpus_from_db(hackathon_id, exclude_submission_id)

    if not corpus:
        corpus = load_seed_corpus(theme)

    with _cache_lock:
        _cache[cache_key] = {
            "data": corpus,
            "timestamp": time.time(),
        }

    return corpus


def clear_cache(hackathon_id=None):
    with _cache_lock:
        if hackathon_id:
            _cache.pop(hackathon_id, None)
            logger.info(f"Cleared corpus cache for hackathon {hackathon_id}.")
        else:
            _cache.clear()
            logger.info("Cleared all corpus caches.")


def get_corpus_size(hackathon_id=None):
    cache_key = hackathon_id or "seed"
    with _cache_lock:
        if cache_key in _cache:
            return len(_cache[cache_key]["data"])
    return 0
