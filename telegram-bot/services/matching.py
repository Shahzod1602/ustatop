"""Matching service: finds masters by category and city."""

import logging
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import Master, MasterCategory, ServiceRequest, RequestStatusEnum

logger = logging.getLogger(__name__)


async def find_matching_masters(
    session: AsyncSession,
    category_id: str,
    city: str,
) -> list[Master]:
    """
    Return active masters who:
    - Serve the given city (case-insensitive substring match)
    - Have the requested category
    Sorted by: verified first, then rating desc.
    """
    stmt = (
        select(Master)
        .join(Master.categories)
        .filter(
            and_(
                Master.is_active == True,
                Master.service_area.ilike(f"%{city}%"),
                MasterCategory.category_id == category_id,
            )
        )
        .options(selectinload(Master.categories))
        .order_by(Master.is_verified.desc(), Master.rating.desc())
    )
    result = await session.execute(stmt)
    return result.scalars().unique().all()


async def match_request(session: AsyncSession, request_id: str) -> list[Master]:
    """
    Given a service request ID, find all matching masters and
    update the request status to MATCHED if any masters found.
    """
    # Load the request
    result = await session.execute(
        select(ServiceRequest).filter(ServiceRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    if not request:
        logger.warning(f"Request {request_id} not found for matching")
        return []

    masters = await find_matching_masters(session, request.category_id, request.city)

    if masters:
        request.status = RequestStatusEnum.MATCHED
        await session.commit()
        logger.info(f"Request {request_id} matched with {len(masters)} masters")
    else:
        logger.info(f"No masters found for request {request_id}")

    return masters
