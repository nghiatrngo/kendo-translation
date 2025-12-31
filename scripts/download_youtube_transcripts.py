#!/usr/bin/env python3
"""
Download English and Japanese transcripts from a YouTube playlist.

This script fetches all videos from a YouTube playlist and downloads
their English and Japanese transcripts (captions) for bilingual translation data.

Features:
- Resumes from where it left off (skips already downloaded videos)
- Handles rate limiting with exponential backoff
- Saves all transcripts locally with metadata

Usage:
    source venv/bin/activate
    python scripts/download_youtube_transcripts.py

Dependencies:
    pip install yt-dlp youtube-transcript-api
"""

import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import Optional

from youtube_transcript_api import YouTubeTranscriptApi


# Configuration
PLAYLIST_URL = "https://www.youtube.com/playlist?list=PL4fmEy1EV7bLXZ_PFc_jTFEJASJTnjrfD"
OUTPUT_DIR = Path(__file__).parent.parent / "data" / "youtube_transcripts"

# Languages to download (in order of preference)
ENGLISH_CODES = ["en", "en-US", "en-GB", "en-AU"]
JAPANESE_CODES = ["ja", "ja-JP"]

# Rate limiting settings
BASE_DELAY = 3  # Base delay between requests in seconds
MAX_RETRIES = 3
BACKOFF_MULTIPLIER = 2


def sanitize_filename(title: str) -> str:
    """Convert a video title to a safe filename."""
    # Remove or replace invalid characters
    filename = re.sub(r'[<>:"/\\|?*]', '', title)
    filename = re.sub(r'\s+', '_', filename)
    return filename[:100]  # Limit length


def get_video_ids_from_playlist(playlist_url: str) -> list[dict]:
    """Fetch all video IDs and titles from a YouTube playlist using yt-dlp."""
    print(f"Fetching playlist: {playlist_url}")
    
    # Use yt-dlp to get playlist info
    cmd = [
        "yt-dlp",
        "--flat-playlist",
        "--dump-json",
        playlist_url
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        videos = []
        
        for line in result.stdout.strip().split('\n'):
            if line:
                try:
                    video_data = json.loads(line)
                    video_id = video_data.get("id", "")
                    title = video_data.get("title", "Unknown")
                    
                    videos.append({
                        "video_id": video_id,
                        "title": title,
                        "url": f"https://www.youtube.com/watch?v={video_id}"
                    })
                    print(f"  [{len(videos)}] Found: {title}")
                except json.JSONDecodeError:
                    continue
        
        print(f"\nTotal videos found: {len(videos)}")
        return videos
        
    except subprocess.CalledProcessError as e:
        print(f"Error fetching playlist: {e}")
        print(f"stderr: {e.stderr}")
        return []
    except FileNotFoundError:
        print("Error: yt-dlp not found. Install it with: pip install yt-dlp")
        return []


def get_transcript_with_retry(video_id: str, language_codes: list[str], max_retries: int = MAX_RETRIES) -> Optional[dict]:
    """
    Fetch transcript for a video with retry logic for rate limiting.
    """
    for attempt in range(max_retries):
        try:
            ytt_api = YouTubeTranscriptApi()
            
            # Get available languages
            try:
                transcript_list = ytt_api.list(video_id)
                available_langs = [t.language_code for t in transcript_list]
                print(f"      Available: {available_langs}")
            except Exception as e:
                if "429" in str(e) or "Too Many Requests" in str(e):
                    wait_time = BASE_DELAY * (BACKOFF_MULTIPLIER ** attempt) * 10
                    print(f"      Rate limited. Waiting {wait_time}s before retry {attempt+1}/{max_retries}...")
                    time.sleep(wait_time)
                    continue
                print(f"      Could not list transcripts: {e}")
                return None
            
            # Try each preferred language
            for lang_code in language_codes:
                # Direct match
                if lang_code in available_langs:
                    try:
                        fetched = ytt_api.fetch(video_id, languages=[lang_code])
                        segments = []
                        for snippet in fetched:
                            segments.append({
                                "text": snippet.text,
                                "start": snippet.start,
                                "duration": snippet.duration
                            })
                        
                        return {
                            "language_code": lang_code,
                            "language": lang_code,
                            "is_generated": False,
                            "segments": segments
                        }
                    except Exception as e:
                        if "429" in str(e):
                            raise  # Re-raise to trigger retry
                        continue
                
                # Partial match (e.g., 'en' matches 'en-US')
                for avail_lang in available_langs:
                    if avail_lang.startswith(lang_code.split('-')[0]):
                        try:
                            fetched = ytt_api.fetch(video_id, languages=[avail_lang])
                            segments = []
                            for snippet in fetched:
                                segments.append({
                                    "text": snippet.text,
                                    "start": snippet.start,
                                    "duration": snippet.duration
                                })
                            
                            return {
                                "language_code": avail_lang,
                                "language": avail_lang,
                                "is_generated": avail_lang != lang_code,
                                "segments": segments
                            }
                        except Exception as e:
                            if "429" in str(e):
                                raise  # Re-raise to trigger retry
                            continue
            
            return None
            
        except Exception as e:
            if "429" in str(e) or "Too Many Requests" in str(e):
                wait_time = BASE_DELAY * (BACKOFF_MULTIPLIER ** attempt) * 10
                print(f"      Rate limited (429). Waiting {wait_time}s before retry {attempt+1}/{max_retries}...")
                time.sleep(wait_time)
            else:
                print(f"      Error: {e}")
                return None
    
    print(f"      Max retries exceeded for video {video_id}")
    return None


def transcript_to_text(transcript_data: dict) -> str:
    """Convert transcript segments to plain text."""
    if not transcript_data or "segments" not in transcript_data:
        return ""
    
    lines = []
    for segment in transcript_data["segments"]:
        text = segment.get("text", "")
        text = text.replace('\n', ' ').strip()
        if text:
            lines.append(text)
    
    return "\n".join(lines)


def transcript_to_srt(transcript_data: dict) -> str:
    """Convert transcript segments to SRT format with timestamps."""
    if not transcript_data or "segments" not in transcript_data:
        return ""
    
    def format_time(seconds: float) -> str:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"
    
    lines = []
    for i, segment in enumerate(transcript_data["segments"], 1):
        start = segment.get("start", 0)
        duration = segment.get("duration", 0)
        end = start + duration
        text = segment.get("text", "").replace('\n', ' ').strip()
        
        lines.append(str(i))
        lines.append(f"{format_time(start)} --> {format_time(end)}")
        lines.append(text)
        lines.append("")
    
    return "\n".join(lines)


def is_video_already_downloaded(video_info: dict, output_dir: Path) -> bool:
    """Check if a video has already been downloaded (has metadata.json)."""
    safe_title = sanitize_filename(video_info["title"])
    video_dir = output_dir / safe_title
    meta_file = video_dir / "metadata.json"
    return meta_file.exists()


def download_transcripts_for_video(video_info: dict, output_dir: Path) -> dict:
    """Download English and Japanese transcripts for a single video."""
    video_id = video_info["video_id"]
    title = video_info["title"]
    safe_title = sanitize_filename(title)
    
    result = {
        "video_id": video_id,
        "title": title,
        "url": video_info["url"],
        "english": None,
        "japanese": None,
        "errors": []
    }
    
    # Create video-specific directory
    video_dir = output_dir / safe_title
    video_dir.mkdir(parents=True, exist_ok=True)
    
    # Download English transcript
    print(f"    Fetching English transcript...")
    en_transcript = get_transcript_with_retry(video_id, ENGLISH_CODES)
    if en_transcript:
        en_file = video_dir / "english.json"
        en_text_file = video_dir / "english.txt"
        en_srt_file = video_dir / "english.srt"
        
        with open(en_file, "w", encoding="utf-8") as f:
            json.dump(en_transcript, f, ensure_ascii=False, indent=2)
        
        with open(en_text_file, "w", encoding="utf-8") as f:
            f.write(transcript_to_text(en_transcript))
        
        with open(en_srt_file, "w", encoding="utf-8") as f:
            f.write(transcript_to_srt(en_transcript))
        
        result["english"] = {
            "language": en_transcript["language"],
            "is_generated": en_transcript["is_generated"],
            "file": str(en_file)
        }
        print(f"    ✓ English: {en_transcript['language']}")
    else:
        result["errors"].append("No English transcript available")
        print(f"    ✗ English: Not available")
    
    # Delay between language requests
    time.sleep(BASE_DELAY)
    
    # Download Japanese transcript
    print(f"    Fetching Japanese transcript...")
    ja_transcript = get_transcript_with_retry(video_id, JAPANESE_CODES)
    if ja_transcript:
        ja_file = video_dir / "japanese.json"
        ja_text_file = video_dir / "japanese.txt"
        ja_srt_file = video_dir / "japanese.srt"
        
        with open(ja_file, "w", encoding="utf-8") as f:
            json.dump(ja_transcript, f, ensure_ascii=False, indent=2)
        
        with open(ja_text_file, "w", encoding="utf-8") as f:
            f.write(transcript_to_text(ja_transcript))
        
        with open(ja_srt_file, "w", encoding="utf-8") as f:
            f.write(transcript_to_srt(ja_transcript))
        
        result["japanese"] = {
            "language": ja_transcript["language"],
            "is_generated": ja_transcript["is_generated"],
            "file": str(ja_file)
        }
        print(f"    ✓ Japanese: {ja_transcript['language']}")
    else:
        result["errors"].append("No Japanese transcript available")
        print(f"    ✗ Japanese: Not available")
    
    # Save video metadata
    meta_file = video_dir / "metadata.json"
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    return result


def load_existing_results(output_dir: Path, videos: list[dict]) -> list[dict]:
    """Load existing results from previously downloaded videos."""
    results = []
    for video in videos:
        safe_title = sanitize_filename(video["title"])
        meta_file = output_dir / safe_title / "metadata.json"
        if meta_file.exists():
            with open(meta_file, "r", encoding="utf-8") as f:
                results.append(json.load(f))
        else:
            results.append(None)
    return results


def create_combined_bilingual_file(results: list[dict], output_dir: Path) -> None:
    """Create a combined bilingual data file for all videos."""
    bilingual_data = []
    
    for result in results:
        if result and result.get("english") and result.get("japanese"):
            video_dir = output_dir / sanitize_filename(result["title"])
            
            en_text_file = video_dir / "english.txt"
            ja_text_file = video_dir / "japanese.txt"
            
            if en_text_file.exists() and ja_text_file.exists():
                with open(en_text_file, "r", encoding="utf-8") as f:
                    en_text = f.read()
                with open(ja_text_file, "r", encoding="utf-8") as f:
                    ja_text = f.read()
                
                bilingual_data.append({
                    "video_id": result["video_id"],
                    "title": result["title"],
                    "url": result["url"],
                    "english_text": en_text,
                    "japanese_text": ja_text,
                    "english_is_generated": result["english"]["is_generated"],
                    "japanese_is_generated": result["japanese"]["is_generated"]
                })
    
    # Save combined file
    combined_file = output_dir / "bilingual_transcripts.json"
    with open(combined_file, "w", encoding="utf-8") as f:
        json.dump(bilingual_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Combined bilingual file saved: {combined_file}")
    print(f"  Total bilingual pairs: {len(bilingual_data)}")


def main():
    """Main function to download all transcripts from the playlist."""
    print("=" * 60)
    print("YouTube Transcript Downloader (with resume)")
    print("=" * 60)
    print(f"Playlist: {PLAYLIST_URL}")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Rate limit delay: {BASE_DELAY}s between requests")
    print("=" * 60)
    
    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Get all videos from playlist
    videos = get_video_ids_from_playlist(PLAYLIST_URL)
    
    if not videos:
        print("No videos found in playlist!")
        return
    
    # Load existing results and identify videos to skip
    existing_results = load_existing_results(OUTPUT_DIR, videos)
    
    # Download transcripts for each video
    results = []
    successful = 0
    partial = 0
    failed = 0
    skipped = 0
    
    for i, video in enumerate(videos):
        # Check if already downloaded
        if existing_results[i] is not None:
            print(f"\n[{i+1}/{len(videos)}] SKIPPING (already downloaded): {video['title']}")
            results.append(existing_results[i])
            result = existing_results[i]
            if result.get("english") and result.get("japanese"):
                successful += 1
            elif result.get("english") or result.get("japanese"):
                partial += 1
            else:
                failed += 1
            skipped += 1
            continue
        
        print(f"\n[{i+1}/{len(videos)}] Processing: {video['title']}")
        
        result = download_transcripts_for_video(video, OUTPUT_DIR)
        results.append(result)
        
        if result["english"] and result["japanese"]:
            successful += 1
        elif result["english"] or result["japanese"]:
            partial += 1
        else:
            failed += 1
        
        # Delay between videos to avoid rate limiting
        print(f"    Waiting {BASE_DELAY}s before next video...")
        time.sleep(BASE_DELAY)
    
    # Save summary
    summary = {
        "playlist_url": PLAYLIST_URL,
        "total_videos": len(videos),
        "successful_pairs": successful,
        "partial": partial,
        "failed": failed,
        "skipped": skipped,
        "videos": results
    }
    
    summary_file = OUTPUT_DIR / "download_summary.json"
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    # Create combined bilingual file
    create_combined_bilingual_file(results, OUTPUT_DIR)
    
    # Print summary
    print("\n" + "=" * 60)
    print("DOWNLOAD COMPLETE")
    print("=" * 60)
    print(f"Total videos: {len(videos)}")
    print(f"Skipped (already downloaded): {skipped}")
    print(f"Both EN & JA: {successful}")
    print(f"Partial (only one language): {partial}")
    print(f"Failed (no transcripts): {failed}")
    print(f"\nOutput directory: {OUTPUT_DIR}")
    print(f"Summary file: {summary_file}")


if __name__ == "__main__":
    main()
