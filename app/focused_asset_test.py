#!/usr/bin/env python3
"""
Focused Asset Upload Test for Project Chimera
Tests the asset upload system with a known project ID.
"""

import requests
import sys
import json
import os
from pathlib import Path
from datetime import datetime
from PIL import Image
import tempfile

# Use the project ID we just created
PROJECT_ID = "ac7be34f-999e-4f21-adb8-b3d9a706793e"
BASE_URL = "https://pwa-builder-8.preview.emergentagent.com"

class FocusedAssetTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.uploaded_assets = []
        
    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
            if details:
                print(f"   {details}")
        else:
            print(f"❌ {name}")
            if details:
                print(f"   {details}")
        return success

    def test_image_upload_and_optimization(self):
        """Test image upload with optimization and color palette extraction"""
        print("\n=== IMAGE UPLOAD & OPTIMIZATION TEST ===")
        
        test_image_path = "/app/test_assets/test_image.png"
        
        try:
            with open(test_image_path, 'rb') as f:
                files = {'file': ('test_image.png', f, 'image/png')}
                response = requests.post(
                    f"{BASE_URL}/api/projects/{PROJECT_ID}/assets/upload",
                    files=files
                )
            
            if response.status_code == 200:
                asset = response.json()
                self.uploaded_assets.append(asset)
                
                print(f"   Response: {json.dumps(asset, indent=2)}")
                
                # Verify response structure
                required_fields = ['id', 'filename', 'type', 'url', 'width', 'height', 'colors']
                missing_fields = [field for field in required_fields if field not in asset]
                
                if missing_fields:
                    return self.log_test(
                        "Image upload response structure", 
                        False, 
                        f"Missing fields: {missing_fields}"
                    )
                
                # Verify image type
                success = asset['type'] == 'images'
                if not success:
                    return self.log_test(
                        "Image type classification", 
                        False, 
                        f"Expected 'images', got '{asset['type']}'"
                    )
                
                # Verify color palette extraction
                colors = asset.get('colors', [])
                success = len(colors) == 5
                if not success:
                    return self.log_test(
                        "Color palette extraction", 
                        False, 
                        f"Expected 5 colors, got {len(colors)}"
                    )
                
                # Verify colors are in hex format
                valid_colors = all(
                    isinstance(color, str) and color.startswith('#') and len(color) == 7
                    for color in colors
                )
                
                if not valid_colors:
                    return self.log_test(
                        "Color palette format", 
                        False, 
                        f"Invalid color format: {colors}"
                    )
                
                return self.log_test(
                    "Image upload with color palette", 
                    True, 
                    f"Colors: {colors}"
                )
            else:
                return self.log_test(
                    "Image upload", 
                    False, 
                    f"Status: {response.status_code}, Response: {response.text}"
                )
                
        except Exception as e:
            return self.log_test("Image upload", False, f"Error: {str(e)}")

    def test_large_image_optimization(self):
        """Test large image resizing and WebP conversion"""
        print("\n=== LARGE IMAGE OPTIMIZATION TEST ===")
        
        large_image_path = "/app/test_assets/large_image.jpg"
        
        try:
            with open(large_image_path, 'rb') as f:
                files = {'file': ('large_image.jpg', f, 'image/jpeg')}
                response = requests.post(
                    f"{BASE_URL}/api/projects/{PROJECT_ID}/assets/upload",
                    files=files
                )
            
            if response.status_code == 200:
                asset = response.json()
                self.uploaded_assets.append(asset)
                
                print(f"   Response: {json.dumps(asset, indent=2)}")
                
                # Check if image was resized
                width = asset.get('width', 0)
                height = asset.get('height', 0)
                
                if width > 1920 or height > 1080:
                    return self.log_test(
                        "Large image resizing", 
                        False, 
                        f"Image not resized: {width}x{height}"
                    )
                
                # Check if converted to WebP
                stored_filename = asset.get('stored_filename', '')
                if not stored_filename.endswith('.webp'):
                    return self.log_test(
                        "WebP conversion", 
                        False, 
                        f"Not converted to WebP: {stored_filename}"
                    )
                
                return self.log_test(
                    "Large image optimization", 
                    True, 
                    f"Resized to {width}x{height}, converted to WebP"
                )
            else:
                return self.log_test(
                    "Large image optimization", 
                    False, 
                    f"Status: {response.status_code}, Response: {response.text}"
                )
                
        except Exception as e:
            return self.log_test("Large image optimization", False, f"Error: {str(e)}")

    def test_audio_upload(self):
        """Test audio upload and metadata extraction"""
        print("\n=== AUDIO UPLOAD TEST ===")
        
        try:
            # Create a simple audio file for testing
            import wave
            import struct
            
            audio_path = "/app/test_assets/test_audio.wav"
            with wave.open(audio_path, 'w') as wav_file:
                wav_file.setnchannels(2)  # stereo
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(44100)  # 44.1kHz
                
                # Generate 1 second of sine wave
                frames = []
                for i in range(44100):
                    value = int(32767 * 0.1)  # Low volume
                    frames.append(struct.pack('<hh', value, value))
                
                wav_file.writeframes(b''.join(frames))
            
            # Upload the audio file
            with open(audio_path, 'rb') as f:
                files = {'file': ('test_audio.wav', f, 'audio/wav')}
                response = requests.post(
                    f"{BASE_URL}/api/projects/{PROJECT_ID}/assets/upload",
                    files=files
                )
            
            if response.status_code == 200:
                asset = response.json()
                self.uploaded_assets.append(asset)
                
                print(f"   Response: {json.dumps(asset, indent=2)}")
                
                # Verify audio metadata fields
                required_fields = ['id', 'filename', 'type', 'url', 'duration', 'bitrate', 'sample_rate', 'channels']
                missing_fields = [field for field in required_fields if field not in asset]
                
                if missing_fields:
                    return self.log_test(
                        "Audio metadata extraction", 
                        False, 
                        f"Missing fields: {missing_fields}"
                    )
                
                # Verify audio type
                if asset['type'] != 'audio':
                    return self.log_test(
                        "Audio type classification", 
                        False, 
                        f"Expected 'audio', got '{asset['type']}'"
                    )
                
                # Verify metadata values
                duration = asset.get('duration', 0)
                sample_rate = asset.get('sample_rate', 0)
                channels = asset.get('channels', 0)
                
                if duration <= 0:
                    return self.log_test(
                        "Audio duration extraction", 
                        False, 
                        f"Invalid duration: {duration}"
                    )
                
                return self.log_test(
                    "Audio upload with metadata", 
                    True, 
                    f"Duration: {duration:.2f}s, {sample_rate}Hz, {channels} channels"
                )
            else:
                return self.log_test(
                    "Audio upload", 
                    False, 
                    f"Status: {response.status_code}, Response: {response.text}"
                )
                
        except Exception as e:
            return self.log_test("Audio upload", False, f"Error: {str(e)}")

    def test_asset_serving(self):
        """Test asset serving endpoint"""
        print("\n=== ASSET SERVING TEST ===")
        
        if not self.uploaded_assets:
            return self.log_test("Asset serving", False, "No uploaded assets to test")
        
        # Test serving the first uploaded asset
        asset = self.uploaded_assets[0]
        asset_url = asset.get('url', '')
        
        if not asset_url:
            return self.log_test("Asset serving", False, "No asset URL found")
        
        try:
            full_url = f"{BASE_URL}{asset_url}"
            print(f"   Testing URL: {full_url}")
            
            response = requests.get(full_url)
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                return self.log_test(
                    "Asset serving", 
                    True, 
                    f"Content-Type: {content_type}, Size: {len(response.content)} bytes"
                )
            else:
                return self.log_test(
                    "Asset serving", 
                    False, 
                    f"Status: {response.status_code}, URL: {full_url}"
                )
                
        except Exception as e:
            return self.log_test("Asset serving", False, f"Error: {str(e)}")

    def test_asset_listing(self):
        """Test asset listing endpoint"""
        print("\n=== ASSET LISTING TEST ===")
        
        try:
            response = requests.get(f"{BASE_URL}/api/projects/{PROJECT_ID}/assets")
            
            if response.status_code == 200:
                data = response.json()
                assets = data.get('assets', [])
                
                print(f"   Found {len(assets)} assets")
                for i, asset in enumerate(assets):
                    print(f"   Asset {i+1}: {asset.get('filename')} ({asset.get('type')})")
                
                if len(assets) != len(self.uploaded_assets):
                    return self.log_test(
                        "Asset listing count", 
                        False, 
                        f"Expected {len(self.uploaded_assets)} assets, got {len(assets)}"
                    )
                
                return self.log_test(
                    "Asset listing", 
                    True, 
                    f"Listed {len(assets)} assets correctly"
                )
            else:
                return self.log_test(
                    "Asset listing", 
                    False, 
                    f"Status: {response.status_code}, Response: {response.text}"
                )
                
        except Exception as e:
            return self.log_test("Asset listing", False, f"Error: {str(e)}")

    def test_invalid_file_type(self):
        """Test uploading invalid file type"""
        print("\n=== INVALID FILE TYPE TEST ===")
        
        text_file_path = "/app/test_assets/test_file.txt"
        
        try:
            with open(text_file_path, 'rb') as f:
                files = {'file': ('test_file.txt', f, 'text/plain')}
                response = requests.post(
                    f"{BASE_URL}/api/projects/{PROJECT_ID}/assets/upload",
                    files=files
                )
            
            if response.status_code == 400:
                return self.log_test(
                    "Invalid file type rejection", 
                    True, 
                    "Correctly rejected unsupported file type"
                )
            else:
                return self.log_test(
                    "Invalid file type rejection", 
                    False, 
                    f"Expected 400, got {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            return self.log_test("Invalid file type", False, f"Error: {str(e)}")

    def test_asset_deletion(self):
        """Test asset deletion"""
        print("\n=== ASSET DELETION TEST ===")
        
        if not self.uploaded_assets:
            return self.log_test("Asset deletion", False, "No assets to delete")
        
        # Delete the first uploaded asset
        asset = self.uploaded_assets[0]
        asset_id = asset.get('id')
        
        if not asset_id:
            return self.log_test("Asset deletion", False, "No asset ID found")
        
        try:
            response = requests.delete(
                f"{BASE_URL}/api/projects/{PROJECT_ID}/assets/{asset_id}"
            )
            
            if response.status_code == 200:
                # Verify asset is removed from listing
                list_response = requests.get(f"{BASE_URL}/api/projects/{PROJECT_ID}/assets")
                
                if list_response.status_code == 200:
                    data = list_response.json()
                    assets = data.get('assets', [])
                    
                    # Check if asset is no longer in the list
                    asset_still_exists = any(a.get('id') == asset_id for a in assets)
                    
                    if asset_still_exists:
                        return self.log_test(
                            "Asset deletion from database", 
                            False, 
                            "Asset still exists in project"
                        )
                    
                    # Remove from our tracking
                    self.uploaded_assets = [a for a in self.uploaded_assets if a.get('id') != asset_id]
                    
                    return self.log_test(
                        "Asset deletion", 
                        True, 
                        "Asset successfully deleted"
                    )
                else:
                    return self.log_test(
                        "Asset deletion verification", 
                        False, 
                        f"Could not verify deletion: {list_response.status_code}"
                    )
            else:
                return self.log_test(
                    "Asset deletion", 
                    False, 
                    f"Status: {response.status_code}, Response: {response.text}"
                )
                
        except Exception as e:
            return self.log_test("Asset deletion", False, f"Error: {str(e)}")

    def run_all_tests(self):
        """Run all asset upload tests"""
        print("🚀 Starting Focused Asset Upload Tests for Project Chimera")
        print(f"Base URL: {BASE_URL}")
        print(f"Project ID: {PROJECT_ID}")
        
        # Test sequence
        tests = [
            self.test_image_upload_and_optimization,
            self.test_large_image_optimization,
            self.test_audio_upload,
            self.test_asset_serving,
            self.test_asset_listing,
            self.test_invalid_file_type,
            self.test_asset_deletion,
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ Test {test.__name__} failed with error: {str(e)}")
        
        # Print results
        print(f"\n📊 Asset Upload Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = FocusedAssetTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())