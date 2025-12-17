#!/usr/bin/env python
"""
Quick verification script to test backend without database dependencies.
Run this to ensure all imports work and basic functionality is intact.
"""

import sys
sys.path.insert(0, '/backend')

print("=" * 60)
print("DataNiaga Backend - Database Removal Verification")
print("=" * 60)

# Test 1: Import FastAPI modules
print("\n[1/5] Testing FastAPI imports...")
try:
    from fastapi import FastAPI, UploadFile, File, HTTPException, Query
    from fastapi.middleware.cors import CORSMiddleware
    print("✅ FastAPI imports OK")
except Exception as e:
    print(f"❌ FastAPI import failed: {e}")
    sys.exit(1)

# Test 2: Verify NO database imports
print("\n[2/5] Verifying database imports are REMOVED...")
try:
    import main
    
    # Check that database module is NOT imported
    if hasattr(main, 'engine'):
        print("❌ FAIL: database.engine still exists in main.py")
        sys.exit(1)
    if hasattr(main, 'get_db'):
        print("❌ FAIL: get_db still exists in main.py")
        sys.exit(1)
    if hasattr(main, 'Base'):
        print("❌ FAIL: Base still exists in main.py")
        sys.exit(1)
    if hasattr(main, 'Forecast'):
        print("❌ FAIL: Forecast model still exists")
        sys.exit(1)
    
    print("✅ No database imports found (correct)")
except Exception as e:
    print(f"❌ Failed: {e}")
    sys.exit(1)

# Test 3: Verify in-memory data store exists
print("\n[3/5] Verifying in-memory data store...")
try:
    if not hasattr(main, 'data_store'):
        print("❌ FAIL: data_store not found in main.py")
        sys.exit(1)
    
    data_store = main.data_store
    required_keys = {"transactions", "forecasts", "mba_rules", "recommendations", "model_metrics", "user", "metadata"}
    if not required_keys.issubset(set(data_store.keys())):
        print(f"❌ FAIL: Missing keys in data_store")
        sys.exit(1)
    
    print(f"✅ In-memory data store OK with keys: {list(data_store.keys())}")
except Exception as e:
    print(f"❌ Failed: {e}")
    sys.exit(1)

# Test 4: Import schemas
print("\n[4/5] Testing schemas imports...")
try:
    from schemas import (
        UserCreate, UserResponse, ForecastResponse, MBARuleResponse, 
        RecommendationResponse, DashboardSummary, UploadResponse
    )
    print("✅ Schemas imports OK")
except Exception as e:
    print(f"❌ Schemas import failed: {e}")
    sys.exit(1)

# Test 5: Import services
print("\n[5/5] Testing ML services imports...")
try:
    from services.forecasting import run_all_forecasts
    from services.mba import run_all_mba
    from services.recommendations import generate_recommendations
    print("✅ ML services imports OK")
except Exception as e:
    print(f"❌ Services import failed: {e}")
    sys.exit(1)

# Summary
print("\n" + "=" * 60)
print("✅ ALL CHECKS PASSED!")
print("=" * 60)
print("\nSummary:")
print("  • No SQLAlchemy/database dependencies")
print("  • In-memory data store configured")
print("  • All schemas and services available")
print("  • Ready for deployment")
print("\nNext steps:")
print("  1. Install requirements: pip install -r requirements.txt")
print("  2. Run backend: python -m uvicorn main:app --reload")
print("  3. Test endpoints at http://localhost:8000/docs")

