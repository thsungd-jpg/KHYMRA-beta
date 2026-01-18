#!/usr/bin/env python3
"""
Comprehensive Asset Upload System Test for Project Chimera
Tests all asset upload functionality including image optimization, color palette extraction, and audio metadata.
"""

import requests
import sys
import json
import os
from pathlib import Path
from datetime import datetime
from PIL import Image
import tempfile

class AssetUploadTester:
    def __init__(self, base_url="https://pwa-builder-8.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None
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

    def create_test_project(self):
        """Create a test project for asset uploads"""
        print("\n=== CREATING TEST PROJECT ===")
        
        project_data = {
            "name": f"Asset Test Project {datetime.now().strftime('%H%M%S')}",
            "description": "Test project for asset upload functionality"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/projects",
                json=project_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 201:
                project = response.json()
                self.project_id = project.get('id')
                return self.log_test(
                    "Create test project", 
                    True, 
                    f"Project ID: {self.project_id}"
                )
            else:
                return self.log_test(
                    "Create test project", 
                    False, 
                    f"Status: {response.status_code}, Response: {response.text}"
                )
                
        except Exception as e:
            return self.log_test("Create test project", False, f"Error: {str(e)}")

    def test_image_upload(self):
        """Test image upload with optimization and color palette extraction"""
        print("\n=== IMAGE UPLOAD TESTS ===")
        
        if not self.project_id:
            return self.log_test("Image upload", False, "No project ID available")
        
        # Test normal image upload
        test_image_path = "/app/test_assets/test_image.png"
        
        try:
            with open(test_image_path, 'rb') as f:
                files = {'file': ('test_image.png', f, 'image/png')}
                response = requests.post(
                    f"{self.base_url}/api/projects/{self.project_id}/assets/upload",
                    files=files
                )
            
            if response.status_code == 200:
                asset = response.json()
                self.uploaded_assets.append(asset)
                
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
                if asset['type'] != 'images':
                    return self.log_test(
                        "Image type classification", 
                        False, 
                        f"Expected 'images', got '{asset['type']}'"
                    )
                
                # Verify color palette extraction
                colors = asset.get('colors', [])
                if len(colors) != 5:
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
                    f"Colors extracted: {colors[:3]}..."
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
        
        if not self.project_id:
            return self.log_test("Large image optimization", False, "No project ID available")
        
        large_image_path = "/app/test_assets/large_image.jpg"
        
        try:
            with open(large_image_path, 'rb') as f:
                files = {'file': ('large_image.jpg', f, 'image/jpeg')}
                response = requests.post(
                    f"{self.base_url}/api/projects/{self.project_id}/assets/upload",
                    files=files
                )
            
            if response.status_code == 200:
                asset = response.json()
                self.uploaded_assets.append(asset)
                
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
        
        if not self.project_id:
            return self.log_test("Audio upload", False, "No project ID available")
        
        # Create a simple audio file for testing (using a small WAV file)
        try:
            # Create a minimal WAV file
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
                    # Simple sine wave
                    value = int(32767 * 0.1)  # Low volume
                    frames.append(struct.pack('<hh', value, value))
                
                wav_file.writeframes(b''.join(frames))
            
            # Upload the audio file
            with open(audio_path, 'rb') as f:
                files = {'file': ('test_audio.wav', f, 'audio/wav')}
                response = requests.post(
                    f"{self.base_url}/api/projects/{self.project_id}/assets/upload",
                    files=files
                )
            
            if response.status_code == 200:
                asset = response.json()
                self.uploaded_assets.append(asset)
                
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
                
                if sample_rate != 44100:
                    return self.log_test(
                        "Audio sample rate extraction", 
                        False, 
                        f"Expected 44100, got {sample_rate}"
                    )
                
                if channels != 2:
                    return self.log_test(
                        "Audio channels extraction", 
                        False, 
                        f"Expected 2 channels, got {channels}"
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
            # Remove /api prefix if present since we're using full URL
            if asset_url.startswith('/api/'):
                full_url = f"{self.base_url}{asset_url}"
            else:
                full_url = f"{self.base_url}/api{asset_url}"
            
            response = requests.get(full_url)
            
            if response.status_code == 200:
                # Verify content type
                content_type = response.headers.get('content-type', '')
                if asset['type'] == 'images' and not content_type.startswith('image/'):
                    return self.log_test(
                        "Asset serving content type", 
                        False, 
                        f"Expected image content type, got {content_type}"
                    )
                
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
        
        if not self.project_id:
            return self.log_test("Asset listing", False, "No project ID available")
        
        try:
            response = requests.get(f"{self.base_url}/api/projects/{self.project_id}/assets")
            
            if response.status_code == 200:
                data = response.json()
                assets = data.get('assets', [])
                
                if len(assets) != len(self.uploaded_assets):
                    return self.log_test(
                        "Asset listing count", 
                        False, 
                        f"Expected {len(self.uploaded_assets)} assets, got {len(assets)}"
                    )
                
                # Verify each asset has required fields
                for asset in assets:
                    required_fields = ['id', 'filename', 'type', 'url']
                    missing_fields = [field for field in required_fields if field not in asset]
                    
                    if missing_fields:
                        return self.log_test(
                            "Asset listing structure", 
                            False, 
                            f"Asset missing fields: {missing_fields}"
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
        
        if not self.project_id:
            return self.log_test("Invalid file type", False, "No project ID available")
        
        # Try uploading a text file
        text_file_path = "/app/test_assets/test_file.txt"
        
        try:
            with open(text_file_path, 'rb') as f:
                files = {'file': ('test_file.txt', f, 'text/plain')}
                response = requests.post(
                    f"{self.base_url}/api/projects/{self.project_id}/assets/upload",
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
                    f"Expected 400, got {response.status_code}"
                )
                
        except Exception as e:
            return self.log_test("Invalid file type", False, f"Error: {str(e)}")

    def test_asset_deletion(self):
        """Test asset deletion"""
        print("\n=== ASSET DELETION TEST ===")
        
        if not self.project_id or not self.uploaded_assets:
            return self.log_test("Asset deletion", False, "No assets to delete")
        
        # Delete the first uploaded asset
        asset = self.uploaded_assets[0]
        asset_id = asset.get('id')
        
        if not asset_id:
            return self.log_test("Asset deletion", False, "No asset ID found")
        
        try:
            response = requests.delete(
                f"{self.base_url}/api/projects/{self.project_id}/assets/{asset_id}"
            )
            
            if response.status_code == 200:
                # Verify asset is removed from listing
                list_response = requests.get(f"{self.base_url}/api/projects/{self.project_id}/assets")
                
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

    def test_project_color_palette_update(self):
        """Test that project color palette is updated when images are uploaded"""
        print("\n=== PROJECT COLOR PALETTE UPDATE TEST ===")
        
        if not self.project_id:
            return self.log_test("Project color palette update", False, "No project ID available")
        
        try:
            # Get project details
            response = requests.get(f"{self.base_url}/api/projects/{self.project_id}")
            
            if response.status_code == 200:
                project = response.json()
                color_palette = project.get('color_palette', [])
                
                if not color_palette:
                    return self.log_test(
                        "Project color palette update", 
                        False, 
                        "No color palette found in project"
                    )
                
                # Verify colors are in hex format
                valid_colors = all(
                    isinstance(color, str) and color.startswith('#') and len(color) == 7
                    for color in color_palette
                )
                
                if not valid_colors:
                    return self.log_test(
                        "Project color palette format", 
                        False, 
                        f"Invalid color format: {color_palette}"
                    )
                
                return self.log_test(
                    "Project color palette update", 
                    True, 
                    f"Project has {len(color_palette)} colors: {color_palette[:3]}..."
                )
            else:
                return self.log_test(
                    "Project color palette update", 
                    False, 
                    f"Status: {response.status_code}, Response: {response.text}"
                )
                
        except Exception as e:
            return self.log_test("Project color palette update", False, f"Error: {str(e)}")

    def cleanup(self):
        """Clean up test data"""
        print("\n=== CLEANUP ===")
        
        # Delete remaining assets
        for asset in self.uploaded_assets:
            asset_id = asset.get('id')
            if asset_id and self.project_id:
                try:
                    requests.delete(f"{self.base_url}/api/projects/{self.project_id}/assets/{asset_id}")
                except:
                    pass
        
        # Delete test project
        if self.project_id:
            try:
                response = requests.delete(f"{self.base_url}/api/projects/{self.project_id}")
                if response.status_code == 204:
                    self.log_test("Delete test project", True, "Project cleaned up")
                else:
                    self.log_test("Delete test project", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Delete test project", False, f"Error: {str(e)}")

    def run_all_tests(self):
        """Run all asset upload tests"""
        print("🚀 Starting Asset Upload System Tests for Project Chimera")
        print(f"Base URL: {self.base_url}")
        
        # Test sequence
        tests = [
            self.create_test_project,
            self.test_image_upload,
            self.test_large_image_optimization,
            self.test_audio_upload,
            self.test_asset_serving,
            self.test_asset_listing,
            self.test_project_color_palette_update,
            self.test_invalid_file_type,
            self.test_asset_deletion,
        ]
        
        for test in tests:
            try:
                success = test()
                if not success and test == self.create_test_project:
                    print("❌ Cannot continue without project - stopping tests")
                    break
            except Exception as e:
                print(f"❌ Test {test.__name__} failed with error: {str(e)}")
        
        # Cleanup
        self.cleanup()
        
        # Print results
        print(f"\n📊 Asset Upload Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = AssetUploadTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())