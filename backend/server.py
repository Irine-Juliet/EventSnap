from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
import json
import re
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Models
class EventData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str = ""
    date: str = ""
    time: str = ""
    end_time: str = ""
    location: str = ""
    description: str = ""

class ExtractedEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event: EventData
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ICSRequest(BaseModel):
    title: str
    date: str
    time: str
    end_time: Optional[str] = ""
    location: Optional[str] = ""
    description: Optional[str] = ""

# Helper function to generate ICS content
def generate_ics(event: ICSRequest) -> str:
    """Generate ICS file content from event data"""
    # Parse date and time
    try:
        # Try various date formats
        date_str = event.date.strip()
        time_str = event.time.strip() if event.time else "12:00"
        end_time_str = event.end_time.strip() if event.end_time else ""
        
        # Parse date
        date_obj = None
        for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%B %d, %Y", "%b %d, %Y", "%m-%d-%Y"]:
            try:
                date_obj = datetime.strptime(date_str, fmt)
                break
            except ValueError:
                continue
        
        if not date_obj:
            # Default to today if parsing fails
            date_obj = datetime.now()
        
        # Parse start time
        start_time = None
        for fmt in ["%H:%M", "%I:%M %p", "%I:%M%p", "%H:%M:%S"]:
            try:
                start_time = datetime.strptime(time_str, fmt)
                break
            except ValueError:
                continue
        
        if not start_time:
            start_time = datetime.strptime("12:00", "%H:%M")
        
        # Combine date and time
        start_datetime = date_obj.replace(hour=start_time.hour, minute=start_time.minute)
        
        # Parse end time or default to 1 hour later
        if end_time_str:
            end_time = None
            for fmt in ["%H:%M", "%I:%M %p", "%I:%M%p", "%H:%M:%S"]:
                try:
                    end_time = datetime.strptime(end_time_str, fmt)
                    break
                except ValueError:
                    continue
            if end_time:
                end_datetime = date_obj.replace(hour=end_time.hour, minute=end_time.minute)
            else:
                end_datetime = start_datetime.replace(hour=start_datetime.hour + 1)
        else:
            end_datetime = start_datetime.replace(hour=start_datetime.hour + 1)
        
        # Format for ICS
        dtstart = start_datetime.strftime("%Y%m%dT%H%M%S")
        dtend = end_datetime.strftime("%Y%m%dT%H%M%S")
        dtstamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        uid = str(uuid.uuid4())
        
        # Escape special characters
        title = event.title.replace(",", "\\,").replace(";", "\\;")
        location = (event.location or "").replace(",", "\\,").replace(";", "\\;")
        description = (event.description or "").replace(",", "\\,").replace(";", "\\;").replace("\n", "\\n")
        
        ics_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EventSnap//Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:{uid}
DTSTAMP:{dtstamp}
DTSTART:{dtstart}
DTEND:{dtend}
SUMMARY:{title}
LOCATION:{location}
DESCRIPTION:{description}
END:VEVENT
END:VCALENDAR"""
        
        return ics_content
    except Exception as e:
        logger.error(f"Error generating ICS: {e}")
        raise HTTPException(status_code=400, detail=f"Error generating calendar file: {str(e)}")


@api_router.get("/")
async def root():
    return {"message": "EventSnap API is running"}


@api_router.post("/extract-event", response_model=ExtractedEvent)
async def extract_event(file: UploadFile = File(...)):
    """Extract event details from an uploaded image using GPT-5.2 vision"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and encode image
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode('utf-8')
        
        # Get API key
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        
        # Create chat instance
        chat = LlmChat(
            api_key=api_key,
            session_id=str(uuid.uuid4()),
            system_message="""You are an expert at extracting event information from flyers, posters, and images. 
Extract the following details and respond ONLY with a valid JSON object:
{
  "title": "Event name/title",
  "date": "Date in YYYY-MM-DD format if possible, otherwise as shown",
  "time": "Start time in HH:MM format (24h) if possible, otherwise as shown",
  "end_time": "End time in HH:MM format if mentioned, empty string if not",
  "location": "Venue/location/address",
  "description": "Brief description or additional details"
}

Rules:
- If a field is not visible or unclear, use an empty string ""
- Try to standardize date to YYYY-MM-DD format when possible
- Try to standardize time to HH:MM 24-hour format when possible
- For description, include any notable details like dress code, RSVP info, contact, etc.
- Respond ONLY with the JSON object, no additional text"""
        ).with_model("openai", "gpt-5.2")
        
        # Create message with image
        image_content = ImageContent(image_base64=base64_image)
        user_message = UserMessage(
            text="Please extract all event details from this flyer/poster image.",
            file_contents=[image_content]
        )
        
        # Send to LLM
        response = await chat.send_message(user_message)
        logger.info(f"LLM Response: {response}")
        
        # Parse response
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                event_data = json.loads(json_match.group())
            else:
                event_data = json.loads(response)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}, Response: {response}")
            # Return empty event if parsing fails
            event_data = {
                "title": "",
                "date": "",
                "time": "",
                "end_time": "",
                "location": "",
                "description": response[:500] if response else ""
            }
        
        # Create event object
        event = EventData(
            title=event_data.get("title", ""),
            date=event_data.get("date", ""),
            time=event_data.get("time", ""),
            end_time=event_data.get("end_time", ""),
            location=event_data.get("location", ""),
            description=event_data.get("description", "")
        )
        
        extracted_event = ExtractedEvent(event=event)
        
        # Save to database
        doc = extracted_event.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.extracted_events.insert_one(doc)
        
        return extracted_event
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting event: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/generate-ics")
async def generate_ics_file(event: ICSRequest):
    """Generate an ICS file from event data"""
    try:
        ics_content = generate_ics(event)
        
        # Create filename from event title
        safe_title = re.sub(r'[^\w\s-]', '', event.title)[:30] or "event"
        filename = f"{safe_title.strip().replace(' ', '_')}.ics"
        
        return Response(
            content=ics_content,
            media_type="text/calendar",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating ICS: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
