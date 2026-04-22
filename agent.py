import os
import feedparser
import json
import requests
from dotenv import load_dotenv

# --- 1. CONFIGURATION ---
# Load the secret key from .env.local file
load_dotenv('.env.local')

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# Define Sectors and Keywords for filtering
# This helps us find relevant articles AND validate the AI's response
SECTORS = {
    "FINTECH": ["mpesa", "cbk", "fintech", "loan", "banking", "crypto", "equity bank", "kcb", "credit", "sacco", "mobile money"],
    "CLEAN ENERGY": ["kengen", "geothermal", "solar", "wind power", "renewable", "energy", "kplc", "off-grid", "hydropower"],
    "MANUFACTURING": ["factory", "manufacturing", "industrial", "processing", "export", "epz", "cdsc"],
    "HEALTHCARE": ["health", "hospital", "who", "ministry of health", "vaccine", "doctors", "shif", "medicines", "medical"],
    "INFRASTRUCTURE": ["road", "railway", "airport", "port", "construction", "housing", "expressway", "freight", "infrastructure"],
    "AGRICULTURE": ["maize", "fertilizer", "farming", "agriculture", "food security", "irrigation", "coffee", "tea", "sugar"],
    "E-MOBILITY": ["electric vehicle", "ev", "boda boda", "motorbike", "mobility", "electric bus", "roam", "bike"]
}

# RSS Feeds from Kenyan sources
SOURCES = [
    {"name": "Business Daily", "url": "https://www.businessdailyafrica.com/rss"},
    {"name": "Standard Media", "url": "https://www.standardmedia.co.ke/rss/headlines.xml"},
    {"name": "TechCabal", "url": "https://techcabal.com/feed"},
    {"name": "Nation", "url": "https://nation.africa/kenya/rss"}
]

# --- 2. FUNCTIONS ---

def fetch_news():
    """Scans RSS feeds for articles matching our sectors."""
    relevant_articles = []
    print("🔍 Scanning news feeds...")
    
    for source in SOURCES:
        try:
            feed = feedparser.parse(source['url'])
            
            for entry in feed.entries[:15]: # Check top 15 per source
                title = entry.title
                summary = entry.get('summary', '')
                content = f"{title}. {summary}".lower()
                
                # Check if any keyword matches
                found_sector = None
                for sector, keywords in SECTORS.items():
                    if any(keyword in content for keyword in keywords):
                        found_sector = sector
                        break
                
                if found_sector:
                    relevant_articles.append({
                        "title": title,
                        "link": entry.link,
                        "sector": found_sector, # We pass this as a fallback
                        "source": source['name'],
                        "date": entry.get('published', 'Today')
                    })
                    
        except Exception as e:
            print(f"   ⚠️ Could not read {source['name']}: {e}")
            
    print(f"✅ Found {len(relevant_articles)} relevant articles.")
    return relevant_articles

def analyze_intelligence(article):
    """Sends the article to Groq AI for strategic analysis."""
    
    prompt = f"""
    You are a Senior Investment Analyst for Kenya.
    Analyze the following news headline: "{article['title']}"
    
    1. Confirm Sector (Strictly choose one: FINTECH, CLEAN ENERGY, MANUFACTURING, HEALTHCARE, INFRASTRUCTURE, AGRICULTURE, E-MOBILITY).
    2. Write a 1-sentence Interpretation (Why does this matter strategically?).
    3. Write a 1-sentence Opportunity Signal.
    4. Write a 1-sentence Risk Signal.
    
    Return valid JSON only with keys: sector, interpretation, opportunity, risk.
    """

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "llama-3.1-8b-instant", 
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_object"}
    }

    try:
        # Using requests instead of the groq library to avoid Rust errors on Termux
        response = requests.post(GROQ_URL, headers=headers, json=data)
        
        if response.status_code == 200:
            result = response.json()
            content = result['choices'][0]['message']['content']
            analysis = json.loads(content)
            
            # --- STRICT VALIDATION FIX ---
            # Define the allowed list
            valid_sectors = ["FINTECH", "CLEAN ENERGY", "MANUFACTURING", "HEALTHCARE", "INFRASTRUCTURE", "AGRICULTURE", "E-MOBILITY"]
            
            # Get the AI's sector choice and make it uppercase
            ai_sector = analysis.get('sector', '').upper()
            
            # If the AI chose a valid sector, use it.
            if ai_sector in valid_sectors:
                analysis['sector'] = ai_sector
            else:
                # If AI made a mistake (e.g. said "Finance"), use the keyword-based sector we found earlier
                analysis['sector'] = article['sector']
            
            return analysis
        else:
            # This prints the ACTUAL error message from Groq
            print(f"   ❌ API Error {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        print(f"   ❌ Connection Error: {e}")
        return None

def save_to_json(data):
    """Saves the final intelligence to the JSON file."""
    output_path = "public/intel.json"
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"💾 Data saved to {output_path}")

# --- 3. MAIN EXECUTION ---
if __name__ == "__main__":
    # Safety check for key
    if not GROQ_API_KEY:
        print("❌ ERROR: GROQ_API_KEY not found. Check your .env.local file.")
    else:
        # 1. Get the news
        raw_news = fetch_news()
        
        final_intel = []
        
        # 2. Analyze with AI (limit to top 5 to save time/credits)
        if len(raw_news) > 0:
            print("🧠 Analyzing with AI...")
            
            for item in raw_news[:5]:
                analysis = analyze_intelligence(item)
                
                if analysis:
                    entry = {
                        "id": len(final_intel) + 1,
                        "sector": analysis['sector'],
                        "title": item['title'],
                        "date": item['date'],
                        "interpretation": analysis.get('interpretation', ''),
                        "opportunity": analysis.get('opportunity', ''),
                        "risk": analysis.get('risk', '')
                    }
                    final_intel.append(entry)
                    print(f"   ✅ Processed: {item['title'][:40]}...")
            
            # 3. Save the file
            if final_intel:
                save_to_json(final_intel)
            else:
                print("⚠️ AI analysis failed for all articles.")
            
        else:
            print("⚠️ No relevant articles found today.")
