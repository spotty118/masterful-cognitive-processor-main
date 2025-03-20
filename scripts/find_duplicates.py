#!/usr/bin/env python3
import os
import hashlib
from collections import defaultdict
import argparse

def get_file_hash(filepath):
    """Calculate MD5 hash of file content"""
    hash_md5 = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def find_duplicates(directory, exclude_dirs=None):
    """Find duplicate files in the specified directory"""
    if exclude_dirs is None:
        exclude_dirs = ['.git', 'node_modules', '__pycache__']
    
    hash_dict = defaultdict(list)
    file_count = 0
    
    print(f"Scanning directory: {directory}")
    
    for root, dirs, files in os.walk(directory):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for filename in files:
            filepath = os.path.join(root, filename)
            try:
                file_hash = get_file_hash(filepath)
                hash_dict[file_hash].append(filepath)
                file_count += 1
            except (IOError, PermissionError) as e:
                print(f"Error accessing {filepath}: {e}")
    
    # Find duplicates
    duplicates = {file_hash: paths for file_hash, paths in hash_dict.items() if len(paths) > 1}
    
    print(f"\nScanned {file_count} files.")
    
    if not duplicates:
        print("No duplicate files found.")
        return
    
    print(f"\nFound {len(duplicates)} sets of duplicate files:\n")
    
    for file_hash, paths in duplicates.items():
        print(f"Duplicate set (hash: {file_hash}):")
        for path in paths:
            print(f"  {path}")
        print()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Find duplicate files in a directory')
    parser.add_argument('directory', nargs='?', default='.', help='Directory to scan (default: current directory)')
    parser.add_argument('--exclude', nargs='+', help='Directories to exclude')
    args = parser.parse_args()
    
    exclude_dirs = ['.git', 'node_modules', '__pycache__']
    if args.exclude:
        exclude_dirs.extend(args.exclude)
    
    find_duplicates(args.directory, exclude_dirs)
