import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api import auth, logs, threats, incidents, reports, ai, dashboard, notifications
from app.models.models import MitreMapping, User
from app.utils.mitre import MITRE_TECHNIQUES
from app.core.security import get_password_hash

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="DefenderAI API – Cybersecurity Security Operations Center (SOC) platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, define actual domain roots
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(logs.router)
app.include_router(threats.router)
app.include_router(incidents.router)
app.include_router(reports.router)
app.include_router(ai.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)

@app.on_event("startup")
def startup_db_setup():
    # 1. Create database schemas if SQLite/not present
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 2. Seed MITRE ATT&CK techniques
        mitre_count = db.query(MitreMapping).count()
        if mitre_count == 0:
            for tech in MITRE_TECHNIQUES:
                db_tech = MitreMapping(
                    technique_id=tech["technique_id"],
                    tactic=tech["tactic"],
                    description=tech["description"]
                )
                db.add(db_tech)
            db.commit()
            print("Successfully seeded MITRE ATT&CK techniques mapping matrix.")
            
        # 3. Seed default Admin user
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            db_admin = User(
                username="admin",
                email="admin@defenderai.com",
                password_hash=get_password_hash("admin123"),
                role="admin"
            )
            db.add(db_admin)
            db.commit()
            print("Default admin user created: admin / admin123")
            
        # 4. Seed default Analyst user
        analyst_user = db.query(User).filter(User.username == "analyst").first()
        if not analyst_user:
            db_analyst = User(
                username="analyst",
                email="analyst@defenderai.com",
                password_hash=get_password_hash("analyst123"),
                role="analyst"
            )
            db.add(db_analyst)
            db.commit()
            print("Default analyst user created: analyst / analyst123")
            
    except Exception as e:
        print(f"Error during startup DB setup: {e}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API. Access documentation at /docs"}
