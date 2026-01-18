import requests
import sys
import json
from datetime import datetime

class ChimeraAPITester:
    def __init__(self, base_url="https://pwa-download.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None
        self.state_id = None
        self.variation_id = None
        self.export_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoints"""
        print("\n=== HEALTH CHECK TESTS ===")
        
        # Test root endpoint
        success, _ = self.run_test("Root endpoint", "GET", "", 200)
        
        # Test health endpoint
        success, _ = self.run_test("Health check", "GET", "health", 200)
        
        return success

    def test_project_crud(self):
        """Test project CRUD operations"""
        print("\n=== PROJECT CRUD TESTS ===")
        
        # Test list projects (empty initially)
        success, projects = self.run_test("List projects (empty)", "GET", "projects", 200)
        
        # Test create project
        project_data = {
            "name": f"Test Project {datetime.now().strftime('%H%M%S')}",
            "description": "A test project for API validation"
        }
        success, project = self.run_test("Create project", "POST", "projects", 201, project_data)
        if success and 'id' in project:
            self.project_id = project['id']
            print(f"   Created project ID: {self.project_id}")
        else:
            print("❌ Failed to get project ID from response")
            return False
        
        # Test get specific project
        success, _ = self.run_test("Get project", "GET", f"projects/{self.project_id}", 200)
        
        # Test list projects (should have one now)
        success, projects = self.run_test("List projects (with data)", "GET", "projects", 200)
        
        # Test update project
        update_data = {
            "description": "Updated test project description"
        }
        success, _ = self.run_test("Update project", "PATCH", f"projects/{self.project_id}", 200, update_data)
        
        return success

    def test_states_crud(self):
        """Test atmospheric states CRUD operations"""
        print("\n=== STATES CRUD TESTS ===")
        
        if not self.project_id:
            print("❌ No project ID available for states testing")
            return False
        
        # Test list states (empty initially)
        success, _ = self.run_test("List states (empty)", "GET", f"projects/{self.project_id}/states", 200)
        
        # Test create state
        state_data = {
            "name": "Test Serene State",
            "description": "A calm test state",
            "mood_tags": ["calm", "peaceful"],
            "weight": 1.5,
            "time_condition": "always",
            "is_ephemeral": False,
            "visual": {
                "transition_type": "crossfade",
                "transition_duration_ms": 3000,
                "max_entropy": 0.5,
                "opacity": 1.0
            },
            "audio": {
                "playlist_mode": "weighted-random",
                "initial_volume": 0.7,
                "adaptive_softening": True
            },
            "tempo": {
                "transition_pacing_seconds": 20,
                "time_of_day_modifier": True,
                "night_pacing_multiplier": 1.5
            }
        }
        success, state = self.run_test("Create state", "POST", f"projects/{self.project_id}/states", 201, state_data)
        if success and 'id' in state:
            self.state_id = state['id']
            print(f"   Created state ID: {self.state_id}")
        else:
            print("❌ Failed to get state ID from response")
            return False
        
        # Test list states (should have one now)
        success, _ = self.run_test("List states (with data)", "GET", f"projects/{self.project_id}/states", 200)
        
        # Test get specific state
        success, _ = self.run_test("Get state", "GET", f"projects/{self.project_id}/states/{self.state_id}", 200)
        
        # Test update state
        update_state_data = {
            "name": "Updated Test State",
            "description": "Updated description",
            "mood_tags": ["calm", "updated"],
            "weight": 2.0
        }
        success, _ = self.run_test("Update state", "PUT", f"projects/{self.project_id}/states/{self.state_id}", 200, update_state_data)
        
        return success

    def test_variations_crud(self):
        """Test variations CRUD operations"""
        print("\n=== VARIATIONS CRUD TESTS ===")
        
        if not self.project_id:
            print("❌ No project ID available for variations testing")
            return False
        
        # Test list variations (empty initially)
        success, _ = self.run_test("List variations (empty)", "GET", f"projects/{self.project_id}/variations", 200)
        
        # Test create variation
        variation_data = {
            "name": "Test Nocturnal Variation",
            "description": "A test variation for night mode",
            "seed": {
                "mood_bias": -0.3,
                "pacing_bias": -0.5,
                "scarcity_bias": 0.2,
                "entropy_bias": 0.1
            },
            "transition_duration_modifier": 1.5,
            "audio_spacing_modifier": 1.2,
            "blend_mode_sequence": ["normal", "multiply", "overlay"]
        }
        success, variation = self.run_test("Create variation", "POST", f"projects/{self.project_id}/variations", 201, variation_data)
        if success and 'id' in variation:
            self.variation_id = variation['id']
            print(f"   Created variation ID: {self.variation_id}")
        else:
            print("❌ Failed to get variation ID from response")
            return False
        
        # Test list variations (should have one now)
        success, _ = self.run_test("List variations (with data)", "GET", f"projects/{self.project_id}/variations", 200)
        
        return success

    def test_export_functionality(self):
        """Test export functionality"""
        print("\n=== EXPORT TESTS ===")
        
        if not self.project_id:
            print("❌ No project ID available for export testing")
            return False
        
        # Test export project
        export_data = {
            "format": "static-bundle",
            "include_service_worker": True,
            "include_telemetry": False,
            "minify": True,
            "generate_icons": True,
            "variation_id": self.variation_id
        }
        success, export_result = self.run_test("Export project", "POST", f"projects/{self.project_id}/export", 200, export_data)
        if success and 'id' in export_result:
            self.export_id = export_result['id']
            print(f"   Created export ID: {self.export_id}")
        else:
            print("❌ Failed to get export ID from response")
            return False
        
        # Test get export scaffold
        success, _ = self.run_test("Get export scaffold", "GET", f"exports/{self.export_id}/scaffold", 200)
        
        return success

    def test_templates(self):
        """Test template functionality"""
        print("\n=== TEMPLATE TESTS ===")
        
        # Test list templates (might be empty)
        success, _ = self.run_test("List templates", "GET", "templates", 200)
        
        # Test seed base template
        success, _ = self.run_test("Seed base template", "POST", "templates/seed", 200)
        
        # Test list templates again (should have base template now)
        success, _ = self.run_test("List templates (with base)", "GET", "templates", 200)
        
        return success

    def test_project_forking(self):
        """Test project forking functionality"""
        print("\n=== PROJECT FORKING TESTS ===")
        
        if not self.project_id:
            print("❌ No project ID available for forking testing")
            return False
        
        # Test fork project
        fork_data = {
            "name": f"Forked Project {datetime.now().strftime('%H%M%S')}",
            "description": "A forked test project",
            "fork_from_id": self.project_id
        }
        success, forked_project = self.run_test("Fork project", "POST", "projects", 201, fork_data)
        if success and 'id' in forked_project:
            forked_id = forked_project['id']
            print(f"   Created forked project ID: {forked_id}")
            
            # Test that forked project has the same states
            success, _ = self.run_test("List forked project states", "GET", f"projects/{forked_id}/states", 200)
        
        return success

    def test_error_cases(self):
        """Test error handling"""
        print("\n=== ERROR HANDLING TESTS ===")
        
        # Test get non-existent project
        success, _ = self.run_test("Get non-existent project", "GET", "projects/non-existent-id", 404)
        
        # Test create project with missing name
        success, _ = self.run_test("Create project (missing name)", "POST", "projects", 422, {})
        
        # Test get non-existent state
        if self.project_id:
            success, _ = self.run_test("Get non-existent state", "GET", f"projects/{self.project_id}/states/non-existent", 404)
        
        return True  # Error tests are expected to fail in specific ways

    def cleanup(self):
        """Clean up test data"""
        print("\n=== CLEANUP ===")
        
        # Delete variation
        if self.project_id and self.variation_id:
            success, _ = self.run_test("Delete variation", "DELETE", f"projects/{self.project_id}/variations/{self.variation_id}", 204)
        
        # Delete state
        if self.project_id and self.state_id:
            success, _ = self.run_test("Delete state", "DELETE", f"projects/{self.project_id}/states/{self.state_id}", 204)
        
        # Delete project
        if self.project_id:
            success, _ = self.run_test("Delete project", "DELETE", f"projects/{self.project_id}", 204)

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Project Chimera API Tests")
        print(f"Base URL: {self.base_url}")
        
        # Run test suites
        tests = [
            self.test_health_check,
            self.test_project_crud,
            self.test_states_crud,
            self.test_variations_crud,
            self.test_export_functionality,
            self.test_templates,
            self.test_project_forking,
            self.test_error_cases
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ Test suite failed with error: {str(e)}")
        
        # Cleanup
        self.cleanup()
        
        # Print results
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = ChimeraAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())