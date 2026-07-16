from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, DateTime, Table, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


# Many-to-Many Association Table for Pins and Tags
pin_tags = Table(
    "pin_tags",
    Base.metadata,
    Column("pin_id", Integer, ForeignKey("pins.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    nickname = Column(String, unique=True, index=True, nullable=False)
    provider = Column(String, nullable=True)        # 'google' | 'kakao'
    provider_id = Column(String, nullable=True)     # 소셜 고유 ID
    gender = Column(String, nullable=True)           # 'male' | 'female'
    age_group = Column(String, nullable=True)        # '10대', '20대', '30대' 등
    profile_image = Column(String, nullable=True)    # 기본: 'icon/male.png' 또는 'icon/female.png'
    level = Column(Integer, default=1, nullable=False)
    points = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    pins = relationship("Pin", back_populates="user", cascade="all, delete-orphan")
    verifications = relationship("Verification", back_populates="user", cascade="all, delete-orphan")
    condition_reports = relationship("ConditionReport", back_populates="user", cascade="all, delete-orphan")
    user_badges = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")


class TourSpot(Base):
    __tablename__ = "tour_spots"

    id = Column(Integer, primary_key=True, index=True)  # TourAPI contentid
    title = Column(String, index=True, nullable=False)
    mapx = Column(Float, nullable=False)  # Longitude
    mapy = Column(Float, nullable=False)  # Latitude
    firstimage = Column(String, nullable=True)
    overview = Column(String, nullable=True)
    cat1 = Column(String, nullable=True)
    cat2 = Column(String, nullable=True)
    cat3 = Column(String, nullable=True)
    contenttypeid = Column(Integer, nullable=True)
    intro_info = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


    # Relationships
    pins = relationship("Pin", back_populates="tour_spot", cascade="all, delete-orphan")

    @property
    def pins_count(self) -> int:
        return len(self.pins)



class Pin(Base):
    __tablename__ = "pins"

    id = Column(Integer, primary_key=True, index=True)
    tour_spot_id = Column(Integer, ForeignKey("tour_spots.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    is_blurred = Column(Boolean, default=False, nullable=False)
    reliability_score = Column(Integer, default=0, nullable=False)
    last_status_checked_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="pins")
    tour_spot = relationship("TourSpot", back_populates="pins")
    photos = relationship("PinPhoto", back_populates="pin", cascade="all, delete-orphan")
    verifications = relationship("Verification", back_populates="pin", cascade="all, delete-orphan")
    condition_reports = relationship("ConditionReport", back_populates="pin", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=pin_tags, back_populates="pins")


class PinPhoto(Base):
    __tablename__ = "pin_photos"

    id = Column(Integer, primary_key=True, index=True)
    pin_id = Column(Integer, ForeignKey("pins.id", ondelete="CASCADE"), nullable=False)
    photo_url = Column(String, nullable=False)
    exif_latitude = Column(Float, nullable=True)
    exif_longitude = Column(Float, nullable=True)
    exif_taken_at = Column(DateTime(timezone=True), nullable=True)
    is_validated = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    pin = relationship("Pin", back_populates="photos")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    is_danger = Column(Boolean, default=False, nullable=False)

    # Relationships
    pins = relationship("Pin", secondary=pin_tags, back_populates="tags")


class Verification(Base):
    __tablename__ = "verifications"

    id = Column(Integer, primary_key=True, index=True)
    pin_id = Column(Integer, ForeignKey("pins.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    photo_url = Column(String, nullable=True)
    is_still_there = Column(Boolean, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    pin = relationship("Pin", back_populates="verifications")
    user = relationship("User", back_populates="verifications")


class ConditionReport(Base):
    __tablename__ = "condition_reports"

    id = Column(Integer, primary_key=True, index=True)
    pin_id = Column(Integer, ForeignKey("pins.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status_type = Column(String, nullable=False)  # CROWDED, QUIET, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    pin = relationship("Pin", back_populates="condition_reports")
    user = relationship("User", back_populates="condition_reports")


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=False)
    icon_url = Column(String, nullable=False)

    # Relationships
    user_badges = relationship("UserBadge", back_populates="badge", cascade="all, delete-orphan")


class UserBadge(Base):
    __tablename__ = "user_badges"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    badge_id = Column(Integer, ForeignKey("badges.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="user_badges")
    badge = relationship("Badge", back_populates="user_badges")
