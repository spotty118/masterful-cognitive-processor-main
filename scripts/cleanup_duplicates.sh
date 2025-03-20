#!/bin/bash

# Make scripts executable
chmod +x find_duplicates.py remove_duplicates.py

# Step 1: Find duplicates first
echo "=== Scanning for duplicate files ==="
./find_duplicates.py ..

# Step 2: Show what would be removed (dry run)
echo
echo "=== Dry run of duplicate removal ==="
./remove_duplicates.py .. --strategy keep_shortest_path

# Ask for confirmation
echo
read -p "Do you want to proceed with removing duplicates? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "=== Removing duplicates ==="
    ./remove_duplicates.py .. --strategy keep_shortest_path --no-dry-run
    
    echo
    echo "Duplicate files have been removed."
    echo "If you encounter any issues, you may need to update import paths in your code."
else
    echo "Operation canceled."
fi
