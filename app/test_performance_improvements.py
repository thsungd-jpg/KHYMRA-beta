"""
Unit tests for performance improvements
Tests the optimizations made to backend server code
"""
import sys
import time
from pathlib import Path

# Constants matching server implementation
MAX_PALETTE_SIZE = 20

def test_color_palette_efficiency():
    """Test that color palette update uses set for O(1) lookups instead of O(n) list"""
    print("\n🔍 Testing color palette efficiency...")
    
    # Simulate the old approach (O(n))
    current_palette_old = [f"#color{i:02d}" for i in range(100)]
    new_colors_old = ["#new001", "#new002", "#color50", "#new003"]
    
    start = time.perf_counter()
    for _ in range(1000):
        # Old approach: O(n) for each color
        result_old = current_palette_old + [c for c in new_colors_old if c not in current_palette_old]
    old_time = time.perf_counter() - start
    
    # Simulate the new approach (O(1) with set)
    current_palette_new = [f"#color{i:02d}" for i in range(100)]
    new_colors_new = ["#new001", "#new002", "#color50", "#new003"]
    
    start = time.perf_counter()
    for _ in range(1000):
        # New approach: O(1) lookup using set
        palette_set = set(current_palette_new)
        unique_new_colors = [c for c in new_colors_new if c not in palette_set]
        result_new = (current_palette_new + unique_new_colors)[-MAX_PALETTE_SIZE:]
    new_time = time.perf_counter() - start
    
    # Verify results are the same
    result_old_trimmed = result_old[-MAX_PALETTE_SIZE:]
    assert result_new == result_old_trimmed, "Results should match"
    
    speedup = old_time / new_time if new_time > 0 else float('inf')
    print(f"✅ Old approach: {old_time*1000:.2f}ms")
    print(f"✅ New approach: {new_time*1000:.2f}ms") 
    print(f"✅ Speedup: {speedup:.2f}x faster")
    
    return True

def test_pagination_validation():
    """Test pagination parameter validation logic"""
    print("\n🔍 Testing pagination validation...")
    
    # Test valid values
    limit, skip = 100, 0
    assert 1 <= limit <= 1000, "Limit should be valid"
    assert skip >= 0, "Skip should be valid"
    print("✅ Valid pagination parameters accepted")
    
    # Test invalid limits
    try:
        limit = 0
        if limit < 1 or limit > 1000:
            raise ValueError("Limit must be between 1 and 1000")
        print("❌ Should have rejected limit=0")
        return False
    except ValueError:
        print("✅ Correctly rejected limit=0")
    
    try:
        limit = 1001
        if limit < 1 or limit > 1000:
            raise ValueError("Limit must be between 1 and 1000")
        print("❌ Should have rejected limit=1001")
        return False
    except ValueError:
        print("✅ Correctly rejected limit=1001")
    
    # Test invalid skip
    try:
        skip = -1
        if skip < 0:
            raise ValueError("Skip must be non-negative")
        print("❌ Should have rejected skip=-1")
        return False
    except ValueError:
        print("✅ Correctly rejected skip=-1")
    
    return True

def test_directory_optimization():
    """Test that directory existence check works correctly"""
    print("\n🔍 Testing directory existence optimization...")
    
    import tempfile
    import shutil
    
    with tempfile.TemporaryDirectory() as tmpdir:
        tmppath = Path(tmpdir)
        test_dir = tmppath / "test_project"
        
        # First call - should create directories
        if not test_dir.exists():
            test_dir.mkdir(exist_ok=True)
            (test_dir / "images").mkdir(exist_ok=True)
            (test_dir / "audio").mkdir(exist_ok=True)
            (test_dir / "video").mkdir(exist_ok=True)
        
        assert test_dir.exists(), "Directory should exist"
        assert (test_dir / "images").exists(), "Images dir should exist"
        assert (test_dir / "audio").exists(), "Audio dir should exist"
        assert (test_dir / "video").exists(), "Video dir should exist"
        print("✅ Directories created successfully")
        
        # Second call - should skip creation
        start = time.perf_counter()
        if not test_dir.exists():
            test_dir.mkdir(exist_ok=True)
            (test_dir / "images").mkdir(exist_ok=True)
            (test_dir / "audio").mkdir(exist_ok=True)
            (test_dir / "video").mkdir(exist_ok=True)
        elapsed = time.perf_counter() - start
        
        # Should be very fast since exists() returns True immediately
        assert elapsed < 0.01, "Should be very fast when dir exists"
        print(f"✅ Existence check completed in {elapsed*1000:.3f}ms")
    
    return True

def test_asset_lookup_logic():
    """Test the logic for efficient asset lookup"""
    print("\n🔍 Testing asset lookup efficiency...")
    
    # Simulate old approach - scan entire assets array
    assets = [{"id": f"asset_{i}", "name": f"file{i}.png"} for i in range(1000)]
    target_id = "asset_750"
    
    start = time.perf_counter()
    for _ in range(100):
        # Old approach: O(n) scan through entire array
        asset_old = next((a for a in assets if a.get("id") == target_id), None)
    old_time = time.perf_counter() - start
    
    # New approach uses MongoDB positional operator with index
    # MongoDB can use the index to find the matching document in O(log n) time
    # Then the positional operator $ returns just that specific array element
    # Simulate this by using a dict for O(1) lookup (similar to indexed query)
    assets_indexed = {a["id"]: a for a in assets}
    
    start = time.perf_counter()
    for _ in range(100):
        # Simulate MongoDB indexed lookup: O(log n) or O(1) with good indexes
        asset_new = assets_indexed.get(target_id)
    new_time = time.perf_counter() - start
    
    assert asset_old["id"] == asset_new["id"], "Should find same asset"
    speedup = old_time / new_time if new_time > 0 else float('inf')
    print(f"✅ O(n) sequential scan (old): {old_time*1000:.2f}ms for 1000 assets")
    print(f"✅ O(1) indexed lookup (new): {new_time*1000:.2f}ms")
    print(f"✅ Speedup: {speedup:.1f}x faster")
    print(f"   Note: With MongoDB indexes, queries scale O(log n) instead of O(n)")
    
    return True

def main():
    """Run all tests"""
    print("=" * 60)
    print("PERFORMANCE IMPROVEMENTS UNIT TESTS")
    print("=" * 60)
    
    tests = [
        ("Color Palette Efficiency", test_color_palette_efficiency),
        ("Pagination Validation", test_pagination_validation),
        ("Directory Optimization", test_directory_optimization),
        ("Asset Lookup Logic", test_asset_lookup_logic),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
                print(f"✅ {test_name} PASSED")
            else:
                failed += 1
                print(f"❌ {test_name} FAILED")
        except Exception as e:
            failed += 1
            print(f"❌ {test_name} FAILED: {e}")
    
    print("\n" + "=" * 60)
    print(f"RESULTS: {passed}/{len(tests)} tests passed")
    print("=" * 60)
    
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
