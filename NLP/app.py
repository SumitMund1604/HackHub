import logging

from flask import Flask, jsonify, request

from config import (
	FLASK_DEBUG,
	FLASK_HOST,
	FLASK_PORT,
	MODEL_VERSION,
)
from db import check_db_connection, close_pool
from evaluator import IdeaEvaluator
from recommender import TeammateRecommender

logging.basicConfig(
	level=logging.INFO,
	format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
evaluator = IdeaEvaluator()
recommender = TeammateRecommender()


@app.route("/health", methods=["GET"])
def health_check():
	db_ok = check_db_connection()
	status = "ok" if db_ok else "degraded"
	return jsonify(
		{
			"status": status,
			"model_version": MODEL_VERSION,
			"db_connected": db_ok,
		}
	), 200


@app.route("/model-info", methods=["GET"])
def model_info():
	return jsonify({"model_version": MODEL_VERSION}), 200


@app.route("/evaluate", methods=["POST"])
def evaluate_submission():
	payload = request.get_json(silent=True) or {}
	submission = payload.get("submission") or payload
	if not isinstance(submission, dict):
		return jsonify({"error": "submission must be a JSON object"}), 400

	theme = payload.get("theme")
	hackathon_id = payload.get("hackathon_id")

	try:
		result = evaluator.evaluate(
			submission=submission,
			theme=theme,
			hackathon_id=hackathon_id,
		)
		return jsonify(result), 200
	except Exception as e:
		logger.exception("Evaluation failed: %s", e)
		return jsonify({"error": "Evaluation failed"}), 500


@app.route("/recommend-teammates", methods=["POST"])
def recommend_teammates():
	payload = request.get_json(silent=True) or {}

	user_id = payload.get("user_id")
	if user_id is None:
		return jsonify({"error": "user_id is required"}), 400

	try:
		user_id = int(user_id)
	except (TypeError, ValueError):
		return jsonify({"error": "user_id must be an integer"}), 400

	hackathon_id = payload.get("hackathon_id")
	if hackathon_id is not None:
		try:
			hackathon_id = int(hackathon_id)
		except (TypeError, ValueError):
			return jsonify({"error": "hackathon_id must be an integer"}), 400

	max_recommendations = payload.get("max_recommendations")

	try:
		recommendations = recommender.recommend(
			user_id=user_id,
			hackathon_id=hackathon_id,
			max_recommendations=max_recommendations,
		)
		return jsonify(
			{
				"user_id": user_id,
				"hackathon_id": hackathon_id,
				"recommendations": recommendations,
			}
		), 200
	except Exception as e:
		logger.exception("Teammate recommendation failed: %s", e)
		return jsonify({"error": "Teammate recommendation failed"}), 500


@app.errorhandler(404)
def not_found(_):
	return jsonify({"error": "Not found"}), 404


@app.errorhandler(405)
def method_not_allowed(_):
	return jsonify({"error": "Method not allowed"}), 405


@app.errorhandler(500)
def internal_error(_):
	return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
	try:
		app.run(host=FLASK_HOST, port=FLASK_PORT, debug=FLASK_DEBUG)
	finally:
		close_pool()
