#!/usr/bin/env python3
"""
Database consistency check script.
This script enforces consistent database usage patterns across the application.
"""

import inspect
import importlib
import os
import sys
import re
from typing import List, Dict, Any, Set, Tuple

def get_python_files(directory: str) -> List[str]:
    """Get all Python files in the given directory recursively."""
    python_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                python_files.append(os.path.join(root, file))
    return python_files

def analyze_file(file_path: str) -> Dict[str, Any]:
    """Analyze a Python file for database function calls."""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Check for db.find_by_field_values calls without a second parameter
    find_by_field_values_pattern = r'db\.find_by_field_values\s*\(\s*["\'](\w+)["\'](?!\s*,)'
    incorrect_calls = re.findall(find_by_field_values_pattern, content)
    
    # Check for direct database access without using the db interface
    direct_db_access_pattern = r'supabase\.table\('
    direct_db_calls = re.findall(direct_db_access_pattern, content)
    
    return {
        'file': file_path,
        'incorrect_find_by_field_values': incorrect_calls,
        'direct_db_access': len(direct_db_calls) > 0
    }

def check_database_consistency(directory: str = '.') -> Tuple[bool, List[Dict[str, Any]]]:
    """Check database consistency across the application."""
    files = get_python_files(directory)
    issues = []
    
    for file_path in files:
        analysis = analyze_file(file_path)
        
        if analysis['incorrect_find_by_field_values'] or analysis['direct_db_access']:
            issues.append(analysis)
    
    return len(issues) == 0, issues

def print_report(issues: List[Dict[str, Any]]):
    """Print a report of database consistency issues."""
    if not issues:
        print("✅ No database consistency issues found!")
        return
    
    print(f"❌ Found {len(issues)} files with database consistency issues:")
    
    for issue in issues:
        print(f"\n📄 {issue['file']}:")
        
        if issue['incorrect_find_by_field_values']:
            tables = ", ".join(issue['incorrect_find_by_field_values'])
            print(f"  - Missing filters parameter in find_by_field_values for tables: {tables}")
        
        if issue['direct_db_access']:
            print("  - Direct database access without using the DatabaseInterface")
    
    print("\nRecommendation: Follow the database patterns defined in docs/architecture/database_patterns.md")

def main():
    """Main function."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Check database consistency across the application")
    parser.add_argument("--dir", default=".", help="Directory to check")
    parser.add_argument("--strict", action="store_true", help="Exit with error code if issues are found")
    args = parser.parse_args()
    
    consistent, issues = check_database_consistency(args.dir)
    print_report(issues)
    
    if not consistent and args.strict:
        sys.exit(1)
    
    sys.exit(0)

if __name__ == "__main__":
    main()
