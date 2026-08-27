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

    database_url = get_settings().database_url
    assert database_url == "postgresql+psycopg://user:pass@host/db?sslmode=require&channel_binding=require"
    get_settings.cache_clear()


def test_managed_project_storage_configuration_is_available() -> None:
    get_settings.cache_clear()
    settings = get_settings()

    assert settings.storage_backend == "managed"
    assert settings.managed_storage_api_url
    assert settings.managed_storage_api_key is not None


def test_comma_separated_live_origin_is_parsed_without_json(monkeypatch) -> None:
    monkeypatch.setenv("FRONTEND_ORIGINS", "https://securedocs-nl6ubzst.manus.space")
    monkeypatch.setenv("TRUSTED_HOSTS", "securedocs-nl6ubzst.manus.space,localhost,127.0.0.1")
    get_settings.cache_clear()

    settings = get_settings()

    assert settings.frontend_origins == ["https://securedocs-nl6ubzst.manus.space"]
    assert settings.trusted_hosts == ["securedocs-nl6ubzst.manus.space", "localhost", "127.0.0.1"]
    get_settings.cache_clear()
