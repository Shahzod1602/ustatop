"""FastAPI admin backend for UstaTop Telegram bot."""

import logging
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload

from models import (
    AsyncSessionLocal, Master, Category, ServiceRequest, Review,
    RequestStatusEnum, create_tables,
)
from config import settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    logger.info("✅ Database tables ensured")
    yield


app = FastAPI(
    title="UstaTop Admin API",
    description="REST API for UstaTop Telegram bot admin panel",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "UstaTop Admin API"}


# ── Stats ──────────────────────────────────────────────────────────────────

@app.get("/api/stats")
async def get_stats():
    async with AsyncSessionLocal() as session:
        total_masters = (await session.execute(select(func.count(Master.id)))).scalar()
        verified_masters = (await session.execute(select(func.count(Master.id)).where(Master.is_verified == True))).scalar()
        total_requests = (await session.execute(select(func.count(ServiceRequest.id)))).scalar()
        pending_requests = (await session.execute(
            select(func.count(ServiceRequest.id)).where(ServiceRequest.status == RequestStatusEnum.PENDING)
        )).scalar()
        completed_requests = (await session.execute(
            select(func.count(ServiceRequest.id)).where(ServiceRequest.status == RequestStatusEnum.COMPLETED)
        )).scalar()
        total_reviews = (await session.execute(select(func.count(Review.id)))).scalar()

    return {
        "masters": {"total": total_masters, "verified": verified_masters},
        "requests": {"total": total_requests, "pending": pending_requests, "completed": completed_requests},
        "reviews": {"total": total_reviews},
    }


# ── Masters ────────────────────────────────────────────────────────────────

@app.get("/api/masters")
async def list_masters(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    verified: Optional[bool] = None,
):
    offset = (page - 1) * limit
    async with AsyncSessionLocal() as session:
        stmt = select(Master).options(selectinload(Master.categories).selectinload(MasterCategory.category))
        if verified is not None:
            stmt = stmt.where(Master.is_verified == verified)
        stmt = stmt.order_by(Master.created_at.desc()).offset(offset).limit(limit)
        result = await session.execute(stmt)
        masters = result.scalars().all()

        total = (await session.execute(select(func.count(Master.id)))).scalar()

    return {
        "items": [
            {
                "id": m.id,
                "fullName": m.full_name,
                "email": m.email,
                "phone": m.phone,
                "serviceArea": m.service_area,
                "isVerified": m.is_verified,
                "isActive": m.is_active,
                "rating": m.rating,
                "reviewCount": m.review_count,
                "telegramLinked": bool(m.telegram_id),
                "createdAt": m.created_at.isoformat(),
            }
            for m in masters
        ],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }


@app.patch("/api/masters/{master_id}/verify")
async def verify_master(master_id: str, verified: bool = True):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Master).where(Master.id == master_id))
        master = result.scalar_one_or_none()
        if not master:
            raise HTTPException(status_code=404, detail="Master topilmadi")
        master.is_verified = verified
        await session.commit()
    return {"success": True, "masterId": master_id, "isVerified": verified}


@app.patch("/api/masters/{master_id}/block")
async def block_master(master_id: str, active: bool = False):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Master).where(Master.id == master_id))
        master = result.scalar_one_or_none()
        if not master:
            raise HTTPException(status_code=404, detail="Master topilmadi")
        master.is_active = active
        await session.commit()
    return {"success": True, "masterId": master_id, "isActive": active}


# ── Requests ───────────────────────────────────────────────────────────────

@app.get("/api/requests")
async def list_requests(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
):
    offset = (page - 1) * limit
    async with AsyncSessionLocal() as session:
        stmt = select(ServiceRequest).options(selectinload(ServiceRequest.category))
        if status:
            try:
                stmt = stmt.where(ServiceRequest.status == RequestStatusEnum(status))
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Noto'g'ri status: {status}")
        stmt = stmt.order_by(ServiceRequest.created_at.desc()).offset(offset).limit(limit)
        result = await session.execute(stmt)
        requests = result.scalars().all()

        total = (await session.execute(select(func.count(ServiceRequest.id)))).scalar()

    return {
        "items": [
            {
                "id": r.id,
                "customerName": r.customer_name,
                "customerPhone": r.customer_phone,
                "title": r.title,
                "description": r.description,
                "category": r.category.name_uz if r.category else None,
                "urgency": r.urgency,
                "status": r.status,
                "address": r.address,
                "city": r.city,
                "createdAt": r.created_at.isoformat(),
            }
            for r in requests
        ],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }


@app.patch("/api/requests/{request_id}/status")
async def update_request_status(request_id: str, status: str):
    try:
        new_status = RequestStatusEnum(status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Noto'g'ri status: {status}")

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(ServiceRequest).where(ServiceRequest.id == request_id))
        req = result.scalar_one_or_none()
        if not req:
            raise HTTPException(status_code=404, detail="So'rov topilmadi")
        req.status = new_status
        await session.commit()

    return {"success": True, "requestId": request_id, "status": status}


# ── Categories ─────────────────────────────────────────────────────────────

@app.get("/api/categories")
async def list_categories():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Category).order_by(Category.name))
        categories = result.scalars().all()
    return [
        {"id": c.id, "name": c.name, "nameUz": c.name_uz, "icon": c.icon, "slug": c.slug}
        for c in categories
    ]


# ── Reviews ────────────────────────────────────────────────────────────────

@app.get("/api/reviews")
async def list_reviews(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100)):
    offset = (page - 1) * limit
    async with AsyncSessionLocal() as session:
        stmt = (
            select(Review)
            .options(selectinload(Review.master), selectinload(Review.request))
            .order_by(Review.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await session.execute(stmt)
        reviews = result.scalars().all()
        total = (await session.execute(select(func.count(Review.id)))).scalar()

    return {
        "items": [
            {
                "id": r.id,
                "rating": r.rating,
                "comment": r.comment,
                "masterName": r.master.full_name if r.master else None,
                "requestTitle": r.request.title if r.request else None,
                "createdAt": r.created_at.isoformat(),
            }
            for r in reviews
        ],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }


# ── Missing import fix ─────────────────────────────────────────────────────
from models.database import MasterCategory  # noqa: E402

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("admin_api:app", host="0.0.0.0", port=8000, reload=True)
