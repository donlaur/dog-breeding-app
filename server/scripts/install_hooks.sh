#!/bin/bash
# Script to install git hooks

echo "Installing pre-commit hook..."
cp server/scripts/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
echo "Pre-commit hook installed successfully!"

echo ""
echo "This hook will check for database query pattern violations before each commit."
echo "It ensures that:"
echo "- find_by_field_values() is used for retrieving multiple records, not find()"
echo "- get() is used for retrieving single records by ID"
echo "- puppies table is used for litter-related queries, not dogs table"
echo "- proper error handling is in place"
echo ""
echo "To skip the hook in exceptional cases, use: git commit --no-verify"
