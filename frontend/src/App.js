import { useState, useCallback, useRef } from "react";
import "@/App.css";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { 
  UploadCloud, 
  Camera, 
  CalendarCheck, 
  Download, 
  Loader2, 
  X, 
  MapPin, 
  Clock, 
  FileText,
  Sparkles,
  ExternalLink,
  Share2,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      handleImageSelect(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false,
    noClick: true
  });

  const handleImageSelect = (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
    };
    reader.readAsDataURL(file);
    setEventData(null);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImageFile(null);
    setEventData(null);
  };

  const extractEvent = async () => {
    if (!imageFile) {
      toast.error('Please select an image first');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await axios.post(`${API}/extract-event`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setEventData(response.data.event);
      toast.success('Event details extracted!');
    } catch (error) {
      console.error('Error extracting event:', error);
      toast.error(error.response?.data?.detail || 'Failed to extract event details');
    } finally {
      setIsProcessing(false);
    }
  };

  const [googleCalendarUrl, setGoogleCalendarUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const parseDateToYYYYMMDD = (dateStr) => {
    if (!dateStr) return null;
    
    // If already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr.replace(/-/g, '');
    }
    
    // If in YYYYMMDD format
    if (/^\d{8}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Try to parse various formats
    const months = {
      'january': '01', 'february': '02', 'march': '03', 'april': '04',
      'may': '05', 'june': '06', 'july': '07', 'august': '08',
      'september': '09', 'october': '10', 'november': '11', 'december': '12',
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09', 'sept': '09',
      'oct': '10', 'nov': '11', 'dec': '12'
    };
    
    const lowerDate = dateStr.toLowerCase().trim();
    
    // Match "Month Day" or "Month Day, Year" format
    const monthDayMatch = lowerDate.match(/^([a-z]+)\s+(\d{1,2})(?:,?\s*(\d{4}))?$/);
    if (monthDayMatch) {
      const month = months[monthDayMatch[1]];
      const day = monthDayMatch[2].padStart(2, '0');
      const year = monthDayMatch[3] || new Date().getFullYear().toString();
      if (month) {
        return `${year}${month}${day}`;
      }
    }
    
    // Match "Day Month Year" format
    const dayMonthMatch = lowerDate.match(/^(\d{1,2})\s+([a-z]+)(?:,?\s*(\d{4}))?$/);
    if (dayMonthMatch) {
      const day = dayMonthMatch[1].padStart(2, '0');
      const month = months[dayMonthMatch[2]];
      const year = dayMonthMatch[3] || new Date().getFullYear().toString();
      if (month) {
        return `${year}${month}${day}`;
      }
    }
    
    // Match MM/DD/YYYY or MM-DD-YYYY
    const slashMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (slashMatch) {
      return `${slashMatch[3]}${slashMatch[1].padStart(2, '0')}${slashMatch[2].padStart(2, '0')}`;
    }
    
    // Fallback: use today's date if we can't parse
    const today = new Date();
    return `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  };

  const parseTimeToHHMM = (timeStr) => {
    if (!timeStr) return '1200';
    
    // Remove spaces and convert to lowercase
    const cleanTime = timeStr.replace(/\s+/g, '').toLowerCase();
    
    // Match HH:MM format
    const colonMatch = cleanTime.match(/^(\d{1,2}):(\d{2})$/);
    if (colonMatch) {
      return `${colonMatch[1].padStart(2, '0')}${colonMatch[2]}`;
    }
    
    // Match HH:MM AM/PM format
    const ampmMatch = cleanTime.match(/^(\d{1,2}):(\d{2})(am|pm)$/);
    if (ampmMatch) {
      let hour = parseInt(ampmMatch[1]);
      if (ampmMatch[3] === 'pm' && hour < 12) hour += 12;
      if (ampmMatch[3] === 'am' && hour === 12) hour = 0;
      return `${String(hour).padStart(2, '0')}${ampmMatch[2]}`;
    }
    
    // Match HHMM format
    if (/^\d{4}$/.test(cleanTime)) {
      return cleanTime;
    }
    
    return '1200';
  };

  const generateGoogleCalendarUrl = () => {
    if (!eventData || !eventData.title) {
      return null;
    }

    try {
      const dateStr = parseDateToYYYYMMDD(eventData.date);
      const timeStr = parseTimeToHHMM(eventData.time);
      const endTimeStr = eventData.end_time ? parseTimeToHHMM(eventData.end_time) : 
        String(parseInt(timeStr.slice(0, 2)) + 1).padStart(2, '0') + timeStr.slice(2);
      
      const startDateTime = `${dateStr}T${timeStr}00`;
      const endDateTime = `${dateStr}T${endTimeStr}00`;
      
      // Build Google Calendar URL
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: eventData.title,
        dates: `${startDateTime}/${endDateTime}`,
        details: eventData.description || '',
        location: eventData.location || '',
      });
      
      return `https://calendar.google.com/calendar/render?${params.toString()}`;
    } catch (error) {
      console.error('Error generating Google Calendar URL:', error);
      return null;
    }
  };

  const shareEvent = async () => {
    const calendarUrl = generateGoogleCalendarUrl();
    if (!calendarUrl) {
      toast.error('Please fill in event title and date first');
      return;
    }

    const shareText = `${eventData.title}\n📅 ${eventData.date}${eventData.time ? ` at ${eventData.time}` : ''}${eventData.location ? `\n📍 ${eventData.location}` : ''}\n\nAdd to calendar: ${calendarUrl}`;

    // Try native share API first (works great on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventData.title,
          text: shareText,
          url: calendarUrl
        });
        toast.success('Shared successfully!');
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        if (err.name === 'AbortError') {
          return; // User cancelled, don't show error
        }
      }
    }

    // Fallback: copy to clipboard using multiple methods
    const copyToClipboard = async (text) => {
      // Method 1: Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (err) {
          console.log('Clipboard API failed, trying fallback');
        }
      }
      
      // Method 2: Fallback using textarea
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        textArea.remove();
        return true;
      } catch (err) {
        textArea.remove();
        return false;
      }
    };

    const success = await copyToClipboard(shareText);
    if (success) {
      setCopied(true);
      toast.success('Event link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy. Try selecting and copying manually.');
    }
  };

  const downloadICS = async () => {
    if (!eventData) return;

    setIsDownloading(true);
    try {
      const response = await axios.post(`${API}/generate-ics`, eventData, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventData.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'event'}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Calendar invite downloaded!');
    } catch (error) {
      console.error('Error downloading ICS:', error);
      toast.error('Failed to generate calendar file');
    } finally {
      setIsDownloading(false);
    }
  };

  const updateEventField = (field, value) => {
    setEventData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#1E1E1E',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }}
      />
      
      {/* Hero glow background */}
      <div className="fixed inset-0 hero-glow pointer-events-none" />
      
      <div className="relative z-10 p-4 md:p-8 lg:p-12">
        {/* Header */}
        <header className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#E879F9]">
              <CalendarCheck className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Event<span className="text-[#E879F9]">Snap</span>
            </h1>
          </div>
          <p className="text-[#A1A1AA] text-base md:text-lg max-w-md mx-auto">
            Snap a flyer, get a calendar invite. It is that simple.
          </p>
        </header>

        {/* Main content */}
        <main className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
            {/* Upload Zone */}
            <div className="w-full max-w-md">
              <div
                {...getRootProps()}
                className={`upload-zone ${isDragActive ? 'active' : ''} ${image ? 'has-image' : ''}`}
                data-testid="upload-zone"
              >
                <input {...getInputProps()} />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="file-input"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="camera-input"
                />

                {image ? (
                  <>
                    <img 
                      src={image} 
                      alt="Preview" 
                      className="preview-image"
                      data-testid="image-preview"
                    />
                    
                    {/* Scanner overlay when processing */}
                    {isProcessing && (
                      <div className="scanner-overlay">
                        <div className="scanner-line animate-scan" />
                      </div>
                    )}
                    
                    {/* Clear button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearImage();
                      }}
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                      data-testid="clear-image-btn"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full p-8">
                    <UploadCloud 
                      className="w-20 h-20 mb-6 text-[#7C3AED]" 
                      strokeWidth={1.5}
                    />
                    <p className="text-white text-lg mb-2 font-medium text-center">
                      {isDragActive ? 'Drop the image here' : 'Drag and drop an event flyer'}
                    </p>
                    <p className="text-[#A1A1AA] text-sm mb-8">or use the buttons below</p>
                    
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileClick();
                        }}
                        className="bg-[#1E1E1E] hover:bg-[#2a2a2a] text-white border-[#3a3a3a] px-6 py-5"
                        data-testid="upload-btn"
                      >
                        <UploadCloud className="w-5 h-5 mr-2" />
                        Upload
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCameraClick();
                        }}
                        className="bg-[#1E1E1E] hover:bg-[#2a2a2a] text-white border-[#3a3a3a] px-6 py-5"
                        data-testid="camera-btn"
                      >
                        <Camera className="w-5 h-5 mr-2" />
                        Camera
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Extract button */}
              {image && !eventData && (
                <div className="mt-6">
                  <Button
                    onClick={extractEvent}
                    disabled={isProcessing}
                    className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-full py-6 text-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98] glow-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    data-testid="extract-btn"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 spinner" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Extract Event Details
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Event Details Form */}
            {eventData && (
              <div
                className="w-full max-w-md"
                data-testid="event-details-card"
              >
                <div className="event-card">
                  <div className="flex items-center gap-2 mb-6">
                    <CalendarCheck className="w-5 h-5 text-[#E879F9]" />
                    <h2 className="text-xl font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>Event Details</h2>
                  </div>

                  <div className="event-form">
                    <div className="form-group">
                      <Label className="form-label">Event Title</Label>
                      <Input
                        value={eventData.title || ''}
                        onChange={(e) => updateEventField('title', e.target.value)}
                        placeholder="Enter event title"
                        className="form-input bg-black/30 border-white/10 focus:border-[#7C3AED]/50"
                        data-testid="event-title-input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-group">
                        <Label className="form-label flex items-center gap-1">
                          <CalendarCheck className="w-3 h-3" /> Date
                        </Label>
                        <Input
                          type="text"
                          value={eventData.date || ''}
                          onChange={(e) => updateEventField('date', e.target.value)}
                          placeholder="YYYY-MM-DD"
                          className="form-input bg-black/30 border-white/10 focus:border-[#7C3AED]/50"
                          data-testid="event-date-input"
                        />
                      </div>
                      <div className="form-group">
                        <Label className="form-label flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Time
                        </Label>
                        <Input
                          type="text"
                          value={eventData.time || ''}
                          onChange={(e) => updateEventField('time', e.target.value)}
                          placeholder="HH:MM"
                          className="form-input bg-black/30 border-white/10 focus:border-[#7C3AED]/50"
                          data-testid="event-time-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <Label className="form-label flex items-center gap-1">
                        <Clock className="w-3 h-3" /> End Time (optional)
                      </Label>
                      <Input
                        type="text"
                        value={eventData.end_time || ''}
                        onChange={(e) => updateEventField('end_time', e.target.value)}
                        placeholder="HH:MM"
                        className="form-input bg-black/30 border-white/10 focus:border-[#7C3AED]/50"
                        data-testid="event-end-time-input"
                      />
                    </div>

                    <div className="form-group">
                      <Label className="form-label flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Location
                      </Label>
                      <Input
                        value={eventData.location || ''}
                        onChange={(e) => updateEventField('location', e.target.value)}
                        placeholder="Enter location"
                        className="form-input bg-black/30 border-white/10 focus:border-[#7C3AED]/50"
                        data-testid="event-location-input"
                      />
                    </div>

                    <div className="form-group">
                      <Label className="form-label flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Description
                      </Label>
                      <Textarea
                        value={eventData.description || ''}
                        onChange={(e) => updateEventField('description', e.target.value)}
                        placeholder="Event description"
                        className="form-input form-textarea bg-black/30 border-white/10 focus:border-[#7C3AED]/50 min-h-[100px]"
                        data-testid="event-description-input"
                      />
                    </div>

                    <div className="flex gap-3 mt-4">
                      <a
                        href={generateGoogleCalendarUrl() || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 flex items-center justify-center bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-full py-4 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98] glow-primary ${(!eventData?.title || !eventData?.date) ? 'opacity-50 pointer-events-none' : ''}`}
                        data-testid="add-to-gcal-btn"
                        onClick={() => {
                          if (!eventData?.title || !eventData?.date) {
                            toast.error('Please fill in event title and date');
                          } else {
                            toast.success('Opening Google Calendar...');
                          }
                        }}
                      >
                        <CalendarCheck className="w-5 h-5 mr-2" />
                        Add to Calendar
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                      
                      <Button
                        onClick={shareEvent}
                        disabled={!eventData?.title || !eventData?.date}
                        className="bg-[#E879F9] hover:bg-[#d946ef] text-white rounded-full px-6 py-4 font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="share-event-btn"
                      >
                        {copied ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Share2 className="w-5 h-5" />
                        )}
                      </Button>
                    </div>

                    <Button
                      onClick={downloadICS}
                      disabled={isDownloading || !eventData.title || !eventData.date}
                      variant="outline"
                      className="w-full bg-transparent hover:bg-white/5 text-white border-white/20 rounded-full py-5 text-sm font-medium transition-all mt-3"
                      data-testid="download-ics-btn"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 spinner" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download .ics file (Apple/Outlook)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center mt-12 text-[#52525B] text-sm">
          <p>Upload a flyer - AI extracts details - Add to your calendar</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
