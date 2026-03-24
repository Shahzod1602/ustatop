"""SQLAlchemy async models for UstaTop Telegram bot."""

from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime,
    ForeignKey, Text, Enum as SAEnum, UniqueConstraint,
)
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, relationship
import enum

from config import settings


# ── Engine & session ────────────────────────────────────────────────────────

engine = create_async_engine(settings.DATABASE_URL, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncSession:  # type: ignore[misc]
    async with AsyncSessionLocal() as session:
        yield session


# ── Enums ───────────────────────────────────────────────────────────────────

class UrgencyEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class RequestStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    MATCHED = "MATCHED"
    ACCEPTED = "ACCEPTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# ── Base ────────────────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


# ── Models ──────────────────────────────────────────────────────────────────

class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    name_uz = Column("nameUz", String, nullable=False)
    icon = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow)

    masters = relationship("MasterCategory", back_populates="category")
    requests = relationship("ServiceRequest", back_populates="category")


class Master(Base):
    __tablename__ = "masters"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    full_name = Column("fullName", String, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    bio = Column(Text, nullable=True)
    profile_photo = Column("profilePhoto", String, nullable=True)
    service_area = Column("serviceArea", String, default="Toshkent")
    is_verified = Column("isVerified", Boolean, default=False)
    is_active = Column("isActive", Boolean, default=True)
    rating = Column(Float, default=0.0)
    review_count = Column("reviewCount", Integer, default=0)
    telegram_id = Column(String, unique=True, nullable=True)  # For Telegram notifications
    created_at = Column("createdAt", DateTime, default=datetime.utcnow)
    updated_at = Column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    categories = relationship("MasterCategory", back_populates="master")
    reviews = relationship("Review", back_populates="master")
    accepted_requests = relationship("ServiceRequest", back_populates="master")


class CustomerProfile(Base):
    __tablename__ = "customer_profiles"

    id = Column(String, primary_key=True)
    telegram_id = Column("telegram_id", String, unique=True, nullable=False)
    full_name = Column("fullName", String, nullable=False)
    phone = Column(String, nullable=True)
    city = Column(String, nullable=True, default="Toshkent")
    is_master = Column("is_master", Boolean, default=False)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow)
    updated_at = Column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MasterCategory(Base):
    __tablename__ = "master_categories"
    __table_args__ = (UniqueConstraint("masterId", "categoryId"),)

    id = Column(String, primary_key=True)
    master_id = Column("masterId", String, ForeignKey("masters.id", ondelete="CASCADE"), nullable=False)
    category_id = Column("categoryId", String, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)

    master = relationship("Master", back_populates="categories")
    category = relationship("Category", back_populates="masters")


class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id = Column(String, primary_key=True)
    customer_name = Column("customerName", String, nullable=False)
    customer_phone = Column("customerPhone", String, nullable=False)
    customer_telegram_id = Column(String, nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category_id = Column("categoryId", String, ForeignKey("categories.id"), nullable=False)
    master_id = Column("masterId", String, ForeignKey("masters.id", ondelete="SET NULL"), nullable=True)
    urgency = Column(SAEnum(UrgencyEnum, name="urgency_enum"), default=UrgencyEnum.MEDIUM)
    status = Column(SAEnum(RequestStatusEnum, name="request_status_enum"), default=RequestStatusEnum.PENDING)
    address = Column(String, nullable=True)
    city = Column(String, default="Toshkent")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow)
    updated_at = Column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="requests")
    master = relationship("Master", back_populates="accepted_requests")
    images = relationship("RequestImage", back_populates="request", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="request", cascade="all, delete-orphan")


class RequestImage(Base):
    __tablename__ = "request_images"

    id = Column(String, primary_key=True)
    request_id = Column("requestId", String, ForeignKey("service_requests.id", ondelete="CASCADE"))
    url = Column(String, nullable=False)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow)

    request = relationship("ServiceRequest", back_populates="images")


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("requestId"),)

    id = Column(String, primary_key=True)
    request_id = Column("requestId", String, ForeignKey("service_requests.id", ondelete="CASCADE"), unique=True)
    master_id = Column("masterId", String, ForeignKey("masters.id", ondelete="CASCADE"))
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow)

    master = relationship("Master", back_populates="reviews")
    request = relationship("ServiceRequest", back_populates="reviews")


async def create_tables():
    """Create all tables (use only in dev/migration contexts)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
