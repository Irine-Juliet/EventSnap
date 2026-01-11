import requests
import sys
import base64
import json
from datetime import datetime
from io import BytesIO
from PIL import Image

class EventSnapAPITester:
    def __init__(self, base_url="https://calendarsnap.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, response_type='json'):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=headers)
                else:
                    headers['Content-Type'] = 'application/json'
                    response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                if response_type == 'json':
                    try:
                        return success, response.json()
                    except:
                        return success, response.text
                else:
                    return success, response.content
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:500]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def create_test_image(self):
        """Create a test event flyer image with text"""
        # Create a simple event flyer image
        img = Image.new('RGB', (400, 600), color='white')
        
        # Convert to bytes
        img_bytes = BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        return img_bytes.getvalue()

    def create_test_image_with_event_text(self):
        """Create a more realistic test image with event details"""
        try:
            from PIL import ImageDraw, ImageFont
            
            # Create image
            img = Image.new('RGB', (400, 600), color='#1a1a2e')
            draw = ImageDraw.Draw(img)
            
            # Try to use default font
            try:
                font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
                font_medium = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
                font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
            except:
                font_large = ImageFont.load_default()
                font_medium = ImageFont.load_default()
                font_small = ImageFont.load_default()
            
            # Add event text
            draw.text((50, 50), "TECH CONFERENCE 2024", fill='white', font=font_large)
            draw.text((50, 100), "Date: December 15, 2024", fill='#cccccc', font=font_medium)
            draw.text((50, 130), "Time: 9:00 AM - 5:00 PM", fill='#cccccc', font=font_medium)
            draw.text((50, 160), "Location: Convention Center", fill='#cccccc', font=font_medium)
            draw.text((50, 190), "123 Main Street, Tech City", fill='#cccccc', font=font_small)
            draw.text((50, 220), "Join us for the biggest tech event", fill='#aaaaaa', font=font_small)
            draw.text((50, 240), "of the year! Networking, talks,", fill='#aaaaaa', font=font_small)
            draw.text((50, 260), "and innovation.", fill='#aaaaaa', font=font_small)
            
            # Convert to bytes
            img_bytes = BytesIO()
            img.save(img_bytes, format='JPEG')
            img_bytes.seek(0)
            
            return img_bytes.getvalue()
            
        except ImportError:
            print("PIL not available for advanced image creation, using simple image")
            return self.create_test_image()

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_extract_event_no_file(self):
        """Test extract-event endpoint without file"""
        success, response = self.run_test(
            "Extract Event - No File",
            "POST",
            "extract-event",
            422  # Unprocessable Entity for missing file
        )
        return success

    def test_extract_event_with_image(self):
        """Test extract-event endpoint with image"""
        image_data = self.create_test_image_with_event_text()
        
        files = {
            'file': ('test_flyer.jpg', image_data, 'image/jpeg')
        }
        
        success, response = self.run_test(
            "Extract Event - With Image",
            "POST",
            "extract-event",
            200,
            files=files
        )
        
        if success and isinstance(response, dict):
            print(f"Extracted event data: {json.dumps(response, indent=2)}")
            return success, response
        
        return success, {}

    def test_generate_ics_no_data(self):
        """Test generate-ics endpoint without data"""
        success, response = self.run_test(
            "Generate ICS - No Data",
            "POST",
            "generate-ics",
            422  # Unprocessable Entity for missing data
        )
        return success

    def test_generate_ics_with_data(self):
        """Test generate-ics endpoint with event data"""
        event_data = {
            "title": "Test Event",
            "date": "2024-12-15",
            "time": "09:00",
            "end_time": "17:00",
            "location": "Convention Center",
            "description": "A test event for calendar generation"
        }
        
        success, response = self.run_test(
            "Generate ICS - With Data",
            "POST",
            "generate-ics",
            200,
            data=event_data,
            response_type='content'
        )
        
        if success:
            # Check if response contains ICS content
            content = response.decode('utf-8') if isinstance(response, bytes) else str(response)
            if 'BEGIN:VCALENDAR' in content and 'END:VCALENDAR' in content:
                print("✅ Valid ICS file generated")
                print(f"ICS content preview: {content[:200]}...")
            else:
                print("❌ Invalid ICS content")
                return False
        
        return success

    def test_generate_ics_invalid_data(self):
        """Test generate-ics endpoint with invalid data"""
        event_data = {
            "title": "",  # Empty title
            "date": "invalid-date",
            "time": "invalid-time"
        }
        
        success, response = self.run_test(
            "Generate ICS - Invalid Data",
            "POST",
            "generate-ics",
            400,  # Should handle invalid data gracefully
            data=event_data
        )
        return success

def main():
    print("🚀 Starting EventSnap API Tests")
    print("=" * 50)
    
    # Setup
    tester = EventSnapAPITester()
    
    # Test basic connectivity
    if not tester.test_root_endpoint():
        print("❌ Root endpoint failed, stopping tests")
        return 1
    
    # Test extract-event endpoint
    tester.test_extract_event_no_file()
    
    # Test with actual image
    success, extracted_data = tester.test_extract_event_with_image()
    
    # Test generate-ics endpoint
    tester.test_generate_ics_no_data()
    tester.test_generate_ics_with_data()
    tester.test_generate_ics_invalid_data()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Tests Summary: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())