from __future__ import annotations
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import Source
from app.schemas.sources import (
    ClassifySourceRequest, ClassifySourceResponse, VerificationDetailsResponse,
    SourceResponse, SourcesResponse, SourcesMetadata
)
from app.services.classifier import SourceClassifier

router = APIRouter(prefix="/api/sources", tags=["sources"])
classifier = SourceClassifier()


@router.get("", response_model=SourcesResponse)
async def get_sources(
    classification: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Source)
    if classification: stmt = stmt.where(Source.classification == classification)
    if status: stmt = stmt.where(Source.status == status)
    result = await db.execute(stmt)
    sources = result.scalars().all()
    official = sum(1 for s in sources if s.classification == "official")
    community = sum(1 for s in sources if s.classification == "community")
    return SourcesResponse(
        sources=[SourceResponse.model_validate(s) for s in sources],
        metadata=SourcesMetadata(total=len(sources), official_count=official, community_count=community),
    )


@router.post("/classify", response_model=ClassifySourceResponse)
async def classify_source(
    request: ClassifySourceRequest,
    db: AsyncSession = Depends(get_db),
):
    result = classifier.classify(request.url)
    if result.confidence >= 0.8:
        existing = await db.execute(select(Source).where(Source.url == request.url))
        if existing.scalar_one_or_none() is None:
            new_source = Source(
                name=request.name or request.url,
                url=request.url,
                classification=result.classification,
                verification_level="verified" if result.listed_in_official_registry else "unverified",
                status="active",
                https_verified=result.https_verified,
                domain_reputation=result.domain_reputation,
                listed_in_registry=result.listed_in_official_registry,
                registry_name=result.registry_name,
            )
            db.add(new_source)
            await db.commit()
    return ClassifySourceResponse(
        classification=result.classification,
        confidence=result.confidence,
        verification_details=VerificationDetailsResponse(
            https_verified=result.https_verified,
            domain_reputation=result.domain_reputation,
            listed_in_official_registry=result.listed_in_official_registry,
            registry_name=result.registry_name,
            manual_review_required=result.manual_review_required,
        ),
        reasoning=result.reasoning,
    )
