import psycopg2
import psycopg2.pool
import psycopg2.extras
import logging
from contextlib import contextmanager

from config import DB_CONFIG, DB_POOL_MIN, DB_POOL_MAX

logger = logging.getLogger(__name__)

_pool = None


def _get_pool():
    global _pool
    if _pool is None or _pool.closed:
        try:
            _pool = psycopg2.pool.SimpleConnectionPool(
                minconn=DB_POOL_MIN,
                maxconn=DB_POOL_MAX,
                host=DB_CONFIG["host"],
                port=DB_CONFIG["port"],
                dbname=DB_CONFIG["dbname"],
                user=DB_CONFIG["user"],
                password=DB_CONFIG["password"],
            )
            logger.info("Database connection pool created successfully.")
        except psycopg2.Error as e:
            logger.error(f"Failed to create database connection pool: {e}")
            raise
    return _pool


def get_connection():
    try:
        pool = _get_pool()
        conn = pool.getconn()
        if conn.closed:
            pool.putconn(conn, close=True)
            conn = pool.getconn()
        return conn
    except psycopg2.Error as e:
        logger.error(f"Failed to get database connection: {e}")
        raise


def release_connection(conn):
    try:
        pool = _get_pool()
        pool.putconn(conn)
    except Exception as e:
        logger.error(f"Failed to release connection: {e}")


@contextmanager
def get_db_connection():
    conn = None
    try:
        conn = get_connection()
        yield conn
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        logger.error(f"Database error: {e}")
        raise
    finally:
        if conn:
            release_connection(conn)


def execute_query(query, params=None):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
            cursor.execute(query, params)
            results = cursor.fetchall()
            return [dict(row) for row in results]


def execute_insert(query, params=None):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            conn.commit()
            return cursor.rowcount


def execute_insert_returning(query, params=None):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
            cursor.execute(query, params)
            conn.commit()
            result = cursor.fetchone()
            return dict(result) if result else None


def check_db_connection():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1")
                return True
    except Exception as e:
        logger.warning(f"Database connection check failed: {e}")
        return False


def close_pool():
    global _pool
    if _pool and not _pool.closed:
        _pool.closeall()
        logger.info("Database connection pool closed.")
        _pool = None
