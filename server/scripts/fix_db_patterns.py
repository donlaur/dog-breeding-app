#!/usr/bin/env python3
"""
Script to automatically fix database pattern violations.
"""

import os
import re
import sys
import argparse
from typing import List, Dict, Any, Tuple

def get_python_files(directory: str) -> List[str]:
    """Get all Python files in the given directory recursively."""
    python_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                python_files.append(os.path.join(root, file))
    return python_files

def fix_file(file_path: str, dry_run: bool = False) -> Tuple[bool, Dict[str, Any]]:
    """Fix database pattern violations in a file."""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Fix find_by_field_values calls without a second parameter
    fixed_content = re.sub(
        r'(db\.find_by_field_values\s*\(\s*["\'](\w+)["\'])(\s*\))',
        r'\1, {}\3',
        content
    )
    
    changes_made = content != fixed_content
    
    if changes_made and not dry_run:
        with open(file_path, 'w') as f:
            f.write(fixed_content)
    
    return changes_made, {
        'file': file_path,
        'changes': changes_made
    }

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Fix database pattern violations")
    parser.add_argument("--dir", default=".", help="Directory to process")
    parser.add_argument("--dry-run", action="store_true", help="Don't modify files, just report what would be changed")
    args = parser.parse_args()
    
    files = get_python_files(args.dir)
    fixed_files = []
    
    for file_path in files:
        changes_made, result = fix_file(file_path, args.dry_run)
        if changes_made:
            fixed_files.append(result)
    
    if args.dry_run:
        print(f"Would fix {len(fixed_files)} files:")
    else:
        print(f"Fixed {len(fixed_files)} files:")
    
    for result in fixed_files:
        print(f"  - {result['file']}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
