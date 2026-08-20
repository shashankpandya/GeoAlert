import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, Boolean, Numeric, Integer, ARRAY, ForeignKey, UniqueConstraint, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB, TIMESTAMP
from geoalchemy2 import Geometry
from app.database import Base


class Source(Base):
    __tablename__ = "sources"
    __table_args__ = (
        CheckConstraint("classification IN ('official', 'community')", name='sources_classification_check'),
        CheckConstraint("verification_level IN ('verified', 'unverified', 'suspicious')", name='sources_verification_check'),
        CheckConstraint("status IN ('active', 'inactive', 'suspended')", name='sources_status_check'),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    classification: Mapped[str] = mapped_column(String(20), nullable=False)
    verification_level: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default='active')
    https_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    domain_reputation: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    listed_in_registry: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    registry_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(2), nullable=True)
    region: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    coverage: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text), nullable=True)
    last_ingested_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    error_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, nullable=True)

    alerts: Mapped[List["Alert"]] = relationship("Alert", back_populates="source", cascade="all, delete-orphan")
    ingestion_logs: Mapped[List["IngestionLog"]] = relationship("IngestionLog", back_populates="source", cascade="all, delete-orphan")


class Alert(Base):
    __tablename__ = "alerts"
    __table_args__ = (
        UniqueConstraint('source_id', 'external_id', name='uq_alerts_source_external'),
        CheckConstraint("severity IN ('extreme', 'severe', 'moderate', 'minor')", name='alerts_severity_check'),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sources.id", ondelete="CASCADE"), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    event: Mapped[str] = mapped_column(String(255), nullable=False)
    headline: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    instruction: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    geometry: Mapped[object] = mapped_column(Geometry(geometry_type='GEOMETRY', srid=4326), nullable=False)
    effective: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    expires: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    onset: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    raw_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    ingested_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    source: Mapped["Source"] = relationship("Source", back_populates="alerts")
    areas: Mapped[List["AlertArea"]] = relationship("AlertArea", back_populates="alert", cascade="all, delete-orphan", order_by="AlertArea.sort_order")


class AlertArea(Base):
    __tablename__ = "alert_areas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False)
    area_description: Mapped[str] = mapped_column(String(255), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

    alert: Mapped["Alert"] = relationship("Alert", back_populates="areas")


class IngestionLog(Base):
    __tablename__ = "ingestion_logs"
    __table_args__ = (
        CheckConstraint("status IN ('success', 'partial', 'failed')", name='ingestion_logs_status_check'),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sources.id", ondelete="CASCADE"), nullable=False)
    started_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    alerts_ingested: Mapped[int] = mapped_column(Integer, default=0)
    alerts_updated: Mapped[int] = mapped_column(Integer, default=0)
    alerts_skipped: Mapped[int] = mapped_column(Integer, default=0)
    error_count: Mapped[int] = mapped_column(Integer, default=0)
    error_details: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, nullable=True)

    source: Mapped["Source"] = relationship("Source", back_populates="ingestion_logs")
