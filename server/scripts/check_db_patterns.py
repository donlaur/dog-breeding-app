#!/usr/bin/env python3
"""
Script to check for database query pattern violations in the codebase.
This script analyzes Python files in the server directory to ensure they follow
the established database query patterns.
"""

import os
import re
import sys
import argparse
from typing import List, Dict, Tuple

# Define the patterns to look for
PATTERNS = {
    "find_instead_of_find_by_field_values": {
        "pattern": r"\.find\s*\(\s*['\"](\w+)['\"]",
        "message": "Using db.find() instead of db.find_by_field_values(). "
                  "Please use find_by_field_values() for retrieving multiple records.",
        "severity": "ERROR"
    },
    "find_by_field_values_without_filters": {
        "pattern": r"\.find_by_field_values\s*\(\s*['\"](\w+)['\"][ \t]*\)",
        "message": "Using db.find_by_field_values() without a filters parameter. "
                  "Please provide an empty dictionary {} for no filters.",
        "severity": "ERROR"
    },
    "dogs_instead_of_puppies_for_litter": {
        "pattern": r"\.find_by_field_values\s*\(\s*['\"]dogs['\"].*?['\"]litter_id['\"]",
        "message": "Querying 'dogs' table with litter_id. "
                  "Please use the 'puppies' table for litter-related queries.",
        "severity": "ERROR"
    },
    "missing_error_handling": {
        "pattern": r"\.get\s*\(\s*['\"](\w+)['\"].*?\)",
        "not_followed_by": r"if\s+not\s+\w+:|if\s+\w+\s+is\s+None:|return\s+.*?404|abort\s*\(\s*404\s*\)",
        "message": "Missing error handling after db.get(). "
                  "Please check if the record exists and return a 404 if not found.",
        "severity": "WARNING",
        "context_lines": 5
    }
}

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Check for database query pattern violations")
    parser.add_argument("--dir", default="../", help="Directory to scan (default: ../)")
    parser.add_argument("--fix", action="store_true", help="Attempt to fix issues automatically")
    parser.add_argument("--verbose", action="store_true", help="Show more detailed output")
    parser.add_argument("--exit-on-error", action="store_true", help="Exit with non-zero code if errors are found")
    return parser.parse_args()

def find_python_files(directory: str) -> List[str]:
    """Find all Python files in the given directory recursively."""
    python_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                python_files.append(os.path.join(root, file))
    return python_files

def check_file(file_path: str, patterns: Dict) -> List[Dict]:
    """Check a file for pattern violations."""
    with open(file_path, "r") as f:
        content = f.read()
        lines = content.split("\n")
    
    violations = []
    
    for pattern_name, pattern_info in patterns.items():
        regex = re.compile(pattern_info["pattern"])
        
        for i, line in enumerate(lines):
            match = regex.search(line)
            if match:
                # Check if this is a false positive
                if "not_followed_by" in pattern_info:
                    # Look ahead for the required pattern
                    context_lines = pattern_info.get("context_lines", 3)
                    context = "\n".join(lines[i:min(i + context_lines, len(lines))])
                    not_followed_by_regex = re.compile(pattern_info["not_followed_by"])
                    if not_followed_by_regex.search(context):
                        # The required pattern was found, so this is not a violation
                        continue
                
                violations.append({
                    "file": file_path,
                    "line": i + 1,
                    "pattern": pattern_name,
                    "message": pattern_info["message"],
                    "severity": pattern_info["severity"],
                    "content": line.strip()
                })
    
    return violations

def suggest_fix(violation: Dict) -> Tuple[bool, str]:
    """Suggest a fix for the violation."""
    pattern_name = violation["pattern"]
    content = violation["content"]
    
    if pattern_name == "find_instead_of_find_by_field_values":
        # Replace db.find with db.find_by_field_values
        fixed = re.sub(r"\.find\s*\(", ".find_by_field_values(", content)
        return True, fixed
    
    elif pattern_name == "find_by_field_values_without_filters":
        # Add an empty dictionary as the filters parameter
        fixed = re.sub(r"\.find_by_field_values\s*\(\s*['\"](\w+)['\"][ \t]*\)", r".find_by_field_values('\1', {})", content)
        return True, fixed
    
    elif pattern_name == "dogs_instead_of_puppies_for_litter":
        # Replace "dogs" with "puppies" in the query
        fixed = re.sub(r"['\"]dogs['\"]", '"puppies"', content)
        return True, fixed
    
    # No automatic fix available
    return False, content

def fix_violation(file_path: str, violation: Dict) -> bool:
    """Fix a violation in the file."""
    can_fix, fixed_line = suggest_fix(violation)
    if not can_fix:
        return False
    
    with open(file_path, "r") as f:
        lines = f.readlines()
    
    # Replace the line with the fixed version
    lines[violation["line"] - 1] = fixed_line + "\n"
    
    with open(file_path, "w") as f:
        f.writelines(lines)
    
    return True

def main():
    """Main function."""
    args = parse_args()
    
    # Find all Python files
    python_files = find_python_files(args.dir)
    
    # Check each file
    all_violations = []
    for file in python_files:
        violations = check_file(file, PATTERNS)
        all_violations.extend(violations)
    
    # Sort violations by file and line
    all_violations.sort(key=lambda v: (v["file"], v["line"]))
    
    # Print violations
    error_count = 0
    warning_count = 0
    fixed_count = 0
    
    for violation in all_violations:
        severity = violation["severity"]
        if severity == "ERROR":
            error_count += 1
        else:
            warning_count += 1
        
        print(f"{violation['file']}:{violation['line']} - {severity}: {violation['message']}")
        if args.verbose:
            print(f"  {violation['content']}")
        
        if args.fix:
            if fix_violation(violation["file"], violation):
                print(f"  Fixed automatically")
                fixed_count += 1
            else:
                print(f"  Could not fix automatically")
    
    # Print summary
    print(f"\nFound {error_count} errors and {warning_count} warnings in {len(python_files)} files.")
    if args.fix:
        print(f"Fixed {fixed_count} issues automatically.")
    
    # Return non-zero exit code if errors are found and exit-on-error flag is set
    if args.exit_on_error and error_count > 0:
        return 1

    # Return non-zero exit code if there are errors
    if error_count > 0:
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
