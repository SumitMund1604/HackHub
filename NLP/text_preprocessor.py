import re
import string
import logging
import nltk

logger = logging.getLogger(__name__)

_NLTK_DATA_DOWNLOADED = False


def _ensure_nltk_data():
    global _NLTK_DATA_DOWNLOADED
    if _NLTK_DATA_DOWNLOADED:
        return

    resources = [
        ("tokenizers/punkt_tab", "punkt_tab"),
        ("corpora/stopwords", "stopwords"),
        ("corpora/wordnet", "wordnet"),
    ]

    for path, name in resources:
        try:
            nltk.data.find(path)
        except LookupError:
            logger.info(f"Downloading NLTK resource: {name}")
            nltk.download(name, quiet=True)

    _NLTK_DATA_DOWNLOADED = True


def preprocess(text):
    if not text or not isinstance(text, str):
        return ""

    _ensure_nltk_data()

    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    from nltk.tokenize import word_tokenize

    text = text.lower()
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    text = re.sub(r'<[^>]+>', '', text)
    text = text.translate(str.maketrans('', '', string.punctuation))
    text = re.sub(r'\s+', ' ', text).strip()

    if not text:
        return ""

    tokens = word_tokenize(text)

    stop_words = set(stopwords.words('english'))
    tokens = [token for token in tokens if token not in stop_words]

    tokens = [token for token in tokens if len(token) > 1]

    lemmatizer = WordNetLemmatizer()
    tokens = [lemmatizer.lemmatize(token) for token in tokens]

    return ' '.join(tokens)


def extract_text_features(text):
    if not text or not isinstance(text, str):
        return {
            "char_count": 0,
            "word_count": 0,
            "sentence_count": 0,
            "has_bullet_points": False,
            "has_numbered_lists": False,
            "paragraph_count": 0,
        }

    words = text.split()
    word_count = len(words)
    char_count = len(text)

    sentences = re.split(r'[.!?]+', text)
    sentence_count = len([s for s in sentences if s.strip()])

    has_bullet_points = bool(re.search(r'[-•*]\s', text))
    has_numbered_lists = bool(re.search(r'\d+[.)]\s', text))

    paragraphs = text.split('\n\n')
    paragraph_count = len([p for p in paragraphs if p.strip()])

    return {
        "char_count": char_count,
        "word_count": word_count,
        "sentence_count": sentence_count,
        "has_bullet_points": has_bullet_points,
        "has_numbered_lists": has_numbered_lists,
        "paragraph_count": paragraph_count,
    }


def combine_submission_text(submission):
    fields = ['title', 'description', 'problem', 'solution']
    parts = []
    for field in fields:
        value = submission.get(field, '')
        if value and isinstance(value, str):
            parts.append(value.strip())
    return ' '.join(parts)
