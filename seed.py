from __future__ import annotations

import calendar
from collections import defaultdict
from datetime import date, datetime, time, timedelta
from random import Random

from backend.app.database import Base, SessionLocal, engine
from backend.app.models import Booking, BookingStatus, ChatMessage, ChatRole, ClassType, GymClass, Member, MemberStatus, Payment, PaymentStatus, PlanType, User, UserRole
from backend.app.security import hash_password
from backend.app.utils import combine_date_and_time


rng = Random(42)


MEMBER_FIXTURES = [
    ("member@gymflow.com", "Alex Rivera"),
    ("maya.chen@gymflow-demo.com", "Maya Chen"),
    ("liam.turner@gymflow-demo.com", "Liam Turner"),
    ("sofia.patel@gymflow-demo.com", "Sofia Patel"),
    ("marcus.lee@gymflow-demo.com", "Marcus Lee"),
    ("nina.alvarez@gymflow-demo.com", "Nina Alvarez"),
    ("ethan.brooks@gymflow-demo.com", "Ethan Brooks"),
    ("priya.shah@gymflow-demo.com", "Priya Shah"),
    ("daniel.kim@gymflow-demo.com", "Daniel Kim"),
    ("zoe.mitchell@gymflow-demo.com", "Zoe Mitchell"),
    ("adrian.foster@gymflow-demo.com", "Adrian Foster"),
    ("leila.hassan@gymflow-demo.com", "Leila Hassan"),
    ("jacob.morris@gymflow-demo.com", "Jacob Morris"),
    ("isabella.reed@gymflow-demo.com", "Isabella Reed"),
    ("noah.garcia@gymflow-demo.com", "Noah Garcia"),
    ("meera.nair@gymflow-demo.com", "Meera Nair"),
    ("owen.carter@gymflow-demo.com", "Owen Carter"),
    ("clara.evans@gymflow-demo.com", "Clara Evans"),
    ("kai.robinson@gymflow-demo.com", "Kai Robinson"),
    ("ruby.howard@gymflow-demo.com", "Ruby Howard"),
    ("aarav.singh@gymflow-demo.com", "Aarav Singh"),
    ("ella.peterson@gymflow-demo.com", "Ella Peterson"),
    ("leo.bennett@gymflow-demo.com", "Leo Bennett"),
    ("hana.yamada@gymflow-demo.com", "Hana Yamada"),
    ("miles.cooper@gymflow-demo.com", "Miles Cooper"),
    ("sienna.ward@gymflow-demo.com", "Sienna Ward"),
    ("ryan.long@gymflow-demo.com", "Ryan Long"),
    ("amelia.scott@gymflow-demo.com", "Amelia Scott"),
    ("dev.malhotra@gymflow-demo.com", "Dev Malhotra"),
    ("lucy.green@gymflow-demo.com", "Lucy Green"),
]

CLASS_SCHEDULE = {
    "monday": [
        ("HIIT", "Coach Mike", time(7, 0)),
        ("Yoga", "Sarah", time(10, 0)),
        ("Strength", "Coach Mike", time(18, 0)),
        ("Pilates", "Sarah", time(19, 30)),
    ],
    "tuesday": [
        ("Yoga", "Sarah", time(6, 0)),
        ("HIIT", "James", time(12, 0)),
        ("Strength", "James", time(17, 30)),
        ("Yoga", "Sarah", time(19, 0)),
    ],
    "wednesday": [
        ("HIIT", "Coach Mike", time(7, 0)),
        ("Pilates", "Sarah", time(10, 0)),
        ("Yoga", "Sarah", time(18, 0)),
        ("HIIT", "James", time(19, 30)),
    ],
    "thursday": [
        ("Strength", "James", time(6, 0)),
        ("Yoga", "Sarah", time(12, 0)),
        ("HIIT", "Coach Mike", time(17, 30)),
        ("Pilates", "Sarah", time(19, 0)),
    ],
    "friday": [
        ("Yoga", "Sarah", time(7, 0)),
        ("HIIT", "James", time(10, 0)),
        ("Strength", "Coach Mike", time(18, 0)),
    ],
    "saturday": [
        ("HIIT", "Coach Mike", time(8, 0)),
        ("Yoga", "Sarah", time(10, 0)),
        ("Pilates", "Sarah", time(11, 30)),
    ],
    "sunday": [
        ("Yoga", "Sarah", time(9, 0)),
        ("Strength", "James", time(10, 30)),
    ],
}

CLASS_LABELS = {
    ClassType.hiit: "HIIT Burn",
    ClassType.yoga: "Yoga Flow",
    ClassType.pilates: "Pilates Core",
    ClassType.strength: "Strength Lab",
}
CLASS_DURATIONS = {
    ClassType.hiit: 45,
    ClassType.yoga: 60,
    ClassType.pilates: 60,
    ClassType.strength: 60,
}
PLAN_PRICES = {
    PlanType.basic: 29.0,
    PlanType.premium: 49.0,
    PlanType.vip: 89.0,
}


def shift_months(anchor: date, delta_months: int) -> date:
    month = anchor.month + delta_months
    year = anchor.year + (month - 1) // 12
    month = (month - 1) % 12 + 1
    day = min(anchor.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def month_due_date(reference: date, months_ago: int, due_day: int = 5) -> date:
    month_date = shift_months(reference.replace(day=15), -months_ago)
    last_day = calendar.monthrange(month_date.year, month_date.month)[1]
    return date(month_date.year, month_date.month, min(due_day, last_day))


def create_owner(db: SessionLocal) -> User:
    owner = User(
        email="owner@gymflow.com",
        password_hash=hash_password("demo123"),
        role=UserRole.owner,
        name="Jordan Blake",
        phone="+1 555-0100",
        created_at=datetime.now() - timedelta(days=400),
    )
    db.add(owner)
    db.flush()
    return owner


def create_trainer(db: SessionLocal) -> User:
    trainer = User(
        email="trainer@gymflow.com",
        password_hash=hash_password("demo123"),
        role=UserRole.trainer,
        name="Casey Nolan",
        phone="+1 555-0110",
        created_at=datetime.now() - timedelta(days=300),
    )
    db.add(trainer)
    db.flush()
    return trainer


def build_members(db: SessionLocal) -> list[Member]:
    shared_hash = hash_password("demo123")
    status_plan_pairs: list[tuple[MemberStatus, PlanType]] = []
    status_plan_pairs.extend([(MemberStatus.active, PlanType.basic)] * 7)
    status_plan_pairs.extend([(MemberStatus.active, PlanType.premium)] * 10)
    status_plan_pairs.extend([(MemberStatus.active, PlanType.vip)] * 3)
    status_plan_pairs.extend([(MemberStatus.at_risk, PlanType.basic)] * 3)
    status_plan_pairs.extend([(MemberStatus.at_risk, PlanType.premium)] * 2)
    status_plan_pairs.extend([(MemberStatus.at_risk, PlanType.vip)] * 1)
    status_plan_pairs.extend([(MemberStatus.churned, PlanType.basic)] * 2)
    status_plan_pairs.extend([(MemberStatus.churned, PlanType.premium)] * 1)
    status_plan_pairs.extend([(MemberStatus.churned, PlanType.vip)] * 1)

    members: list[Member] = []
    for index, (email, name) in enumerate(MEMBER_FIXTURES):
        if index == 0:
            status = MemberStatus.active
            plan = PlanType.premium
        else:
            status, plan = status_plan_pairs[index - 1]

        join_date = date.today() - timedelta(days=rng.randint(30, 540))
        created_at = datetime.combine(join_date - timedelta(days=rng.randint(0, 12)), time(rng.randint(6, 20), rng.choice([0, 15, 30, 45])))
        user = User(
            email=email,
            password_hash=shared_hash,
            role=UserRole.member,
            name=name,
            phone=f"+1 555-{1000 + index:04d}",
            created_at=created_at,
        )
        db.add(user)
        db.flush()

        member = Member(
            user_id=user.id,
            plan_type=plan,
            join_date=join_date,
            status=status,
            last_visit=None,
        )
        db.add(member)
        members.append(member)
    db.flush()
    return members


def build_classes(db: SessionLocal) -> list[GymClass]:
    gym_classes: list[GymClass] = []
    for day_of_week, items in CLASS_SCHEDULE.items():
        for raw_type, trainer, start in items:
            class_type = ClassType(raw_type.lower())
            end_time = (datetime.combine(date.today(), start) + timedelta(minutes=CLASS_DURATIONS[class_type])).time()
            class_trainer = trainer
            if trainer == 'Coach Mike':
                class_trainer = 'Casey Nolan'
            gym_class = GymClass(
                name=CLASS_LABELS[class_type],
                trainer=class_trainer,
                start_time=start,
                end_time=end_time,
                capacity=15,
                class_type=class_type,
                day_of_week=day_of_week,
            )
            db.add(gym_class)
            gym_classes.append(gym_class)
    db.flush()
    return gym_classes


def build_payments(db: SessionLocal, members: list[Member]) -> list[Payment]:
    payments: list[Payment] = []
    today = date.today()
    for member in members:
        for months_ago in (2, 1, 0):
            due_date = month_due_date(today, months_ago)
            amount = PLAN_PRICES[member.plan_type]

            if member.status == MemberStatus.active:
                paid_date = due_date + timedelta(days=rng.randint(0, 3))
                status = PaymentStatus.paid
            elif member.status == MemberStatus.at_risk:
                if months_ago in (2, 1):
                    paid_date = due_date + timedelta(days=rng.randint(1, 4))
                    status = PaymentStatus.paid
                else:
                    paid_date = None
                    status = PaymentStatus.overdue if due_date < today else PaymentStatus.due
            else:
                if months_ago == 2:
                    paid_date = due_date + timedelta(days=2)
                    status = PaymentStatus.paid
                else:
                    paid_date = None
                    status = PaymentStatus.overdue if due_date < today else PaymentStatus.due

            payment = Payment(
                member_id=member.id,
                amount=amount,
                due_date=due_date,
                paid_date=paid_date,
                status=status,
                plan_type=member.plan_type,
            )
            db.add(payment)
            payments.append(payment)
    db.flush()
    return payments


def generate_occurrences(gym_classes: list[GymClass], start_date: date, end_date: date) -> list[dict]:
    classes_by_day: dict[str, list[GymClass]] = defaultdict(list)
    for gym_class in gym_classes:
        classes_by_day[gym_class.day_of_week].append(gym_class)

    current = start_date
    occurrences: list[dict] = []
    while current <= end_date:
        weekday = current.strftime("%A").lower()
        for gym_class in classes_by_day.get(weekday, []):
            occurrences.append(
                {
                    "class": gym_class,
                    "date": current,
                    "start_at": combine_date_and_time(current, gym_class.start_time),
                }
            )
        current += timedelta(days=1)
    return occurrences


def choose_status(member_status: MemberStatus, scheduled_for: datetime, force_confirm: bool = False) -> BookingStatus:
    if scheduled_for >= datetime.now() or force_confirm:
        return BookingStatus.confirmed

    roll = rng.random()
    if member_status == MemberStatus.active:
        if roll < 0.85:
            return BookingStatus.confirmed
        if roll < 0.95:
            return BookingStatus.no_show
        return BookingStatus.cancelled
    if member_status == MemberStatus.at_risk:
        if roll < 0.75:
            return BookingStatus.confirmed
        if roll < 0.93:
            return BookingStatus.no_show
        return BookingStatus.cancelled
    if roll < 0.60:
        return BookingStatus.confirmed
    if roll < 0.85:
        return BookingStatus.no_show
    return BookingStatus.cancelled


def candidate_occurrences_for_member(member: Member, occurrences: list[dict], preferred_types: list[ClassType], preferred_days: list[str]) -> list[dict]:
    scored = []
    for item in occurrences:
        score = 1
        if item["class"].class_type in preferred_types:
            score += 3
        if item["class"].day_of_week in preferred_days:
            score += 2
        if item["class"].trainer == "Sarah" and item["class"].class_type in {ClassType.yoga, ClassType.pilates}:
            score += 1
        scored.append((score + rng.random(), item))
    scored.sort(key=lambda entry: entry[0], reverse=True)
    return [item for _, item in scored]


def reserve_recent_occurrence(member: Member, candidates: list[dict]) -> list[dict]:
    today = date.today()
    if member.status == MemberStatus.active:
        window_start, window_end = today - timedelta(days=7), today - timedelta(days=1)
    elif member.status == MemberStatus.at_risk:
        window_start, window_end = today - timedelta(days=30), today - timedelta(days=14)
    else:
        window_start, window_end = today - timedelta(days=90), today - timedelta(days=60)
    return [item for item in candidates if window_start <= item["date"] <= window_end]


def build_bookings(db: SessionLocal, members: list[Member], gym_classes: list[GymClass]) -> list[Booking]:
    today = date.today()
    occurrences = generate_occurrences(gym_classes, today - timedelta(days=90), today + timedelta(days=21))
    target_counts = {
        MemberStatus.active: 32,
        MemberStatus.at_risk: 25,
        MemberStatus.churned: 14,
    }
    churned_bonus = {members[-1].id}
    bookings: list[Booking] = []

    for index, member in enumerate(members):
        preferred_types = rng.sample(list(ClassType), 2)
        preferred_days = rng.sample(list(CLASS_SCHEDULE.keys()), 3)
        if member.user.email == "member@gymflow.com":
            preferred_types = [ClassType.yoga, ClassType.strength]
            preferred_days = ["monday", "thursday", "saturday"]

        filtered_occurrences = occurrences
        if member.status == MemberStatus.at_risk:
            cutoff = today - timedelta(days=rng.randint(15, 24))
            filtered_occurrences = [item for item in occurrences if item["date"] <= cutoff]
        elif member.status == MemberStatus.churned:
            cutoff = today - timedelta(days=rng.randint(60, 72))
            filtered_occurrences = [item for item in occurrences if item["date"] <= cutoff]

        candidates = candidate_occurrences_for_member(member, filtered_occurrences, preferred_types, preferred_days)
        selected: list[dict] = []
        recent_options = reserve_recent_occurrence(member, candidates)
        if recent_options:
            chosen_recent = recent_options[0]
            selected.append(chosen_recent)
            candidates = [item for item in candidates if item["start_at"] != chosen_recent["start_at"]]

        if member.user.email == "member@gymflow.com":
            future_options = [item for item in candidates if item["date"] >= today][:3]
            selected.extend(future_options)
            future_starts = {item["start_at"] for item in future_options}
            candidates = [item for item in candidates if item["start_at"] not in future_starts]

        required = target_counts[member.status] + (1 if member.id in churned_bonus else 0)
        needed = max(required - len(selected), 0)
        selected.extend(candidates[:needed])

        for item in sorted(selected, key=lambda row: row["start_at"]):
            force_confirm = item["start_at"] == selected[0]["start_at"]
            booking = Booking(
                member_id=member.id,
                class_id=item["class"].id,
                booked_at=item["start_at"],
                status=choose_status(member.status, item["start_at"], force_confirm=force_confirm),
                reminder_sent=item["start_at"] < datetime.now(),
            )
            db.add(booking)
            bookings.append(booking)

    db.flush()

    for member in members:
        last_confirmed = db.query(Booking).filter(
            Booking.member_id == member.id,
            Booking.status == BookingStatus.confirmed,
            Booking.booked_at < datetime.now(),
        ).order_by(Booking.booked_at.desc()).first()
        member.last_visit = last_confirmed.booked_at if last_confirmed else None

    db.add(
        ChatMessage(
            member_id=members[0].id,
            role=ChatRole.assistant,
            content="Welcome back, Alex. Your Thursday Strength Lab is looking great this week 💪",
            timestamp=datetime.now() - timedelta(hours=3),
        )
    )
    db.flush()
    return bookings


def main() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        create_owner(db)
        create_trainer(db)
        members = build_members(db)
        gym_classes = build_classes(db)
        build_payments(db, members)
        bookings = build_bookings(db, members, gym_classes)
        db.commit()

        print(f"Actual seed counts -> members: {len(members)}, class templates: {len(gym_classes)}, bookings: {len(bookings)}")
        print("✅ Seeded: 30 members, 119 classes, 847 bookings, 3 months payments")


if __name__ == "__main__":
    main()
