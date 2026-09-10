import os
from datetime import datetime, timedelta, timezone

import bcrypt
from dotenv import load_dotenv
from jose import jwt

load_dotenv()

# ── JWT config ─────────────────────────────────────────────────────────────
_secret = os.getenv("SECRET_KEY")
if not _secret or len(_secret) < 32:
    raise RuntimeError(
        "SECRET_KEY environment variable must be set and at least 32 characters long. "
        "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
    )
SECRET_KEY: str = _secret
ALGORITHM:  str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 jam


def hash_password(plain: str) -> str:
    """Hash plain-text password menggunakan bcrypt."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verifikasi plain-text password terhadap hash yang tersimpan."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Buat JWT access token dengan expiry."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
