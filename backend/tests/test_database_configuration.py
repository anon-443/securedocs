from app.core.config import get_settings


def test_secure_database_url_is_selected_instead_of_localhost() -> None:
    get_settings.cache_clear()
    database_url = get_settings().database_url

    assert database_url.startswith("postgresql")
    assert "localhost" not in database_url
    assert "@" in database_url


def test_database_url_normalizes_escaped_query_separators(monkeypatch) -> None:
    monkeypatch.setenv("SECUREDOCS_DATABASE_URL", "postgresql://user:pass@host/db?sslmode=require\\u0026channel_binding=require")
    get_settings.cache_clear()

    assert get_settings().database_url.endswith("sslmode=require&channel_binding=require")
