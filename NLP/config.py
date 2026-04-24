import os

DB_CONFIG = {
    "host": os.getenv("HACKHUB_DB_HOST", "localhost"),
    "port": int(os.getenv("HACKHUB_DB_PORT", 5432)),
    "dbname": os.getenv("HACKHUB_DB_NAME", "hackhub"),
    "user": os.getenv("HACKHUB_DB_USER", "hackhub_admin"),
    "password": os.getenv("HACKHUB_DB_PASSWORD", "secure_password"),
}

DB_POOL_MIN = int(os.getenv("HACKHUB_DB_POOL_MIN", 1))
DB_POOL_MAX = int(os.getenv("HACKHUB_DB_POOL_MAX", 5))

SCORING_WEIGHTS = {
    "innovation": 0.30,
    "feasibility": 0.25,
    "relevance": 0.25,
    "clarity": 0.20,
}

TFIDF_MAX_FEATURES = 5000
TFIDF_STOP_WORDS = "english"

FEASIBILITY_BASE_SCORE = 5.0
FEASIBILITY_RULES = {
    "tech_stack_provided": 2.0,
    "solution_detailed": 1.5,
    "problem_detailed": 1.5,
    "specific_tools_mentioned": 0.5,
    "both_sections_present": 0.5,
}

CLARITY_BONUSES = {
    "has_distinct_sections": 1.0,
    "text_length_over_200": 0.5,
    "uses_structured_format": 0.5,
}

GENERIC_KEYWORD_PENALTY = 1.5
GENERIC_KEYWORDS = [
    "todo app", "to-do app", "todo list",
    "chat app", "chat application",
    "calculator", "calculator app",
    "weather app", "weather application",
    "note taking", "notes app",
    "basic crud", "simple crud",
    "login system", "login page",
    "blog app", "blog application",
    "portfolio website",
]

SPECIFIC_TOOLS_KEYWORDS = [
    "react", "angular", "vue", "next.js", "express",
    "django", "flask", "fastapi", "spring",
    "postgresql", "mongodb", "mysql", "redis",
    "docker", "kubernetes", "aws", "gcp", "azure",
    "tensorflow", "pytorch", "scikit-learn",
    "node.js", "graphql", "rest api",
    "firebase", "supabase",
]

DEFAULT_CUTOFF_SCORE = 6.0
DEFAULT_MAX_SLOTS = 20

PROFICIENCY_WEIGHTS = {
    "beginner": 0.25,
    "intermediate": 0.50,
    "advanced": 0.75,
    "expert": 1.00,
}

RECOMMENDATION_WEIGHTS = {
    "skill_complement": 0.50,
    "diversity_bonus": 0.20,
    "performance_score": 0.30,
}

MAX_RECOMMENDATIONS = 5

DIVERSITY_SCORES = {
    "different_department": 0.5,
    "different_year": 0.3,
}

CORPUS_CACHE_TTL_SECONDS = 300

FLASK_HOST = os.getenv("FLASK_HOST", "0.0.0.0")
FLASK_PORT = int(os.getenv("FLASK_PORT", 5000))
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "true").lower() == "true"

MODEL_VERSION = "hackhub-nlp-v1.0"

DEFAULT_INNOVATION_SCORE = 7.5
DEFAULT_RELEVANCE_SCORE = 7.0
